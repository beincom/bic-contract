// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "./BicAccount.sol";
import "./../management/BicPermissions.sol";

/**
 * @title A BIC account abstraction factory contract for BicAccount
 * @notice A UserOperations "initCode" holds the address of the factory, and a method call (to createAccount, in this sample factory).
 *
 * The factory's createAccount returns the target account address even if it is already installed.
 *
 * This way, the entryPoint.getSenderAddress() can be called either before or after the account is created.
 */
contract BicAccountFactory {
    /// @notice the account implementation contract
    BicAccount public immutable accountImplementation;
    /// @notice the permissions contract
    BicPermissions public immutable permissions;

    /**
     * @notice BicAccountFactory constructor
     * @param _entryPoint the entryPoint contract
     * @param _permissions the permissions contract
     */
    constructor(IEntryPoint _entryPoint, BicPermissions _permissions) {
        accountImplementation = new BicAccount(_entryPoint);
        permissions = _permissions;
    }

    /**
     * @notice create an account, and return its address.
     * @param owner the owner of the account
     * @param salt the salt to calculate the account address
     * @return ret is the address even if the account is already deployed.
     * @dev Note that during UserOperation execution, this method is called only if the account is not deployed.
     * @dev This method returns an existing account address so that entryPoint.getSenderAddress() would work even after account creation
     */
    function createAccount(address owner,uint256 salt) public returns (BicAccount ret) {
        address addr = getAddress(owner, salt);
        uint codeSize = addr.code.length;
        if (codeSize > 0) {
            return BicAccount(payable(addr));
        }
        ret = BicAccount(payable(new ERC1967Proxy{salt : bytes32(salt)}(
                address(accountImplementation),
                abi.encodeCall(BicAccount.initialize, (owner, permissions))
            )));
    }

    /**
     * @notice calculate the counterfactual address of this account as it would be returned by createAccount()
     * @param owner the owner of the account
     * @param salt the salt to calculate the account address
     * @return the address of the account
     */
    function getAddress(address owner,uint256 salt) public view returns (address) {
        return Create2.computeAddress(bytes32(salt), keccak256(abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(
                    address(accountImplementation),
                    abi.encodeCall(BicAccount.initialize, (owner, permissions))
                )
            )));
    }
}
