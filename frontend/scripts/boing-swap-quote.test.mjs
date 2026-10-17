import test from 'node:test';
import assert from 'node:assert/strict';
import {
  custodyTokenList,
  custodyTokensNeedingMetadata,
  formatFee,
  formatRate,
  formatWhole,
  minReceived,
  parseWholeAmount,
  pickBestCustodyPool,
  quoteCustodyPoolLocal,
  spotRateAfterFee,
  swapButtonState,
} from '../src/services/boingSwapQuote.js';

const USDC = '0x6676f971ade3982406efa3e2cdb0477923f8f2a15624c4b6ad3a432817a75e93';
const TB = '0x6fce9d3e3f13df9fc17e3fd947148a4e6ce6966538b7dd9bf2a891d3b9699c6b';
const pool = { poolHex: '0x' + '2a'.repeat(32), tokenAHex: USDC, tokenBHex: TB, reserveA: 100330n, reserveB: 99737n, feeBps: 30, tokenADecimals: 0, tokenBDecimals: 0 };

test('token list uses symbols and names, never hex', () => {
  const list = custodyTokenList([pool], []);
  assert.deepEqual(list.map((t) => [t.symbol, t.name]), [['USDC', 'USD Coin (test)'], ['tBOING', 'Boing Token (test)']]);
  const unknown = custodyTokenList([{ ...pool, tokenAHex: '0x' + 'ab'.repeat(32) }], []);
  assert.equal(unknown[0].symbol, 'Token');
  assert.ok(!/0x/.test(unknown[0].name));
  assert.equal(custodyTokenList([pool], [{ id: USDC.toUpperCase().replace('0X', '0x'), symbol: 'USDC', name: 'USD Coin' }])[0].name, 'USD Coin');
  // Synthetic indexer labels (hex) are ignored in favour of known names.
  const synth = custodyTokenList([pool], [{ id: USDC, symbol: '0x6676f971…a75e9', name: 'Pool token 0x6676f971ad' }]);
  assert.deepEqual([synth[0].symbol, synth[0].name], ['USDC', 'USD Coin (test)']);
});

test('local quote matches constant product with fee', () => {
  const q = quoteCustodyPoolLocal(pool, USDC, 10n);
  // fee-on-input like the v9 pool: floor(10*9970/10000)=9; floor(99737*9/(100330+9)) = 8
  assert.equal(q.amountOut, 8n);
  // 1000 in: floor(997) -> floor(99737*997/101327) = 981; rounding loss is small at this size
  assert.equal(quoteCustodyPoolLocal(pool, USDC, 1000n).amountOut, 981n);
  assert.ok(quoteCustodyPoolLocal(pool, USDC, 1000n).priceImpactBps < 150);
  assert.equal(q.feeBps, 30);
  assert.equal(q.feeAmount, 1n);
  const big = quoteCustodyPoolLocal(pool, USDC, 50000n);
  assert.ok(big.priceImpactBps > 3000, `impact ${big.priceImpactBps}`);
  assert.equal(quoteCustodyPoolLocal(pool, TB, 0n), null);
});

test('best pool picks the higher output among matching pools, either direction', () => {
  const deeper = { ...pool, poolHex: '0x' + '3b'.repeat(32), reserveA: 1_000_000n, reserveB: 1_000_000n };
  assert.equal(pickBestCustodyPool([pool, deeper], USDC, TB, 1000n).pool.poolHex, deeper.poolHex);
  assert.equal(pickBestCustodyPool([pool], TB, USDC, 5n).pool.poolHex, pool.poolHex);
  assert.equal(pickBestCustodyPool([pool], USDC, USDC, 5n), null);
  assert.equal(pickBestCustodyPool([pool], USDC, '0x' + 'cd'.repeat(32), 5n), null);
});

test('whole amounts, min received, formatting', () => {
  assert.equal(parseWholeAmount('1,000'), 1000n);
  assert.equal(parseWholeAmount('1.5'), null);
  assert.equal(parseWholeAmount('0'), null);
  assert.equal(minReceived(1000n, 0.5), 995n);
  assert.equal(formatWhole(1234567n), '1,234,567');
  assert.equal(formatRate(10n, 9n), '0.9');
});

test('primary button states', () => {
  const base = { connected: true, amountIn: 5n, balance: 10n, hasRoute: true, needsApproval: false, symbolIn: 'USDC' };
  assert.equal(swapButtonState({ ...base, connected: false }).label, 'Connect wallet');
  assert.equal(swapButtonState({ ...base, amountIn: null }).label, 'Enter amount');
  assert.equal(swapButtonState({ ...base, amountIn: 11n }).label, 'Insufficient USDC balance');
  assert.equal(swapButtonState({ ...base, needsApproval: true }).label, 'Approve USDC & swap');
  assert.equal(swapButtonState(base).label, 'Swap');
  assert.equal(swapButtonState({ ...base, hasRoute: false }).kind, 'no_route');
  assert.equal(swapButtonState({ ...base, busyLabel: 'Swapping…' }).disabled, true);
});

test('spot rate and pro-rata fee display', () => {
  const r = spotRateAfterFee(pool, USDC);
  assert.ok(r > 0.99 && r < 0.995, `rate ${r}`);
  assert.equal(formatRate(1, r), '0.9911');
  assert.equal(formatFee(5n, 30), '0.015');
  assert.equal(formatFee(1000n, 30), '3');
});

test('tokens with only hex placeholder labels are looked up; real names then win', () => {
  const NEW = '0x31357854f6371c8bafac0ff20296608d87db532bef06de8066d1fdd32c824b4e';
  const pools2 = [pool, { ...pool, poolHex: '0x' + '3b'.repeat(32), tokenAHex: NEW, tokenBHex: USDC }];
  const light = [{ id: NEW, symbol: '0x31357854…824b4e', name: 'Pool token 0x31357854f6' }];
  assert.deepEqual(custodyTokensNeedingMetadata(pools2, light), [NEW]);
  const full = [...light, { id: NEW, symbol: 'FV2C', name: 'FinV2Check' }];
  assert.deepEqual(custodyTokensNeedingMetadata(pools2, full), []);
  const t = custodyTokenList(pools2, full).find((x) => x.id === NEW);
  assert.equal(t.symbol, 'FV2C');
  assert.equal(t.name, 'FinV2Check');
});
