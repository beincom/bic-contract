// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title BicUnlockToken Contract
/// @notice Manages the locked tokens, allowing beneficiaries to claim their tokens after a vesting period
/// @dev This contract uses OpenZeppelin's Initializable and ReentrancyGuard to provide initialization and reentrancy protection
contract BicUnlockToken is Initializable, ReentrancyGuard {
    /// @notice Emitted when tokens are released to the beneficiary
    /// @param beneficiary The address of the beneficiary who received the tokens
    /// @param amount The amount of tokens released
    /// @param currentRewardStacks The current stack count of rewards released
    /// @param stacks The total number of stacks that will be released
    /// @param timestamp The block timestamp when the release occurred
    event ERC20Released(address beneficiary, uint256 amount, uint256 currentRewardStacks, uint256 stacks, uint64 timestamp);

    /// @notice The denominator used for calculating percentages, 100% = 10_000, 10% = 1_000, 1% = 100, 0.1% = 10, 0.01% = 1
    /// @dev This is used to calculate the unlock rate
    uint64 public constant DENOMINATOR = 10_000;

    address private _erc20;
    address private _beneficiary;

    uint256 private _released;
    uint256 private _totalAmount;
    uint64 private _start;
    uint64 private _end;
    uint64 private _duration;
    uint64 private _maxRewardStacks;
    uint64 private _currentRewardStacks;
    uint64 private _unlockRate;

    /// @dev Constructor is empty and payment is disabled by default
    constructor() payable {}

    /// @notice Initializes the contract with necessary parameters to start the vesting process
    /// @dev Ensure all parameters are valid, particularly that addresses are not zero and amounts are positive
    /// @param erc20Address The ERC20 token address to be locked in the contract
    /// @param totalAmount The total amount of tokens that will be locked
    /// @param beneficiaryAddress The address of the beneficiary who will receive the tokens after vesting
    /// @param durationSeconds The duration of the vesting period in seconds
    /// @param unlockRateNumber The rate at which the tokens will be released per duration
    function initialize(
        address erc20Address,
        uint256 totalAmount,
        address beneficiaryAddress,
        uint64 durationSeconds,
        uint64 unlockRateNumber
    ) public virtual initializer {
        require(beneficiaryAddress != address(0), "VestingWallet: beneficiary is zero address");
        require(totalAmount > 0, "VestingWallet: total amount invalid");
        require(durationSeconds > 0, "VestingWallet: duration invalid");
        require(unlockRateNumber > 0 && unlockRateNumber <= DENOMINATOR, "VestingWallet: unlock rate invalid");
        require(erc20Address != address(0), "VestingWallet: erc20 invalid");

        _beneficiary = beneficiaryAddress;
        _start = uint64(block.timestamp);
        _duration = durationSeconds;
        _erc20 = erc20Address;
        _totalAmount = totalAmount;
        _maxRewardStacks = DENOMINATOR / unlockRateNumber;
        _unlockRate = unlockRateNumber;
        _end = _start + _maxRewardStacks * durationSeconds;
        if (DENOMINATOR % unlockRateNumber > 0) {
            _end += 1 * durationSeconds;
        }
    }

    /// @notice Getter for the ERC20 token address
    /// @dev This function returns the address of the ERC20 token that is locked in the contract
    function erc20() public view virtual returns (address) {
        return _erc20;
    }

    /// @notice Getter for the total amount of tokens locked in the contract
    /// @dev This function returns the total amount of tokens that are locked in the contract
    function unlockTotalAmount() public view virtual returns (uint256) {
        return _totalAmount;
    }

    /// @notice Getter for the unlock rate
    /// @dev This function returns the unlock rate, which is the percentage of tokens that will be released per duration
    function unlockRate() public view virtual returns (uint64) {
        return _unlockRate;
    }

    /// @notice Getter for the beneficiary address
    /// @dev This function returns the address of the beneficiary who will receive the tokens after vesting
    function beneficiary() public view virtual returns (address) {
        return _beneficiary;
    }

    /// @notice Getter for the start timestamp
    /// @dev This function returns the start timestamp of the vesting period
    function start() public view virtual returns (uint256) {
        return _start;
    }

    /// @notice Getter for the end timestamp
    /// @dev This function returns the end timestamp of the vesting period
    function end() public view virtual returns (uint256) {
        return _end;
    }

    /// @notice Getter for the duration of the vesting period
    /// @dev This function returns the duration of the vesting period
    function duration() public view virtual returns (uint256) {
        return _duration;
    }

    /// @notice Getter for the last timestamp at the current reward stack
    /// @dev This function returns the last timestamp at the current reward stack
    function lastAtCurrentStack() public view virtual returns (uint256) {
        return _lastAtCurrentStack();
    }

    /// @notice Getter for the maximum reward stacks
    /// @dev This function returns the maximum reward stacks
    function maxRewardStacks() public view virtual returns (uint256) {
        return _maxRewardStacks;
    }

    /// @notice Getter for the current reward stacks
    /// @dev This function returns the current reward stacks
    function currentRewardStacks() public view virtual returns (uint256) {
        return _currentRewardStacks;
    }

    /// @notice Getter for the amount of tokens that will be released per duration
    /// @dev This function returns the amount of tokens that will be released per duration
    function amountPerDuration() public view virtual returns (uint256) {
        return _amountPerDuration();
    }

    /// @notice Getter for the amount of tokens that have been released
    /// @dev This function returns the amount of tokens that have been released to the beneficiary
    function released() public view virtual returns (uint256) {
        return _released;
    }

    /// @notice Calculates the amount of tokens that are currently available for release
    /// @dev This function uses the vesting formula to calculate the amount of tokens that can be released
    function releasable() public view virtual returns (uint256, uint256) {
        return _vestingSchedule(uint64(block.timestamp));
    }

    /// @notice Allows the beneficiary to release vested tokens
    /// @dev This function includes checks for the amount of tokens available for release token and updates internal states
    function release() public virtual nonReentrant {
        (uint256 amount, uint256 counter) = releasable();
        require(amount > 0, "VestingWallet: no tokens to release");

        _released += amount;
        _currentRewardStacks += uint64(counter);
        SafeERC20.safeTransfer(IERC20(_erc20), _beneficiary, amount);
        emit ERC20Released(_beneficiary, amount, _currentRewardStacks, counter, uint64(block.timestamp));
    }

    /// @dev Internal function to calculate the vesting schedule and determine releasable amount and reward stacks
    /// @param timestamp The current block timestamp
    /// @return amount The amount of tokens that can be released at this timestamp
    /// @return counter The number of reward stacks that have been released at this timestamp
    function _vestingSchedule(uint64 timestamp) internal view virtual returns (uint256, uint256) {
        if (timestamp < _start) {
            return (0, 0);
        } else if (timestamp > _end) {
            return (IERC20(_erc20).balanceOf(address(this)), _maxRewardStacks - _currentRewardStacks);
        } else {
            // check for the latest stack, if _currentRewardStacks < _maxRewardStacks => amount is _amountPerDuration
            if (_currentRewardStacks >= _maxRewardStacks) return (0, 0);

            uint256 elapsedTime = uint256(timestamp) - _lastAtCurrentStack();
            uint256 rewardStackCounter = elapsedTime / _duration;
            uint256 amount = rewardStackCounter * _amountPerDuration();

            return (amount, rewardStackCounter);
        }
    }

    /// @dev Internal helper function to calculate the amount of tokens per duration
    /// @return The calculated amount of tokens that should be released per duration based on the total amount and unlock rate
    function _amountPerDuration() internal view virtual returns (uint256) {
        return _totalAmount * _unlockRate / DENOMINATOR;
    }

    /// @dev Internal helper function to calculate the last timestamp at which tokens were released based on the current reward stacks
    /// @return The timestamp of the last release
    function _lastAtCurrentStack() internal view virtual returns (uint256) {
        return _start + (_duration * _currentRewardStacks);
    }
}
