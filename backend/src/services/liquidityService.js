import { eq, desc, and, sql } from 'drizzle-orm';
import { pairs, liquidityEvents } from '../database/schema.js';

export class LiquidityService {
  constructor(db) {
    this.db = db;
  }

  // Calculate liquidity amount based on reserves
  calculateLiquidityAmount(amount0, amount1, reserve0, reserve1, totalSupply) {
    if (totalSupply === '0') {
      return Math.sqrt(amount0 * amount1);
    }
    
    const liquidity0 = (amount0 * totalSupply) / reserve0;
    const liquidity1 = (amount1 * totalSupply) / reserve1;
    return Math.min(liquidity0, liquidity1);
  }

  // Add liquidity to pool
  async addLiquidity(liquidityData) {
    try {
      const {
        pairAddress,
        provider,
        amount0,
        amount1,
        chainId,
        txHash,
        blockNumber
      } = liquidityData;

      // Get current pair data
      const pair = await this.db.select().from(pairs)
        .where(eq(pairs.address, pairAddress));

      if (!pair[0]) {
        throw new Error('Pair not found');
      }

      const pairData = pair[0];
      const currentReserve0 = parseFloat(pairData.reserve0);
      const currentReserve1 = parseFloat(pairData.reserve1);
      const currentTotalSupply = parseFloat(pairData.totalSupply);

      // Calculate new reserves
      const newReserve0 = currentReserve0 + parseFloat(amount0);
      const newReserve1 = currentReserve1 + parseFloat(amount1);

      // Calculate liquidity tokens to mint
      let liquidityTokens;
      if (currentTotalSupply === 0) {
        liquidityTokens = Math.sqrt(parseFloat(amount0) * parseFloat(amount1));
      } else {
        const liquidity0 = (parseFloat(amount0) * currentTotalSupply) / currentReserve0;
        const liquidity1 = (parseFloat(amount1) * currentTotalSupply) / currentReserve1;
        liquidityTokens = Math.min(liquidity0, liquidity1);
      }

      const newTotalSupply = currentTotalSupply + liquidityTokens;

      // Update pair reserves
      await this.db.update(pairs)
        .set({
          reserve0: newReserve0.toString(),
          reserve1: newReserve1.toString(),
          totalSupply: newTotalSupply.toString(),
          updatedAt: new Date().toISOString()
        })
        .where(eq(pairs.address, pairAddress));

      // Record liquidity event
      const event = await this.db.insert(liquidityEvents).values({
        txHash,
        pairAddress,
        provider,
        action: 'add',
        amount0: amount0.toString(),
        amount1: amount1.toString(),
        chainId,
        blockNumber
      });

      return {
        success: true,
        liquidityTokens: liquidityTokens.toString(),
        newReserve0: newReserve0.toString(),
        newReserve1: newReserve1.toString(),
        newTotalSupply: newTotalSupply.toString(),
        event
      };
    } catch (error) {
      throw new Error(`Failed to add liquidity: ${error.message}`);
    }
  }

  // Remove liquidity from pool
  async removeLiquidity(liquidityData) {
    try {
      const {
        pairAddress,
        provider,
        liquidityTokens,
        chainId,
        txHash,
        blockNumber
      } = liquidityData;

      // Get current pair data
      const pair = await this.db.select().from(pairs)
        .where(eq(pairs.address, pairAddress));

      if (!pair[0]) {
        throw new Error('Pair not found');
      }

      const pairData = pair[0];
      const currentReserve0 = parseFloat(pairData.reserve0);
      const currentReserve1 = parseFloat(pairData.reserve1);
      const currentTotalSupply = parseFloat(pairData.totalSupply);

      if (parseFloat(liquidityTokens) > currentTotalSupply) {
        throw new Error('Insufficient liquidity tokens');
      }

      // Calculate amounts to return
      const liquidityRatio = parseFloat(liquidityTokens) / currentTotalSupply;
      const amount0 = currentReserve0 * liquidityRatio;
      const amount1 = currentReserve1 * liquidityRatio;

      // Calculate new reserves
      const newReserve0 = currentReserve0 - amount0;
      const newReserve1 = currentReserve1 - amount1;
      const newTotalSupply = currentTotalSupply - parseFloat(liquidityTokens);

      // Update pair reserves
      await this.db.update(pairs)
        .set({
          reserve0: newReserve0.toString(),
          reserve1: newReserve1.toString(),
          totalSupply: newTotalSupply.toString(),
          updatedAt: new Date().toISOString()
        })
        .where(eq(pairs.address, pairAddress));

      // Record liquidity event
      const event = await this.db.insert(liquidityEvents).values({
        txHash,
        pairAddress,
        provider,
        action: 'remove',
        amount0: amount0.toString(),
        amount1: amount1.toString(),
        chainId,
        blockNumber
      });

      return {
        success: true,
        amount0: amount0.toString(),
        amount1: amount1.toString(),
        newReserve0: newReserve0.toString(),
        newReserve1: newReserve1.toString(),
        newTotalSupply: newTotalSupply.toString(),
        event
      };
    } catch (error) {
      throw new Error(`Failed to remove liquidity: ${error.message}`);
    }
  }

  // Get liquidity positions for a user
  async getUserLiquidityPositions(provider, chainId = null) {
    try {
      let query = this.db.select().from(liquidityEvents)
        .where(eq(liquidityEvents.provider, provider));
      
      if (chainId) {
        query = query.where(eq(liquidityEvents.chainId, chainId));
      }
      
      const positions = await query
        .orderBy(desc(liquidityEvents.timestamp));

      return positions;
    } catch (error) {
      throw new Error(`Failed to get user liquidity positions: ${error.message}`);
    }
  }

  // Get pool liquidity statistics
  async getPoolLiquidityStats(pairAddress) {
    try {
      const pair = await this.db.select().from(pairs)
        .where(eq(pairs.address, pairAddress));

      if (!pair[0]) {
        throw new Error('Pair not found');
      }

      const pairData = pair[0];
      const totalValueLocked = (parseFloat(pairData.reserve0) + parseFloat(pairData.reserve1)) / 2; // Simplified TVL calculation

      return {
        pairAddress,
        reserve0: pairData.reserve0,
        reserve1: pairData.reserve1,
        totalSupply: pairData.totalSupply,
        totalValueLocked: totalValueLocked.toString(),
        feeRate: pairData.feeRate
      };
    } catch (error) {
      throw new Error(`Failed to get pool liquidity stats: ${error.message}`);
    }
  }

  // Get all pools with liquidity
  async getAllPools(chainId = null, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      let query = this.db.select().from(pairs);
      
      if (chainId) {
        query = query.where(eq(pairs.chainId, chainId));
      }
      
      const pools = await query
        .orderBy(desc(sql`CAST(reserve0 AS REAL) + CAST(reserve1 AS REAL)`))
        .limit(limit)
        .offset(offset);

      return pools;
    } catch (error) {
      throw new Error(`Failed to get pools: ${error.message}`);
    }
  }

  // Get liquidity events
  async getLiquidityEvents(pairAddress = null, chainId = null, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      let query = this.db.select().from(liquidityEvents);
      
      if (pairAddress) {
        query = query.where(eq(liquidityEvents.pairAddress, pairAddress));
      }
      
      if (chainId) {
        query = query.where(eq(liquidityEvents.chainId, chainId));
      }
      
      const events = await query
        .orderBy(desc(liquidityEvents.timestamp))
        .limit(limit)
        .offset(offset);

      return events;
    } catch (error) {
      throw new Error(`Failed to get liquidity events: ${error.message}`);
    }
  }

  // Get user's created pools
  async getUserCreatedPools(address, chainId = null) {
    try {
      let query = this.db.select().from(pairs)
        .where(eq(pairs.creator, address));
      
      if (chainId) {
        query = query.where(eq(pairs.chainId, chainId));
      }
      
      const pools = await query
        .orderBy(desc(pairs.createdAt));

      return pools;
    } catch (error) {
      throw new Error(`Failed to get user created pools: ${error.message}`);
    }
  }

  // Get pool analytics
  async getPoolAnalytics(pairAddress, chainId = null) {
    try {
      const pair = await this.db.select().from(pairs)
        .where(eq(pairs.address, pairAddress));

      if (!pair[0]) {
        throw new Error('Pair not found');
      }

      const pairData = pair[0];
      
      // Get recent liquidity events for volume calculation
      const recentEvents = await this.db.select().from(liquidityEvents)
        .where(eq(liquidityEvents.pairAddress, pairAddress))
        .orderBy(desc(liquidityEvents.timestamp))
        .limit(100);

      // Calculate 24h volume (simplified)
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const volume24h = recentEvents
        .filter(event => new Date(event.timestamp) > oneDayAgo)
        .reduce((sum, event) => sum + parseFloat(event.amount0) + parseFloat(event.amount1), 0);

      // Calculate total liquidity
      const totalLiquidity = parseFloat(pairData.reserve0) + parseFloat(pairData.reserve1);

      return {
        pairAddress,
        totalLiquidity: totalLiquidity.toString(),
        volume24h: volume24h.toString(),
        feeRate: pairData.feeRate,
        reserve0: pairData.reserve0,
        reserve1: pairData.reserve1,
        totalSupply: pairData.totalSupply
      };
    } catch (error) {
      throw new Error(`Failed to get pool analytics: ${error.message}`);
    }
  }

  // Collect fees from pool
  async collectFees(poolAddress, chainId) {
    try {
      // This is a placeholder implementation
      // In a real implementation, this would interact with the smart contract
      // to collect accumulated fees for the user
      
      return {
        success: true,
        feesCollected: '0',
        message: 'Fee collection is not yet implemented'
      };
    } catch (error) {
      throw new Error(`Failed to collect fees: ${error.message}`);
    }
  }
} 