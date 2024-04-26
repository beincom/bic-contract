// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {IERC721Upgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';

interface IHandles is IERC721Upgradeable {

    function mintHandle(address to, string calldata localName) external returns (uint256);

    function burn(uint256 tokenId) external;

    function getNamespace() external view returns (string memory);

    function getNamespaceHash() external view returns (bytes32);

    function exists(uint256 tokenId) external view returns (bool);

    function getLocalName(uint256 tokenId) external view returns (string memory);

    function getHandle(uint256 tokenId) external view returns (string memory);

    function getTokenId(string memory localName) external pure returns (uint256);

    function totalSupply() external view returns (uint256);

    function setController(address controller) external;

    function getHandleTokenURIContract() external view returns (address);

    function setHandleTokenURIContract(address handleTokenURIContract) external;
}
