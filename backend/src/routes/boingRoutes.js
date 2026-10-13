import { Hono } from 'hono';
import { PointsRepository } from '../database/repositories/pointsRepository.js';

function isEthAddress(addr) {
  return typeof addr === 'string' && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

function isTxHash(h) {
  return typeof h === 'string' && /^0x[a-fA-F0-9]{64}$/.test(h);
}

/** Must stay aligned with frontend `POINTS_RATES` in tryAccruePoints.js */
const POINTS_RATES = Object.freeze({
  swap: 10,
  liquidity_add: 25,
  liquidity_remove: 10,
  bridge: 15,
  deploy: 50,
  vote: 20,
  stake: 25,
  unstake: 10,
  claim: 15,
});

const ALLOWED_ACTIONS = Object.keys(POINTS_RATES);
const MAX_POINTS_PER_ACCRUE = Math.max(...Object.values(POINTS_RATES));

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
    if (!action || !ALLOWED_ACTIONS.includes(action)) {
      return c.json({ success: false, error: `Invalid action (allowed: ${ALLOWED_ACTIONS.join(', ')})` }, 400);
    }
    if (!txHash || !isTxHash(txHash)) {
      return c.json({ success: false, error: 'Missing or invalid txHash (0x + 64 hex)' }, 400);
    }
    const pts = parseInt(points, 10);
    if (Number.isNaN(pts) || pts < 0 || pts > MAX_POINTS_PER_ACCRUE) {
      return c.json({ success: false, error: `Invalid points (0–${MAX_POINTS_PER_ACCRUE})` }, 400);
    }
    const expected = POINTS_RATES[action];
    if (pts !== expected) {
      return c.json({ success: false, error: `points must be ${expected} for action ${action}` }, 400);
    }

    const repo = new PointsRepository(db);
    if (typeof repo.findActivityByTxHash === 'function') {
      const existing = await repo.findActivityByTxHash(txHash);
      if (existing) {
        return c.json({ success: true, data: existing, deduped: true });
      }
    }

    const row = await repo.addPoints(
      address,
      pts,
      action,
      txHash,
      chainId != null ? parseInt(chainId, 10) : null,
      metadata || null
    );
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
