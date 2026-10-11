/**
 * On-chain builder attestation registry (read + write).
 *
 * Prefer boing-sdk helpers (`builderAttestationRegistry.ts` on boing.network main).
 * Local encode fallbacks match selectors 0xE0–0xE6 when an older SDK install lacks exports.
 *
 * Auth: separate dual asset-claimer on this registry (not companions claimer).
 * Flow: claim_asset ×2 → attest; revoke_at by builder or dual claimer.
 *
 * Registry AccountId: env `REACT_APP_BOING_BUILDER_ATTESTATION_REGISTRY`, contracts nativeVm,
 * or `end_user.canonical_builder_attestation_registry`. CREATE2 salt `BOING_BUILDER_ATTEST_REG_V1`.
 *
 * Companion links are app policy only — not checked here.
 */

import * as boingSdk from 'boing-sdk';
import { isBoingNativeAccountIdHex } from '../utils/boingWalletDiscovery';
import { normalizeLinkableAssetAddress } from '../utils/linkedNftToken';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { getBoingNativeVmModuleId } from '../config/contracts';
import { boingExpressContractCallSignSimulateSubmit } from './boingExpressNativeTx';
import { tryBoingUnsignedContractSimulate } from './boingNativeVm';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';

const ZERO32 = `0x${'0'.repeat(64)}`;

/** Live public testnet pin (also in github-build.*.env). */
export const CANONICAL_TESTNET_BUILDER_ATTESTATION_REGISTRY =
  '0x734077a9f926077d39e84ec278b77b7b600c840f7101809646d8797a6a9e1816';

const SELECTOR_CLAIM = 0xe0;
const SELECTOR_ATTEST = 0xe1;
const SELECTOR_REVOKE_AT = 0xe2;
const SELECTOR_COUNT = 0xe3;
const SELECTOR_GET_AT = 0xe4;
const SELECTOR_GET_CLAIMER = 0xe5;

function selectorWord(selector) {
  const w = new Uint8Array(32);
  w[31] = selector & 0xff;
  return w;
}

function u64Word(n) {
  if (!Number.isInteger(n) || n < 0 || n > Number.MAX_SAFE_INTEGER) {
    throw new RangeError('index must be a non-negative safe integer');
  }
  const w = new Uint8Array(32);
  new DataView(w.buffer).setBigUint64(24, BigInt(n), false);
  return w;
}

function hex32ToBytes(hex) {
  const t = String(hex || '').trim();
  const body = t.startsWith('0x') || t.startsWith('0X') ? t.slice(2) : t;
  if (!/^[0-9a-fA-F]{64}$/.test(body)) throw new Error('Expected a 32-byte hex account id.');
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i += 1) out[i] = parseInt(body.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function bytesToHex(bytes) {
  let s = '0x';
  for (let i = 0; i < bytes.length; i += 1) s += bytes[i].toString(16).padStart(2, '0');
  return s;
}

function concatWords(parts) {
  const n = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function localEncodeClaim(asset) {
  return bytesToHex(concatWords([selectorWord(SELECTOR_CLAIM), hex32ToBytes(asset)]));
}
function localEncodeAttest(collection, token, noteHash = ZERO32) {
  return bytesToHex(
    concatWords([
      selectorWord(SELECTOR_ATTEST),
      hex32ToBytes(collection),
      hex32ToBytes(token),
      hex32ToBytes(noteHash || ZERO32),
    ])
  );
}
function localEncodeRevokeAt(index) {
  return bytesToHex(concatWords([selectorWord(SELECTOR_REVOKE_AT), u64Word(index)]));
}
function localEncodeCount() {
  return bytesToHex(selectorWord(SELECTOR_COUNT));
}
function localEncodeGetAt(index) {
  return bytesToHex(concatWords([selectorWord(SELECTOR_GET_AT), u64Word(index)]));
}
function localEncodeGetClaimer(asset) {
  return bytesToHex(concatWords([selectorWord(SELECTOR_GET_CLAIMER), hex32ToBytes(asset)]));
}

function localDecodeCount(returnDataHex) {
  const raw = String(returnDataHex || '')
    .replace(/^0x/i, '')
    .toLowerCase();
  if (raw.length < 16) return 0n;
  return BigInt(`0x${raw.slice(-16)}`);
}

function localDecodeGetAt(returnDataHex) {
  const raw = String(returnDataHex || '')
    .replace(/^0x/i, '')
    .toLowerCase();
  if (raw.length < 256) throw new Error('get_attestation_at return data: expected 128 bytes');
  const collectionHex = `0x${raw.slice(0, 64)}`;
  const tokenHex = `0x${raw.slice(64, 128)}`;
  const builderHex = `0x${raw.slice(128, 192)}`;
  const noteHashHex = `0x${raw.slice(192, 256)}`;
  return {
    collectionHex,
    tokenHex,
    builderHex,
    noteHashHex,
    active: collectionHex !== ZERO32,
  };
}

function envRegistryHex() {
  const raw =
    process.env.REACT_APP_BOING_BUILDER_ATTESTATION_REGISTRY ||
    process.env.REACT_APP_BOING_NATIVE_VM_BUILDER_ATTESTATION_REGISTRY ||
    process.env.VITE_BOING_BUILDER_ATTESTATION_REGISTRY ||
    '';
  return String(raw).trim();
}

function normalizeRegistryId(hex) {
  const t = String(hex || '').trim();
  if (!t || !isBoingNativeAccountIdHex(t)) return null;
  const lower = `0x${t.replace(/^0x/i, '').toLowerCase()}`;
  if (lower === ZERO32) return null;
  return lower;
}

function pickFn(...candidates) {
  for (const c of candidates) {
    if (typeof c === 'function') return c;
  }
  return null;
}

/** SDK API + local encode fallbacks (selectors 0xE0–0xE6). */
export function getBuilderAttestationRegistrySdkApi() {
  const encodeClaim =
    pickFn(boingSdk.encodeBuilderAttestClaimAssetCalldataHex) || localEncodeClaim;
  const encodeAttest =
    pickFn(boingSdk.encodeBuilderAttestAttestCalldataHex) || localEncodeAttest;
  const encodeRevokeAt =
    pickFn(boingSdk.encodeBuilderAttestRevokeAtCalldataHex) || localEncodeRevokeAt;
  const encodeCount =
    pickFn(boingSdk.encodeBuilderAttestCountCalldataHex) || localEncodeCount;
  const encodeGetAt =
    pickFn(boingSdk.encodeBuilderAttestGetAtCalldataHex) || localEncodeGetAt;
  const encodeGetClaimer =
    pickFn(boingSdk.encodeBuilderAttestGetClaimerCalldataHex) || localEncodeGetClaimer;
  const decodeCount =
    pickFn(boingSdk.decodeBuilderAttestCountReturnData) || localDecodeCount;
  const decodeGetAt =
    pickFn(boingSdk.decodeBuilderAttestGetAtReturnData) || localDecodeGetAt;
  const buildFlowTxs = pickFn(boingSdk.buildBuilderAttestationAttestFlowTxs);
  const buildCallTx = pickFn(boingSdk.buildBuilderAttestationRegistryContractCallTx);
  const create2SaltHex =
    boingSdk.BUILDER_ATTESTATION_REGISTRY_CREATE2_SALT_V1_HEX ||
    (() => {
      const u8 = new Uint8Array(32);
      u8.set(new TextEncoder().encode('BOING_BUILDER_ATTEST_REG_V1'));
      return bytesToHex(u8);
    })();
  const canonicalHex =
    normalizeRegistryId(boingSdk.CANONICAL_BOING_TESTNET_BUILDER_ATTESTATION_REGISTRY_HEX) ||
    CANONICAL_TESTNET_BUILDER_ATTESTATION_REGISTRY;

  return {
    encodeClaim,
    encodeAttest,
    encodeRevokeAt,
    encodeCount,
    encodeGetAt,
    encodeGetClaimer,
    decodeCount,
    decodeGetAt,
    buildFlowTxs,
    buildCallTx,
    create2SaltHex,
    canonicalHex,
    fromSdk: typeof boingSdk.encodeBuilderAttestAttestCalldataHex === 'function',
  };
}

/**
 * @param {{ endUser?: Record<string, unknown>|null, networkInfo?: Record<string, unknown>|null }} [opts]
 */
export function resolveBuilderAttestationRegistryId(opts = {}) {
  const fromEnv = normalizeRegistryId(envRegistryHex());
  if (fromEnv) return { registryId: fromEnv, source: 'env' };

  try {
    const fromContracts = normalizeRegistryId(
      getBoingNativeVmModuleId(BOING_NATIVE_L1_CHAIN_ID, 'builderAttestationRegistry')
    );
    if (fromContracts) return { registryId: fromContracts, source: 'contracts' };
  } catch {
    /* ignore */
  }

  const endUser =
    opts.endUser ||
    opts.networkInfo?.end_user ||
    opts.networkInfo?.result?.end_user ||
    null;
  if (endUser && typeof endUser === 'object') {
    const candidates = [
      endUser.canonical_builder_attestation_registry,
      endUser.canonical_native_builder_attestation_registry,
      endUser.builder_attestation_registry,
    ];
    for (const c of candidates) {
      const id = normalizeRegistryId(c);
      if (id) return { registryId: id, source: 'network_info' };
    }
  }

  // Hard pin for public testnet when env/contracts unset (same honesty as companions bake).
  const sdk = getBuilderAttestationRegistrySdkApi();
  if (sdk.canonicalHex) {
    return { registryId: sdk.canonicalHex, source: 'canonical_testnet' };
  }
  return { registryId: null, source: null };
}

/**
 * @returns {{
 *   canWrite: boolean,
 *   canRead: boolean,
 *   registryId: string|null,
 *   registrySource: string|null,
 *   code: 'ready'|'registry_unpublished',
 *   message: string,
 *   sdk: ReturnType<typeof getBuilderAttestationRegistrySdkApi>,
 * }}
 */
export function getBuilderAttestationRegistryStatus(opts = {}) {
  const sdk = getBuilderAttestationRegistrySdkApi();
  const { registryId, source } = resolveBuilderAttestationRegistryId(opts);
  if (!registryId) {
    return {
      canWrite: false,
      canRead: false,
      registryId: null,
      registrySource: null,
      code: 'registry_unpublished',
      message:
        'Set REACT_APP_BOING_BUILDER_ATTESTATION_REGISTRY to the registry AccountId (CREATE2 salt BOING_BUILDER_ATTEST_REG_V1).',
      sdk,
    };
  }
  return {
    canWrite: true,
    canRead: true,
    registryId,
    registrySource: source,
    code: 'ready',
    message: sdk.fromSdk
      ? 'Builder attestation ready (boing-sdk encode helpers).'
      : 'Builder attestation ready (local 0xE0–0xE6 encode fallback until SDK merge).',
    sdk,
  };
}

function buildTx(sdk, sender, registryId, calldata, extraAccounts = []) {
  if (sdk.buildCallTx) {
    return sdk.buildCallTx(sender, registryId, calldata);
  }
  const accounts = [sender, registryId, ...extraAccounts]
    .filter(Boolean)
    .map((a) => String(a).toLowerCase());
  const uniq = [...new Set(accounts)];
  return {
    type: 'contract_call',
    contract: registryId,
    calldata,
    access_list: { read: uniq, write: uniq },
  };
}

async function submitCall(provider, tx) {
  return boingExpressContractCallSignSimulateSubmit(provider, tx);
}

async function simulateRegistryReturnData({ registryId, calldata, origin = null } = {}) {
  const payload = {
    contract: registryId,
    calldata,
    ...(origin ? { origin } : {}),
  };
  const r = await tryBoingUnsignedContractSimulate(payload);
  if (!r.ok) return { ok: false, message: r.message, returnData: null };
  const result = r.result || {};
  const returnData =
    (typeof result.return_data === 'string' && result.return_data) ||
    (typeof result.returnData === 'string' && result.returnData) ||
    null;
  if (!result.success && result.error) {
    return { ok: false, message: result.error, returnData };
  }
  return { ok: true, returnData, result };
}

export async function claimBuilderAttestationAsset({
  getWalletProvider,
  assetId,
  linker = null,
  endUser = null,
  networkInfo = null,
} = {}) {
  const status = getBuilderAttestationRegistryStatus({ endUser, networkInfo });
  if (!status.canWrite) {
    return { ok: false, code: status.code, message: status.message, status };
  }
  let asset;
  try {
    asset = normalizeLinkableAssetAddress(assetId);
  } catch (e) {
    return { ok: false, code: 'invalid_address', message: e?.message || 'Invalid address', status };
  }
  if (!isBoingNativeAccountIdHex(asset)) {
    return {
      ok: false,
      code: 'boing_account_required',
      message: 'Claim needs a Boing 32-byte account id.',
      status,
    };
  }
  const provider = typeof getWalletProvider === 'function' ? getWalletProvider() : null;
  if (!provider?.request) {
    return {
      ok: false,
      code: 'no_provider',
      message: 'Connect Boing Express to continue.',
      status,
    };
  }
  if (!linker || !isBoingNativeAccountIdHex(linker)) {
    return {
      ok: false,
      code: 'no_sender',
      message: 'Connected Boing account required.',
      status,
    };
  }
  try {
    const calldata = status.sdk.encodeClaim(asset);
    const tx = buildTx(status.sdk, linker, status.registryId, calldata, [asset]);
    const txHash = await submitCall(provider, tx);
    return { ok: true, txHash, assetId: asset, registryId: status.registryId, status };
  } catch (e) {
    return {
      ok: false,
      code: 'submit_failed',
      message: formatBoingExpressRpcError(e) || e?.message || 'Claim failed',
      status,
    };
  }
}

/**
 * Claim both sides (if needed) then attest. Note hash defaults to zeros (chrome omits note).
 */
export async function attestAsBuilderOnChain({
  getWalletProvider,
  collectionId,
  tokenId,
  linker = null,
  endUser = null,
  networkInfo = null,
  noteHashHex = ZERO32,
  skipClaim = false,
} = {}) {
  const status = getBuilderAttestationRegistryStatus({ endUser, networkInfo });
  if (!status.canWrite) {
    return { ok: false, code: status.code, message: status.message, status };
  }
  let collection;
  let token;
  try {
    collection = normalizeLinkableAssetAddress(collectionId);
    token = normalizeLinkableAssetAddress(tokenId);
  } catch (e) {
    return { ok: false, code: 'invalid_address', message: e?.message || 'Invalid address', status };
  }
  if (!isBoingNativeAccountIdHex(collection) || !isBoingNativeAccountIdHex(token)) {
    return {
      ok: false,
      code: 'boing_account_required',
      message: 'Attest needs Boing 32-byte ids for both sides.',
      status,
    };
  }
  if (collection === token) {
    return {
      ok: false,
      code: 'same_address',
      message: 'Collection and token ids must differ.',
      status,
    };
  }

  const provider = typeof getWalletProvider === 'function' ? getWalletProvider() : null;
  if (!provider?.request) {
    return {
      ok: false,
      code: 'no_provider',
      message: 'Connect Boing Express to attest as builder.',
      status,
    };
  }
  if (!linker || !isBoingNativeAccountIdHex(linker)) {
    return {
      ok: false,
      code: 'no_sender',
      message: 'Connected Boing account required.',
      status,
    };
  }

  let noteHash = ZERO32;
  try {
    if (noteHashHex && String(noteHashHex).trim()) {
      noteHash = normalizeLinkableAssetAddress(noteHashHex);
    }
  } catch {
    noteHash = ZERO32;
  }

  const txHashes = [];
  try {
    if (!skipClaim && status.sdk.buildFlowTxs) {
      const flow = status.sdk.buildFlowTxs({
        senderHex32: linker,
        registryHex32: status.registryId,
        collectionHex32: collection,
        tokenHex32: token,
        noteHashHex32: noteHash,
      });
      for (const tx of flow) {
        txHashes.push(await submitCall(provider, tx));
      }
    } else {
      if (!skipClaim) {
        for (const asset of [collection, token]) {
          const calldata = status.sdk.encodeClaim(asset);
          txHashes.push(
            await submitCall(
              provider,
              buildTx(status.sdk, linker, status.registryId, calldata, [asset])
            )
          );
        }
      }
      const attestData = status.sdk.encodeAttest(collection, token, noteHash);
      txHashes.push(
        await submitCall(
          provider,
          buildTx(status.sdk, linker, status.registryId, attestData, [collection, token])
        )
      );
    }
    return {
      ok: true,
      txHash: txHashes[txHashes.length - 1] || null,
      txHashes,
      registryId: status.registryId,
      collectionId: collection,
      tokenId: token,
      status,
    };
  } catch (e) {
    return {
      ok: false,
      code: 'submit_failed',
      message: formatBoingExpressRpcError(e) || e?.message || 'Attest failed',
      txHashes,
      status,
    };
  }
}

/** Scan attestation slots; return active rows (optionally filtered). */
export async function listBuilderAttestationsOnChain({
  endUser = null,
  networkInfo = null,
  origin = null,
  filterCollectionId = null,
  filterTokenId = null,
  filterBuilderId = null,
  maxScan = 4096,
} = {}) {
  const status = getBuilderAttestationRegistryStatus({ endUser, networkInfo });
  if (!status.registryId) {
    return { ok: false, code: status.code, message: status.message, attestations: [] };
  }

  const countCall = await simulateRegistryReturnData({
    registryId: status.registryId,
    calldata: status.sdk.encodeCount(),
    origin,
  });
  if (!countCall.ok || !countCall.returnData) {
    return {
      ok: false,
      code: 'read_unavailable',
      message:
        countCall.message ||
        'Could not read builder attestations right now. Try again in a moment.',
      attestations: [],
      status,
    };
  }

  let count = Number(status.sdk.decodeCount(countCall.returnData));
  if (!Number.isFinite(count) || count < 0) count = 0;
  if (count > maxScan) count = maxScan;

  const filterC = filterCollectionId
    ? normalizeLinkableAssetAddress(filterCollectionId)
    : null;
  const filterT = filterTokenId ? normalizeLinkableAssetAddress(filterTokenId) : null;
  const filterB = filterBuilderId ? normalizeLinkableAssetAddress(filterBuilderId) : null;

  const attestations = [];
  for (let i = 0; i < count; i += 1) {
    const at = await simulateRegistryReturnData({
      registryId: status.registryId,
      calldata: status.sdk.encodeGetAt(i),
      origin,
    });
    if (!at.ok || !at.returnData) continue;
    let decoded;
    try {
      decoded = status.sdk.decodeGetAt(at.returnData);
    } catch {
      continue;
    }
    if (!decoded.active) continue;
    const collectionId = String(decoded.collectionHex).toLowerCase();
    const tokenId = String(decoded.tokenHex).toLowerCase();
    const builderId = String(decoded.builderHex).toLowerCase();
    if (filterC && collectionId !== filterC) continue;
    if (filterT && tokenId !== filterT) continue;
    if (filterB && builderId !== filterB) continue;
    attestations.push({
      index: i,
      collectionId,
      tokenId,
      builderId,
      noteHashHex: String(decoded.noteHashHex).toLowerCase(),
    });
  }

  return { ok: true, attestations, count, registryId: status.registryId, status };
}

/**
 * Active attestations for a pair. Clients show latest active per builder (OQ-3).
 */
export async function getBuilderAttestationsForPair({
  collectionId,
  tokenId,
  endUser = null,
  networkInfo = null,
  origin = null,
  builderId = null,
} = {}) {
  let collection;
  let token;
  try {
    collection = normalizeLinkableAssetAddress(collectionId);
    token = normalizeLinkableAssetAddress(tokenId);
  } catch (e) {
    return {
      ok: false,
      attested: false,
      code: 'invalid_address',
      message: e?.message || 'Invalid collection or token id',
      attestations: [],
      ownAttestation: null,
    };
  }
  if (!isBoingNativeAccountIdHex(collection) || !isBoingNativeAccountIdHex(token)) {
    return {
      ok: false,
      attested: false,
      code: 'boing_account_required',
      message: 'Builder checks need Boing 32-byte ids for both sides.',
      attestations: [],
      ownAttestation: null,
    };
  }

  const listed = await listBuilderAttestationsOnChain({
    endUser,
    networkInfo,
    origin,
    filterCollectionId: collection,
    filterTokenId: token,
  });
  if (!listed.ok) {
    return {
      ok: false,
      attested: false,
      code: listed.code,
      message: listed.message,
      attestations: [],
      ownAttestation: null,
      status: listed.status,
    };
  }

  // Latest active per builder (highest index wins).
  const byBuilder = new Map();
  for (const row of listed.attestations) {
    byBuilder.set(row.builderId, row);
  }
  const attestations = [...byBuilder.values()].sort((a, b) => b.index - a.index);
  const builder = builderId ? normalizeLinkableAssetAddress(builderId) : null;
  const ownAttestation =
    builder && isBoingNativeAccountIdHex(builder)
      ? attestations.find((r) => r.builderId === builder) || null
      : null;

  return {
    ok: true,
    attested: attestations.length > 0,
    attestations,
    ownAttestation,
    registryId: listed.registryId,
    status: listed.status,
    message: attestations.length
      ? 'Builder attested'
      : 'No active builder attestation for this project.',
  };
}

export async function revokeBuilderAttestationOnChain({
  getWalletProvider,
  index = null,
  collectionId = null,
  tokenId = null,
  linker = null,
  endUser = null,
  networkInfo = null,
} = {}) {
  const status = getBuilderAttestationRegistryStatus({ endUser, networkInfo });
  if (!status.canWrite) {
    return { ok: false, code: status.code, message: status.message, status };
  }

  const provider = typeof getWalletProvider === 'function' ? getWalletProvider() : null;
  if (!provider?.request) {
    return {
      ok: false,
      code: 'no_provider',
      message: 'Connect Boing Express to revoke an attestation.',
      status,
    };
  }
  if (!linker || !isBoingNativeAccountIdHex(linker)) {
    return {
      ok: false,
      code: 'no_sender',
      message: 'Connected Boing account required.',
      status,
    };
  }

  let slot = typeof index === 'number' && Number.isInteger(index) && index >= 0 ? index : null;
  if (slot == null) {
    if (!collectionId || !tokenId) {
      return {
        ok: false,
        code: 'missing_index',
        message: 'Pick an attestation to revoke.',
        status,
      };
    }
    const found = await getBuilderAttestationsForPair({
      collectionId,
      tokenId,
      endUser,
      networkInfo,
      origin: linker,
      builderId: linker,
    });
    if (!found.ok) {
      return { ok: false, code: found.code, message: found.message, status };
    }
    if (!found.ownAttestation) {
      return {
        ok: false,
        code: 'not_found',
        message: 'No active attestation from this wallet for this project.',
        status,
      };
    }
    slot = found.ownAttestation.index;
  }

  try {
    const calldata = status.sdk.encodeRevokeAt(slot);
    const txHash = await submitCall(
      provider,
      buildTx(status.sdk, linker, status.registryId, calldata)
    );
    return { ok: true, txHash, index: slot, registryId: status.registryId, status };
  } catch (e) {
    return {
      ok: false,
      code: 'submit_failed',
      message: formatBoingExpressRpcError(e) || e?.message || 'Revoke failed',
      status,
    };
  }
}
