/**
 * Builder attestation helpers (finance v1).
 *
 * Cryptographically verifiable wallet signatures (Boing Express: Ed25519 over BLAKE3(message)).
 * Not an on-chain attestation registry — proofs are exportable JSON + browser storage.
 */
import * as ed from '@noble/ed25519';
import { blake3 } from '@noble/hashes/blake3';
import { sha512 } from '@noble/hashes/sha512';
import { isBoingNativeAccountIdHex } from './boingWalletDiscovery';

export const BUILDER_ATTESTATION_SCHEMA = 'boing.builder_attestation.v1';
export const BUILDER_ATTESTATION_STATEMENT = 'I am the builder of this project.';
const STORAGE_KEY = 'boing.finance.builder_attestations.v1';

if (typeof ed.etc.sha512Sync !== 'function') {
  ed.etc.sha512Sync = (...messages) => sha512(ed.etc.concatBytes(...messages));
}

function str(v) {
  return typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
}

function lowerHex(v) {
  const t = str(v);
  if (!t) return '';
  return t.startsWith('0x') || t.startsWith('0X') ? `0x${t.slice(2).toLowerCase()}` : t.toLowerCase();
}

function hexToBytes(hexStr) {
  const h = String(hexStr || '')
    .replace(/^0x/i, '')
    .toLowerCase();
  if (!/^[0-9a-f]+$/.test(h) || h.length % 2 !== 0) return null;
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < h.length; i += 2) out[i / 2] = parseInt(h.slice(i, i + 2), 16);
  return out;
}

function bytesToHex(bytes) {
  let s = '0x';
  for (let i = 0; i < bytes.length; i += 1) s += bytes[i].toString(16).padStart(2, '0');
  return s;
}

export function pairStorageKey(collectionId, tokenId) {
  try {
    return `${lowerHex(collectionId)}:${lowerHex(tokenId)}`;
  } catch {
    return '';
  }
}

/**
 * Canonical UTF-8 message the wallet signs.
 */
export function buildBuilderAttestationMessage({
  collectionId,
  tokenId,
  builder,
  issuedAt,
  origin,
  note = '',
  statement = BUILDER_ATTESTATION_STATEMENT,
}) {
  const collection = lowerHex(collectionId);
  const token = lowerHex(tokenId);
  const builderId = lowerHex(builder);
  const when = str(issuedAt) || new Date().toISOString();
  const site = str(origin) || (typeof window !== 'undefined' ? window.location.origin : 'https://boing.finance');
  const lines = [
    'Boing Finance — Builder attestation',
    '',
    str(statement) || BUILDER_ATTESTATION_STATEMENT,
    '',
    `Collection: ${collection}`,
    `Token: ${token}`,
    `Builder: ${builderId}`,
    `Origin: ${site}`,
    `Issued: ${when}`,
  ];
  const noteTrim = str(note);
  if (noteTrim) {
    lines.push(`Note: ${noteTrim.slice(0, 280)}`);
  }
  return lines.join('\n');
}

export function normalizeBuilderAttestationProof(input = {}) {
  const collection = lowerHex(input.collection || input.collectionId || '');
  const token = lowerHex(input.token || input.tokenId || '');
  const builder = lowerHex(input.builder || input.account || input.signer || '');
  const signature = lowerHex(input.signature || '');
  const statement = str(input.statement) || BUILDER_ATTESTATION_STATEMENT;
  const note = str(input.note).slice(0, 280);
  const issuedAt = str(input.issued_at || input.issuedAt) || new Date().toISOString();
  const origin =
    str(input.origin) || (typeof window !== 'undefined' ? window.location.origin : 'https://boing.finance');
  const message =
    str(input.message) ||
    buildBuilderAttestationMessage({
      collectionId: collection,
      tokenId: token,
      builder,
      issuedAt,
      origin,
      note,
      statement,
    });

  return {
    schema: BUILDER_ATTESTATION_SCHEMA,
    statement,
    note,
    builder,
    collection,
    token,
    issued_at: issuedAt,
    origin,
    message,
    signature,
    sign_method: str(input.sign_method || input.signMethod) || 'boing_signMessage',
  };
}

function messageByteVariants(message) {
  const raw = typeof message === 'string' ? message : '';
  const trim = raw.trim();
  const variants = [raw, trim, `${raw}\n`, `${trim}\n`];
  const out = [];
  const seen = new Set();
  for (const m of variants) {
    if (typeof m !== 'string' || seen.has(m)) continue;
    seen.add(m);
    out.push(new TextEncoder().encode(m));
  }
  return out;
}

function verifyEd25519(publicKey, messageOrHash, signature) {
  try {
    return ed.verify(signature, messageOrHash, publicKey);
  } catch {
    return false;
  }
}

/**
 * Verify a builder attestation proof.
 * @returns {{ ok: boolean, code: string, message: string, proof?: object }}
 */
export function verifyBuilderAttestationProof(input) {
  let proof;
  try {
    proof = normalizeBuilderAttestationProof(
      typeof input === 'string' ? JSON.parse(input) : input || {}
    );
  } catch {
    return { ok: false, code: 'invalid_json', message: 'That proof could not be read.' };
  }

  if (proof.schema && proof.schema !== BUILDER_ATTESTATION_SCHEMA) {
    return { ok: false, code: 'bad_schema', message: 'This proof uses an unknown format.', proof };
  }
  if (!isBoingNativeAccountIdHex(proof.builder)) {
    return { ok: false, code: 'bad_builder', message: 'Builder account looks invalid.', proof };
  }
  if (!isBoingNativeAccountIdHex(proof.collection) || !isBoingNativeAccountIdHex(proof.token)) {
    return {
      ok: false,
      code: 'bad_ids',
      message: 'Collection or token id looks invalid.',
      proof,
    };
  }
  if (!proof.message) {
    return { ok: false, code: 'missing_message', message: 'Proof is missing the signed message.', proof };
  }

  const expected = buildBuilderAttestationMessage({
    collectionId: proof.collection,
    tokenId: proof.token,
    builder: proof.builder,
    issuedAt: proof.issued_at,
    origin: proof.origin,
    note: proof.note,
    statement: proof.statement,
  });
  if (proof.message.trim() !== expected.trim()) {
    return {
      ok: false,
      code: 'message_mismatch',
      message: 'Proof fields do not match the signed message.',
      proof,
    };
  }

  const pub = hexToBytes(proof.builder);
  const sig = hexToBytes(proof.signature);
  if (!pub || pub.length !== 32) {
    return { ok: false, code: 'bad_builder', message: 'Builder account looks invalid.', proof };
  }
  if (!sig || sig.length !== 64) {
    return { ok: false, code: 'bad_signature', message: 'Signature looks invalid.', proof };
  }

  for (const msgBytes of messageByteVariants(proof.message)) {
    if (verifyEd25519(pub, blake3(msgBytes), sig)) {
      return { ok: true, code: 'valid', message: 'Proof checks out.', proof };
    }
    if (verifyEd25519(pub, msgBytes, sig)) {
      return { ok: true, code: 'valid', message: 'Proof checks out.', proof };
    }
  }

  return {
    ok: false,
    code: 'invalid_signature',
    message: 'Could not verify this proof. It may be incomplete or altered.',
    proof,
  };
}

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw);
    return o && typeof o === 'object' ? o : {};
  } catch {
    return {};
  }
}

function writeStore(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

export function loadStoredBuilderAttestation(collectionId, tokenId) {
  const key = pairStorageKey(collectionId, tokenId);
  if (!key || typeof window === 'undefined') return null;
  const entry = readStore()[key];
  if (!entry) return null;
  const checked = verifyBuilderAttestationProof(entry);
  return checked.ok ? checked.proof : null;
}

export function saveBuilderAttestationProof(proofInput) {
  const checked = verifyBuilderAttestationProof(proofInput);
  if (!checked.ok || !checked.proof) return checked;
  if (typeof window === 'undefined') return checked;
  const key = pairStorageKey(checked.proof.collection, checked.proof.token);
  if (!key) return { ok: false, code: 'bad_ids', message: 'Could not store proof.' };
  const map = readStore();
  map[key] = checked.proof;
  writeStore(map);
  return checked;
}

export function clearStoredBuilderAttestation(collectionId, tokenId) {
  const key = pairStorageKey(collectionId, tokenId);
  if (!key || typeof window === 'undefined') return;
  const map = readStore();
  if (map[key]) {
    delete map[key];
    writeStore(map);
  }
}

export function exportBuilderAttestationJson(proof) {
  return `${JSON.stringify(normalizeBuilderAttestationProof(proof), null, 2)}\n`;
}

/** Test helper: hex of BLAKE3(message) for docs / fixtures. */
export function builderAttestationMessageHashHex(message) {
  return bytesToHex(blake3(new TextEncoder().encode(message)));
}
