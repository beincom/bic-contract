# Solidity API

## HandleTokenURI

The contract leverages the BicPermissions contract to check for operator permissions.

_This contract is responsible for generating a token URI based on metadata elements associated with namespaces. It uses permission controls to manage who can set these metadata elements._

### permissions

```solidity
contract BicPermissions permissions
```

The permissions contract used to manage operator roles.

### NameElement

```solidity
struct NameElement {
  string imageDescription;
  string imageURI;
}
```

### nameElements

```solidity
mapping(string => struct HandleTokenURI.NameElement) nameElements
```

### SetNameElement

```solidity
event SetNameElement(string namespace, string imageDescription, string imageURI)
```

Emitted when a name element is set

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| namespace | string |  |
| imageDescription | string | the description of the name (aka Beincom - Earning Username) |
| imageURI | string | the uri for svg background name image |

### constructor

```solidity
constructor(contract BicPermissions _permissions) public
```

Initializes the contract with the given permissions contract.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _permissions | contract BicPermissions | management |

### onlyOperator

```solidity
modifier onlyOperator()
```

Ensures that the function is called only by the operator.

### setNameElement

```solidity
function setNameElement(string namespace, string imageDescription, string imageURI) external
```

Sets the metadata elements for a given namespace.

_This function is accessible only to operators._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| namespace | string | The namespace to associate with the metadata elements. |
| imageDescription | string | The description of the image for the namespace. |
| imageURI | string | The URI for the image for the namespace. |

### getNameElement

```solidity
function getNameElement(string namespace) external view returns (string, string)
```

Retrieves the metadata elements associated with a specific namespace.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| namespace | string | The namespace for which metadata elements are queried. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | imageDescription The description of the image. |
| [1] | string | imageURI The URI of the image. |

### getImageURI

```solidity
function getImageURI(string namespace, string localName) internal view returns (string)
```

_Internal function to concatenate the base image URI with the local name query parameter._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| namespace | string | The namespace used to retrieve the base URI. |
| localName | string | The local name used as a query parameter. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | The full image URI including the query parameter. |

### getImageDescription

```solidity
function getImageDescription(string namespace, string localName) internal view returns (string)
```

_Internal function to generate the image description including the local name._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| namespace | string | The namespace used to retrieve the base description. |
| localName | string | The local name appended to the base description. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | The full image description. |

### getTokenURI

```solidity
function getTokenURI(uint256 tokenId, string localName, string namespace) external view returns (string)
```

Generates a complete token URI with metadata for a specific token.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | The identifier for the token. |
| localName | string | The local name associated with the token. |
| namespace | string | The namespace under which the token was minted. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | The complete token URI in base64-encoded JSON format. |

