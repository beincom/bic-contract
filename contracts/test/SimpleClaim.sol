// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract SimpleClaim {
    bytes32 public root;
    IERC20 public bic;

    constructor(bytes32 _root, IERC20 _bic) {
        root = _root;
        bic = _bic;
    }

    function claim(bytes32[] calldata proof, uint256 index, uint256 amount) external {
        console.log("sender: %s", msg.sender);
        console.log("amount: %s", amount);
        console.log("index: %s", index);
        require(MerkleProof.verify(proof, root, keccak256(abi.encodePacked(index, msg.sender, amount))), "SimpleClaim: Invalid proof");
        bic.transfer(msg.sender, amount);
    }
}
