// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import {IERC721} from '@openzeppelin/contracts/token/ERC721/IERC721.sol';

interface IMarketplace {
    struct AuctionParameters {
        address assetContract;
        uint256 tokenId;
        uint256 quantity;
        address currency;
        uint256 minimumBidAmount;
        uint256 buyoutBidAmount;
        uint64 timeBufferInSeconds;
        uint64 bidBufferBps;
        uint64 startTimestamp;
        uint64 endTimestamp;
    }

    function createAuction(AuctionParameters calldata _params) external returns (uint256 auctionId);

    enum Status {
        UNSET,
        CREATED,
        COMPLETED,
        CANCELLED
    }

    enum TokenType {
        ERC721,
        ERC1155
    }

    struct Auction {
        uint256 auctionId;
        uint256 tokenId;
        uint256 quantity;
        uint256 minimumBidAmount;
        uint256 buyoutBidAmount;
        uint64 timeBufferInSeconds;
        uint64 bidBufferBps;
        uint64 startTimestamp;
        uint64 endTimestamp;
        address auctionCreator;
        address assetContract;
        address currency;
        TokenType tokenType;
        Status status;
    }


}
