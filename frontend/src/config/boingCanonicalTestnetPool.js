/**
 * Canonical **public Boing testnet** native constant-product pool (32-byte `AccountId`).
 *
 * **Chain:** EIP-155 **6913** (`0x1b01`). Historical hex from the previous public ledger; the hosted
 * Fly RPC currently leaves `end_user.canonical_native_cp_pool` unset. For isolated `localhost:8545`
 * nodes, set `REACT_APP_BOING_NATIVE_AMM_POOL` to your pool id instead.
 *
 * **Source of truth:** re-exported from `boing-sdk` (`canonicalTestnet.ts`); bump the linked SDK when canon rotates.
 * Cross-repo docs: boing.network `RPC-API-SPEC.md` / `TESTNET.md` / `NATIVE-DEX-OPERATOR-DEPLOYMENT-RECORD.md` Appendix B.
 *
 * `REACT_APP_BOING_NATIVE_AMM_POOL` in `.env` / Pages env **always wins** over this constant (CI, forks, staging).
 */

import { CANONICAL_BOING_TESTNET_NATIVE_CP_POOL_HEX } from 'boing-sdk';

export { CANONICAL_BOING_TESTNET_NATIVE_CP_POOL_HEX };

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
