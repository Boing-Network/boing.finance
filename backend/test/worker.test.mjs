// Regression tests for the Worker's DB middleware wiring and error logging.
//
// Background: sub-app middleware (`routes.use('*', dbMiddleware)`) used to be registered AFTER the
// route handlers, so in Hono it never ran before them and `c.get('db')` was undefined, which made
// every DB-backed route return 500 ("Cannot read properties of undefined (reading 'select')").
//
// Run with: npm test   (uses Node's built-in test runner and node:sqlite; Node >= 22.13)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Minimal Cloudflare D1 binding backed by node:sqlite (enough for drizzle-orm/d1). */
function createD1(sqlite) {
  const wrap = (sql, params = []) => ({
    bind: (...p) => wrap(sql, p),
    async all() {
      const rows = sqlite.prepare(sql).all(...params);
      return { results: rows, success: true, meta: {} };
    },
    async raw() {
      return sqlite.prepare(sql).all(...params).map((r) => Object.values(r));
    },
    async first(col) {
      const r = sqlite.prepare(sql).get(...params);
      if (!r) return null;
      return col ? r[col] : r;
    },
    async run() {
      const info = sqlite.prepare(sql).run(...params);
      return { success: true, meta: { changes: Number(info.changes), last_row_id: Number(info.lastInsertRowid) }, results: [] };
    },
  });
  return {
    prepare: (sql) => wrap(sql),
    async batch(stmts) {
      return Promise.all(stmts.map((s) => s.run()));
    },
    async exec(sql) {
      sqlite.exec(sql);
      return { count: 1, duration: 0 };
    },
  };
}

function migratedEnv(extra = {}) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(join(root, 'migrations', '0001_core_tables.sql'), 'utf8'));
  sqlite.exec(readFileSync(join(root, 'd1-portfolio-snapshots.sql'), 'utf8'));
  return { DB: createD1(sqlite), NODE_ENV: 'test', FRONTEND_URL: 'https://boing.finance', ...extra };
}

const { default: app } = await import('../src/worker.js');
const ADDR = '0x' + 'ab'.repeat(20);

async function get(path, env) {
  const res = await app.request(path, {}, env);
  let body = null;
  try { body = await res.json(); } catch { /* not json */ }
  return { res, body };
}

test('GET /api/portfolio/snapshots returns 200 (db middleware runs before handler)', async () => {
  const env = migratedEnv();
  const { res, body } = await get(`/api/portfolio/snapshots?address=${ADDR}&days=30`, env);
  assert.equal(res.status, 200, JSON.stringify(body));
  assert.deepEqual(body, { success: true, data: [] });
});

test('POST then GET portfolio snapshot round-trips through D1', async () => {
  const env = migratedEnv();
  const post = await app.request('/api/portfolio/snapshot', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ userAddress: ADDR, totalValueUsd: 123.45, chainId: 1 }),
  }, env);
  assert.equal(post.status, 200, await post.clone().text());
  const { res, body } = await get(`/api/portfolio/snapshots?address=${ADDR}`, env);
  assert.equal(res.status, 200);
  assert.equal(body.data.length, 1);
  assert.equal(body.data[0].value, 123.45);
});

test('governance routes get the db', async () => {
  const env = migratedEnv();
  for (const path of ['/api/governance/proposals', '/api/governance/treasury']) {
    const { res, body } = await get(path, env);
    assert.equal(res.status, 200, `${path}: ${JSON.stringify(body)}`);
    assert.equal(body.success, true);
  }
});

test('boing points routes get the db', async () => {
  const env = migratedEnv();
  const points = await get(`/api/boing/points/${ADDR}`, env);
  assert.equal(points.res.status, 200, JSON.stringify(points.body));
  assert.equal(points.body.data.points, 0);
  const activity = await get('/api/boing/activity', env);
  assert.equal(activity.res.status, 200, JSON.stringify(activity.body));
});

test('dex, public API and analytics route groups get the db', async () => {
  const env = migratedEnv();
  // These groups had the same ordering bug. Some legacy DEX handlers still depend on tables or
  // columns the current schema lacks (e.g. tokens.volume24h), so only assert that the db handle
  // was injected: a missing handle surfaces as "Cannot read properties of undefined".
  for (const path of ['/api/tokens', '/api/swap/recent', '/api/liquidity/pools', '/analytics/tokens', '/analytics/dashboard']) {
    const { res, body } = await get(path, env);
    const detail = JSON.stringify(body);
    assert.ok(!/Cannot read properties of undefined/.test(detail), `${path} -> ${res.status} ${detail}`);
  }
  const recent = await get('/api/swap/recent', env);
  assert.equal(recent.res.status, 200, JSON.stringify(recent.body));
});

test('DB-only route groups fail clearly when the DB binding is missing', async () => {
  const env = { NODE_ENV: 'test', FRONTEND_URL: 'https://boing.finance' };
  const { res, body } = await get(`/api/portfolio/snapshots?address=${ADDR}`, env);
  assert.equal(res.status, 500);
  assert.equal(body.error, 'Database not configured');
});

test('global error handler logs route + real message but keeps the production body generic', async () => {
  const env = migratedEnv({ NODE_ENV: 'production' });
  env.DB = {
    prepare() { throw new Error('boom: secret-ish internal detail'); },
  };
  const logged = [];
  const orig = console.error;
  console.error = (...args) => logged.push(args);
  try {
    // /api/governance/proposals has no try/catch, so the error reaches app.onError
    const { res, body } = await get('/api/governance/proposals', env);
    assert.equal(res.status, 500);
    assert.equal(body.message, 'Internal server error');
    assert.ok(!JSON.stringify(body).includes('boom'), 'response must not leak the real error');
    assert.ok(body.errorId, 'response carries an errorId for log correlation');
  } finally {
    console.error = orig;
  }
  const line = logged.map((a) => String(a[0])).find((m) => m.includes('[worker-error]'));
  assert.ok(line, 'error was logged server-side');
  assert.match(line, /GET \/api\/governance\/proposals/);
  assert.match(line, /boom: secret-ish internal detail/);
});
