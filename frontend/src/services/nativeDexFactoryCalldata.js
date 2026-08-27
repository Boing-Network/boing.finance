/**
 * Native DEX pair-directory calldata (Boing VM). Mirrors boing-sdk `nativeDexFactory.ts`.
 */

export const SELECTOR_NATIVE_DEX_REGISTER_PAIR = 0xd0;

function selectorWord(selector) {
  const w = new Uint8Array(32);
  w[31] = selector & 0xff;
  return w;
}

function hex32ToBytes(hex) {
  const t = (hex || '').trim();
  const body = t.startsWith('0x') || t.startsWith('0X') ? t.slice(2) : t;
  if (!/^[0-9a-fA-F]{64}$/.test(body)) {
    throw new Error('Expected a 32-byte hex account id.');
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i += 1) {
    out[i] = parseInt(body.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToHex(bytes) {
  let s = '0x';
  for (let i = 0; i < bytes.length; i += 1) {
    s += bytes[i].toString(16).padStart(2, '0');
  }
  return s;
}

/** 128-byte `register_pair(token_a, token_b, pool)` calldata. */
export function encodeNativeDexRegisterPairCalldataHex(tokenAHex32, tokenBHex32, poolHex32) {
  const out = new Uint8Array(128);
  out.set(selectorWord(SELECTOR_NATIVE_DEX_REGISTER_PAIR), 0);
  out.set(hex32ToBytes(tokenAHex32), 32);
  out.set(hex32ToBytes(tokenBHex32), 64);
  out.set(hex32ToBytes(poolHex32), 96);
  return bytesToHex(out);
}
