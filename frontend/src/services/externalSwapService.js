import { ethers } from 'ethers';

// External DEX configurations for Sepolia
const EXTERNAL_DEX_CONFIG = {
  11155111: { // Sepolia
    // Note: Sepolia may not have the same DEX ecosystem as mainnet
    // These are the standard Uniswap V2 addresses, but they may not be deployed on Sepolia
    uniswapV2: {
      router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      name: 'Uniswap V2',
      fee: 0.003 // 0.3%
    }
    // Removed SushiSwap as it may not be deployed on Sepolia
  }
};

// Router ABIs for external DEXs
const ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
];

// Factory ABIs for checking pairs
const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
  'function allPairsLength() external view returns (uint256)',
  'function allPairs(uint256) external view returns (address)'
];

// Pair ABIs for getting reserves
const PAIR_ABI = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function totalSupply() external view returns (uint256)'
];

// Token ABIs
const TOKEN_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)'
];

class ExternalSwapService {
  constructor() {
    this.provider = null;
    this.debug = true;
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
  }

  async initialize(provider) {
    this.provider = provider;
    if (this.debug) {
      console.log('🔄 ExternalSwapService initialized');
    }
  }

  // Get swap quotes from all available DEXs
  async getSwapQuotes(tokenIn, tokenOut, amountIn, chainId = 11155111) {
    if (!this.provider) {
      throw new Error('Service not initialized');
    }

    const quotes = [];
    const dexConfig = EXTERNAL_DEX_CONFIG[chainId];
    
    if (!dexConfig) {
      console.log('No external DEXs configured for chainId:', chainId);
      return quotes;
    }

    // Get quotes from each DEX
    for (const [dexName, dexConfigItem] of Object.entries(dexConfig)) {
      try {
        const quote = await this.getQuoteFromDEX(
          dexName,
          dexConfigItem,
          tokenIn,
          tokenOut,
          amountIn
        );
        
        if (quote) {
          quotes.push(quote);
        }
      } catch (error) {
        if (this.debug) {
          console.log(`❌ Failed to get quote from ${dexName}:`, error.message);
        }
      }
    }

    // Sort by best rate (highest output amount)
    quotes.sort((a, b) => {
      const rateA = parseFloat(a.amountOut);
      const rateB = parseFloat(b.amountOut);
      return rateB - rateA;
    });

    if (this.debug) {
      console.log(`📊 Got ${quotes.length} quotes from external DEXs:`, quotes);
    }

    return quotes;
  }

  // Get quote from a specific DEX
  async getQuoteFromDEX(dexName, dexConfigItem, tokenIn, tokenOut, amountIn) {
    try {
      // First check if the contracts are deployed
      const routerCode = await this.provider.getCode(dexConfigItem.router);
      const factoryCode = await this.provider.getCode(dexConfigItem.factory);
      
      if (routerCode === '0x' || factoryCode === '0x') {
        if (this.debug) {
          console.log(`❌ ${dexName} contracts not deployed on this network`);
        }
        return null;
      }

      const router = new ethers.Contract(dexConfigItem.router, ROUTER_ABI, this.provider);
      
      // Check if pair exists
      const factory = new ethers.Contract(dexConfigItem.factory, FACTORY_ABI, this.provider);
      const pairAddress = await factory.getPair(tokenIn, tokenOut);
      
      if (pairAddress === '0x0000000000000000000000000000000000000000') {
        if (this.debug) {
          console.log(`❌ No pair found in ${dexName} for ${tokenIn}/${tokenOut}`);
        }
        return null;
      }

      // Get reserves to check liquidity
      const pair = new ethers.Contract(pairAddress, PAIR_ABI, this.provider);
      const reserves = await pair.getReserves();
      
      if (reserves[0] === 0n || reserves[1] === 0n) {
        if (this.debug) {
          console.log(`❌ No liquidity in ${dexName} pair ${pairAddress}`);
        }
        return null;
      }

      // Get quote
      const path = [tokenIn, tokenOut];
      const amountsOut = await router.getAmountsOut(amountIn, path);
      
      if (!amountsOut || amountsOut.length < 2 || amountsOut[1] === 0n) {
        if (this.debug) {
          console.log(`❌ No quote available from ${dexName}`);
        }
        return null;
      }

      // Get token info for formatting
      const [tokenInContract, tokenOutContract] = [
        new ethers.Contract(tokenIn, TOKEN_ABI, this.provider),
        new ethers.Contract(tokenOut, TOKEN_ABI, this.provider)
      ];

      const [tokenInSymbol, tokenOutSymbol, tokenInDecimals, tokenOutDecimals] = await Promise.all([
        tokenInContract.symbol(),
        tokenOutContract.symbol(),
        tokenInContract.decimals(),
        tokenOutContract.decimals()
      ]);

      const amountOutFormatted = ethers.formatUnits(amountsOut[1], tokenOutDecimals);
      const amountInFormatted = ethers.formatUnits(amountIn, tokenInDecimals);

      const quote = {
        dex: dexName,
        dexName: dexConfigItem.name,
        router: dexConfigItem.router,
        pairAddress,
        tokenIn,
        tokenOut,
        tokenInSymbol,
        tokenOutSymbol,
        amountIn: amountInFormatted,
        amountOut: amountOutFormatted,
        amountInWei: amountIn.toString(),
        amountOutWei: amountsOut[1].toString(),
        path,
        fee: dexConfigItem.fee,
        priceImpact: this.calculatePriceImpact(amountIn, reserves[0], amountsOut[1], reserves[1]),
        gasEstimate: this.estimateGas(dexName, amountIn, amountsOut[1])
      };

      if (this.debug) {
        console.log(`✅ ${dexName} quote:`, quote);
      }

      return quote;
    } catch (error) {
      if (this.debug) {
        console.log(`❌ Error getting quote from ${dexName}:`, error.message);
      }
      return null;
    }
  }

  // Calculate price impact
  calculatePriceImpact(amountIn, reserveIn, amountOut, reserveOut) {
    try {
      const priceBefore = reserveOut / reserveIn;
      const priceAfter = (reserveOut - amountOut) / (reserveIn + amountIn);
      const priceImpact = ((priceBefore - priceAfter) / priceBefore) * 100;
      return Math.abs(priceImpact);
    } catch (error) {
      return 0;
    }
  }

  // Estimate gas for swap
  estimateGas(dexName, _amountIn, _amountOut) {
    // Rough gas estimates for different DEXs
    const gasEstimates = {
      'uniswapV2': 150000,
      'sushiswap': 150000
    };
    return gasEstimates[dexName] || 200000;
  }

  // Execute swap on external DEX
  async executeSwap(quote, signer, slippageTolerance = 0.5) {
    if (!signer) {
      throw new Error('Signer required for swap execution');
    }

    try {
      const router = new ethers.Contract(quote.router, ROUTER_ABI, signer);
      
      // Calculate minimum amount out with slippage
      const minAmountOut = BigInt(quote.amountOutWei) * BigInt(Math.floor((100 - slippageTolerance) * 100)) / BigInt(10000);
      
      // Calculate deadline
      const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes
      
      let tx;
      
      if (quote.tokenInSymbol === 'WETH' || quote.tokenInSymbol === 'ETH') {
        // Swap ETH for tokens
        tx = await router.swapExactETHForTokens(
          minAmountOut,
          quote.path,
          await signer.getAddress(),
          deadline,
          {
            value: quote.amountInWei,
            gasLimit: quote.gasEstimate
          }
        );
      } else if (quote.tokenOutSymbol === 'WETH' || quote.tokenOutSymbol === 'ETH') {
        // Swap tokens for ETH
        tx = await router.swapExactTokensForETH(
          quote.amountInWei,
          minAmountOut,
          quote.path,
          await signer.getAddress(),
          deadline,
          {
            gasLimit: quote.gasEstimate
          }
        );
      } else {
        // Swap tokens for tokens
        tx = await router.swapExactTokensForTokens(
          quote.amountInWei,
          minAmountOut,
          quote.path,
          await signer.getAddress(),
          deadline,
          {
            gasLimit: quote.gasEstimate
          }
        );
      }

      return {
        txHash: tx.hash,
        dex: quote.dex,
        dexName: quote.dexName,
        amountIn: quote.amountIn,
        amountOut: quote.amountOut,
        tokenInSymbol: quote.tokenInSymbol,
        tokenOutSymbol: quote.tokenOutSymbol
      };
    } catch (error) {
      throw new Error(`Failed to execute swap on ${quote.dexName}: ${error.message}`);
    }
  }

  // Check if token approval is needed
  async checkApproval(tokenAddress, spenderAddress, amount, signer) {
    try {
      const token = new ethers.Contract(tokenAddress, TOKEN_ABI, signer);
      const allowance = await token.allowance(await signer.getAddress(), spenderAddress);
      return allowance >= amount;
    } catch (error) {
      console.error('Error checking approval:', error);
      return false;
    }
  }

  // Approve token for external DEX
  async approveToken(tokenAddress, spenderAddress, signer) {
    try {
      const token = new ethers.Contract(tokenAddress, TOKEN_ABI, signer);
      const tx = await token.approve(spenderAddress, ethers.MaxUint256);
      return tx;
    } catch (error) {
      throw new Error(`Failed to approve token: ${error.message}`);
    }
  }

  // Get all available DEXs for a network
  getAvailableDEXs(chainId) {
    const dexConfig = EXTERNAL_DEX_CONFIG[chainId];
    if (!dexConfig) return [];
    
    return Object.entries(dexConfig).map(([key, config]) => ({
      id: key,
      name: config.name,
      router: config.router,
      factory: config.factory,
      fee: config.fee
    }));
  }

  // Check if external DEXs are available for a network
  isExternalDEXsAvailable(chainId) {
    return !!EXTERNAL_DEX_CONFIG[chainId];
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    if (this.debug) {
      console.log('🗑️ External swap cache cleared');
    }
  }
}

// Export singleton instance
const externalSwapService = new ExternalSwapService();
export default externalSwapService; 