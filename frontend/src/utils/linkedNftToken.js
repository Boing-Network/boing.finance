/**
 * Display-only NFT collection ↔ fungible token links (`boing.linked_nft_token.v1`).
 *
 * Prefer boing-sdk helpers when the package exports them; otherwise use a thin local
 * encode matching the product design (many-to-many, mutable after create).
 */
import { blake3 } from '@noble/hashes/blake3';
import { bytesToHex } from '@noble/hashes/utils';
import * as boingSdk from 'boing-sdk';
import { isBoingNativeAccountIdHex } from './boingWalletDiscovery';

const STORAGE_KEY = 'boing.finance.linked_nft_token.v1';
const DEPLOYER_HINTS_KEY = 'boing.finance.asset_deployer_hints.v1';

const sdkNormalize =
  typeof boingSdk.normalizeLinkedNftToken === 'function' ? boingSdk.normalizeLinkedNftToken : null;
const sdkHash =
  typeof boingSdk.descriptionHashHexFromLinkedNftToken === 'function'
    ? boingSdk.descriptionHashHexFromLinkedNftToken
    : null;
const sdkParse =
  typeof boingSdk.parseLinkedNftTokenDocument === 'function' ? boingSdk.parseLinkedNftTokenDocument : null;

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

/** Accept Boing 32-byte AccountId or EVM 20-byte address. */
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
 * Canonical document for hashing / metadata commit.
 * @param {{ collections?: string[], tokens?: string[], linker?: string|null, updatedAt?: string|null }} input
 */
export function normalizeLinkedNftToken(input = {}) {
  if (sdkNormalize) return sdkNormalize(input);
  return {
    schema: LINKED_NFT_TOKEN_SCHEMA,
    collections: uniqSorted(input.collections || input.collection_ids || []),
    tokens: uniqSorted(input.tokens || input.token_ids || []),
    linker: input.linker ? lowerHex(input.linker) : null,
    updated_at: str(input.updatedAt || input.updated_at) || new Date().toISOString(),
  };
}

/** Blake3-256 of UTF-8 JSON → `0x` + 64 hex (fits `description_hash`). */
export function descriptionHashHexFromLinkedNftToken(input) {
  if (sdkHash) return sdkHash(input);
  const norm = normalizeLinkedNftToken(input);
  const digest = blake3(new TextEncoder().encode(JSON.stringify(norm)));
  const h = bytesToHex(digest);
  if (h.length !== 64) {
    throw new Error('descriptionHashHexFromLinkedNftToken: unexpected digest length');
  }
  return `0x${h}`;
}

export function parseLinkedNftTokenDocument(raw) {
  if (sdkParse) return sdkParse(raw);
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

/** Off-chain JSON companion keys (design doc). */
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

function edgeId(collectionId, tokenId) {
  return `${normalizeLinkableAssetAddress(collectionId)}::${normalizeLinkableAssetAddress(tokenId)}`;
}

/**
 * Soft-gate: same wallet/deployer preferred. Returns warning text or null when OK / unknown.
 */
export function softGateSameDeployer({ collectionId, tokenId, linker } = {}) {
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
    return 'Deployers differ for this collection and token. Link is still allowed (display-only); explorers may treat it as unofficial.';
  }
  if (link && cDep && link !== cDep) {
    return 'Connected wallet does not match the known collection deployer. Soft-gate only — you can still save the link.';
  }
  if (link && tDep && link !== tDep) {
    return 'Connected wallet does not match the known token deployer. Soft-gate only — you can still save the link.';
  }
  return null;
}

export function rememberAssetDeployer(assetId, deployer) {
  if (!assetId || !deployer) return;
  try {
    const id = normalizeLinkableAssetAddress(assetId);
    const dep = lowerHex(deployer);
    if (!isLinkableAssetAddress(dep) && !/^0x[a-fA-F0-9]{40}$/i.test(dep) && !isBoingNativeAccountIdHex(dep)) {
      // still store wallet hex if it looks like an account
      if (!/^0x[a-fA-F0-9]+$/i.test(dep)) return;
    }
    const hints = readJson(DEPLOYER_HINTS_KEY, {});
    hints[id] = dep;
    writeJson(DEPLOYER_HINTS_KEY, hints);
  } catch {
    /* ignore */
  }
}

export function listLinkedPairs() {
  const rows = readJson(STORAGE_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

export function listLinksForAsset(assetId) {
  let id;
  try {
    id = normalizeLinkableAssetAddress(assetId);
  } catch {
    return [];
  }
  return listLinkedPairs().filter((r) => r.collectionId === id || r.tokenId === id);
}

/**
 * Upsert a mutable many-to-many edge (display-only local registry).
 */
export function upsertLinkedPair({
  collectionId,
  tokenId,
  linker = null,
  collectionLabel = '',
  tokenLabel = '',
} = {}) {
  const collection = normalizeLinkableAssetAddress(collectionId);
  const token = normalizeLinkableAssetAddress(tokenId);
  if (collection === token) {
    throw new Error('Collection and token addresses must differ.');
  }
  const warning = softGateSameDeployer({ collectionId: collection, tokenId: token, linker });
  const now = new Date().toISOString();
  const id = edgeId(collection, token);
  const rows = listLinkedPairs();
  const idx = rows.findIndex((r) => r.id === id);
  const row = {
    id,
    schema: LINKED_NFT_TOKEN_SCHEMA,
    collectionId: collection,
    tokenId: token,
    linker: linker ? lowerHex(linker) : null,
    sameDeployerOk: !warning,
    softGateWarning: warning,
    collectionLabel: str(collectionLabel),
    tokenLabel: str(tokenLabel),
    createdAt: idx >= 0 ? rows[idx].createdAt || now : now,
    updatedAt: now,
  };
  if (idx >= 0) rows[idx] = { ...rows[idx], ...row };
  else rows.unshift(row);
  writeJson(STORAGE_KEY, rows);
  return { row, warning };
}

export function removeLinkedPair(collectionId, tokenId) {
  const id = edgeId(collectionId, tokenId);
  const next = listLinkedPairs().filter((r) => r.id !== id);
  writeJson(STORAGE_KEY, next);
  return next;
}

/** Build a schema document covering all links for one seed asset (or an explicit pair). */
export function buildLinkedDocumentForAsset(assetId, { linker = null } = {}) {
  const links = listLinksForAsset(assetId);
  const collections = new Set();
  const tokens = new Set();
  try {
    const seed = normalizeLinkableAssetAddress(assetId);
    // Infer side from existing edges; if none, treat as unknown seed in both lists empty
    for (const l of links) {
      collections.add(l.collectionId);
      tokens.add(l.tokenId);
    }
    if (!links.length) {
      // seed alone is not a pair document
      return normalizeLinkedNftToken({ collections: [], tokens: [], linker });
    }
    // Ensure seed appears on the correct side if it was only a peer in some edges
    const asCollection = links.some((l) => l.collectionId === seed);
    const asToken = links.some((l) => l.tokenId === seed);
    if (asCollection) collections.add(seed);
    if (asToken) tokens.add(seed);
  } catch {
    /* empty */
  }
  return normalizeLinkedNftToken({
    collections: [...collections],
    tokens: [...tokens],
    linker,
  });
}

export function buildLinkedDocumentFromPair(collectionId, tokenId, { linker = null } = {}) {
  return normalizeLinkedNftToken({
    collections: [collectionId],
    tokens: [tokenId],
    linker,
  });
}
