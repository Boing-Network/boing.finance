// Contract addresses configuration for different networks
export const CONTRACTS = {
  // Boing Network L1 testnet — native chain; EVM-style contracts not used on-chain yet.
  6913: {
    governor: '0x0000000000000000000000000000000000000000',
    boingToken: '0x0000000000000000000000000000000000000000',
    treasury: '0x0000000000000000000000000000000000000000',
    nftStaking: '0x0000000000000000000000000000000000000000',
    /** 32-byte Boing `AccountId` of deployed `constant_product_pool_bytecode` (see boing.network `dump_native_amm_pool` example). Overridden by `REACT_APP_BOING_NATIVE_AMM_POOL`. */
    nativeConstantProductPool: '0x0000000000000000000000000000000000000000000000000000000000000000',
    dexFactory: '0x0000000000000000000000000000000000000000',
    dexRouter: '0x0000000000000000000000000000000000000000',
    weth: '0x0000000000000000000000000000000000000000',
    liquidityLocker: '0x0000000000000000000000000000000000000000',
    crossChainBridge: '0x0000000000000000000000000000000000000000',
    priceOracle: '0x0000000000000000000000000000000000000000',
    advancedERC20: '0x0000000000000000000000000000000000000000',
    tokenFactory: '0x0000000000000000000000000000000000000000',
    tokenImplementation: '0x0000000000000000000000000000000000000000',
    tokens: {},
    pairs: {}
  },

  // Sepolia Testnet (UPDATED - DEXFactoryV2 with createPairWithLiquidity function)
  11155111: {
    // Governance & BOING (placeholders - set after deployment)
    governor: '0x0000000000000000000000000000000000000000',
    boingToken: '0x0000000000000000000000000000000000000000',
    treasury: '0x0000000000000000000000000000000000000000',
    nftStaking: '0x0000000000000000000000000000000000000000',
    // DEXFactory System (LATEST - DEXFactoryV2 with single-transaction pool creation)
    dexFactory: '0x291A02126420b53eCaAE518466Ac65C8482D3feb',
    dexRouter: '0x972c117e983AD0D97b4182b2Fb7b39635b29E47d',
    weth: '0x49c39B1792CCE5fAf861Ed12Cd2d89bBabfE6c5C',
    liquidityLocker: '0x187E7ee6396B99D1b362200B62F6d02125c94044',
    crossChainBridge: '0x8c97Bcf628B23f7A6EC19610403C3f0190561355',
    priceOracle: '0x4C12de794D599f3B0Fcb479baAD4E42929cB5A02',
    advancedERC20: '0x6E5D899889C02d4Ff6b68900e5e06297318F9e3C',
    // TokenFactory System (UPDATED - Fixed name/symbol issue)
    tokenFactory: '0x04162CEFbFC104DD722c9f9a06e135995D231898',
    tokenImplementation: '0x3240BA1CedFCb7876fef576493Aef88212E68cbf',
    tokens: {
      // Mock tokens from your DEX
      mockUSDC: '0x5Ce254ab41228D8d11FA29264a822887b914b87E',
      mockETH: '0x9C8259CB48dA8f3beAe8D69F29Df3aC7487c9D3A',
      mockDAI: '0xe9Cc8De05a0FC3829204D5415de9fF47Da7EA87d',
      // Common Sepolia tokens
      WETH: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
      USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      LINK: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
      ENS: '0x6090A6e47849629b7245Dfa1Ca21D94cd15878Ef',
      USDT: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
      DAI: '0x68194a729C2450ad26072b3D33ADaCbcef39D574',
      // Add your custom tokens here if they're commonly used
      BOING: '0x6E5D899889C02d4Ff6b68900e5e06297318F9e3C' // Your BOING token
    },
    pairs: {
      usdcEth: '0xcAfaF837edD067298F923a3B5a4310Ee3AA18fAf',
      usdcDai: '0xF4dA73695fE1b5b952Eb9aD25695074909Adf093'
    }
  },

  // Ethereum Mainnet (UPDATED - Latest Deployment)
  1: {
    governor: '0x0000000000000000000000000000000000000000',
    boingToken: '0x0000000000000000000000000000000000000000',
    treasury: '0x0000000000000000000000000000000000000000',
    nftStaking: '0x0000000000000000000000000000000000000000',
    dexFactory: '0x0000000000000000000000000000000000000000',
    dexRouter: '0x0000000000000000000000000000000000000000',
    weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Real WETH address
    crossChainBridge: '0x0000000000000000000000000000000000000000',
    priceOracle: '0x0000000000000000000000000000000000000000',
    // TokenFactory System (LATEST - Enhanced Version)
    tokenFactory: '0x3c656B835dF7A16574d4612C488bE03aAd2193Fc',
    tokenImplementation: '0x75c2709245fbe56B6133515C49cD35F31533d5Dc',
    tokens: {
      usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Real USDC address
      usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      dai: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
    },
    pairs: {}
  },

  // Base Mainnet (UPDATED - Enhanced Version)
  8453: {
    dexFactory: '0x0000000000000000000000000000000000000000', // Not deployed yet
    dexRouter: '0x0000000000000000000000000000000000000000', // Not deployed yet
    weth: '0x4200000000000000000000000000000000000006', // WETH on Base
    crossChainBridge: '0x0000000000000000000000000000000000000000', // Not deployed yet
    priceOracle: '0x0000000000000000000000000000000000000000', // Not deployed yet
    advancedERC20: '0x3c90c507B831353a6D21C34204007466C799667f', // ✅ DEPLOYED
    // TokenFactory System (LATEST - Enhanced Version)
    tokenFactory: '0xBC0180d73C45901eC98eebeB3a97cF2BC8f8d5Ef',
    tokenImplementation: '0x92524Eb972d70005Eea9Ff8e89307D1e03005cF3',
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
    // TokenFactory System (UPDATED - Fixed Name/Symbol Issue)
    tokenFactory: '0xDb165D34B49f21FE6773FE27E3e61BE6E1c2C7cc',
    tokenImplementation: '0xB210Cd7D62f4788943d57e6bb13d33B723393aD7',
    tokens: {
      usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      usdt: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      dai: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'
    },
    pairs: {}
  },

  // BSC Mainnet (UPDATED - Enhanced Version)
  56: {
    dexFactory: '0x0000000000000000000000000000000000000000', // Not deployed yet
    dexRouter: '0x0000000000000000000000000000000000000000', // Not deployed yet
    weth: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB on BSC
    crossChainBridge: '0x0000000000000000000000000000000000000000', // Not deployed yet
    priceOracle: '0x0000000000000000000000000000000000000000', // Not deployed yet
    advancedERC20: '0x0000000000000000000000000000000000000000', // Not deployed yet
    // TokenFactory System (LATEST - Enhanced Version)
    tokenFactory: '0xB210Cd7D62f4788943d57e6bb13d33B723393aD7',
    tokenImplementation: '0xd3Ccd760974CdCBE8dE6169bbF7d2Bc618c87F36',
    tokens: {
      usdc: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      usdt: '0x55d398326f99059fF775485246999027B3197955',
      busd: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'
    },
    pairs: {}
  },

  // Optimism Mainnet (UPDATED - Enhanced Version)
  10: {
    dexFactory: '0x0000000000000000000000000000000000000000', // Not deployed yet
    dexRouter: '0x0000000000000000000000000000000000000000', // Not deployed yet
    weth: '0x4200000000000000000000000000000000000006', // WETH on Optimism
    crossChainBridge: '0x0000000000000000000000000000000000000000', // Not deployed yet
    priceOracle: '0x0000000000000000000000000000000000000000', // Not deployed yet
    advancedERC20: '0x0000000000000000000000000000000000000000', // Not deployed yet
    // TokenFactory System (LATEST - Enhanced Version)
    tokenFactory: '0x92524Eb972d70005Eea9Ff8e89307D1e03005cF3',
    tokenImplementation: '0x61907A03243513931196023FA4Ac31Ec8Df3Def4',
    tokens: {
      usdc: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // USDC on Optimism
      usdt: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', // USDT on Optimism
      dai: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1' // DAI on Optimism
    },
    pairs: {}
  },

  // Arbitrum One Mainnet (UPDATED - Latest Deployment)
  42161: {
    dexFactory: '0x0000000000000000000000000000000000000000',
    dexRouter: '0x0000000000000000000000000000000000000000',
    weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH on Arbitrum
    crossChainBridge: '0x0000000000000000000000000000000000000000',
    priceOracle: '0x0000000000000000000000000000000000000000',
    // TokenFactory System (LATEST - Enhanced Version)
    tokenFactory: '0xd3Ccd760974CdCBE8dE6169bbF7d2Bc618c87F36',
    tokenImplementation: '0x84CA5c112CcEB034a2fE74f83026875c9d9f705B',
    tokens: {
      usdc: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // USDC on Arbitrum
      usdt: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT on Arbitrum
      dai: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1' // DAI on Arbitrum
    },
    pairs: {}
  },

  // Avalanche C-Chain (placeholder - TokenFactory deployment pending)
  43114: {
    dexFactory: '0x0000000000000000000000000000000000000000',
    dexRouter: '0x0000000000000000000000000000000000000000',
    weth: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', // WAVAX on Avalanche
    crossChainBridge: '0x0000000000000000000000000000000000000000',
    priceOracle: '0x0000000000000000000000000000000000000000',
    tokenFactory: '0x0000000000000000000000000000000000000000',
    tokenImplementation: '0x0000000000000000000000000000000000000000',
    tokens: {},
    pairs: {}
  },

  // Fantom (placeholder - TokenFactory deployment pending)
  250: {
    dexFactory: '0x0000000000000000000000000000000000000000',
    dexRouter: '0x0000000000000000000000000000000000000000',
    weth: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83', // WFTM on Fantom
    crossChainBridge: '0x0000000000000000000000000000000000000000',
    priceOracle: '0x0000000000000000000000000000000000000000',
    tokenFactory: '0x0000000000000000000000000000000000000000',
    tokenImplementation: '0x0000000000000000000000000000000000000000',
    tokens: {},
    pairs: {}
  },

  // Linea (placeholder - TokenFactory deployment pending)
  59144: {
    dexFactory: '0x0000000000000000000000000000000000000000',
    dexRouter: '0x0000000000000000000000000000000000000000',
    weth: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f', // WETH on Linea
    crossChainBridge: '0x0000000000000000000000000000000000000000',
    priceOracle: '0x0000000000000000000000000000000000000000',
    tokenFactory: '0x0000000000000000000000000000000000000000',
    tokenImplementation: '0x0000000000000000000000000000000000000000',
    tokens: {},
    pairs: {}
  },

  // zkSync Era (placeholder - TokenFactory deployment pending)
  324: {
    dexFactory: '0x0000000000000000000000000000000000000000',
    dexRouter: '0x0000000000000000000000000000000000000000',
    weth: '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91', // WETH on zkSync Era
    crossChainBridge: '0x0000000000000000000000000000000000000000',
    priceOracle: '0x0000000000000000000000000000000000000000',
    tokenFactory: '0x0000000000000000000000000000000000000000',
    tokenImplementation: '0x0000000000000000000000000000000000000000',
    tokens: {},
    pairs: {}
  },

  // Scroll (placeholder - TokenFactory deployment pending)
  534352: {
    dexFactory: '0x0000000000000000000000000000000000000000',
    dexRouter: '0x0000000000000000000000000000000000000000',
    weth: '0x5300000000000000000000000000000000000004', // WETH on Scroll
    crossChainBridge: '0x0000000000000000000000000000000000000000',
    priceOracle: '0x0000000000000000000000000000000000000000',
    tokenFactory: '0x0000000000000000000000000000000000000000',
    tokenImplementation: '0x0000000000000000000000000000000000000000',
    tokens: {},
    pairs: {}
  },

  // Polygon zkEVM (placeholder - TokenFactory deployment pending)
  1101: {
    dexFactory: '0x0000000000000000000000000000000000000000',
    dexRouter: '0x0000000000000000000000000000000000000000',
    weth: '0x4F9A0e7FD2Bf6067db6994CF12E4495Df938E6e9', // WETH on Polygon zkEVM
    crossChainBridge: '0x0000000000000000000000000000000000000000',
    priceOracle: '0x0000000000000000000000000000000000000000',
    tokenFactory: '0x0000000000000000000000000000000000000000',
    tokenImplementation: '0x0000000000000000000000000000000000000000',
    tokens: {},
    pairs: {}
  },

  // Mantle (placeholder - TokenFactory deployment pending)
  5000: {
    dexFactory: '0x0000000000000000000000000000000000000000',
    dexRouter: '0x0000000000000000000000000000000000000000',
    weth: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8', // WMNT on Mantle
    crossChainBridge: '0x0000000000000000000000000000000000000000',
    priceOracle: '0x0000000000000000000000000000000000000000',
    tokenFactory: '0x0000000000000000000000000000000000000000',
    tokenImplementation: '0x0000000000000000000000000000000000000000',
    tokens: {},
    pairs: {}
  },

  // Blast (placeholder - TokenFactory deployment pending)
  81457: {
    dexFactory: '0x0000000000000000000000000000000000000000',
    dexRouter: '0x0000000000000000000000000000000000000000',
    weth: '0x4300000000000000000000000000000000000004', // WETH on Blast
    crossChainBridge: '0x0000000000000000000000000000000000000000',
    priceOracle: '0x0000000000000000000000000000000000000000',
    tokenFactory: '0x0000000000000000000000000000000000000000',
    tokenImplementation: '0x0000000000000000000000000000000000000000',
    tokens: {},
    pairs: {}
  },

  // opBNB (placeholder - TokenFactory deployment pending)
  204: {
    dexFactory: '0x0000000000000000000000000000000000000000',
    dexRouter: '0x0000000000000000000000000000000000000000',
    weth: '0x4200000000000000000000000000000000000006', // WBNB on opBNB (OP Stack)
    crossChainBridge: '0x0000000000000000000000000000000000000000',
    priceOracle: '0x0000000000000000000000000000000000000000',
    tokenFactory: '0x0000000000000000000000000000000000000000',
    tokenImplementation: '0x0000000000000000000000000000000000000000',
    tokens: {},
    pairs: {}
  },

  // Mode (placeholder - TokenFactory deployment pending)
  34443: {
    dexFactory: '0x0000000000000000000000000000000000000000',
    dexRouter: '0x0000000000000000000000000000000000000000',
    weth: '0x4200000000000000000000000000000000000006', // WETH on Mode (OP Stack)
    crossChainBridge: '0x0000000000000000000000000000000000000000',
    priceOracle: '0x0000000000000000000000000000000000000000',
    tokenFactory: '0x0000000000000000000000000000000000000000',
    tokenImplementation: '0x0000000000000000000000000000000000000000',
    tokens: {},
    pairs: {}
  },

  // Sepolia testnet
  sepolia: {
    tokenFactory: "0xFCE72cbF657D39b7Bf2913865924A8229A21703d", // Updated deployment
    tokenImplementation: "0xCbCcE707b62615163d4582fC74476Dce747874B5", // Updated deployment
    // Previous deployments (for reference)
    previousTokenFactory: "0x1eDA8d360aC7E74f3e5Edf1E86984787E8BB1072",
    previousTokenImplementation: "0xE4A6b9163accC9526732767E5e8da2C69661DCFF"
  },
  
  // Ethereum mainnet (UPDATED)
  mainnet: {
    tokenFactory: "0x3c656B835dF7A16574d4612C488bE03aAd2193Fc",
    tokenImplementation: "0x75c2709245fbe56B6133515C49cD35F31533d5Dc"
  },
  
  // Polygon (UPDATED)
  polygon: {
    tokenFactory: '0xDb165D34B49f21FE6773FE27E3e61BE6E1c2C7cc',
    tokenImplementation: '0xB210Cd7D62f4788943d57e6bb13d33B723393aD7'
  },
  
  // BSC (UPDATED)
  bsc: {
    tokenFactory: "0xB210Cd7D62f4788943d57e6bb13d33B723393aD7",
    tokenImplementation: "0xd3Ccd760974CdCBE8dE6169bbF7d2Bc618c87F36"
  },
  
  // Arbitrum (UPDATED)
  arbitrum: {
    tokenFactory: '0xd3Ccd760974CdCBE8dE6169bbF7d2Bc618c87F36',
    tokenImplementation: '0x84CA5c112CcEB034a2fE74f83026875c9d9f705B'
  },
  
  // Optimism (UPDATED)
  optimism: {
    tokenFactory: '0x92524Eb972d70005Eea9Ff8e89307D1e03005cF3',
    tokenImplementation: '0x61907A03243513931196023FA4Ac31Ec8Df3Def4'
  },
  
  // Base (UPDATED)
  base: {
    tokenFactory: '0xBC0180d73C45901eC98eebeB3a97cF2BC8f8d5Ef',
    tokenImplementation: '0x92524Eb972d70005Eea9Ff8e89307D1e03005cF3'
  }
};

// Optional: enable in-app native CP pool swap on Boing L1 (32-byte hex AccountId).
(function applyBoingNativeAmmPoolFromEnv() {
  try {
    const v =
      typeof process !== 'undefined' && process.env && process.env.REACT_APP_BOING_NATIVE_AMM_POOL;
    if (!v || typeof v !== 'string' || !CONTRACTS[6913]) return;
    const t = v.trim();
    if (/^0x[0-9a-fA-F]{64}$/i.test(t)) {
      CONTRACTS[6913].nativeConstantProductPool = `0x${t.slice(2).toLowerCase()}`;
    }
  } catch {
    /* ignore */
  }
})();

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