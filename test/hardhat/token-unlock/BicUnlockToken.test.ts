import { expect } from "chai";
import { ethers } from "hardhat";
import dayjs from "dayjs";
import dayDurationPlugin from "dayjs/plugin/duration";
dayjs.extend(dayDurationPlugin);
import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import {
  BicUnlockFactory,
  BicUnlockToken,
  TestERC20,
} from "../../../typechain-types";

describe("BicUnlockToken Test", function () {
  let bicUnlockToken: BicUnlockToken;
  let bicUnlockFactory: BicUnlockFactory;
  let testERC20: TestERC20;

  const DENOMINATOR = 10_000;
  const bufferStack = (p: number) => {
    return DENOMINATOR % p > 0 ? 1 : 0;
  };

  before(async () => {
    const BicUnlockFactory = await ethers.getContractFactory(
      "BicUnlockFactory"
    );
    bicUnlockFactory = await BicUnlockFactory.deploy();
    await bicUnlockFactory.waitForDeployment();
    const bicUnlockImplementation =
      await bicUnlockFactory.bicUnlockImplementation();

    const TestERC20 = await ethers.getContractFactory("TestERC20");
    testERC20 = await TestERC20.deploy();
    await testERC20.waitForDeployment();

    // approve Admin's token for Factory
    const approveTx = await testERC20.approve(
      bicUnlockFactory.target,
      ethers.MaxUint256
    );
    await approveTx.wait();
  });

  describe("Bic Unlock factory", () => {
    it("should create unlock successfully with beauty", async () => {
      const beneficiary = ethers.Wallet.createRandom(ethers.provider);
      const speedRateNumber = ethers.toBigInt(
        ethers.parseUnits("2".toString(), 3)
      );
      
      const duration = dayjs.duration(1, "weeks").asSeconds();
      const totalAmount = ethers.parseUnits("4000", 18);
      const stacksExpect = BigInt(
        Math.floor(DENOMINATOR / Number(speedRateNumber))
      );
      const totalDurations =
        (stacksExpect + BigInt(bufferStack(Number(speedRateNumber)))) *
        BigInt(duration);

      const unlockAddress = await bicUnlockFactory.computeUnlock(
        testERC20.target,
        totalAmount,
        beneficiary.address,
        duration,
        speedRateNumber,
      );
      const createTx = await bicUnlockFactory.createUnlock(
        testERC20.target,
        totalAmount,
        beneficiary.address,
        duration,
        speedRateNumber,
      );
      const receipt = await createTx.wait();

      bicUnlockToken = await ethers.getContractAt(
        "BicUnlockToken",
        unlockAddress
      );

      const start = await bicUnlockToken.start();
      const end = await bicUnlockToken.end();
      const maxRewardStacks = await bicUnlockToken.maxRewardStacks();
      const block = await ethers.provider.getBlock(receipt?.blockNumber || 0);

      expect(start).to.be.eq(block?.timestamp);
      expect(end).to.be.eq(start + totalDurations);
      expect(maxRewardStacks).to.be.eq(stacksExpect);

      const amountPerDuration = await bicUnlockToken.amountPerDuration();
      expect(amountPerDuration).to.be.eq(
        BigInt((Number(totalAmount) * Number(speedRateNumber)) / DENOMINATOR)
      );

      const balanceOfUnlockContract = await testERC20.balanceOf(
        bicUnlockToken.target
      );
      expect(balanceOfUnlockContract).to.lessThanOrEqual(totalAmount);
    });

    it("should create unlock successfully with odd number", async () => {
      const beneficiary = ethers.Wallet.createRandom(ethers.provider);
      const speedRateNumber = ethers.toBigInt(
        ethers.parseUnits("1.43".toString(), 3)
      );
      const duration = dayjs.duration(1, "weeks").asSeconds();
      const totalAmount = ethers.parseUnits("2000", 18);
      const stacksExpect = BigInt(
        Math.floor(DENOMINATOR / Number(speedRateNumber))
      );
      const totalDurations =
        (stacksExpect + BigInt(bufferStack(Number(speedRateNumber)))) *
        BigInt(duration);

      const unlockAddress = await bicUnlockFactory.computeUnlock(
        testERC20.target,
        totalAmount,
        beneficiary.address,
        duration,
        speedRateNumber,
      );
      const createTx = await bicUnlockFactory.createUnlock(
        testERC20.target,
        totalAmount,
        beneficiary.address,
        duration,
        speedRateNumber,
      );
      const receipt = await createTx.wait();

      bicUnlockToken = await ethers.getContractAt(
        "BicUnlockToken",
        unlockAddress
      );

      const start = await bicUnlockToken.start();
      const end = await bicUnlockToken.end();
      const maxRewardStacks = await bicUnlockToken.maxRewardStacks();
      const block = await ethers.provider.getBlock(receipt?.blockNumber || 0);

      expect(start).to.be.eq(block?.timestamp);
      expect(end).to.be.eq(start + totalDurations);
      expect(maxRewardStacks).to.be.eq(stacksExpect);

      const amountPerDuration = await bicUnlockToken.amountPerDuration();
      expect(amountPerDuration).to.be.eq(
        BigInt((Number(totalAmount) * Number(speedRateNumber)) / DENOMINATOR)
      );

      const balanceOfUnlockContract = await testERC20.balanceOf(
        bicUnlockToken.target
      );
      expect(balanceOfUnlockContract).to.lessThanOrEqual(totalAmount);
    });
  });

  describe("Bic Unlock contract", () => {
    describe("Test with beauty number", async () => {
      const beneficiary = ethers.Wallet.createRandom(ethers.provider);
      const duration = dayjs.duration(1, "weeks").asSeconds();
      const speedRateNumber = ethers.toBigInt(
        ethers.parseUnits("0.5".toString(), 3)
      );
      const totalAmount = "3000";
      const totalAmountInDecimal = ethers.parseUnits(totalAmount, 18);
      const stacksExpect = BigInt(
        Math.floor(DENOMINATOR / Number(speedRateNumber))
      );
      const totalDurations =
        (stacksExpect + BigInt(bufferStack(Number(speedRateNumber)))) *
        BigInt(duration);

      before(async () => {
        const unlockAddress = await bicUnlockFactory.computeUnlock(
          testERC20.target,
          totalAmountInDecimal,
          beneficiary.address,
          duration,
          speedRateNumber,
        );
        const createTx = await bicUnlockFactory.createUnlock(
          testERC20.target,
          totalAmountInDecimal,
          beneficiary.address,
          duration,
          speedRateNumber,
        );
        const receipt = await createTx.wait();

        bicUnlockToken = await ethers.getContractAt(
          "BicUnlockToken",
          unlockAddress
        );

        const start = await bicUnlockToken.start();
        const end = await bicUnlockToken.end();
        const maxRewardStacks = await bicUnlockToken.maxRewardStacks();
        const block = await ethers.provider.getBlock(receipt?.blockNumber || 0);

        expect(start).to.be.eq(block?.timestamp);
        expect(end).to.be.eq(start + totalDurations);
        expect(maxRewardStacks).to.be.eq(stacksExpect);

        const amountPerDuration = await bicUnlockToken.amountPerDuration();
        const amountPerDurationExpect = BigInt(
          ethers.parseUnits(
            String(
              (Number(totalAmount) * Number(speedRateNumber)) / DENOMINATOR
            ),
            18
          )
        );
        expect(amountPerDuration).to.be.eq(amountPerDurationExpect);

        const balanceOfUnlockContract = await testERC20.balanceOf(
          bicUnlockToken.target
        );
        expect(balanceOfUnlockContract).to.eq(
          ethers.toBigInt(totalAmountInDecimal)
        );
      });

      it("should not unlock if not passed durations", async () => {
        const releasableData = await bicUnlockToken.releasable();
        expect(releasableData[0]).to.be.eq(BigInt(0));
        expect(releasableData[1]).to.be.eq(BigInt(0));
        const vestTx = bicUnlockToken.release();
        await expect(vestTx).revertedWith(
          "VestingWallet: no tokens to release"
        );
      });

      it("should unlock if passed 4 durations", async () => {
        const passedDuration = 4;
        const lastAtCurrentRewardStacksPrev =
          await bicUnlockToken.lastAtCurrentStack();
        const amountPerDuration = await bicUnlockToken.amountPerDuration();
        const beneficiary = await bicUnlockToken.beneficiary();


        const amountExpect = amountPerDuration * BigInt(passedDuration);
        const timePassed =
          lastAtCurrentRewardStacksPrev +
          BigInt(dayjs.duration(passedDuration, "weeks").asSeconds());
        await helpers.time.increaseTo(timePassed + BigInt(1));

        const releasableData = await bicUnlockToken.releasable();
        expect(releasableData[0]).to.be.eq(amountExpect);
        expect(releasableData[1]).to.be.eq(BigInt(passedDuration));

        // Previous
        const currentRewardStacksPrev = await bicUnlockToken.currentRewardStacks();
        const beneficiaryBalancePrev = await testERC20.balanceOf(
          beneficiary
        );  

        const vestTx = bicUnlockToken.release();
        await expect(vestTx)
          .emit(bicUnlockToken, "ERC20Released")
          .emit(testERC20, "Transfer");
        await (await vestTx).wait();

        // Next
        const beneficiaryBalanceNext = await testERC20.balanceOf(
          beneficiary
        );
        expect(beneficiaryBalanceNext).to.be.eq(
          beneficiaryBalancePrev + amountExpect
        );

        const currentRewardStacksNext = await bicUnlockToken.currentRewardStacks();
        expect(currentRewardStacksNext).to.be.eq(
          currentRewardStacksPrev + BigInt(passedDuration)
        );

        const lastAtcurrentRewardStacksNext =
          await bicUnlockToken.lastAtCurrentStack();
        expect(lastAtcurrentRewardStacksNext).to.be.eq(
          lastAtCurrentRewardStacksPrev + BigInt(passedDuration) * BigInt(duration)
        );
      });

      it("should unlock if passed more 4 durations", async () => {
        const passedDuration = 4;
        const lastAtCurrentRewardStacksPrev =
          await bicUnlockToken.lastAtCurrentStack();
        const amountPerDuration = await bicUnlockToken.amountPerDuration();
        const beneficiary = await bicUnlockToken.beneficiary();


        const amountExpect = amountPerDuration * BigInt(passedDuration);
        const timePassed =
          lastAtCurrentRewardStacksPrev +
          BigInt(dayjs.duration(passedDuration, "weeks").asSeconds());
        await helpers.time.increaseTo(timePassed + BigInt(1));

        const releasableData = await bicUnlockToken.releasable();
        expect(releasableData[0]).to.be.eq(amountExpect);
        expect(releasableData[1]).to.be.eq(BigInt(passedDuration));

        // Previous
        const currentRewardStacksPrev = await bicUnlockToken.currentRewardStacks();
        const beneficiaryBalancePrev = await testERC20.balanceOf(
          beneficiary
        );  

        const vestTx = bicUnlockToken.release();
        await expect(vestTx)
          .emit(bicUnlockToken, "ERC20Released")
          .emit(testERC20, "Transfer");
        await (await vestTx).wait();

        // Next
        const beneficiaryBalanceNext = await testERC20.balanceOf(
          beneficiary
        );
        expect(beneficiaryBalanceNext).to.be.eq(
          beneficiaryBalancePrev + amountExpect
        );

        const currentRewardStacksNext = await bicUnlockToken.currentRewardStacks();
        expect(currentRewardStacksNext).to.be.eq(
          currentRewardStacksPrev + BigInt(passedDuration)
        );

        const lastAtcurrentRewardStacksNext =
          await bicUnlockToken.lastAtCurrentStack();
        expect(lastAtcurrentRewardStacksNext).to.be.eq(
          lastAtCurrentRewardStacksPrev + BigInt(passedDuration) * BigInt(duration)
        );
      });

      it("should trace log with 2 claim times", async () => {
        const startBlock = 1; // The block number to start searching for events
        const endBlock = "latest";
        const filter = bicUnlockToken.filters.ERC20Released();
        console.log("🚀 ~ it ~ filter:", filter.fragment)
        const events = await bicUnlockToken.queryFilter(filter, startBlock, endBlock);
        const released = events.map((event) => {
          return event.args;
        })
        console.log("🚀 ~ released ~ released:", released)
        expect(events.length).to.be.eq(2);
      });

      it("should unlock if passed fully durations", async () => {
        const lastAtCurrentRewardStacksPrev =
          await bicUnlockToken.lastAtCurrentStack();
        const amountPerDuration = await bicUnlockToken.amountPerDuration();
        const maxRewardStacks = await bicUnlockToken.maxRewardStacks();
        const currentRewardStacks = await bicUnlockToken.currentRewardStacks();

        const passedDuration = maxRewardStacks - currentRewardStacks;

        const amountExpect = amountPerDuration * BigInt(passedDuration);
        const amountRemainExpect =
          ethers.toBigInt(totalAmountInDecimal) -
          amountPerDuration * stacksExpect;

        const timePassed =
          lastAtCurrentRewardStacksPrev +
          BigInt(dayjs.duration(Number(passedDuration), "weeks").asSeconds());
        await helpers.time.increaseTo(timePassed);

        const releasableData = await bicUnlockToken.releasable();
        expect(releasableData[0]).to.be.eq(amountExpect);
        expect(releasableData[1]).to.be.eq(BigInt(passedDuration));

        // Previous
        const currentRewardStacksPrev = await bicUnlockToken.currentRewardStacks();
        const beneficiaryBalancePrev = await testERC20.balanceOf(
          beneficiary.address
        );

        const vestTx = bicUnlockToken.release();
        await expect(vestTx).emit(bicUnlockToken, "ERC20Released");
        await (await vestTx).wait();

        // Next
        const beneficiaryBalanceNext = await testERC20.balanceOf(
          beneficiary.address
        );
        expect(beneficiaryBalanceNext).to.be.eq(
          beneficiaryBalancePrev + amountExpect
        );

        const currentRewardStacksNext = await bicUnlockToken.currentRewardStacks();
        expect(currentRewardStacksNext).to.be.eq(
          currentRewardStacksPrev + BigInt(passedDuration)
        );

        const unlockContractBalanceNext = await testERC20.balanceOf(
          bicUnlockToken.target
        );
        expect(unlockContractBalanceNext).to.be.eq(amountRemainExpect);

        const lastAtcurrentRewardStacksNext =
          await bicUnlockToken.lastAtCurrentStack();
        expect(lastAtcurrentRewardStacksNext).to.be.eq(
          lastAtCurrentRewardStacksPrev + BigInt(passedDuration) * BigInt(duration)
        );
      });
    });

    describe("Test with odd number", async () => {
      const beneficiary = ethers.Wallet.createRandom(ethers.provider);
      const duration = dayjs.duration(1, "weeks").asSeconds();
      const speedRateNumber = ethers.toBigInt(
        ethers.parseUnits("1.5".toString(), 3)
      );

      const totalAmount = "3333";
      const totalAmountInDecimal = ethers.parseUnits(totalAmount, 18);

      const stacksExpect = BigInt(
        Math.floor(DENOMINATOR / Number(speedRateNumber))
      );
      const totalDurations =
        (stacksExpect + BigInt(bufferStack(Number(speedRateNumber)))) *
        BigInt(duration);

      before(async () => {
        const unlockAddress = await bicUnlockFactory.computeUnlock(
          testERC20.target,
          totalAmountInDecimal,
          beneficiary.address,
          duration,
          speedRateNumber,
        );
        const createTx = await bicUnlockFactory.createUnlock(
          testERC20.target,
          totalAmountInDecimal,
          beneficiary.address,
          duration,
          speedRateNumber,
        );
        const receipt = await createTx.wait();

        bicUnlockToken = await ethers.getContractAt(
          "BicUnlockToken",
          unlockAddress
        );

        const start = await bicUnlockToken.start();
        const end = await bicUnlockToken.end();
        const maxRewardStacks = await bicUnlockToken.maxRewardStacks();
        const block = await ethers.provider.getBlock(receipt?.blockNumber || 0);

        expect(start).to.be.eq(block?.timestamp);
        expect(end).to.be.eq(start + totalDurations);
        expect(maxRewardStacks).to.be.eq(stacksExpect);

        const amountPerDuration = await bicUnlockToken.amountPerDuration();
        const amountPerDurationExpect = ethers.toBigInt(
          ethers.parseUnits(
            String(
              (Number(totalAmount) * Number(speedRateNumber)) / DENOMINATOR
            ),
            18
          )
        );

        expect(amountPerDuration).to.be.eq(amountPerDurationExpect);

        const balanceOfUnlockContract = await testERC20.balanceOf(
          bicUnlockToken.target
        );
        expect(balanceOfUnlockContract).to.lessThanOrEqual(
          ethers.toBigInt(totalAmountInDecimal)
        );
      });

      it("should not unlock if not passed durations", async () => {
        const releasableData = await bicUnlockToken.releasable();
        expect(releasableData[0]).to.be.eq(BigInt(0));
        expect(releasableData[1]).to.be.eq(BigInt(0));
        const vestTx = bicUnlockToken.release();
        await expect(vestTx).revertedWith(
          "VestingWallet: no tokens to release"
        );
      });

      it("should unlock if passed 4 durations", async () => {
        const passedDuration = 4;
        const lastAtCurrentRewardStacksPrev =
          await bicUnlockToken.lastAtCurrentStack();
        const amountPerDuration = await bicUnlockToken.amountPerDuration();
        const beneficiary = await bicUnlockToken.beneficiary();

        const amountExpect = amountPerDuration * BigInt(passedDuration);
        const timePassed =
          lastAtCurrentRewardStacksPrev +
          BigInt(dayjs.duration(passedDuration, "weeks").asSeconds());
        await helpers.time.increaseTo(timePassed + BigInt(1));

        const releasableData = await bicUnlockToken.releasable();
        expect(releasableData[0]).to.be.eq(amountExpect);
        expect(releasableData[1]).to.be.eq(BigInt(passedDuration));

        // Previous
        const currentRewardStacksPrev = await bicUnlockToken.currentRewardStacks();
        const beneficiaryBalancePrev = await testERC20.balanceOf(
          beneficiary
        );

        const vestTx = bicUnlockToken.release();
        await expect(vestTx).emit(bicUnlockToken, "ERC20Released");
        await (await vestTx).wait();

        // Next
        const beneficiaryBalanceNext = await testERC20.balanceOf(
          beneficiary
        );
        expect(beneficiaryBalanceNext).to.be.eq(
          beneficiaryBalancePrev + amountExpect
        );

        const currentRewardStacksNext = await bicUnlockToken.currentRewardStacks();
        expect(currentRewardStacksNext).to.be.eq(
          currentRewardStacksPrev + BigInt(passedDuration)
        );

        const lastAtcurrentRewardStacksNext =
          await bicUnlockToken.lastAtCurrentStack();
        expect(lastAtcurrentRewardStacksNext).to.be.eq(
          lastAtCurrentRewardStacksPrev + BigInt(passedDuration) * BigInt(duration)
        );
      });

      it("should unlock if passed fully durations", async () => {
        const lastAtCurrentRewardStacksPrev =
          await bicUnlockToken.lastAtCurrentStack();
        const amountPerDuration = await bicUnlockToken.amountPerDuration();
        const maxRewardStacks = await bicUnlockToken.maxRewardStacks();
        const currentRewardStacks = await bicUnlockToken.currentRewardStacks();

        const passedDuration = maxRewardStacks - currentRewardStacks;

        const amountExpect = amountPerDuration * BigInt(passedDuration);
        const amountRemainExpect =
          ethers.toBigInt(totalAmountInDecimal) -
          amountPerDuration * stacksExpect;

        const timePassed =
          lastAtCurrentRewardStacksPrev +
          BigInt(dayjs.duration(Number(passedDuration), "weeks").asSeconds());
        await helpers.time.increaseTo(timePassed);

        const releasableData = await bicUnlockToken.releasable();
        expect(releasableData[0]).to.be.eq(amountExpect);
        expect(releasableData[1]).to.be.eq(BigInt(passedDuration));

        // Previous
        const currentRewardStacksPrev = await bicUnlockToken.currentRewardStacks();
        const beneficiaryBalancePrev = await testERC20.balanceOf(
          beneficiary.address
        );

        const vestTx = bicUnlockToken.release();
        await expect(vestTx).emit(bicUnlockToken, "ERC20Released");
        await (await vestTx).wait();

        // Next
        const beneficiaryBalanceNext = await testERC20.balanceOf(
          beneficiary.address
        );
        expect(beneficiaryBalanceNext).to.be.eq(
          beneficiaryBalancePrev + amountExpect
        );

        const currentRewardStacksNext = await bicUnlockToken.currentRewardStacks();
        expect(currentRewardStacksNext).to.be.eq(
          currentRewardStacksPrev + BigInt(passedDuration)
        );

        const unlockContractBalanceNext = await testERC20.balanceOf(
          bicUnlockToken.target
        );
        expect(unlockContractBalanceNext).to.be.eq(amountRemainExpect);

        const lastAtcurrentRewardStacksNext =
          await bicUnlockToken.lastAtCurrentStack();
        expect(lastAtcurrentRewardStacksNext).to.be.eq(
          lastAtCurrentRewardStacksPrev + BigInt(passedDuration) * BigInt(duration)
        );
      });

      it("should unlock remain amount if passed end time", async () => {
        const lastAtCurrentRewardStacksPrev =
          await bicUnlockToken.lastAtCurrentStack();
        const amountPerDuration = await bicUnlockToken.amountPerDuration();
        const end = await bicUnlockToken.end();
        const maxRewardStacks = await bicUnlockToken.maxRewardStacks();
        const currentRewardStacks = await bicUnlockToken.currentRewardStacks();

        const passedDuration = maxRewardStacks - currentRewardStacks;

        const amountRemainExpect =
          ethers.toBigInt(totalAmountInDecimal) -
          amountPerDuration * stacksExpect;

        await helpers.time.increaseTo(end + BigInt(1));

        const releasableData = await bicUnlockToken.releasable();
        expect(releasableData[0]).to.be.greaterThanOrEqual(amountRemainExpect);
        expect(releasableData[1]).to.be.eq(BigInt(passedDuration));

        // Previous
        const currentRewardStacksPrev = await bicUnlockToken.currentRewardStacks();
        const beneficiaryBalancePrev = await testERC20.balanceOf(
          beneficiary.address
        );

        const vestTx = bicUnlockToken.release();
        await expect(vestTx).emit(bicUnlockToken, "ERC20Released");
        await (await vestTx).wait();

        // Next
        const beneficiaryBalanceNext = await testERC20.balanceOf(
          beneficiary.address
        );
        expect(beneficiaryBalanceNext).to.be.eq(
          beneficiaryBalancePrev + amountRemainExpect
        );

        const currentRewardStacksNext = await bicUnlockToken.currentRewardStacks();
        expect(currentRewardStacksNext).to.be.eq(
          currentRewardStacksPrev + BigInt(passedDuration)
        );

        const unlockContractBalanceNext = await testERC20.balanceOf(
          bicUnlockToken.target
        );
        expect(unlockContractBalanceNext).to.be.eq(BigInt(0));

        const lastAtcurrentRewardStacksNext =
          await bicUnlockToken.lastAtCurrentStack();
        expect(lastAtcurrentRewardStacksNext).to.be.eq(
          lastAtCurrentRewardStacksPrev + BigInt(passedDuration) * BigInt(duration)
        );
      });
    });
  });
});
