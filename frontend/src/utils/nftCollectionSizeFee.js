/**
 * Future-mint fee reference for the Large-set (CSV) Create NFT wizard.
 * Piecewise-linear between historical preset tiers so arbitrary sizes (1–10k)
 * still get a sensible estimate.
 *
 * Max must stay aligned with `NFT_LARGE_SET_MAX_ROWS` in `config/nftUploadLimits.js`.
 */

export const NFT_COLLECTION_SIZE_MIN = 1;
export const NFT_COLLECTION_SIZE_MAX = 10000;

/** Historical dropdown tiers — keep as interpolation anchors. */
export const NFT_COLLECTION_FEE_TIERS = [
  { size: 100, feeEth: 0.001, feeBoing: 1 },
  { size: 500, feeEth: 0.003, feeBoing: 2 },
  { size: 1000, feeEth: 0.01, feeBoing: 5 },
  { size: 5000, feeEth: 0.03, feeBoing: 15 },
  { size: 10000, feeEth: 0.05, feeBoing: 50 },
];

function clampSize(n) {
  const size = Math.floor(Number(n));
  if (!Number.isFinite(size)) return NFT_COLLECTION_SIZE_MIN;
  return Math.min(NFT_COLLECTION_SIZE_MAX, Math.max(NFT_COLLECTION_SIZE_MIN, size));
}

function interpolateFee(size, key) {
  const s = clampSize(size);
  const tiers = NFT_COLLECTION_FEE_TIERS;
  if (s <= tiers[0].size) {
    // Scale from 0 → first tier so size 1 is a tiny fraction of the 100-NFT fee.
    return (tiers[0][key] * s) / tiers[0].size;
  }
  for (let i = 0; i < tiers.length - 1; i++) {
    const a = tiers[i];
    const b = tiers[i + 1];
    if (s <= b.size) {
      const t = (s - a.size) / (b.size - a.size);
      return a[key] + t * (b[key] - a[key]);
    }
  }
  return tiers[tiers.length - 1][key];
}

/** Format a fee amount for display (trim trailing zeros). */
export function formatNftFeeAmount(n, { maxDecimals = 6 } = {}) {
  if (!Number.isFinite(n)) return '0';
  if (n >= 1) {
    const rounded = Math.round(n * 1000) / 1000;
    return String(rounded);
  }
  const fixed = n.toFixed(maxDecimals).replace(/\.?0+$/, '');
  return fixed || '0';
}

/**
 * @param {number|null|undefined} chainId
 * @param {number} collectionSize
 * @param {number} boingNativeChainId
 * @returns {string} human-readable fee amount (BOING or ETH units)
 */
export function getNftDynamicFeeAmount(chainId, collectionSize, boingNativeChainId) {
  const key = chainId === boingNativeChainId ? 'feeBoing' : 'feeEth';
  const raw = interpolateFee(collectionSize, key);
  return formatNftFeeAmount(raw, { maxDecimals: key === 'feeEth' ? 6 : 4 });
}

/**
 * Parse and clamp a collection-size field value.
 * @returns {{ ok: true, value: number } | { ok: false, value: number|null, error: string }}
 */
export function parseCollectionSizeInput(raw) {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) {
    return { ok: false, value: null, error: `Enter a size between ${NFT_COLLECTION_SIZE_MIN} and ${NFT_COLLECTION_SIZE_MAX.toLocaleString()}` };
  }
  const n = Number(trimmed);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return { ok: false, value: null, error: 'Collection size must be a whole number' };
  }
  if (n < NFT_COLLECTION_SIZE_MIN || n > NFT_COLLECTION_SIZE_MAX) {
    return {
      ok: false,
      value: n,
      error: `Collection size must be between ${NFT_COLLECTION_SIZE_MIN} and ${NFT_COLLECTION_SIZE_MAX.toLocaleString()}`,
    };
  }
  return { ok: true, value: n };
}
