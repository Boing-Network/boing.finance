/**
 * Sign a builder attestation with Boing Express (`boing_signMessage` / `personal_sign` fallback).
 */
import {
  BUILDER_ATTESTATION_STATEMENT,
  buildBuilderAttestationMessage,
  normalizeBuilderAttestationProof,
  saveBuilderAttestationProof,
  verifyBuilderAttestationProof,
} from '../utils/builderAttestation';
import { isBoingNativeAccountIdHex } from '../utils/boingWalletDiscovery';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';

function utf8MessageToHex(messageUtf8) {
  const bytes = new TextEncoder().encode(messageUtf8);
  let hex = '';
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return `0x${hex}`;
}

function normalizeSignatureHex(raw) {
  if (typeof raw === 'string') return raw.trim();
  if (raw && typeof raw === 'object') {
    if (typeof raw.signature === 'string') return raw.signature.trim();
    if (typeof raw.hex === 'string') return raw.hex.trim();
    if (typeof raw.result === 'string') return raw.result.trim();
  }
  return '';
}

function isUserRejection(err) {
  return (
    err?.code === 4001 ||
    err?.code === 'ACTION_REJECTED' ||
    /reject|denied|cancel/i.test(String(err?.message || ''))
  );
}

/**
 * @returns {Promise<{ ok: true, proof: object, method: string } | { ok: false, code: string, message: string }>}
 */
export async function signBuilderAttestation({
  getWalletProvider,
  builder,
  collectionId,
  tokenId,
  note = '',
  persist = true,
}) {
  if (!isBoingNativeAccountIdHex(builder)) {
    return { ok: false, code: 'bad_builder', message: 'Connect a Boing account to attest.' };
  }
  if (!isBoingNativeAccountIdHex(collectionId) || !isBoingNativeAccountIdHex(tokenId)) {
    return { ok: false, code: 'bad_ids', message: 'Need a valid collection and token id.' };
  }

  const provider =
    typeof getWalletProvider === 'function' ? getWalletProvider('boingExpress') : getWalletProvider;
  if (!provider || typeof provider.request !== 'function') {
    return {
      ok: false,
      code: 'no_wallet',
      message: 'Connect Boing Express to attest as builder.',
    };
  }

  const issuedAt = new Date().toISOString();
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://boing.finance';
  const message = buildBuilderAttestationMessage({
    collectionId,
    tokenId,
    builder,
    issuedAt,
    origin,
    note,
    statement: BUILDER_ATTESTATION_STATEMENT,
  });

  let signature = '';
  let method = 'boing_signMessage';

  try {
    const raw = await provider.request({
      method: 'boing_signMessage',
      params: [message, builder],
    });
    signature = normalizeSignatureHex(raw);
  } catch (e1) {
    if (isUserRejection(e1)) {
      return { ok: false, code: 'user_rejected', message: 'Signature cancelled.' };
    }
    try {
      const raw = await provider.request({
        method: 'personal_sign',
        params: [utf8MessageToHex(message), builder],
      });
      signature = normalizeSignatureHex(raw);
      method = 'personal_sign';
    } catch (e2) {
      if (isUserRejection(e2)) {
        return { ok: false, code: 'user_rejected', message: 'Signature cancelled.' };
      }
      return {
        ok: false,
        code: 'sign_failed',
        message:
          formatBoingExpressRpcError(e2) ||
          formatBoingExpressRpcError(e1) ||
          e2?.message ||
          e1?.message ||
          'Could not sign attestation.',
      };
    }
  }

  if (!signature) {
    return {
      ok: false,
      code: 'empty_signature',
      message: 'Wallet did not return a signature. Update Boing Express and try again.',
    };
  }

  const draft = normalizeBuilderAttestationProof({
    builder,
    collection: collectionId,
    token: tokenId,
    note,
    issued_at: issuedAt,
    origin,
    message,
    signature,
    sign_method: method,
  });

  const checked = persist ? saveBuilderAttestationProof(draft) : verifyBuilderAttestationProof(draft);
  if (!checked.ok) {
    return {
      ok: false,
      code: checked.code || 'verify_failed',
      message:
        checked.message ||
        'Signed, but this app could not verify the signature. Update Boing Express and try again.',
    };
  }

  return { ok: true, proof: checked.proof, method };
}
