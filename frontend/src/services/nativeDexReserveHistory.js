/**
 * Client-side reserve time series (localStorage) — Uniswap-style “your visits” history until an indexer serves real TVL charts.
 */

const STORAGE_KEY = 'boing_native_dex_reserve_hist_v1';
const MAX_PER_POOL = 160;

/**
 * Background reserve sampling interval (ms). 0 = disabled. Min 10s, max 1h — protects public RPCs.
 */
export function getReserveSamplingIntervalMs() {
  const raw = (process.env.REACT_APP_BOING_NATIVE_DEX_RESERVE_SAMPLE_MS || '').trim();
  if (raw === '' || raw === '0' || raw.toLowerCase() === 'off') return 0;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 10_000) return 0;
  return Math.min(n, 3_600_000);
}

/**
 * @param {import('boing-sdk').CpPoolVenue[]} venues
 */
export function appendReserveHistorySamples(venues) {
  if (!Array.isArray(venues) || venues.length === 0) return;
  /** @type {{ pools: Record<string, Array<{ ts: number, ra: string, rb: string }>>, updatedAt: number }} */
  let doc = { pools: {}, updatedAt: Date.now() };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && typeof p === 'object' && p.pools && typeof p.pools === 'object') {
        doc = { pools: { ...p.pools }, updatedAt: Date.now() };
      }
    }
  } catch {
    doc = { pools: {}, updatedAt: Date.now() };
  }

  const ts = Date.now();
  for (const v of venues) {
    const k = (v.poolHex || '').toLowerCase();
    if (!k) continue;
    const ra = v.reserveA?.toString?.() ?? String(v.reserveA);
    const rb = v.reserveB?.toString?.() ?? String(v.reserveB);
    const arr = Array.isArray(doc.pools[k]) ? [...doc.pools[k]] : [];
    const last = arr[arr.length - 1];
    if (last && last.ra === ra && last.rb === rb) continue;
    arr.push({ ts, ra, rb });
    doc.pools[k] = arr.slice(-MAX_PER_POOL);
  }
  doc.updatedAt = ts;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
  } catch {
    /* quota */
  }
}

/**
 * @param {string} poolHex
 * @returns {Array<{ ts: number, ra: string, rb: string }>}
 */
export function readReserveHistoryForPool(poolHex) {
  const k = (poolHex || '').trim().toLowerCase();
  if (!k) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const doc = JSON.parse(raw);
    const arr = doc?.pools?.[k];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/**
 * Merge points from remote indexer payload: `history: { poolHex: [{ t, ra, rb }] }` (t = ms or ISO string).
 *
 * @param {unknown} remotePayload
 * @param {string} poolHex
 * @returns {Array<{ ts: number, ra: string, rb: string }>}
 */
export function historyPointsFromRemoteIndexer(remotePayload, poolHex) {
  if (!remotePayload || typeof remotePayload !== 'object') return [];
  const h = /** @type {Record<string, unknown>} */ (remotePayload).history;
  if (!h || typeof h !== 'object') return [];
  const k = poolHex.trim().toLowerCase();
  const rows = /** @type {unknown} */ (h)[k] ?? /** @type {unknown} */ (h)[poolHex.trim()];
  if (!Array.isArray(rows)) return [];
  /** @type {Array<{ ts: number, ra: string, rb: string }>} */
  const out = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const tRaw = /** @type {{ t?: unknown, ts?: unknown, ra?: unknown, rb?: unknown }} */ (row).t ??
      /** @type {{ t?: unknown, ts?: unknown }} */ (row).ts;
    let ts = 0;
    if (typeof tRaw === 'number' && Number.isFinite(tRaw)) ts = tRaw;
    else if (typeof tRaw === 'string') {
      const d = Date.parse(tRaw);
      ts = Number.isFinite(d) ? d : 0;
    }
    const ra = String(/** @type {{ ra?: unknown }} */ (row).ra ?? '');
    const rb = String(/** @type {{ rb?: unknown }} */ (row).rb ?? '');
    if (!ra || !rb) continue;
    out.push({ ts: ts || Date.now(), ra, rb });
  }
  return out.sort((a, b) => a.ts - b.ts).slice(-MAX_PER_POOL);
}
