/**
 * Linked NFT collection ↔ fungible token helpers.
 *
 * **Authority:** on-chain registry (`services/linkedNftTokenRegistry.js`). Soft-gate and
 * optional schema/metadata helpers are not a substitute for registry reads/writes.
 *
 * Prefer boing-sdk exports when present (schema + future registry encoders).
 */
import { blake3 } from '@noble/hashes/blake3';
import { bytesToHex } from '@noble/hashes/utils';
import * as boingSdk from 'boing-sdk';
import { isBoingNativeAccountIdHex } from './boingWalletDiscovery';

const DEPLOYER_HINTS_KEY = 'boing.finance.asset_deployer_hints.v1';

const sdkNormalize =
  typeof boingSdk.normalizeLinkedNftToken === 'function' ? boingSdk.normalizeLinkedNftToken : null;
const sdkHash =
  typeof boingSdk.descriptionHashHexFromLinkedNftToken === 'function'
    ? boingSdk.descriptionHashHexFromLinkedNftToken
    : null;
const sdkDecode =
  typeof boingSdk.decodeLinkedNftTokenJson === 'function' ? boingSdk.decodeLinkedNftTokenJson : null;
const sdkSoftGate =
  typeof boingSdk.softGateLinkedNftTokenPeers === 'function'
    ? boingSdk.softGateLinkedNftTokenPeers
    : null;

export const LINKED_NFT_TOKEN_SCHEMA =
  boingSdk.LINKED_NFT_TOKEN_SCHEMA ||
  boingSdk.BOING_LINKED_NFT_TOKEN_SCHEMA ||
  'boing.linked_nft_token.v1';

function str(v) {
  return typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
}

function lowerHex(v) {
  const t = str(v);
  if (!t) return '';
  return t.startsWith('0x') || t.startsWith('0X') ? `0x${t.slice(2).toLowerCase()}` : t.toLowerCase();
}

/** Accept Boing 32-byte AccountId or EVM 20-byte address (EVM only for soft-gate hints / drafts). */
export function isLinkableAssetAddress(hex) {
  const t = str(hex);
  if (!t) return false;
  if (isBoingNativeAccountIdHex(t)) return true;
  return /^0x[a-fA-F0-9]{40}$/.test(t);
}

export function normalizeLinkableAssetAddress(hex) {
  const t = str(hex);
  if (!isLinkableAssetAddress(t)) {
    throw new Error('Expected a Boing AccountId (0x + 64 hex) or EVM address (0x + 40 hex).');
  }
  return lowerHex(t);
}

function uniqSorted(ids) {
  const set = new Set();
  for (const raw of ids || []) {
    try {
      set.add(normalizeLinkableAssetAddress(raw));
    } catch {
      /* skip invalid */
    }
  }
  return [...set].sort();
}

/**
 * Canonical metadata document (optional accompany to registry).
 * When SDK is present, uses role/peers shape from PR #42.
 */
export function normalizeLinkedNftToken(input = {}) {
  if (sdkNormalize) {
    // SDK shape: { role, peers, self, attester, revision, note }
    if (input.role === 'nft_collection' || input.role === 'fungible_token') {
      return sdkNormalize(input);
    }
    const collections = uniqSorted(input.collections || input.collection_ids || []);
    const tokens = uniqSorted(input.tokens || input.token_ids || []);
    if (collections.length === 1 && tokens.length) {
      return sdkNormalize({
        role: 'nft_collection',
        self: collections[0],
        peers: tokens,
        attester: input.linker || input.attester || '',
        revision: input.revision || 0,
        note: input.note || '',
      });
    }
    if (tokens.length === 1 && collections.length) {
      return sdkNormalize({
        role: 'fungible_token',
        self: tokens[0],
        peers: collections,
        attester: input.linker || input.attester || '',
        revision: input.revision || 0,
        note: input.note || '',
      });
    }
    return sdkNormalize({
      role: input.role || 'nft_collection',
      self: input.self || '',
      peers: input.peers || [],
      attester: input.linker || input.attester || '',
      revision: input.revision || 0,
      note: input.note || '',
    });
  }
  return {
    schema: LINKED_NFT_TOKEN_SCHEMA,
    collections: uniqSorted(input.collections || input.collection_ids || []),
    tokens: uniqSorted(input.tokens || input.token_ids || []),
    linker: input.linker ? lowerHex(input.linker) : null,
    updated_at: str(input.updatedAt || input.updated_at) || new Date().toISOString(),
  };
}

export function descriptionHashHexFromLinkedNftToken(input) {
  if (sdkHash) {
    if (input.role === 'nft_collection' || input.role === 'fungible_token') {
      return sdkHash(input);
    }
    return sdkHash(normalizeLinkedNftToken(input));
  }
  const norm = normalizeLinkedNftToken(input);
  const digest = blake3(new TextEncoder().encode(JSON.stringify(norm)));
  const h = bytesToHex(digest);
  if (h.length !== 64) {
    throw new Error('descriptionHashHexFromLinkedNftToken: unexpected digest length');
  }
  return `0x${h}`;
}

export function parseLinkedNftTokenDocument(raw) {
  if (sdkDecode) {
    try {
      return sdkDecode(raw);
    } catch {
      return null;
    }
  }
  let doc = raw;
  if (typeof raw === 'string') {
    try {
      doc = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!doc || typeof doc !== 'object') return null;
  if (str(doc.schema) !== LINKED_NFT_TOKEN_SCHEMA) return null;
  return normalizeLinkedNftToken(doc);
}

export function companionKeysFromLinks({ collections = [], tokens = [] } = {}) {
  return {
    companion_collections: uniqSorted(collections),
    companion_tokens: uniqSorted(tokens),
  };
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Soft-gate only — does **not** authorize a link. Prefer same deployer; registry is required.
 */
export function softGateSameDeployer({ collectionId, tokenId, linker } = {}) {
  if (sdkSoftGate) {
    try {
      const result = sdkSoftGate({
        collection: collectionId,
        token: tokenId,
        attester: linker,
        collectionDeployer: (() => {
          try {
            return readJson(DEPLOYER_HINTS_KEY, {})[normalizeLinkableAssetAddress(collectionId)] || '';
          } catch {
            return '';
          }
        })(),
        tokenDeployer: (() => {
          try {
            return readJson(DEPLOYER_HINTS_KEY, {})[normalizeLinkableAssetAddress(tokenId)] || '';
          } catch {
            return '';
          }
        })(),
      });
      if (typeof result === 'string') return result || null;
      if (result && typeof result === 'object') {
        if (result.ok === false) return result.message || result.warning || 'Soft-gate failed';
        if (result.warning) return result.warning;
      }
    } catch {
      /* fall through to local */
    }
  }

  const hints = readJson(DEPLOYER_HINTS_KEY, {});
  let cDep = null;
  let tDep = null;
  try {
    cDep = hints[normalizeLinkableAssetAddress(collectionId)] || null;
  } catch {
    /* ignore */
  }
  try {
    tDep = hints[normalizeLinkableAssetAddress(tokenId)] || null;
  } catch {
    /* ignore */
  }
  const link = linker ? lowerHex(linker) : null;
  if (cDep && tDep && cDep !== tDep) {
    return 'Deployers differ for this collection and token. Soft-gate warning only — the on-chain registry still decides whether the link is accepted.';
  }
  if (link && cDep && link !== cDep) {
    return 'Connected wallet does not match the known collection deployer. Soft-gate warning only.';
  }
  if (link && tDep && link !== tDep) {
    return 'Connected wallet does not match the known token deployer. Soft-gate warning only.';
  }
  return null;
}

export function rememberAssetDeployer(assetId, deployer) {
  if (!assetId || !deployer) return;
  try {
    const id = normalizeLinkableAssetAddress(assetId);
    const dep = lowerHex(deployer);
    if (!/^0x[a-fA-F0-9]+$/i.test(dep)) return;
    const hints = readJson(DEPLOYER_HINTS_KEY, {});
    hints[id] = dep;
    writeJson(DEPLOYER_HINTS_KEY, hints);
  } catch {
    /* ignore */
  }
}

export function buildLinkedDocumentFromPair(collectionId, tokenId, { linker = null } = {}) {
  if (sdkNormalize) {
    return normalizeLinkedNftToken({
      role: 'nft_collection',
      self: collectionId,
      peers: [tokenId],
      attester: linker || '',
    });
  }
  return normalizeLinkedNftToken({
    collections: [collectionId],
    tokens: [tokenId],
    linker,
  });
}
