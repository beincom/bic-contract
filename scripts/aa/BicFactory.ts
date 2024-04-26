import { ethers, run } from "hardhat";

async function main() {
  const entryPoint = "0x79b16D44dd4860b076b29c47E079c1489ce950a5";
  const accessControl = ethers.ZeroAddress;
  const BicAccountFactory = await ethers.getContractFactory("BicAccountFactory");

  const bicFactory = await BicAccountFactory.deploy(entryPoint, accessControl);
  await bicFactory.waitForDeployment();
  console.log("🚀 ~ main ~ bicFactory:",  bicFactory.target)
  

  await run("verify:verify", {
    address: bicFactory.target.toString(),
    constructorArguments: [entryPoint, accessControl],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
