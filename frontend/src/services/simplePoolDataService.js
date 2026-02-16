import { ethers } from 'ethers';

class SimplePoolDataService {
  constructor() {
    this.debug = true;
  }

  /**
   * Get realistic pool data with fallback values
   */
  async getPoolWithRealisticData(pool, provider) {
    try {
      // Get current reserves
      const pairContract = new ethers.Contract(pool.address, this.getPairABI(), provider);
      const [reserves, totalSupply] = await Promise.all([
        pairContract.getReserves(),
        pairContract.totalSupply()
      ]);

      // Keep reserves as BigInt to avoid precision loss
      const reserve0 = reserves[0];
      const reserve1 = reserves[1];
      const totalSupplyNum = Number(totalSupply);

      // Only process pools with actual liquidity
      if (reserve0 === 0n || reserve1 === 0n || totalSupplyNum === 0) {
        return null;
      }

      // Get token info if not already available
      let token0Info = pool.token0;
      let token1Info = pool.token1;

      if (!token0Info || !token1Info) {
        const [token0, token1] = await Promise.all([
          pairContract.token0(),
          pairContract.token1()
        ]);

        [token0Info, token1Info] = await Promise.all([
          this.getTokenInfo(token0, provider),
          this.getTokenInfo(token1, provider)
        ]);
      }

      if (!token0Info || !token1Info) {
        return null;
      }

      // Calculate realistic APY and volume based on pool activity
      const realisticData = this.calculateRealisticMetrics(reserve0, reserve1, totalSupplyNum, pool.source);

      // Calculate TVL properly (avoid scientific notation)
      const _reserve0Num = Number(reserve0);
      const _reserve1Num = Number(reserve1);
      
      // Convert reserves to human-readable amounts for TVL calculation
      const reserve0Human = parseFloat(ethers.formatUnits(reserve0, token0Info.decimals));
      const reserve1Human = parseFloat(ethers.formatUnits(reserve1, token1Info.decimals));
      
      // For now, use a simplified TVL calculation (in a real implementation, you'd get token prices)
      // This is just the sum of the human-readable amounts, not actual USD value
      const tvl = reserve0Human + reserve1Human;

      // Debug logging for specific tokens
      if (this.debug && (token0Info?.symbol === 'ZKSlove' || token1Info?.symbol === 'ZKSlove')) {
        console.log(`🔍 Processing ZKSlove pool:`, {
          poolAddress: pool.address,
          token0: {
            symbol: token0Info.symbol,
            decimals: token0Info.decimals,
            reserve: reserve0.toString(),
            formattedReserve: this.safeFormatUnits(reserve0, token0Info.decimals)
          },
          token1: {
            symbol: token1Info.symbol,
            decimals: token1Info.decimals,
            reserve: reserve1.toString(),
            formattedReserve: this.safeFormatUnits(reserve1, token1Info.decimals)
          },
          tvl: tvl,
          formattedTvl: this.formatLargeNumber(tvl, 2, true)
        });
      }

      // Special handling for ZKSlove pool to ensure accurate display
      let finalToken0 = {
        ...token0Info,
        reserve: reserve0,
        formattedReserve: this.formatTokenReserve(reserve0, token0Info.decimals)
      };
      
      let finalToken1 = {
        ...token1Info,
        reserve: reserve1,
        formattedReserve: this.formatTokenReserve(reserve1, token1Info.decimals)
      };

      // If this is the ZKSlove pool, double-check the formatting
      if (token0Info?.symbol === 'ZKSlove' || token1Info?.symbol === 'ZKSlove') {
        console.log(`🔍 ZKSlove pool final data:`, {
          token0Formatted: finalToken0.formattedReserve,
          token1Formatted: finalToken1.formattedReserve,
          token0Raw: reserve0.toString(),
          token1Raw: reserve1.toString()
        });
      }

      return {
        ...pool,
        token0: finalToken0,
        token1: finalToken1,
        totalSupply: totalSupplyNum,
        formattedTotalSupply: this.safeFormatUnits(totalSupply, 18),
        tvl: tvl,
        formattedTvl: this.formatLargeNumber(tvl, 2, true),
        apy: realisticData.apy,
        volume24h: realisticData.volume24h,
        formattedVolume24h: this.formatLargeNumber(realisticData.volume24h, 2, true),
        volume7d: realisticData.volume7d,
        formattedVolume7d: this.formatLargeNumber(realisticData.volume7d, 2, true),
        swapCount: realisticData.swapCount,
        fee: pool.fee || 0.003,
        lastUpdated: Date.now()
      };
    } catch (error) {
      if (this.debug) {
        console.log(`Failed to get realistic data for pool ${pool.address}:`, error.message);
      }
      return null;
    }
  }

  /**
   * Calculate realistic metrics based on pool characteristics
   */
  calculateRealisticMetrics(reserve0, reserve1, _totalSupply, _source) {
    // Convert BigInt reserves to numbers for calculations, but be careful with precision
    const reserve0Num = Number(reserve0);
    const reserve1Num = Number(reserve1);
    const _totalLiquidity = reserve0Num + reserve1Num;
    
    // For now, return zero values to indicate no real data available
    // This will be replaced with actual swap event data when available
    return {
      apy: 0, // No real APY data available
      volume24h: 0, // No real volume data available
      volume7d: 0, // No real volume data available
      swapCount: 0 // No real swap data available
    };
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenAddress, provider) {
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

      return {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: totalSupply.toString(),
        formattedTotalSupply: this.safeFormatUnits(totalSupply, Number(decimals))
      };
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
      'function totalSupply() external view returns (uint256)'
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
   * Safe format units with proper BigInt handling
   */
  safeFormatUnits(value, decimals) {
    try {
      // Ensure value is a string to handle BigInt properly
      const valueStr = value.toString();
      
      // Use ethers.formatUnits to convert from smallest unit to human readable
      const formatted = ethers.formatUnits(valueStr, decimals);
      
      // Parse the formatted number to handle display
      const num = parseFloat(formatted);
      
      // Debug logging for large values
      if (this.debug && num > 1e10) {
        console.log(`🔍 Large token amount detected:`, {
          originalValue: valueStr,
          decimals: decimals,
          formatted: formatted,
          parsed: num
        });
      }
      
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
      if (this.debug) {
        console.log(`Error formatting units for value ${value} with decimals ${decimals}:`, error);
      }
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
   * Process all pools with realistic data
   */
  async processPoolsWithRealisticData(pools, provider) {
    if (!pools || pools.length === 0) return [];

    const processedPools = [];
    
    for (const pool of pools) {
      try {
        const processedPool = await this.getPoolWithRealisticData(pool, provider);
        if (processedPool) {
          processedPools.push(processedPool);
        }
      } catch (error) {
        if (this.debug) {
          console.log(`Failed to process pool ${pool.address}:`, error.message);
        }
      }
    }

    if (this.debug) {
      console.log(`📊 Processed ${processedPools.length} pools with realistic data`);
    }

    return processedPools;
  }
}

// Create and export a singleton instance
const simplePoolDataService = new SimplePoolDataService();
export default simplePoolDataService; 