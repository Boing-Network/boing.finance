/**
 * DexScreener public API — no account or API key.
 * Docs: https://docs.dexscreener.com/api/reference
 */

const DEXSCREENER_REST = 'https://api.dexscreener.com';
const DEXSCREENER_WS = 'wss://api.dexscreener.com';
const CACHE_TTL_MS = 20_000;

export const DEXSCREENER_CHAIN_BY_ID = {
  1: 'ethereum',
  56: 'bsc',
  137: 'polygon',
  42161: 'arbitrum',
  10: 'optimism',
  8453: 'base',
  43114: 'avalanche',
  250: 'fantom',
  59144: 'linea',
  534352: 'scroll',
  81457: 'blast',
  5000: 'mantle',
  324: 'zksync',
  1101: 'polygonzkevm',
  204: 'opbnb',
  34443: 'mode',
  100: 'gnosis',
};

const cache = new Map();
const inFlight = new Map();

function cacheGet(key) {
  const row = cache.get(key);
  if (!row) return null;
  if (Date.now() - row.timestamp > CACHE_TTL_MS) return null;
  return row.data;
}

async function getJson(path) {
  const url = `${DEXSCREENER_REST}${path}`;
  const hit = cacheGet(url);
  if (hit != null) return hit;
  if (inFlight.has(url)) return inFlight.get(url);
  const pending = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!res.ok) return cacheGet(url);
      const data = await res.json();
      cache.set(url, { data, timestamp: Date.now() });
      return data;
    } catch {
      return cacheGet(url);
    } finally {
      clearTimeout(timer);
      inFlight.delete(url);
    }
  })();
  inFlight.set(url, pending);
  return pending;
}

function pickBestPair(pairs) {
  if (!Array.isArray(pairs) || !pairs.length) return null;
  return [...pairs].sort((a, b) => {
    const liq = (Number(b?.liquidity?.usd) || 0) - (Number(a?.liquidity?.usd) || 0);
    if (liq) return liq;
    return (Number(b?.volume?.h24) || 0) - (Number(a?.volume?.h24) || 0);
  })[0];
}

function quoteFromPair(pair) {
  if (!pair) return null;
  const usd = Number(pair.priceUsd);
  if (!Number.isFinite(usd) || usd <= 0) return null;
  const change = Number(pair.priceChange?.h24);
  return {
    usd,
    usd_24h_change: Number.isFinite(change) ? change : null,
    pair,
    source: 'dexscreener',
  };
}

export function dexscreenerChainSlug(chainId, isSolana = false) {
  if (isSolana) return 'solana';
  return DEXSCREENER_CHAIN_BY_ID[Number(chainId)] || null;
}

export async function getPairsForToken(address, chainSlug) {
  const addr = String(address || '').trim();
  if (!addr) return [];
  if (chainSlug) {
    const data = await getJson(`/tokens/v1/${encodeURIComponent(chainSlug)}/${encodeURIComponent(addr)}`);
    if (Array.isArray(data) && data.length) return data;
    const nested = data?.pairs;
    if (Array.isArray(nested) && nested.length) return nested;
  }
  const latest = await getJson(`/latest/dex/tokens/${encodeURIComponent(addr)}`);
  return Array.isArray(latest?.pairs) ? latest.pairs : [];
}

export async function getTokenUsdQuote(address, chainSlug) {
  const pairs = await getPairsForToken(address, chainSlug);
  const filtered = chainSlug
    ? pairs.filter((p) => !p?.chainId || String(p.chainId).toLowerCase() === String(chainSlug).toLowerCase())
    : pairs;
  return quoteFromPair(pickBestPair(filtered.length ? filtered : pairs));
}

export async function getLatestTokenProfiles() {
  const data = await getJson('/token-profiles/latest/v1');
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

/**
 * Stream newly published token profiles (no auth).
 * @param {(profile: object) => void} onProfile
 * @returns {() => void} unsubscribe
 */
export function subscribeTokenProfiles(onProfile) {
  let ws = null;
  let closed = false;
  let delay = 1500;

  const connect = () => {
    if (closed || typeof WebSocket === 'undefined') return;
    try {
      ws = new WebSocket(`${DEXSCREENER_WS}/token-profiles/latest/v1`);
    } catch {
      return;
    }
    ws.onmessage = (event) => {
      delay = 1500;
      let payload = event.data;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }
      const rows = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : payload && typeof payload === 'object' && payload.tokenAddress
            ? [payload]
            : [];
      rows.forEach((row) => {
        if (row?.tokenAddress) onProfile(row);
      });
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

const dexscreenerService = {
  getPairsForToken,
  getTokenUsdQuote,
  getLatestTokenProfiles,
  subscribeTokenProfiles,
  dexscreenerChainSlug,
};

export default dexscreenerService;
