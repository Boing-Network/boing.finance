/**
 * Token display labels (symbol / name) for 32-byte Boing token ids, shared by Create Pool, Liquidity and Pools.
 * Sources, in order: native-token config + canonical testnet tokens, the curated / env token list, tokens the
 * user saved or deployed on this browser, directory / indexer rows, then on-chain `boing_getDexToken` metadata.
 * Resolved RPC metadata is cached in memory and in localStorage (misses are cached briefly to avoid hammering RPC).
 */
import { KNOWN_BOING_TOKENS } from './boingSwapQuote';
import {
  getCuratedNativeVmTokens,
  loadCustomNativeVmTokens,
  loadLocalDeployNativeVmTokens,
  normalizeNativeVmTokenId32,
} from './nativeVmTokenRegistry';
import { loadCustodyTokenMetadata } from './nativeDexCustodySwap';

const CACHE_KEY = 'boing_token_labels_cache_v1';
const HIT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MISS_TTL_MS = 5 * 60 * 1000;

/** Shortened address for when no metadata exists: `0x6676f9\u2026a75e93`. */
export function shortTokenId(h) {
  if (!h || typeof h !== 'string') return '\u2014';
  const t = h.trim();
  if (t.length < 18) return t || '\u2014';
  return `${t.slice(0, 8)}\u2026${t.slice(-6)}`;
}

/** Labels that are really hex placeholders ("0x6676\u2026", "From pool (0x\u2026)") are not names. */
function clean(v) {
  const t = typeof v === 'string' ? v.trim() : '';
  if (!t || /0x[0-9a-f]{4,}/i.test(t) || /^[0-9a-f]{16,}$/i.test(t)) return '';
  if (/^(token|unlisted token|recently used|from indexer|saved token|my token|custom)$/i.test(t)) return '';
  return t;
}

/** @type {Map<string, { symbol: string, name: string, at: number, miss?: boolean }>} */
let mem = null;
function cache() {
  if (mem) return mem;
  mem = new Map();
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(CACHE_KEY) : null;
    const obj = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    for (const [id, v] of Object.entries(obj || {})) {
      if (v && typeof v === 'object' && now - Number(v.at || 0) < HIT_TTL_MS) mem.set(id, v);
    }
  } catch {
    /* ignore */
  }
  return mem;
}
function persist() {
  try {
    const obj = {};
    for (const [id, v] of cache()) if (!v.miss) obj[id] = v;
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch {
    /* ignore quota */
  }
}

/**
 * Best label from local sources only (no RPC).
 * @param {string} rawId
 * @param {Array<{ id: string, symbol?: string, name?: string }>} [directory] extra rows (venues, indexer)
 * @returns {{ id: string, symbol: string, name: string, resolved: boolean, native?: boolean }}
 */
export function resolveTokenLabelLocal(rawId, directory = []) {
  const id = normalizeNativeVmTokenId32(rawId || '') || String(rawId || '').trim().toLowerCase();
  const known = KNOWN_BOING_TOKENS[id];
  if (known) return { id, symbol: known.symbol, name: known.name, resolved: true, native: Boolean(known.native) };
  const lists = [];
  try {
    lists.push(loadCustomNativeVmTokens(), loadLocalDeployNativeVmTokens());
  } catch {
    /* no storage */
  }
  lists.push(directory || [], getCuratedNativeVmTokens());
  for (const list of lists) {
    for (const e of list) {
      if (!e?.id || String(e.id).toLowerCase() !== id) continue;
      const symbol = clean(e.symbol);
      if (symbol) return { id, symbol, name: clean(e.name) || symbol, resolved: true };
    }
  }
  const c = cache().get(id);
  if (c && !c.miss && clean(c.symbol)) return { id, symbol: c.symbol, name: clean(c.name) || c.symbol, resolved: true };
  return { id, symbol: shortTokenId(id), name: '', resolved: false };
}

/** Ids that still need an RPC lookup (no local label and not a recent cached miss). */
export function tokenIdsNeedingLookup(ids, directory = []) {
  const now = Date.now();
  const out = new Set();
  for (const raw of ids || []) {
    const id = normalizeNativeVmTokenId32(raw || '');
    if (!id) continue;
    if (resolveTokenLabelLocal(id, directory).resolved) continue;
    const c = cache().get(id);
    if (c?.miss && now - c.at < MISS_TTL_MS) continue;
    out.add(id);
  }
  return [...out];
}

/** @type {Map<string, Promise<void>>} */
const inflight = new Map();

/**
 * Fetch on-chain metadata for `ids` and cache it.
 * @param {import('@boing-network/boing-sdk').BoingClient} client
 * @param {string[]} ids
 */
export async function fetchTokenLabels(client, ids) {
  const todo = (ids || []).filter((id) => !inflight.has(id));
  if (todo.length > 0) {
    const p = (async () => {
      let rows = [];
      try {
        rows = await loadCustodyTokenMetadata(client, todo);
      } catch {
        rows = [];
      }
      const now = Date.now();
      const got = new Set();
      for (const r of rows) {
        const id = normalizeNativeVmTokenId32(r.id);
        const symbol = clean(r.symbol);
        if (!id || !symbol) continue;
        got.add(id);
        cache().set(id, { symbol: symbol.slice(0, 16), name: (clean(r.name) || symbol).slice(0, 80), at: now });
      }
      for (const id of todo) if (!got.has(id)) cache().set(id, { symbol: '', name: '', at: now, miss: true });
      persist();
    })();
    for (const id of todo) inflight.set(id, p);
    p.finally(() => {
      for (const id of todo) inflight.delete(id);
    });
  }
  await Promise.all((ids || []).map((id) => inflight.get(id)).filter(Boolean));
}
