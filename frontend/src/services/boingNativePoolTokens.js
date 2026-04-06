import {
  NATIVE_CONSTANT_PRODUCT_TOKEN_A_KEY_HEX,
  NATIVE_CONSTANT_PRODUCT_TOKEN_B_KEY_HEX,
  validateHex32,
} from 'boing-sdk';

/** Synthetic 32-byte ids when the on-chain pool has no `set_tokens` reference accounts (v1 ledger-only reserves). */
export const SYNTHETIC_NATIVE_CP_TOKEN_A_HEX =
  '0x0000000000000000000000000000000000000000000000000000000000000e01';
export const SYNTHETIC_NATIVE_CP_TOKEN_B_HEX =
  '0x0000000000000000000000000000000000000000000000000000000000000e02';

/**
 * @param {string} valueHex
 * @returns {string | null} normalized 0x+64 or null if empty / invalid
 */
function storageWordToAccountHex(valueHex) {
  if (!valueHex || typeof valueHex !== 'string') return null;
  try {
    const v = validateHex32(valueHex.trim());
    if (/^0x0+$/i.test(v)) return null;
    return `0x${v.slice(2).toLowerCase()}`;
  } catch {
    return null;
  }
}

/**
 * Read token A/B account ids from native CP pool storage for {@link hydrateCpPoolVenuesFromRpc}.
 * Falls back to synthetic ids when both are unset (matches SDK routing math for A/B legs).
 *
 * @param {import('boing-sdk').BoingClient} client
 * @param {string} poolHex32
 * @returns {Promise<{ poolHex: string, tokenAHex: string, tokenBHex: string }>}
 */
export async function fetchNativeCpPoolTokenRow(client, poolHex32) {
  const pool = validateHex32(poolHex32.trim());
  const [wa, wb] = await Promise.all([
    client.getContractStorage(pool, NATIVE_CONSTANT_PRODUCT_TOKEN_A_KEY_HEX),
    client.getContractStorage(pool, NATIVE_CONSTANT_PRODUCT_TOKEN_B_KEY_HEX),
  ]);
  let tokenAHex = storageWordToAccountHex(wa.value);
  let tokenBHex = storageWordToAccountHex(wb.value);
  if (!tokenAHex && !tokenBHex) {
    tokenAHex = SYNTHETIC_NATIVE_CP_TOKEN_A_HEX;
    tokenBHex = SYNTHETIC_NATIVE_CP_TOKEN_B_HEX;
  } else {
    tokenAHex = tokenAHex || SYNTHETIC_NATIVE_CP_TOKEN_A_HEX;
    tokenBHex = tokenBHex || SYNTHETIC_NATIVE_CP_TOKEN_B_HEX;
  }
  return { poolHex: pool, tokenAHex, tokenBHex };
}
