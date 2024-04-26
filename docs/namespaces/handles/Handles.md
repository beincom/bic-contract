# Solidity API

## Handles

_This contract utilizes ERC721Upgradeable for tokenization of handles. Each handle represents a unique identifier within a specified namespace.

Handles are formed by appending a local name to a namespace, separated by "0x40". This contract allows minting and burning of handles, alongside basic management of their attributes.

Designed to be used with a Transparent upgradeable proxy without requiring an initializer._

### CONTROLLER

```solidity
address CONTROLLER
```

Address of the controller with administrative privileges.

### OPERATOR

```solidity
address OPERATOR
```

Address of the operator who can perform certain restricted operations.

### _localNames

```solidity
mapping(uint256 => string) _localNames
```

_Mapping from token ID to the local name of the handle._

### _handleTokenURIContract

```solidity
address _handleTokenURIContract
```

_Address of the contract responsible for generating token URIs._

### onlyOperator

```solidity
modifier onlyOperator()
```

Ensures that the function is called only by the operator.

### onlyController

```solidity
modifier onlyController()
```

Ensures that the function is called only by the controller.

### constructor

```solidity
constructor() public
```

### initialize

```solidity
function initialize(string namespace, string name, string symbol, address operator) public
```

Initializes the contract with the given namespace and ERC721 token details.

_Initializes the contract with the given namespace and ERC721 token details._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| namespace | string | The namespace under which all handles are created. |
| name | string | The name of the ERC721 token. |
| symbol | string | The symbol of the ERC721 token. |
| operator | address | The address of the operator who can perform certain restricted operations. |

### totalSupply

```solidity
function totalSupply() external view virtual returns (uint256)
```

Returns the total supply of minted tokens.

_Returns the total supply of minted tokens._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total supply of minted tokens. |

### setController

```solidity
function setController(address controller) external
```

Sets a new controller address.

_Sets a new controller address for the contract with restricted privileges._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| controller | address | The address of the new controller. |

### setOperator

```solidity
function setOperator(address operator) external
```

Sets a new operator address.

_Sets a new operator address for the contract with restricted privileges._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operator | address | The address of the new operator. |

### setHandleTokenURIContract

```solidity
function setHandleTokenURIContract(address handleTokenURIContract) external
```

Sets the contract address responsible for handle token URI generation.

_Sets the contract address responsible for generating token URIs with restricted privileges._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| handleTokenURIContract | address | The address of the contract responsible for generating token URIs. |

### getHandleTokenURIContract

```solidity
function getHandleTokenURIContract() external view returns (address)
```

Returns the address of the contract generating token URIs.

_Returns the address of the contract responsible for generating token URIs._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | The address of the contract responsible for generating token URIs. |

### tokenURI

```solidity
function tokenURI(uint256 tokenId) public view returns (string)
```

Returns the URI for a token based on its ID.

_Returns the URI for a token based on its ID with required NFT minted_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | The ID of the token. |

### mintHandle

```solidity
function mintHandle(address to, string localName) external returns (uint256)
```

Mints a new handle with a given local name for the specified address.

_Mints a new handle with a given local name for the specified address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | The address to mint the handle for. |
| localName | string | The local name of the handle. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The ID of the minted handle. |

### burn

```solidity
function burn(uint256 tokenId) external
```

Burns a handle with a specified token ID.

_Burns a handle with a specified token ID._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | The ID of the handle to burn. |

### exists

```solidity
function exists(uint256 tokenId) external view returns (bool)
```

Checks if a handle exists by its token ID.

_Checks if a handle exists by its token ID._

### getNamespace

```solidity
function getNamespace() public view virtual returns (string)
```

Retrieves the namespace of the handles.

_Retrieves the namespace of the handles._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | The namespace of the handles. |

### getNamespaceHash

```solidity
function getNamespaceHash() external view returns (bytes32)
```

Returns the hash of the namespace string.

_Returns the hash of the namespace string._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | The hash of the namespace string. |

### getLocalName

```solidity
function getLocalName(uint256 tokenId) public view returns (string)
```

Retrieves the local name of a handle by its token ID.

_Retrieves the local name of a handle by its token ID._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | The ID of the handle. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | The local name of the handle. |

### getHandle

```solidity
function getHandle(uint256 tokenId) public view returns (string)
```

Constructs the complete handle from a token ID.

_Constructs the complete handle from a token ID._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | The ID of the handle. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | The handle with the namespace and local name. |

### getTokenId

```solidity
function getTokenId(string localName) public pure returns (uint256)
```

Generates a token ID based on a given local name.

_Generates a token ID based on a given local name._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| localName | string | The local name of the handle. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The token ID of the handle. |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

Returns true if this contract implements the interface defined by `interfaceId`.

_Returns true if this contract implements the interface defined by `interfaceId`._

### _mintHandle

```solidity
function _mintHandle(address to, string localName) internal returns (uint256)
```

_Mints a new handle with the specified local name for a given address. This function generates a token ID based on the local name,
increments the total supply, mints the token, stores the local name associated with the token ID, and emits a HandleMinted event._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | The address to which the new token will be minted. |
| localName | string | The local part of the handle to be minted. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | tokenId The unique token ID of the minted handle. |

