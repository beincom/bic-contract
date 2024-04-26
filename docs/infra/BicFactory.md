# Solidity API

## BicFactory

This contract allows users to deploy minimal proxies (clones) for a specified implementation contract

_Uses OpenZeppelin's Clones library for creating deterministic minimal proxy contracts_

### ProxyDeployed

```solidity
event ProxyDeployed(address implementation, address proxy, address deployer)
```

Emitted when a new proxy is deployed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| implementation | address | The address of the implementation contract the proxy uses |
| proxy | address | The address of the newly deployed proxy |
| deployer | address | The address of the user who deployed the proxy |

### deployProxyByImplementation

```solidity
function deployProxyByImplementation(address _implementation, bytes _data, bytes32 _salt) public returns (address deployedProxy)
```

Deploys a new minimal proxy contract for a given implementation

_The `_data` can include an initialization function call_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _implementation | address | The address of the implementation contract to clone |
| _data | bytes | Initialization data to be called on the new proxy contract immediately after its deployment |
| _salt | bytes32 | A nonce used to create a unique deterministic address for the proxy contract |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| deployedProxy | address | The address of the newly created proxy contract |

### computeProxyAddress

```solidity
function computeProxyAddress(address _implementation, bytes32 _salt) public view returns (address)
```

Computes the address of a proxy contract that would be deployed using the given implementation and salt

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _implementation | address | The address of the implementation contract to clone |
| _salt | bytes32 | A nonce used to create a unique deterministic address for the proxy contract |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | proxyAddress The address of the proxy contract that would be deployed |

