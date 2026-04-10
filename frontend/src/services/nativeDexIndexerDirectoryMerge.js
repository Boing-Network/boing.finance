/**
 * Optional merge: Worker D1 directory pools + remote indexer JSON (same row shape), keyed by poolHex.
 * See boing.network docs/HANDOFF_BOING_FINANCE_NATIVE_DEX_AND_DIRECTORY.md
 */

import { collectAllNativeDexDirectoryPools } from './nativeDexDirectoryPoolsCollect';

const DEFAULT_MAX_DIRECTORY_POOLS = 2000;

function normPoolHex(h) {
  const t = String(h || '').trim().toLowerCase();
  return /^0x[0-9a-f]{64}$/.test(t) ? t : '';
}

/**
 * @param {unknown} remotePayload — indexer GET JSON or null
 * @param {string} directoryBaseUrl — Worker origin (no path)
 * @returns {Promise<unknown>}
 */
export async function mergeRemoteIndexerWithDirectoryPools(remotePayload, directoryBaseUrl) {
  const base = String(directoryBaseUrl || '').trim().replace(/\/+$/, '');
  if (!base) return remotePayload;

  let dirPools;
  try {
    const maxRaw = (process.env.REACT_APP_BOING_NATIVE_DEX_DIRECTORY_MAX_POOLS || '').trim();
    const maxPools = maxRaw ? Math.min(50_000, Math.max(1, parseInt(maxRaw, 10) || DEFAULT_MAX_DIRECTORY_POOLS)) : DEFAULT_MAX_DIRECTORY_POOLS;
    dirPools = await collectAllNativeDexDirectoryPools(base, {
      pageLimit: 100,
      maxPools,
    });
  } catch {
    return remotePayload;
  }

  if (!Array.isArray(dirPools) || dirPools.length === 0) {
    return remotePayload;
  }

  /** @type {Map<string, Record<string, unknown>>} */
  const byId = new Map();
  for (const p of dirPools) {
    if (!p || typeof p !== 'object') continue;
    const id = normPoolHex(/** @type {{ poolHex?: string }} */ (p).poolHex);
    if (!id) continue;
    byId.set(id, { ...p });
  }

  const prev = remotePayload && typeof remotePayload === 'object' ? remotePayload : null;
  const indexerPools = prev && Array.isArray(prev.pools) ? prev.pools : [];

  for (const row of indexerPools) {
    if (!row || typeof row !== 'object') continue;
    const id = normPoolHex(/** @type {{ poolHex?: string }} */ (row).poolHex);
    if (!id) continue;
    const baseRow = byId.get(id) || {};
    byId.set(id, { ...baseRow, ...row });
  }

  const mergedPools = [...byId.values()].sort((a, b) =>
    String(a.poolHex || '').localeCompare(String(b.poolHex || ''))
  );

  if (!prev) {
    return {
      updatedAt: new Date().toISOString(),
      note: 'native DEX directory API (+ no indexer URL — pools only)',
      pools: mergedPools,
      history: {},
      tokenDirectory: [],
    };
  }

  return {
    ...prev,
    pools: mergedPools,
  };
}
