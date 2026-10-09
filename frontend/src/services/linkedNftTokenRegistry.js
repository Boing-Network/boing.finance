/**
 * On-chain linked NFT collection ↔ fungible token registry (many-to-many, mutable).
 *
 * Authority is the registry contract — not soft-gate and not browser localStorage.
 * Calldata / list helpers come from boing-sdk when the on-chain registry PR lands
 * (boing.network #42 follow-up). Until then this module reports a clear blocked status
 * and refuses to invent selector bytes.
 *
 * Address resolution (first non-zero):
 * 1. SDK `resolveLinkedNftTokenRegistryAccountIdHex` / similar
 * 2. `REACT_APP_BOING_LINKED_NFT_TOKEN_REGISTRY` / `REACT_APP_BOING_NATIVE_VM_LINKED_NFT_TOKEN_REGISTRY`
 * 3. `boing_getNetworkInfo.end_user.canonical_linked_nft_token_registry` (when operators publish it)
 */

import * as boingSdk from 'boing-sdk';
import { isBoingNativeAccountIdHex } from '../utils/boingWalletDiscovery';
import { softGateSameDeployer, normalizeLinkableAssetAddress } from '../utils/linkedNftToken';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { getBoingNativeVmModuleId } from '../config/contracts';
import { boingExpressContractCallSignSimulateSubmit } from './boingExpressNativeTx';
import { nativeAccountsAccessListJson } from './nativeAmmAccessList';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';

const ZERO32 = `0x${'0'.repeat(64)}`;

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

/** Pick SDK encode/list helpers if the installed boing-sdk exports them. */
export function getLinkedNftTokenRegistrySdkApi() {
  const encodeRegister =
    boingSdk.encodeRegisterLinkedNftTokenPairCalldataHex ||
    boingSdk.encodeLinkedNftTokenRegisterCalldataHex ||
    boingSdk.encodeRegisterLinkedPairCalldataHex ||
    null;
  const encodeUnlink =
    boingSdk.encodeUnlinkLinkedNftTokenPairCalldataHex ||
    boingSdk.encodeLinkedNftTokenUnlinkCalldataHex ||
    boingSdk.encodeUnlinkLinkedPairCalldataHex ||
    null;
  const encodePeersCount =
    boingSdk.encodeLinkedNftTokenPeersCountCalldataHex ||
    boingSdk.encodeListLinkedNftTokenPeersCountCalldataHex ||
    null;
  const encodeGetPeerAt =
    boingSdk.encodeLinkedNftTokenGetPeerAtCalldataHex ||
    boingSdk.encodeGetLinkedNftTokenPeerAtCalldataHex ||
    null;
  const resolveRegistry =
    boingSdk.resolveLinkedNftTokenRegistryAccountIdHex ||
    boingSdk.resolveCanonicalLinkedNftTokenRegistryHex ||
    null;
  const parsePeersCount =
    boingSdk.parseLinkedNftTokenPeersCountReturn ||
    boingSdk.decodeLinkedNftTokenPeersCount ||
    null;
  const parsePeerAt =
    boingSdk.parseLinkedNftTokenPeerAtReturn ||
    boingSdk.decodeLinkedNftTokenPeerAt ||
    null;
  return {
    encodeRegister: typeof encodeRegister === 'function' ? encodeRegister : null,
    encodeUnlink: typeof encodeUnlink === 'function' ? encodeUnlink : null,
    encodePeersCount: typeof encodePeersCount === 'function' ? encodePeersCount : null,
    encodeGetPeerAt: typeof encodeGetPeerAt === 'function' ? encodeGetPeerAt : null,
    resolveRegistry: typeof resolveRegistry === 'function' ? resolveRegistry : null,
    parsePeersCount: typeof parsePeersCount === 'function' ? parsePeersCount : null,
    parsePeerAt: typeof parsePeerAt === 'function' ? parsePeerAt : null,
  };
}

/**
 * @param {{ endUser?: Record<string, unknown>|null, networkInfo?: Record<string, unknown>|null }} [opts]
 */
export function resolveLinkedNftTokenRegistryId(opts = {}) {
  const sdk = getLinkedNftTokenRegistrySdkApi();
  if (sdk.resolveRegistry) {
    try {
      const fromSdk = normalizeRegistryId(sdk.resolveRegistry(opts));
      if (fromSdk) return { registryId: fromSdk, source: 'sdk' };
    } catch {
      /* fall through */
    }
  }
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
 * Capability gate for UI + submits.
 * @returns {{
 *   canWrite: boolean,
 *   canRead: boolean,
 *   registryId: string|null,
 *   registrySource: string|null,
 *   code: 'ready'|'registry_unpublished'|'sdk_helpers_pending',
 *   message: string,
 *   sdk: ReturnType<typeof getLinkedNftTokenRegistrySdkApi>,
 * }}
 */
export function getLinkedNftTokenRegistryStatus(opts = {}) {
  const sdk = getLinkedNftTokenRegistrySdkApi();
  const { registryId, source } = resolveLinkedNftTokenRegistryId(opts);
  const hasWriteEncoders = Boolean(sdk.encodeRegister && sdk.encodeUnlink);
  const hasReadEncoders = Boolean(sdk.encodePeersCount && sdk.encodeGetPeerAt);

  if (!registryId) {
    return {
      canWrite: false,
      canRead: false,
      registryId: null,
      registrySource: null,
      code: 'registry_unpublished',
      message:
        'On-chain linked NFT↔token registry is not published yet. Set REACT_APP_BOING_LINKED_NFT_TOKEN_REGISTRY or wait for end_user.canonical_linked_nft_token_registry + boing-sdk registry helpers (network PR #42 follow-up). Soft-gate alone is not enough.',
      sdk,
    };
  }
  if (!hasWriteEncoders) {
    return {
      canWrite: false,
      canRead: hasReadEncoders,
      registryId,
      registrySource: source,
      code: 'sdk_helpers_pending',
      message:
        `Registry id resolved (${registryId.slice(0, 12)}… via ${source}), but this boing-sdk build has no on-chain register/unlink calldata helpers yet. Blocked until the SDK on-chain registry API lands.`,
      sdk,
    };
  }
  return {
    canWrite: true,
    canRead: hasReadEncoders,
    registryId,
    registrySource: source,
    code: 'ready',
    message: 'Registry ready for on-chain register / unlink.',
    sdk,
  };
}

function accessListFor(accounts) {
  const list = nativeAccountsAccessListJson(accounts);
  return list ? { access_list: list } : {};
}

/**
 * Register a mutable many-to-many edge on the registry (enforced).
 * Soft-gate may warn; it does not authorize the link.
 */
export async function registerLinkedNftTokenPairOnChain({
  getWalletProvider,
  collectionId,
  tokenId,
  linker = null,
  endUser = null,
  networkInfo = null,
  acknowledgeSoftGate = false,
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
      message: 'On-chain registry links require Boing 32-byte AccountIds (not EVM 20-byte addresses).',
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
      message: 'Connect Boing Express to submit the registry transaction.',
      status,
    };
  }

  let calldata;
  try {
    calldata = status.sdk.encodeRegister(collection, token);
  } catch (e) {
    return {
      ok: false,
      code: 'encode_failed',
      message: e?.message || 'Failed to encode register calldata',
      status,
    };
  }

  try {
    const txHash = await boingExpressContractCallSignSimulateSubmit(provider, {
      type: 'contract_call',
      contract: status.registryId,
      calldata,
      ...accessListFor([linker, status.registryId, collection, token].filter(Boolean)),
    });
    return {
      ok: true,
      txHash,
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
      status,
    };
  }
}

export async function unlinkLinkedNftTokenPairOnChain({
  getWalletProvider,
  collectionId,
  tokenId,
  linker = null,
  endUser = null,
  networkInfo = null,
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

  const provider = typeof getWalletProvider === 'function' ? getWalletProvider() : null;
  if (!provider?.request) {
    return {
      ok: false,
      code: 'no_provider',
      message: 'Connect Boing Express to submit the unlink transaction.',
      status,
    };
  }

  let calldata;
  try {
    calldata = status.sdk.encodeUnlink(collection, token);
  } catch (e) {
    return {
      ok: false,
      code: 'encode_failed',
      message: e?.message || 'Failed to encode unlink calldata',
      status,
    };
  }

  try {
    const txHash = await boingExpressContractCallSignSimulateSubmit(provider, {
      type: 'contract_call',
      contract: status.registryId,
      calldata,
      ...accessListFor([linker, status.registryId, collection, token].filter(Boolean)),
    });
    return {
      ok: true,
      txHash,
      registryId: status.registryId,
      collectionId: collection,
      tokenId: token,
      status,
    };
  } catch (e) {
    return {
      ok: false,
      code: 'submit_failed',
      message: formatBoingExpressRpcError(e) || e?.message || 'Registry unlink failed',
      status,
    };
  }
}

/**
 * Read peers for an asset from the registry when SDK list helpers exist.
 * @returns {Promise<{ ok: boolean, peers?: string[], message?: string, code?: string }>}
 */
export async function listLinkedNftTokenPeersOnChain({
  assetId,
  role = 'nft_collection',
  endUser = null,
  networkInfo = null,
  rpcCall = null,
} = {}) {
  const status = getLinkedNftTokenRegistryStatus({ endUser, networkInfo });
  if (!status.registryId) {
    return { ok: false, code: status.code, message: status.message, peers: [] };
  }
  if (!status.sdk.encodePeersCount || !status.sdk.encodeGetPeerAt) {
    return {
      ok: false,
      code: 'sdk_helpers_pending',
      message:
        'Registry id may be set, but peer-list read helpers are not in this boing-sdk build yet.',
      peers: [],
    };
  }
  if (typeof rpcCall !== 'function') {
    return {
      ok: false,
      code: 'rpc_required',
      message: 'Peer listing requires an RPC simulate/call helper once SDK list ABI is final.',
      peers: [],
    };
  }
  // Placeholder wiring: when SDK lands, callers pass rpcCall(contract, calldata) → return hex.
  try {
    const id = normalizeLinkableAssetAddress(assetId);
    const countCalldata = status.sdk.encodePeersCount(id, role);
    const countRaw = await rpcCall(status.registryId, countCalldata);
    const count = status.sdk.parsePeersCount
      ? status.sdk.parsePeersCount(countRaw)
      : Number.parseInt(String(countRaw).replace(/^0x/i, '').slice(-16), 16) || 0;
    const peers = [];
    for (let i = 0; i < count; i += 1) {
      const peerRaw = await rpcCall(status.registryId, status.sdk.encodeGetPeerAt(id, role, i));
      const peer = status.sdk.parsePeerAt
        ? status.sdk.parsePeerAt(peerRaw)
        : normalizeLinkableAssetAddress(peerRaw);
      if (peer) peers.push(peer);
    }
    return { ok: true, peers, registryId: status.registryId };
  } catch (e) {
    return {
      ok: false,
      code: 'read_failed',
      message: e?.message || 'Failed to list registry peers',
      peers: [],
    };
  }
}
