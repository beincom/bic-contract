import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const handles = await deploy("Handles", {
        from: deployer,
        args: [],
    });

    console.log("🚀 ~ handles:", handles.address)
    try {
        await hre.run("verify:verify", {
            contract: "contracts/namespaces/handles/Handles.sol:Handles",
            address: handles.address,
            constructorArguments: [],
        });
    } catch (error) {
        console.log("Verify Handles error with %s", error?.message || "unknown");
    }
}

func.tags = ["Handles"];
func.dependencies = [];

export default func;
