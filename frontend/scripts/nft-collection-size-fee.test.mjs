import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  NFT_COLLECTION_SIZE_MIN,
  NFT_COLLECTION_SIZE_MAX,
  NFT_COLLECTION_FEE_TIERS,
  getNftDynamicFeeAmount,
  formatNftFeeAmount,
  parseCollectionSizeInput,
} from '../src/utils/nftCollectionSizeFee.js';

const BOING_CHAIN = 7777;
const __dirname = dirname(fileURLToPath(import.meta.url));

test('collection size bounds match product max and CSV row cap', () => {
  assert.equal(NFT_COLLECTION_SIZE_MIN, 1);
  assert.equal(NFT_COLLECTION_SIZE_MAX, 10000);
  const limitsSrc = readFileSync(join(__dirname, '../src/config/nftUploadLimits.js'), 'utf8');
  assert.match(limitsSrc, /NFT_LARGE_SET_MAX_ROWS\s*=\s*10000/);
});

test('preset tier fees are preserved exactly', () => {
  for (const tier of NFT_COLLECTION_FEE_TIERS) {
    assert.equal(getNftDynamicFeeAmount(BOING_CHAIN, tier.size, BOING_CHAIN), formatNftFeeAmount(tier.feeBoing));
    assert.equal(getNftDynamicFeeAmount(1, tier.size, BOING_CHAIN), formatNftFeeAmount(tier.feeEth));
  }
});

test('interpolates between tiers for custom sizes', () => {
  // Midway 1000→5000: BOING 5→15 → 10; ETH 0.01→0.03 → 0.02
  assert.equal(getNftDynamicFeeAmount(BOING_CHAIN, 3000, BOING_CHAIN), '10');
  assert.equal(getNftDynamicFeeAmount(1, 3000, BOING_CHAIN), '0.02');
});

test('scales below first tier', () => {
  assert.equal(getNftDynamicFeeAmount(BOING_CHAIN, 50, BOING_CHAIN), '0.5');
  assert.equal(getNftDynamicFeeAmount(1, 50, BOING_CHAIN), '0.0005');
});

test('parseCollectionSizeInput accepts 1..10000 integers', () => {
  assert.deepEqual(parseCollectionSizeInput('1'), { ok: true, value: 1 });
  assert.deepEqual(parseCollectionSizeInput('10000'), { ok: true, value: 10000 });
  assert.deepEqual(parseCollectionSizeInput('2500'), { ok: true, value: 2500 });
  assert.equal(parseCollectionSizeInput('0').ok, false);
  assert.equal(parseCollectionSizeInput('10001').ok, false);
  assert.equal(parseCollectionSizeInput('1.5').ok, false);
  assert.equal(parseCollectionSizeInput('').ok, false);
});
