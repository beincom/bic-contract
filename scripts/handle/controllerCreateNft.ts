import { ethers } from "ethers";
import HandlesControllerData from "../../artifacts/contracts/namespaces/controller/HandlesController.sol/HandlesController.json";
import HandleData from "../../artifacts/contracts/namespaces/handles/Handles.sol/Handles.json";

const name = 'testname';
const price = '0'; // other while need to approve
const beneficiaries = []; // if want to test just add some
const collects = []; // each 1000 count as 10%
const commitDuration = 0; // No commit duration in this case
const isAuction = false; // No auction in this case

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_PROVIDER, 421614, {
        polling: false,
    })


    const verifier = new ethers.Wallet(process.env.HANDLES_WALLET_PK, provider);
    const user = new ethers.Wallet(process.env.PRIVATE_KEYS, provider);

    const handleContract = new ethers.Contract("0x70E238006f9026881b5cFC87108965AdB32c7BDb",HandleData.abi , provider);
    const handlesControllerContract = new ethers.Contract(process.env.HANDLES_CONTROLLER_ADDRESS,HandlesControllerData.abi , user);

    const tokenId = await handleContract.getTokenId(name);
    const isExist = await handleContract.exists(tokenId);
    if(isExist) {
        console.log('Handle already exists');
        return;
    }

    const validAfter = Math.floor(Date.now() / 1000);
    const validUntil = validAfter + 60 * 60; // 1 hour
    const dataHash = await handlesControllerContract.getRequestHandleOp(
        {
            receiver: user.address,
            handle: handleContract.target,
            name: name,
            price: price,
            beneficiaries: beneficiaries,
            collects: collects,
            commitDuration: commitDuration,
            isAuction: isAuction,
        } as any, validUntil as any, validAfter as any);
    const signature = await verifier.signMessage(ethers.getBytes(dataHash));
    console.log('signature', signature);

    const tx = await handlesControllerContract.requestHandle(
        {
            receiver: user.address,
            handle: handleContract.target,
            name: name,
            price: price,
            beneficiaries: beneficiaries,
            collects: collects,
            commitDuration: commitDuration,
            isAuction: isAuction,
        } as any, validUntil as any, validAfter as any, signature);
    console.log('tx', tx);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
