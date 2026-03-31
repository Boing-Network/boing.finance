/**
 * Native constant-product pool calldata (Boing VM). Mirrors boing.network `boing-sdk/nativeAmm.ts` / `native_amm.rs`.
 * Amounts must stay in u64 range for on-chain `Mul` parity.
 */

export const SELECTOR_NATIVE_AMM_SWAP = 0x10;
export const SELECTOR_NATIVE_AMM_ADD_LIQUIDITY = 0x11;
export const SELECTOR_NATIVE_AMM_REMOVE_LIQUIDITY = 0x12;

/** Storage keys matching `boing_execution::native_amm::reserve_*_key`. */
export const NATIVE_AMM_RESERVE_A_KEY = `0x${'0'.repeat(62)}01`;
export const NATIVE_AMM_RESERVE_B_KEY = `0x${'0'.repeat(62)}02`;

function selectorWord(selector) {
  const w = new Uint8Array(32);
  w[31] = selector & 0xff;
  return w;
}

function amountWord(amount) {
  const w = new Uint8Array(32);
  const n = BigInt(amount);
  if (n < 0n || n > (1n << 128n) - 1n) {
    throw new RangeError('amount must fit in u128');
  }
  const be = new Uint8Array(16);
  let x = n;
  for (let i = 15; i >= 0; i--) {
    be[i] = Number(x & 0xffn);
    x >>= 8n;
  }
  w.set(be, 16);
  return w;
}

function bytesToHex(bytes) {
  let s = '0x';
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, '0');
  }
  return s;
}

/** @param {bigint | number | string} direction @param {bigint | number | string} amountIn @param {bigint | number | string} minOut */
export function encodeNativeAmmSwapCalldataHex(direction, amountIn, minOut) {
  const out = new Uint8Array(128);
  out.set(selectorWord(SELECTOR_NATIVE_AMM_SWAP), 0);
  out.set(amountWord(BigInt(direction)), 32);
  out.set(amountWord(BigInt(amountIn)), 64);
  out.set(amountWord(BigInt(minOut)), 96);
  return bytesToHex(out);
}

/** u128 big-endian in the low 16 bytes of a 32-byte storage word (`0x` + 64 hex). */
export function parseNativeAmmReserveU128(valueHex) {
  if (!valueHex || typeof valueHex !== 'string') return 0n;
  const body = valueHex.startsWith('0x') ? valueHex.slice(2) : valueHex;
  if (!/^[0-9a-fA-F]{64}$/i.test(body)) return 0n;
  const lo = body.slice(32, 64);
  let v = 0n;
  for (let i = 0; i < 32; i += 2) {
    v = (v << 8n) + BigInt(parseInt(lo.slice(i, i + 2), 16));
  }
  return v;
}

/** No-fee constant product (bigint); keep inputs ≤ u64 for VM parity. */
export function constantProductAmountOut(reserveIn, reserveOut, amountIn) {
  const ri = BigInt(reserveIn);
  const ro = BigInt(reserveOut);
  const dx = BigInt(amountIn);
  const denom = ri + dx;
  if (denom === 0n) return 0n;
  return (ro * dx) / denom;
}
