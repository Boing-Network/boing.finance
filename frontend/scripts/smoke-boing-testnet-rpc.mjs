#!/usr/bin/env node
/**
 * Minimal Boing JSON-RPC smoke for CI or local checks (Phase P0 — docs/boing-l1-dex-roadmap.md).
 *
 * Usage:
 *   npm run smoke:boing-rpc
 *   BOING_SMOKE_RPC_URL=https://testnet-rpc.boing.network/ npm run smoke:boing-rpc
 *   BOING_SMOKE_BYTECODE_HEX=0x... npm run smoke:boing-rpc   # optional boing_qaCheck
 *   BOING_SMOKE_SKIP_ON_BLOCK=1   # exit 0 on HTTP 401/403/429 (e.g. WAF blocking CI egress)
 *
 * Exits 0 on success, 1 on failure.
 */

const baseUrl = (process.env.BOING_SMOKE_RPC_URL || 'https://testnet-rpc.boing.network').replace(/\/?$/, '/');

/** Some edges block default fetch() (403); a browser-like UA often passes. */
const SMOKE_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'User-Agent':
    process.env.BOING_SMOKE_USER_AGENT ||
    'Mozilla/5.0 (compatible; BoingFinance-RPC-Smoke/1.0; +https://github.com/Boing-Network/boing.finance)',
};

async function boingRpc(method, params = []) {
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: SMOKE_HEADERS,
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!res.ok) {
    const soft =
      String(process.env.BOING_SMOKE_SKIP_ON_BLOCK || '').trim() === '1' &&
      (res.status === 401 || res.status === 403 || res.status === 429);
    if (soft) {
      const err = new Error(
        `HTTP ${res.status} (edge may block CI); set BOING_SMOKE_SKIP_ON_BLOCK=0 to fail hard`
      );
      err.code = 'BOING_SMOKE_SKIPPED_HTTP_BLOCK';
      throw err;
    }
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  if (json.error) {
    const msg = json.error.message || JSON.stringify(json.error);
    throw new Error(`${method}: ${msg}`);
  }
  return json.result;
}

async function main() {
  console.log(`Boing RPC smoke → ${baseUrl}`);

  const height = await boingRpc('boing_chainHeight', []);
  if (typeof height !== 'number' || Number.isNaN(height)) {
    throw new Error(`boing_chainHeight: expected number, got ${JSON.stringify(height)}`);
  }
  console.log(`ok  boing_chainHeight = ${height}`);

  const bytecode = (process.env.BOING_SMOKE_BYTECODE_HEX || '').trim();
  if (bytecode) {
    const qa = await boingRpc('boing_qaCheck', [bytecode]);
    console.log(`ok  boing_qaCheck → ${JSON.stringify(qa)}`);
  } else {
    console.log('skip boing_qaCheck (set BOING_SMOKE_BYTECODE_HEX to run)');
  }

  try {
    const receipt = await boingRpc('boing_getTransactionReceipt', [
      '0x' + '00'.repeat(32),
    ]);
    if (receipt !== null && receipt !== undefined) {
      console.log('ok  boing_getTransactionReceipt (dummy id) returned object');
    } else {
      console.log('ok  boing_getTransactionReceipt (dummy id) → null (expected)');
    }
  } catch (e) {
    console.warn('warn boing_getTransactionReceipt:', e.message);
  }

  console.log('Boing RPC smoke passed.');
}

main().catch((e) => {
  if (e && e.code === 'BOING_SMOKE_SKIPPED_HTTP_BLOCK') {
    console.warn('Boing RPC smoke skipped:', e.message);
    process.exit(0);
  }
  console.error('Boing RPC smoke failed:', e.message || e);
  process.exit(1);
});
