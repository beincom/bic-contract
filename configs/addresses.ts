import { HardhatRuntimeEnvironment } from "hardhat/types";

export type Addresses = {
  EntryPoint: string;
}
const config: {
  [network: string]: Addresses;
} = {
  arbitrum: {
    EntryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  },

  arbitrumSepolia: {
    EntryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  },

  hardhat: {
    EntryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  },
};

export default async function (hre: HardhatRuntimeEnvironment): Promise<Addresses> {
  const addresses = config[hre.network.name];
  return addresses || {};
  if (!addresses) {
    throw new Error(`Not found addresses at chain ${hre.network.name}`);
  }
  return addresses;
}
