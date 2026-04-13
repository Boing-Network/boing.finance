/**
 * L1 JSON-RPC DEX discovery (`boing_listDexTokens`, `boing_listDexPools`) with graceful
 * degradation when `boing_rpcSupportedMethods` omits them or the node is older.
 */

import { BoingRpcError } from 'boing-sdk';
import { normalizeNativeVmTokenId32 } from './nativeVmTokenRegistry';

export const BOING_LIST_DEX_TOKENS = 'boing_listDexTokens';
export const BOING_LIST_DEX_POOLS = 'boing_listDexPools';

/**
 * @param {import('boing-sdk').BoingClient} client
 * @returns {Promise<string[]>}
 */
async function safeRpcSupportedMethods(client) {
  try {
    const m = await client.rpcSupportedMethods();
    return Array.isArray(m) ? m : [];
  } catch {
    return [];
  }
}

/**
 * @param {import('boing-sdk').BoingClient} client
 * @returns {Promise<string[]>}
 */
async function safeGetRpcMethodCatalogNames(client) {
  try {
    const c = await client.getRpcMethodCatalog();
    const arr = Array.isArray(c?.methods) ? c.methods : [];
    /** @type {string[]} */
    const out = [];
    for (const m of arr) {
      if (m && typeof m === 'object' && typeof m.name === 'string' && m.name.trim()) out.push(m.name.trim());
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * @param {import('boing-sdk').BoingClient} client
 * @returns {Promise<import('boing-sdk').BoingRpcPreflightResult | null>}
 */
async function safePreflightRpc(client) {
  try {
    return await client.preflightRpc();
  } catch {
    return null;
  }
}

/**
 * One-shot probe when the node does not advertise methods (empty list) or the list is unavailable.
 *
 * @param {import('boing-sdk').BoingClient} client
 * @param {'tokens' | 'pools'} kind
 */
async function probeDexDiscoveryMethod(client, kind) {
  try {
    if (kind === 'tokens') {
      await client.listDexTokensPage({ limit: 1, light: true });
    } else {
      await client.listDexPoolsPage({ limit: 1, light: true });
    }
    return true;
  } catch (e) {
    if (e instanceof BoingRpcError && e.code === -32601) return false;
    return false;
  }
}

/**
 * Resolve whether L1 DEX discovery RPCs exist by merging **`boing_rpcSupportedMethods`** and
 * **`boing_getRpcMethodCatalog`**, then probing only when both surfaces are empty.
 * Optional **`preflightRpc`** (env `REACT_APP_BOING_NATIVE_DEX_DISCOVERY_PREFLIGHT=1`) adds catalog
 * size / health metadata without changing the boolean flags.
 *
 * @param {import('boing-sdk').BoingClient} client
 * @returns {Promise<{
 *   methods: string[],
 *   catalogMethodNames: string[],
 *   listTokens: boolean,
 *   listPools: boolean,
 *   preflight: import('boing-sdk').BoingRpcPreflightResult | null,
 * }>}
 */
export async function resolveNativeDexL1DiscoveryCapabilities(client) {
  const wantPreflight = (process.env.REACT_APP_BOING_NATIVE_DEX_DISCOVERY_PREFLIGHT || '').trim() === '1';
  const [methods, catalogMethodNames, preflight] = await Promise.all([
    safeRpcSupportedMethods(client),
    safeGetRpcMethodCatalogNames(client),
    wantPreflight ? safePreflightRpc(client) : Promise.resolve(null),
  ]);

  /** @type {Set<string>} */
  const union = new Set();
  for (const m of methods) union.add(m);
  for (const m of catalogMethodNames) union.add(m);

  let listTokens = union.has(BOING_LIST_DEX_TOKENS);
  let listPools = union.has(BOING_LIST_DEX_POOLS);

  const ambiguous = methods.length === 0 && catalogMethodNames.length === 0;
  if (ambiguous) {
    if (!listTokens) listTokens = await probeDexDiscoveryMethod(client, 'tokens');
    if (!listPools) listPools = await probeDexDiscoveryMethod(client, 'pools');
  }

  return { methods, catalogMethodNames, listTokens, listPools, preflight };
}

function readOptionalLiquidityFilter() {
  const minLiq = (process.env.REACT_APP_BOING_NATIVE_DEX_DISCOVERY_MIN_LIQUIDITY_WEI || '').trim();
  const minProd = (process.env.REACT_APP_BOING_NATIVE_DEX_DISCOVERY_MIN_RESERVE_PRODUCT || '').trim();
  return {
    minLiquidityWei: minLiq || undefined,
    minReserveProduct: minProd || undefined,
  };
}

function readMaxPages() {
  const raw = (process.env.REACT_APP_BOING_NATIVE_DEX_DISCOVERY_MAX_PAGES || '').trim();
  const n = raw ? parseInt(raw, 10) : 100;
  if (!Number.isFinite(n) || n < 1) return 100;
  return Math.min(250, n);
}

/**
 * Cursor is opaque — forward `nextCursor` verbatim between pages.
 *
 * @param {import('boing-sdk').BoingClient} client
 * @param {{
 *   factory?: string,
 *   minLiquidityWei?: string,
 *   minReserveProduct?: string,
 *   maxPages?: number,
 * }} [opts]
 * @returns {Promise<import('boing-sdk').DexTokenListRow[]>}
 */
export async function collectAllDexTokensPagesL1(client, opts = {}) {
  const limit = 500;
  const maxPages = opts.maxPages ?? readMaxPages();
  const filters = readOptionalLiquidityFilter();
  /** @type {import('boing-sdk').DexTokenListRow[]} */
  const out = [];
  let cursor = null;
  for (let page = 0; page < maxPages; page += 1) {
    const pageRes = await client.listDexTokensPage({
      cursor,
      limit,
      light: true,
      enrich: false,
      factory: opts.factory,
      minLiquidityWei: opts.minLiquidityWei ?? filters.minLiquidityWei,
      minReserveProduct: opts.minReserveProduct ?? filters.minReserveProduct,
    });
    const rows = Array.isArray(pageRes.tokens) ? pageRes.tokens : [];
    for (const t of rows) out.push(t);
    const next = pageRes.nextCursor;
    if (!next || rows.length === 0) break;
    cursor = next;
  }
  return out;
}

/**
 * @param {import('boing-sdk').BoingClient} client
 * @param {{ factory?: string, maxPages?: number }} [opts]
 * @returns {Promise<import('boing-sdk').DexPoolListRow[]>}
 */
export async function collectAllDexPoolsPagesL1(client, opts = {}) {
  const limit = 500;
  const maxPages = opts.maxPages ?? readMaxPages();
  /** @type {import('boing-sdk').DexPoolListRow[]} */
  const out = [];
  let cursor = null;
  for (let page = 0; page < maxPages; page += 1) {
    const pageRes = await client.listDexPoolsPage({
      cursor,
      limit,
      light: true,
      enrich: false,
      factory: opts.factory,
    });
    const rows = Array.isArray(pageRes.pools) ? pageRes.pools : [];
    for (const p of rows) out.push(p);
    const next = pageRes.nextCursor;
    if (!next || rows.length === 0) break;
    cursor = next;
  }
  return out;
}

/**
 * @param {readonly import('boing-sdk').DexTokenListRow[]} rows
 * @returns {Array<{ id: string, symbol: string, name: string, decimals?: number }>}
 */
export function dexTokenListRowsToPickerEntries(rows) {
  if (!Array.isArray(rows)) return [];
  /** @type {Array<{ id: string, symbol: string, name: string, decimals?: number }>} */
  const out = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const id = normalizeNativeVmTokenId32(String(row.id || ''));
    if (!id) continue;
    const symbol = String(row.symbol || '').trim().slice(0, 16) || `${id.slice(0, 8)}…${id.slice(-4)}`;
    const name = String(row.name || '').trim().slice(0, 80) || symbol;
    /** @type {{ id: string, symbol: string, name: string, decimals?: number }} */
    const e = { id, symbol, name };
    if (typeof row.decimals === 'number' && Number.isFinite(row.decimals)) e.decimals = row.decimals;
    out.push(e);
  }
  return out;
}

/**
 * @param {readonly import('boing-sdk').DexPoolListRow[]} rows
 * @returns {Array<{ poolHex: string, tokenAHex: string, tokenBHex: string }>}
 */
export function dexPoolListRowsToPoolTokenRows(rows) {
  if (!Array.isArray(rows)) return [];
  /** @type {Array<{ poolHex: string, tokenAHex: string, tokenBHex: string }>} */
  const out = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const poolHex = normalizeNativeVmTokenId32(String(row.poolHex || ''));
    const tokenAHex = normalizeNativeVmTokenId32(String(row.tokenAHex || ''));
    const tokenBHex = normalizeNativeVmTokenId32(String(row.tokenBHex || ''));
    if (!poolHex || !tokenAHex || !tokenBHex) continue;
    out.push({ poolHex, tokenAHex, tokenBHex });
  }
  return out;
}

/**
 * Merge **`tokenADecimals` / `tokenBDecimals`** from **`boing_listDexPools`** rows onto hydrated venues
 * (SDK **`CpPoolVenue`** allows extra fields at runtime).
 *
 * @param {readonly import('boing-sdk').CpPoolVenue[]} venues
 * @param {readonly import('boing-sdk').DexPoolListRow[]} dexPoolRows
 * @returns {import('boing-sdk').CpPoolVenue[]}
 */
export function attachDexPoolDecimalsToVenues(venues, dexPoolRows) {
  if (!Array.isArray(venues) || venues.length === 0) return [...venues];
  if (!Array.isArray(dexPoolRows) || dexPoolRows.length === 0) return [...venues];

  /** @type {Map<string, { tokenADecimals?: number, tokenBDecimals?: number }>} */
  const byPool = new Map();
  for (const row of dexPoolRows) {
    if (!row || typeof row !== 'object') continue;
    const poolHex = normalizeNativeVmTokenId32(String(row.poolHex || ''));
    if (!poolHex) continue;
    const a = typeof row.tokenADecimals === 'number' && Number.isFinite(row.tokenADecimals) ? row.tokenADecimals : null;
    const b = typeof row.tokenBDecimals === 'number' && Number.isFinite(row.tokenBDecimals) ? row.tokenBDecimals : null;
    if (a == null && b == null) continue;
    /** @type {{ tokenADecimals?: number, tokenBDecimals?: number }} */
    const patch = {};
    if (a != null) patch.tokenADecimals = a;
    if (b != null) patch.tokenBDecimals = b;
    byPool.set(poolHex.toLowerCase(), patch);
  }
  if (byPool.size === 0) return [...venues];

  return venues.map((v) => {
    const key = (v.poolHex || '').trim().toLowerCase();
    const d = byPool.get(key);
    if (!d) return v;
    return { ...v, ...d };
  });
}
