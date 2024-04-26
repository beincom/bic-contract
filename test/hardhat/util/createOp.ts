import {Wallet} from "ethers";
import {ethers} from "hardhat";
import {BicAccount, EntryPoint} from "../../../typechain-types";

export async function createOp(smartWalletAddress: string, target: string, initCode: string,  initCallData: string, paymasterAndData: string = "0x", chainNonce: BigInt = 0n, user: Wallet, entryPoint: EntryPoint): Promise<any> {
    const smartWallet: BicAccount = await ethers.getContractAt("BicAccount", smartWalletAddress);
    const value = ethers.ZeroHash;
    const callDataForEntrypoint = smartWallet.interface.encodeFunctionData("execute", [target, value, initCallData]);
    const nonce = await entryPoint.getNonce(smartWalletAddress as any, 0 as any);
    const op = {
        sender: smartWalletAddress,
        nonce: nonce + chainNonce,
        initCode: initCode,
        callData: callDataForEntrypoint,
        callGasLimit: 5_000_000,
        verificationGasLimit: 5_000_000,
        preVerificationGas: 5_000_000,
        // maxFeePerGas: 0,
        // maxFeePerGas: paymasterAndData === '0x'? 0 : 112,
        maxFeePerGas: 112,
        // maxPriorityFeePerGas: 0,
        maxPriorityFeePerGas: 82,
        paymasterAndData: paymasterAndData,
        signature: "0x"
    }
    const opHash = await entryPoint.getUserOpHash(op as any);
    const signature = await user.signMessage(ethers.getBytes(opHash));
    op.signature = ethers.solidityPacked(["bytes"], [signature]);
    return op;
}
