import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const uploadSrc = readFileSync(join(root, 'src/services/boingL1MediaBlobUpload.js'), 'utf8');
const metaSrc = readFileSync(join(root, 'src/utils/nftCollectionMetadata.js'), 'utf8');
const createSrc = readFileSync(join(root, 'src/pages/CreateNFT.jsx'), 'utf8');
const deploySrc = readFileSync(join(root, 'src/components/NativeBoingNftDeploySection.jsx'), 'utf8');
const blobUrlSrc = readFileSync(join(root, 'src/utils/boingBlobMediaUrl.js'), 'utf8');

test('L1 media upload service exports PutBlob + prefer-L1 helpers', () => {
  assert.match(uploadSrc, /putNftMediaAsL1Blob/);
  assert.match(uploadSrc, /uploadNftMediaPreferL1/);
  assert.match(uploadSrc, /uploadNftMediaFilesPreferL1/);
  assert.match(uploadSrc, /type:\s*'put_blob'/);
  assert.match(uploadSrc, /boingExpressSendTransaction/);
  assert.match(uploadSrc, /resolveMediaBlobMaxBytes/);
  assert.match(uploadSrc, /L1_PUT_BLOB_WALLET_SAFE_MAX_BYTES/);
  assert.match(uploadSrc, /mediaBlobUri/);
  assert.match(uploadSrc, /getMediaBlobParams/);
});

test('publicAssetUri accepts boing://blob references', () => {
  assert.match(metaSrc, /boing:\\\/\\\/blob\\\//);
  assert.match(metaSrc, /isBoingL1BlobUri/);
  assert.match(metaSrc, /isPublicAssetUri/);
});

test('Create NFT Standard + Large set prefer L1 with R2 fallback', () => {
  assert.match(createSrc, /uploadNftMediaPreferL1/);
  assert.match(createSrc, /uploadNftMediaFilesPreferL1/);
  assert.match(createSrc, /preferL1MediaBlobs/);
  assert.match(createSrc, /BoingBlobImage/);
  // Both modes still present
  assert.match(createSrc, /mode === 'dynamic'/);
  assert.match(createSrc, /setMode\('standard'\)|mode === 'standard'|Standard/);
  assert.match(createSrc, /Large set|dynamic/);
});

test('deploy section copy mentions L1 blobs', () => {
  assert.match(deploySrc, /boing:\/\/blob/);
  assert.match(deploySrc, /PutBlob|L1 media blobs/);
});

test('blob display resolver uses getBlob', () => {
  assert.match(blobUrlSrc, /getBlob/);
  assert.match(blobUrlSrc, /blobIdHexFromBoingUri/);
  assert.match(blobUrlSrc, /createObjectURL/);
});

/** Pure helpers mirrored for URI acceptance (avoids Vite transform). */
function isPublicAssetUri(value) {
  return /^(https?:\/\/|ipfs:\/\/|boing:\/\/blob\/)/i.test(String(value || '').trim());
}

function isBoingL1BlobUri(value) {
  return /^boing:\/\/blob\/0x[0-9a-fA-F]{64}$/i.test(String(value || '').trim());
}

test('URI helpers accept https, ipfs, and boing blob', () => {
  assert.equal(isPublicAssetUri('https://cdn.example/a.png'), true);
  assert.equal(isPublicAssetUri('ipfs://QmHash'), true);
  const blob =
    'boing://blob/0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  assert.equal(isPublicAssetUri(blob), true);
  assert.equal(isBoingL1BlobUri(blob), true);
  assert.equal(isBoingL1BlobUri('https://cdn.example/a.png'), false);
  assert.equal(isPublicAssetUri(''), false);
});
