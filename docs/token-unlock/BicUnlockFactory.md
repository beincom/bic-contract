# Solidity API

## BicUnlockFactory

This contract allows users to create time-locked token unlock contracts

### UnlockInitialized

```solidity
event UnlockInitialized(address unlock, address erc20, uint256 totalAmount, address beneficiaryAddress, uint64 durationSeconds, uint64 unlockRate)
```

Emitted when a new unlock contract is initialized

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| unlock | address | Address of the new unlock contract |
| erc20 | address | Address of the ERC20 token |
| totalAmount | uint256 | Total amount of tokens to be unlocked over time |
| beneficiaryAddress | address | Address of the beneficiary who is receivied the unlocked tokens |
| durationSeconds | uint64 | Duration of the unlock in seconds |
| unlockRate | uint64 | Percentage of the total amount that is unlocked per duration |

### bicUnlockImplementation

```solidity
contract BicUnlockToken bicUnlockImplementation
```

Address of the BicUnlockToken implementation used for creating new clones

_This is a clone factory pattern_

### unlockAddress

```solidity
mapping(address => address) unlockAddress
```

Mapping of beneficiary addresses to their unlock contract addresses

_This is used to prevent multiple unlock contracts from being created for the same beneficiary_

### constructor

```solidity
constructor() public
```

Initializes the BicUnlockFactory contract

_This sets the bicUnlockImplementation to a new BicUnlockToken instance_

### createUnlock

```solidity
function createUnlock(address erc20, uint256 totalAmount, address beneficiaryAddress, uint64 durationSeconds, uint64 unlockRate) public returns (contract BicUnlockToken ret)
```

Creates a new unlock contract for a beneficiary using the specified parameters

_Deploys a clone of `bicUnlockImplementation`, initializes it, and transfers the required tokens_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| erc20 | address | The address of the ERC20 token to lock |
| totalAmount | uint256 | The total amount of tokens to lock |
| beneficiaryAddress | address | The address of the beneficiary who can claim the tokens |
| durationSeconds | uint64 | The duration over which the tokens will unlock |
| unlockRate | uint64 | The percentage of total tokens to unlock per interval |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| ret | contract BicUnlockToken | The address of the newly created unlock token contract |

### computeUnlock

```solidity
function computeUnlock(address erc20, uint256 totalAmount, address beneficiaryAddress, uint64 durationSeconds, uint64 unlockRate) public view returns (address)
```

Computes the address of a potential unlock contract for a given set of parameters

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| erc20 | address | The address of the ERC20 token involved |
| totalAmount | uint256 | The total amount of tokens potentially to lock |
| beneficiaryAddress | address | The address of the potential beneficiary |
| durationSeconds | uint64 | The potential duration of the unlock |
| unlockRate | uint64 | The percentage of total tokens to unlock at each interval |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | predicted The address of the potential unlock contract |

### _getHash

```solidity
function _getHash(address erc20, uint256 totalAmount, address beneficiaryAddress, uint64 durationSeconds, uint64 unlockRate) public pure returns (bytes32)
```

Computes a hash of the unlock parameters

_This hash is used for creating deterministic addresses for clone contracts_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| erc20 | address | The address of the ERC20 token |
| totalAmount | uint256 | The total amount of tokens |
| beneficiaryAddress | address | The address of the beneficiary |
| durationSeconds | uint64 | The duration of the unlock |
| unlockRate | uint64 | The percentage of the total amount to be unlocked per interval |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | hash The computed hash of the parameters |

