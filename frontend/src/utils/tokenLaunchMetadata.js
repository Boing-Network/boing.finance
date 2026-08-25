import { blake3 } from '@noble/hashes/blake3';
import { bytesToHex } from '@noble/hashes/utils';
import { uploadMetadataToIPFS } from './ipfsUpload';
import { publicAssetUri } from './nftCollectionMetadata';

export const TOKEN_LAUNCH_METADATA_SCHEMA = 'boing.token_launch_metadata.v1';

function str(v) {
  return typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
}

function bool(v) {
  return Boolean(v);
}

/** Stable security block (same fields the SDK hashes when no logo/metadata JSON is published). */
export function tokenLaunchSecurityBlock(security = {}) {
  return {
    renounceMint: bool(security.renounceMint),
    enableFreezing: bool(security.enableFreezing),
    enableBlacklist: bool(security.enableBlacklist),
    maxTxAmount: str(security.maxTxAmount),
    renounceOwnership: bool(security.renounceOwnership),
    antiBot: bool(security.antiBot),
    cooldownPeriod: str(security.cooldownPeriod),
    antiWhale: bool(security.antiWhale),
    pauseFunction: bool(security.pauseFunction),
    timelock: bool(security.timelock),
    timelockDelay: str(security.timelockDelay),
    maxWallet: bool(security.maxWallet),
    maxWalletPercentage: str(security.maxWalletPercentage),
  };
}

export function buildTokenLaunchMetadataDocument({
  name,
  symbol,
  description = '',
  image = '',
  website = '',
  socialLinks = {},
  decimals = 18,
  initialSupply = '',
  network = '',
  security = {},
}) {
  return {
    schema: TOKEN_LAUNCH_METADATA_SCHEMA,
    name: str(name),
    symbol: str(symbol).toUpperCase(),
    description: str(description),
    image: str(image),
    external_url: str(website),
    decimals: Number(decimals) || 18,
    initialSupply: str(initialSupply),
    network: str(network),
    social: {
      twitter: str(socialLinks.twitter),
      telegram: str(socialLinks.telegram),
      discord: str(socialLinks.discord),
      github: str(socialLinks.github),
      medium: str(socialLinks.medium),
      reddit: str(socialLinks.reddit),
    },
    security: tokenLaunchSecurityBlock(security),
  };
}

export function descriptionHashHexFromTokenLaunchMetadata(doc) {
  const json = JSON.stringify(doc);
  const digest = blake3(new TextEncoder().encode(json));
  const h = bytesToHex(digest);
  if (h.length !== 64) {
    throw new Error('Token metadata description_hash: unexpected digest length');
  }
  return `0x${h}`;
}

export async function publishTokenLaunchMetadata(doc) {
  const result = await uploadMetadataToIPFS(doc);
  const metadataUri = publicAssetUri(result);
  if (!metadataUri) {
    throw new Error('Token metadata upload returned no public URL.');
  }
  const descriptionHash = descriptionHashHexFromTokenLaunchMetadata(doc);
  return { metadataUri, descriptionHash, doc };
}
