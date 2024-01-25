// SPDX-License-Identifier: MIT

pragma solidity ^0.8.23;

interface IHandleTokenURI {
    function getTokenURI(
        uint256 tokenId,
        string memory localName,
        string memory namespace
    ) external view returns (string memory);
}
