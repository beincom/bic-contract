import {ethers} from "hardhat";
import {BigNumberish, BytesLike, parseEther, Wallet} from "ethers";
import {expect} from "chai";
import {createOp} from "../util/createOp";
import {BicAccountFactory} from "../../../typechain-types";
import {BicTokenPaymaster, EntryPoint} from "../../../typechain-types";
import * as assert from "node:assert";

describe("BicTokenPaymaster", () => {
    const {provider} = ethers;
    let admin;
    let user1: Wallet = new ethers.Wallet("0x0000000000000000000000000000000000000000000000000000000000000001", provider)
    let user2: Wallet = new ethers.Wallet("0x0000000000000000000000000000000000000000000000000000000000000002", provider)
    let bicAccountFactory: BicAccountFactory;
    let bicAccountFactoryAddress: string;
    let entryPoint: EntryPoint;
    let entryPointAddress: string;
    let beneficiary: string;
    let bicTokenPaymaster: BicTokenPaymaster;
    let legacyTokenPaymasterAddress: string;
    let walletToTestBlacklist;
    let randomAddress: string;

    beforeEach(async () => {
        [admin, walletToTestBlacklist] = await ethers.getSigners();
        beneficiary = ethers.Wallet.createRandom().address;
        randomAddress = ethers.Wallet.createRandom().address;
        const EntryPoint = await ethers.getContractFactory("EntryPointTest");
        entryPoint = await EntryPoint.deploy();
        await entryPoint.waitForDeployment();
        entryPointAddress = await entryPoint.getAddress();

        const BicAccountFactory = await ethers.getContractFactory("BicAccountFactory");
        bicAccountFactory = await BicAccountFactory.deploy(entryPointAddress, admin.address as any);
        await bicAccountFactory.waitForDeployment();
        bicAccountFactoryAddress = await bicAccountFactory.getAddress();

        const BicTokenPaymaster = await ethers.getContractFactory("BicTokenPaymaster");
        bicTokenPaymaster = await BicTokenPaymaster.deploy(entryPointAddress, admin.address as any);
        await bicTokenPaymaster.waitForDeployment();
        legacyTokenPaymasterAddress = await bicTokenPaymaster.getAddress();

        await entryPoint.depositTo(legacyTokenPaymasterAddress as any, { value: parseEther('1000') } as any)
        await bicTokenPaymaster.addFactory(bicAccountFactoryAddress as any);
    });

    it('should be able to use to create account', async () => {
        const smartWalletAddress = await bicAccountFactory.getFunction("getAddress")(user1.address as any, 0n as any);

        await bicTokenPaymaster.transfer(smartWalletAddress as any, ethers.parseEther('1000') as any);

        const initCallData = bicAccountFactory.interface.encodeFunctionData("createAccount", [user1.address as any, ethers.ZeroHash]);
        const target = bicAccountFactoryAddress;
        const value = ethers.ZeroHash;
        const initCode = ethers.solidityPacked(
            ["bytes", "bytes"],
            [ethers.solidityPacked(["bytes"], [bicAccountFactoryAddress]), initCallData]
        );
        const op = await createOp(smartWalletAddress, target, initCode, '0x', legacyTokenPaymasterAddress, 0n, user1, entryPoint);

        await entryPoint.handleOps([op] as any, admin.address);
        const smartWallet = await ethers.getContractAt("BicAccount", smartWalletAddress);
        // expect(await smartWallet.isAdmin(admin.address)).equal(true);
        // expect(await smartWallet.isAdmin(user1.address as any)).equal(true);
        // console.log('balance after create: ', (await bicTokenPaymaster.balanceOf(smartWalletAddress as any)).toString());
    })

    it('should be able to transfer tokens while create account', async () => {
        user1 = ethers.Wallet.createRandom() as Wallet
        user2 = ethers.Wallet.createRandom() as Wallet
        const smartWalletAddress1 = await bicAccountFactory.getFunction("getAddress")(user1.address as any, 0n as any);
        const smartWalletAddress2 = await bicAccountFactory.getFunction("getAddress")(user2.address as any, 0n as any);
        await bicTokenPaymaster.transfer(smartWalletAddress1 as any, ethers.parseEther('1000') as any);

        const initCallData = bicAccountFactory.interface.encodeFunctionData("createAccount", [user1.address as any, ethers.ZeroHash]);
        const target = bicAccountFactoryAddress;
        const value = ethers.ZeroHash;
        const initCode = ethers.solidityPacked(
            ["bytes", "bytes"],
            [ethers.solidityPacked(["bytes"], [bicAccountFactoryAddress]), initCallData]
        );
        const createWalletOp = await createOp(smartWalletAddress1, target, initCode, '0x', legacyTokenPaymasterAddress, 0n, user1, entryPoint);

        const transferOp = await createOp(
            smartWalletAddress1,
            legacyTokenPaymasterAddress,
            '0x',
            bicTokenPaymaster.interface.encodeFunctionData("transfer", [smartWalletAddress2, ethers.parseEther("100")]),
            legacyTokenPaymasterAddress,
            1n,
            user1,
            entryPoint
        );

        await entryPoint.handleOps([createWalletOp, transferOp] as any, admin.address);

        expect(await bicTokenPaymaster.balanceOf(smartWalletAddress2 as any)).equal(ethers.parseEther('100'));
        // console.log('balance after: ', (await bicTokenPaymaster.balanceOf(smartWalletAddress1 as any)).toString());
    });

    it('should be able to use oracle for calculate transaction fees', async () => {
        user1 = ethers.Wallet.createRandom() as Wallet
        user2 = ethers.Wallet.createRandom() as Wallet
        const smartWalletAddress1 = await bicAccountFactory.getFunction("getAddress")(user1.address as any, 0n as any);
        const smartWalletAddress2 = await bicAccountFactory.getFunction("getAddress")(user2.address as any, 0n as any);
        await bicTokenPaymaster.transfer(smartWalletAddress1 as any, ethers.parseEther('1000') as any);

        const initCallData = bicAccountFactory.interface.encodeFunctionData("createAccount", [user1.address as any, ethers.ZeroHash]);
        const target = bicAccountFactoryAddress;
        const value = ethers.ZeroHash;
        const initCode = ethers.solidityPacked(
            ["bytes", "bytes"],
            [ethers.solidityPacked(["bytes"], [bicAccountFactoryAddress]), initCallData]
        );
        const createWalletOp = await createOp(smartWalletAddress1, target, initCode, '0x', legacyTokenPaymasterAddress, 0n, user1, entryPoint);

        const transferOp = await createOp(
            smartWalletAddress1,
            legacyTokenPaymasterAddress,
            '0x',
            bicTokenPaymaster.interface.encodeFunctionData("transfer", [beneficiary, ethers.parseEther("0")]),
            legacyTokenPaymasterAddress,
            1n,
            user1,
            entryPoint
        );

        await entryPoint.handleOps([createWalletOp, transferOp] as any, admin.address);
        const balanceLeft1 = await bicTokenPaymaster.balanceOf(smartWalletAddress1 as any);

        const TestOracle = await ethers.getContractFactory("TestOracle");
        const testOracle = await TestOracle.deploy();
        await testOracle.waitForDeployment();
        const testOracleAddress = await testOracle.getAddress();
        await bicTokenPaymaster.setOracle(testOracleAddress as any);
        await bicTokenPaymaster.transfer(smartWalletAddress2 as any, ethers.parseEther('1000') as any);

        const initCallData2 = bicAccountFactory.interface.encodeFunctionData("createAccount", [user2.address as any, ethers.ZeroHash]);
        const target2 = bicAccountFactoryAddress;
        const value2 = ethers.ZeroHash;
        const initCode2 = ethers.solidityPacked(
            ["bytes", "bytes"],
            [ethers.solidityPacked(["bytes"], [bicAccountFactoryAddress]), initCallData2]
        );
        const createWalletOp2 = await createOp(smartWalletAddress2, target2, initCode2, '0x', legacyTokenPaymasterAddress, 0n, user2, entryPoint);

        const transferOp2 = await createOp(
            smartWalletAddress2,
            legacyTokenPaymasterAddress,
            '0x',
            bicTokenPaymaster.interface.encodeFunctionData("transfer", [beneficiary, ethers.parseEther("0")]),
            legacyTokenPaymasterAddress,
            1n,
            user2,
            entryPoint
        );

        await entryPoint.handleOps([createWalletOp2, transferOp2] as any, admin.address);

        // Owner can withdraw all BIC left from the paymaster
        const feeCollected = await bicTokenPaymaster.balanceOf(bicTokenPaymaster.target as any);
        expect(feeCollected).gt(1n)
        await bicTokenPaymaster.transferFrom(bicTokenPaymaster.target as any, randomAddress as any, feeCollected as any)
        const randomAddressBicBalance = await bicTokenPaymaster.balanceOf(randomAddress as any);
        expect(randomAddressBicBalance).equal(feeCollected);
    });

    it('should be able to transfer ownership to beneficiary', async () => {
        expect(await bicTokenPaymaster.owner()).equal(admin.address);
        await bicTokenPaymaster.transferOwnership(beneficiary as any);
        expect(await bicTokenPaymaster.owner()).equal(beneficiary);
    });

    it('should be able to block transfer from a address', async () => {
        await bicTokenPaymaster.transfer(walletToTestBlacklist.address as any, ethers.parseEther('1000') as any);
        await bicTokenPaymaster.addToBlockedList(walletToTestBlacklist.address as any);
        await expect(bicTokenPaymaster.connect(walletToTestBlacklist).transfer(beneficiary as any, ethers.parseEther('100') as any)).to.be.revertedWith('BicTokenPaymaster: sender is blocked');
        await bicTokenPaymaster.removeFromBlockedList(walletToTestBlacklist.address as any);
        await bicTokenPaymaster.connect(walletToTestBlacklist).transfer(beneficiary as any, ethers.parseEther('100') as any);
        expect(await bicTokenPaymaster.balanceOf(beneficiary as any)).equal(ethers.parseEther('100'));
    })

    it('even admin cannot transfer when paused', async () => {
        await bicTokenPaymaster.pause();
        await expect(bicTokenPaymaster.transfer(beneficiary as any, ethers.parseEther('100') as any)).to.be.revertedWith('BicTokenPaymaster: token transfer while paused');
        await bicTokenPaymaster.unpause();
        await bicTokenPaymaster.transfer(beneficiary as any, ethers.parseEther('100') as any);
        expect(await bicTokenPaymaster.balanceOf(beneficiary as any)).equal(ethers.parseEther('100'));
    })

});
