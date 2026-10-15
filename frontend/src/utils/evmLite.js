/**
 * Small, ethers-v6-compatible EVM helpers that don't pull in ethers (~400 KB) on the Boing L1
 * default path. Anything that talks to a provider / contract uses `loadEthers()` (dynamic import).
 * Outputs match ethers v6 (pinned by scripts/check-evm-lite.mjs).
 */
import { keccak_256 } from '@noble/hashes/sha3';
import { formatUnitsLite } from './formatUnitsLite';

let ethersMod = null;
let ethersPending = null;
/** Lazily load the full ethers module (cached). */
export function loadEthers() {
  if (ethersMod) return Promise.resolve(ethersMod);
  if (!ethersPending) {
    ethersPending = import('ethers').then((m) => {
      ethersMod = m;
      return m;
    });
  }
  return ethersPending;
}

const UNITS = { wei: 0, kwei: 3, mwei: 6, gwei: 9, szabo: 12, finney: 15, ether: 18 };
function unitDecimals(u) {
  if (u == null) return 18;
  if (typeof u === 'string' && Object.prototype.hasOwnProperty.call(UNITS, u)) return UNITS[u];
  const n = Number(u);
  if (!Number.isInteger(n) || n < 0) throw new Error(`invalid decimals: ${u}`);
  return n;
}

export const ZeroAddress = '0x0000000000000000000000000000000000000000';
export const ZeroHash = `0x${'00'.repeat(32)}`;
export const MaxUint256 = (1n << 256n) - 1n;

export function toBigInt(v) {
  if (typeof v === 'bigint') return v;
  if (typeof v === 'number') {
    if (!Number.isInteger(v)) throw new Error('underflow');
    return BigInt(v);
  }
  return BigInt(v);
}

export function formatUnits(value, unit) {
  return formatUnitsLite(toBigInt(value), unitDecimals(unit));
}
export function formatEther(value) {
  return formatUnits(value, 18);
}

export function parseUnits(value, unit) {
  if (typeof value !== 'string') throw new Error('value must be a string');
  const d = unitDecimals(unit);
  const m = /^(-?)([0-9]*)\.?([0-9]*)$/.exec(value);
  if (!m || (m[2] === '' && m[3] === '')) throw new Error(`invalid FixedNumber string value: ${value}`);
  const [, neg, whole, fracRaw] = m;
  let frac = fracRaw;
  if (frac.length > d) {
    if (/[^0]/.test(frac.slice(d))) throw new Error('too many decimals for format');
    frac = frac.slice(0, d);
  }
  frac = frac.padEnd(d, '0');
  const v = BigInt((whole || '0') + frac);
  return neg ? -v : v;
}
export function parseEther(value) {
  return parseUnits(value, 18);
}

const enc = new TextEncoder();
function bytesToHex(b) {
  let s = '0x';
  for (const x of b) s += x.toString(16).padStart(2, '0');
  return s;
}
function hexToBytes(h) {
  const s = h.startsWith('0x') || h.startsWith('0X') ? h.slice(2) : h;
  if (s.length % 2 || /[^0-9a-fA-F]/.test(s)) throw new Error(`invalid BytesLike value: ${h}`);
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return out;
}
export function toUtf8Bytes(s) {
  return enc.encode(s);
}
export function keccak256(data) {
  return bytesToHex(keccak_256(typeof data === 'string' ? hexToBytes(data) : data));
}
export function id(text) {
  return bytesToHex(keccak_256(enc.encode(text)));
}
export function zeroPadValue(data, length) {
  const b = typeof data === 'string' ? hexToBytes(data) : data;
  if (b.length > length) throw new Error('padding exceeds data length');
  const out = new Uint8Array(length);
  out.set(b, length - b.length);
  return bytesToHex(out);
}
export function dataSlice(data, start, end) {
  const b = typeof data === 'string' ? hexToBytes(data) : data;
  if ((end != null && end > b.length) || start > b.length) throw new Error('cannot slice beyond data bounds');
  return bytesToHex(b.slice(start ?? 0, end ?? b.length));
}

function checksum(lower40) {
  const h = keccak_256(enc.encode(lower40));
  let out = '0x';
  for (let i = 0; i < 40; i++) {
    const nib = (h[i >> 1] >> (i % 2 ? 0 : 4)) & 0xf;
    out += nib >= 8 ? lower40[i].toUpperCase() : lower40[i];
  }
  return out;
}
export function getAddress(address) {
  if (typeof address !== 'string' || !/^(0x)?[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error(`invalid address (argument="address", value=${JSON.stringify(address)})`);
  }
  const body = address.startsWith('0x') ? address.slice(2) : address;
  const res = checksum(body.toLowerCase());
  const mixed = body !== body.toLowerCase() && body !== body.toUpperCase();
  if (mixed && res.slice(2) !== body) throw new Error('bad address checksum');
  return res;
}
export function isAddress(value) {
  try {
    getAddress(value);
    return true;
  } catch {
    return false;
  }
}

/** Namespace so call sites can keep the `ethers.x` shape for the pure helpers. */
export const evmLite = {
  ZeroAddress,
  ZeroHash,
  MaxUint256,
  toBigInt,
  formatUnits,
  formatEther,
  parseUnits,
  parseEther,
  toUtf8Bytes,
  keccak256,
  id,
  zeroPadValue,
  dataSlice,
  getAddress,
  isAddress,
};
