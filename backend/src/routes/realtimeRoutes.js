import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { desc, eq } from 'drizzle-orm';
import * as schema from '../database/schema.js';

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function hmacSha256Hex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyAlchemySignature(c, rawBody) {
  const secret = c.env.ALCHEMY_WEBHOOK_SIGNING_KEY;
  if (!secret) {
    return (c.env.NODE_ENV || 'production') !== 'production';
  }
  const header = c.req.header('x-alchemy-signature') || '';
  const digest = await hmacSha256Hex(secret, rawBody);
  return timingSafeEqual(digest, header.toLowerCase());
}

function flattenAlchemyActivities(payload) {
  const events = [];
  const batch = payload?.event || payload;
  const activities = batch?.activity || batch?.data?.block?.logs || [];
  if (Array.isArray(activities)) {
    for (const item of activities) {
      events.push(item);
    }
  }
  if (Array.isArray(payload)) {
    for (const item of payload) events.push(item);
  }
  return events;
}

function mapAlchemyItem(item) {
  const topics = item?.topics || [];
  const topic0 = String(topics[0] || item?.topic0 || '').toLowerCase();
  const category = String(item?.category || '').toLowerCase();
  const metadata = {
    source: 'alchemy-webhook',
    txHash: item?.hash || item?.transactionHash || item?.transaction?.hash,
    tokenAddress: item?.rawContract?.address || item?.address || item?.contractAddress,
    from: item?.fromAddress || item?.from,
    to: item?.toAddress || item?.to,
    topic0,
  };
  let eventName = 'chain_activity';
  if (topic0.includes('paircreated') || category.includes('token')) eventName = 'token_deployed';
  if (item?.type === 'token_deployed' || item?.eventName === 'TokenDeployed') eventName = 'token_deployed';
  if (item?.eventName === 'PairCreated') eventName = 'pair_created';
  return {
    eventType: 'chain_realtime',
    eventName,
    chainId: Number(item?.chainId || item?.networkId || 0) || null,
    metadata: JSON.stringify(metadata),
  };
}

function mapHeliusItem(item) {
  const type = String(item?.type || item?.transactionType || 'solana_activity').toLowerCase();
  const eventName = type.includes('token') || type.includes('mint') || type.includes('create')
    ? 'solana_mint'
    : 'solana_activity';
  return {
    eventType: 'chain_realtime',
    eventName,
    chainId: 0,
    metadata: JSON.stringify({
      source: 'helius-webhook',
      type,
      txHash: item?.signature || item?.transaction?.signature,
      tokenAddress: item?.tokenTransfers?.[0]?.mint || item?.accountData?.[0]?.account,
      description: item?.description,
    }),
  };
}

function getDb(c) {
  const d1 = c.env.DB;
  if (!d1) return null;
  return drizzle(d1, { schema });
}

export const createRealtimeRoutes = () => {
  const api = new Hono();

  api.get('/realtime/events', async (c) => {
    try {
      const db = getDb(c);
      if (!db) return c.json({ success: true, data: [] });
      const limit = Math.min(100, Math.max(1, Number(c.req.query('limit')) || 40));
      const rows = await db
        .select()
        .from(schema.analyticsEvents)
        .where(eq(schema.analyticsEvents.eventType, 'chain_realtime'))
        .orderBy(desc(schema.analyticsEvents.timestamp))
        .limit(limit);
      c.header('Cache-Control', 'no-store');
      return c.json({ success: true, data: rows });
    } catch (error) {
      const message = String(error?.message || error || '');
      if (/no such table/i.test(message)) {
        c.header('Cache-Control', 'no-store');
        return c.json({ success: true, data: [] });
      }
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  api.post('/webhooks/alchemy', async (c) => {
    const raw = await c.req.text();
    const ok = await verifyAlchemySignature(c, raw);
    if (!ok) return c.json({ success: false, error: 'Invalid signature' }, 401);
    let payload;
    try {
      payload = JSON.parse(raw || '{}');
    } catch {
      return c.json({ success: false, error: 'Invalid JSON' }, 400);
    }
    const db = getDb(c);
    const items = flattenAlchemyActivities(payload);
    if (db && items.length) {
      const rows = items.map(mapAlchemyItem);
      try {
        await db.insert(schema.analyticsEvents).values(rows);
      } catch (error) {
        console.warn('Alchemy webhook persist failed:', error?.message);
      }
    }
    return c.json({ success: true, ingested: items.length });
  });

  api.post('/webhooks/helius', async (c) => {
    const raw = await c.req.text();
    const secret = c.env.HELIUS_WEBHOOK_SECRET;
    if (!secret) {
      if ((c.env.NODE_ENV || 'production') === 'production') {
        return c.json({ success: false, error: 'Webhook not configured' }, 503);
      }
    } else {
      const header = c.req.header('authorization') || c.req.query('secret') || '';
      const expected = header.startsWith('Bearer ') ? header.slice(7) : header;
      if (!timingSafeEqual(String(secret), String(expected))) {
        return c.json({ success: false, error: 'Invalid secret' }, 401);
      }
    }
    let payload;
    try {
      payload = JSON.parse(raw || '[]');
    } catch {
      return c.json({ success: false, error: 'Invalid JSON' }, 400);
    }
    const items = Array.isArray(payload) ? payload : [payload];
    const db = getDb(c);
    if (db && items.length) {
      try {
        await db.insert(schema.analyticsEvents).values(items.map(mapHeliusItem));
      } catch (error) {
        console.warn('Helius webhook persist failed:', error?.message);
      }
    }
    return c.json({ success: true, ingested: items.length });
  });

  return api;
};
