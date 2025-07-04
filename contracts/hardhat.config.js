require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const { MAINNET_NETWORKS, TESTNET_NETWORKS, TIER2_NETWORKS } = require("./config/networks");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 20000,
        details: {
          yul: true,
          yulDetails: {
            optimizerSteps: "u",
          },
        },
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Testnets
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || TESTNET_NETWORKS.sepolia.rpcUrl,
      accounts: process.env.DEPLOYER_PRIVATE_KEY && process.env.DEPLOYER_PRIVATE_KEY !== "YOUR_PRIVATE_KEY_HERE" ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: 20000000000, // 20 gwei
    },
    goerli: {
      url: process.env.ETHEREUM_TESTNET_RPC_URL || TESTNET_NETWORKS.goerli.rpcUrl,
      accounts: process.env.DEPLOYER_PRIVATE_KEY && process.env.DEPLOYER_PRIVATE_KEY !== "YOUR_PRIVATE_KEY_HERE" ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 5,
    },
    mumbai: {
      url: process.env.POLYGON_TESTNET_RPC_URL || TESTNET_NETWORKS.mumbai.rpcUrl,
      accounts: process.env.DEPLOYER_PRIVATE_KEY && process.env.DEPLOYER_PRIVATE_KEY !== "YOUR_PRIVATE_KEY_HERE" ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 80001,
    },
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL || TESTNET_NETWORKS.bscTestnet.rpcUrl,
      accounts: process.env.DEPLOYER_PRIVATE_KEY && process.env.DEPLOYER_PRIVATE_KEY !== "YOUR_PRIVATE_KEY_HERE" ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 97,
    },
    // Mainnets - Tier 1 (Low Cost, High Impact)
    polygon: {
      url: MAINNET_NETWORKS.polygon.rpcUrl,
      accounts: process.env.DEPLOYER_PRIVATE_KEY && process.env.DEPLOYER_PRIVATE_KEY !== "YOUR_PRIVATE_KEY_HERE" ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: MAINNET_NETWORKS.polygon.chainId,
      gasPrice: parseInt(MAINNET_NETWORKS.polygon.gasPrice),
      maxFeePerGas: parseInt(MAINNET_NETWORKS.polygon.maxFeePerGas),
      maxPriorityFeePerGas: parseInt(MAINNET_NETWORKS.polygon.maxPriorityFeePerGas),
    },
    bsc: {
      url: MAINNET_NETWORKS.bsc.rpcUrl,
      accounts: process.env.DEPLOYER_PRIVATE_KEY && process.env.DEPLOYER_PRIVATE_KEY !== "YOUR_PRIVATE_KEY_HERE" ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: MAINNET_NETWORKS.bsc.chainId,
      gasPrice: parseInt(MAINNET_NETWORKS.bsc.gasPrice),
      maxFeePerGas: parseInt(MAINNET_NETWORKS.bsc.maxFeePerGas),
      maxPriorityFeePerGas: parseInt(MAINNET_NETWORKS.bsc.maxPriorityFeePerGas),
    },
    arbitrum: {
      url: MAINNET_NETWORKS.arbitrum.rpcUrl,
      accounts: process.env.DEPLOYER_PRIVATE_KEY && process.env.DEPLOYER_PRIVATE_KEY !== "YOUR_PRIVATE_KEY_HERE" ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: MAINNET_NETWORKS.arbitrum.chainId,
      gasPrice: parseInt(MAINNET_NETWORKS.arbitrum.gasPrice),
      maxFeePerGas: parseInt(MAINNET_NETWORKS.arbitrum.maxFeePerGas),
      maxPriorityFeePerGas: parseInt(MAINNET_NETWORKS.arbitrum.maxPriorityFeePerGas),
    },
    optimism: {
      url: MAINNET_NETWORKS.optimism.rpcUrl,
      accounts: process.env.DEPLOYER_PRIVATE_KEY && process.env.DEPLOYER_PRIVATE_KEY !== "YOUR_PRIVATE_KEY_HERE" ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: MAINNET_NETWORKS.optimism.chainId,
      gasPrice: parseInt(MAINNET_NETWORKS.optimism.gasPrice),
      maxFeePerGas: parseInt(MAINNET_NETWORKS.optimism.maxFeePerGas),
      maxPriorityFeePerGas: parseInt(MAINNET_NETWORKS.optimism.maxPriorityFeePerGas),
    },
    base: {
      url: MAINNET_NETWORKS.base.rpcUrl,
      accounts: process.env.DEPLOYER_PRIVATE_KEY && process.env.DEPLOYER_PRIVATE_KEY !== "YOUR_PRIVATE_KEY_HERE" ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: MAINNET_NETWORKS.base.chainId,
      gasPrice: parseInt(MAINNET_NETWORKS.base.gasPrice),
      maxFeePerGas: parseInt(MAINNET_NETWORKS.base.maxFeePerGas),
      maxPriorityFeePerGas: parseInt(MAINNET_NETWORKS.base.maxPriorityFeePerGas),
    },
    // Tier 2 - Higher Cost Networks (for later)
    ethereum: {
      url: process.env.ETHEREUM_RPC_URL || TIER2_NETWORKS.ethereum.rpcUrl,
      accounts: process.env.DEPLOYER_PRIVATE_KEY && process.env.DEPLOYER_PRIVATE_KEY !== "YOUR_PRIVATE_KEY_HERE" ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 1,
      gasPrice: 20000000000, // 20 gwei
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
      goerli: process.env.ETHERSCAN_API_KEY,
      mainnet: process.env.ETHERSCAN_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY,
      bsc: process.env.BSCSCAN_API_KEY,
      bscTestnet: process.env.BSCSCAN_API_KEY,
      arbitrumOne: process.env.ARBISCAN_API_KEY,
      optimisticEthereum: process.env.OPTIMISTIC_ETHERSCAN_API_KEY,
      base: process.env.BASESCAN_API_KEY,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  mocha: {
    timeout: 40000,
  },
}; 