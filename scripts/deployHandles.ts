import { ethers, run } from "hardhat";

const nameNftList = [
    {
        namespace: 'ounft',
        name: "Ownership Username NFT",
        symbol: "ouNFT",
        imageDescription: "Beincom - Ownership Username@",
        imageUri: "https://api.beincom.app/v1/wallet/uri/ounft",
        address: "0xa0cf6F69F847D062414792d8AC0BA879d2a85735",
    },
    {
        namespace: 'ocnft',
        name: "Ownership Community Name NFT",
        symbol: "ocNFT",
        imageDescription: "Beincom - Ownership Community Name@",
        imageUri: "https://api.beincom.app/v1/wallet/uri/ocnft",
        address: "0xaD82CA7dc001D5D38622CdeCa92624173Eb18937"
    },
    {
        namespace: 'opnft',
        name: "Ownership Personal Name NFT",
        symbol: "opNFT",
        imageDescription: "Beincom - Ownership Personal Name@",
        imageUri: "https://api.beincom.io/v1/wallet/uri/opnft",
        address: "0x6e8fF86585149dEC7FebFd34f67c29a8905b046d"
    },
    {
        namespace: 'eunft',
        name: "Earning Username NFT",
        symbol: "euNFT",
        imageDescription: "Beincom - Earning Username@",
        imageUri: "https://api.beincom.app/v1/wallet/uri/eunft",
        address: "0xf5c4C84929B084BBC1e2FaF5458a89b5320688DC"
    },
    {
        namespace: 'ecnft',
        name: "Earning Community Name NFT",
        symbol: "ecNFT",
        imageDescription: "Beincom - Earning Community Name@",
        imageUri: "https://api.beincom.app/v1/wallet/uri/ecnft",
        address: "0x94cE32d9fFDDcF623EDAf1eBDDf5b1B6a67Fac00"
    },
    {
        namespace: 'epnft',
        name: "Earning Personal Name NFT",
        symbol: "epNFT",
        imageDescription: "Beincom - Earning Personal Name@",
        imageUri: "https://api.beincom.app/v1/wallet/uri/epnft",
        address: "0xa405fd6123d664fC2fb06D08E34f32964B66f317"
    },
]

async function main() {
    const bicFactory = await ethers.getContractAt("BicFactory", "0x1aE30c2a4e90729a1ADaF0Af64e915D3aCc59e56");
    const handles = await ethers.getContractAt("Handles", "0x808Fbc3CAB0140f8128c0376A16E05d7F8Cbc98E");

    // const HandleTokenURI = await ethers.getContractFactory("HandleTokenURI");
    // const handleTokenURI = await HandleTokenURI.deploy("0x53964BBB3B01e732844d0B595560a72B3018c143");
    // await handleTokenURI.waitForDeployment();
    //
    // // const handleTokenURI = await ethers.getContractAt("HandleTokenURI", "0x685016e18d685Fc71194d9FC55b4E4c6f8b6a539");
    //
    // console.log("🚀 ~ handleTokenURI:", handleTokenURI.target);
    // try {
    //     await run("verify:verify", {
    //         address: handleTokenURI.target,
    //         constructorArguments: ["0x53964BBB3B01e732844d0B595560a72B3018c143"],
    //     });
    // } catch (error) {
    //     console.log("Verify HandleTokenURI error with %s", error?.message || "unknown");
    // }

    const handleTokenURI = await ethers.getContractAt("HandleTokenURI", "0x053559E61a1Da11200f600e340C82Af9Ff89d034");

    for (const nameNft of nameNftList) {
        // Clone handle flow
        console.log('Clone handle for namespace: ', nameNft.namespace)
        const txCloneHandle = await bicFactory.deployProxyByImplementation(
            handles.target as any,
            handles.interface.encodeFunctionData('initialize', [nameNft.namespace, nameNft.name, nameNft.symbol, "0xF4402fE2B09da7c02504DC308DBc307834CE56fE"]) as any,
            ethers.solidityPackedKeccak256(['string', 'string', 'uint256'], ['Handles', nameNft.namespace, 2]) as any
        );
        const txCloneHandleReceipt = await txCloneHandle.wait();

        // @ts-ignore
        const cloneAddress = txCloneHandleReceipt?.logs[txCloneHandleReceipt?.logs.length - 1].args[1];
        console.log('cloneAddress: ', cloneAddress)

        // Just update uri for handle flow
        // const cloneAddress = nameNft.address
        const clone = await ethers.getContractAt("Handles", cloneAddress);

        await clone.setHandleTokenURIContract(handleTokenURI.target as any);
        await clone.setController("0x28d838C4b6DB6d4EcFa5be92687DFBb8425d0068" as any);
        await handleTokenURI.setNameElement(nameNft.namespace as any, nameNft.imageDescription as any, nameNft.imageUri as any);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
