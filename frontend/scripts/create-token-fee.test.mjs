import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PLATFORM_CREATE_TOKEN_FEE_BPS,
  PLATFORM_CREATE_TOKEN_FEE_RECIPIENT,
  getCreateTokenFeeLabel,
  getCreateTokenFeeRecipient,
  normalizeCreateTokenFeeRecipient,
  planCreateTokenPlatformFee,
} from '../src/config/createTokenFee.js';

const TREASURY =
  '0xd692627aaedf987f8854e84ab3c4d581d73f6adc13a3d86b512dc9f0d3635237';

test('live Create Token fee is 0.5% (50 bps)', () => {
  assert.equal(PLATFORM_CREATE_TOKEN_FEE_BPS, 50);
  assert.equal(getCreateTokenFeeLabel(50), '0.5%');
});

test('live Create Token fee recipient is the Boing treasury AccountId', () => {
  assert.equal(PLATFORM_CREATE_TOKEN_FEE_RECIPIENT, TREASURY);
  assert.equal(getCreateTokenFeeRecipient(), TREASURY);
});

test('normalizeCreateTokenFeeRecipient accepts with or without 0x', () => {
  const bare = TREASURY.slice(2);
  assert.equal(normalizeCreateTokenFeeRecipient(bare), TREASURY);
  assert.equal(normalizeCreateTokenFeeRecipient(`0x${bare.toUpperCase()}`), TREASURY);
  assert.equal(normalizeCreateTokenFeeRecipient(''), '');
  assert.equal(normalizeCreateTokenFeeRecipient('0x' + '0'.repeat(64)), '');
});

test('planCreateTokenPlatformFee takes floor of bps share', () => {
  const plan = planCreateTokenPlatformFee(1_000_000n, 50);
  assert.equal(plan.feeAmount, 5000n);
  assert.equal(plan.creatorAmount, 995_000n);
  assert.equal(plan.feeLabel, '0.5%');
  assert.equal(plan.feeBps, 50);
  assert.equal(plan.recipient, TREASURY);
  assert.equal(plan.collectionReady, true);
});

test('planCreateTokenPlatformFee leaves creator at least 1 when possible', () => {
  const tiny = planCreateTokenPlatformFee(1n, 50);
  assert.equal(tiny.feeAmount, 0n);
  assert.equal(tiny.creatorAmount, 1n);
  assert.equal(tiny.collectionReady, false);
  const almost = planCreateTokenPlatformFee(2n, 10_000);
  assert.equal(almost.feeAmount, 1n);
  assert.equal(almost.creatorAmount, 1n);
  assert.equal(almost.collectionReady, true);
});
