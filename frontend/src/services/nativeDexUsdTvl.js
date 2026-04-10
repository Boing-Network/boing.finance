/**
 * Rough USD TVL from static token-unit prices (env JSON). No oracle — operators curate for testnet demos.
 */

/**
 * @returns {Record<string, string>} lowercased token id -> USD per 1 full integer pool unit
 */
/**
 * Layer maps: later entries override earlier for the same token key (0x + 64 hex lower).
 *
 * @param {...Record<string, string>} maps
 * @returns {Record<string, string>}
 */
export function mergeTokenUsdMaps(...maps) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const m of maps) {
    if (!m || typeof m !== 'object') continue;
    for (const [k, v] of Object.entries(m)) {
      if (typeof k !== 'string' || k.trim() === '') continue;
      const key = k.trim().toLowerCase();
      if (key === 'default' || key === 'defaulta' || key === 'defaultb') {
        out[key] = String(v);
        continue;
      }
      if (!/^0x[0-9a-f]{64}$/i.test(key)) continue;
      out[`0x${key.slice(2).toLowerCase()}`] = String(v);
    }
  }
  return out;
}

export function loadTokenUsdPerUnitMap() {
  const raw = (process.env.REACT_APP_BOING_NATIVE_DEX_TOKEN_USD_JSON || '').trim();
  if (!raw) return {};
  try {
    const o = JSON.parse(raw);
    if (!o || typeof o !== 'object') return {};
    /** @type {Record<string, string>} */
    const out = {};
    for (const [key, val] of Object.entries(o)) {
      if (typeof key !== 'string' || key.trim() === '') continue;
      const k = key.trim().toLowerCase();
      if (k === 'default' || k === 'defaulta' || k === 'defaultb') {
        out[k] = String(val);
        continue;
      }
      if (!/^0x[0-9a-f]{64}$/i.test(k)) continue;
      out[`0x${k.slice(2).toLowerCase()}`] = String(val);
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * @param {string} tokenAHex
 * @param {string} tokenBHex
 * @param {bigint | string | number} reserveA
 * @param {bigint | string | number} reserveB
 * @param {Record<string, string>} usdMap
 * @returns {{ tvlUsd: number | null, note: string | null }}
 */
export function estimatePoolTvlUsd(tokenAHex, tokenBHex, reserveA, reserveB, usdMap) {
  const keys = Object.keys(usdMap);
  if (keys.length === 0) {
    return { tvlUsd: null, note: null };
  }
  const pa = usdMap[tokenAHex.trim().toLowerCase()] ?? usdMap.defaulta ?? usdMap.default ?? null;
  const pb = usdMap[tokenBHex.trim().toLowerCase()] ?? usdMap.defaultb ?? usdMap.default ?? null;
  if (pa == null && pb == null) {
    return { tvlUsd: null, note: 'No USD price for these token ids in REACT_APP_BOING_NATIVE_DEX_TOKEN_USD_JSON' };
  }
  try {
    const ra = Number(BigInt(reserveA));
    const rb = Number(BigInt(reserveB));
    const fa = pa != null ? parseFloat(String(pa)) : 0;
    const fb = pb != null ? parseFloat(String(pb)) : 0;
    if (!Number.isFinite(ra) || !Number.isFinite(rb) || !Number.isFinite(fa) || !Number.isFinite(fb)) {
      return { tvlUsd: null, note: 'Non-finite USD or reserve conversion' };
    }
    const partA = pa != null ? ra * fa : 0;
    const partB = pb != null ? rb * fb : 0;
    const tvl = partA + partB;
    if (!Number.isFinite(tvl)) return { tvlUsd: null, note: null };
    return { tvlUsd: tvl, note: null };
  } catch {
    return { tvlUsd: null, note: 'Reserve or price parse error' };
  }
}
