import { Hono } from 'hono';

const ALLOWED_METHODS = new Set([
  'getLatestBlockhash',
  'getRecentBlockhash',
  'getMinimumBalanceForRentExemption',
  'getBalance',
  'getAccountInfo',
  'getMultipleAccounts',
  'getTokenAccountsByOwner',
  'getParsedTokenAccountsByOwner',
  'getFeeForMessage',
  'getRecentPrioritizationFees',
  'getSignatureStatuses',
  'getTransaction',
  'getSlot',
  'getBlockHeight',
  'getEpochInfo',
  'getHealth',
  'getVersion',
  'getGenesisHash',
  'simulateTransaction',
  'sendTransaction',
  'isBlockhashValid',
]);

function clusterFromRequest(c) {
  const raw = String(c.req.query('cluster') || c.req.query('network') || 'devnet').toLowerCase();
  return raw === 'mainnet' || raw === 'mainnet-beta' ? 'mainnet' : 'devnet';
}

function upstreamsFor(cluster, env = {}) {
  const urls = [];
  const push = (url) => {
    const trimmed = String(url || '').trim();
    if (trimmed && !urls.includes(trimmed)) urls.push(trimmed);
  };

  if (cluster === 'mainnet') {
    push(env.SOLANA_MAINNET_RPC);
    if (env.HELIUS_API_KEY) {
      push(`https://mainnet.helius-rpc.com/?api-key=${env.HELIUS_API_KEY}`);
    }
    push('https://rpc.ankr.com/solana');
    push('https://solana.llamarpc.com');
    push('https://solana.api.onfinality.io/public');
  } else {
    push(env.SOLANA_DEVNET_RPC);
    if (env.HELIUS_API_KEY) {
      push(`https://devnet.helius-rpc.com/?api-key=${env.HELIUS_API_KEY}`);
    }
    push('https://rpc.ankr.com/solana_devnet');
    push('https://api.devnet.solana.com');
  }
  return urls;
}

async function forwardJsonRpc(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { res, text, json };
}

export async function handleSolanaRpcPost(c) {
    c.header('Cache-Control', 'no-store');
    const cluster = clusterFromRequest(c);
    let payload;
    try {
      payload = await c.req.json();
    } catch {
      return c.json({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null }, 400);
    }

    const method = payload?.method;
    if (!method || !ALLOWED_METHODS.has(method)) {
      return c.json({
        jsonrpc: '2.0',
        error: { code: -32601, message: 'Method not allowed' },
        id: payload?.id ?? null,
      }, 400);
    }

    const urls = upstreamsFor(cluster, c.env);
    let lastStatus = 502;
    const lastBody = { jsonrpc: '2.0', error: { code: -32000, message: 'No Solana RPC upstream available' }, id: payload?.id ?? null };

    for (const url of urls) {
      try {
        const { res, json } = await forwardJsonRpc(url, payload);
        if (json && (res.ok || json.result !== undefined || json.error)) {
          return c.json(json, res.ok ? 200 : res.status);
        }
        lastStatus = res.status || 502;
      } catch {
        lastStatus = 502;
      }
    }

    return c.json(lastBody, lastStatus);
}

export function createSolanaRpcRoutes() {
  const router = new Hono();
  router.post('/rpc', handleSolanaRpcPost);
  return router;
}
