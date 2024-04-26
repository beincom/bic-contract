# Solidity API

## BicTokenPaymaster

The paymaster IS the token to use, since a paymaster cannot use an external contract.
Also, the exchange rate has to be fixed, since it can't reference an external Uniswap or other exchange contract.
subclass should override "getTokenValueOfEth" to provide actual token exchange rate, settable by the owner.
Known Limitation: this paymaster is exploitable when put into a batch with multiple ops (of different accounts):
- while a single op can't exploit the paymaster (if postOp fails to withdraw the tokens, the user's op is reverted,
  and then we know we can withdraw the tokens), multiple ops with different senders (all using this paymaster)
  in a batch can withdraw funds from 2nd and further ops, forcing the paymaster itself to pay (from its deposit)
- Possible workarounds are either use a more complex paymaster scheme (e.g. the DepositPaymaster) or
  to whitelist the account and the called method ids.

### COST_OF_POST

```solidity
uint256 COST_OF_POST
```

calculated cost of the postOp

### theFactory

```solidity
address theFactory
```

the factory that creates accounts. used to validate account creation.

### oracle

```solidity
address oracle
```

the oracle to use for token exchange rate.

### constructor

```solidity
constructor(address accountFactory, contract IEntryPoint _entryPoint) public
```

### setOracle

```solidity
function setOracle(address _oracle) external
```

set the oracle to use for token exchange rate.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _oracle | address | the oracle to use. |

### transferOwnership

```solidity
function transferOwnership(address newOwner) public virtual
```

transfer paymaster ownership.
owner of this paymaster is allowed to withdraw funds (tokens transferred to this paymaster's balance)
when changing owner, the old owner's withdrawal rights are revoked.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newOwner | address | the new owner of the paymaster. |

### getTokenValueOfEth

```solidity
function getTokenValueOfEth(uint256 valueEth) internal view virtual returns (uint256 valueToken)
```

token to eth exchange rate.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| valueEth | uint256 | the value in eth to convert to tokens. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| valueToken | uint256 | the value in tokens. |

### _validatePaymasterUserOp

```solidity
function _validatePaymasterUserOp(struct UserOperation userOp, bytes32, uint256 requiredPreFund) internal view returns (bytes context, uint256 validationData)
```

validate the request:

- If this is a constructor call, make sure it is a known account.
- Verify the sender has enough tokens.

_(since the paymaster is also the token, there is no notion of "approval")_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userOp | struct UserOperation | the user operation to validate. |
|  | bytes32 |  |
| requiredPreFund | uint256 | the required pre-fund for the operation. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| context | bytes | the context to pass to postOp. |
| validationData | uint256 | the validation data. |

### _validateConstructor

```solidity
function _validateConstructor(struct UserOperation userOp) internal view virtual
```

validate the constructor code and parameters.

_when constructing an account, validate constructor code and parameters
we trust our factory (and that it doesn't have any other public methods)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userOp | struct UserOperation | the user operation to validate. |

### _postOp

```solidity
function _postOp(enum IPaymaster.PostOpMode mode, bytes context, uint256 actualGasCost) internal
```

actual charge of user.

_this method will be called just after the user's TX with mode==OpSucceeded|OpReverted (account pays in both cases)

BUT: if the user changed its balance in a way that will cause  postOp to revert, then it gets called again, after reverting
the user's TX , back to the state it was before the transaction started (before the validatePaymasterUserOp),
and the transaction should succeed there._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| mode | enum IPaymaster.PostOpMode | the mode of the operation. |
| context | bytes | the context to pass to postOp. |
| actualGasCost | uint256 | the actual gas cost of the operation. |

