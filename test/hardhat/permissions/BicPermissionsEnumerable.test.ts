import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BicPermissions } from "../../../typechain-types";

describe("BicPermissions", function () {
  let bicPermissionsEnumerable: BicPermissions;

  // constants
  const noPermissionError = (adminRole: string, account: string)=> `AccessControl: account ${account} is missing role ${adminRole}`

  async function getEOAAccounts() {
    const [deployer, wallet1, wallet2] = await ethers.getSigners();

    return { deployer, wallet1, wallet2 };
  }

  before(async () => {
    const BicPermissionsEnumerable = await ethers.getContractFactory("BicPermissions");
    bicPermissionsEnumerable = await BicPermissionsEnumerable.deploy();
  });



  it("Should set the right roles", async function () {
    const { deployer } = await getEOAAccounts();

    const DEFAULT_ADMIN_ROLE = await bicPermissionsEnumerable.DEFAULT_ADMIN_ROLE();
    const RECOVERY_ROLE = await bicPermissionsEnumerable.RECOVERY_ROLE();

    const hasAdminRole = await bicPermissionsEnumerable.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    const hasRecoveryRole = await bicPermissionsEnumerable.hasRole(RECOVERY_ROLE, deployer.address);
    const adminOfRecoveryRole = await bicPermissionsEnumerable.getRoleAdmin(RECOVERY_ROLE);



    expect(hasAdminRole).to.equal(true);
    expect(hasRecoveryRole).to.equal(true);
    expect(adminOfRecoveryRole).to.equal(DEFAULT_ADMIN_ROLE);
  });


  describe("Grant and Revoke role", () => {
    it("Should grant role success", async function () {
      const { deployer, wallet1 } = await getEOAAccounts();

      const RECOVERY_ROLE = await bicPermissionsEnumerable.RECOVERY_ROLE();

      const walletGranted = wallet1.address;

      const recoveryRoleCountPrev = await bicPermissionsEnumerable.getRoleMemberCount(RECOVERY_ROLE);

      // Grant role
      const grantTx = await bicPermissionsEnumerable.grantRole(RECOVERY_ROLE, walletGranted);
      await grantTx.wait();

      const hasRecoveryRole = await bicPermissionsEnumerable.hasRole(RECOVERY_ROLE, walletGranted);
      const recoveryRoleCountNext = await bicPermissionsEnumerable.getRoleMemberCount(RECOVERY_ROLE);
      const memberLatestGrant = await bicPermissionsEnumerable.getRoleMember(RECOVERY_ROLE, BigInt(recoveryRoleCountNext) - BigInt(1));

      expect(hasRecoveryRole).to.equal(true);
      expect(walletGranted).to.equal(memberLatestGrant);
      expect(Number(recoveryRoleCountPrev) + 1).to.equal(Number(recoveryRoleCountNext));
    });

    it("Should grant role failed with missing the admin-role grant role", async function () {
      const { wallet1, wallet2 } = await getEOAAccounts();

      const DEFAULT_ADMIN_ROLE = await bicPermissionsEnumerable.DEFAULT_ADMIN_ROLE();
      const RECOVERY_ROLE = await bicPermissionsEnumerable.RECOVERY_ROLE();

      const walletGranted = wallet1.address;
      // Grant role with failed

      const revokeTx = bicPermissionsEnumerable.connect(wallet2).grantRole(RECOVERY_ROLE, walletGranted);
      await expect(revokeTx).to.be.revertedWith(noPermissionError(DEFAULT_ADMIN_ROLE, wallet2.address.toLowerCase()));

    });


    it("Should revoke role success", async function () {
      const { wallet1 } = await getEOAAccounts();

      const RECOVERY_ROLE = await bicPermissionsEnumerable.RECOVERY_ROLE();

      const walletGranted = wallet1.address;

      const recoveryRoleCountPrev = await bicPermissionsEnumerable.getRoleMemberCount(RECOVERY_ROLE);

      // Revoke role
      const revokeTx = await bicPermissionsEnumerable.revokeRole(RECOVERY_ROLE, walletGranted);
      await revokeTx.wait();

      const hasRecoveryRole = await bicPermissionsEnumerable.hasRole(RECOVERY_ROLE, walletGranted);
      const recoveryRoleCountNext = await bicPermissionsEnumerable.getRoleMemberCount(RECOVERY_ROLE);

      expect(hasRecoveryRole).to.equal(false);
      expect(Number(recoveryRoleCountPrev) - 1).to.equal(Number(recoveryRoleCountNext));
    });

    it("Should revoke role with missing the admin-role grant role", async function () {
      const { wallet1, wallet2 } = await getEOAAccounts();

      const DEFAULT_ADMIN_ROLE = await bicPermissionsEnumerable.DEFAULT_ADMIN_ROLE();
      const RECOVERY_ROLE = await bicPermissionsEnumerable.RECOVERY_ROLE();

      const walletGranted = wallet1.address;
      // Grant role with failed

      const revokeTx = bicPermissionsEnumerable.connect(wallet2).revokeRole(RECOVERY_ROLE, walletGranted);

      await expect(revokeTx).to.be.revertedWith(noPermissionError(DEFAULT_ADMIN_ROLE, wallet2.address.toLowerCase()));
    });


  });


});
