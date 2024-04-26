// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@account-abstraction/contracts/core/BasePaymaster.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@account-abstraction/contracts/samples/IOracle.sol";

/**
 * @title VerifyingTokenPayAfterPaymaster
 * @notice a paymaster that verifies a signature over the UserOperation, and pays the gas with the user's tokens.
 * @dev the signature is over the UserOperation, except the paymasterAndData, which contains the signature itself.
 * @dev the signature is over the hash of the UserOperation, the chainId, the paymaster address, the sender nonce, the token, the validUntil and the validAfter.
 * @dev the signature is verified by the verifyingSigner.
 * @dev the gas cost is paid by the user's tokens, using the token oracle.
 */
contract VerifyingTokenPayAfterPaymaster is BasePaymaster {
    /// calculated cost of the postOp
    uint256 constant public COST_OF_POST = 15000;

    using ECDSA for bytes32;
    using UserOperationLib for UserOperation;

    /// the signer to verify the signature.
    address public immutable verifyingSigner;

    /// the offset of the token in the paymasterAndData field.
    uint256 private constant TOKEN_OFFSET = 20;

    /// the offset of the validUntil and validAfter in the paymasterAndData field.
    uint256 private constant VALID_TIMESTAMP_OFFSET = 40;

    /// the offset of the signature in the paymasterAndData field.
    uint256 private constant SIGNATURE_OFFSET = 104;

    /**
     * @param _entryPoint the entry point contract to use.
     * @param _verifyingSigner the signer to verify the signature.
     */
    constructor(IEntryPoint _entryPoint, address _verifyingSigner) BasePaymaster(_entryPoint) {
        verifyingSigner = _verifyingSigner;
    }

    /// the nonce of the sender.
    mapping(address => uint256) public senderNonce;
    /// the oracles to use for token exchange rate.
    mapping(address => IOracle) public oracles;

    /**
     * @notice pack the UserOperation, except the paymasterAndData.
     * this is a lighter encoding than the UserOperation.hash() method, and is used to sign the request.
     * @param userOp the UserOperation to pack.
     * @return ret the packed UserOperation.
     */
    function pack(UserOperation calldata userOp) internal pure returns (bytes memory ret) {
        // lighter signature scheme. must match UserOp.ts#packUserOp
        bytes calldata pnd = userOp.paymasterAndData;
        // copy directly the userOp from calldata up to (but not including) the paymasterAndData.
        // this encoding depends on the ABI encoding of calldata, but is much lighter to copy
        // than referencing each field separately.
        assembly {
            let ofs := userOp
            let len := sub(sub(pnd.offset, ofs), 32)
            ret := mload(0x40)
            mstore(0x40, add(ret, add(len, 32)))
            mstore(ret, len)
            calldatacopy(add(ret, 32), ofs, len)
        }
    }

    /**
     * @notice this method is called by the off-chain service, to sign the request.
     * @dev it is called on-chain from the validatePaymasterUserOp, to validate the signature.
     * @dev note that this signature covers all fields of the UserOperation, except the "paymasterAndData",
     * @dev which will carry the signature itself.
     * @return the hash we're going to sign off-chain (and validate on-chain)
     */
    function getHash(UserOperation calldata userOp, address token, uint48 validUntil, uint48 validAfter)
    public view returns (bytes32) {
        //can't use userOp.hash(), since it contains also the paymasterAndData itself.

        return keccak256(abi.encode(
            pack(userOp),
            block.chainid,
            address(this),
            senderNonce[userOp.getSender()],
            token,
            validUntil,
            validAfter
        ));
    }

    /**
     * @notice verify our external signer signed this request.
     * @dev the "paymasterAndData" is expected to be the paymaster and a signature over the entire request params
     * paymasterAndData[:20] : address(this)
     * paymasterAndData[20:40] : token address
     * paymasterAndData[40:104] : abi.encode(validUntil, validAfter)
     * paymasterAndData[104:] : signature
     * @param userOp the UserOperation to validate.
     * @param requiredPreFund the required pre-fund for the operation.
     * @return context the context to pass to postOp.
     * @return validationData the validation data.
     */
    function _validatePaymasterUserOp(UserOperation calldata userOp, bytes32 /*userOpHash*/, uint256 requiredPreFund)
    internal override returns (bytes memory context, uint256 validationData) {
        (requiredPreFund);

        (address token, uint48 validUntil, uint48 validAfter, bytes calldata signature) = parsePaymasterAndData(userOp.paymasterAndData);
        //ECDSA library supports both 64 and 65-byte long signatures.
        // we only "require" it here so that the revert reason on invalid signature will be of "VerifyingTokenPayAfterPaymaster", and not "ECDSA"
        require(signature.length == 64 || signature.length == 65, "VerifyingTokenPayAfterPaymaster: invalid signature length in paymasterAndData");
        require(address(oracles[token]) != address(0), "VerifyingTokenPayAfterPaymaster: unsupported token");

        bytes32 hash = ECDSA.toEthSignedMessageHash(getHash(userOp, token, validUntil, validAfter));
        address sender = userOp.getSender();
        senderNonce[sender]++;
        //don't revert on signature failure: return SIG_VALIDATION_FAILED
        if (verifyingSigner != ECDSA.recover(hash, signature)) {
            return (abi.encode(sender, token),_packValidationData(true,validUntil,validAfter));
        }
        //no need for other on-chain validation: entire UserOp should have been checked
        // by the external service prior to signing it.
        return (abi.encode(sender, token),_packValidationData(false,validUntil,validAfter));
    }

    /**
     * @notice pay the gas with the user's tokens.
     * @dev we don't really care about the mode, we just pay the gas with the user's tokens.
     * @param mode the mode of the operation.
     * @param context the context to pass to postOp.
     * @param actualGasCost the actual gas cost of the operation.
     */
    function _postOp(PostOpMode mode, bytes calldata context, uint256 actualGasCost) internal override {
        //we don't really care about the mode, we just pay the gas with the user's tokens.
        (mode);
        (address sender, address token) = abi.decode(context, (address, address));
        uint256 charge = oracles[token].getTokenValueOfEth(actualGasCost + COST_OF_POST);
        IERC20(token).transferFrom(sender, address(this), charge);
    }

    /**
     * @notice parse the paymasterAndData field.
     * @param paymasterAndData the paymasterAndData field to parse.
     * @return token adresss of token to use.
     * @return validUntil timestamp.
     * @return validAfter timestamp.
     * @return signature of the request.
     */
    function parsePaymasterAndData(bytes calldata paymasterAndData) public pure returns(address token, uint48 validUntil, uint48 validAfter, bytes calldata signature) {
        token = address(bytes20(paymasterAndData[TOKEN_OFFSET:VALID_TIMESTAMP_OFFSET]));
        (validUntil, validAfter) = abi.decode(paymasterAndData[VALID_TIMESTAMP_OFFSET:SIGNATURE_OFFSET],(uint48, uint48));
        signature = paymasterAndData[SIGNATURE_OFFSET:];
    }

    /**
     * @notice set the oracle for a token.
        * @param token the token to set the oracle for.
        * @param oracle the oracle to set.
        */
    function setOracle(address token, IOracle oracle) public onlyOwner {
        oracles[token] = oracle;
    }

    /**
     * @notice withdraw tokens to a target address.
     * @param token the token to withdraw.
     * @param target the target address to withdraw to.
     * @param amount the amount to withdraw.
     */
    function withdrawTokensTo(IERC20 token, address target, uint256 amount) public onlyOwner {
        token.transfer(target, amount);
    }
}
