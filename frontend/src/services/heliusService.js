/**
 * Helius Solana RPC / DAS / websocket client.
 * Requires REACT_APP_HELIUS_API_KEY. Without it, methods no-op.
 */

function usableKey() {
  const raw = (process.env.REACT_APP_HELIUS_API_KEY || '').trim();
  if (!raw || raw.startsWith('your_') || raw.includes('_here')) return '';
  return raw;
}

export function hasHeliusApiKey() {
  return Boolean(usableKey());
}

export function getHeliusCluster() {
  const net = String(process.env.REACT_APP_SOLANA_NETWORK || 'devnet').toLowerCase();
  return net === 'mainnet' || net === 'mainnet-beta' ? 'mainnet' : 'devnet';
}

export function getHeliusRpcUrl() {
  const key = usableKey();
  if (!key) return null;
  const cluster = getHeliusCluster();
  const host = cluster === 'mainnet' ? 'mainnet.helius-rpc.com' : 'devnet.helius-rpc.com';
  return `https://${host}/?api-key=${key}`;
}

export function getHeliusWsUrl() {
  const key = usableKey();
  if (!key) return null;
  const cluster = getHeliusCluster();
  const host = cluster === 'mainnet' ? 'mainnet.helius-rpc.com' : 'devnet.helius-rpc.com';
  return `wss://${host}/?api-key=${key}`;
}

async function rpc(method, params = []) {
  const url = getHeliusRpcUrl();
  if (!url) return null;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.result ?? null;
  } catch {
    return null;
  }
}

export async function getAsset(id) {
  if (!id) return null;
  return rpc('getAsset', [id]);
}

/**
 * Subscribe to Solana slot updates (heartbeat) plus optional log mentions.
 * Token-mint firehoses are too noisy for the browser; new SPL deploys also arrive
 * via DexScreener profiles and the Helius webhook on the Worker.
 * @param {(event: object) => void} onEvent
 * @returns {() => void}
 */
export function subscribeSolanaSlots(onEvent) {
  const url = getHeliusWsUrl();
  if (!url || typeof WebSocket === 'undefined') return () => {};
  let ws = null;
  let closed = false;
  let delay = 1500;
  let subId = 0;

  const connect = () => {
    if (closed) return;
    try {
      ws = new WebSocket(url);
    } catch {
      return;
    }
    ws.onopen = () => {
      delay = 1500;
      subId += 1;
      ws.send(JSON.stringify({ jsonrpc: '2.0', id: subId, method: 'slotSubscribe', params: [] }));
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg?.method === 'slotNotification' && msg?.params) {
          onEvent({ type: 'solana_slot', source: 'helius', slot: msg.params.result?.slot, ts: Date.now() });
        }
      } catch {
        /* ignore */
      }
    };
    ws.onclose = () => {
      ws = null;
      if (closed) return;
      const wait = delay;
      delay = Math.min(30_000, delay * 2);
      setTimeout(connect, wait);
    };
    ws.onerror = () => {
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
    };
  };

  connect();
  return () => {
    closed = true;
    try {
      ws?.close();
    } catch {
      /* ignore */
    }
  };
}

const heliusService = {
  hasHeliusApiKey,
  getHeliusRpcUrl,
  getHeliusWsUrl,
  getAsset,
  subscribeSolanaSlots,
};

export default heliusService;
