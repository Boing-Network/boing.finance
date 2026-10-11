/**
 * Smoke check: build + verify a builder attestation with a local Ed25519 key.
 * Run: node scripts/check-builder-attestation.mjs
 *
 * Mirrors frontend/src/utils/builderAttestation.js verify path (no Vite resolve).
 */
import * as ed from '@noble/ed25519';
import { blake3 } from '@noble/hashes/blake3';
import { sha512 } from '@noble/hashes/sha512';

if (typeof ed.etc.sha512Sync !== 'function') {
  ed.etc.sha512Sync = (...messages) => sha512(ed.etc.concatBytes(...messages));
}

function bytesToHex(bytes) {
  let s = '0x';
  for (let i = 0; i < bytes.length; i += 1) s += bytes[i].toString(16).padStart(2, '0');
  return s;
}

function hexToBytes(hexStr) {
  const h = String(hexStr || '')
    .replace(/^0x/i, '')
    .toLowerCase();
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < h.length; i += 2) out[i / 2] = parseInt(h.slice(i, i + 2), 16);
  return out;
}

function buildMessage({ collection, token, builder, issuedAt, origin, note }) {
  return [
    'Boing Finance — Builder attestation',
    '',
    'I am the builder of this project.',
    '',
    `Collection: ${collection}`,
    `Token: ${token}`,
    `Builder: ${builder}`,
    `Origin: ${origin}`,
    `Issued: ${issuedAt}`,
    `Note: ${note}`,
  ].join('\n');
}

const secret = ed.utils.randomPrivateKey();
const pub = await ed.getPublicKeyAsync(secret);
const builder = bytesToHex(pub);
const collection = `0x${'11'.repeat(32)}`;
const token = `0x${'22'.repeat(32)}`;
const issuedAt = '2026-10-11T00:00:00.000Z';
const origin = 'https://boing.finance';
const note = 'smoke';
const message = buildMessage({ collection, token, builder, issuedAt, origin, note });
const hash = blake3(new TextEncoder().encode(message));
const sig = await ed.signAsync(hash, secret);
const signature = bytesToHex(sig);

const pubBytes = hexToBytes(builder);
const sigBytes = hexToBytes(signature);
const ok = ed.verify(sigBytes, hash, pubBytes);
if (!ok) {
  console.error('FAIL: signature did not verify');
  process.exit(1);
}

const tampered = blake3(new TextEncoder().encode(message.replace('smoke', 'nope')));
if (ed.verify(sigBytes, tampered, pubBytes)) {
  console.error('FAIL: tampered message should not verify');
  process.exit(1);
}

console.log('OK builder attestation sign/verify + tamper reject');
