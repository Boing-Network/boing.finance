/**
 * Off-chain launch metadata for Boing Create Token.
 * Blake3-256 of the JSON is committed on-chain as `description_hash`; explorers
 * (boing.observer) resolve `metadata/{hash}.json` on R2 for the logo URL.
 */
import { blake3 } from '@noble/hashes/blake3';
import { bytesToHex } from '@noble/hashes/utils';
import { isPublicAssetUri, publicAssetUri, uploadMetadataToR2 } from './r2AssetUpload.js';

export const TOKEN_LAUNCH_METADATA_SCHEMA = 'boing.token_launch_metadata.v1';
/** Matches Boing token v2 (whole units). Keep local so Node tests need no Vite resolve. */
const DEFAULT_DECIMALS = 0;
const DEFAULT_SECURITY = Object.freeze({
  renounceMint: true,
  renounceOwnership: true,
});

function str(v) {
  return typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
}

/**
 * @param {object} input
 * @param {string} input.name
 * @param {string} input.symbol
 * @param {string} [input.description]
 * @param {string} [input.image]
 * @param {string} [input.website]
 * @param {string|number|bigint} [input.initialSupply]
 * @param {string} [input.network]
 * @param {object} [input.security]
 * @param {number} [input.decimals]
 */
export function buildTokenLaunchMetadataDocument({
  name,
  symbol,
  description = '',
  image = '',
  website = '',
  initialSupply = '',
  network = 'boing-testnet',
  security = DEFAULT_SECURITY,
  decimals = DEFAULT_DECIMALS,
}) {
  const sec = security && typeof security === 'object' ? security : DEFAULT_SECURITY;
  return {
    schema: TOKEN_LAUNCH_METADATA_SCHEMA,
    name: str(name),
    symbol: str(symbol).toUpperCase(),
    description: str(description),
    image: str(image),
    logoURI: str(image),
    external_url: str(website),
    decimals: Number.isFinite(Number(decimals)) ? Number(decimals) : DEFAULT_DECIMALS,
    initialSupply: str(initialSupply),
    network: str(network) || 'boing-testnet',
    security: {
      renounceMint: Boolean(sec.renounceMint),
      renounceOwnership: Boolean(sec.renounceOwnership),
    },
  };
}

/**
 * @param {object} doc
 * @returns {`0x${string}`}
 */
export function descriptionHashHexFromTokenLaunchMetadata(doc) {
  const json = JSON.stringify(doc);
  const digest = blake3(new TextEncoder().encode(json));
  const h = bytesToHex(digest);
  if (h.length !== 64) {
    throw new Error('Token metadata description_hash: unexpected digest length');
  }
  return `0x${h}`;
}

/**
 * Upload compact JSON at the content-addressed R2 key matching `description_hash`.
 * @param {object} doc
 * @returns {Promise<{ metadataUri: string, descriptionHash: `0x${string}`, doc: object }>}
 */
export async function publishTokenLaunchMetadata(doc) {
  const descriptionHash = descriptionHashHexFromTokenLaunchMetadata(doc);
  const hashHex = descriptionHash.replace(/^0x/i, '').toLowerCase();
  const result = await uploadMetadataToR2(doc, { canonicalKey: `metadata/${hashHex}.json` });
  const metadataUri = publicAssetUri(result);
  if (!metadataUri) {
    throw new Error('Token metadata upload returned no public URL.');
  }
  return { metadataUri, descriptionHash, doc };
}

/**
 * When the user picked a logo (or pasted a public URL), publish launch metadata and
 * return the hash to commit on deploy. No-op when there is no public image URI.
 * @param {{ name: string, symbol: string, supply: string, image: string, description?: string }} input
 */
export async function ensureTokenLaunchMetadataForCreate(input) {
  const image = str(input.image);
  if (!image || !isPublicAssetUri(image)) {
    return null;
  }
  const doc = buildTokenLaunchMetadataDocument({
    name: input.name,
    symbol: input.symbol,
    description: input.description || '',
    image,
    initialSupply: input.supply,
  });
  return publishTokenLaunchMetadata(doc);
}
