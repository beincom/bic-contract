import { ethers, run } from "hardhat";

async function main() {
    const bicAccountAddress = '0x4EcbA85A3696B02e46799189b7469062C57CBAA8'
    const BicAccount = await ethers.getContractFactory("BicAccount");

    await run("verify:verify", {
        address: bicAccountAddress,
        constructorArguments: ['0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789'],
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
