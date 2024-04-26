
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Addresses } from './addresses';

declare module "hardhat/types/runtime" {
  type ExtendedHardhatRuntimeEnvironment = {
    bic: {
      addresses: Addresses,
    }
  };
  interface HardhatRuntimeEnvironment extends ExtendedHardhatRuntimeEnvironment { }
}
