import { Hono } from 'hono';
import { eq, and, gte, desc } from 'drizzle-orm';
import * as schema from '../database/schema.js';

/**
 * Portfolio snapshots API - uses Cloudflare D1 for PnL tracking
 * POST /api/portfolio/snapshot - save a snapshot
 * GET /api/portfolio/snapshots?address=0x...&days=30 - get history
 */
export const createPortfolioRoutes = () => {
  const portfolio = new Hono();

  // Save portfolio snapshot
  portfolio.post('/snapshot', async (c) => {
    try {
      const db = c.get('db');
      const body = await c.req.json();
      const { userAddress, totalValueUsd, chainId, snapshotData } = body;

      if (!userAddress || totalValueUsd == null) {
        return c.json({ success: false, error: 'userAddress and totalValueUsd required' }, 400);
      }

      const value = parseFloat(totalValueUsd);
      if (isNaN(value) || value < 0) {
        return c.json({ success: false, error: 'Invalid totalValueUsd' }, 400);
      }

      await db.insert(schema.portfolioSnapshots).values({
        userAddress: String(userAddress).toLowerCase(),
        totalValueUsd: value,
        chainId: chainId ?? null,
        snapshotData: snapshotData ? JSON.stringify(snapshotData) : null
      });

      return c.json({ success: true, message: 'Snapshot saved' });
    } catch (error) {
      console.error('Portfolio snapshot error:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Get portfolio history for chart
  portfolio.get('/snapshots', async (c) => {
    try {
      const db = c.get('db');
      const address = c.req.query('address');
      const days = parseInt(c.req.query('days') || '30', 10);
      const limit = Math.min(Math.max(days, 1), 90); // max 90 days

      if (!address) {
        return c.json({ success: false, error: 'address query param required' }, 400);
      }

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - limit);
      const cutoffStr = cutoff.toISOString();

      const rows = await db
        .select()
        .from(schema.portfolioSnapshots)
        .where(
          and(
            eq(schema.portfolioSnapshots.userAddress, String(address).toLowerCase()),
            gte(schema.portfolioSnapshots.timestamp, cutoffStr)
          )
        )
        .orderBy(desc(schema.portfolioSnapshots.timestamp))
        .limit(500);

      const history = rows.map(r => ({
        value: r.totalValueUsd,
        timestamp: r.timestamp,
        date: r.timestamp ? new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null
      })).reverse();

      return c.json({ success: true, data: history });
    } catch (error) {
      console.error('Portfolio snapshots fetch error:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  return portfolio;
};
