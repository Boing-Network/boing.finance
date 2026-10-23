/**
 * On-chain linked NFT collection ↔ fungible token registry (many-to-many, mutable).
 *
 * Prefer boing-sdk helpers (`linkedNftTokenRegistry.ts` from network PR #42). Local encode
 * fallbacks match selectors 0xE0–0xE6 until that SDK lands on main.
 *
 * Auth: claimer of both sides. Registry v2: assets deployed on boing.finance claim themselves for their creator
 * in their deploy tx (claim_self 0xE7), so linking is a single register_link; an unclaimed pre-v2 asset can be
 * claimed (claim_asset) only by its recorded deployer (get_asset_deployer 0xE8). Unlink via unlink_at(index).
 *
 * Registry AccountId: env `REACT_APP_BOING_LINKED_NFT_TOKEN_REGISTRY`, contracts nativeVm,
 * or `end_user.canonical_linked_nft_token_registry`. CREATE2 salt `BOING_NFT_TOKEN_LINK_REG_V2` (v1: `_V1`).
 */

import * as boingSdk from '@boing-network/boing-sdk';
import { isBoingNativeAccountIdHex } from '../utils/boingWalletDiscovery';
import { softGateSameDeployer, normalizeLinkableAssetAddress } from '../utils/linkedNftToken';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { getBoingNativeVmModuleId } from '../config/contracts';
import { boingExpressContractCallSignSimulateSubmit } from './boingExpressNativeTx';
import { tryBoingUnsignedContractSimulate } from './boingNativeVm';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';
import { boingJsonRpc } from './boingTestnetRpc';
import {
  LINK_BATCH_MAX_STEPS,
  buildLinkBatchTx,
  decodeClaimerReturnData,
  decodeDeployerReturnData,
  isWalletBatchUnsupportedError,
  planLinkSteps,
  shouldUseLinkBatch,
} from '../utils/linkedNftLinkBatch';

const ZERO32 = `0x${'0'.repeat(64)}`;

/** Local fallbacks (mirror SDK) when installed boing-sdk lacks registry exports. */
const SELECTOR_CLAIM = 0xe0;
const SELECTOR_REGISTER = 0xe1;
const SELECTOR_UNLINK_AT = 0xe2;
const SELECTOR_LINKS_COUNT = 0xe3;
const SELECTOR_GET_LINK_AT = 0xe4;
const SELECTOR_GET_CLAIMER = 0xe5;
const SELECTOR_GET_DEPLOYER = 0xe8;

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

function localEncodeGetDeployer(asset) {
  return bytesToHex(concatWords([selectorWord(SELECTOR_GET_DEPLOYER), hex32ToBytes(asset)]));
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
  const encodeGetDeployer =
    pickFn(boingSdk.encodeLinkedNftTokenGetAssetDeployerCalldataHex) || localEncodeGetDeployer;
  const decodeCount =
    pickFn(boingSdk.decodeLinkedNftTokenLinksCountReturnData) || localDecodeCount;
  const decodeLinkAt =
    pickFn(boingSdk.decodeLinkedNftTokenGetLinkAtReturnData) || localDecodeLinkAt;
  const buildFlowTxs = pickFn(boingSdk.buildLinkedNftTokenRegisterFlowTxs);
  const buildCallTx = pickFn(boingSdk.buildLinkedNftTokenRegistryContractCallTx);
  const create2SaltHex =
    boingSdk.LINKED_NFT_TOKEN_REGISTRY_CREATE2_SALT_V2_HEX ||
    (() => {
      const u8 = new Uint8Array(32);
      u8.set(new TextEncoder().encode('BOING_NFT_TOKEN_LINK_REG_V2'));
      return bytesToHex(u8);
    })();

  return {
    encodeClaim,
    encodeRegister,
    encodeUnlinkAt,
    encodeLinksCount,
    encodeGetLinkAt,
    encodeGetClaimer,
    encodeGetDeployer,
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
 * Registry a NEW collection / token claims itself in from its deploy init code (registry v2 `claim_self`):
 * the configured registry, else the SDK canonical testnet registry (Boing L1 testnet is the only Boing chain
 * the app deploys to). Null only when neither resolves.
 * @returns {string | null}
 */
export function resolveLinkedNftTokenClaimRegistryHex(opts = {}) {
  try {
    const { registryId } = resolveLinkedNftTokenRegistryId(opts);
    if (registryId) return registryId;
  } catch {
    /* fall through */
  }
  return normalizeRegistryId(boingSdk.CANONICAL_BOING_TESTNET_LINKED_NFT_TOKEN_REGISTRY_HEX) || null;
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
        'Set REACT_APP_BOING_LINKED_NFT_TOKEN_REGISTRY to the registry AccountId (CREATE2 salt BOING_NFT_TOKEN_LINK_REG_V2), or wait for end_user.canonical_linked_nft_token_registry. Claimer of both assets can register_link / unlink_at.',
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
      ? 'Registry ready (boing-sdk encode helpers). Assets created here are already claimed by their creator; register_link.'
      : 'Registry ready (local encode fallback). Assets created here are already claimed by their creator; register_link.',
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

/** Registry v2 deployer record per asset (null = none, undefined = unknown / v1 registry). */
async function readAssetDeployers(status, assets) {
  const out = {};
  for (const a of assets) {
    try {
      const r = await simulateRegistryReturnData({ registryId: status.registryId, calldata: status.sdk.encodeGetDeployer(a) });
      out[a] = r.ok ? decodeDeployerReturnData(r.returnData) : undefined;
    } catch {
      out[a] = undefined;
    }
  }
  return out;
}

/** Current registry claimer per asset (null = unclaimed, undefined = unknown because simulate is unavailable). */
async function readAssetClaimers(status, assets) {
  const out = {};
  for (const a of assets) {
    try {
      const r = await simulateRegistryReturnData({ registryId: status.registryId, calldata: status.sdk.encodeGetClaimer(a) });
      out[a] = r.ok ? decodeClaimerReturnData(r.returnData) : undefined;
    } catch {
      out[a] = undefined;
    }
  }
  return out;
}

/** `boing_health.rpc_surface` batch capability (false on older nodes / errors). */
export async function nodeBatchSupport() {
  try {
    const h = await boingJsonRpc('boing_health', []);
    const nodeBatch =
      typeof boingSdk.nodeSupportsNativeBatch === 'function'
        ? boingSdk.nodeSupportsNativeBatch(h)
        : h?.rpc_surface?.tx_payload_batch === true;
    const maxSteps =
      typeof boingSdk.nodeBatchMaxCalls === 'function'
        ? boingSdk.nodeBatchMaxCalls(h)
        : Number(h?.rpc_surface?.tx_batch_max_calls) || LINK_BATCH_MAX_STEPS;
    return { nodeBatch, maxSteps };
  } catch {
    return { nodeBatch: false, maxSteps: LINK_BATCH_MAX_STEPS };
  }
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
  // Registry v2: say why up front instead of letting a doomed claim fail on chain.
  const me = String(linker).toLowerCase();
  const claimer = (await readAssetClaimers(status, [asset]))[asset];
  if (claimer && claimer.toLowerCase() === me) {
    return { ok: true, txHash: null, alreadyClaimed: true, assetId: asset, registryId: status.registryId, status };
  }
  if (claimer) {
    return {
      ok: false,
      code: 'claimed_by_other',
      message: `This asset is already claimed in the registry by ${claimer.slice(0, 10)}…, not your connected account.`,
      status,
    };
  }
  if (claimer === null) {
    const deployer = (await readAssetDeployers(status, [asset]))[asset];
    if (deployer !== undefined && (deployer === null || deployer.toLowerCase() !== me)) {
      return {
        ok: false,
        code: 'not_claimable',
        message: deployer
          ? `Only the account that created this asset (${deployer.slice(0, 10)}…) can claim it.`
          : 'This asset has no recorded creator, so it cannot be claimed. Assets created on boing.finance are claimed automatically when deployed.',
        status,
      };
    }
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
  let batched = false;
  let steps = [];
  try {
    // Skip claims the linker already holds (the old flow re-sent them every time), refuse early when
    // another account holds a side, then send every remaining step as ONE native batch tx.
    const claimers = skipClaim
      ? { [collection]: linker, [token]: linker }
      : await readAssetClaimers(status, [collection, token]);
    const unclaimed = [collection, token].filter((x) => claimers[x] === null);
    const deployers = unclaimed.length ? await readAssetDeployers(status, unclaimed) : {};
    const plan = planLinkSteps({
      linker,
      registryId: status.registryId,
      collection,
      token,
      claimers,
      deployers,
      encodeClaim: status.sdk.encodeClaim,
      encodeRegister: status.sdk.encodeRegister,
    });
    if (!plan.ok) {
      return { ok: false, code: plan.code, message: plan.message, txHashes, status };
    }
    steps = plan.steps;
    const support = await nodeBatchSupport();
    if (shouldUseLinkBatch(steps.length, support)) {
      const batchTx = buildLinkBatchTx({
        linker,
        registryId: status.registryId,
        steps,
        assets: [collection, token],
      });
      try {
        txHashes.push(await submitCall(provider, batchTx));
        batched = true;
      } catch (e) {
        // Older Boing Express builds cannot sign `batch`: fall back to one tx per step.
        if (!isWalletBatchUnsupportedError(e)) throw e;
      }
    }
    if (!batched) {
      for (const s of steps) {
        const extra = s.label === 'Register link' ? [collection, token] : s.label === 'Claim collection' ? [collection] : [token];
        txHashes.push(await submitCall(provider, buildTx(status.sdk, linker, status.registryId, s.calldata, extra)));
      }
    }    return {
      ok: true,
      txHash: txHashes[txHashes.length - 1] || null,
      txHashes,
      batched,
      steps: steps.map((s) => s.label),
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
 * True when the collection↔token pair has an active on-chain companion link.
 * Authority is the registry scan — not soft-gate or local wizard flags.
 */
export async function areCompanionsLinkedOnChain({
  collectionId,
  tokenId,
  endUser = null,
  networkInfo = null,
  origin = null,
} = {}) {
  let collection;
  let token;
  try {
    collection = normalizeLinkableAssetAddress(collectionId);
    token = normalizeLinkableAssetAddress(tokenId);
  } catch (e) {
    return {
      ok: false,
      linked: false,
      code: 'invalid_address',
      message: e?.message || 'Invalid collection or token id',
      links: [],
    };
  }
  if (!isBoingNativeAccountIdHex(collection) || !isBoingNativeAccountIdHex(token)) {
    return {
      ok: false,
      linked: false,
      code: 'boing_account_required',
      message: 'Companion checks need Boing 32-byte ids for both sides.',
      links: [],
    };
  }
  if (collection === token) {
    return {
      ok: false,
      linked: false,
      code: 'same_address',
      message: 'Collection and token must differ.',
      links: [],
    };
  }

  const listed = await listLinkedNftTokenLinksOnChain({
    endUser,
    networkInfo,
    origin,
    filterCollectionId: collection,
    filterTokenId: token,
  });
  if (!listed.ok) {
    return {
      ok: false,
      linked: false,
      code: listed.code || 'read_unavailable',
      message: listed.message || 'Could not verify companions on-chain.',
      links: [],
      status: listed.status,
    };
  }
  const links = listed.links || [];
  return {
    ok: true,
    linked: links.length > 0,
    code: links.length > 0 ? 'linked' : 'not_linked',
    message:
      links.length > 0
        ? 'Companions are linked on-chain.'
        : 'These are not linked as companions yet.',
    links,
    count: listed.count,
    registryId: listed.registryId,
    status: listed.status,
  };
}

/**
 * Deep-link to Create pool with a project companion gate.
 * Plain Create pool (no query) stays ungated.
 */
export function buildProjectPoolPath({ collectionId, tokenId } = {}) {
  const params = new URLSearchParams();
  if (collectionId) params.set('collection', String(collectionId).trim());
  if (tokenId) params.set('token', String(tokenId).trim());
  params.set('requireCompanions', '1');
  const q = params.toString();
  return q ? `/create-pool?${q}` : '/create-pool';
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
