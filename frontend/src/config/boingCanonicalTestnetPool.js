/**
 * Canonical public testnet native constant-product pool (32-byte AccountId).
 *
 * When operations publishes the frozen pool hex, set `CANONICAL_BOING_TESTNET_NATIVE_CP_POOL_HEX` below
 * (see boing.network docs/OPS-CANONICAL-TESTNET-NATIVE-AMM-POOL.md and RPC-API-SPEC.md § Native AMM).
 *
 * `REACT_APP_BOING_NATIVE_AMM_POOL` in `.env` always wins for CI, forks, and local overrides.
 */

/** @type {string | null} `0x` + 64 hex, or null until ops publishes */
export const CANONICAL_BOING_TESTNET_NATIVE_CP_POOL_HEX = null;

/**
 * @returns {string} normalized pool id or empty string if unset / invalid
 */
export function getCanonicalBoingTestnetNativeAmmPoolHex() {
  const raw = CANONICAL_BOING_TESTNET_NATIVE_CP_POOL_HEX;
  if (!raw || typeof raw !== 'string') return '';
  const t = raw.trim();
  if (!/^0x[0-9a-fA-F]{64}$/i.test(t)) return '';
  return `0x${t.slice(2).toLowerCase()}`;
}
