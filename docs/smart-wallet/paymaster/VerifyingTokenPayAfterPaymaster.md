# Solidity API

## VerifyingTokenPayAfterPaymaster

a paymaster that verifies a signature over the UserOperation, and pays the gas with the user's tokens.

_the signature is over the UserOperation, except the paymasterAndData, which contains the signature itself.
the signature is over the hash of the UserOperation, the chainId, the paymaster address, the sender nonce, the token, the validUntil and the validAfter.
the signature is verified by the verifyingSigner.
the gas cost is paid by the user's tokens, using the token oracle._

### COST_OF_POST

```solidity
uint256 COST_OF_POST
```

calculated cost of the postOp

### verifyingSigner

```solidity
address verifyingSigner
```

the signer to verify the signature.

### constructor

```solidity
constructor(contract IEntryPoint _entryPoint, address _verifyingSigner) public
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _entryPoint | contract IEntryPoint | the entry point contract to use. |
| _verifyingSigner | address | the signer to verify the signature. |

### senderNonce

```solidity
mapping(address => uint256) senderNonce
```

the nonce of the sender.

### oracles

```solidity
mapping(address => contract IOracle) oracles
```

the oracles to use for token exchange rate.

### pack

```solidity
function pack(struct UserOperation userOp) internal pure returns (bytes ret)
```

pack the UserOperation, except the paymasterAndData.
this is a lighter encoding than the UserOperation.hash() method, and is used to sign the request.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userOp | struct UserOperation | the UserOperation to pack. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| ret | bytes | the packed UserOperation. |

### getHash

```solidity
function getHash(struct UserOperation userOp, address token, uint48 validUntil, uint48 validAfter) public view returns (bytes32)
```

this method is called by the off-chain service, to sign the request.

_it is called on-chain from the validatePaymasterUserOp, to validate the signature.
note that this signature covers all fields of the UserOperation, except the "paymasterAndData",
which will carry the signature itself._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | the hash we're going to sign off-chain (and validate on-chain) |

### _validatePaymasterUserOp

```solidity
function _validatePaymasterUserOp(struct UserOperation userOp, bytes32, uint256 requiredPreFund) internal returns (bytes context, uint256 validationData)
```

verify our external signer signed this request.

_the "paymasterAndData" is expected to be the paymaster and a signature over the entire request params
paymasterAndData[:20] : address(this)
paymasterAndData[20:40] : token address
paymasterAndData[40:104] : abi.encode(validUntil, validAfter)
paymasterAndData[104:] : signature_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userOp | struct UserOperation | the UserOperation to validate. |
|  | bytes32 |  |
| requiredPreFund | uint256 | the required pre-fund for the operation. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| context | bytes | the context to pass to postOp. |
| validationData | uint256 | the validation data. |

### _postOp

```solidity
function _postOp(enum IPaymaster.PostOpMode mode, bytes context, uint256 actualGasCost) internal
```

pay the gas with the user's tokens.

_we don't really care about the mode, we just pay the gas with the user's tokens._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| mode | enum IPaymaster.PostOpMode | the mode of the operation. |
| context | bytes | the context to pass to postOp. |
| actualGasCost | uint256 | the actual gas cost of the operation. |

### parsePaymasterAndData

```solidity
function parsePaymasterAndData(bytes paymasterAndData) public pure returns (address token, uint48 validUntil, uint48 validAfter, bytes signature)
```

parse the paymasterAndData field.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| paymasterAndData | bytes | the paymasterAndData field to parse. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | adresss of token to use. |
| validUntil | uint48 | timestamp. |
| validAfter | uint48 | timestamp. |
| signature | bytes | of the request. |

### setOracle

```solidity
function setOracle(address token, contract IOracle oracle) public
```

set the oracle for a token.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the token to set the oracle for. |
| oracle | contract IOracle | the oracle to set. |

### withdrawTokensTo

```solidity
function withdrawTokensTo(contract IERC20 token, address target, uint256 amount) public
```

withdraw tokens to a target address.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | contract IERC20 | the token to withdraw. |
| target | address | the target address to withdraw to. |
| amount | uint256 | the amount to withdraw. |

