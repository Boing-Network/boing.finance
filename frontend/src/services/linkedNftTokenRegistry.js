/**
 * On-chain linked NFT collection ↔ fungible token registry (many-to-many, mutable).
 *
 * Prefer boing-sdk helpers (`linkedNftTokenRegistry.ts` from network PR #42). Local encode
 * fallbacks match selectors 0xE0–0xE6 until that SDK lands on main.
 *
 * Auth: claimer of both sides. Flow: claim_asset ×2 → register_link; unlink via unlink_at(index).
 *
 * Registry AccountId: env `REACT_APP_BOING_LINKED_NFT_TOKEN_REGISTRY`, contracts nativeVm,
 * or `end_user.canonical_linked_nft_token_registry`. CREATE2 salt `BOING_NFT_TOKEN_LINK_REG_V1`.
 */

import * as boingSdk from 'boing-sdk';
import { isBoingNativeAccountIdHex } from '../utils/boingWalletDiscovery';
import { softGateSameDeployer, normalizeLinkableAssetAddress } from '../utils/linkedNftToken';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { getBoingNativeVmModuleId } from '../config/contracts';
import { boingExpressContractCallSignSimulateSubmit } from './boingExpressNativeTx';
import { tryBoingUnsignedContractSimulate } from './boingNativeVm';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';

const ZERO32 = `0x${'0'.repeat(64)}`;

/** Local fallbacks (mirror SDK) when installed boing-sdk lacks registry exports. */
const SELECTOR_CLAIM = 0xe0;
const SELECTOR_REGISTER = 0xe1;
const SELECTOR_UNLINK_AT = 0xe2;
const SELECTOR_LINKS_COUNT = 0xe3;
const SELECTOR_GET_LINK_AT = 0xe4;
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
function localEncodeRegister(collection, token) {
  return bytesToHex(
    concatWords([selectorWord(SELECTOR_REGISTER), hex32ToBytes(collection), hex32ToBytes(token)])
  );
}
function localEncodeUnlinkAt(index) {
  return bytesToHex(concatWords([selectorWord(SELECTOR_UNLINK_AT), u64Word(index)]));
}
function localEncodeLinksCount() {
  return bytesToHex(selectorWord(SELECTOR_LINKS_COUNT));
}
function localEncodeGetLinkAt(index) {
  return bytesToHex(concatWords([selectorWord(SELECTOR_GET_LINK_AT), u64Word(index)]));
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

function localDecodeLinkAt(returnDataHex) {
  const raw = String(returnDataHex || '')
    .replace(/^0x/i, '')
    .toLowerCase();
  if (raw.length < 128) throw new Error('get_link_at return data: expected 64 bytes');
  const collectionHex = `0x${raw.slice(0, 64)}`;
  const tokenHex = `0x${raw.slice(64, 128)}`;
  return {
    collectionHex,
    tokenHex,
    active: collectionHex !== ZERO32 && tokenHex !== ZERO32,
  };
}

function envRegistryHex() {
  const raw =
    process.env.REACT_APP_BOING_LINKED_NFT_TOKEN_REGISTRY ||
    process.env.REACT_APP_BOING_NATIVE_VM_LINKED_NFT_TOKEN_REGISTRY ||
    process.env.VITE_BOING_LINKED_NFT_TOKEN_REGISTRY ||
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
export function getLinkedNftTokenRegistrySdkApi() {
  const encodeClaim =
    pickFn(boingSdk.encodeLinkedNftTokenClaimAssetCalldataHex) || localEncodeClaim;
  const encodeRegister =
    pickFn(boingSdk.encodeLinkedNftTokenRegisterLinkCalldataHex) || localEncodeRegister;
  const encodeUnlinkAt =
    pickFn(boingSdk.encodeLinkedNftTokenUnlinkAtCalldataHex) || localEncodeUnlinkAt;
  const encodeLinksCount =
    pickFn(boingSdk.encodeLinkedNftTokenLinksCountCalldataHex) || localEncodeLinksCount;
  const encodeGetLinkAt =
    pickFn(boingSdk.encodeLinkedNftTokenGetLinkAtCalldataHex) || localEncodeGetLinkAt;
  const encodeGetClaimer =
    pickFn(boingSdk.encodeLinkedNftTokenGetAssetClaimerCalldataHex) || localEncodeGetClaimer;
  const decodeCount =
    pickFn(boingSdk.decodeLinkedNftTokenLinksCountReturnData) || localDecodeCount;
  const decodeLinkAt =
    pickFn(boingSdk.decodeLinkedNftTokenGetLinkAtReturnData) || localDecodeLinkAt;
  const buildFlowTxs = pickFn(boingSdk.buildLinkedNftTokenRegisterFlowTxs);
  const buildCallTx = pickFn(boingSdk.buildLinkedNftTokenRegistryContractCallTx);
  const create2SaltHex =
    boingSdk.LINKED_NFT_TOKEN_REGISTRY_CREATE2_SALT_V1_HEX ||
    (() => {
      const u8 = new Uint8Array(32);
      u8.set(new TextEncoder().encode('BOING_NFT_TOKEN_LINK_REG_V1'));
      return bytesToHex(u8);
    })();

  return {
    encodeClaim,
    encodeRegister,
    encodeUnlinkAt,
    encodeLinksCount,
    encodeGetLinkAt,
    encodeGetClaimer,
    decodeCount,
    decodeLinkAt,
    buildFlowTxs,
    buildCallTx,
    create2SaltHex,
    fromSdk: typeof boingSdk.encodeLinkedNftTokenRegisterLinkCalldataHex === 'function',
  };
}

/**
 * @param {{ endUser?: Record<string, unknown>|null, networkInfo?: Record<string, unknown>|null }} [opts]
 */
export function resolveLinkedNftTokenRegistryId(opts = {}) {
  const fromEnv = normalizeRegistryId(envRegistryHex());
  if (fromEnv) return { registryId: fromEnv, source: 'env' };

  try {
    const fromContracts = normalizeRegistryId(
      getBoingNativeVmModuleId(BOING_NATIVE_L1_CHAIN_ID, 'linkedNftTokenRegistry')
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
      endUser.canonical_linked_nft_token_registry,
      endUser.canonical_native_linked_nft_token_registry,
      endUser.linked_nft_token_registry,
    ];
    for (const c of candidates) {
      const id = normalizeRegistryId(c);
      if (id) return { registryId: id, source: 'network_info' };
    }
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
 *   sdk: ReturnType<typeof getLinkedNftTokenRegistrySdkApi>,
 * }}
 */
export function getLinkedNftTokenRegistryStatus(opts = {}) {
  const sdk = getLinkedNftTokenRegistrySdkApi();
  const { registryId, source } = resolveLinkedNftTokenRegistryId(opts);
  if (!registryId) {
    return {
      canWrite: false,
      canRead: false,
      registryId: null,
      registrySource: null,
      code: 'registry_unpublished',
      message:
        'Set REACT_APP_BOING_LINKED_NFT_TOKEN_REGISTRY to the registry AccountId (CREATE2 salt BOING_NFT_TOKEN_LINK_REG_V1), or wait for end_user.canonical_linked_nft_token_registry. Claimer of both assets can register_link / unlink_at.',
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
      ? 'Registry ready (boing-sdk encode helpers). Claim both assets, then register_link.'
      : 'Registry ready (local 0xE0–0xE6 encode fallback until SDK merge). Claim both assets, then register_link.',
    sdk,
  };
}

function buildTx(sdk, sender, registryId, calldata, extraAccounts = []) {
  if (sdk.buildCallTx) {
    return sdk.buildCallTx(sender, registryId, calldata);
  }
  const accounts = [sender, registryId, ...extraAccounts].filter(Boolean).map((a) => String(a).toLowerCase());
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

/**
 * Read-only registry call → return_data hex.
 * Prefers unsigned simulate; returns null when unavailable.
 */
export async function simulateRegistryReturnData({
  registryId,
  calldata,
  origin = null,
} = {}) {
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

export async function claimLinkedNftTokenAsset({
  getWalletProvider,
  assetId,
  linker = null,
  endUser = null,
  networkInfo = null,
} = {}) {
  const status = getLinkedNftTokenRegistryStatus({ endUser, networkInfo });
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
      message: 'claim_asset requires a Boing 32-byte AccountId.',
      status,
    };
  }
  const provider = typeof getWalletProvider === 'function' ? getWalletProvider() : null;
  if (!provider?.request) {
    return {
      ok: false,
      code: 'no_provider',
      message: 'Connect Boing Express to claim the asset.',
      status,
    };
  }
  if (!linker || !isBoingNativeAccountIdHex(linker)) {
    return {
      ok: false,
      code: 'no_sender',
      message: 'Connected Boing account required as claimer.',
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
      message: formatBoingExpressRpcError(e) || e?.message || 'claim_asset failed',
      status,
    };
  }
}

/**
 * Claim both sides (if needed) then register_link. Soft-gate may warn; registry enforces claimers.
 */
export async function registerLinkedNftTokenPairOnChain({
  getWalletProvider,
  collectionId,
  tokenId,
  linker = null,
  endUser = null,
  networkInfo = null,
  acknowledgeSoftGate = false,
  skipClaim = false,
} = {}) {
  const status = getLinkedNftTokenRegistryStatus({ endUser, networkInfo });
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
      message: 'On-chain registry links require Boing 32-byte AccountIds.',
      status,
    };
  }
  if (collection === token) {
    return {
      ok: false,
      code: 'same_address',
      message: 'Collection and token AccountIds must differ.',
      status,
    };
  }

  const softWarn = softGateSameDeployer({ collectionId: collection, tokenId: token, linker });
  if (softWarn && !acknowledgeSoftGate) {
    return {
      ok: false,
      code: 'soft_gate',
      message: softWarn,
      softGateWarning: softWarn,
      status,
    };
  }

  const provider = typeof getWalletProvider === 'function' ? getWalletProvider() : null;
  if (!provider?.request) {
    return {
      ok: false,
      code: 'no_provider',
      message: 'Connect Boing Express to submit registry transactions.',
      status,
    };
  }
  if (!linker || !isBoingNativeAccountIdHex(linker)) {
    return {
      ok: false,
      code: 'no_sender',
      message: 'Connected Boing account required (must be claimer of both assets).',
      status,
    };
  }

  const txHashes = [];
  try {
    if (!skipClaim && status.sdk.buildFlowTxs) {
      const flow = status.sdk.buildFlowTxs({
        senderHex32: linker,
        registryHex32: status.registryId,
        collectionHex32: collection,
        tokenHex32: token,
      });
      for (const tx of flow) {
        txHashes.push(await submitCall(provider, tx));
      }
    } else {
      if (!skipClaim) {
        for (const asset of [collection, token]) {
          const calldata = status.sdk.encodeClaim(asset);
          txHashes.push(
            await submitCall(provider, buildTx(status.sdk, linker, status.registryId, calldata, [asset]))
          );
        }
      }
      const regData = status.sdk.encodeRegister(collection, token);
      txHashes.push(
        await submitCall(
          provider,
          buildTx(status.sdk, linker, status.registryId, regData, [collection, token])
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
      softGateWarning: softWarn || null,
      status,
    };
  } catch (e) {
    return {
      ok: false,
      code: 'submit_failed',
      message: formatBoingExpressRpcError(e) || e?.message || 'Registry register failed',
      txHashes,
      status,
    };
  }
}

/** Scan registry slots; return active links (optionally filtered). */
export async function listLinkedNftTokenLinksOnChain({
  endUser = null,
  networkInfo = null,
  origin = null,
  filterCollectionId = null,
  filterTokenId = null,
  maxScan = 4096,
} = {}) {
  const status = getLinkedNftTokenRegistryStatus({ endUser, networkInfo });
  if (!status.registryId) {
    return { ok: false, code: status.code, message: status.message, links: [] };
  }

  const countCall = await simulateRegistryReturnData({
    registryId: status.registryId,
    calldata: status.sdk.encodeLinksCount(),
    origin,
  });
  if (!countCall.ok || !countCall.returnData) {
    return {
      ok: false,
      code: 'read_unavailable',
      message:
        countCall.message ||
        'Set REACT_APP_BOING_RPC_UNSIGNED_SIMULATE_METHOD=boing_simulateContractCall to query links_count / get_link_at.',
      links: [],
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

  const links = [];
  for (let i = 0; i < count; i += 1) {
    const at = await simulateRegistryReturnData({
      registryId: status.registryId,
      calldata: status.sdk.encodeGetLinkAt(i),
      origin,
    });
    if (!at.ok || !at.returnData) continue;
    let decoded;
    try {
      decoded = status.sdk.decodeLinkAt(at.returnData);
    } catch {
      continue;
    }
    if (!decoded.active) continue;
    const collectionId = String(decoded.collectionHex).toLowerCase();
    const tokenId = String(decoded.tokenHex).toLowerCase();
    if (filterC && collectionId !== filterC) continue;
    if (filterT && tokenId !== filterT) continue;
    links.push({ index: i, collectionId, tokenId });
  }

  return { ok: true, links, count, registryId: status.registryId, status };
}

/**
 * Unlink by pair: scan for index, then unlink_at.
 * Or pass `index` directly.
 */
export async function unlinkLinkedNftTokenPairOnChain({
  getWalletProvider,
  collectionId = null,
  tokenId = null,
  index = null,
  linker = null,
  endUser = null,
  networkInfo = null,
} = {}) {
  const status = getLinkedNftTokenRegistryStatus({ endUser, networkInfo });
  if (!status.canWrite) {
    return { ok: false, code: status.code, message: status.message, status };
  }

  const provider = typeof getWalletProvider === 'function' ? getWalletProvider() : null;
  if (!provider?.request) {
    return {
      ok: false,
      code: 'no_provider',
      message: 'Connect Boing Express to submit unlink_at.',
      status,
    };
  }
  if (!linker || !isBoingNativeAccountIdHex(linker)) {
    return {
      ok: false,
      code: 'no_sender',
      message: 'Connected Boing account required (must be claimer of both assets).',
      status,
    };
  }

  let slot = index;
  if (slot == null) {
    if (!collectionId || !tokenId) {
      return {
        ok: false,
        code: 'need_pair_or_index',
        message: 'Provide collection+token or a registry slot index.',
        status,
      };
    }
    const listed = await listLinkedNftTokenLinksOnChain({
      endUser,
      networkInfo,
      origin: linker,
      filterCollectionId: collectionId,
      filterTokenId: tokenId,
    });
    if (!listed.ok) {
      return {
        ok: false,
        code: listed.code || 'scan_failed',
        message: listed.message || 'Could not scan registry for unlink index.',
        status,
      };
    }
    const hit = listed.links[0];
    if (!hit) {
      return {
        ok: false,
        code: 'not_found',
        message: 'No active registry slot for that collection↔token pair.',
        status,
      };
    }
    slot = hit.index;
  }

  try {
    const calldata = status.sdk.encodeUnlinkAt(Number(slot));
    const tx = buildTx(status.sdk, linker, status.registryId, calldata);
    const txHash = await submitCall(provider, tx);
    return {
      ok: true,
      txHash,
      index: Number(slot),
      registryId: status.registryId,
      status,
    };
  } catch (e) {
    return {
      ok: false,
      code: 'submit_failed',
      message: formatBoingExpressRpcError(e) || e?.message || 'unlink_at failed',
      status,
    };
  }
}

/** @deprecated use registerLinkedNftTokenPairOnChain */
export const registerLinkedNftTokenPair = registerLinkedNftTokenPairOnChain;
/** @deprecated use unlinkLinkedNftTokenPairOnChain */
export const unlinkLinkedNftTokenPair = unlinkLinkedNftTokenPairOnChain;
