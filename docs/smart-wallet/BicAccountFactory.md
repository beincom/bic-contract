# Solidity API

## BicAccountFactory

A UserOperations "initCode" holds the address of the factory, and a method call (to createAccount, in this sample factory).

The factory's createAccount returns the target account address even if it is already installed.

This way, the entryPoint.getSenderAddress() can be called either before or after the account is created.

### accountImplementation

```solidity
contract BicAccount accountImplementation
```

the account implementation contract

### permissions

```solidity
contract BicPermissions permissions
```

the permissions contract

### constructor

```solidity
constructor(contract IEntryPoint _entryPoint, contract BicPermissions _permissions) public
```

BicAccountFactory constructor

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _entryPoint | contract IEntryPoint | the entryPoint contract |
| _permissions | contract BicPermissions | the permissions contract |

### createAccount

```solidity
function createAccount(address owner, uint256 salt) public returns (contract BicAccount ret)
```

create an account, and return its address.

_Note that during UserOperation execution, this method is called only if the account is not deployed.
This method returns an existing account address so that entryPoint.getSenderAddress() would work even after account creation_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | the owner of the account |
| salt | uint256 | the salt to calculate the account address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| ret | contract BicAccount | is the address even if the account is already deployed. |

### getAddress

```solidity
function getAddress(address owner, uint256 salt) public view returns (address)
```

calculate the counterfactual address of this account as it would be returned by createAccount()

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | the owner of the account |
| salt | uint256 | the salt to calculate the account address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | the address of the account |

