/**
 * LI.FI REST API for the Bridge (no SDK: plain fetch keeps the bundle small).
 * - Chains, tokens, single-token lookup, wallet balances and status go straight to https://li.quest/v1
 *   (public, 100 requests/min per visitor) and are cached in memory + localStorage.
 * - Quotes go through our Worker (`/api/aggregator/lifi/quote`), which adds the integrator fee and the LI.FI API
 *   key server-side (keyless quotes are limited to 75 per two hours per visitor). If the Worker is unavailable
 *   the browser asks li.quest directly.
 */
import { getApiUrl } from '../config';
import { LIFI_INTEGRATOR, PLATFORM_BRIDGE_FEE } from '../config/bridge';
import { LIFI_CHAIN_TYPES, normalizeChain, normalizeToken, packTokens, sortChains, unpackTokens } from '../utils/lifiCore';

export const LIFI_BASE = 'https://li.quest/v1';
const CHAINS_TTL = 6 * 60 * 60 * 1000;
const TOKENS_TTL = 6 * 60 * 60 * 1000;
const BALANCES_TTL = 60 * 1000;
const LS_CHAINS = 'boing_lifi_chains_v1';
const LS_TOKENS = 'boing_lifi_tokens_v1_';
const LS_TOKENS_INDEX = 'boing_lifi_tokens_v1_index';
const MAX_STORED_TOKEN_LISTS = 4;

const mem = new Map();
const inflight = new Map();

export class LifiError extends Error {
  constructor(message, { status, code, body } = {}) {
    super(message);
    this.name = 'LifiError';
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

async function getJson(url, { signal, headers } = {}) {
  let res;
  try {
    res = await fetch(url, { signal, headers: { Accept: 'application/json', ...(headers || {}) } });
  } catch (e) {
    if (e?.name === 'AbortError') throw e;
    throw new LifiError(e?.message || 'Failed to fetch', { status: 0 });
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new LifiError(body?.message || `LI.FI request failed (${res.status})`, { status: res.status, code: body?.code, body });
  }
  return body;
}

function readLs(key, ttl) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!v || Date.now() - Number(v.t) > ttl) return null;
    return v.d;
  } catch {
    return null;
  }
}

function writeLs(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: data }));
    return true;
  } catch {
    return false;
  }
}

/** Dedupe concurrent requests for the same key. */
function once(key, fn) {
  if (inflight.has(key)) return inflight.get(key);
  const p = fn().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

/** Every LI.FI chain (EVM, Solana, Bitcoin, Sui, Tron, …), sorted with popular networks first. */
export async function fetchLifiChains({ signal } = {}) {
  const hit = mem.get('chains');
  if (hit && Date.now() - hit.t < CHAINS_TTL) return hit.d;
  const stored = readLs(LS_CHAINS, CHAINS_TTL);
  if (stored?.length) {
    const chains = stored.map(normalizeChain);
    mem.set('chains', { t: Date.now(), d: chains });
    return chains;
  }
  return once('chains', async () => {
    const body = await getJson(`${LIFI_BASE}/chains?chainTypes=${LIFI_CHAIN_TYPES.join(',')}`, { signal });
    const raw = (body.chains || []).filter((c) => c.mainnet !== false);
    // Store only what the UI needs (the full payload carries contract addresses and RPC lists).
    const slim = raw.map((c) => ({
      id: c.id,
      key: c.key,
      name: c.name,
      chainType: c.chainType,
      logoURI: c.logoURI,
      coin: c.coin,
      mainnet: c.mainnet,
      nativeToken: c.nativeToken,
      metamask: c.metamask,
    }));
    writeLs(LS_CHAINS, slim);
    const chains = sortChains(slim.map(normalizeChain));
    mem.set('chains', { t: Date.now(), d: chains });
    return chains;
  });
}

function rememberTokenList(chainId, tokens) {
  const key = `${LS_TOKENS}${chainId}`;
  let index = [];
  try {
    index = JSON.parse(localStorage.getItem(LS_TOKENS_INDEX) || '[]').filter((id) => String(id) !== String(chainId));
  } catch {
    index = [];
  }
  index.unshift(String(chainId));
  while (index.length > MAX_STORED_TOKEN_LISTS) {
    const old = index.pop();
    try {
      localStorage.removeItem(`${LS_TOKENS}${old}`);
    } catch {
      /* ignore */
    }
  }
  if (!writeLs(key, packTokens(tokens))) {
    // Quota: drop the other cached lists and try once more; memory cache still works either way.
    for (const id of index.slice(1)) {
      try {
        localStorage.removeItem(`${LS_TOKENS}${id}`);
      } catch {
        /* ignore */
      }
    }
    index = [String(chainId)];
    if (!writeLs(key, packTokens(tokens))) index = [];
  }
  try {
    localStorage.setItem(LS_TOKENS_INDEX, JSON.stringify(index));
  } catch {
    /* ignore */
  }
}

/** Every LI.FI token on one chain (thousands on big chains), cached for 6 hours. */
export async function fetchLifiTokens(chainId, { signal } = {}) {
  const id = String(chainId);
  const memKey = `tokens:${id}`;
  const hit = mem.get(memKey);
  if (hit && Date.now() - hit.t < TOKENS_TTL) return hit.d;
  const stored = readLs(`${LS_TOKENS}${id}`, TOKENS_TTL);
  if (stored?.length) {
    const tokens = unpackTokens(id, stored);
    mem.set(memKey, { t: Date.now(), d: tokens });
    return tokens;
  }
  return once(memKey, async () => {
    const body = await getJson(`${LIFI_BASE}/tokens?chains=${encodeURIComponent(id)}&chainTypes=${LIFI_CHAIN_TYPES.join(',')}`, { signal });
    const list = (body.tokens?.[id] || Object.values(body.tokens || {})[0] || []).map(normalizeToken);
    mem.set(memKey, { t: Date.now(), d: list });
    rememberTokenList(id, list);
    return list;
  });
}

/** One token by address (or symbol) via GET /v1/token — validates Custom / Import entries. */
export async function fetchLifiToken(chainId, tokenOrSymbol, { signal } = {}) {
  const q = String(tokenOrSymbol || '').trim();
  const memKey = `token:${chainId}:${q.toLowerCase()}`;
  const hit = mem.get(memKey);
  if (hit) return hit.d;
  const body = await getJson(`${LIFI_BASE}/token?chain=${encodeURIComponent(chainId)}&token=${encodeURIComponent(q)}`, { signal });
  const token = normalizeToken(body);
  mem.set(memKey, { t: Date.now(), d: token });
  return token;
}

/** EVM wallet balances on every LI.FI chain (GET /v1/wallets/{address}/balances), keyed by chainId. */
export async function fetchLifiWalletBalances(address, { signal } = {}) {
  const memKey = `bal:${String(address).toLowerCase()}`;
  const hit = mem.get(memKey);
  if (hit && Date.now() - hit.t < BALANCES_TTL) return hit.d;
  return once(memKey, async () => {
    const body = await getJson(`${LIFI_BASE}/wallets/${encodeURIComponent(address)}/balances`, { signal });
    const out = {};
    for (const [cid, list] of Object.entries(body.balances || {})) {
      out[cid] = (list || [])
        .filter((b) => b && b.amount && b.amount !== '0')
        .map((b) => ({ ...normalizeToken({ ...b, chainId: b.chainId ?? cid }), amount: String(b.amount) }));
    }
    mem.set(memKey, { t: Date.now(), d: out });
    return out;
  });
}

export function clearLifiBalanceCache() {
  for (const k of [...mem.keys()]) if (k.startsWith('bal:')) mem.delete(k);
}

function quoteParams(p) {
  const params = new URLSearchParams({
    fromChain: String(p.fromChain),
    toChain: String(p.toChain),
    fromToken: p.fromToken,
    toToken: p.toToken,
    fromAmount: String(p.fromAmount),
    fromAddress: p.fromAddress,
    slippage: String(p.slippage ?? 0.005),
    order: p.order || 'CHEAPEST',
  });
  if (p.toAddress) params.set('toAddress', p.toAddress);
  return params;
}

/**
 * GET /v1/quote (one ready-to-sign step: bridge + any swaps, with approval address, fees, gas and ETA).
 * Cross-chain quotes include the boing.finance platform fee.
 */
export async function fetchLifiQuote(p, { signal } = {}) {
  const params = quoteParams(p);
  const crossChain = String(p.fromChain) !== String(p.toChain);
  try {
    const res = await fetch(`${String(getApiUrl()).replace(/\/$/, '')}/aggregator/lifi/quote?${params}`, {
      signal,
      headers: { Accept: 'application/json' },
    });
    const body = await res.json().catch(() => null);
    // The Worker wraps LI.FI's answer: { success: true, data: step } or { success: false, lifi: true, status, error }.
    if (body?.success && body.data?.transactionRequest) return body.data;
    if (body && body.success === false && body.lifi) {
      const err = body.error || {};
      throw new LifiError(err.message || 'Quote failed', { status: body.status, code: err.code, body: err });
    }
  } catch (e) {
    if (e?.name === 'AbortError' || e instanceof LifiError) throw e;
    /* Worker unreachable: ask LI.FI directly below */
  }
  params.set('integrator', LIFI_INTEGRATOR);
  if (crossChain && PLATFORM_BRIDGE_FEE > 0) params.set('fee', String(PLATFORM_BRIDGE_FEE));
  return getJson(`${LIFI_BASE}/quote?${params}`, { signal });
}

/** GET /v1/status for a sent transfer. */
export async function fetchLifiStatus({ txHash, bridge, fromChain, toChain }, { signal } = {}) {
  const params = new URLSearchParams({ txHash });
  if (bridge) params.set('bridge', bridge);
  if (fromChain != null) params.set('fromChain', String(fromChain));
  if (toChain != null) params.set('toChain', String(toChain));
  try {
    return await getJson(`${LIFI_BASE}/status?${params}`, { signal });
  } catch (e) {
    // Right after sending, LI.FI may not have indexed the hash yet.
    if (e instanceof LifiError && (e.code === 1003 || e.status === 404)) return { status: 'NOT_FOUND' };
    throw e;
  }
}
