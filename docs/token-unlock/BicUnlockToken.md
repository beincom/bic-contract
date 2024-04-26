# Solidity API

## BicUnlockToken

Manages the locked tokens, allowing beneficiaries to claim their tokens after a vesting period

_This contract uses OpenZeppelin's Initializable and ReentrancyGuard to provide initialization and reentrancy protection_

### ERC20Released

```solidity
event ERC20Released(address beneficiary, uint256 amount, uint256 currentRewardStacks, uint256 stacks, uint64 timestamp)
```

Emitted when tokens are released to the beneficiary

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| beneficiary | address | The address of the beneficiary who received the tokens |
| amount | uint256 | The amount of tokens released |
| currentRewardStacks | uint256 | The current stack count of rewards released |
| stacks | uint256 | The total number of stacks that will be released |
| timestamp | uint64 | The block timestamp when the release occurred |

### DENOMINATOR

```solidity
uint64 DENOMINATOR
```

The denominator used for calculating percentages, 100% = 10_000, 10% = 1_000, 1% = 100, 0.1% = 10, 0.01% = 1

_This is used to calculate the unlock rate_

### constructor

```solidity
constructor() public payable
```

_Constructor is empty and payment is disabled by default_

### initialize

```solidity
function initialize(address erc20Address, uint256 totalAmount, address beneficiaryAddress, uint64 durationSeconds, uint64 unlockRateNumber) public virtual
```

Initializes the contract with necessary parameters to start the vesting process

_Ensure all parameters are valid, particularly that addresses are not zero and amounts are positive_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| erc20Address | address | The ERC20 token address to be locked in the contract |
| totalAmount | uint256 | The total amount of tokens that will be locked |
| beneficiaryAddress | address | The address of the beneficiary who will receive the tokens after vesting |
| durationSeconds | uint64 | The duration of the vesting period in seconds |
| unlockRateNumber | uint64 | The rate at which the tokens will be released per duration |

### erc20

```solidity
function erc20() public view virtual returns (address)
```

Getter for the ERC20 token address

_This function returns the address of the ERC20 token that is locked in the contract_

### unlockTotalAmount

```solidity
function unlockTotalAmount() public view virtual returns (uint256)
```

Getter for the total amount of tokens locked in the contract

_This function returns the total amount of tokens that are locked in the contract_

### unlockRate

```solidity
function unlockRate() public view virtual returns (uint64)
```

Getter for the unlock rate

_This function returns the unlock rate, which is the percentage of tokens that will be released per duration_

### beneficiary

```solidity
function beneficiary() public view virtual returns (address)
```

Getter for the beneficiary address

_This function returns the address of the beneficiary who will receive the tokens after vesting_

### start

```solidity
function start() public view virtual returns (uint256)
```

Getter for the start timestamp

_This function returns the start timestamp of the vesting period_

### end

```solidity
function end() public view virtual returns (uint256)
```

Getter for the end timestamp

_This function returns the end timestamp of the vesting period_

### duration

```solidity
function duration() public view virtual returns (uint256)
```

Getter for the duration of the vesting period

_This function returns the duration of the vesting period_

### lastAtCurrentStack

```solidity
function lastAtCurrentStack() public view virtual returns (uint256)
```

Getter for the last timestamp at the current reward stack

_This function returns the last timestamp at the current reward stack_

### maxRewardStacks

```solidity
function maxRewardStacks() public view virtual returns (uint256)
```

Getter for the maximum reward stacks

_This function returns the maximum reward stacks_

### currentRewardStacks

```solidity
function currentRewardStacks() public view virtual returns (uint256)
```

Getter for the current reward stacks

_This function returns the current reward stacks_

### amountPerDuration

```solidity
function amountPerDuration() public view virtual returns (uint256)
```

Getter for the amount of tokens that will be released per duration

_This function returns the amount of tokens that will be released per duration_

### released

```solidity
function released() public view virtual returns (uint256)
```

Getter for the amount of tokens that have been released

_This function returns the amount of tokens that have been released to the beneficiary_

### releasable

```solidity
function releasable() public view virtual returns (uint256, uint256)
```

Calculates the amount of tokens that are currently available for release

_This function uses the vesting formula to calculate the amount of tokens that can be released_

### release

```solidity
function release() public virtual
```

Allows the beneficiary to release vested tokens

_This function includes checks for the amount of tokens available for release token and updates internal states_

### _vestingSchedule

```solidity
function _vestingSchedule(uint64 timestamp) internal view virtual returns (uint256, uint256)
```

_Internal function to calculate the vesting schedule and determine releasable amount and reward stacks_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| timestamp | uint64 | The current block timestamp |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | amount The amount of tokens that can be released at this timestamp |
| [1] | uint256 | counter The number of reward stacks that have been released at this timestamp |

### _amountPerDuration

```solidity
function _amountPerDuration() internal view virtual returns (uint256)
```

_Internal helper function to calculate the amount of tokens per duration_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The calculated amount of tokens that should be released per duration based on the total amount and unlock rate |

### _lastAtCurrentStack

```solidity
function _lastAtCurrentStack() internal view virtual returns (uint256)
```

_Internal helper function to calculate the last timestamp at which tokens were released based on the current reward stacks_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The timestamp of the last release |

