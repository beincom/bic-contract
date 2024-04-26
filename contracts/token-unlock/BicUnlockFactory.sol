// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./BicUnlockToken.sol";

/// @title BicUnlockFactory for creating and managing ERC20 token unlocks
/// @notice This contract allows users to create time-locked token unlock contracts
contract BicUnlockFactory {
    /// @notice Emitted when a new unlock contract is initialized
    /// @param unlock Address of the new unlock contract
    /// @param erc20 Address of the ERC20 token
    /// @param totalAmount Total amount of tokens to be unlocked over time
    /// @param beneficiaryAddress Address of the beneficiary who is receivied the unlocked tokens
    /// @param durationSeconds Duration of the unlock in seconds
    /// @param unlockRate Percentage of the total amount that is unlocked per duration
    event UnlockInitialized(
        address unlock,
        address erc20,
        uint256 totalAmount,
        address beneficiaryAddress,
        uint64 durationSeconds,
        uint64 unlockRate
    );

    /// @notice Address of the BicUnlockToken implementation used for creating new clones
    /// @dev This is a clone factory pattern
    BicUnlockToken public immutable bicUnlockImplementation;

    /// @notice Mapping of beneficiary addresses to their unlock contract addresses
    /// @dev This is used to prevent multiple unlock contracts from being created for the same beneficiary
    mapping(address => address) public unlockAddress;

    /// @notice Initializes the BicUnlockFactory contract
    /// @dev This sets the bicUnlockImplementation to a new BicUnlockToken instance
    constructor() {
        bicUnlockImplementation = new BicUnlockToken();
    }

    /// @notice Creates a new unlock contract for a beneficiary using the specified parameters
    /// @dev Deploys a clone of `bicUnlockImplementation`, initializes it, and transfers the required tokens
    /// @param erc20 The address of the ERC20 token to lock
    /// @param totalAmount The total amount of tokens to lock
    /// @param beneficiaryAddress The address of the beneficiary who can claim the tokens
    /// @param durationSeconds The duration over which the tokens will unlock
    /// @param unlockRate The percentage of total tokens to unlock per interval
    /// @return ret The address of the newly created unlock token contract
    function createUnlock(
        address erc20,
        uint256 totalAmount,
        address beneficiaryAddress,
        uint64 durationSeconds,
        uint64 unlockRate
    ) public returns (BicUnlockToken ret) {
        require(unlockAddress[beneficiaryAddress] == address(0), "Unlock contract already deploy");

        bytes32 salthash = _getHash(erc20, totalAmount, beneficiaryAddress, durationSeconds, unlockRate);

        address addr = Clones.predictDeterministicAddress(address(bicUnlockImplementation), salthash);
        uint256 codeSize = addr.code.length;
        if (codeSize > 0) {
            return BicUnlockToken(payable(addr));
        }


        ret = BicUnlockToken(Clones.cloneDeterministic(address(bicUnlockImplementation), salthash));
        ret.initialize(erc20, totalAmount, beneficiaryAddress, durationSeconds, unlockRate);

        // Transfer from BIC to Account
        SafeERC20.safeTransferFrom(IERC20(erc20), msg.sender, address(ret), totalAmount);
        
        unlockAddress[beneficiaryAddress] = address(ret);
        emit UnlockInitialized(address(ret), erc20, totalAmount, beneficiaryAddress, durationSeconds, unlockRate);
    }


    /// @notice Computes the address of a potential unlock contract for a given set of parameters
    /// @param erc20 The address of the ERC20 token involved
    /// @param totalAmount The total amount of tokens potentially to lock
    /// @param beneficiaryAddress The address of the potential beneficiary
    /// @param durationSeconds The potential duration of the unlock
    /// @param unlockRate The percentage of total tokens to unlock at each interval
    /// @return predicted The address of the potential unlock contract
    function computeUnlock(
        address erc20,
        uint256 totalAmount,
        address beneficiaryAddress,
        uint64 durationSeconds,
        uint64 unlockRate
    ) public view returns (address) {
        if (unlockAddress[beneficiaryAddress] != address(0)) {
            return unlockAddress[beneficiaryAddress];
        }

        bytes32 salthash = _getHash(erc20, totalAmount, beneficiaryAddress, durationSeconds, unlockRate);

        address predicted = Clones.predictDeterministicAddress(address(bicUnlockImplementation), salthash);
        
        return predicted;
    }

    /// @notice Computes a hash of the unlock parameters
    /// @dev This hash is used for creating deterministic addresses for clone contracts
    /// @param erc20 The address of the ERC20 token
    /// @param totalAmount The total amount of tokens
    /// @param beneficiaryAddress The address of the beneficiary
    /// @param durationSeconds The duration of the unlock
    /// @param unlockRate The percentage of the total amount to be unlocked per interval
    /// @return hash The computed hash of the parameters
    function _getHash(
        address erc20,
        uint256 totalAmount,
        address beneficiaryAddress,
        uint64 durationSeconds,
        uint64 unlockRate
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(erc20, totalAmount, beneficiaryAddress, durationSeconds, unlockRate));
    }
    

}
