# Solidity API

## IHandles

### mintHandle

```solidity
function mintHandle(address to, string localName) external returns (uint256)
```

### burn

```solidity
function burn(uint256 tokenId) external
```

### getNamespace

```solidity
function getNamespace() external view returns (string)
```

### getNamespaceHash

```solidity
function getNamespaceHash() external view returns (bytes32)
```

### exists

```solidity
function exists(uint256 tokenId) external view returns (bool)
```

### getLocalName

```solidity
function getLocalName(uint256 tokenId) external view returns (string)
```

### getHandle

```solidity
function getHandle(uint256 tokenId) external view returns (string)
```

### getTokenId

```solidity
function getTokenId(string localName) external pure returns (uint256)
```

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

### setController

```solidity
function setController(address controller) external
```

### getHandleTokenURIContract

```solidity
function getHandleTokenURIContract() external view returns (address)
```

### setHandleTokenURIContract

```solidity
function setHandleTokenURIContract(address handleTokenURIContract) external
```

