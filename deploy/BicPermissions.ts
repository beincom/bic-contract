import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const bicPermissions = await deploy("BicPermissions", {
    from: deployer,
    args: [],
  });

  console.log("🚀 ~ BicPermissions:", bicPermissions.address)



  try {
    await hre.run("verify:verify", {
      contract: "contracts/management/BicPermissions.sol:BicPermissions",
      address: bicPermissions.address,
      constructorArguments: [],
    });
  } catch (error) {
    console.log("Verify BicPermissions error with %s", error?.message || "unknown");
  }


};
func.tags = ["BicPermissions"]
func.dependencies = []
export default func;