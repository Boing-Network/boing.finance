/**
 * Optional first-party / subgraph-like stats URL + local reserve snapshots for Uniswap-style “activity” hints.
 */

/**
 * @param {unknown} remotePayload
 * @returns {Array<{ id: string, symbol: string, name: string }>}
 */
export function extractTokenDirectoryFromIndexer(remotePayload) {
  if (!remotePayload || typeof remotePayload !== 'object') return [];
  const td = /** @type {{ tokenDirectory?: unknown }} */ (remotePayload).tokenDirectory;
  if (!Array.isArray(td)) return [];
  /** @type {Array<{ id: string, symbol: string, name: string }>} */
  const out = [];
  for (const row of td) {
    if (!row || typeof row !== 'object') continue;
    const idRaw = /** @type {{ id?: unknown, address?: unknown }} */ (row).id ?? /** @type {{ address?: unknown }} */ (row).address;
    if (typeof idRaw !== 'string') continue;
    const t = idRaw.trim();
    if (!/^0x[0-9a-fA-F]{64}$/i.test(t)) continue;
    const id = `0x${t.slice(2).toLowerCase()}`;
    const symbol = String(/** @type {{ symbol?: unknown }} */ (row).symbol || '').slice(0, 16) || `${id.slice(0, 8)}…`;
    const name = String(/** @type {{ name?: unknown }} */ (row).name || '').slice(0, 80) || symbol;
    out.push({ id, symbol, name });
  }
  return out;
}

const LOCAL_SNAPSHOT_KEY = 'boing_native_dex_reserve_snap_v1';

/**
 * @typedef {{
 *   updatedAt?: string,
 *   tokenDirectory?: Array<{ id?: string, address?: string, symbol?: string, name?: string }>,
 *   pools?: Array<{
 *     poolHex?: string,
 *     swapCount?: string | number,
 *     swapCount24h?: string | number,
 *     swaps24h?: string | number,
 *     volume24hApprox?: string,
 *     volumeScanWindowApprox?: string,
 *     tvlApprox?: string,
 *     tvlUsdApprox?: string,
 *     note?: string,
 *   }>,
 *   note?: string,
 * }} RemoteDexIndexerPayload
 */

/**
 * @returns {Promise<RemoteDexIndexerPayload | null>}
 */
export async function fetchRemoteDexIndexerStats() {
  const raw = (process.env.REACT_APP_BOING_NATIVE_DEX_INDEXER_STATS_URL || '').trim();
  if (!raw) return null;
  try {
    const res = await fetch(raw, { method: 'GET', credentials: 'omit' });
    if (!res.ok) return null;
    const j = await res.json();
    return j && typeof j === 'object' ? j : null;
  } catch {
    return null;
  }
}

/**
 * @param {import('boing-sdk').CpPoolVenue[]} venues
 * @returns {Record<string, { activityScore: string, hadPrior: boolean }>}
 */
export function updateLocalReserveSnapshotsAndScore(venues) {
  /** @type {Record<string, { activityScore: string, hadPrior: boolean }>} */
  const scores = {};
  if (!Array.isArray(venues) || venues.length === 0) return scores;

  let prev = null;
  try {
    prev = JSON.parse(localStorage.getItem(LOCAL_SNAPSHOT_KEY) || 'null');
  } catch {
    prev = null;
  }

  const now = Date.now();
  /** @type {Record<string, { ra: string, rb: string }>} */
  const nextPools = {};

  for (const v of venues) {
    const id = (v.poolHex || '').toLowerCase();
    if (!id) continue;
    const ra = v.reserveA?.toString?.() ?? String(v.reserveA);
    const rb = v.reserveB?.toString?.() ?? String(v.reserveB);
    nextPools[id] = { ra, rb };

    const prior = prev?.pools?.[id];
    if (prior && prior.ra != null && prior.rb != null) {
      try {
        const a0 = BigInt(prior.ra);
        const b0 = BigInt(prior.rb);
        const a1 = BigInt(ra);
        const b1 = BigInt(rb);
        const d = (a1 > a0 ? a1 - a0 : a0 - a1) + (b1 > b0 ? b1 - b0 : b0 - b1);
        scores[id] = { activityScore: d.toString(), hadPrior: true };
      } catch {
        scores[id] = { activityScore: '0', hadPrior: true };
      }
    } else {
      scores[id] = { activityScore: '0', hadPrior: false };
    }
  }

  try {
    localStorage.setItem(
      LOCAL_SNAPSHOT_KEY,
      JSON.stringify({
        savedAt: now,
        pools: nextPools,
      })
    );
  } catch {
    /* quota */
  }

  return scores;
}
