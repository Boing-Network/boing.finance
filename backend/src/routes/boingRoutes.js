import { Hono } from 'hono';
import { PointsRepository } from '../database/repositories/pointsRepository.js';

function isEthAddress(addr) {
  return typeof addr === 'string' && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

const ALLOWED_ACTIONS = ['swap', 'liquidity_add', 'liquidity_remove', 'bridge', 'deploy', 'vote', 'stake', 'unstake', 'claim'];

export const createBoingRoutes = () => {
  const app = new Hono();

  app.get('/points/:address', async (c) => {
    const db = c.get('db');
    const address = c.req.param('address');
    if (!isEthAddress(address)) return c.json({ success: false, error: 'Invalid address' }, 400);
    const repo = new PointsRepository(db);
    const row = await repo.getOrCreatePoints(address);
    return c.json({ success: true, data: { address: row.address, points: row.points, updatedAt: row.updatedAt } });
  });

  app.get('/points/:address/activity', async (c) => {
    const db = c.get('db');
    const address = c.req.param('address');
    if (!isEthAddress(address)) return c.json({ success: false, error: 'Invalid address' }, 400);
    const limit = Math.min(parseInt(c.req.query('limit'), 10) || 50, 100);
    const offset = Math.max(0, parseInt(c.req.query('offset'), 10) || 0);
    const repo = new PointsRepository(db);
    const list = await repo.getActivityHistory(address, limit, offset);
    return c.json({ success: true, data: list });
  });

  app.post('/points/accrue', async (c) => {
    const db = c.get('db');
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ success: false, error: 'Invalid JSON body' }, 400);
    }
    const { address, points, action, txHash, chainId, metadata } = body;
    if (!address || points == null) return c.json({ success: false, error: 'Missing address or points' }, 400);
    if (!isEthAddress(address)) return c.json({ success: false, error: 'Invalid address' }, 400);
    const pts = parseInt(points, 10);
    if (Number.isNaN(pts) || pts < 0) return c.json({ success: false, error: 'Invalid points' }, 400);
    const act = action && ALLOWED_ACTIONS.includes(action) ? action : 'other';
    const repo = new PointsRepository(db);
    const row = await repo.addPoints(address, pts, act, txHash || null, chainId != null ? parseInt(chainId, 10) : null, metadata || null);
    return c.json({ success: true, data: row });
  });

  app.get('/activity', async (c) => {
    const db = c.get('db');
    const limit = Math.min(parseInt(c.req.query('limit'), 10) || 100, 200);
    const offset = Math.max(0, parseInt(c.req.query('offset'), 10) || 0);
    const repo = new PointsRepository(db);
    const list = await repo.getActivityHistoryAll(limit, offset);
    return c.json({ success: true, data: list });
  });

  return app;
};
