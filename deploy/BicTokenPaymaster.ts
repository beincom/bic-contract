import {DeployFunction} from "hardhat-deploy/types";
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {ethers} from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts, bic} = hre;
    const {deploy, get, execute} = deployments;
    const {deployer} = await getNamedAccounts();

    const entryPointAddress = bic.addresses.EntryPoint;

    const bicAccountFactory = await get("BicAccountFactory");
    const bicTokenPaymaster = await deploy("BicTokenPaymaster", {
        from: deployer,
        args: [bicAccountFactory.address, entryPointAddress],
    });
    console.log("🚀 ~ bicTokenPaymaster:", bicTokenPaymaster.address)

    try {
        await hre.run("verify:verify", {
            contract: "contracts/smart-wallet/paymaster/BicTokenPaymaster.sol:BicTokenPaymaster",
            address: bicTokenPaymaster.address,
            constructorArguments: [bicAccountFactory.address, entryPointAddress],
        });
    } catch (error) {
        console.log("Verify BicTokenPaymaster error with %s", error?.message || "unknown");

        // console.error(error);
    }

    await execute("BicTokenPaymaster", {from: deployer, value: ethers.parseEther('0.2').toString()}, "addStake", 86400);
}

func.tags = ["BicTokenPaymaster"];
func.dependencies = ["BicAccountFactory"];
export default func;
