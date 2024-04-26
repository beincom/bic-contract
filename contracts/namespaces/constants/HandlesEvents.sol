// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.23;

library HandlesEvents {
    event HandleMinted(string handle, string namespace, uint256 handleId, address to, uint256 timestamp);

    /**
     * @dev Emitted when a collection's token URI is updated.
     * @param fromTokenId The ID of the smallest token that requires its token URI to be refreshed.
     * @param toTokenId The ID of the biggest token that requires its token URI to be refreshed. Max uint256 to refresh
     * all of them.
     */
    event BatchMetadataUpdate(uint256 fromTokenId, uint256 toTokenId);
}
