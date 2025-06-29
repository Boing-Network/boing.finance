// Network configuration for supporting smaller/newer blockchains
// Updated to include only essential networks for deployment
// This resolves the "Network with chain ID 804 is not supported" error

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
    priority: 4,
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
    priority: 5,
    features: ['rollup', 'fastFinality']
  },
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
    priority: 6,
    features: ['rollup', 'coinbaseBacked']
  },

  // Testnets for Development
  11155111: {
    name: 'Sepolia',
    symbol: 'ETH',
    rpcUrl: process.env.REACT_APP_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/ca6843b2ac7a4fdc9b2af7fddc25904a',
    explorer: 'https://sepolia.etherscan.io',
    chainId: 11155111,
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    blockTime: 12,
    gasLimit: 30000000,
    isTestnet: true,
    priority: 7,
    features: ['dexDeployed', 'bridgeDeployed', 'mockTokens']
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
    priority: 8
  },
  97: {
    name: 'BSC Testnet',
    symbol: 'tBNB',
    rpcUrl: process.env.REACT_APP_BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545',
    explorer: 'https://testnet.bscscan.com',
    chainId: 97,
    nativeCurrency: { name: 'Test BNB', symbol: 'tBNB', decimals: 18 },
    blockTime: 3,
    gasLimit: 30000000,
    isTestnet: true,
    priority: 9
  }
};

// Helper functions
export const getNetworkByChainId = (chainId) => {
  // Convert chainId to number for comparison
  let numericChainId;
  if (typeof chainId === 'string') {
    if (chainId.startsWith('0x')) {
      numericChainId = parseInt(chainId, 16);
    } else {
      numericChainId = parseInt(chainId, 10);
    }
  } else {
    numericChainId = parseInt(chainId);
  }
  
  return NETWORKS[numericChainId] || null;
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
  layer2: [8453], // Base
  testnets: [11155111, 80001, 97] // All testnets
};

// Validation function to check if all networks are properly configured
export const validateNetworkConfiguration = () => {
  const issues = [];
  
  Object.entries(NETWORKS).forEach(([chainId, network]) => {
    if (!network.name) issues.push(`Chain ${chainId}: Missing name`);
    if (!network.rpcUrl) issues.push(`Chain ${chainId}: Missing RPC URL`);
    if (!network.explorer) issues.push(`Chain ${chainId}: Missing explorer URL`);
    if (!network.nativeCurrency) issues.push(`Chain ${chainId}: Missing native currency`);
    if (typeof network.isTestnet !== 'boolean') issues.push(`Chain ${chainId}: Missing isTestnet flag`);
  });
  
  return {
    isValid: issues.length === 0,
    issues,
    totalNetworks: Object.keys(NETWORKS).length,
    mainnetNetworks: Object.values(NETWORKS).filter(n => !n.isTestnet).length,
    testnetNetworks: Object.values(NETWORKS).filter(n => n.isTestnet).length
  };
};

// Debug function to get network info by chain ID
export const debugNetwork = (chainId) => {
  const network = getNetworkByChainId(chainId);
  if (!network) {
    return {
      found: false,
      chainId,
      message: `Network with chain ID ${chainId} is not supported`
    };
  }
  
  return {
    found: true,
    chainId,
    network,
    message: `Network ${network.name} (${chainId}) is supported`
  };
};

// Check for duplicate chain IDs and other issues
export const checkNetworkConfigurationIssues = () => {
  const issues = [];
  const chainIds = new Set();
  
  Object.entries(NETWORKS).forEach(([chainId, network]) => {
    const numericChainId = parseInt(chainId);
    
    // Check for duplicate chain IDs
    if (chainIds.has(numericChainId)) {
      issues.push(`Duplicate chain ID: ${numericChainId}`);
    } else {
      chainIds.add(numericChainId);
    }
    
    // Check if chainId in object matches the key
    if (network.chainId !== numericChainId) {
      issues.push(`Chain ID mismatch for ${network.name}: key=${chainId}, object=${network.chainId}`);
    }
  });
  
  return {
    hasIssues: issues.length > 0,
    issues,
    uniqueChainIds: Array.from(chainIds).sort((a, b) => a - b)
  };
};

export default NETWORKS; 