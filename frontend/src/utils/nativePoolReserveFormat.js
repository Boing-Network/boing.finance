import { formatUnits } from 'ethers';

const MAX_DECIMALS = 48;

/**
 * @param {import('boing-sdk').CpPoolVenue & { tokenADecimals?: number, tokenBDecimals?: number }} venue
 * @param {'a' | 'b'} leg
 * @param {readonly { id?: string, decimals?: number }[]} indexerTokens
 * @returns {number | null}
 */
export function resolveNativePoolLegDecimals(venue, leg, indexerTokens) {
  if (!venue || typeof venue !== 'object') return null;
  if (leg === 'a' && typeof venue.tokenADecimals === 'number' && Number.isFinite(venue.tokenADecimals)) {
    return venue.tokenADecimals;
  }
  if (leg === 'b' && typeof venue.tokenBDecimals === 'number' && Number.isFinite(venue.tokenBDecimals)) {
    return venue.tokenBDecimals;
  }
  const hex = (leg === 'a' ? venue.tokenAHex : venue.tokenBHex) || '';
  const id = hex.trim().toLowerCase();
  if (!id || !Array.isArray(indexerTokens)) return null;
  const row = indexerTokens.find((t) => (t?.id || '').trim().toLowerCase() === id);
  if (row && typeof row.decimals === 'number' && Number.isFinite(row.decimals)) return row.decimals;
  return null;
}

/**
 * Human-readable pool reserve (integer on-chain unit → decimal when `decimals` known).
 *
 * @param {bigint | string | number | null | undefined} reserve
 * @param {number | null | undefined} decimalsMaybe
 * @returns {string}
 */
export function formatNativePoolReserveDisplay(reserve, decimalsMaybe) {
  if (reserve == null) return '—';
  try {
    const bi = typeof reserve === 'bigint' ? reserve : BigInt(reserve);
    const d =
      typeof decimalsMaybe === 'number' &&
      Number.isFinite(decimalsMaybe) &&
      decimalsMaybe >= 0 &&
      decimalsMaybe <= MAX_DECIMALS
        ? decimalsMaybe
        : null;
    if (d == null) return bi.toString();
    return formatUnits(bi, d);
  } catch {
    try {
      return typeof reserve === 'bigint' ? reserve.toString() : String(reserve);
    } catch {
      return '—';
    }
  }
}
