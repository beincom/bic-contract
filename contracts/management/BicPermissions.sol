// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

/**
 * @title BicPermissions
 * @notice a contract that manages permissions for the BIC system.
 * @dev the contract uses the AccessControlEnumerable contract from OpenZeppelin.
 */
contract BicPermissions is AccessControlEnumerable {
    /// @notice the role that can recover the contract.Using this on BicAccount
    bytes32 public constant RECOVERY_ROLE = keccak256("RECOVERY_ROLE");
    /// @notice the role that can operate the contract. Using this role on HandlesController, HandlesTokenURI and BicAccount
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    constructor() {
        // Default Admin, Recovery role
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(RECOVERY_ROLE, msg.sender);
        _setupRole(OPERATOR_ROLE, msg.sender);
    }


}
