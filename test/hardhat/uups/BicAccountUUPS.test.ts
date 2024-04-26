import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, upgrades } from "hardhat";

import { expect } from "chai";
import { BicAccount, EntryPoint, BicPermissions, BicAccountFactory, BicAccount2, TestERC20 } from "../../../typechain-types";
import { contractFixture } from "../util/fixtures";

describe("BicAccountUUPS", function () {
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
  let smartWalletForLily: BicAccount;

  // runs before all tests in this file regardless where this line is defined.
  before(async () => {
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

    /**
     * Warning already known
     * Warning: Potentially unsafe deployment of contracts/test/BicAccount2.sol:BicAccount2
     * You are using the `unsafeAllow.state-variable-immutable` flag.
     * Warning: Potentially unsafe deployment of contracts/test/BicAccount2.sol:BicAccount2
     * You are using the `unsafeAllow.constructor` flag.
     */
    upgrades.silenceWarnings();

  });

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

  const print = async () => {
    console.log(``);
    console.log(`      ########################################################`);
    console.log(`      $ Jack   balance       :        ${ethers.formatEther(await ethers.provider.getBalance(Jack.address))} eth`);
    console.log(`      $ Jack's balance       :        ${ethers.formatEther(await ethers.provider.getBalance(smartWalletForJack.target))} eth`);
    console.log(`      $ Jack's erc20 balance :        ${ethers.formatEther(await testERC20.balanceOf(smartWalletForJack.target))} token`);
    console.log(`      --------------------------------------------------------`);
    console.log(`      $ Lily   balance       :        ${ethers.formatEther(await ethers.provider.getBalance(Lily.address))} eth`);
    console.log(`      $ Lily's balance       :        ${ethers.formatEther(await ethers.provider.getBalance(smartWalletForLily.target))} eth`);
    console.log(`      $ Lily's erc20 balance :        ${ethers.formatEther(await testERC20.balanceOf(smartWalletForLily.target))} token`);
    console.log(`      #######################################################`);
    console.log(``);
  };

  describe("BicAccount should work properly", () => {
    
    it("Jack should create account properly", async () => {
      // Prepare for create account uer operation
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
        value: ethers.parseEther("1"),
      });

      // handleOps
      await entryPoint.connect(Jack).handleOps([userOpSigned], beneficiary);

      // Get wallet
      smartWalletForJack = await ethers.getContractAt("BicAccount", smartWalletAddress);

      // Expect
      expect(smartWalletAddress).equal(smartWalletForJack.target);
      expect(await ethers.provider.getBalance(smartWalletAddress)).greaterThan(ethers.parseEther("0.9"));
    });

    it("Lily should create account properly", async () => {
      // Prepare for create account uer operation
      const smartWalletAddress = await bicAccountFactory.getFunction("getAddress")(Lily.address, salt);
      const nonce = await entryPoint.getNonce(smartWalletAddress, nonceKey);
      const initCallData = bicAccountFactory.interface.encodeFunctionData("createAccount", [Lily.address, salt]);
      const initCode = ethers.solidityPacked(["address", "bytes"], [bicAccountFactory.target, initCallData]);
      const userOp = await createUserOp(smartWalletAddress, nonce, initCode, "0x");

      // Sign for this userOP
      const opHash = await entryPoint.getUserOpHash(userOp);
      const signature = await Lily.signMessage(ethers.getBytes(opHash));
      const userOpSigned = { ...userOp, signature: signature };

      // Transfer gas fee for first time
      await Lily.sendTransaction({
        to: smartWalletAddress,
        value: ethers.parseEther("1"),
      });

      // handleOps
      await entryPoint.connect(Lily).handleOps([userOpSigned], beneficiary);

      // Get wallet
      smartWalletForLily = await ethers.getContractAt("BicAccount", smartWalletAddress);

      // Expect
      expect(smartWalletAddress).equal(smartWalletForLily.target);
      expect(await ethers.provider.getBalance(smartWalletAddress)).greaterThan(ethers.parseEther("0.9"));
    });

    it("Jack send eth to his smart wallet", async () => {
      await Jack.sendTransaction({
        to: smartWalletForJack.target,
        value: ethers.parseEther("0.2"),
      });

      expect(await ethers.provider.getBalance(smartWalletForJack.target)).greaterThan(ethers.parseEther("1"));
    });

    it("Jack smart wallet send to Lily smart wallet", async () => {
      // Prepare for send transaction
      const nonce = await entryPoint.getNonce(smartWalletForJack.target, nonceKey);
      const callData = smartWalletForJack.interface.encodeFunctionData("execute", [smartWalletForLily.target, ethers.parseEther("0.5"), "0x"]);
      const userOp = await createUserOp(smartWalletForJack.target as string, nonce, "0x", callData);

      // Sign
      const opHash = await entryPoint.getUserOpHash(userOp);
      const signature = await Jack.signMessage(ethers.getBytes(opHash));
      const userOpSigned = { ...userOp, signature: signature };

      // handleOps
      await entryPoint.connect(Jack).handleOps([userOpSigned], beneficiary);

      // Expectation
      expect(await ethers.provider.getBalance(smartWalletForJack)).lessThan(ethers.parseEther("0.7"));
      expect(await ethers.provider.getBalance(smartWalletForLily)).greaterThan(ethers.parseEther("1.4"));
    });

    it("Lily smart wallet send to Jack smart wallet", async () => {
      await smartWalletForLily.connect(Lily).execute(smartWalletForJack.target, ethers.parseEther("0.1"), "0x");

      // Expectation
      expect(await ethers.provider.getBalance(smartWalletForJack)).lessThan(ethers.parseEther("0.8"));
      expect(await ethers.provider.getBalance(smartWalletForLily)).greaterThan(ethers.parseEther("1.3"));
    });

    it("Jack and Lily should receive erc20 properly", async () => {
      // receive
      await testERC20.connect(deployer).transfer(smartWalletForJack.target, ethers.parseEther("100"));
      await testERC20.connect(deployer).transfer(smartWalletForLily.target, ethers.parseEther("500"));

      // Expection
      expect(await testERC20.balanceOf(smartWalletForJack.target)).equal(ethers.parseEther("100"));
      expect(await testERC20.balanceOf(smartWalletForLily.target)).equal(ethers.parseEther("500"));
    });

    it("Jack should send erc20 to Lily properly", async () => {
      // Send
      const firstTransferNonce = await entryPoint.getNonce(smartWalletForJack.target, nonceKey);
      const firstTransferInitCallData = testERC20.interface.encodeFunctionData("transfer", [smartWalletForLily.target, ethers.parseEther("10")]);
      const firstTransferCallData = smartWalletForJack.interface.encodeFunctionData("execute", [testERC20.target, ethers.ZeroHash, firstTransferInitCallData]);
      const firstTransferUserOp = await createUserOp(smartWalletForJack.target as string, firstTransferNonce, '0x', firstTransferCallData);
      const firstTransferUserOpHash = await entryPoint.getUserOpHash(firstTransferUserOp);
      const firstTransferSignature = await Jack.signMessage(ethers.getBytes(firstTransferUserOpHash));
      const firstTransferUserOpSigned = { ...firstTransferUserOp, signature: firstTransferSignature };

      // Send
      const secondTransferNonce = await entryPoint.getNonce(smartWalletForJack.target, nonceKey);
      const secondTransferInitCallData = testERC20.interface.encodeFunctionData("transfer", [smartWalletForLily.target, ethers.parseEther("20")]);
      const secondTransferCallData = smartWalletForJack.interface.encodeFunctionData("execute", [testERC20.target, ethers.ZeroHash, secondTransferInitCallData]);
      const secondTransferUserOp = await createUserOp(smartWalletForJack.target as string, secondTransferNonce, '0x', secondTransferCallData, 1n);
      const secondTransferUserOpHash = await entryPoint.getUserOpHash(secondTransferUserOp);
      const secondTransferSignature = await Jack.signMessage(ethers.getBytes(secondTransferUserOpHash));
      const secondTransferUserOpSigned = { ...secondTransferUserOp, signature: secondTransferSignature };

      // Handle Ops
      await entryPoint.handleOps([firstTransferUserOpSigned, secondTransferUserOpSigned], beneficiary.address);

      expect(await testERC20.balanceOf(smartWalletForJack.target)).equal(ethers.parseEther("70"));
      expect(await testERC20.balanceOf(smartWalletForLily.target)).equal(ethers.parseEther("530"));
    });
  });

  describe("BicAccount should work properly after upgrade implementation", () => {
    it("Jack and Lily assets should keep properly after upgrade", async () => {
      // Expectation the current version of BicAccount
      expect(await smartWalletForJack.version()).equal(1n);
      expect(await smartWalletForLily.version()).equal(1n);

      // Perform upgrade
      await smartWalletForJack.connect(Jack).upgradeTo(bicAccountV2.target);

      // Expectation the upgrade version of BicAccount
      expect(await smartWalletForJack.version()).equal(2n);

      // Expectation the assets
      expect(await ethers.provider.getBalance(smartWalletForJack)).lessThan(ethers.parseEther("0.8"));
      expect(await ethers.provider.getBalance(smartWalletForLily)).greaterThan(ethers.parseEther("1.3"));
      expect(await testERC20.balanceOf(smartWalletForJack.target)).equal(ethers.parseEther("70"));
      expect(await testERC20.balanceOf(smartWalletForLily.target)).equal(ethers.parseEther("530"));
    });

    it("should send and receive native token properly after upgrade", async () => {
      // Prepare for send transaction
      const nonce = await entryPoint.getNonce(smartWalletForJack.target, nonceKey);
      const callData = smartWalletForJack.interface.encodeFunctionData("execute", [smartWalletForLily.target, ethers.parseEther("0.5"), "0x"]);
      const userOp = await createUserOp(smartWalletForJack.target as string, nonce, "0x", callData);

      // Sign
      const opHash = await entryPoint.getUserOpHash(userOp);
      const signature = await Jack.signMessage(ethers.getBytes(opHash));
      const userOpSigned = { ...userOp, signature: signature };

      // handleOps
      await entryPoint.connect(Jack).handleOps([userOpSigned], beneficiary);

      // Lily send back to Jack
      await smartWalletForLily.connect(Lily).execute(smartWalletForJack.target, ethers.parseEther("0.1"), "0x");

      // Expectation
      expect(await ethers.provider.getBalance(smartWalletForJack)).lessThan(ethers.parseEther("0.4"));
      expect(await ethers.provider.getBalance(smartWalletForLily)).greaterThan(ethers.parseEther("1.7"));
    });

    it("should send and receive erc20 properly after upgrade", async () => {
      // Send
      const firstTransferNonce = await entryPoint.getNonce(smartWalletForJack.target, nonceKey);
      const firstTransferInitCallData = testERC20.interface.encodeFunctionData("transfer", [smartWalletForLily.target, ethers.parseEther("10")]);
      const firstTransferCallData = smartWalletForJack.interface.encodeFunctionData("execute", [testERC20.target, ethers.ZeroHash, firstTransferInitCallData]);
      const firstTransferUserOp = await createUserOp(smartWalletForJack.target as string, firstTransferNonce, '0x', firstTransferCallData);
      const firstTransferUserOpHash = await entryPoint.getUserOpHash(firstTransferUserOp);
      const firstTransferSignature = await Jack.signMessage(ethers.getBytes(firstTransferUserOpHash));
      const firstTransferUserOpSigned = { ...firstTransferUserOp, signature: firstTransferSignature };

      // Send
      const secondTransferNonce = await entryPoint.getNonce(smartWalletForLily.target, nonceKey);
      const secondTransferInitCallData = testERC20.interface.encodeFunctionData("transfer", [smartWalletForJack.target, ethers.parseEther("100")]);
      const secondTransferCallData = smartWalletForLily.interface.encodeFunctionData("execute", [testERC20.target, ethers.ZeroHash, secondTransferInitCallData]);
      const secondTransferUserOp = await createUserOp(smartWalletForLily.target as string, secondTransferNonce, '0x', secondTransferCallData);
      const secondTransferUserOpHash = await entryPoint.getUserOpHash(secondTransferUserOp);
      const secondTransferSignature = await Lily.signMessage(ethers.getBytes(secondTransferUserOpHash));
      const secondTransferUserOpSigned = { ...secondTransferUserOp, signature: secondTransferSignature };

      // Handle Ops
      await entryPoint.handleOps([firstTransferUserOpSigned, secondTransferUserOpSigned], beneficiary.address);

      // Expectation
      expect(await testERC20.balanceOf(smartWalletForJack.target)).equal(ethers.parseEther("160"));
      expect(await testERC20.balanceOf(smartWalletForLily.target)).equal(ethers.parseEther("440"));
    });
  });

  describe("Security", () => {
    it("only owner or operator can do upgrade", async () => {
      // Expectation
      await expect(smartWalletForLily.connect(Jack).upgradeTo(bicAccountV2.target)).to.be.reverted;
      await expect(smartWalletForLily.connect(operator).upgradeTo(bicAccountV2.target)).to.be.reverted;

      // Grant operator role for operator
      const OPERATOR_ROLE = await bicPermissionsEnumerable.OPERATOR_ROLE();
      await bicPermissionsEnumerable.connect(deployer).grantRole(OPERATOR_ROLE, operator);

      expect(await smartWalletForLily.version()).equal(1n);
      await smartWalletForLily.connect(operator).upgradeTo(bicAccountV2.target);
      expect(await smartWalletForJack.version()).equal(2n);
    });
  });

  describe("Should pass upgrade checklist from openzepplin", () => {
    it("upgrade safe and compatible", async () => {
      // Admin
      const [admin] = await ethers.getSigners();

      // Deploy
      const EntryPoint = await ethers.getContractFactory("EntryPointTest");
      const entryPoint = await EntryPoint.deploy();
      await entryPoint.waitForDeployment();
      const entryPointAddress = await entryPoint.getAddress();

      const bicPermissionsEnumerableContract = await ethers.deployContract("BicPermissions");
      await bicPermissionsEnumerableContract.waitForDeployment();

      const BicAccountFactory = await ethers.getContractFactory("BicAccountFactory");
      const bicAccountFactory = await BicAccountFactory.deploy(
        entryPointAddress,
        bicPermissionsEnumerableContract.target
      );
      await bicAccountFactory.waitForDeployment();
      const bicAccountFactoryAddress = bicAccountFactory.target;

      // Create account 1
      const smartWalletAddress1 = await bicAccountFactory.getFunction("getAddress")(admin.address as any, 0n as any);
      await admin.sendTransaction({
        to: smartWalletAddress1,
        value: ethers.parseEther('10')
      });
      const createSmartAccount = await bicAccountFactory.createAccount(
        admin.address as any,
        0n as any
      );
      await createSmartAccount.wait();
      const smartAccount = await ethers.getContractAt("BicAccount", smartWalletAddress1);
      await smartAccount.connect(admin).execute(admin.address, ethers.parseEther('1'), '0x');
      expect(await smartAccount.version()).equal(1n);


      // Prepare for using upgrade plugin
      const BicAccount = await ethers.getContractFactory("BicAccount");
      await upgrades.forceImport(smartAccount.target as string, BicAccount, {
        // @ts-ignore
        constructorArgs: [entryPointAddress],
        unsafeAllow: ["constructor", "state-variable-immutable"],
      });


      const BicAccount2 = await ethers.getContractFactory("BicAccount2");

      // upgrade safe check
      // @ts-ignore
      await upgrades.validateUpgrade(smartAccount.target as string, BicAccount2, {
        constructorArgs: [entryPointAddress],
        unsafeAllow: ["constructor", "state-variable-immutable"]
      });

      const smartAccountUpgrade = await upgrades.upgradeProxy(smartAccount.target,BicAccount2,{
        constructorArgs: [entryPointAddress],
        unsafeAllow: ["constructor", "state-variable-immutable"],
      });

      expect(await smartAccount.version()).equal(2n);
      expect(await smartAccountUpgrade.version()).equal(2n);
    });
  });
});
