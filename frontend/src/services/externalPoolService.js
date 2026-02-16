import { ethers } from 'ethers';

class ExternalPoolService {
  constructor() {
    this.cache = new Map();
    this.tokenCache = new Map(); // Cache for token info
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.tokenCacheTimeout = 10 * 60 * 1000; // 10 minutes for token info
    this.debug = true; // Enable debugging to see what's happening
    this.maxConcurrentRequests = 10; // Limit concurrent requests
    this.requestDelay = 50; // 50ms delay between requests
  }

  /**
   * Get all pools from Sepolia network (including external DEXs)
   */
  async getAllSepoliaPools(provider, limit = 500) {
    const cacheKey = `all-sepolia-pools-${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      if (this.debug) {
        console.log('📊 Using cached external pools data');
      }
      return cached.data;
    }

    try {
      if (this.debug) {
        console.log(`🌐 Fetching up to ${limit} pools from Sepolia network...`);
      }

      // Fetch pools from multiple sources
      const [uniswapPools, sushiswapPools, otherPools] = await Promise.allSettled([
        this.getUniswapPools(provider, limit),
        this.getSushiSwapPools(provider, limit),
        this.getOtherDEXPools(provider, limit)
      ]);

      // Combine all pools
      let allPools = [];
      
      if (uniswapPools.status === 'fulfilled') {
        allPools = allPools.concat(uniswapPools.value);
      }
      
      if (sushiswapPools.status === 'fulfilled') {
        allPools = allPools.concat(sushiswapPools.value);
      }
      
      if (otherPools.status === 'fulfilled') {
        allPools = allPools.concat(otherPools.value);
      }

      // Remove duplicates and sort by TVL/volume
      const uniquePools = this.removeDuplicatePools(allPools);
      const sortedPools = this.sortPoolsByActivity(uniquePools);

      const result = {
        pools: sortedPools,
        totalPools: sortedPools.length,
        sources: {
          uniswap: uniswapPools.status === 'fulfilled' ? uniswapPools.value.length : 0,
          sushiswap: sushiswapPools.status === 'fulfilled' ? sushiswapPools.value.length : 0,
          other: otherPools.status === 'fulfilled' ? otherPools.value.length : 0
        },
        lastUpdated: Date.now()
      };

      // Cache the result
      this.cache.set(cacheKey, {
        timestamp: Date.now(),
        data: result
      });

      if (this.debug) {
        console.log(`🌐 Found ${result.totalPools} total pools on Sepolia:`, result.sources);
      }

      return result;
    } catch (error) {
      console.error('Failed to fetch external pools:', error);
      return {
        pools: [],
        totalPools: 0,
        sources: { uniswap: 0, sushiswap: 0, other: 0 },
        lastUpdated: Date.now(),
        error: error.message
      };
    }
  }

  /**
   * Get pools from Uniswap V2/V3 on Sepolia
   */
  async getUniswapPools(provider, limit = 500) {
    try {
      // Uniswap V2 Factory on Sepolia
      const uniswapV2Factory = '0x7E0987E5b3a30e3f2828572Bb659A548460a3003';
      const uniswapV3Factory = '0x0227628f3F023bb0B980b67D528571c95c6DaC1c';

      if (this.debug) {
        console.log('🦄 Fetching Uniswap pools from factories:', {
          v2: uniswapV2Factory,
          v3: uniswapV3Factory
        });
      }

      const pools = [];

      // Try Uniswap V2
      try {
        if (this.debug) {
          console.log('🦄 Trying Uniswap V2...');
        }
        const v2Pools = await this.getUniswapV2Pools(provider, uniswapV2Factory, limit);
        pools.push(...v2Pools);
        if (this.debug) {
          console.log(`🦄 Uniswap V2 pools found: ${v2Pools.length}`);
        }
      } catch (error) {
        if (this.debug) {
          console.log('❌ Uniswap V2 pools fetch failed:', error.message);
        }
      }

      // Try Uniswap V3
      try {
        if (this.debug) {
          console.log('🦄 Trying Uniswap V3...');
        }
        const v3Pools = await this.getUniswapV3Pools(provider, uniswapV3Factory, limit);
        pools.push(...v3Pools);
        if (this.debug) {
          console.log(`🦄 Uniswap V3 pools found: ${v3Pools.length}`);
        }
      } catch (error) {
        if (this.debug) {
          console.log('❌ Uniswap V3 pools fetch failed:', error.message);
        }
      }

      if (this.debug) {
        console.log(`🦄 Total Uniswap pools: ${pools.length}`);
      }

      return pools;
    } catch (error) {
      console.error('Failed to fetch Uniswap pools:', error);
      return [];
    }
  }

  /**
   * Get Uniswap V2 pools
   */
  async getUniswapV2Pools(provider, factoryAddress, limit = 500) {
    return await this.batchProcessPools(provider, factoryAddress, 'Uniswap V2', limit);
  }

  /**
   * Get Uniswap V3 pools
   */
  async getUniswapV3Pools(provider, factoryAddress, _limit = 500) {
    // Uniswap V3 is more complex, so we'll return a simplified version
    // In a full implementation, you'd need to handle multiple fee tiers and positions
    return [];
  }

  /**
   * Get pools from SushiSwap on Sepolia
   */
  async getSushiSwapPools(provider, limit = 500) {
    try {
      // SushiSwap Factory on Sepolia (if available)
      const sushiswapFactory = '0xC35DADB65012eC5796536bD9864eD8773aBc74C4';
      
      const factoryABI = [
        'function allPairsLength() external view returns (uint)',
        'function allPairs(uint) external view returns (address)'
      ];

      const factory = new ethers.Contract(sushiswapFactory, factoryABI, provider);
      const totalPairs = await factory.allPairsLength();
      
      const pools = [];
      const maxPools = Math.min(Number(totalPairs), limit); // Limit to 30 pools

      for (let i = 0; i < maxPools; i++) {
        try {
          const pairAddress = await factory.allPairs(i);
          const pair = new ethers.Contract(pairAddress, this.getPairABI(), provider);
          
          const [token0, token1, reserves, totalSupply] = await Promise.all([
            pair.token0(),
            pair.token1(),
            pair.getReserves(),
            pair.totalSupply()
          ]);

          const [token0Info, token1Info] = await Promise.all([
            this.getTokenInfo(token0, provider),
            this.getTokenInfo(token1, provider)
          ]);

                  if (token0Info && token1Info) {
          // Convert reserves to human-readable amounts for TVL calculation
          const reserve0Human = parseFloat(ethers.formatUnits(reserves[0], token0Info.decimals));
          const reserve1Human = parseFloat(ethers.formatUnits(reserves[1], token1Info.decimals));
          
          // For now, use a simplified TVL calculation (in a real implementation, you'd get token prices)
          const tvl = reserve0Human + reserve1Human;
          
          pools.push({
            address: pairAddress,
            token0: {
              address: token0,
              ...token0Info,
              reserve: reserves[0],
              formattedReserve: this.formatTokenReserve(reserves[0], token0Info.decimals)
            },
            token1: {
              address: token1,
              ...token1Info,
              reserve: reserves[1],
              formattedReserve: this.formatTokenReserve(reserves[1], token1Info.decimals)
            },
            totalSupply: Number(totalSupply),
            formattedTotalSupply: this.safeFormatUnits(totalSupply, 18),
            fee: 0.003, // SushiSwap default fee
            tvl: tvl,
            formattedTvl: this.formatLargeNumber(tvl, 2, true),
            source: 'SushiSwap',
            chainId: 11155111,
            createdAt: Date.now()
          });
        }
        } catch (error) {
          if (this.debug) {
            console.log(`Failed to fetch SushiSwap pair ${i}:`, error.message);
          }
        }
      }

      return pools;
    } catch (error) {
      console.error('Failed to fetch SushiSwap pools:', error);
      return [];
    }
  }

  /**
   * Get pools from other DEXs on Sepolia
   */
  async getOtherDEXPools(provider, limit = 500) {
    // Add other DEX factories here as needed
    const otherFactories = [
      // Add more DEX factories as they become available on Sepolia
    ];

    const pools = [];
    for (const factoryAddress of otherFactories) {
      try {
        const factoryPools = await this.getPoolsFromFactory(provider, factoryAddress, 'Other DEX', limit);
        pools.push(...factoryPools);
      } catch (error) {
        if (this.debug) {
          console.log(`Failed to fetch pools from factory ${factoryAddress}:`, error.message);
        }
      }
    }

    return pools;
  }

  /**
   * Get pools from a specific factory
   */
  async getPoolsFromFactory(provider, factoryAddress, sourceName, limit = 500) {
    const factoryABI = [
      'function allPairsLength() external view returns (uint)',
      'function allPairs(uint) external view returns (address)'
    ];

    const factory = new ethers.Contract(factoryAddress, factoryABI, provider);
    const totalPairs = await factory.allPairsLength();
    
    const pools = [];
    const maxPools = Math.min(Number(totalPairs), limit);

    // Process in batches for better performance
    const batchSize = 5;
    for (let i = 0; i < maxPools; i += batchSize) {
      const batch = [];
      for (let j = 0; j < batchSize && i + j < maxPools; j++) {
        batch.push(this.getPoolData(provider, factory, i + j, this.getPairABI(), sourceName));
      }
      
      try {
        const batchResults = await Promise.allSettled(batch);
        for (const result of batchResults) {
          if (result.status === 'fulfilled' && result.value) {
            pools.push(result.value);
          }
        }
        
        // Add delay between batches to avoid rate limiting
        if (i + batchSize < maxPools) {
          await new Promise(resolve => setTimeout(resolve, this.requestDelay));
        }
      } catch (error) {
        if (this.debug) {
          console.log(`Batch ${i / batchSize} failed:`, error.message);
        }
      }
    }

    return pools;
  }

  /**
   * Get individual pool data
   */
  async getPoolData(provider, factory, index, pairABI, sourceName) {
    try {
      const pairAddress = await factory.allPairs(index);
      const pair = new ethers.Contract(pairAddress, pairABI, provider);
      
      const [token0, token1, reserves, totalSupply] = await Promise.all([
        pair.token0(),
        pair.token1(),
        pair.getReserves(),
        pair.totalSupply()
      ]);

      // Get token info
      const [token0Info, token1Info] = await Promise.all([
        this.getTokenInfo(token0, provider),
        this.getTokenInfo(token1, provider)
      ]);

      if (token0Info && token1Info) {
        // Convert reserves to human-readable amounts for TVL calculation
        const reserve0Human = parseFloat(ethers.formatUnits(reserves[0], token0Info.decimals));
        const reserve1Human = parseFloat(ethers.formatUnits(reserves[1], token1Info.decimals));
        
        // For now, use a simplified TVL calculation (in a real implementation, you'd get token prices)
        const tvl = reserve0Human + reserve1Human;
        
        // Try to get the actual fee from the pool contract
        let fee = 0.003; // Default to 0.30%
        try {
          // Try different fee methods for different DEX implementations
          const feeMethods = [
            'fee()',
            'swapFee()',
            'getSwapFee()',
            'FEE_DENOMINATOR()'
          ];
          
          for (const method of feeMethods) {
            try {
              const feeValue = await pair[method]();
              if (feeValue) {
                // Convert fee to percentage (e.g., 3000 -> 0.003 -> 0.30%)
                if (method === 'FEE_DENOMINATOR()') {
                  // Some contracts use FEE_DENOMINATOR = 1000000, so fee = 3000/1000000 = 0.003
                  fee = Number(feeValue) / 1000000;
                } else {
                  fee = Number(feeValue) / 1000000; // Assume 6 decimal precision
                }
                break;
              }
            } catch (e) {
              // Continue to next method
            }
          }
        } catch (error) {
          // Use default fee if we can't get the real fee
          if (this.debug) {
            console.log(`Could not get fee for pool ${pairAddress}, using default:`, error.message);
          }
        }
        
        return {
          address: pairAddress,
          token0: {
            address: token0,
            ...token0Info,
            reserve: reserves[0],
            formattedReserve: this.formatTokenReserve(reserves[0], token0Info.decimals)
          },
          token1: {
            address: token1,
            ...token1Info,
            reserve: reserves[1],
            formattedReserve: this.formatTokenReserve(reserves[1], token1Info.decimals)
          },
          totalSupply: Number(totalSupply),
          formattedTotalSupply: this.safeFormatUnits(totalSupply, 18),
          fee: fee,
          tvl: tvl,
          formattedTvl: this.formatLargeNumber(tvl, 2, true),
          source: sourceName,
          chainId: 11155111,
          createdAt: Date.now()
        };
      }
    } catch (error) {
      if (this.debug) {
        console.log(`Failed to fetch pool ${index}:`, error.message);
      }
    }
    return null;
  }

  /**
   * Get token information with caching
   */
  async getTokenInfo(tokenAddress, provider) {
    // Check cache first
    const cacheKey = `token-${tokenAddress.toLowerCase()}`;
    const cached = this.tokenCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.tokenCacheTimeout) {
      return cached.data;
    }

    try {
      const tokenABI = [
        'function name() external view returns (string)',
        'function symbol() external view returns (string)',
        'function decimals() external view returns (uint8)',
        'function totalSupply() external view returns (uint256)'
      ];

      const token = new ethers.Contract(tokenAddress, tokenABI, provider);
      
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
        token.totalSupply()
      ]);

      const tokenInfo = {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: totalSupply.toString(),
        formattedTotalSupply: this.safeFormatUnits(totalSupply, Number(decimals))
      };

      // Cache the result
      this.tokenCache.set(cacheKey, {
        timestamp: Date.now(),
        data: tokenInfo
      });

      return tokenInfo;
    } catch (error) {
      if (this.debug) {
        console.log(`Failed to get token info for ${tokenAddress}:`, error.message);
      }
      return null;
    }
  }

  /**
   * Get pair ABI
   */
  getPairABI() {
    return [
      'function token0() external view returns (address)',
      'function token1() external view returns (address)',
      'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
      'function totalSupply() external view returns (uint256)',
      'function fee() external view returns (uint256)',
      'function swapFee() external view returns (uint256)',
      'function getSwapFee() external view returns (uint256)',
      'function FEE_DENOMINATOR() external view returns (uint256)'
    ];
  }

  /**
   * Format large numbers with industry-standard abbreviations
   */
  formatLargeNumber(num, decimals = 2, includeDollarSign = true) {
    if (num === 0) return includeDollarSign ? '$0' : '0';
    if (num < 0.0001 && num > 0) return includeDollarSign ? `$${num.toExponential(4)}` : num.toExponential(4);
    
    const absNum = Math.abs(num);
    let formatted;
    
    if (absNum >= 1e12) {
      formatted = (num / 1e12).toFixed(decimals) + 'T';
    } else if (absNum >= 1e9) {
      formatted = (num / 1e9).toFixed(decimals) + 'B';
    } else if (absNum >= 1e6) {
      formatted = (num / 1e6).toFixed(decimals) + 'M';
    } else if (absNum >= 1e3) {
      formatted = (num / 1e3).toFixed(decimals) + 'K';
    } else {
      formatted = num.toFixed(decimals);
    }
    
    return includeDollarSign ? `$${formatted}` : formatted;
  }

  /**
   * Safe format units
   */
  safeFormatUnits(value, decimals) {
    try {
      // Ensure value is a string to handle BigInt properly
      const valueStr = value.toString();
      
      // Use ethers.formatUnits to convert from smallest unit to human readable
      const formatted = ethers.formatUnits(valueStr, decimals);
      
      // Parse the formatted number to handle display
      const num = parseFloat(formatted);
      
      // Handle very small numbers (less than 0.0001)
      if (num < 0.0001 && num > 0) {
        return num.toExponential(4);
      }
      
      // For large numbers, use our custom formatter (no dollar sign for token amounts)
      if (num >= 1e3) {
        return this.formatLargeNumber(num, 4, false);
      }
      
      // For normal numbers, show up to 4 decimal places
      return num.toFixed(4).replace(/\.?0+$/, ''); // Remove trailing zeros
    } catch (error) {
      return value.toString();
    }
  }

  /**
   * Format token reserves without abbreviations (for detailed display)
   */
  formatTokenReserve(value, decimals) {
    try {
      // Ensure value is a string to handle BigInt properly
      const valueStr = value.toString();
      
      // Use ethers.formatUnits to convert from smallest unit to human readable
      const formatted = ethers.formatUnits(valueStr, decimals);
      
      // Parse the formatted number
      const num = parseFloat(formatted);
      
      // Handle very small numbers (less than 0.0001)
      if (num < 0.0001 && num > 0) {
        return num.toExponential(4);
      }
      
      // For large numbers, use abbreviations (K, M, B, T)
      if (num >= 1e12) {
        return (num / 1e12).toFixed(2) + 'T';
      } else if (num >= 1e9) {
        return (num / 1e9).toFixed(2) + 'B';
      } else if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + 'M';
      } else if (num >= 1e3) {
        return (num / 1e3).toFixed(2) + 'K';
      } else {
        // For smaller numbers, show up to 4 decimal places
        return num.toFixed(4).replace(/\.?0+$/, ''); // Remove trailing zeros
      }
    } catch (error) {
      if (this.debug) {
        console.log(`Error formatting token reserve for value ${value} with decimals ${decimals}:`, error);
      }
      return value.toString();
    }
  }

  /**
   * Remove duplicate pools based on token pairs
   */
  removeDuplicatePools(pools) {
    const seen = new Set();
    const uniquePools = [];

    for (const pool of pools) {
      const key = `${pool.token0.address.toLowerCase()}-${pool.token1.address.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniquePools.push(pool);
      }
    }

    return uniquePools;
  }

  /**
   * Sort pools by activity (TVL, volume, etc.)
   */
  sortPoolsByActivity(pools) {
    return pools.sort((a, b) => {
      // Sort by TVL first, then by creation time
      if (b.tvl !== a.tvl) {
        return b.tvl - a.tvl;
      }
      return b.createdAt - a.createdAt;
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.tokenCache.clear();
    if (this.debug) {
      console.log('🌐 External pools and token cache cleared');
    }
  }

  /**
   * Batch process pool requests to improve performance
   */
  async batchProcessPools(provider, factoryAddress, sourceName, limit = 500) {
    if (this.debug) {
      console.log(`🔄 Starting batch processing for ${sourceName} with limit ${limit}`);
    }

    const factoryABI = [
      'function allPairsLength() external view returns (uint)',
      'function allPairs(uint) external view returns (address)'
    ];

    const pairABI = this.getPairABI(); // Use the method that includes fee functions

    const factory = new ethers.Contract(factoryAddress, factoryABI, provider);
    const totalPairs = await factory.allPairsLength();
    
    if (this.debug) {
      console.log(`📊 ${sourceName} factory has ${totalPairs} total pairs`);
    }
    
    const pools = [];
    const maxPools = Math.min(Number(totalPairs), limit);

    if (this.debug) {
      console.log(`📊 Processing ${maxPools} pools from ${sourceName}`);
    }

    // Process in batches for better performance
    const batchSize = 5;
    for (let i = 0; i < maxPools; i += batchSize) {
      const batch = [];
      for (let j = 0; j < batchSize && i + j < maxPools; j++) {
        batch.push(this.getPoolData(provider, factory, i + j, pairABI, sourceName));
      }
      
      try {
        const batchResults = await Promise.allSettled(batch);
        let batchSuccessCount = 0;
        for (const result of batchResults) {
          if (result.status === 'fulfilled' && result.value) {
            pools.push(result.value);
            batchSuccessCount++;
          }
        }
        
        if (this.debug && (i / batchSize) % 5 === 0) {
          console.log(`📊 ${sourceName} batch ${Math.floor(i / batchSize) + 1}: ${batchSuccessCount}/${batchSize} successful, total: ${pools.length}`);
        }
        
        // Add delay between batches to avoid rate limiting
        if (i + batchSize < maxPools) {
          await new Promise(resolve => setTimeout(resolve, this.requestDelay));
        }
      } catch (error) {
        if (this.debug) {
          console.log(`❌ ${sourceName} batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
        }
      }
    }

    if (this.debug) {
      console.log(`✅ ${sourceName} batch processing complete: ${pools.length} pools fetched`);
    }

    return pools;
  }
}

// Create and export a singleton instance
const externalPoolService = new ExternalPoolService();
export default externalPoolService; 