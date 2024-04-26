# Solidity API

## BicAccount

BicAccount is a simple account abstraction contract, with owner and operator roles.

The owner can execute transactions, change owner, and deposit/withdraw funds.

The operator can execute transactions.

The recovery role can change the owner.

_Based on eth-infinitism SimpleAccount_

### owner

```solidity
address owner
```

the owner of the account (an EOA)

### permissions

```solidity
contract BicPermissions permissions
```

the permissions contract, using recovery and operator roles

### BicAccountInitialized

```solidity
event BicAccountInitialized(contract IEntryPoint entryPoint, address owner)
```

### NewOwner

```solidity
event NewOwner(address oldOwner, address newOwner)
```

### onlyOwner

```solidity
modifier onlyOwner()
```

Modifier to restrict access to the owner

### entryPoint

```solidity
function entryPoint() public view virtual returns (contract IEntryPoint)
```

return the entryPoint used by this account.
subclass should return the current entryPoint used by this account.

### receive

```solidity
receive() external payable
```

### constructor

```solidity
constructor(contract IEntryPoint anEntryPoint) public
```

Create a new account

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| anEntryPoint | contract IEntryPoint | the entryPoint contract |

### _onlyOwner

```solidity
function _onlyOwner() internal view
```

check if the caller is the owner

### _onlyOwnerOrHasRecoveryRole

```solidity
function _onlyOwnerOrHasRecoveryRole() internal view
```

check if the caller is the owner or has the recovery role

### _onlyOwnerOrHasOperatorRole

```solidity
function _onlyOwnerOrHasOperatorRole() internal view
```

check if the caller is the owner or has the operator role

### changeOwner

```solidity
function changeOwner(address _newOwner) external
```

Change owner or recovery the other owner (called directly from owner, or by entryPoint)

### execute

```solidity
function execute(address dest, uint256 value, bytes func) external
```

execute a transaction (called directly from owner, or by entryPoint)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| dest | address | destination address to call |
| value | uint256 | the value to pass in this call |
| func | bytes | the calldata to pass in this call |

### executeBatch

```solidity
function executeBatch(address[] dest, uint256[] value, bytes[] func) external
```

execute a sequence of transactions

_to reduce gas consumption for trivial case (no value), use a zero-length array to mean zero value_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| dest | address[] | an array of destination addresses |
| value | uint256[] | an array of values to pass to each call. can be zero-length for no-value calls |
| func | bytes[] | an array of calldata to pass to each call |

### initialize

```solidity
function initialize(address anOwner, contract BicPermissions _permissions) public virtual
```

_The _entryPoint member is immutable, to reduce gas consumption.  To upgrade EntryPoint,
a new implementation of SimpleAccount must be deployed with the new EntryPoint address, then upgrading
the implementation by calling `upgradeTo()`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| anOwner | address | the owner (signer) of this account |
| _permissions | contract BicPermissions |  |

### _initialize

```solidity
function _initialize(address anOwner, contract BicPermissions _permissions) internal virtual
```

### _requireFromEntryPointOrOwner

```solidity
function _requireFromEntryPointOrOwner() internal view
```

Require the function call went through EntryPoint or owner

### _validateSignature

```solidity
function _validateSignature(struct UserOperation userOp, bytes32 userOpHash) internal virtual returns (uint256 validationData)
```

Using ECDSA to validate the signature
make sure owner signed the operation

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userOp | struct UserOperation | the UserOperation |
| userOpHash | bytes32 | the hash of the UserOperation |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| validationData | uint256 | 0 if the signature is valid else SIG_VALIDATION_FAILED |

### _call

```solidity
function _call(address target, uint256 value, bytes data) internal
```

Call a contract with the given calldata

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| target | address | the target contract address |
| value | uint256 | the value to send |
| data | bytes | the calldata |

### getDeposit

```solidity
function getDeposit() public view returns (uint256)
```

check current account deposit in the entryPoint

### addDeposit

```solidity
function addDeposit() public payable
```

deposit more funds for this account in the entryPoint

### withdrawDepositTo

```solidity
function withdrawDepositTo(address payable withdrawAddress, uint256 amount) public
```

withdraw value from the account's deposit

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| withdrawAddress | address payable | target to send to |
| amount | uint256 | to withdraw |

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address newImplementation) internal view
```

Upgrade the implementation of the account

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newImplementation | address | the new implementation contract address |

### version

```solidity
function version() external pure virtual returns (uint256)
```

Version for BicAccount

