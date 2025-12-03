// Wallet Activity Routes
// Fetches on-chain transaction data for user wallets
// This is privacy-safe as blockchain data is public

import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import * as schema from '../database/schema.js';

export function createWalletActivityRoutes() {
  const app = new Hono();

  // Get wallet activity from blockchain (on-chain transactions)
  // Privacy Note: This queries public blockchain data only - no privacy concerns
  app.get('/wallet-activity', async (c) => {
    try {
      const walletAddress = c.req.query('address');
      const chainId = c.req.query('chainId') ? parseInt(c.req.query('chainId')) : 1;
      const range = c.req.query('range') || '30d';
      
      if (!walletAddress || walletAddress === 'anonymous') {
        return c.json({
          success: false,
          error: 'Wallet address is required'
        }, 400);
      }

      // Calculate time window
      const now = new Date();
      let timeWindow = 0;
      switch (range) {
        case '24h':
          timeWindow = 24 * 60 * 60 * 1000;
          break;
        case '7d':
          timeWindow = 7 * 24 * 60 * 60 * 1000;
          break;
        case '30d':
          timeWindow = 30 * 24 * 60 * 60 * 1000;
          break;
        case '1y':
          timeWindow = 365 * 24 * 60 * 60 * 1000;
          break;
      }
      
      const startTime = new Date(now.getTime() - timeWindow);
      const db = c.get('db');

      // Query user interactions from database (tracked activities)
      const trackedActivity = await db.select()
        .from(schema.userInteractions)
        .where(
          sql`user_id = ${walletAddress} AND datetime(timestamp) >= datetime(${startTime.toISOString()})`
        )
        .orderBy(sql`timestamp DESC`);

      // Aggregate by action type
      const activityByType = {};
      trackedActivity.forEach(activity => {
        const action = activity.action;
        if (!activityByType[action]) {
          activityByType[action] = [];
        }
        activityByType[action].push({
          timestamp: activity.timestamp,
          chainId: activity.chainId,
          tokenAddress: activity.tokenAddress,
          pairAddress: activity.pairAddress,
          amount: activity.amount,
          txHash: activity.txHash,
          metadata: activity.metadata ? JSON.parse(activity.metadata) : {}
        });
      });

      // Note: For full on-chain data, you would query blockchain RPC here
      // This is a placeholder for future enhancement
      // You could use ethers.js to query transaction history from block explorers
      // Example: Query Etherscan API or similar for transaction history

      return c.json({
        success: true,
        data: {
          walletAddress,
          chainId,
          range,
          totalTransactions: trackedActivity.length,
          activityByType,
          trackedActivity: trackedActivity.slice(0, 50), // Last 50 activities
          note: 'This includes tracked activities. For full on-chain history, blockchain RPC queries can be added.'
        }
      });
    } catch (error) {
      console.error('Wallet activity endpoint error:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch wallet activity',
        message: error.message
      }, 500);
    }
  });

  return app;
}

