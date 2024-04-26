import { extendEnvironment } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import getAddresses from "./addresses";
extendEnvironment(async (hre: HardhatRuntimeEnvironment) => {
  // extend hre context with gmx domain data

  hre.bic = {
    addresses: await getAddresses(hre),
  };
});
