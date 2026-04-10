/**
 * Optional CoinGecko-backed USD per raw pool unit for native VM tokens (operator maps 32-byte ids → coin ids).
 * Uses existing `REACT_APP_COINGECKO_API_KEY` when set. Complements static `REACT_APP_BOING_NATIVE_DEX_TOKEN_USD_JSON`.
 */

import coingeckoService from './coingeckoService';

/**
 * @typedef {{ coingeckoId: string, decimals: number }} OracleTokenConfig
 */

/**
 * Parse `REACT_APP_BOING_NATIVE_DEX_ORACLE_MAP_JSON`:
 * `{ "0x…token64…": { "coingeckoId": "ethereum", "decimals": 18 }, … }`
 * `decimals`: CG price is per 1 whole coin; divide by 10**decimals to price one atomic ledger unit.
 *
 * @returns {{ byToken: Map<string, OracleTokenConfig> }}
 */
export function loadNativeDexOracleMap() {
  const raw = (process.env.REACT_APP_BOING_NATIVE_DEX_ORACLE_MAP_JSON || '').trim();
  const byToken = new Map();
  if (!raw) return { byToken };
  try {
    const o = JSON.parse(raw);
    if (!o || typeof o !== 'object') return { byToken };
    for (const [key, val] of Object.entries(o)) {
      const k = key.trim().toLowerCase();
      if (k === 'note' || k === 'comment') continue;
      if (!/^0x[0-9a-f]{64}$/i.test(k)) continue;
      const norm = `0x${k.slice(2).toLowerCase()}`;
      let coingeckoId = '';
      let decimals = 0;
      if (typeof val === 'string' && val.trim()) {
        coingeckoId = val.trim().toLowerCase();
      } else if (val && typeof val === 'object') {
        const idRaw = /** @type {{ coingeckoId?: unknown, id?: unknown }} */ (val).coingeckoId ?? /** @type {{ id?: unknown }} */ (val).id;
        coingeckoId = typeof idRaw === 'string' ? idRaw.trim().toLowerCase() : '';
        const d = /** @type {{ decimals?: unknown }} */ (val).decimals;
        if (d != null && Number.isFinite(Number(d))) decimals = Math.max(0, Math.min(36, Math.floor(Number(d))));
      }
      if (!coingeckoId) continue;
      byToken.set(norm, { coingeckoId, decimals });
    }
  } catch {
    /* ignore */
  }
  return { byToken };
}

/**
 * @param {Iterable<string>} tokenHexesLowerOrMixed — normalized inside
 * @param {{ byToken: Map<string, OracleTokenConfig> }} oracleMap
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Record<string, string>>} token id (0x lower) → USD per atomic unit as string
 */
export async function fetchOracleUsdPerUnitMap(tokenHexes, oracleMap, options = {}) {
  /** @type {Record<string, string>} */
  const out = {};
  const { byToken } = oracleMap;
  if (!byToken.size) return out;

  /** @type {Map<string, Set<string>>} */
  const cgIdToTokens = new Map();
  for (const raw of tokenHexes) {
    if (options.signal?.aborted) return out;
    const k = (raw || '').trim().toLowerCase();
    const norm = k.startsWith('0x') && k.length === 66 ? k : null;
    if (!norm) continue;
    const cfg = byToken.get(norm);
    if (!cfg) continue;
    if (!cgIdToTokens.has(cfg.coingeckoId)) cgIdToTokens.set(cfg.coingeckoId, new Set());
    cgIdToTokens.get(cfg.coingeckoId).add(norm);
  }

  const ids = [...cgIdToTokens.keys()];
  if (ids.length === 0) return out;

  const prices = await coingeckoService.getSimplePrices(ids);
  if (options.signal?.aborted) return out;

  for (const [cgId, tokenSet] of cgIdToTokens) {
    const row = prices[cgId];
    const usd = row && typeof row.usd === 'number' && Number.isFinite(row.usd) ? row.usd : null;
    if (usd == null) continue;
    for (const tokenHex of tokenSet) {
      const cfg = byToken.get(tokenHex);
      if (!cfg) continue;
      const perUnit = cfg.decimals > 0 ? usd / 10 ** cfg.decimals : usd;
      if (!Number.isFinite(perUnit)) continue;
      out[tokenHex] = String(perUnit);
    }
  }
  return out;
}
