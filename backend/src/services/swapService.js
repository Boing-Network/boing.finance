import { eq, desc, and, sql } from 'drizzle-orm';
import { pairs, swaps } from '../database/schema.js';

export class SwapService {
  constructor(db) {
    this.db = db;
  }

  // Calculate swap output using AMM formula
  calculateSwapOutput(amountIn, reserveIn, reserveOut, feeRate = 0.003) {
    const amountInWithFee = amountIn * (1 - feeRate);
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn + amountInWithFee;
    return numerator / denominator;
  }

  // Calculate price impact
  calculatePriceImpact(amountIn, reserveIn, reserveOut, feeRate = 0.003) {
    const amountOut = this.calculateSwapOutput(amountIn, reserveIn, reserveOut, feeRate);
    const spotPrice = reserveOut / reserveIn;
    const executionPrice = amountOut / amountIn;
    return ((spotPrice - executionPrice) / spotPrice) * 100;
  }

  // Get swap quote
  async getSwapQuote(tokenInAddress, tokenOutAddress, amountIn, chainId) {
    try {
      // Find the pair
      const pair = await this.db.select().from(pairs)
        .where(
          and(
            eq(pairs.chainId, chainId),
            sql`(
              (${pairs.token0Address} = ${tokenInAddress} AND ${pairs.token1Address} = ${tokenOutAddress}) OR
              (${pairs.token0Address} = ${tokenOutAddress} AND ${pairs.token1Address} = ${tokenInAddress})
            )`
          )
        );

      if (!pair[0]) {
        throw new Error('Pair not found');
      }

      const pairData = pair[0];
      const isToken0In = pairData.token0Address === tokenInAddress;
      
      const reserveIn = isToken0In ? parseFloat(pairData.reserve0) : parseFloat(pairData.reserve1);
      const reserveOut = isToken0In ? parseFloat(pairData.reserve1) : parseFloat(pairData.reserve0);
      
      const amountOut = this.calculateSwapOutput(amountIn, reserveIn, reserveOut, pairData.feeRate);
      const priceImpact = this.calculatePriceImpact(amountIn, reserveIn, reserveOut, pairData.feeRate);

      return {
        pairAddress: pairData.address,
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        amountIn: amountIn.toString(),
        amountOut: amountOut.toString(),
        priceImpact: priceImpact.toFixed(4),
        fee: (amountIn * pairData.feeRate).toString(),
        route: [tokenInAddress, tokenOutAddress]
      };
    } catch (error) {
      throw new Error(`Failed to get swap quote: ${error.message}`);
    }
  }

  // Execute swap
  async executeSwap(swapData) {
    try {
      const result = await this.db.insert(swaps).values({
        txHash: swapData.txHash,
        pairAddress: swapData.pairAddress,
        sender: swapData.sender,
        tokenIn: swapData.tokenIn,
        tokenOut: swapData.tokenOut,
        amountIn: swapData.amountIn,
        amountOut: swapData.amountOut,
        chainId: swapData.chainId,
        blockNumber: swapData.blockNumber
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to execute swap: ${error.message}`);
    }
  }

  // Get swap history
  async getSwapHistory(address, chainId = null, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      let query = this.db.select().from(swaps).where(eq(swaps.sender, address));
      
      if (chainId) {
        query = query.where(eq(swaps.chainId, chainId));
      }
      
      const results = await query
        .orderBy(desc(swaps.timestamp))
        .limit(limit)
        .offset(offset);

      return results;
    } catch (error) {
      throw new Error(`Failed to get swap history: ${error.message}`);
    }
  }

  // Get recent swaps
  async getRecentSwaps(chainId = null, limit = 50) {
    try {
      let query = this.db.select().from(swaps);
      
      if (chainId) {
        query = query.where(eq(swaps.chainId, chainId));
      }
      
      const results = await query
        .orderBy(desc(swaps.timestamp))
        .limit(limit);

      return results;
    } catch (error) {
      throw new Error(`Failed to get recent swaps: ${error.message}`);
    }
  }

  // Get swap statistics
  async getSwapStats(chainId = null, timeRange = '24h') {
    try {
      let timeFilter = '';
      const now = new Date();
      
      switch (timeRange) {
        case '1h':
          timeFilter = `AND timestamp > datetime('now', '-1 hour')`;
          break;
        case '24h':
          timeFilter = `AND timestamp > datetime('now', '-1 day')`;
          break;
        case '7d':
          timeFilter = `AND timestamp > datetime('now', '-7 days')`;
          break;
        case '30d':
          timeFilter = `AND timestamp > datetime('now', '-30 days')`;
          break;
        default:
          timeFilter = `AND timestamp > datetime('now', '-1 day')`;
      }

      let chainFilter = '';
      if (chainId) {
        chainFilter = `AND chain_id = ${chainId}`;
      }

      const stats = await this.db.execute(sql`
        SELECT 
          COUNT(*) as total_swaps,
          SUM(CAST(amount_in AS REAL)) as total_volume_in,
          SUM(CAST(amount_out AS REAL)) as total_volume_out,
          AVG(CAST(amount_in AS REAL)) as avg_swap_size
        FROM swaps 
        WHERE 1=1 ${sql.raw(chainFilter)} ${sql.raw(timeFilter)}
      `);

      return stats[0];
    } catch (error) {
      throw new Error(`Failed to get swap stats: ${error.message}`);
    }
  }
} 