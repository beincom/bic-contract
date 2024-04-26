# Solidity API

## HandlesEvents

### HandleMinted

```solidity
event HandleMinted(string handle, string namespace, uint256 handleId, address to, uint256 timestamp)
```

### BatchMetadataUpdate

```solidity
event BatchMetadataUpdate(uint256 fromTokenId, uint256 toTokenId)
```

_Emitted when a collection's token URI is updated._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| fromTokenId | uint256 | The ID of the smallest token that requires its token URI to be refreshed. |
| toTokenId | uint256 | The ID of the biggest token that requires its token URI to be refreshed. Max uint256 to refresh all of them. |

