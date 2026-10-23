/**
 * Native BOING in the swap / pools UI: wBOING shown as "BOING" (18 decimals), decimal-aware amounts,
 * v10 routing and the single-batch wrap / unwrap requests sent to Boing Express.
 * Run: node --test scripts/boing-native-boing.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WBOING_HEX,
  custodyTokenList,
  formatRate,
  formatTokenAmount,
  isNativeBoingPool,
  parseTokenAmount,
  pickBestCustodyPool,
  sanitizeAmountInput,
  spotRateAfterFee,
  toAmountInput,
} from '../src/services/boingSwapQuote.js';
import { poolCard, pairedAmount } from '../src/services/boingPoolsSimple.js';
import { buildNativeAddLiquidityRequest, buildNativeRemoveLiquidityRequest } from '../src/services/boingLiquidityTx.js';
import { planNativeBoingSwap } from '../src/services/nativeDexCustodySwap.js';

const USDC = '0x6676f971ade3982406efa3e2cdb0477923f8f2a15624c4b6ad3a432817a75e93';
const TBOING = '0x6fce9d3e3f13df9fc17e3fd947148a4e6ce6966538b7dd9bf2a891d3b9699c6b';
const POOL = '0x23e9b02c3ee1600197e1a3d1c08feaa758b967f7ff1513f62991257a3b970069';
const ME = `0x${'ab'.repeat(32)}`;
const E18 = 10n ** 18n;
const v10 = { poolHex: POOL, tokenAHex: WBOING_HEX, tokenBHex: USDC, reserveA: 10n * E18, reserveB: 1000n, feeBps: 30, tokenADecimals: 18, tokenBDecimals: 0 };
const v9 = { poolHex: `0x${'11'.repeat(32)}`, tokenAHex: USDC, tokenBHex: TBOING, reserveA: 100350n, reserveB: 99719n, feeBps: 30, tokenADecimals: 0, tokenBDecimals: 0 };

test('wBOING is listed as native BOING with 18 decimals; other tokens unchanged', () => {
  const list = custodyTokenList([v9, v10]);
  const boing = list.find((t) => t.id === WBOING_HEX);
  assert.equal(boing.symbol, 'BOING');
  assert.equal(boing.decimals, 18);
  assert.equal(boing.native, true);
  assert.equal(list.some((t) => /wBOING/i.test(t.symbol)), false);
  assert.deepEqual(
    list.filter((t) => !t.native).map((t) => [t.symbol, t.decimals]),
    [['USDC', 0], ['tBOING', 0]],
  );
});

test('amounts: parse / format / sanitize with decimals', () => {
  assert.equal(parseTokenAmount('1', 18), E18);
  assert.equal(parseTokenAmount('1.5', 18), 15n * 10n ** 17n);
  assert.equal(parseTokenAmount('.25', 18), 25n * 10n ** 16n);
  assert.equal(parseTokenAmount('1.5', 0), null);
  assert.equal(parseTokenAmount('0', 18), null);
  assert.equal(parseTokenAmount('12', 0), 12n);
  assert.equal(formatTokenAmount(1234n * E18 + 5n * 10n ** 17n, 18), '1,234.5');
  assert.equal(formatTokenAmount(1n, 18), '<0.000001');
  assert.equal(formatTokenAmount(1000n, 0), '1,000');
  assert.equal(toAmountInput(15n * 10n ** 17n, 18), '1.5');
  assert.equal(sanitizeAmountInput('1.2.3a', 18), '1.23');
  assert.equal(sanitizeAmountInput('1.5', 0), '15');
});

test('BOING pairs route to the v10 pool and quote per whole token', () => {
  const r = pickBestCustodyPool([v9, v10], WBOING_HEX, USDC, E18);
  assert.equal(r.pool.poolHex, POOL);
  assert.equal(isNativeBoingPool(r.pool), true);
  assert.equal(isNativeBoingPool(v9), false);
  // 1 BOING into 10 BOING / 1000 USDC: floor(1000 * 0.997 / 10.997) = 90 USDC.
  assert.equal(r.quote.amountOut, 90n);
  // 1 BOING is ~9% of the pool: real price impact, but flooring 90.66 -> 90 USDC loses < 1% (no rounding hint).
  assert.ok(r.quote.priceImpactBps > 800);
  assert.ok(r.quote.roundingLossBps < 100);
  // 2 USDC into a 100 / 99 whole-unit pool: flooring dominates.
  const tiny = pickBestCustodyPool([{ ...v9, reserveA: 100n, reserveB: 99n }], USDC, TBOING, 2n);
  assert.ok(tiny.quote.roundingLossBps >= 100);
  assert.equal(formatRate(1, spotRateAfterFee(v10, WBOING_HEX)), '99.7');
  assert.equal(formatRate(E18, 90n, 18, 0), '90');
  assert.equal(formatRate(1, spotRateAfterFee(v10, USDC)), '0.00997');
  // v8/v9 pools keep working with whole units.
  assert.equal(pickBestCustodyPool([v9, v10], USDC, TBOING, 100n).pool.poolHex, v9.poolHex);
});

test('pool card shows BOING amounts and per-token prices', () => {
  const tokens = custodyTokenList([v10]);
  const c = poolCard(v10, tokens, { balance: 100n, totalLp: 1000n });
  assert.equal(c.pairLabel, 'BOING / USDC');
  assert.equal(c.native, true);
  assert.equal(c.liquidityLine, '10 BOING + 1,000 USDC');
  assert.equal(c.priceLine, '1 BOING ≈ 100 USDC');
  assert.equal(c.priceLineInverse, '1 USDC ≈ 0.01 BOING');
  assert.equal(c.youA, E18);
  assert.equal(c.youB, 100n);
  assert.equal(pairedAmount(c, 'b', 10n), E18 / 10n);
});

test('native add / remove liquidity are single batches (wrap with value, unwrap at the end)', () => {
  const add = buildNativeAddLiquidityRequest({ poolHex: POOL, tokenAHex: WBOING_HEX, tokenBHex: USDC, amountA: E18, amountB: 100n, minLp: 9n, senderHex: ME });
  assert.equal(add.type, 'batch');
  assert.equal(add.calls.length, 4);
  assert.deepEqual(add.calls.map((c) => c.value ?? null), [String(E18), null, null, null]);
  assert.deepEqual(add.calls.map((c) => c.contract), [WBOING_HEX, WBOING_HEX, USDC, POOL]);
  const rm = buildNativeRemoveLiquidityRequest({ poolHex: POOL, tokenAHex: WBOING_HEX, tokenBHex: USDC, burn: 10n, minA: 1n, minB: 1n, senderHex: ME });
  assert.deepEqual(rm.calls.map((c) => c.contract), [POOL, WBOING_HEX]);
  assert.equal(rm.calls.every((c) => c.value == null), true);
  assert.ok(rm.access_list.write.includes(WBOING_HEX));
});

test('native swap plan: one batch, BOING value on the deposit step, unwrap on the way out', async () => {
  const state = { reserveA: 10n * E18, reserveB: 1000n, storedFeeBps: 30n, tokenAHex: WBOING_HEX, tokenBHex: USDC, totalLp: 1000n };
  // planNativeBoingSwap reads live state then calls this pure SDK planner with these inputs.
  const sdk = await import('@boing-network/boing-sdk');
  const plan = sdk.planBoingNativeSwap({
    poolHex: POOL, wboingHex: WBOING_HEX, state, assetIn: 'native', assetOut: USDC, amountIn: E18, slippageBps: 50n, senderHex: ME, nonce: 7n, poolVersion: 10,
  });
  assert.equal(plan.amountOut, 90n);
  assert.equal(plan.minOut, 89n);
  const req = sdk.boingTxToExpressRequest(plan.tx);
  assert.equal(req.type, 'batch');
  assert.equal(req.calls[0].value, String(E18));
  const back = sdk.planBoingNativeSwap({
    poolHex: POOL, wboingHex: WBOING_HEX, state, assetIn: USDC, assetOut: 'native', amountIn: 90n, slippageBps: 50n, senderHex: ME, nonce: 8n, poolVersion: 10,
  });
  assert.equal(back.mode, 'unwrap');
  assert.equal(sdk.boingTxToExpressRequest(back.tx).calls.at(-1).contract, WBOING_HEX);
  assert.equal(typeof planNativeBoingSwap, 'function');
});
