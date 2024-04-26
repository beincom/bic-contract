// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.23;

import "forge-std/Test.sol";

// import {BicUnlockToken} from "./../../contracts/token-unlock/BicTokenUnlock.sol";
import {BicUnlockToken} from "./../../contracts/token-unlock/BicTokenUnlock.sol";

contract BicUnlockTokenTest is Test {
    BicUnlockToken public uniqueUnlockToken;
    address constant dummyErc20Address = address(1); // Dummy ERC20 address for testing
    address constant beneficiaryAddress = address(2); // Dummy beneficiary address for testing

    function setUp() public {
        unlockToken = new BicUnlockToken();
        // unlockToken.initialize(dummyErc20Address, totalAmount, beneficiaryAddress, 1, 1); // Initial dummy initialization
    }

    function testFuzzInitialize(uint256 totalAmount, uint64 durationSeconds, uint64 unlockRateNumber) public {
        // Validate inputs to avoid divide by zero or overflows
        if (totalAmount == 0 || unlockRateNumber == 0 || unlockRateNumber > 100_000 || durationSeconds == 0) return;
        if (durationSeconds > type(uint64).max / 100_000) return;
        // Re-initialize to apply fuzzed inputs
        unlockToken.initialize(dummyErc20Address, totalAmount, beneficiaryAddress, durationSeconds, unlockRateNumber);

        // Expected values calculation
        uint64 expectedCount = 100_000 / unlockRateNumber;
        uint64 expectedEnd = uint64(block.timestamp) + expectedCount * durationSeconds;
        if (100_000 % unlockRateNumber > 0) {
            expectedEnd += durationSeconds; // Adjusting the end time if there's a remainder
        }

        // Assertions to verify correct calculations
        assertEq(unlockToken.count(), expectedCount, "Count does not match expected value");
        assertEq(unlockToken.unlockRate(), unlockRateNumber, "Unlock rate does not match the input value");
        assertEq(unlockToken.end(), expectedEnd, "End timestamp does not match expected value");
    }
}
