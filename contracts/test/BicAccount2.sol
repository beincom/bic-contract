// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {BicAccount} from "../smart-wallet/BicAccount.sol";
import {BicPermissions} from "./../management/BicPermissions.sol";

import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";

contract BicAccount2 is BicAccount {
    constructor(IEntryPoint anEntryPoint) BicAccount(anEntryPoint) {}

    function version() external pure override returns (uint256) {
        return 2;
    }
}
