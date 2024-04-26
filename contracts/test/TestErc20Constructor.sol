// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract TestErc20Constructor is ERC20Upgradeable {
    address public immutable contractName; // cannot using with string because non-value type is not allowed in storage
    // if not set immutable then it will different with the original contract
    constructor() {
        contractName = 0xE8AFce87993Bd475FAf2AeA62e0B008Dc27Ab81A;
    }

    function initialize(string memory name, string memory symbol) public initializer {
        ERC20Upgradeable.__ERC20_init(name, symbol);
        _mint(msg.sender, 1_000_000 * 10 ** 18);
    }
}
