// Contract addresses configuration for different networks
export const CONTRACTS = {
  // Sepolia Testnet
  11155111: {
    dexFactory: '0xAcB1ee4D411aA0c3C1C46999fB61E521D2D58851',
    dexRouter: '0x6354A9d4f779e85CE65535845F775DFEfe31AdB8',
    weth: '0xc832cde537bD890e9EB52fa5b8430b925C2a2A1F',
    crossChainBridge: '0x8c97Bcf628B23f7A6EC19610403C3f0190561355',
    priceOracle: '0x4C12de794D599f3B0Fcb479baAD4E42929cB5A02',
    advancedERC20: '0x6E5D899889C02d4Ff6b68900e5e06297318F9e3C',
    // TokenFactory System (UPDATED - Fresh deployment with custom security parameters)
    tokenFactory: '0xF6837c7142A97bE35ef04148522748EA288b494b',
    tokenImplementation: '0x8e576F4F8e841B9B688f71b4A92C7cED26267e68',
    tokens: {
      mockUSDC: '0x5Ce254ab41228D8d11FA29264a822887b914b87E',
      mockETH: '0x9C8259CB48dA8f3beAe8D69F29Df3aC7487c9D3A',
      mockDAI: '0xe9Cc8De05a0FC3829204D5415de9fF47Da7EA87d'
    },
    pairs: {
      usdcEth: '0xcAfaF837edD067298F923a3B5a4310Ee3AA18fAf',
      usdcDai: '0xF4dA73695fE1b5b952Eb9aD25695074909Adf093'
    }
  },

  // Ethereum Mainnet (UPDATED - Fresh deployment)
  1: {
    dexFactory: '0x0000000000000000000000000000000000000000',
    dexRouter: '0x0000000000000000000000000000000000000000',
    weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Real WETH address
    crossChainBridge: '0x0000000000000000000000000000000000000000',
    priceOracle: '0x0000000000000000000000000000000000000000',
    // TokenFactory System (DEPLOYED)
    tokenFactory: '0xa40Cac462b983f8F69Eb258411F588b3e575F90E',
    tokenImplementation: '0x0C4BcF0e9707266Be1543240fC613A163B5b99d1',
    tokens: {
      usdc: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8', // Placeholder
      usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      dai: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
    },
    pairs: {}
  },

  // Base Mainnet (NEWLY DEPLOYED)
  8453: {
    dexFactory: '0x0000000000000000000000000000000000000000', // Not deployed yet
    dexRouter: '0x0000000000000000000000000000000000000000', // Not deployed yet
    weth: '0x4200000000000000000000000000000000000006', // WETH on Base
    crossChainBridge: '0x0000000000000000000000000000000000000000', // Not deployed yet
    priceOracle: '0x0000000000000000000000000000000000000000', // Not deployed yet
    advancedERC20: '0x3c90c507B831353a6D21C34204007466C799667f', // ✅ DEPLOYED
    // TokenFactory System (DEPLOYED)
    tokenFactory: '0x594f4560A5fd52b49E824689Ec09770DB249Eca5',
    tokenImplementation: '0x48b3c4E011a8eEF87C60c257eaa004dABb86Ce3b',
    tokens: {
      usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
      usdt: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // USDT on Base
      dai: '0x0000000000000000000000000000000000000000' // Not available on Base
    },
    pairs: {}
  },

  // Polygon Mainnet (placeholder - contracts not deployed yet)
  137: {
    dexFactory: '0x0000000000000000000000000000000000000000',
    dexRouter: '0x0000000000000000000000000000000000000000',
    weth: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC address
    crossChainBridge: '0x0000000000000000000000000000000000000000',
    priceOracle: '0x0000000000000000000000000000000000000000',
    // TokenFactory System (DEPLOYED)
    tokenFactory: '0x1FAF7d4CAF23C1Ac79257ca74900011d2B7240A8',
    tokenImplementation: '0x594f4560A5fd52b49E824689Ec09770DB249Eca5',
    tokens: {
      usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      usdt: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      dai: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'
    },
    pairs: {}
  },

  // BSC Mainnet (NEWLY DEPLOYED)
  56: {
    dexFactory: '0x0000000000000000000000000000000000000000', // Not deployed yet
    dexRouter: '0x0000000000000000000000000000000000000000', // Not deployed yet
    weth: '0xbb4CdB9CBd36B01bD1cBaEF2aF8C6b1c6c6c6c6c', // WBNB address
    crossChainBridge: '0x0000000000000000000000000000000000000000', // Not deployed yet
    priceOracle: '0x0000000000000000000000000000000000000000', // Not deployed yet
    advancedERC20: '0x0000000000000000000000000000000000000000', // Not deployed yet
    // TokenFactory System (DEPLOYED)
    tokenFactory: '0x594f4560A5fd52b49E824689Ec09770DB249Eca5',
    tokenImplementation: '0x48b3c4E011a8eEF87C60c257eaa004dABb86Ce3b',
    tokens: {
      usdc: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      usdt: '0x55d398326f99059fF775485246999027B3197955',
      busd: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'
    },
    pairs: {}
  },

  // Optimism Mainnet (NEWLY DEPLOYED)
  10: {
    dexFactory: '0x0000000000000000000000000000000000000000', // Not deployed yet
    dexRouter: '0x0000000000000000000000000000000000000000', // Not deployed yet
    weth: '0x4200000000000000000000000000000000000006', // WETH on Optimism
    crossChainBridge: '0x0000000000000000000000000000000000000000', // Not deployed yet
    priceOracle: '0x0000000000000000000000000000000000000000', // Not deployed yet
    advancedERC20: '0x0000000000000000000000000000000000000000', // Not deployed yet
    // TokenFactory System (DEPLOYED)
    tokenFactory: '0xd3Ccd760974CdCBE8dE6169bbF7d2Bc618c87F36',
    tokenImplementation: '0x84CA5c112CcEB034a2fE74f83026875c9d9f705B',
    tokens: {
      usdc: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // USDC on Optimism
      usdt: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', // USDT on Optimism
      dai: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1' // DAI on Optimism
    },
    pairs: {}
  },

  // Arbitrum One Mainnet (NEWLY DEPLOYED)
  42161: {
    dexFactory: '0x0000000000000000000000000000000000000000',
    dexRouter: '0x0000000000000000000000000000000000000000',
    weth: '0x0000000000000000000000000000000000000000',
    crossChainBridge: '0x0000000000000000000000000000000000000000',
    priceOracle: '0x0000000000000000000000000000000000000000',
    // TokenFactory System (DEPLOYED)
    tokenFactory: '0x48b3c4E011a8eEF87C60c257eaa004dABb86Ce3b',
    tokenImplementation: '0x3213695638B2748678C6bcd812e8913C25f520B5',
    tokens: {},
    pairs: {}
  },

  // Sepolia testnet
  sepolia: {
    tokenFactory: "0xF6837c7142A97bE35ef04148522748EA288b494b", // Freshly deployed with custom security parameters
    tokenImplementation: "0x8e576F4F8e841B9B688f71b4A92C7cED26267e68",
    // Previous deployments (for reference)
    previousTokenFactory: "0x1eDA8d360aC7E74f3e5Edf1E86984787E8BB1072",
    previousTokenImplementation: "0xE4A6b9163accC9526732767E5e8da2C69661DCFF"
  },
  
  // Ethereum mainnet (placeholder)
  mainnet: {
    tokenFactory: "0xa40Cac462b983f8F69Eb258411F588b3e575F90E",
    tokenImplementation: "0x0C4BcF0e9707266Be1543240fC613A163B5b99d1"
  },
  
  // Polygon (placeholder)
  polygon: {
    tokenFactory: '0x1FAF7d4CAF23C1Ac79257ca74900011d2B7240A8',
    tokenImplementation: '0x594f4560A5fd52b49E824689Ec09770DB249Eca5'
  },
  
  // BSC (placeholder)
  bsc: {
    tokenFactory: "0x594f4560A5fd52b49E824689Ec09770DB249Eca5",
    tokenImplementation: "0x48b3c4E011a8eEF87C60c257eaa004dABb86Ce3b"
  },
  
  // Arbitrum (placeholder)
  arbitrum: {
    tokenFactory: '0x48b3c4E011a8eEF87C60c257eaa004dABb86Ce3b',
    tokenImplementation: '0x3213695638B2748678C6bcd812e8913C25f520B5'
  },
  
  // Base (placeholder)
  base: {
    tokenFactory: '0x594f4560A5fd52b49E824689Ec09770DB249Eca5',
    tokenImplementation: '0x48b3c4E011a8eEF87C60c257eaa004dABb86Ce3b'
  }
};

// Helper function to get contract addresses for a specific network
export const getContractAddresses = (chainId) => {
  return CONTRACTS[chainId] || null;
};

// Helper function to get a specific contract address
export const getContractAddress = (chainId, contractName) => {
  const contracts = getContractAddresses(chainId);
  if (!contracts) return null;

  // Handle nested contract names (e.g., 'tokens.mockUSDC')
  const parts = contractName.split('.');
  let result = contracts;
  for (const part of parts) {
    if (result && typeof result === 'object' && part in result) {
      result = result[part];
    } else {
      return null;
    }
  }
  return result;
};

// Helper function to check if contracts are deployed for a network
export const isNetworkSupported = (chainId) => {
  const contracts = getContractAddresses(chainId);
  if (!contracts) return false;
  
  // Check if core contracts are deployed (not zero addresses)
  return contracts.dexFactory !== '0x0000000000000000000000000000000000000000';
};

// Helper function to get supported networks
export const getSupportedNetworks = () => {
  return Object.keys(CONTRACTS)
    .map(chainId => parseInt(chainId))
    .filter(chainId => isNetworkSupported(chainId));
};

// Default export
export default CONTRACTS; 