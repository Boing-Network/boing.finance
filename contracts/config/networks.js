// Network configuration for boing.finance
// Uses Infura API for all RPC endpoints

const INFURA_API_KEY = "ca6843b2ac7a4fdc9b2af7fddc25904a";

// Helper function to generate Infura RPC URLs
const getInfuraUrl = (network) => {
  return `https://${network}.infura.io/v3/${INFURA_API_KEY}`;
};

// Mainnet networks - Tier 1 (Low Cost, High Impact)
const MAINNET_NETWORKS = {
  polygon: {
    name: "Polygon",
    chainId: 137,
    rpcUrl: getInfuraUrl("polygon-mainnet"),
    explorer: "https://polygonscan.com",
    nativeToken: "MATIC",
    gasPrice: "30000000000", // 30 gwei
    maxFeePerGas: "50000000000", // 50 gwei
    maxPriorityFeePerGas: "30000000000", // 30 gwei
    serviceFee: "10000000000000000000", // 0.01 MATIC
    estimatedDeploymentCost: "100000000000000000", // 0.1 MATIC
    color: "#8247E5",
    apiKey: "POLYGONSCAN_API_KEY"
  },
  bsc: {
    name: "BSC",
    chainId: 56,
    rpcUrl: getInfuraUrl("bsc-mainnet"),
    explorer: "https://bscscan.com",
    nativeToken: "BNB",
    gasPrice: "5000000000", // 5 gwei
    maxFeePerGas: "10000000000", // 10 gwei
    maxPriorityFeePerGas: "5000000000", // 5 gwei
    serviceFee: "5000000000000000000", // 0.005 BNB
    estimatedDeploymentCost: "10000000000000000000", // 0.01 BNB
    color: "#F3BA2F",
    apiKey: "BSCSCAN_API_KEY"
  },
  arbitrum: {
    name: "Arbitrum One",
    chainId: 42161,
    rpcUrl: getInfuraUrl("arbitrum-mainnet"),
    explorer: "https://arbiscan.io",
    nativeToken: "ETH",
    gasPrice: "100000000", // 0.1 gwei
    maxFeePerGas: "200000000", // 0.2 gwei
    maxPriorityFeePerGas: "100000000", // 0.1 gwei
    serviceFee: "1000000000000000000", // 0.001 ETH
    estimatedDeploymentCost: "5000000000000000000", // 0.005 ETH
    color: "#28A0F0",
    apiKey: "ARBISCAN_API_KEY"
  },
  optimism: {
    name: "Optimism",
    chainId: 10,
    rpcUrl: getInfuraUrl("optimism-mainnet"),
    explorer: "https://optimistic.etherscan.io",
    nativeToken: "ETH",
    gasPrice: "1000000", // 0.001 gwei
    maxFeePerGas: "2000000", // 0.002 gwei
    maxPriorityFeePerGas: "1000000", // 0.001 gwei
    serviceFee: "1000000000000000000", // 0.001 ETH
    estimatedDeploymentCost: "5000000000000000000", // 0.005 ETH
    color: "#FF0420",
    apiKey: "OPTIMISTIC_ETHERSCAN_API_KEY"
  },
  base: {
    name: "Base",
    chainId: 8453,
    rpcUrl: getInfuraUrl("base-mainnet"),
    explorer: "https://basescan.org",
    nativeToken: "ETH",
    gasPrice: "1000000", // 0.001 gwei
    maxFeePerGas: "2000000", // 0.002 gwei
    maxPriorityFeePerGas: "1000000", // 0.001 gwei
    serviceFee: "1000000000000000000", // 0.001 ETH
    estimatedDeploymentCost: "5000000000000000000", // 0.005 ETH
    color: "#0052FF",
    apiKey: "BASESCAN_API_KEY"
  }
};

// Testnet networks
const TESTNET_NETWORKS = {
  sepolia: {
    name: "Sepolia",
    chainId: 11155111,
    rpcUrl: getInfuraUrl("sepolia"),
    explorer: "https://sepolia.etherscan.io",
    nativeToken: "ETH",
    gasPrice: "20000000000", // 20 gwei
    color: "#8B5CF6"
  },
  goerli: {
    name: "Goerli",
    chainId: 5,
    rpcUrl: getInfuraUrl("goerli"),
    explorer: "https://goerli.etherscan.io",
    nativeToken: "ETH",
    gasPrice: "20000000000", // 20 gwei
    color: "#8B5CF6"
  },
  mumbai: {
    name: "Mumbai",
    chainId: 80001,
    rpcUrl: getInfuraUrl("polygon-mumbai"),
    explorer: "https://mumbai.polygonscan.com",
    nativeToken: "MATIC",
    gasPrice: "30000000000", // 30 gwei
    color: "#8247E5"
  },
  bscTestnet: {
    name: "BSC Testnet",
    chainId: 97,
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
    explorer: "https://testnet.bscscan.com",
    nativeToken: "BNB",
    gasPrice: "10000000000", // 10 gwei
    color: "#F3BA2F"
  }
};

// Tier 2 networks (for future expansion)
const TIER2_NETWORKS = {
  ethereum: {
    name: "Ethereum",
    chainId: 1,
    rpcUrl: getInfuraUrl("mainnet"),
    explorer: "https://etherscan.io",
    nativeToken: "ETH",
    gasPrice: "20000000000", // 20 gwei
    serviceFee: "1000000000000000000", // 0.001 ETH
    estimatedDeploymentCost: "50000000000000000000", // 0.05 ETH
    color: "#627EEA",
    apiKey: "ETHERSCAN_API_KEY"
  }
};

// All networks combined
const ALL_NETWORKS = {
  ...MAINNET_NETWORKS,
  ...TESTNET_NETWORKS,
  ...TIER2_NETWORKS
};

// Network groups for different purposes
const NETWORK_GROUPS = {
  mainnets: MAINNET_NETWORKS,
  testnets: TESTNET_NETWORKS,
  tier2: TIER2_NETWORKS,
  all: ALL_NETWORKS
};

// Helper functions
const getNetworkByChainId = (chainId) => {
  return Object.values(ALL_NETWORKS).find(network => network.chainId === chainId);
};

const getNetworkByName = (name) => {
  return Object.values(ALL_NETWORKS).find(network => 
    network.name.toLowerCase() === name.toLowerCase()
  );
};

const getMainnetNetworks = () => {
  return Object.values(MAINNET_NETWORKS);
};

const getTestnetNetworks = () => {
  return Object.values(TESTNET_NETWORKS);
};

// Export everything
module.exports = {
  INFURA_API_KEY,
  MAINNET_NETWORKS,
  TESTNET_NETWORKS,
  TIER2_NETWORKS,
  ALL_NETWORKS,
  NETWORK_GROUPS,
  getNetworkByChainId,
  getNetworkByName,
  getMainnetNetworks,
  getTestnetNetworks,
  getInfuraUrl
}; 