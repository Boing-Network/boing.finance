/* global BigInt */
import { ethers } from 'ethers';

// DEX Pair ABI for swap events
const DEX_PAIR_ABI = [
  "event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)",
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function totalSupply() external view returns (uint256)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)"
];

// DEX Factory ABI for fee rate
const DEX_FACTORY_ABI = [
  "function getFeeRate() external view returns (uint256)",
  "function feeRate() external view returns (uint256)"
];

class APYCalculationService {
  constructor() {
    this.debug = true;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Calculate APY for a pool based on recent trading volume
   * @param {string} pairAddress - The pair contract address
   * @param {Object} provider - Ethers provider
   * @param {string} factoryAddress - DEX factory address
   * @param {number} timeRange - Time range in hours (default: 24)
   * @returns {Object} APY data
   */
  async calculatePoolAPY(pairAddress, provider, factoryAddress, timeRange = 24) {
    const cacheKey = `${pairAddress}-${timeRange}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      if (this.debug) {
        console.log(`📊 Using cached APY for ${pairAddress}: ${cached.apy.toFixed(2)}%`);
      }
      return cached.data;
    }

    try {
      const pairContract = new ethers.Contract(pairAddress, DEX_PAIR_ABI, provider);
      const factoryContract = new ethers.Contract(factoryAddress, DEX_FACTORY_ABI, provider);

      // Get current block and calculate time range
      const currentBlock = await provider.getBlockNumber();
      const currentBlockData = await provider.getBlock(currentBlock);
      const timeRangeSeconds = timeRange * 60 * 60; // Convert hours to seconds
      const startTime = currentBlockData.timestamp - timeRangeSeconds;

      if (this.debug) {
        console.log(`📊 Calculating APY for ${pairAddress} over ${timeRange}h period`);
        console.log(`📊 Current block: ${currentBlock}, Start time: ${new Date(startTime * 1000).toISOString()}`);
      }

      // Get swap events from the last timeRange hours
      const swapEvents = await this.getSwapEvents(pairContract, startTime, currentBlock);

      // Calculate trading volume
      const volumeData = this.calculateTradingVolume(swapEvents, pairContract);

      // Get pool reserves and fee rate
      const [reserves, totalSupply, feeRate] = await Promise.all([
        pairContract.getReserves(),
        pairContract.totalSupply(),
        factoryContract.getFeeRate().catch(() => factoryContract.feeRate().catch(() => 30)) // Default 0.3%
      ]);

      // Calculate APY
      const apyData = this.calculateAPYFromVolume(volumeData, reserves, totalSupply, feeRate, timeRange);

      const result = {
        apy: apyData.apy,
        volume24h: volumeData.totalVolumeUSD,
        volume7d: volumeData.totalVolumeUSD * (7 / timeRange), // Extrapolate to 7 days
        feeRate: Number(feeRate) / 10000, // Convert from basis points
        totalVolume: volumeData.totalVolumeUSD,
        swapCount: volumeData.swapCount,
        timeRange: timeRange,
        lastUpdated: Date.now()
      };

      // Cache the result
      this.cache.set(cacheKey, {
        timestamp: Date.now(),
        data: result
      });

      if (this.debug) {
        console.log(`📊 APY calculation for ${pairAddress}:`, {
          apy: `${result.apy.toFixed(2)}%`,
          volume24h: `$${result.volume24h.toFixed(2)}`,
          swapCount: result.swapCount,
          feeRate: `${(result.feeRate * 100).toFixed(2)}%`
        });
      }

      return result;
    } catch (error) {
      console.error(`Failed to calculate APY for ${pairAddress}:`, error);
      
      // Return default APY if calculation fails
      return {
        apy: 0,
        volume24h: 0,
        volume7d: 0,
        feeRate: 0.003, // 0.3%
        totalVolume: 0,
        swapCount: 0,
        timeRange: timeRange,
        lastUpdated: Date.now(),
        error: error.message
      };
    }
  }

  /**
   * Get swap events from a specific time range
   */
  async getSwapEvents(pairContract, startTime, endBlock) {
    try {
      // Get events from the last 1000 blocks (approximately 4 hours on Ethereum)
      const fromBlock = Math.max(0, endBlock - 1000);
      
      const events = await pairContract.queryFilter(
        pairContract.filters.Swap(),
        fromBlock,
        endBlock
      );

      // Filter events by timestamp
      const filteredEvents = [];
      for (const event of events) {
        const block = await event.getBlock();
        if (block.timestamp >= startTime) {
          filteredEvents.push(event);
        }
      }

      if (this.debug) {
        console.log(`📊 Found ${filteredEvents.length} swap events in time range`);
      }

      return filteredEvents;
    } catch (error) {
      console.error('Failed to get swap events:', error);
      return [];
    }
  }

  /**
   * Calculate trading volume from swap events
   */
  calculateTradingVolume(swapEvents, pairContract) {
    let totalVolumeUSD = 0;
    let swapCount = 0;

    for (const event of swapEvents) {
      const { amount0In, amount1In, amount0Out, amount1Out } = event.args;
      
      // Calculate volume in USD (simplified - assumes equal value for both tokens)
      const volume0 = Number(amount0In) + Number(amount0Out);
      const volume1 = Number(amount1In) + Number(amount1Out);
      
      // For now, we'll use a simplified calculation
      // In a real implementation, you'd get token prices from an oracle
      const volumeUSD = (volume0 + volume1) / 2; // Simplified USD calculation
      
      totalVolumeUSD += volumeUSD;
      swapCount++;
    }

    return {
      totalVolumeUSD,
      swapCount
    };
  }

  /**
   * Calculate APY from trading volume
   */
  calculateAPYFromVolume(volumeData, reserves, totalSupply, feeRate, timeRange) {
    const { totalVolumeUSD } = volumeData;
    
    // Calculate total liquidity (simplified)
    const reserve0 = Number(reserves[0]);
    const reserve1 = Number(reserves[1]);
    const totalLiquidity = reserve0 + reserve1;
    
    if (totalLiquidity === 0) {
      return { apy: 0 };
    }

    // Calculate fees earned
    const feeRateDecimal = Number(feeRate) / 10000; // Convert from basis points
    const feesEarned = totalVolumeUSD * feeRateDecimal;
    
    // Calculate APY
    // APY = (Fees earned / Total liquidity) * (Periods per year) * 100
    const periodsPerYear = (365 * 24) / timeRange; // Convert timeRange to annual periods
    const apy = (feesEarned / totalLiquidity) * periodsPerYear * 100;

    if (this.debug) {
      console.log(`📊 APY calculation details:`, {
        totalVolumeUSD,
        feeRateDecimal,
        feesEarned,
        totalLiquidity,
        periodsPerYear,
        apy: `${apy.toFixed(2)}%`
      });
    }

    return { apy: Math.max(0, apy) };
  }

  /**
   * Get APY for multiple pools
   */
  async getMultiplePoolAPYs(pairAddresses, provider, factoryAddress, timeRange = 24) {
    const apyPromises = pairAddresses.map(pairAddress => 
      this.calculatePoolAPY(pairAddress, provider, factoryAddress, timeRange)
    );

    const results = await Promise.allSettled(apyPromises);
    
    const apyData = {};
    pairAddresses.forEach((pairAddress, index) => {
      if (results[index].status === 'fulfilled') {
        apyData[pairAddress] = results[index].value;
      } else {
        console.error(`Failed to get APY for ${pairAddress}:`, results[index].reason);
        apyData[pairAddress] = {
          apy: 0,
          volume24h: 0,
          volume7d: 0,
          feeRate: 0.003,
          totalVolume: 0,
          swapCount: 0,
          timeRange: timeRange,
          lastUpdated: Date.now(),
          error: results[index].reason?.message || 'Unknown error'
        };
      }
    });

    return apyData;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    if (this.debug) {
      console.log('📊 APY cache cleared');
    }
  }
}

// Create and export a singleton instance
const apyCalculationService = new APYCalculationService();
export default apyCalculationService; 