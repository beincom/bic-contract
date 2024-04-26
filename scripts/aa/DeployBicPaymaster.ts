import { ethers, run } from "hardhat";

async function main() {
  //   const accounts = await ethers.getSigners();
  //   console.log("🚀 ~ main ~ accounts[0].address", accounts[0].address);
  //
  const accountFactory = "0x526bed4dd065746Ed3De92Dc62a40b5505E0181F";
  const entryPoint = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
  // const BicPaymaster = await ethers.getContractFactory("BicTokenPaymaster");
  //
  // const bicPaymaster = await BicPaymaster.deploy(accountFactory, entryPoint);
  // await bicPaymaster.waitForDeployment();
  //

  // console.log("🚀 ~ main ~ bicPaymaster:",  bicPaymaster.target)
  await run("verify:verify", {
    address: '0x4a654ED99fBB4f2Ae27A315b897f8A0979cf1853',
    constructorArguments: [accountFactory, entryPoint],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
