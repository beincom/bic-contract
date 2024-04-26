# Solidity API

## HandlesController

_Manages operations related to handle auctions and direct handle requests, including minting and claim payouts.
Uses ECDSA for signature verification and integrates with a marketplace for auction functionalities._

### AuctionRequest

Represents a request for an auction, including the ability to claim the handle, the beneficiaries, and their respective shares of the proceeds.

_Represents a request for an auction, including the ability to claim the handle, the beneficiaries, and their respective shares of the proceeds._

```solidity
struct AuctionRequest {
  bool canClaim;
  address[] beneficiaries;
  uint256[] collects;
}
```

### HandleRequest

_Represents a request to create a handle, either through direct sale or auction._

```solidity
struct HandleRequest {
  address receiver;
  address handle;
  string name;
  uint256 price;
  address[] beneficiaries;
  uint256[] collects;
  uint256 commitDuration;
  bool isAuction;
}
```

### verifier

```solidity
address verifier
```

_The address of the verifier authorized to validate signatures._

### bic

```solidity
contract IERC20 bic
```

_The BIC token contract address._

### _bicPermissions

```solidity
contract IBicPermissions _bicPermissions
```

_The permissions contract used to manage operator roles._

### commitments

```solidity
mapping(bytes32 => uint256) commitments
```

_Mapping of commitments to their respective expiration timestamps. Used to manage the timing of commitments and auctions._

### marketplace

```solidity
contract IMarketplace marketplace
```

_The marketplace contract used for handling auctions._

### collectsDenominator

```solidity
uint256 collectsDenominator
```

_The denominator used for calculating beneficiary shares._

### collector

```solidity
address collector
```

_The address of the collector, who receives any residual funds not distributed to beneficiaries._

### nameToAuctionRequest

```solidity
mapping(string => struct HandlesController.AuctionRequest) nameToAuctionRequest
```

_Mapping from handle names to their corresponding auction requests, managing the state and distribution of auctioned handles._

### MintHandle

```solidity
event MintHandle(address handle, address to, string name, uint256 price)
```

_Emitted when a handle is minted, providing details of the transaction including the handle address, recipient, name, and price._

### Commitment

```solidity
event Commitment(bytes32 commitment, uint256 endTimestamp)
```

_Emitted when a commitment is made, providing details of the commitment and its expiration timestamp._

### SetVerifier

```solidity
event SetVerifier(address verifier)
```

_Emitted when the verifier address is updated._

### SetMarketplace

```solidity
event SetMarketplace(address marketplace)
```

_Emitted when the marketplace address is updated._

### CreateAuction

```solidity
event CreateAuction(uint256 auctionId)
```

_Emitted when an auction is created, providing details of the auction ID._

### constructor

```solidity
constructor(contract IBicPermissions _bp, contract IERC20 _bic) public
```

Initializes the HandlesController contract with the given permissions contract and BIC token.

### onlyOperator

```solidity
modifier onlyOperator()
```

Ensures that the function is called only by the operator.

### setVerifier

```solidity
function setVerifier(address _verifier) external
```

Sets a new verifier address authorized to validate signatures.

_Can only be set by an operator. Emits a SetVerifier event upon success._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _verifier | address | The new verifier address. |

### setMarketplace

```solidity
function setMarketplace(address _marketplace) external
```

Sets the marketplace contract address used for handling auctions.

_Can only be set by an operator. Emits a SetMarketplace event upon success._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _marketplace | address | The address of the Thirdweb Marketplace contract. |

### updateCollectsDenominator

```solidity
function updateCollectsDenominator(uint256 _collectsDenominator) external
```

Updates the denominator used for calculating beneficiary shares.

_Can only be performed by an operator. This is used to adjust the precision of distributions._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _collectsDenominator | uint256 | The new denominator value for share calculations. |

### setCollector

```solidity
function setCollector(address _collector) external
```

Sets the address of the collector, who receives any residual funds not distributed to beneficiaries.

_Can only be performed by an operator. This address acts as a fallback for undistributed funds._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _collector | address | The address of the collector. |

### requestHandle

```solidity
function requestHandle(struct HandlesController.HandleRequest rq, uint256 validUntil, uint256 validAfter, bytes signature) external
```

Processes handle requests, supports direct minting or auctions.

_Validates the request verifier's signature, mints handles, or initializes auctions.
Handles are minted directly or auctioned based on the request parameters._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| rq | struct HandlesController.HandleRequest | The handle request details including receiver, price, and auction settings. |
| validUntil | uint256 | The timestamp until when the request is valid. |
| validAfter | uint256 | The timestamp after which the request is valid. |
| signature | bytes | The cryptographic signature to validate the request's authenticity. |

### collectAuctionPayout

```solidity
function collectAuctionPayout(string name, uint256 amount, bytes signature) external
```

Collects the auction payouts after an auction concludes in the Thirdweb Marketplace. [LINK]: https://github.com/thirdweb-dev/contracts/tree/main/contracts/prebuilts/marketplace/english-auctions
The function will revert if:

     - The auction associated with the handle is not marked as canClaim.
     - The provided signature does not validate against the expected payload signed by the authorized signer.

_This function is called after a successful auction on the Thirdweb Marketplace to distribute the auction proceeds.
     The process involves two main steps:

     1. The winning bidder claims the auction amount through the Thirdweb Marketplace contract, which transfers the funds to this HandleController contract.

     2. This function is then called to distribute these funds among the predefined beneficiaries according to the specified shares.

     This function ensures that only valid, unclaimed auctions can be processed and verifies the operation via signature.

     It checks that the auction was marked as claimable, verifies the provided signature to ensure it comes from a valid source, and then performs the payout.

     Once the payout is completed, it marks the auction as claimed to prevent re-claiming._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | The name of the handle associated with the auction. |
| amount | uint256 | The total amount of Ether or tokens to be distributed to the beneficiaries. |
| signature | bytes | The signature from the authorized verifier to validate the claim operation. |

### withdraw

```solidity
function withdraw(address token, address to, uint256 amount) external
```

Allows withdrawal of funds or tokens from the contract.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The address of the token to withdraw, or address(0) for native Ether. |
| to | address | The recipient of the funds or tokens. |
| amount | uint256 | The amount to withdraw. |

### getRequestHandleOp

```solidity
function getRequestHandleOp(struct HandlesController.HandleRequest rq, uint256 validUntil, uint256 validAfter) public view returns (bytes32)
```

Allows the operator to claim tokens sent to the contract by mistake.

_Generates a unique hash for a handle request operation based on multiple parameters._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| rq | struct HandlesController.HandleRequest | The handle request details including receiver, price, and auction settings. |
| validUntil | uint256 | The timestamp until when the request is valid. |
| validAfter | uint256 | The timestamp after when the request is valid. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | The unique hash for the handle request operation. |

### getCollectAuctionPayoutOp

```solidity
function getCollectAuctionPayoutOp(string name, uint256 amount) public view returns (bytes32)
```

Generates a unique hash for a collect auction payout operation.

_Generates a unique hash for a collect auction payout operation._

