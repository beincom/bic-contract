import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, bic } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  const bicUnlockFactory = await deploy("BicUnlockFactory", {
    from: deployer,
    args: [],
  });

  try {
    await hre.run("verify:verify", {
      contract: "contracts/token-unlock/BicUnlockFactory.sol:BicUnlockFactory",
      address: bicUnlockFactory.address,
      constructorArguments: [],
    });
  } catch (error) {
    console.log("Verify BicUnlockFactory error with %s", error?.message || "unknown");
    // console.error(error);
  }

};
func.tags = ["BicUnlockFactory"];
func.dependencies = [];
export default func;
