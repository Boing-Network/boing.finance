/**
 * LP share token balance slot: `storage_key = account_id ^ LP_SHARE_BALANCE_XOR`
 * (`native_lp_share_token.rs` — same layout as docs/NATIVE-LP-SHARE-TOKEN.md).
 */

import { boingGetContractStorage, normalizeBoingFaucetAccountHex } from './boingTestnetRpc';
import { parseNativeAmmReserveU128 } from './nativeAmmCalldata';

/** 32-byte XOR mask: `BOING_LP_SHARE_BAL_V1` + padding (matches `LP_SHARE_BALANCE_XOR` in boing-execution). */
export const LP_SHARE_BALANCE_XOR_HEX = (() => {
  const text = 'BOING_LP_SHARE_BAL_V1';
  const bytes = new Uint8Array(32);
  for (let i = 0; i < text.length; i++) {
    bytes[i] = text.charCodeAt(i) & 0xff;
  }
  let out = '0x';
  for (let i = 0; i < 32; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
})();

function hexToBytes32(hex) {
  const t = (hex || '').trim();
  const body = t.startsWith('0x') || t.startsWith('0X') ? t.slice(2) : t;
  if (!/^[0-9a-fA-F]{64}$/i.test(body)) return null;
  const u = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    u[i] = parseInt(body.slice(i * 2, i * 2 + 2), 16);
  }
  return u;
}

function bytes32ToHex(u8) {
  let s = '0x';
  for (let i = 0; i < 32; i++) {
    s += u8[i].toString(16).padStart(2, '0');
  }
  return s;
}

/**
 * Storage key for `holder`'s LP share balance on the share-token contract.
 * @param {string} holderAccountHex32
 * @returns {string | null} `0x` + 64 hex
 */
export function computeLpShareBalanceStorageKeyHex(holderAccountHex32) {
  const holder = normalizeBoingFaucetAccountHex(holderAccountHex32);
  if (!holder) return null;
  const ha = hexToBytes32(holder);
  const xb = hexToBytes32(LP_SHARE_BALANCE_XOR_HEX);
  if (!ha || !xb) return null;
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = ha[i] ^ xb[i];
  }
  return bytes32ToHex(out);
}

/**
 * @param {string} shareTokenContractHex32
 * @param {string} holderAccountHex32
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<bigint>}
 */
export async function fetchNativeLpShareBalanceU128(shareTokenContractHex32, holderAccountHex32, options = {}) {
  const key = computeLpShareBalanceStorageKeyHex(holderAccountHex32);
  if (!key) return 0n;
  const word = await boingGetContractStorage(shareTokenContractHex32, key, options);
  return parseNativeAmmReserveU128(word);
}
