// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.23;

import "../../contracts/smart-wallet/BicAccount.sol";
import "../../contracts/smart-wallet/BicAccountFactory.sol";
import "../../contracts/management/BicPermissions.sol";
import "forge-std/Test.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@account-abstraction/contracts/core/EntryPoint.sol";

contract BicAccountFactoryTest is Test {
    BicAccountFactory public accountFactory;
    EntryPoint public entrypoint;
    BicPermissions public permissions;
    uint256 public user1PKey = 0x1;
    address public user1 = vm.addr(user1PKey);
    uint256 public user2PKey = 0x2;
    address public user2 = vm.addr(user2PKey);
    address public randomExecuteer = address(0x3);
    function setUp() public {
        entrypoint = new EntryPoint();
        permissions = new BicPermissions();
        accountFactory = new BicAccountFactory(entrypoint, permissions);
    }


    function _setupUserOp(
        uint256 _signerPKey,
        bytes memory _initCode,
        bytes memory _callDataForEntrypoint,
        address sender
    ) internal returns (UserOperation[] memory ops) {
        uint256 nonce = entrypoint.getNonce(sender, 0);

        // Get user op fields
        UserOperation memory op = UserOperation({
            sender: sender,
            nonce: nonce,
            initCode: _initCode,
            callData: _callDataForEntrypoint,
            callGasLimit: 500_000,
            verificationGasLimit: 500_000,
            preVerificationGas: 500_000,
            maxFeePerGas: 0,
            maxPriorityFeePerGas: 0,
            paymasterAndData: bytes(""),
            signature: bytes("")
        });

        // Sign UserOp
        bytes32 opHash = EntryPoint(entrypoint).getUserOpHash(op);
        bytes32 msgHash = ECDSA.toEthSignedMessageHash(opHash);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(_signerPKey, msgHash);
        bytes memory userOpSignature = abi.encodePacked(r, s, v);

        op.signature = userOpSignature;

        // Store UserOp
        ops = new UserOperation[](1);
        ops[0] = op;
    }

    function _setupUserOpExecute(
        uint256 _signerPKey,
        bytes memory _initCode,
        address _target,
        uint256 _value,
        bytes memory _callData,
        address sender
    ) internal returns (UserOperation[] memory) {
        bytes memory callDataForEntrypoint = abi.encodeWithSignature(
            "execute(address,uint256,bytes)",
            _target,
            _value,
            _callData
        );

        return _setupUserOp(_signerPKey, _initCode, callDataForEntrypoint, sender);
    }

    function _setupUserOpExecuteBatch(
        uint256 _signerPKey,
        bytes memory _initCode,
        address[] memory _target,
        uint256[] memory _value,
        bytes[] memory _callData,
        address sender
    ) internal returns (UserOperation[] memory) {
        bytes memory callDataForEntrypoint = abi.encodeWithSignature(
            "executeBatch(address[],uint256[],bytes[])",
            _target,
            _value,
            _callData
        );

        return _setupUserOp(_signerPKey, _initCode, callDataForEntrypoint, sender);
    }

    function test_ifWalletGenerateSameWithWalletGetAddress() public {
        BicAccount accountAddressUser1 = accountFactory.createAccount(user1, 0);
        address accountAddressUser1Get = accountFactory.getAddress(user1, 0);
        assertEq(address(accountAddressUser1), accountAddressUser1Get);

        BicAccount accountAddressUser2 = accountFactory.createAccount(user2, 0);
        address accountAddressUser2Get = accountFactory.getAddress(user2, 0);
        assertEq(address(accountAddressUser2), accountAddressUser2Get);
    }

    function test_createAccount() public {
        BicAccount account = accountFactory.createAccount(msg.sender, 0);
        assertEq(account.getNonce(), 0);
        assertEq(address(account.entryPoint()), address(entrypoint));

        bytes memory initCallData = abi.encodeWithSignature("createAccount(address,uint256)", user1, 0);
        bytes memory initCode = abi.encodePacked(abi.encodePacked(address(accountFactory)), initCallData);
        address user1AccountAddress = accountFactory.getAddress(user1, 0);
        UserOperation[] memory userOpCreateAccount = _setupUserOpExecute(
            user1PKey,
            initCode,
            address(0),
            0,
            bytes(""),
            user1AccountAddress
        );
        vm.prank(randomExecuteer);
        EntryPoint(entrypoint).handleOps(userOpCreateAccount, payable(randomExecuteer));
    }
}
