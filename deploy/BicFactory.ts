import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const bicFactory = await deploy("BicFactory", {
    from: deployer,
    args: [],
  });

    console.log("🚀 ~ bicFactory:", bicFactory.address)
    try {
        await hre.run("verify:verify", {
            contract: "contracts/infra/BicFactory.sol:BicFactory",
            address: bicFactory.address,
            constructorArguments: [],
        });
    } catch (error) {
        console.log("Verify BicFactory error with %s", error?.message || "unknown");
    }
};

func.tags = ["BicFactory"];
func.dependencies = [];
export default func;
