/**
 * Canonical public testnet native constant-product pool (32-byte AccountId).
 *
 * Operator-published id (see boing.network docs/OPS-CANONICAL-TESTNET-NATIVE-AMM-POOL.md and RPC-API-SPEC.md § Native AMM).
 * Initial liquidity context: reserve A 1000 / reserve B 2000 (ledger units).
 *
 * `REACT_APP_BOING_NATIVE_AMM_POOL` in `.env` always wins for CI, forks, and local overrides.
 */

/** @type {string | null} `0x` + 64 hex, or null until ops publishes */
export const CANONICAL_BOING_TESTNET_NATIVE_CP_POOL_HEX =
  '0xffaa1290614441902ba813bf3bd8bf057624e0bd4f16160a9d32cd65d3f4d0c2';

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
