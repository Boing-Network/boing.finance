/**
 * Canonical **public Boing testnet** native constant-product pool (32-byte `AccountId`).
 *
 * **Chain:** EIP-155 **6913** (`0x1b01`). This hex is the pool contract id on the **shared** testnet that
 * uses the same genesis and bootnodes as public RPC (e.g. `https://testnet-rpc.boing.network`). It is **not**
 * guaranteed to exist or match reserves on an isolated `localhost:8545` node or any fork with different chain
 * state — for those, set `REACT_APP_BOING_NATIVE_AMM_POOL` to your pool id instead.
 *
 * Cross-repo: mirror in boing.network `RPC-API-SPEC.md` / `TESTNET.md` per OPS-CANONICAL-TESTNET-NATIVE-AMM-POOL.md.
 * Deployed liquidity context (when this id was published): reserve A **1000** / reserve B **2000** (ledger units).
 *
 * `REACT_APP_BOING_NATIVE_AMM_POOL` in `.env` / Pages env **always wins** over this constant (CI, forks, staging).
 */

/** @type {string | null} `0x` + 64 hex on public testnet; set `null` to disable in-app native AMM until configured */
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
