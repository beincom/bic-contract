import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { BicAccount, EntryPoint, BicPermissions, BicAccountFactory, BicAccount2, TestERC20, TestERC721 } from "../../../typechain-types";
import { contractFixture } from "../util/fixtures";

describe("BicAccount", function() {
    // Constant
    const nonceKey = 0n;
    const salt = 0n;

    // Fixture
    let deployer: SignerWithAddress;
    let Jack: SignerWithAddress;
    let Lily: SignerWithAddress;
    let beneficiary: SignerWithAddress;
    let operator: SignerWithAddress;
    let entryPoint: EntryPoint;
    let bicPermissionsEnumerable: BicPermissions;
    let bicAccountFactory: BicAccountFactory;
    let bicAccountV2: BicAccount2;
    let testERC20: TestERC20;

    // Smart Wallet
    let smartWalletForJack: BicAccount;

    const createUserOp = async (sender: string, nonce: BigInt, initCode: string, callData: string, chainNonce: BigInt = 0n) => {
        return {
          sender: sender,
          // @ts-ignore
          nonce: nonce + chainNonce,
          initCode: initCode,
          callData: callData,
          callGasLimit: 5_000_000, // TODO, need to be set to 0 when create account
          verificationGasLimit: 3_000_000,
          preVerificationGas: 5_000_000,
          maxFeePerGas: 3_000_000,
          maxPriorityFeePerGas: 3_000_000,
          paymasterAndData: "0x",
          signature: "0x",
        };
    };

    // Reset every test case
    beforeEach(async () => {
        const {
          deploySigner,
          signer1,
          signer2,
          beneficiarySigner,
          operatorSigner,
          entryPointContract,
          bicPermissionsEnumerableContract,
          bicAccountFactoryContract,
          bicAccountV2Contract,
          testERC20Contract,
        } = await loadFixture(contractFixture);

        deployer = deploySigner;
        Jack = signer1;
        Lily = signer2;
        beneficiary = beneficiarySigner;
        operator = operatorSigner;

        entryPoint = entryPointContract;
        bicPermissionsEnumerable = bicPermissionsEnumerableContract;
        bicAccountFactory = bicAccountFactoryContract;
        bicAccountV2 = bicAccountV2Contract;
        testERC20 = testERC20Contract;

        // Create account
        const smartWalletAddress = await bicAccountFactory.getFunction("getAddress")(Jack.address, salt);
        const nonce = await entryPoint.getNonce(smartWalletAddress, nonceKey);
        const initCallData = bicAccountFactory.interface.encodeFunctionData("createAccount", [Jack.address, salt]);
        const initCode = ethers.solidityPacked(["address", "bytes"], [bicAccountFactory.target, initCallData]);
        const userOp = await createUserOp(smartWalletAddress, nonce, initCode, "0x");

        // Sign for this userOP
        const opHash = await entryPoint.getUserOpHash(userOp);
        const signature = await Jack.signMessage(ethers.getBytes(opHash));
        const userOpSigned = { ...userOp, signature: signature };

        // Transfer gas fee for first time
        await Jack.sendTransaction({
          to: smartWalletAddress,
          value: ethers.parseEther("10"),
        });

        // handleOps
        await entryPoint.connect(Jack).handleOps([userOpSigned], beneficiary);

        // Get wallet
        smartWalletForJack = await ethers.getContractAt("BicAccount", smartWalletAddress);
    });

    it("Deposit should working as expected", async () => {
        // Deposit 1 eth to entrypoint
        await smartWalletForJack.addDeposit({
          value: ethers.parseEther("1")
        });

        // Surely it should be there
        expect(await smartWalletForJack.getDeposit()).greaterThan(ethers.parseEther("1"));

        // Then exepected withdraw revert
        await expect(smartWalletForJack.withdrawDepositTo(smartWalletForJack.target, ethers.parseEther("1"))).to.be.reverted;
        await expect(smartWalletForJack.connect(Lily).withdrawDepositTo(smartWalletForJack.target, ethers.parseEther("1"))).to.be.reverted;
        await expect(smartWalletForJack.connect(deployer).withdrawDepositTo(smartWalletForJack.target, ethers.parseEther("1"))).to.be.reverted;

        // Then the withdraw should working properly
        await smartWalletForJack.connect(Jack).withdrawDepositTo(smartWalletForJack.target, ethers.parseEther("1"));
    })

    it("executeBatch should be working as expected", async () => {
      // Send 100 ERC20 to smartwallet
      await testERC20.connect(deployer).transfer(smartWalletForJack.target, ethers.parseEther("100"));

      const initCallData1 = testERC20.interface.encodeFunctionData("transfer", [Jack.address, ethers.parseEther("10")]);
      const initCallData2 = testERC20.interface.encodeFunctionData("transfer", [Lily.address, ethers.parseEther("20")]);

      // Revert because of "wrong array lengths"
      await expect(smartWalletForJack.connect(Jack).executeBatch([testERC20.target, testERC20.target], [0], [initCallData1, initCallData2] )).to.be.reverted;

      // ExecuteBath
      await smartWalletForJack.connect(Jack).executeBatch([testERC20.target, testERC20.target], [], [initCallData1, initCallData2] );

      // Expected
      expect(await testERC20.balanceOf(Jack.address)).equal(ethers.parseEther("10"))
      expect(await testERC20.balanceOf(Lily.address)).equal(ethers.parseEther("20"))
      expect(await testERC20.balanceOf(smartWalletForJack.target)).equal(ethers.parseEther("70"))

      // Standard
      const dests = [testERC20.target, testERC20.target];
      const values = [0, 0];
      const funs = [initCallData1, initCallData2];

      // Not owner
      await expect(smartWalletForJack.connect(deployer).executeBatch(dests, values, funs )).to.be.reverted;

      // ExecuteBath
      await smartWalletForJack.connect(Jack).executeBatch(dests, values, funs );

      // Expected
      expect(await testERC20.balanceOf(Jack.address)).equal(ethers.parseEther("20"))
      expect(await testERC20.balanceOf(Lily.address)).equal(ethers.parseEther("40"))
      expect(await testERC20.balanceOf(smartWalletForJack.target)).equal(ethers.parseEther("40"))
    });

    it("only owner can sign for his smart wallet", async () => {
      const transferNonce = await entryPoint.getNonce(smartWalletForJack.target, nonceKey);
      const transferInitCallData = testERC20.interface.encodeFunctionData("transfer", [Jack.address, ethers.parseEther("10")]);
      const transferCallData = smartWalletForJack.interface.encodeFunctionData("execute", [testERC20.target, ethers.ZeroHash, transferInitCallData]);
      const transferUserOp = await createUserOp(smartWalletForJack.target as string, transferNonce, '0x', transferCallData);
      const transferUserOpHash = await entryPoint.getUserOpHash(transferUserOp);
      const transferSignature = await Lily.signMessage(ethers.getBytes(transferUserOpHash));
      const transferUserOpSigned = { ...transferUserOp, signature: transferSignature };

      await expect(entryPoint.handleOps([transferUserOpSigned], beneficiary.address)).to.be.reverted;
    });

    it("An smart wallet can not initialize more than one", async () => {
      await expect(smartWalletForJack.initialize(Lily.address, bicPermissionsEnumerable.target)).to.be.reverted;
    })

});
