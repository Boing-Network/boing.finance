import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { TokenRepository } from '../database/repositories/tokenRepository.js';
import { SwapService } from '../services/swapService.js';
import { LiquidityService } from '../services/liquidityService.js';
import { eq, desc } from 'drizzle-orm';

export function createDEXRoutes() {
  const app = new Hono();
  
  // Note: CORS is handled globally in worker.js
  // No need for duplicate CORS middleware here

  // Health check
  app.get('/', (c) => {
    return c.json({
      status: 'OK',
      message: 'DEX API is running',
      timestamp: new Date().toISOString()
    });
  });

  // Token routes
  app.get('/tokens', async (c) => {
    try {
      const db = c.get('db');
      const tokenRepo = new TokenRepository(db);
      const page = parseInt(c.req.query('page')) || 1;
      const limit = parseInt(c.req.query('limit')) || 20;
      const chainId = c.req.query('chainId') ? parseInt(c.req.query('chainId')) : null;
      const tokens = await tokenRepo.getAllTokens(page, limit, chainId);
      const total = await tokenRepo.getTokenCount(chainId);
      return c.json({
        success: true,
        data: tokens,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  app.get('/tokens/search', async (c) => {
    try {
      const query = c.req.query('q');
      const chainId = c.req.query('chainId') ? parseInt(c.req.query('chainId')) : null;
      const limit = parseInt(c.req.query('limit')) || 10;
      
      if (!query) {
        return c.json({ success: false, error: 'Search query is required' }, 400);
      }
      
      const db = c.get('db');
      const tokenRepo = new TokenRepository(db);
      const tokens = await tokenRepo.searchTokens(query, chainId, limit);
      return c.json({ success: true, data: tokens });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  app.get('/tokens/top/volume', async (c) => {
    try {
      const chainId = c.req.query('chainId') ? parseInt(c.req.query('chainId')) : null;
      const limit = parseInt(c.req.query('limit')) || 10;
      
      const db = c.get('db');
      const tokenRepo = new TokenRepository(db);
      const tokens = await tokenRepo.getTopTokensByVolume(chainId, limit);
      return c.json({ success: true, data: tokens });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  app.get('/tokens/top/marketcap', async (c) => {
    try {
      const chainId = c.req.query('chainId') ? parseInt(c.req.query('chainId')) : null;
      const limit = parseInt(c.req.query('limit')) || 10;
      
      const db = c.get('db');
      const tokenRepo = new TokenRepository(db);
      const tokens = await tokenRepo.getTopTokensByMarketCap(chainId, limit);
      return c.json({ success: true, data: tokens });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  app.get('/tokens/:address', async (c) => {
    try {
      const address = c.req.param('address');
      const chainId = c.req.query('chainId') ? parseInt(c.req.query('chainId')) : null;
      
      const db = c.get('db');
      const tokenRepo = new TokenRepository(db);
      const token = await tokenRepo.getTokenByAddress(address, chainId);
      if (!token) {
        return c.json({ success: false, error: 'Token not found' }, 404);
      }
      
      return c.json({ success: true, data: token });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Swap routes
  app.get('/swap/quote', async (c) => {
    try {
      const tokenIn = c.req.query('tokenIn');
      const tokenOut = c.req.query('tokenOut');
      const amountIn = parseFloat(c.req.query('amountIn'));
      const chainId = parseInt(c.req.query('chainId')) || 1;
      
      if (!tokenIn || !tokenOut || !amountIn) {
        return c.json({ success: false, error: 'Missing required parameters' }, 400);
      }
      
      const db = c.get('db');
      const swapService = new SwapService(db);
      const quote = await swapService.getSwapQuote(tokenIn, tokenOut, amountIn, chainId);
      return c.json({ success: true, data: quote });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  app.post('/swap/execute', async (c) => {
    try {
      const swapData = await c.req.json();
      
      if (!swapData.txHash || !swapData.pairAddress || !swapData.sender) {
        return c.json({ success: false, error: 'Missing required swap data' }, 400);
      }
      
      const db = c.get('db');
      const swapService = new SwapService(db);
      const result = await swapService.executeSwap(swapData);
      return c.json({ success: true, data: result });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  app.get('/swap/history/:address', async (c) => {
    try {
      const address = c.req.param('address');
      const chainId = c.req.query('chainId') ? parseInt(c.req.query('chainId')) : null;
      const page = parseInt(c.req.query('page')) || 1;
      const limit = parseInt(c.req.query('limit')) || 20;
      
      const db = c.get('db');
      const swapService = new SwapService(db);
      const history = await swapService.getSwapHistory(address, chainId, page, limit);
      return c.json({ success: true, data: history });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  app.get('/swap/recent', async (c) => {
    try {
      const chainId = c.req.query('chainId') ? parseInt(c.req.query('chainId')) : null;
      const limit = parseInt(c.req.query('limit')) || 50;
      
      const db = c.get('db');
      const swapService = new SwapService(db);
      const swaps = await swapService.getRecentSwaps(chainId, limit);
      return c.json({ success: true, data: swaps });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  app.get('/swap/stats', async (c) => {
    try {
      const chainId = c.req.query('chainId') ? parseInt(c.req.query('chainId')) : null;
      const timeRange = c.req.query('timeRange') || '24h';
      
      const db = c.get('db');
      const swapService = new SwapService(db);
      const stats = await swapService.getSwapStats(chainId, timeRange);
      return c.json({ success: true, data: stats });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Liquidity routes
  app.post('/liquidity/add', async (c) => {
    try {
      const liquidityData = await c.req.json();
      
      if (!liquidityData.pairAddress || !liquidityData.provider || !liquidityData.amount0 || !liquidityData.amount1) {
        return c.json({ success: false, error: 'Missing required liquidity data' }, 400);
      }
      
      const db = c.get('db');
      const liquidityService = new LiquidityService(db);
      const result = await liquidityService.addLiquidity(liquidityData);
      return c.json({ success: true, data: result });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  app.post('/liquidity/remove', async (c) => {
    try {
      const liquidityData = await c.req.json();
      
      if (!liquidityData.pairAddress || !liquidityData.provider || !liquidityData.liquidityTokens) {
        return c.json({ success: false, error: 'Missing required liquidity data' }, 400);
      }
      
      const db = c.get('db');
      const liquidityService = new LiquidityService(db);
      const result = await liquidityService.removeLiquidity(liquidityData);
      return c.json({ success: true, data: result });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  app.get('/liquidity/positions/:provider', async (c) => {
    try {
      const provider = c.req.param('provider');
      const chainId = c.req.query('chainId') ? parseInt(c.req.query('chainId')) : null;
      
      const db = c.get('db');
      const liquidityService = new LiquidityService(db);
      const positions = await liquidityService.getUserLiquidityPositions(provider, chainId);
      return c.json({ success: true, data: positions });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  app.get('/liquidity/pools', async (c) => {
    try {
      const chainId = c.req.query('chainId') ? parseInt(c.req.query('chainId')) : null;
      const page = parseInt(c.req.query('page')) || 1;
      const limit = parseInt(c.req.query('limit')) || 20;
      
      const db = c.get('db');
      const liquidityService = new LiquidityService(db);
      const pools = await liquidityService.getAllPools(chainId, page, limit);
      return c.json({ success: true, data: pools });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Get user's created pools
  app.get('/liquidity/created/:address', async (c) => {
    try {
      const address = c.req.param('address');
      const chainId = c.req.query('chainId') ? parseInt(c.req.query('chainId')) : null;
      
      const db = c.get('db');
      const liquidityService = new LiquidityService(db);
      const pools = await liquidityService.getUserCreatedPools(address, chainId);
      return c.json({ success: true, data: pools });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Get pool analytics
  app.get('/liquidity/analytics/:address', async (c) => {
    try {
      const address = c.req.param('address');
      const chainId = c.req.query('chainId') ? parseInt(c.req.query('chainId')) : null;
      
      const db = c.get('db');
      const liquidityService = new LiquidityService(db);
      const analytics = await liquidityService.getPoolAnalytics(address, chainId);
      return c.json({ success: true, data: analytics });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Collect fees from pool
  app.post('/liquidity/collect-fees', async (c) => {
    try {
      const { poolAddress, chainId } = await c.req.json();
      
      if (!poolAddress) {
        return c.json({ success: false, error: 'Pool address is required' }, 400);
      }
      
      const db = c.get('db');
      const liquidityService = new LiquidityService(db);
      const result = await liquidityService.collectFees(poolAddress, chainId);
      return c.json({ success: true, data: result });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  app.get('/liquidity/pool/:address', async (c) => {
    try {
      const address = c.req.param('address');
      
      const db = c.get('db');
      const liquidityService = new LiquidityService(db);
      const stats = await liquidityService.getPoolLiquidityStats(address);
      return c.json({ success: true, data: stats });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  app.get('/liquidity/events', async (c) => {
    try {
      const pairAddress = c.req.query('pairAddress');
      const chainId = c.req.query('chainId') ? parseInt(c.req.query('chainId')) : null;
      const page = parseInt(c.req.query('page')) || 1;
      const limit = parseInt(c.req.query('limit')) || 20;
      
      const db = c.get('db');
      const liquidityService = new LiquidityService(db);
      const events = await liquidityService.getLiquidityEvents(pairAddress, chainId, page, limit);
      return c.json({ success: true, data: events });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Analytics routes
  app.get('/analytics/overview', async (c) => {
    try {
      const chainId = c.req.query('chainId') ? parseInt(c.req.query('chainId')) : null;
      
      const db = c.get('db');
      const swapService = new SwapService(db);
      const liquidityService = new LiquidityService(db);
      const [swapStats, topTokens, topPools] = await Promise.all([
        swapService.getSwapStats(chainId, '24h'),
        tokenRepo.getTopTokensByVolume(chainId, 5),
        liquidityService.getAllPools(chainId, 1, 5)
      ]);
      
      return c.json({
        success: true,
        data: {
          swapStats,
          topTokens,
          topPools
        }
      });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Portfolio endpoint (dynamic)
  app.get('/portfolio/:address', async (c) => {
    const { address } = c.req.param();
    const chainId = c.req.query('chainId') ? parseInt(c.req.query('chainId')) : null;
    try {
      // Get all tokens
      const db = c.get('db');
      const tokenRepo = new TokenRepository(db);
      const tokensList = await db.select().from(c.env.schema.tokens);
      // Get all user liquidity events
      const liquidityEvents = await db.select().from(c.env.schema.liquidityEvents)
        .where(eq(c.env.schema.liquidityEvents.provider, address));
      // Get all user swaps
      const swaps = await db.select().from(c.env.schema.swaps)
        .where(eq(c.env.schema.swaps.sender, address));

      // Aggregate token balances from liquidity events and swaps
      const tokenBalances = {};
      for (const event of liquidityEvents) {
        // Add or remove liquidity
        const sign = event.action === 'add' ? 1 : -1;
        tokenBalances[event.pairAddress] = tokenBalances[event.pairAddress] || { amount0: 0, amount1: 0, chainId: event.chainId };
        tokenBalances[event.pairAddress].amount0 += sign * parseFloat(event.amount0);
        tokenBalances[event.pairAddress].amount1 += sign * parseFloat(event.amount1);
      }
      // (Optional: aggregate from swaps as well)

      // Calculate total value and tokens breakdown
      let totalValue = 0;
      let tokens = [];
      for (const pairAddress in tokenBalances) {
        const pair = await db.select().from(c.env.schema.pairs)
          .where(eq(c.env.schema.pairs.address, pairAddress));
        if (!pair[0]) continue;
        const token0 = tokensList.find(t => t.address === pair[0].token0Address);
        const token1 = tokensList.find(t => t.address === pair[0].token1Address);
        if (token0) {
          const value = tokenBalances[pairAddress].amount0 * (token0.priceUsd || 0);
          totalValue += value;
          tokens.push({ symbol: token0.symbol, value, balance: tokenBalances[pairAddress].amount0, chainId: token0.chainId });
        }
        if (token1) {
          const value = tokenBalances[pairAddress].amount1 * (token1.priceUsd || 0);
          totalValue += value;
          tokens.push({ symbol: token1.symbol, value, balance: tokenBalances[pairAddress].amount1, chainId: token1.chainId });
        }
      }
      // Remove tokens with zero balance
      tokens = tokens.filter(t => t.balance !== 0);
      // Calculate APY (mock: average of 12.5%)
      const apy = 12.5;
      // Recent transactions: combine swaps and liquidity events, sort by timestamp
      const txs = [
        ...swaps.map(s => ({ id: s.id, value: parseFloat(s.amountIn), timestamp: s.timestamp, type: 'swap' })),
        ...liquidityEvents.map(e => ({ id: e.id, value: parseFloat(e.amount0) + parseFloat(e.amount1), timestamp: e.timestamp, type: e.action }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
      // 24h change and total assets
      const change24h = 0; // (Optional: calculate based on price change)
      const totalAssets = tokens.length;
      return c.json({
        success: true,
        data: {
          totalValue,
          change24h,
          totalAssets,
          apy,
          tokens,
          transactions: txs
        }
      });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Bridge status endpoint (dynamic)
  app.get('/bridge/status', async (c) => {
    try {
      // Check for recent successful transactions (last 24h)
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const db = c.get('db');
      const recent = await db.select().from(c.env.schema.bridgeTransactions)
        .where(c.env.schema.bridgeTransactions.status === 'completed' && c.env.schema.bridgeTransactions.timestamp > since);
      const status = recent.length > 0 ? 'operational' : 'degraded';
      return c.json({
        success: true,
        data: {
          status,
          supportedChains: [1, 137, 56],
          message: status === 'operational' ? 'Bridge is operational on all supported chains.' : 'Bridge is experiencing issues.'
        }
      });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Bridge transactions endpoint (dynamic)
  app.get('/bridge/transactions', async (c) => {
    try {
      const address = c.req.query('address');
      let query = c.get('db').select().from(c.env.schema.bridgeTransactions);
      if (address) {
        query = query.where(c.env.schema.bridgeTransactions.userAddress === address);
      }
      const txs = await query.orderBy(c.env.schema.bridgeTransactions.timestamp, 'desc').limit(50);
      return c.json({
        success: true,
        data: txs
      });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // General transactions endpoint (dynamic)
  app.get('/transactions/:address', async (c) => {
    try {
      const address = c.req.param('address');
      const filter = c.req.query('filter') || 'all';
      const db = c.get('db');
      
      // Get swaps for the user
      const swaps = await db.select().from(c.env.schema.swaps)
        .where(eq(c.env.schema.swaps.sender, address))
        .orderBy(desc(c.env.schema.swaps.timestamp))
        .limit(50);
      
      // Get liquidity events for the user
      const liquidityEvents = await db.select().from(c.env.schema.liquidityEvents)
        .where(eq(c.env.schema.liquidityEvents.provider, address))
        .orderBy(desc(c.env.schema.liquidityEvents.timestamp))
        .limit(50);
      
      // Get bridge transactions for the user
      const bridgeTransactions = await db.select().from(c.env.schema.bridgeTransactions)
        .where(eq(c.env.schema.bridgeTransactions.userAddress, address))
        .orderBy(desc(c.env.schema.bridgeTransactions.timestamp))
        .limit(50);
      
      // Combine and format all transactions
      const allTransactions = [
        ...swaps.map(swap => ({
          id: `swap_${swap.id}`,
          type: 'swap',
          status: 'confirmed', // Assuming confirmed if in database
          from: swap.tokenIn,
          to: swap.tokenOut,
          amount: swap.amountIn,
          value: swap.amountOut,
          timestamp: swap.timestamp,
          txHash: swap.txHash,
          chainId: swap.chainId,
          blockNumber: swap.blockNumber
        })),
        ...liquidityEvents.map(event => ({
          id: `liquidity_${event.id}`,
          type: 'liquidity',
          status: 'confirmed',
          action: event.action,
          pair: `${event.pairAddress}`,
          amount: event.amount0,
          value: event.amount1,
          timestamp: event.timestamp,
          txHash: event.txHash,
          chainId: event.chainId,
          blockNumber: event.blockNumber
        })),
        ...bridgeTransactions.map(bridge => ({
          id: `bridge_${bridge.id}`,
          type: 'bridge',
          status: bridge.status,
          from: bridge.token,
          to: bridge.token,
          amount: bridge.amount,
          fromChain: bridge.fromChain,
          toChain: bridge.toChain,
          timestamp: bridge.timestamp,
          txHash: bridge.txHash,
          chainId: bridge.fromChain
        }))
      ];
      
      // Sort by timestamp (newest first)
      allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Apply filter if specified
      let filteredTransactions = allTransactions;
      if (filter !== 'all') {
        filteredTransactions = allTransactions.filter(tx => tx.type === filter);
      }
      
      return c.json({
        success: true,
        data: filteredTransactions
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Add new transaction endpoint
  app.post('/transactions', async (c) => {
    try {
      const transactionData = await c.req.json();
      const db = c.get('db');
      
      let result;
      
      switch (transactionData.type) {
        case 'swap':
          result = await db.insert(c.env.schema.swaps).values({
            txHash: transactionData.txHash,
            pairAddress: transactionData.pairAddress || '',
            sender: transactionData.sender,
            tokenIn: transactionData.tokenIn,
            tokenOut: transactionData.tokenOut,
            amountIn: transactionData.amountIn,
            amountOut: transactionData.amountOut,
            chainId: transactionData.chainId,
            blockNumber: transactionData.blockNumber,
            timestamp: transactionData.timestamp
          });
          break;
          
        case 'liquidity':
          result = await db.insert(c.env.schema.liquidityEvents).values({
            txHash: transactionData.txHash,
            pairAddress: transactionData.pairAddress,
            provider: transactionData.provider,
            action: transactionData.action,
            amount0: transactionData.amount0,
            amount1: transactionData.amount1,
            chainId: transactionData.chainId,
            blockNumber: transactionData.blockNumber,
            timestamp: transactionData.timestamp
          });
          break;
          
        case 'bridge':
          result = await db.insert(c.env.schema.bridgeTransactions).values({
            txHash: transactionData.txHash,
            fromChain: transactionData.fromChain,
            toChain: transactionData.toChain,
            userAddress: transactionData.userAddress,
            token: transactionData.token,
            amount: transactionData.amount,
            status: transactionData.status,
            timestamp: transactionData.timestamp
          });
          break;
          
        default:
          return c.json({ success: false, error: 'Invalid transaction type' }, 400);
      }
      
      return c.json({
        success: true,
        data: {
          id: result.insertId,
          ...transactionData
        }
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Error handling
  app.onError((err, c) => {
    console.error('API Error:', err);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  });

  return app;
} 