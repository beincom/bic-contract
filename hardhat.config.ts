import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-deploy";
import "@nomicfoundation/hardhat-foundry";
import "solidity-docgen";

import env from "./env";

// Extend hardhat env
import "./configs";
import fs from "fs";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000000,
      },
    },
  },
  networks: {
    hardhat: {
      saveDeployments: true,
      // forking: {
      //   url: `https://rpc.ankr.com/avalanche`,
      //   blockNumber: 33963320,
      // },
    },
    arbitrum: {
      url: "https://arbitrum.llamarpc.com",
      chainId: 42161,
      accounts: env.PRIVATE_KEYS,
    },
    arbitrumSepolia: {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614,
      accounts: env.PRIVATE_KEYS,
      // accounts: {
      //   mnemonic: env.MNEMONIC,
      //   path: "m/44'/60'/0'/0",
      //   initialIndex: 0,
      //   count: 20,
      //   passphrase: env.MNEMONIC_PASSPHRASE,
      // },
    },
    sepolia: {
      url: "https://eth-sepolia.public.blastapi.io",
      chainId: 11155111,
      accounts: env.PRIVATE_KEYS,
      // accounts: {
      //   mnemonic: env.MNEMONIC,
      //   path: "m/44'/60'/0'/0",
      //   initialIndex: 0,
      //   count: 20,
      //   passphrase: env.MNEMONIC_PASSPHRASE,
      // },
    },

  },
  namedAccounts: {
    deployer: 0,
  },
  etherscan: {
    apiKey: {
      arbitrumSepolia: env.API_KEY,
      sepolia: env.API_KEY,
    },
    customChains: [
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io/",
        },
      },
    ],
  },
  sourcify: {
    enabled: true,
    // Optional: specify a different Sourcify server
    apiUrl: "https://sourcify.dev/server",
    // Optional: specify a different Sourcify repository
    browserUrl: "https://repo.sourcify.dev",
  },
  docgen: {
    pages: "files",
    exclude: ["test"],
  }
};

export default config;
