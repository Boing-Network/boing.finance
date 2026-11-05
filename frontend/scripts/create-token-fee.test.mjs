import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PLATFORM_CREATE_TOKEN_FEE_BPS,
  getCreateTokenFeeLabel,
  planCreateTokenPlatformFee,
} from '../src/config/createTokenFee.js';

test('live Create Token fee is 0.5% (50 bps)', () => {
  assert.equal(PLATFORM_CREATE_TOKEN_FEE_BPS, 50);
  assert.equal(getCreateTokenFeeLabel(50), '0.5%');
});

test('planCreateTokenPlatformFee takes floor of bps share', () => {
  const plan = planCreateTokenPlatformFee(1_000_000n, 50);
  assert.equal(plan.feeAmount, 5000n);
  assert.equal(plan.creatorAmount, 995_000n);
  assert.equal(plan.feeLabel, '0.5%');
  assert.equal(plan.feeBps, 50);
});

test('planCreateTokenPlatformFee leaves creator at least 1 when possible', () => {
  const tiny = planCreateTokenPlatformFee(1n, 50);
  assert.equal(tiny.feeAmount, 0n);
  assert.equal(tiny.creatorAmount, 1n);
  const almost = planCreateTokenPlatformFee(2n, 10_000);
  assert.equal(almost.feeAmount, 1n);
  assert.equal(almost.creatorAmount, 1n);
});
