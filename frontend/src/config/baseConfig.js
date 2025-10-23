import { useState, useEffect } from 'react';

// Base network specific configuration for Boing Finance
export const BASE_CONFIG = {
  // Base network details
  network: {
    chainId: 8453,
    chainName: 'Base',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockTime: 2,
    gasLimit: 30000000,
    features: ['rollup', 'coinbaseBacked', 'lowFees', 'fastFinality']
  },

  // Base App mini app configuration
  miniApp: {
    name: 'Boing Finance',
    description: 'Cross-chain DEX for token deployment and trading',
    category: 'finance',
    tags: ['defi', 'dex', 'trading', 'tokens', 'cross-chain'],
    version: '1.0.0',
    author: 'Boing Finance',
    homepage: 'https://boing.finance',
    support: 'https://boing.finance/help-center',
    privacy: 'https://boing.finance/privacy',
    terms: 'https://boing.finance/terms'
  },

  // Base-specific features
  features: {
    // Enable Base-specific optimizations
    enableBaseOptimizations: true,
    
    // Gas optimization settings for Base
    gasSettings: {
      // Base has very low gas fees, so we can be more generous
      maxGasPrice: '0.001', // 0.001 ETH max gas price
      gasMultiplier: 1.1, // 10% buffer
      priorityFee: '0.0001', // 0.0001 ETH priority fee
    },

    // Transaction optimization
    transactionSettings: {
      // Base supports EIP-1559, so use type 2 transactions
      type: 2,
      // Base has fast finality, so we can use shorter timeouts
      timeout: 30000, // 30 seconds
      retryAttempts: 3,
    },

    // UI optimizations for Base App
    ui: {
      // Show Base-specific branding
      showBaseBranding: true,
      // Optimize for mobile (Base App is primarily mobile)
      mobileOptimized: true,
      // Show Base network benefits
      showNetworkBenefits: true,
    }
  },

  // Base-specific contract addresses (if any)
  contracts: {
    // Add Base-specific contract addresses here
    // These would be deployed on Base network
    dexFactory: null, // To be deployed
    dexRouter: null, // To be deployed
    tokenFactory: null, // To be deployed
    bridge: null, // To be deployed
  },

  // Base App integration settings
  integration: {
    // Enable Base App specific features
    enableWalletIntegration: true,
    enableTransactionTracking: true,
    enableAnalytics: true,
    
    // Base App specific callbacks
    callbacks: {
      onWalletConnected: (wallet) => {
        console.log('Wallet connected via Base App:', wallet);
      },
      onNetworkChanged: (network) => {
        console.log('Network changed via Base App:', network);
      },
      onTransactionCompleted: (tx) => {
        console.log('Transaction completed via Base App:', tx);
      },
    }
  },

  // Base network specific RPC endpoints
  rpcEndpoints: [
    'https://mainnet.base.org',
    'https://base-mainnet.g.alchemy.com/v2/demo',
    'https://base-mainnet.infura.io/v3/demo'
  ],

  // Base-specific analytics
  analytics: {
    // Track Base App specific events
    trackBaseAppEvents: true,
    // Base App user identification
    trackUserJourney: true,
    // Performance metrics for Base network
    trackPerformance: true,
  }
};

// Helper functions for Base network
export const baseUtils = {
  // Check if current network is Base
  isBaseNetwork: (chainId) => {
    return chainId === 8453 || chainId === '0x2105';
  },

  // Get Base network configuration
  getBaseNetworkConfig: () => BASE_CONFIG.network,

  // Optimize transaction for Base network
  optimizeTransaction: (txParams) => {
    return {
      ...txParams,
      type: 2, // EIP-1559 transaction
      maxFeePerGas: txParams.maxFeePerGas || '0x3b9aca00', // 1 gwei
      maxPriorityFeePerGas: txParams.maxPriorityFeePerGas || '0x3b9aca', // 0.1 gwei
    };
  },

  // Get Base-specific gas estimates
  getGasEstimate: (operation) => {
    const gasEstimates = {
      tokenDeploy: 2000000, // 2M gas for token deployment
      swap: 150000, // 150k gas for swaps
      addLiquidity: 200000, // 200k gas for adding liquidity
      removeLiquidity: 150000, // 150k gas for removing liquidity
      bridge: 300000, // 300k gas for bridging
    };
    
    return gasEstimates[operation] || 100000; // Default 100k gas
  },

  // Format Base network specific values
  formatBaseValue: (value, decimals = 18) => {
    return (parseFloat(value) / Math.pow(10, decimals)).toFixed(6);
  },

  // Get Base network explorer URL
  getExplorerUrl: (type, value) => {
    const baseUrl = BASE_CONFIG.network.explorer;
    switch (type) {
      case 'tx':
        return `${baseUrl}/tx/${value}`;
      case 'address':
        return `${baseUrl}/address/${value}`;
      case 'token':
        return `${baseUrl}/token/${value}`;
      default:
        return baseUrl;
    }
  }
};

// Base App specific hooks and utilities
export const useBaseFeatures = () => {
  const [isBaseApp, setIsBaseApp] = useState(false);
  const [isBaseNetwork, setIsBaseNetwork] = useState(false);

  useEffect(() => {
    // Check if running in Base App
    const checkBaseApp = () => {
      const inBaseApp = window.parent !== window || 
                       window.location !== window.parent.location ||
                       document.referrer.includes('base.org') ||
                       window.location.href.includes('base.org');
      setIsBaseApp(inBaseApp);
    };

    // Check if on Base network
    const checkBaseNetwork = () => {
      const currentChainId = window.ethereum?.chainId;
      const onBase = currentChainId && parseInt(currentChainId, 16) === 8453;
      setIsBaseNetwork(onBase);
    };

    checkBaseApp();
    checkBaseNetwork();

    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', checkBaseNetwork);
      return () => window.ethereum.removeListener('chainChanged', checkBaseNetwork);
    }
  }, []);

  return {
    isBaseApp,
    isBaseNetwork,
    isOptimized: isBaseApp && isBaseNetwork,
    config: BASE_CONFIG
  };
};

export default BASE_CONFIG;
