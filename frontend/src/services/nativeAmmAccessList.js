import { normalizeBoingFaucetAccountHex } from './boingTestnetRpc';

/**
 * Heuristic access list for native CP pool calls (sender + pool read/write).
 * Matches `Transaction::suggested_parallel_access_list` for `ContractCall` in boing-primitives.
 * @param {string} senderAccountHex — 32-byte Boing account from wallet
 * @param {string} poolAccountHex — 32-byte pool contract id
 * @returns {{ read: string[], write: string[] } | null}
 */
export function nativeConstantProductPoolAccessListJson(senderAccountHex, poolAccountHex) {
  const s = normalizeBoingFaucetAccountHex(senderAccountHex);
  const p = normalizeBoingFaucetAccountHex(poolAccountHex);
  if (!s || !p) return null;
  return { read: [s, p], write: [s, p] };
}

/**
 * Access list covering the sender plus every 32-byte account the call reads/writes
 * (pool, token legs, factory).
 * @param {Array<string | null | undefined>} accountHexes
 * @returns {{ read: string[], write: string[] } | null}
 */
export function nativeAccountsAccessListJson(accountHexes) {
  const ids = [];
  const seen = new Set();
  for (const raw of accountHexes || []) {
    const n = normalizeBoingFaucetAccountHex(raw);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    ids.push(n);
  }
  if (ids.length < 2) return null;
  return { read: ids, write: ids };
}

/**
 * Access list for multihop router `contract_call`: sender + router + every pool touched.
 * @param {string} senderAccountHex
 * @param {string} routerAccountHex
 * @param {string[]} poolAccountHexes
 * @returns {{ read: string[], write: string[] } | null}
 */
export function nativeDexRouterAndPoolsAccessListJson(senderAccountHex, routerAccountHex, poolAccountHexes) {
  const s = normalizeBoingFaucetAccountHex(senderAccountHex);
  const r = normalizeBoingFaucetAccountHex(routerAccountHex);
  if (!s || !r) return null;
  const read = new Set([s, r]);
  const write = new Set([s, r]);
  for (const p of poolAccountHexes) {
    const n = normalizeBoingFaucetAccountHex(p);
    if (n) {
      read.add(n);
      write.add(n);
    }
  }
  return { read: [...read], write: [...write] };
}
