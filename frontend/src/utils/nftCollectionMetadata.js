import { blake3 } from '@noble/hashes/blake3';
import { bytesToHex } from '@noble/hashes/utils';
import { uploadMetadataToIPFS } from './ipfsUpload';

export const NFT_COLLECTION_METADATA_SCHEMA = 'boing.nft_collection_metadata.v1';
/** Per-token ERC-721-style JSON committed on-chain via reference NFT `metadata_hash`. */
export const NFT_TOKEN_METADATA_SCHEMA = 'boing.nft_token_metadata.v1';

/** Public URI from R2 / IPFS upload results. Keep https URLs; only raw CIDs become ipfs://. */
export function publicAssetUri(result) {
  if (!result) return '';
  if (typeof result === 'string') {
    const t = result.trim();
    if (!t) return '';
    if (/^(https?:\/\/|ipfs:\/\/)/i.test(t)) return t;
    return `ipfs://${t}`;
  }
  const raw = String(result.url || result.gatewayUrls?.[0] || '').trim();
  if (/^(https?:\/\/|ipfs:\/\/)/i.test(raw)) return raw;
  const hash = String(result.hash || raw || '').trim();
  if (!hash) return '';
  return hash.startsWith('ipfs://') ? hash : `ipfs://${hash}`;
}

export function isPublicAssetUri(value) {
  return /^(https?:\/\/|ipfs:\/\/)/i.test(String(value || '').trim());
}

function normalizeAttributes(attributes) {
  if (!Array.isArray(attributes)) return [];
  return attributes
    .filter((a) => a?.trait_type && a?.value != null)
    .map(({ trait_type, value }) => ({ trait_type: String(trait_type), value }));
}

/**
 * Canonical per-token metadata document. Blake3 of `JSON.stringify(doc)` is the on-chain `metadata_hash`.
 * Token ids in the wizard are 1-based sequential (`referenceNftTokenIdWordFromU64`).
 */
export function buildNftTokenMetadataDocument(token, indexZeroBased = 0, collectionName = '') {
  const i = Number(indexZeroBased) || 0;
  return {
    schema: NFT_TOKEN_METADATA_SCHEMA,
    token_id: i + 1,
    name: String(token?.name || `${collectionName || 'Token'} #${i + 1}`).trim(),
    description: String(token?.description || '').trim(),
    image: String(token?.image || '').trim(),
    attributes: normalizeAttributes(token?.attributes),
  };
}

/** Blake3-256 of UTF-8 JSON — same digest width as collection `description_hash` / reference NFT metadata slots. */
export function metadataHashHexFromJsonDocument(doc) {
  const json = JSON.stringify(doc);
  const digest = blake3(new TextEncoder().encode(json));
  const h = bytesToHex(digest);
  if (h.length !== 64) {
    throw new Error('NFT metadata hash: unexpected digest length');
  }
  return `0x${h}`;
}

export function buildNftCollectionMetadataDocument({
  name,
  symbol,
  description = '',
  image = '',
  tokens = [],
  includeTokenMetadataHashes = true,
}) {
  const collectionName = String(name || '').trim();
  return {
    schema: NFT_COLLECTION_METADATA_SCHEMA,
    name: collectionName,
    symbol: String(symbol || '').trim().toUpperCase(),
    description: String(description || '').trim(),
    image: String(image || '').trim(),
    tokens: (tokens || []).map((t, i) => {
      const entry = {
        name: String(t?.name || `${collectionName || 'Token'} #${i + 1}`).trim(),
        description: String(t?.description || '').trim(),
        image: String(t?.image || '').trim(),
        attributes: normalizeAttributes(t?.attributes),
      };
      if (includeTokenMetadataHashes) {
        const tokenDoc = buildNftTokenMetadataDocument(entry, i, collectionName);
        entry.metadata_hash = metadataHashHexFromJsonDocument(tokenDoc);
        entry.token_id = i + 1;
      }
      return entry;
    }),
  };
}

/** Blake3-256 of UTF-8 JSON — same digest width as native token `description_hash`. */
export function descriptionHashHexFromNftCollectionMetadata(doc) {
  return metadataHashHexFromJsonDocument(doc);
}

export function applyCoverImageToTokens(tokens, coverUri) {
  const cover = String(coverUri || '').trim();
  if (!cover) return tokens || [];
  return (tokens || []).map((t) => ({
    ...t,
    image: String(t?.image || '').trim() || cover,
  }));
}

/**
 * Build mint rows for reference `mint_batch`: sequential token ids 1..N + per-token metadata hashes.
 * @param {Array<{ name?: string, description?: string, image?: string, attributes?: unknown[] }>} tokens
 * @param {{ collectionName?: string }} [opts]
 * @returns {{ tokenId: number, tokenDoc: object, metadataHash: string }[]}
 */
export function prepareOnChainNftMintRows(tokens, opts = {}) {
  const collectionName = String(opts.collectionName || '').trim();
  const list = Array.isArray(tokens) ? tokens : [];
  return list.map((t, i) => {
    const tokenDoc = buildNftTokenMetadataDocument(t, i, collectionName);
    return {
      tokenId: i + 1,
      tokenDoc,
      metadataHash: metadataHashHexFromJsonDocument(tokenDoc),
    };
  });
}

/**
 * Best-effort upload of per-token JSON to R2/IPFS at `metadata/{hash}.json` so marketplaces can
 * resolve `metadata_hash` → HTTPS without reading the collection catalog.
 * Failures are collected; mint can still proceed using the collection document.
 */
export async function publishNftTokenMetadataDocuments(rows, options = {}) {
  const concurrency = Math.max(1, Math.min(16, Number(options.concurrency) || 6));
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : null;
  const list = Array.isArray(rows) ? rows : [];
  const uploaded = [];
  const failures = [];
  let done = 0;

  async function one(row) {
    const hashHex = String(row.metadataHash || '').replace(/^0x/i, '').toLowerCase();
    if (hashHex.length !== 64) {
      failures.push({ tokenId: row.tokenId, error: 'invalid metadata hash' });
      return;
    }
    try {
      const result = await uploadMetadataToIPFS(row.tokenDoc, null, {
        canonicalKey: `metadata/${hashHex}.json`,
      });
      const uri = publicAssetUri(result);
      uploaded.push({ tokenId: row.tokenId, metadataHash: row.metadataHash, metadataUri: uri });
    } catch (e) {
      failures.push({ tokenId: row.tokenId, error: e?.message || String(e) });
    } finally {
      done += 1;
      onProgress?.({ done, total: list.length, uploaded: uploaded.length, failures: failures.length });
    }
  }

  let next = 0;
  async function worker() {
    while (next < list.length) {
      const i = next;
      next += 1;
      await one(list[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, list.length) }, () => worker()));
  return { uploaded, failures };
}

export async function publishNftCollectionMetadata(doc) {
  const descriptionHash = descriptionHashHexFromNftCollectionMetadata(doc);
  const hashHex = descriptionHash.replace(/^0x/i, '').toLowerCase();
  const result = await uploadMetadataToIPFS(doc, null, { canonicalKey: `metadata/${hashHex}.json` });
  const metadataUri = publicAssetUri(result);
  if (!metadataUri) {
    throw new Error('Metadata upload returned no public URL.');
  }
  return { metadataUri, descriptionHash, doc };
}
