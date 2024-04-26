import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, bic } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  const entryPointAddress = bic.addresses.EntryPoint;

  const bicPermissions = await get("BicPermissions");
  const bicAccountFactory = await deploy("BicAccountFactory", {
    from: deployer,
    args: [entryPointAddress, bicPermissions.address],
  });
  console.log("🚀 ~ bicAccountFactory:", bicAccountFactory.address)

  try {
    await hre.run("verify:verify", {
      contract: "contracts/smart-wallet/BicAccountFactory.sol:BicAccountFactory",
      address: bicAccountFactory.address,
      constructorArguments: [entryPointAddress, bicPermissions.address],
    });
  } catch (error) {
    console.log("Verify BicAccountFactory error with %s", error?.message || "unknown");

    // console.error(error);
  }

};
func.tags = ["BicAccountFactory"];
func.dependencies = ["BicPermissions"];
export default func;
