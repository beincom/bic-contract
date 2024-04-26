// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;
import "@openzeppelin/contracts/access/IAccessControlEnumerable.sol";

interface IBicPermissions is IAccessControlEnumerable {
    function RECOVERY_ROLE() external pure returns (bytes32);

    function OPERATOR_ROLE() external pure returns (bytes32);
}
