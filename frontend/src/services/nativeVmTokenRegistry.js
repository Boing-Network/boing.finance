import { SYNTHETIC_NATIVE_CP_TOKEN_A_HEX, SYNTHETIC_NATIVE_CP_TOKEN_B_HEX } from './boingNativePoolTokens';

const RECENT_KEY = 'boing_native_vm_tokens_recent_v1';
const CUSTOM_KEY = 'boing_native_vm_tokens_custom_v1';
const MAX_RECENT = 10;

/**
 * @param {string} raw
 * @returns {string | null} normalized `0x` + 64 hex or null
 */
export function normalizeNativeVmTokenId32(raw) {
  const t = (raw || '').trim();
  if (!t) return null;
  const body = t.startsWith('0x') || t.startsWith('0X') ? t.slice(2) : t;
  if (!/^[0-9a-fA-F]{64}$/.test(body)) return null;
  return `0x${body.toLowerCase()}`;
}

/**
 * @typedef {{ id: string, symbol: string, name: string, coingeckoId?: string }} NativeVmTokenEntry
 */

function parseEnvTokenListJson() {
  const raw = (process.env.REACT_APP_BOING_NATIVE_DEX_TOKEN_LIST_JSON || '').trim();
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    /** @type {NativeVmTokenEntry[]} */
    const out = [];
    for (const row of arr) {
      if (!row || typeof row !== 'object') continue;
      const id = normalizeNativeVmTokenId32(String(row.id || row.address || ''));
      if (!id) continue;
      const symbol = String(row.symbol || row.ticker || 'TOKEN').slice(0, 16);
      const name = String(row.name || row.label || symbol).slice(0, 80);
      const cgRaw = /** @type {{ coingeckoId?: unknown }} */ (row).coingeckoId;
      const coingeckoId =
        typeof cgRaw === 'string' && cgRaw.trim() ? cgRaw.trim().toLowerCase().slice(0, 64) : undefined;
      /** @type {NativeVmTokenEntry} */
      const entry = { id, symbol, name };
      if (coingeckoId) entry.coingeckoId = coingeckoId;
      out.push(entry);
    }
    return out;
  } catch {
    return [];
  }
}

/** Curated defaults + optional operator token list from env. */
export function getCuratedNativeVmTokens() {
  /** @type {NativeVmTokenEntry[]} */
  const base = [
    {
      id: SYNTHETIC_NATIVE_CP_TOKEN_A_HEX,
      symbol: 'CP-A',
      name: 'Default CP pool leg A (synthetic id when unset on-chain)',
    },
    {
      id: SYNTHETIC_NATIVE_CP_TOKEN_B_HEX,
      symbol: 'CP-B',
      name: 'Default CP pool leg B (synthetic id when unset on-chain)',
    },
  ];
  const fromEnv = parseEnvTokenListJson();
  const byId = new Map();
  for (const e of [...base, ...fromEnv]) {
    byId.set(e.id.toLowerCase(), e);
  }
  return [...byId.values()];
}

/**
 * @param {import('boing-sdk').CpPoolVenue[]} venues
 * @returns {NativeVmTokenEntry[]}
 */
export function venueTokensToPickerEntries(venues) {
  if (!Array.isArray(venues)) return [];
  const byId = new Map();
  for (const v of venues) {
    for (const hex of [v.tokenAHex, v.tokenBHex]) {
      const id = normalizeNativeVmTokenId32(hex);
      if (!id || byId.has(id)) continue;
      const short = `${id.slice(0, 8)}…${id.slice(-4)}`;
      byId.set(id, { id, symbol: short, name: `From pool directory (${short})` });
    }
  }
  return [...byId.values()];
}

export function loadRecentNativeVmTokens() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => normalizeNativeVmTokenId32(String(x))).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * @param {string} hex32
 */
export function pushRecentNativeVmToken(hex32) {
  const id = normalizeNativeVmTokenId32(hex32);
  if (!id) return;
  const prev = loadRecentNativeVmTokens().filter((h) => h !== id);
  const next = [id, ...prev].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}

export function loadCustomNativeVmTokens() {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    /** @type {NativeVmTokenEntry[]} */
    const out = [];
    for (const row of arr) {
      if (!row || typeof row !== 'object') continue;
      const id = normalizeNativeVmTokenId32(String(row.id || ''));
      if (!id) continue;
      const symbol = String(row.symbol || 'CUSTOM').slice(0, 16);
      const name = String(row.name || 'My token').slice(0, 80);
      out.push({ id, symbol, name });
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * @param {NativeVmTokenEntry} entry
 */
export function saveCustomNativeVmToken(entry) {
  const id = normalizeNativeVmTokenId32(entry.id);
  if (!id) return false;
  const normalized = {
    id,
    symbol: String(entry.symbol || 'CUSTOM').slice(0, 16),
    name: String(entry.name || 'My token').slice(0, 80),
  };
  const prev = loadCustomNativeVmTokens().filter((e) => e.id !== id);
  prev.unshift(normalized);
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(prev.slice(0, 48)));
    return true;
  } catch {
    return false;
  }
}
