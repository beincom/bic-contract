// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

/* solhint-disable avoid-low-level-calls */
/* solhint-disable no-inline-assembly */
/* solhint-disable reason-string */

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@account-abstraction/contracts/core/BaseAccount.sol";
import "@account-abstraction/contracts/samples/callback/TokenCallbackHandler.sol";

import "./../management/BicPermissions.sol";

/**
  * @title account abstraction smart contract BIC version
  * @notice BicAccount is a simple account abstraction contract, with owner and operator roles.
  *
  * The owner can execute transactions, change owner, and deposit/withdraw funds.
  *
  * The operator can execute transactions.
  *
  * The recovery role can change the owner.
  *
  * @dev Based on eth-infinitism SimpleAccount
  */
contract BicAccount is BaseAccount, TokenCallbackHandler, UUPSUpgradeable, Initializable {
    /// @notice the owner of the account (an EOA)
    address public owner;

    /// @notice the permissions contract, using recovery and operator roles
    BicPermissions public permissions;

    /// @notice the entryPoint contract
    IEntryPoint private immutable _entryPoint;

    /*
     * @dev Emitted when the account is initialized
     * @param entryPoint the entryPoint contract
     * @param owner the owner of the account
     */
    event BicAccountInitialized(IEntryPoint indexed entryPoint, address indexed owner);

    /*
     * @dev Emitted when the owner is changed
     * @param oldOwner the old owner of the account
     * @param newOwner the new owner of the account
     */
    event NewOwner(address oldOwner, address newOwner);

    /**
     * @notice Modifier to restrict access to the owner
     */
    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    /// @inheritdoc BaseAccount
    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    /**
     * @notice Create a new account
     * @param anEntryPoint the entryPoint contract
     */
    constructor(IEntryPoint anEntryPoint) {
        _entryPoint = anEntryPoint;
        _disableInitializers();
    }

    /**
     * check if the caller is the owner
     */
    function _onlyOwner() internal view {
        require(msg.sender == owner || msg.sender == address(this), "only owner");
    }

    /**
     * check if the caller is the owner or has the recovery role
     */
    function _onlyOwnerOrHasRecoveryRole() internal view {
        require(msg.sender == owner || permissions.hasRole(permissions.RECOVERY_ROLE(), msg.sender), "only owner or recovery role");
    }

    /**
     * check if the caller is the owner or has the operator role
     */
    function _onlyOwnerOrHasOperatorRole() internal view {
        require(msg.sender == owner || permissions.hasRole(permissions.OPERATOR_ROLE(), msg.sender), "only owner or operator role");
    }

    /**
     * Change owner or recovery the other owner (called directly from owner, or by entryPoint)
     */
    function changeOwner(address _newOwner) external {
        // Require: ower or has recovery role
        _onlyOwnerOrHasRecoveryRole();

        address _oldOwner = owner;
        owner = _newOwner;
        emit NewOwner(_oldOwner, _newOwner);
    }

    /**
     * @notice execute a transaction (called directly from owner, or by entryPoint)
     * @param dest destination address to call
     * @param value the value to pass in this call
     * @param func the calldata to pass in this call
     */
    function execute(address dest, uint256 value, bytes calldata func) external {
        _requireFromEntryPointOrOwner();
        _call(dest, value, func);
    }


    /**
     * @notice execute a sequence of transactions
     * @dev to reduce gas consumption for trivial case (no value), use a zero-length array to mean zero value
     * @param dest an array of destination addresses
     * @param value an array of values to pass to each call. can be zero-length for no-value calls
     * @param func an array of calldata to pass to each call
     */
    function executeBatch(address[] calldata dest, uint256[] calldata value, bytes[] calldata func) external {
        _requireFromEntryPointOrOwner();
        require(dest.length == func.length && (value.length == 0 || value.length == func.length), "wrong array lengths");
        if (value.length == 0) {
            for (uint256 i = 0; i < dest.length; i++) {
                _call(dest[i], 0, func[i]);
            }
        } else {
            for (uint256 i = 0; i < dest.length; i++) {
                _call(dest[i], value[i], func[i]);
            }
        }
    }

    /**
     * @dev The _entryPoint member is immutable, to reduce gas consumption.  To upgrade EntryPoint,
     * a new implementation of SimpleAccount must be deployed with the new EntryPoint address, then upgrading
     * the implementation by calling `upgradeTo()`
     * @param anOwner the owner (signer) of this account
     */
    function initialize(address anOwner, BicPermissions _permissions) public virtual initializer {
        _initialize(anOwner, _permissions);
    }

    function _initialize(address anOwner, BicPermissions _permissions) internal virtual {
        owner = anOwner;
        permissions = _permissions;
        emit BicAccountInitialized(_entryPoint, owner);
    }

    /// Require the function call went through EntryPoint or owner
    function _requireFromEntryPointOrOwner() internal view {
        require(msg.sender == address(entryPoint()) || msg.sender == owner, "account: not Owner or EntryPoint");
    }

    /**
     * @notice Using ECDSA to validate the signature
     * make sure owner signed the operation
     * @param userOp the UserOperation
     * @param userOpHash the hash of the UserOperation
     * @return validationData 0 if the signature is valid else SIG_VALIDATION_FAILED
     */
    function _validateSignature(UserOperation calldata userOp, bytes32 userOpHash)
    internal override virtual returns (uint256 validationData) {
        bytes32 hash = ECDSA.toEthSignedMessageHash(userOpHash);
        if (owner != ECDSA.recover(hash, userOp.signature))
            return SIG_VALIDATION_FAILED;
        return 0;
    }

    /**
     * @notice Call a contract with the given calldata
     * @param target the target contract address
     * @param value the value to send
     * @param data the calldata
     */
    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    /**
     * @notice check current account deposit in the entryPoint
     */
    function getDeposit() public view returns (uint256) {
        return entryPoint().balanceOf(address(this));
    }

    /**
     * @notice deposit more funds for this account in the entryPoint
     */
    function addDeposit() public payable {
        entryPoint().depositTo{value: msg.value}(address(this));
    }

    /**
     * @notice withdraw value from the account's deposit
     * @param withdrawAddress target to send to
     * @param amount to withdraw
     */
    function withdrawDepositTo(address payable withdrawAddress, uint256 amount) public onlyOwner {
        entryPoint().withdrawTo(withdrawAddress, amount);
    }

    /**
     * @notice Upgrade the implementation of the account
     * @param newImplementation the new implementation contract address
     */
    function _authorizeUpgrade(address newImplementation) internal view override {
        (newImplementation);
        _onlyOwnerOrHasOperatorRole();
    }

    /**
     * @notice Version for BicAccount
     */
    function version() external pure virtual returns (uint256) {
        return 1;
    }
}
