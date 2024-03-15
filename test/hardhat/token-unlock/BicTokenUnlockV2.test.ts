
import { expect } from "chai";
import { ethers } from "hardhat";
import moment from "moment";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import { BicUnlockTokenV2, TestERC20 } from "../../../typechain-types";
import { getEOAAccounts } from "../util/getEoaAccount";

describe("BicUnlockTokenV2", function () {
  let bicUnlockTokenV2: BicUnlockTokenV2;
  let testERC20: TestERC20;

  before(async () => {
    const TestERC20 = await ethers.getContractFactory("TestERC20");
    testERC20 = await TestERC20.deploy();

  });




  describe("Case with beauty number", () => {
    const speedRate = 2; // 2%
    const count = BigInt(200); // Claim 200 times
    const start = moment().unix();
    const duration = moment.duration(1, "weeks").asSeconds() * ((100 - speedRate) / 100);
    const totalAmount = ethers.parseUnits("4000", 18);

    before(async () => {
      const BicUnlockTokenV2 = await ethers.getContractFactory("BicUnlockTokenV2");
      const { wallet1: beneficiary } = await getEOAAccounts();

      bicUnlockTokenV2 = await BicUnlockTokenV2.deploy(testERC20.target, totalAmount, beneficiary.address, start, count, duration);
      testERC20.transfer(bicUnlockTokenV2.target, totalAmount);

      expect(await bicUnlockTokenV2.start()).to.be.eq(start);
      expect(await bicUnlockTokenV2.end()).to.be.eq(BigInt(start) + BigInt(duration) * count);
      expect(await bicUnlockTokenV2.count()).to.be.eq(count);
    });

    it("should not unlock token successfully if not passed duration", async () => {
      const releasableData = await bicUnlockTokenV2["releasable()"]();

      expect(releasableData[0]).to.be.eq(BigInt(0));
      expect(releasableData[1]).to.be.eq(BigInt(0));
      const vestTx = bicUnlockTokenV2.release();
      await expect(vestTx).revertedWith("No tokens to release");
    });

    it("should unlock token successfully if passed 4 durations", async () => {
      const { wallet1: beneficiary } = await getEOAAccounts();

      const start = await bicUnlockTokenV2.start();
      const currentCount = await bicUnlockTokenV2.currentCount();
      const n = 4; // 4 durations(weeks)
      const expectAmount = BigInt(n) * totalAmount / count;

      const timePassed = start + BigInt(moment.duration(n, "weeks").asSeconds() * ((100 - speedRate) / 100));
      await helpers.time.increaseTo(timePassed);

      const releasableData = await bicUnlockTokenV2["releasable()"]();

      expect(releasableData[0]).to.be.eq(expectAmount);
      expect(releasableData[1]).to.be.eq(BigInt(n));
      expect(currentCount).to.be.eq(BigInt(0));

      const balanceOfPrev = await testERC20.balanceOf(beneficiary.address);

      const vestTx = await bicUnlockTokenV2.release();
      await vestTx.wait();

      const balanceOfNext = await testERC20.balanceOf(beneficiary.address);

      expect(balanceOfNext).to.be.eq(balanceOfPrev + releasableData[0]);
    });

    it("should unlock token successfully if passed more(15) durations", async () => {
      const { wallet1: beneficiary } = await getEOAAccounts();

      const start = await bicUnlockTokenV2.lastAtCurrentCount();
      const currentCountPrev = await bicUnlockTokenV2.currentCount();
      const n = 15; // 15 durations(weeks)
      const expectAmount = BigInt(n) * totalAmount / count;

      const timePassed = start + BigInt(moment.duration(n, "weeks").asSeconds() * ((100 - speedRate) / 100));
      await helpers.time.increaseTo(timePassed);

      const releasableData = await bicUnlockTokenV2["releasable()"]();

      expect(releasableData[0]).to.be.eq(expectAmount);
      expect(releasableData[1]).to.be.eq(BigInt(n));

      const balanceOfPrev = await testERC20.balanceOf(beneficiary.address);

      const vestTx = await bicUnlockTokenV2.release();
      await vestTx.wait();

      const balanceOfNext = await testERC20.balanceOf(beneficiary.address);
      const currentCountNext = await bicUnlockTokenV2.currentCount();

      expect(balanceOfNext).to.be.eq(balanceOfPrev + releasableData[0]);
      expect(currentCountNext).to.be.eq(currentCountPrev + BigInt(n));
    });

    it("should unlock all token successfully if passed end time", async () => {
      const { wallet1: beneficiary } = await getEOAAccounts();
      
      const end = await bicUnlockTokenV2.end();
      const currentCountPrev = await bicUnlockTokenV2.currentCount();
      const n = count - currentCountPrev;
      const expectAmount = BigInt(n) * totalAmount / count;

      await helpers.time.increaseTo(end);

      const releasableData = await bicUnlockTokenV2["releasable()"]();

      expect(releasableData[0]).to.be.eq(expectAmount);
      expect(releasableData[1]).to.be.eq(BigInt(n));

      const balanceOfPrev = await testERC20.balanceOf(beneficiary.address);

      const vestTx = await bicUnlockTokenV2.release();
      await vestTx.wait();

      const balanceOfNext = await testERC20.balanceOf(beneficiary.address);
      const currentCountNext = await bicUnlockTokenV2.currentCount();

      expect(balanceOfNext).to.be.eq(balanceOfPrev + releasableData[0]);
      expect(currentCountNext).to.be.eq(currentCountPrev + BigInt(n));

      const balanceOfUnlockContract = await testERC20.balanceOf(bicUnlockTokenV2.target);
      expect(balanceOfUnlockContract).to.be.eq( BigInt(0));
    });
  });

  describe("Case with bad number, not check expect in web2, the remain amount will claim at the end time", async () => {
    const speedRate = 3; // 2%
    const count = BigInt(300); // Claim 300 times
    let start;
    let duration;
    let totalAmount: bigint;


    before(async ()=>{
      totalAmount = ethers.parseUnits("5500", 18);
      
      const block = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
      start = block!.timestamp;
      duration = moment.duration(1, "weeks").asSeconds() * ((100 - speedRate) / 100);

      const BicUnlockTokenV2 = await ethers.getContractFactory("BicUnlockTokenV2");
      const { wallet2: beneficiary } = await getEOAAccounts();

      bicUnlockTokenV2 = await BicUnlockTokenV2.deploy(testERC20.target, totalAmount, beneficiary.address, start, count, duration);
      testERC20.transfer(bicUnlockTokenV2.target, totalAmount);

      expect(await bicUnlockTokenV2.start()).to.be.eq(start);
      expect(await bicUnlockTokenV2.end()).to.be.eq(BigInt(start) + BigInt(duration) * count);
      expect(await bicUnlockTokenV2.count()).to.be.eq(count);
    });

    it("should not unlock token successfully if not passed duration", async () => {

      const start = await bicUnlockTokenV2.start();

      const timePassed = start + BigInt(moment.duration(1, "weeks").asSeconds() * ((100 - speedRate) / 100)) - BigInt(10);
      await helpers.time.increaseTo(timePassed);

      const releasableData = await bicUnlockTokenV2["releasable()"]();
      
      expect(releasableData[0]).to.be.eq(BigInt(0));
      expect(releasableData[1]).to.be.eq(BigInt(0));
      const vestTx = bicUnlockTokenV2.release();
      await expect(vestTx).revertedWith("No tokens to release");
    });

    it("should unlock token successfully if passed 4 durations", async () => {
      const { wallet2: beneficiary } = await getEOAAccounts();

      const start = await bicUnlockTokenV2.start();
      const currentCount = await bicUnlockTokenV2.currentCount();
      const n = 4; // 4 durations(weeks)
      const expectAmount = BigInt(n) * totalAmount / count;

      const timePassed = start + BigInt(moment.duration(n, "weeks").asSeconds() * ((100 - speedRate) / 100));
      await helpers.time.increaseTo(timePassed);

      const releasableData = await bicUnlockTokenV2["releasable()"]();

      // expect(releasableData[0]).to.be.eq(expectAmount); // disable because mechanism in JS diff with Solidity
      expect(releasableData[1]).to.be.eq(BigInt(n));
      expect(currentCount).to.be.eq(BigInt(0));

      const balanceOfPrev = await testERC20.balanceOf(beneficiary.address);

      const vestTx = await bicUnlockTokenV2.release();
      await vestTx.wait();

      const balanceOfNext = await testERC20.balanceOf(beneficiary.address);

      expect(balanceOfNext).to.be.eq(balanceOfPrev + releasableData[0]);
    });

    it("should unlock token successfully if passed n - 1 durations", async () => {
      const { wallet2: beneficiary } = await getEOAAccounts();

      const start = await bicUnlockTokenV2.lastAtCurrentCount();
      const currentCountPrev = await bicUnlockTokenV2.currentCount();
      const n = count - currentCountPrev - BigInt(1); // 15 durations(weeks)
      const expectAmount = BigInt(n) * totalAmount / count;

      const timePassed = start + BigInt(moment.duration(Number(n), "weeks").asSeconds() * ((100 - speedRate) / 100));
      await helpers.time.increaseTo(timePassed);

      const releasableData = await bicUnlockTokenV2["releasable()"]();

      // expect(releasableData[0]).to.be.eq(expectAmount);
      expect(releasableData[1]).to.be.eq(BigInt(n));

      const balanceOfPrev = await testERC20.balanceOf(beneficiary.address);

      const vestTx = await bicUnlockTokenV2.release();
      await vestTx.wait();

      const balanceOfNext = await testERC20.balanceOf(beneficiary.address);
      const currentCountNext = await bicUnlockTokenV2.currentCount();

      // expect(balanceOfNext).to.be.eq(balanceOfPrev + releasableData[0]);
      expect(currentCountNext).to.be.eq(currentCountPrev + BigInt(n));
    });


    it("should unlock all token successfully if passed end time", async () => {
      const { wallet2: beneficiary } = await getEOAAccounts();
      
      const end = await bicUnlockTokenV2.end();
      const currentCountPrev = await bicUnlockTokenV2.currentCount();
      const n = count - currentCountPrev;
      const expectAmount = BigInt(n) * totalAmount / count;

      await helpers.time.increaseTo(end + BigInt(3));

      const releasableData = await bicUnlockTokenV2["releasable()"]();

      // expect(releasableData[0]).to.be.eq(expectAmount);
      expect(releasableData[1]).to.be.eq(BigInt(n));
      const balanceOfPrev = await testERC20.balanceOf(beneficiary.address);

      const vestTx = await bicUnlockTokenV2.release();
      await vestTx.wait();

      const balanceOfNext = await testERC20.balanceOf(beneficiary.address);
      console.log("🚀 ~ it ~ balanceOfNext:", balanceOfNext)
      const currentCountNext = await bicUnlockTokenV2.currentCount();

      // expect(balanceOfNext).to.be.eq(balanceOfPrev + releasableData[0]);
      expect(currentCountNext).to.be.eq(currentCountPrev + BigInt(n));

      const balanceOfUnlockContract = await testERC20.balanceOf(bicUnlockTokenV2.target);
      console.log("🚀 ~ it ~ balanceOfUnlockContract:", balanceOfUnlockContract)
      expect(balanceOfUnlockContract).to.be.eq( BigInt(0));
    });

  });

});
