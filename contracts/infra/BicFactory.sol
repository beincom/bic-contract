// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/proxy/Clones.sol";

/// @title A factory contract for deploying minimal proxy contracts using the EIP-1167 standard
/// @notice This contract allows users to deploy minimal proxies (clones) for a specified implementation contract
/// @dev Uses OpenZeppelin's Clones library for creating deterministic minimal proxy contracts
contract BicFactory {
    /// @notice Emitted when a new proxy is deployed
    /// @param implementation The address of the implementation contract the proxy uses
    /// @param proxy The address of the newly deployed proxy
    /// @param deployer The address of the user who deployed the proxy
    event ProxyDeployed(address indexed implementation, address proxy, address indexed deployer);

    /// @notice Deploys a new minimal proxy contract for a given implementation
    /// @dev The `_data` can include an initialization function call
    /// @param _implementation The address of the implementation contract to clone
    /// @param _data Initialization data to be called on the new proxy contract immediately after its deployment
    /// @param _salt A nonce used to create a unique deterministic address for the proxy contract
    /// @return deployedProxy The address of the newly created proxy contract
    function deployProxyByImplementation(
        address _implementation,
        bytes memory _data,
        bytes32 _salt
    ) public returns (address deployedProxy) {
        bytes32 salthash = keccak256(abi.encodePacked(msg.sender, _salt));
        deployedProxy = Clones.cloneDeterministic(_implementation, salthash);
        if (_data.length > 0) {
            (bool success, ) = deployedProxy.call(_data);
            require(success, "BicFactory: failed to initialize");
        }
        emit ProxyDeployed(_implementation, deployedProxy, msg.sender);
    }

    /// @notice Computes the address of a proxy contract that would be deployed using the given implementation and salt
    /// @param _implementation The address of the implementation contract to clone
    /// @param _salt A nonce used to create a unique deterministic address for the proxy contract
    /// @return proxyAddress The address of the proxy contract that would be deployed
    function computeProxyAddress(
        address _implementation,
        bytes32 _salt
    ) public view returns (address) {
        bytes32 salthash = keccak256(abi.encodePacked(msg.sender, _salt));
        return Clones.predictDeterministicAddress(_implementation, salthash);
    }
}
