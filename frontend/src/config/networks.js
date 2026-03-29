// Network configuration for supporting smaller/newer blockchains
// Updated to include only essential networks for deployment
// This resolves the "Network with chain ID 804 is not supported" error

export const NETWORKS = {
  // Major Networks (existing)
  1: {
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: process.env.REACT_APP_ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
    rpcUrls: [
      process.env.REACT_APP_ETHEREUM_RPC_URL,
      'https://eth.llamarpc.com',
      'https://rpc.ankr.com/eth',
      'https://ethereum.publicnode.com',
      'https://1rpc.io/eth'
    ].filter(Boolean),
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
    rpcUrls: [
      process.env.REACT_APP_POLYGON_RPC_URL,
      'https://polygon-rpc.com',
      'https://rpc.ankr.com/polygon',
      'https://polygon-bor-rpc.publicnode.com'
    ].filter(Boolean),
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
    rpcUrls: [
      process.env.REACT_APP_BSC_RPC_URL,
      'https://bsc-dataseed.binance.org',
      'https://bsc-dataseed1.defibit.io',
      'https://rpc.ankr.com/bsc'
    ].filter(Boolean),
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
    rpcUrls: [
      process.env.REACT_APP_ARBITRUM_RPC_URL,
      'https://arb1.arbitrum.io/rpc',
      'https://rpc.ankr.com/arbitrum',
      'https://arbitrum-one-rpc.publicnode.com'
    ].filter(Boolean),
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
    rpcUrls: [
      process.env.REACT_APP_OPTIMISM_RPC_URL,
      'https://mainnet.optimism.io',
      'https://rpc.ankr.com/optimism',
      'https://optimism-rpc.publicnode.com'
    ].filter(Boolean),
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
    rpcUrls: [
      process.env.REACT_APP_BASE_RPC_URL,
      'https://mainnet.base.org',
      'https://base-rpc.publicnode.com',
      'https://rpc.ankr.com/base'
    ].filter(Boolean),
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
    priority: 8,
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
    priority: 9
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
    priority: 10
  },

  // Boing Network L1 testnet (EIP-155 chain id 0x1b01). RPC uses boing_* JSON-RPC; use Boing Express wallet.
  // See boing.network docs: THREE-CODEBASE-ALIGNMENT.md, RPC-API-SPEC.md
  6913: {
    name: 'Boing Testnet',
    symbol: 'BOING',
    rpcUrl:
      process.env.REACT_APP_BOING_TESTNET_RPC_URL || 'https://testnet-rpc.boing.network/',
    rpcUrls: [
      process.env.REACT_APP_BOING_TESTNET_RPC_URL,
      'https://testnet-rpc.boing.network/',
      'https://testnet-rpc.boing.network'
    ].filter(Boolean),
    explorer: 'https://boing.observer',
    chainId: 6913,
    nativeCurrency: { name: 'Boing', symbol: 'BOING', decimals: 0 },
    blockTime: 2,
    gasLimit: 30000000,
    isTestnet: true,
    priority: 7,
    features: ['boingNativeL1']
  },

  // Additional networks (e.g. for Bridge) – add any new chain here for a single source of truth
  804: {
    name: 'PulseChain',
    symbol: 'PLS',
    rpcUrl: 'https://rpc.pulsechain.com',
    explorer: 'https://scan.pulsechain.com',
    chainId: 804,
    nativeCurrency: { name: 'Pulse', symbol: 'PLS', decimals: 18 },
    blockTime: 10,
    gasLimit: 30000000,
    isTestnet: false,
    priority: 10
  },
  100: {
    name: 'Gnosis Chain',
    symbol: 'XDAI',
    rpcUrl: 'https://rpc.gnosischain.com',
    explorer: 'https://gnosisscan.io',
    chainId: 100,
    nativeCurrency: { name: 'xDAI', symbol: 'XDAI', decimals: 18 },
    blockTime: 5,
    gasLimit: 30000000,
    isTestnet: false,
    priority: 11
  },
  250: {
    name: 'Fantom',
    symbol: 'FTM',
    rpcUrl: process.env.REACT_APP_FANTOM_RPC_URL || 'https://rpc.ftm.tools',
    rpcUrls: [process.env.REACT_APP_FANTOM_RPC_URL, 'https://rpc.ftm.tools', 'https://rpc.ankr.com/fantom'].filter(Boolean),
    explorer: 'https://ftmscan.com',
    chainId: 250,
    nativeCurrency: { name: 'Fantom', symbol: 'FTM', decimals: 18 },
    blockTime: 1,
    gasLimit: 30000000,
    isTestnet: false,
    priority: 12
  },
  43114: {
    name: 'Avalanche C-Chain',
    symbol: 'AVAX',
    rpcUrl: process.env.REACT_APP_AVALANCHE_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
    rpcUrls: [process.env.REACT_APP_AVALANCHE_RPC_URL, 'https://api.avax.network/ext/bc/C/rpc', 'https://rpc.ankr.com/avalanche'].filter(Boolean),
    explorer: 'https://snowtrace.io',
    chainId: 43114,
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    blockTime: 2,
    gasLimit: 30000000,
    isTestnet: false,
    priority: 13
  },
  59144: {
    name: 'Linea',
    symbol: 'ETH',
    rpcUrl: process.env.REACT_APP_LINEA_RPC_URL || 'https://rpc.linea.build',
    rpcUrls: [process.env.REACT_APP_LINEA_RPC_URL, 'https://rpc.linea.build', 'https://linea.drpc.org'].filter(Boolean),
    explorer: 'https://lineascan.build',
    chainId: 59144,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockTime: 2,
    gasLimit: 30000000,
    isTestnet: false,
    priority: 14
  },
  1101: {
    name: 'Polygon zkEVM',
    symbol: 'ETH',
    rpcUrl: process.env.REACT_APP_POLYGON_ZKEVM_RPC_URL || 'https://zkevm-rpc.com',
    rpcUrls: [process.env.REACT_APP_POLYGON_ZKEVM_RPC_URL, 'https://zkevm-rpc.com', 'https://polygon-zkevm.drpc.org'].filter(Boolean),
    explorer: 'https://zkevm.polygonscan.com',
    chainId: 1101,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockTime: 2,
    gasLimit: 30000000,
    isTestnet: false,
    priority: 15
  },
  324: {
    name: 'zkSync Era',
    symbol: 'ETH',
    rpcUrl: process.env.REACT_APP_ZKSYNC_RPC_URL || 'https://mainnet.era.zksync.io',
    rpcUrls: [process.env.REACT_APP_ZKSYNC_RPC_URL, 'https://mainnet.era.zksync.io', 'https://zksync.drpc.org'].filter(Boolean),
    explorer: 'https://explorer.zksync.io',
    chainId: 324,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockTime: 1,
    gasLimit: 30000000,
    isTestnet: false,
    priority: 16
  },
  534352: {
    name: 'Scroll',
    symbol: 'ETH',
    rpcUrl: process.env.REACT_APP_SCROLL_RPC_URL || 'https://rpc.scroll.io',
    rpcUrls: [process.env.REACT_APP_SCROLL_RPC_URL, 'https://rpc.scroll.io', 'https://scroll.drpc.org'].filter(Boolean),
    explorer: 'https://scrollscan.com',
    chainId: 534352,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockTime: 2,
    gasLimit: 30000000,
    isTestnet: false,
    priority: 17
  },
  1284: {
    name: 'Moonbeam',
    symbol: 'GLMR',
    rpcUrl: 'https://rpc.api.moonbeam.network',
    explorer: 'https://moonbeam.moonscan.io',
    chainId: 1284,
    nativeCurrency: { name: 'Glimmer', symbol: 'GLMR', decimals: 18 },
    blockTime: 12,
    gasLimit: 30000000,
    isTestnet: false,
    priority: 18
  },
  1285: {
    name: 'Moonriver',
    symbol: 'MOVR',
    rpcUrl: 'https://rpc.api.moonriver.moonbeam.network',
    explorer: 'https://moonriver.moonscan.io',
    chainId: 1285,
    nativeCurrency: { name: 'Moonriver', symbol: 'MOVR', decimals: 18 },
    blockTime: 12,
    gasLimit: 30000000,
    isTestnet: false,
    priority: 19
  },
  5000: {
    name: 'Mantle',
    symbol: 'MNT',
    rpcUrl: process.env.REACT_APP_MANTLE_RPC_URL || 'https://rpc.mantle.xyz',
    rpcUrls: [process.env.REACT_APP_MANTLE_RPC_URL, 'https://rpc.mantle.xyz', 'https://mantle.drpc.org'].filter(Boolean),
    explorer: 'https://explorer.mantle.xyz',
    chainId: 5000,
    nativeCurrency: { name: 'Mantle', symbol: 'MNT', decimals: 18 },
    blockTime: 2,
    gasLimit: 30000000,
    isTestnet: false,
    priority: 20,
    features: ['rollup', 'lowFees']
  },
  81457: {
    name: 'Blast',
    symbol: 'ETH',
    rpcUrl: process.env.REACT_APP_BLAST_RPC_URL || 'https://rpc.blast.io',
    rpcUrls: [process.env.REACT_APP_BLAST_RPC_URL, 'https://rpc.blast.io', 'https://blast.drpc.org'].filter(Boolean),
    explorer: 'https://blastscan.io',
    chainId: 81457,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockTime: 2,
    gasLimit: 30000000,
    isTestnet: false,
    priority: 21,
    features: ['rollup', 'nativeYield']
  },
  204: {
    name: 'opBNB',
    symbol: 'BNB',
    rpcUrl: process.env.REACT_APP_OPBNB_RPC_URL || 'https://opbnb-mainnet-rpc.bnbchain.org',
    rpcUrls: [process.env.REACT_APP_OPBNB_RPC_URL, 'https://opbnb-mainnet-rpc.bnbchain.org', 'https://opbnb-rpc.publicnode.com'].filter(Boolean),
    explorer: 'https://opbnb.bscscan.com',
    chainId: 204,
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    blockTime: 1,
    gasLimit: 30000000,
    isTestnet: false,
    priority: 22,
    features: ['rollup', 'lowFees']
  },
  34443: {
    name: 'Mode',
    symbol: 'ETH',
    rpcUrl: process.env.REACT_APP_MODE_RPC_URL || 'https://mainnet.mode.network',
    rpcUrls: [process.env.REACT_APP_MODE_RPC_URL, 'https://mainnet.mode.network', 'https://mode.drpc.org'].filter(Boolean),
    explorer: 'https://explorer.mode.network',
    chainId: 34443,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockTime: 2,
    gasLimit: 30000000,
    isTestnet: false,
    priority: 23,
    features: ['rollup', 'lowFees']
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
  layer2: [42161, 10, 8453], // Arbitrum, Optimism, Base
  testnets: [6913, 11155111, 80001, 97] // Boing + EVM testnets
};

/**
 * Returns params for wallet_addEthereumChain (add network to wallet).
 * Uses rpcUrls array when available (with fallbacks) for mainnet reliability.
 */
export const getWalletAddChainParams = (chainId) => {
  const net = getNetworkByChainId(chainId);
  if (!net || !net.rpcUrl) return null;
  const rpcUrls = net.rpcUrls && net.rpcUrls.length > 0
    ? net.rpcUrls.filter(Boolean)
    : [net.rpcUrl];
  if (rpcUrls.length === 0) return null;
  return {
    chainId: `0x${Number(chainId).toString(16)}`,
    chainName: net.name,
    nativeCurrency: net.nativeCurrency || { name: net.symbol || 'ETH', symbol: net.symbol || 'ETH', decimals: 18 },
    rpcUrls,
    blockExplorerUrls: net.explorer ? [net.explorer] : []
  };
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