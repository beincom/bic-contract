import { ethers, run } from "hardhat";

async function main() {
  const [deployer, wallet1, wallet2] = await ethers.getSigners();
  console.log("🚀 ~ file: deploy.ts:5 ~ main ~ deployer:", deployer.address);

  const bicPermission = await ethers.deployContract("BicPermissions");
  await bicPermission.waitForDeployment();

  const bicUnlockFactory = await ethers.deployContract("BicUnlockFactory", [
    bicPermission.target,
  ]);
  await bicUnlockFactory.waitForDeployment();

  console.log("🚀 bicUnlockFactory :", bicUnlockFactory.target);

  await run("verify:verify", {
    address: bicUnlockFactory.target,
    constructorArguments: [bicPermission.target],
});

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
