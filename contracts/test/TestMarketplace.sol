// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {IMarketplace} from "../marketplace/interfaces/IMarketplace.sol";
import "hardhat/console.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
contract TestMarketplace is IMarketplace {
    uint256 public auctionId;

    function createAuction(IMarketplace.AuctionParameters memory _auctionParams) external returns (uint256 id) {
        IERC721(_auctionParams.assetContract).transferFrom(msg.sender, address(this), _auctionParams.tokenId);
        id = auctionId;
        return auctionId += 1;
    }

    function bidInAuction(uint256 _auctionId, uint256 _bidAmount) external {
        require(_bidAmount > 0, "Marketplace: Bid amount must be greater than 0");
    }

    function collectAuctionPayout(uint256 _auctionId) external {
    }

    function collectAuctionTokens(uint256 _auctionId) external {
    }
}
