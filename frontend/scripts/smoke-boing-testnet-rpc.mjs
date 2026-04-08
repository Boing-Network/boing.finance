#!/usr/bin/env node
/**
 * Minimal Boing JSON-RPC smoke for CI or local checks (Phase P0 — docs/boing-l1-dex-roadmap.md).
 *
 * Usage:
 *   npm run smoke:boing-rpc
 *   BOING_SMOKE_RPC_URL=https://testnet-rpc.boing.network/ npm run smoke:boing-rpc
 *   BOING_SMOKE_BYTECODE_HEX=0x... npm run smoke:boing-rpc   # optional boing_qaCheck
 *
 * Exits 0 on success, 1 on failure.
 */

const baseUrl = (process.env.BOING_SMOKE_RPC_URL || 'https://testnet-rpc.boing.network').replace(/\/?$/, '/');

async function boingRpc(method, params = []) {
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!res.ok) {
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
  console.error('Boing RPC smoke failed:', e.message || e);
  process.exit(1);
});
