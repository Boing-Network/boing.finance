// Network configuration for supporting smaller/newer blockchains
export const NETWORKS = {
  // Major Networks (existing)
  1: {
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: process.env.REACT_APP_ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
    explorer: 'https://etherscan.io',
    chainId: 1,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockTime: 12,
    gasLimit: 30000000,
    isTestnet: false,
    priority: 1
  },
  137: {
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: process.env.REACT_APP_POLYGON_RPC_URL || 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    chainId: 137,
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    blockTime: 2,
    gasLimit: 30000000,
    isTestnet: false,
    priority: 2
  },
  56: {
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    rpcUrl: process.env.REACT_APP_BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    explorer: 'https://bscscan.com',
    chainId: 56,
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    blockTime: 3,
    gasLimit: 30000000,
    isTestnet: false,
    priority: 3
  },

  // Smaller/Newer Networks
  250: {
    name: 'Fantom',
    symbol: 'FTM',
    rpcUrl: process.env.REACT_APP_FANTOM_RPC_URL || 'https://rpc.ftm.tools',
    explorer: 'https://ftmscan.com',
    chainId: 250,
    nativeCurrency: { name: 'Fantom', symbol: 'FTM', decimals: 18 },
    blockTime: 1,
    gasLimit: 25000000,
    isTestnet: false,
    priority: 4,
    features: ['fastFinality', 'lowFees']
  },
  43114: {
    name: 'Avalanche',
    symbol: 'AVAX',
    rpcUrl: process.env.REACT_APP_AVALANCHE_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
    explorer: 'https://snowtrace.io',
    chainId: 43114,
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    blockTime: 2,
    gasLimit: 8000000,
    isTestnet: false,
    priority: 5,
    features: ['subnetSupport', 'highThroughput']
  },
  42161: {
    name: 'Arbitrum One',
    symbol: 'ARB',
    rpcUrl: process.env.REACT_APP_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io',
    chainId: 42161,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockTime: 1,
    gasLimit: 100000000,
    isTestnet: false,
    priority: 6,
    features: ['rollup', 'lowFees']
  },
  10: {
    name: 'Optimism',
    symbol: 'OP',
    rpcUrl: process.env.REACT_APP_OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    explorer: 'https://optimistic.etherscan.io',
    chainId: 10,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockTime: 2,
    gasLimit: 30000000,
    isTestnet: false,
    priority: 7,
    features: ['rollup', 'fastFinality']
  },

  // Emerging Networks
  8453: {
    name: 'Base',
    symbol: 'ETH',
    rpcUrl: process.env.REACT_APP_BASE_RPC_URL || 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    chainId: 8453,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockTime: 2,
    gasLimit: 30000000,
    isTestnet: false,
    priority: 8,
    features: ['rollup', 'coinbaseBacked']
  },
  59144: {
    name: 'Linea',
    symbol: 'ETH',
    rpcUrl: process.env.REACT_APP_LINEA_RPC_URL || 'https://rpc.linea.build',
    explorer: 'https://lineascan.build',
    chainId: 59144,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockTime: 12,
    gasLimit: 30000000,
    isTestnet: false,
    priority: 9,
    features: ['rollup', 'consensysBacked']
  },
  1101: {
    name: 'Polygon zkEVM',
    symbol: 'ETH',
    rpcUrl: process.env.REACT_APP_POLYGON_ZKEVM_RPC_URL || 'https://zkevm-rpc.com',
    explorer: 'https://zkevm.polygonscan.com',
    chainId: 1101,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockTime: 1,
    gasLimit: 30000000,
    isTestnet: false,
    priority: 10,
    features: ['zkRollup', 'polygonBacked']
  },

  // Layer 2 Networks
  324: {
    name: 'zkSync Era',
    symbol: 'ETH',
    rpcUrl: process.env.REACT_APP_ZKSYNC_RPC_URL || 'https://mainnet.era.zksync.io',
    explorer: 'https://explorer.zksync.io',
    chainId: 324,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockTime: 1,
    gasLimit: 30000000,
    isTestnet: false,
    priority: 11,
    features: ['zkRollup', 'highThroughput']
  },
  534352: {
    name: 'Scroll',
    symbol: 'ETH',
    rpcUrl: process.env.REACT_APP_SCROLL_RPC_URL || 'https://rpc.scroll.io',
    explorer: 'https://scrollscan.com',
    chainId: 534352,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockTime: 2,
    gasLimit: 30000000,
    isTestnet: false,
    priority: 12,
    features: ['zkRollup', 'nativeEthereumCompatibility']
  },

  // Alternative Layer 1 Networks
  1284: {
    name: 'Moonbeam',
    symbol: 'GLMR',
    rpcUrl: process.env.REACT_APP_MOONBEAM_RPC_URL || 'https://rpc.api.moonbeam.network',
    explorer: 'https://moonbeam.moonscan.io',
    chainId: 1284,
    nativeCurrency: { name: 'Glimmer', symbol: 'GLMR', decimals: 18 },
    blockTime: 12,
    gasLimit: 15000000,
    isTestnet: false,
    priority: 13,
    features: ['parachain', 'ethereumCompatibility']
  },
  1285: {
    name: 'Moonriver',
    symbol: 'MOVR',
    rpcUrl: process.env.REACT_APP_MOONRIVER_RPC_URL || 'https://rpc.api.moonriver.moonbeam.network',
    explorer: 'https://moonriver.moonscan.io',
    chainId: 1285,
    nativeCurrency: { name: 'Moonriver', symbol: 'MOVR', decimals: 18 },
    blockTime: 12,
    gasLimit: 15000000,
    isTestnet: false,
    priority: 14,
    features: ['parachain', 'ethereumCompatibility']
  },
  1287: {
    name: 'Moonbase Alpha',
    symbol: 'DEV',
    rpcUrl: process.env.REACT_APP_MOONBASE_RPC_URL || 'https://rpc.api.moonbase.moonbeam.network',
    explorer: 'https://moonbase.moonscan.io',
    chainId: 1287,
    nativeCurrency: { name: 'Dev', symbol: 'DEV', decimals: 18 },
    blockTime: 12,
    gasLimit: 15000000,
    isTestnet: true,
    priority: 15,
    features: ['parachain', 'ethereumCompatibility']
  },

  // Testnets for Development
  11155111: {
    name: 'Sepolia',
    symbol: 'ETH',
    rpcUrl: process.env.REACT_APP_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
    explorer: 'https://sepolia.etherscan.io',
    chainId: 11155111,
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    blockTime: 12,
    gasLimit: 30000000,
    isTestnet: true,
    priority: 16
  },
  80001: {
    name: 'Mumbai',
    symbol: 'MATIC',
    rpcUrl: process.env.REACT_APP_MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
    explorer: 'https://mumbai.polygonscan.com',
    chainId: 80001,
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    blockTime: 2,
    gasLimit: 30000000,
    isTestnet: true,
    priority: 17
  }
};

// Helper functions
export const getNetworkByChainId = (chainId) => {
  return NETWORKS[chainId] || null;
};

export const getSupportedNetworks = () => {
  return Object.values(NETWORKS).sort((a, b) => a.priority - b.priority);
};

export const getMainnetNetworks = () => {
  return Object.values(NETWORKS).filter(network => !network.isTestnet);
};

export const getTestnetNetworks = () => {
  return Object.values(NETWORKS).filter(network => network.isTestnet);
};

export const getNetworkFeatures = (chainId) => {
  const network = getNetworkByChainId(chainId);
  return network?.features || [];
};

// Network categories for UI
export const NETWORK_CATEGORIES = {
  major: [1, 137, 56], // Ethereum, Polygon, BSC
  emerging: [250, 43114, 42161, 10], // Fantom, Avalanche, Arbitrum, Optimism
  layer2: [8453, 59144, 1101, 324, 534352], // Base, Linea, Polygon zkEVM, zkSync, Scroll
  alternative: [1284, 1285, 1287], // Moonbeam, Moonriver, Moonbase
  testnets: [11155111, 80001] // Sepolia, Mumbai
};

export default NETWORKS; 