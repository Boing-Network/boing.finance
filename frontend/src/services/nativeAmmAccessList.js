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
