import {DeployFunction} from "hardhat-deploy/types";
import {HardhatRuntimeEnvironment} from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy, get, execute} = deployments;
    const { deployer } = await getNamedAccounts();

    const bicPermissions = await get("BicPermissions");
    const bicTokenPaymaster = await get("BicTokenPaymaster");
    const handlesController = await deploy("HandlesController", {
        from: deployer,
        args: [bicPermissions.address, '0xF21cf5d84EaD66F480aa0c9b3E6DC09Ac57c8d17'],

    });

    console.log('deployed HandlesController to: ', handlesController.address);

    try {
        await hre.run("verify:verify", {
            contract: "contracts/namespaces/controller/HandlesController.sol:HandlesController",
            address: handlesController.address,
            constructorArguments: [bicPermissions.address, '0xF21cf5d84EaD66F480aa0c9b3E6DC09Ac57c8d17'],
        });
    } catch (error) {
        console.log("Verify HandlesController error with %s", error?.message || "unknown");
    }
    console.log('Start setting verifier and prices');
    await execute("HandlesController", {from: deployer}, "setVerifier",'0x9606394A1155213058Ef188452440F9F055D5c7c');
    await execute("HandlesController", {from: deployer},"setCollector","0xAA3B526C3b7538530c1926b784c6c01338f121e7");
    console.log('End setting verifier and prices');
}

func.tags = ["HandlesController"];
func.dependencies = ["BicPermissions"];
export default func;
