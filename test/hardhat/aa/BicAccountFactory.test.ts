import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { BicPermissions, BicAccountFactory, BicAccount, EntryPoint } from "../../../typechain-types";

describe("BicAccountFactory", function () {
  let bicPermissionsEnumerable: BicPermissions;
  let bicFactory: BicAccountFactory;
  let entryPoint: EntryPoint;


  // constants

  async function getEOAAccounts() {
    const [deployer, wallet1, wallet2, wallet3] = await ethers.getSigners();

    return { deployer, wallet1, wallet2, wallet3 };
  }

  before(async () => {
    const BicPermissionsEnumerable = await ethers.getContractFactory("BicPermissions");
    const BicAccountFactory = await ethers.getContractFactory("BicAccountFactory");
    const EntryPoint = await ethers.getContractFactory("EntryPoint");
    bicPermissionsEnumerable = await BicPermissionsEnumerable.deploy();
    await bicPermissionsEnumerable.waitForDeployment();

    entryPoint = await EntryPoint.deploy();
    await entryPoint.waitForDeployment();

    bicFactory = await BicAccountFactory.deploy(entryPoint.target, bicPermissionsEnumerable.target);
    await bicFactory.waitForDeployment();

    // const accountImplementation = await bicFactory.accountImplementation();
    const permissions = await bicFactory.permissions();

    // expect(accountImplementation.toLowerCase()).be.eq(bicPermissionsEnumerable.target.toString().toLowerCase());
    expect(permissions.toLowerCase()).be.eq(bicPermissionsEnumerable.target.toString().toLowerCase());

  });


  it("Should BIC Account created the same with getAddress()", async function () {
    const salt = 123;
    const { wallet1 } = await getEOAAccounts();
    const bicAddressComputed = await bicFactory.getAddress(wallet1.address, salt);
    const createTx = await bicFactory.createAccount(wallet1.address, salt);
    const createReceipt = await createTx.wait();

    expect(createReceipt?.to?.toLowerCase()).be.eq(bicAddressComputed.toLowerCase());

    const bicAccount = await ethers.getContractAt("BicAccount", bicAddressComputed);

    const permissions = await bicFactory.permissions();
    expect((await bicAccount.permissions()).toLowerCase()).be.eq(permissions.toLowerCase());
  });

  it("Should BIC Account return current account when tried to creatAccount more than one", async() => {
    const salt = 123;
    const { wallet1 } = await getEOAAccounts();

    const createTx = await bicFactory.createAccount(wallet1.address, salt);
    const createReceipt = await createTx.wait();

    const secondCreateTx = await bicFactory.createAccount(wallet1.address, salt);
    const secondCreateReceipt = await secondCreateTx.wait();

    expect(createReceipt?.to?.toLowerCase()).be.eq(secondCreateReceipt?.to?.toLowerCase());
  })

});
