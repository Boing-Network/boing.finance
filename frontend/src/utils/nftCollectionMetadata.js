import { blake3 } from '@noble/hashes/blake3';
import { bytesToHex } from '@noble/hashes/utils';
import { uploadMetadataToIPFS } from './ipfsUpload';

export const NFT_COLLECTION_METADATA_SCHEMA = 'boing.nft_collection_metadata.v1';

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

export function buildNftCollectionMetadataDocument({
  name,
  symbol,
  description = '',
  image = '',
  tokens = [],
}) {
  return {
    schema: NFT_COLLECTION_METADATA_SCHEMA,
    name: String(name || '').trim(),
    symbol: String(symbol || '').trim().toUpperCase(),
    description: String(description || '').trim(),
    image: String(image || '').trim(),
    tokens: (tokens || []).map((t, i) => ({
      name: String(t?.name || `${name || 'Token'} #${i + 1}`).trim(),
      description: String(t?.description || '').trim(),
      image: String(t?.image || '').trim(),
      attributes: Array.isArray(t?.attributes)
        ? t.attributes.filter((a) => a?.trait_type && a?.value != null)
        : [],
    })),
  };
}

/** Blake3-256 of UTF-8 JSON — same digest width as native token `description_hash`. */
export function descriptionHashHexFromNftCollectionMetadata(doc) {
  const json = JSON.stringify(doc);
  const digest = blake3(new TextEncoder().encode(json));
  const h = bytesToHex(digest);
  if (h.length !== 64) {
    throw new Error('NFT metadata description_hash: unexpected digest length');
  }
  return `0x${h}`;
}

export function applyCoverImageToTokens(tokens, coverUri) {
  const cover = String(coverUri || '').trim();
  if (!cover) return tokens || [];
  return (tokens || []).map((t) => ({
    ...t,
    image: String(t?.image || '').trim() || cover,
  }));
}

export async function publishNftCollectionMetadata(doc) {
  const result = await uploadMetadataToIPFS(doc);
  const metadataUri = publicAssetUri(result);
  if (!metadataUri) {
    throw new Error('Metadata upload returned no public URL.');
  }
  const descriptionHash = descriptionHashHexFromNftCollectionMetadata(doc);
  return { metadataUri, descriptionHash, doc };
}
