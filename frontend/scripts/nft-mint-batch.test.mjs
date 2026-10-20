import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { blake3 } from '@noble/hashes/blake3';
import { bytesToHex } from '@noble/hashes/utils';

const __dirname = dirname(fileURLToPath(import.meta.url));
const metaSrc = readFileSync(join(__dirname, '../src/utils/nftCollectionMetadata.js'), 'utf8');
const mintSrc = readFileSync(join(__dirname, '../src/services/boingNftMintBatch.js'), 'utf8');

// Mirror chunk helper (keeps Node test free of Vite/React transforms).
function chunkNftMintRows(rows, chunkSize = 50) {
  const size = Math.max(1, Math.min(500, Math.trunc(Number(chunkSize) || 50)));
  const list = Array.isArray(rows) ? rows : [];
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

function buildNftTokenMetadataDocument(token, indexZeroBased = 0, collectionName = '') {
  const i = Number(indexZeroBased) || 0;
  return {
    schema: 'boing.nft_token_metadata.v1',
    token_id: i + 1,
    name: String(token?.name || `${collectionName || 'Token'} #${i + 1}`).trim(),
    description: String(token?.description || '').trim(),
    image: String(token?.image || '').trim(),
    attributes: Array.isArray(token?.attributes)
      ? token.attributes
          .filter((a) => a?.trait_type && a?.value != null)
          .map(({ trait_type, value }) => ({ trait_type: String(trait_type), value }))
      : [],
  };
}

function metadataHashHexFromJsonDocument(doc) {
  const digest = blake3(new TextEncoder().encode(JSON.stringify(doc)));
  return `0x${bytesToHex(digest)}`;
}

test('source exports mint batch + token metadata helpers', () => {
  assert.match(metaSrc, /NFT_TOKEN_METADATA_SCHEMA/);
  assert.match(metaSrc, /prepareOnChainNftMintRows/);
  assert.match(metaSrc, /metadata_hash/);
  assert.match(mintSrc, /mintReferenceNftSetChunked/);
  assert.match(mintSrc, /encodeReferenceMintBatchCalldata/);
  assert.match(mintSrc, /waitForInclusion:\s*true/);
  assert.match(mintSrc, /refreshNonce:\s*true/);
});

test('chunkNftMintRows splits 10k into 20×500', () => {
  const rows = Array.from({ length: 10_000 }, (_, i) => ({ tokenId: i + 1 }));
  const chunks = chunkNftMintRows(rows, 500);
  assert.equal(chunks.length, 20);
  assert.equal(chunks[0].length, 500);
  assert.equal(chunks[19].length, 500);
  assert.equal(chunks[19][499].tokenId, 10_000);
});

test('chunkNftMintRows default-size remains ≤500', () => {
  const rows = Array.from({ length: 120 }, (_, i) => ({ tokenId: i + 1 }));
  const chunks = chunkNftMintRows(rows, 50);
  assert.equal(chunks.length, 3);
  assert.equal(chunks[2].length, 20);
});

test('per-token metadata hash is stable blake3 of canonical JSON', () => {
  const doc = buildNftTokenMetadataDocument(
    {
      name: 'Sprite #1',
      description: 'demo',
      image: 'https://cdn.example/a.png',
      attributes: [{ trait_type: 'Color', value: 'Blue' }],
    },
    0,
    'Sprites'
  );
  const h1 = metadataHashHexFromJsonDocument(doc);
  const h2 = metadataHashHexFromJsonDocument(doc);
  assert.equal(h1, h2);
  assert.match(h1, /^0x[0-9a-f]{64}$/);
  assert.notEqual(h1, `0x${'0'.repeat(64)}`);
  // Not SHA-256 — marketplaces must use Blake3.
  const sha = createHash('sha256').update(JSON.stringify(doc)).digest('hex');
  assert.notEqual(h1.slice(2), sha);
});

test('token ids are 1-based sequential in prepared docs', () => {
  const tokens = [
    { name: 'A', image: 'https://x/a.png' },
    { name: 'B', image: 'https://x/b.png' },
  ];
  const docs = tokens.map((t, i) => buildNftTokenMetadataDocument(t, i, 'Col'));
  assert.equal(docs[0].token_id, 1);
  assert.equal(docs[1].token_id, 2);
  assert.notEqual(
    metadataHashHexFromJsonDocument(docs[0]),
    metadataHashHexFromJsonDocument(docs[1])
  );
});
