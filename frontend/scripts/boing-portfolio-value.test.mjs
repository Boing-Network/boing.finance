import test from 'node:test';
import assert from 'node:assert/strict';
import { poolCard, tokenPriceInBoing, lpPositionsInBoing } from '../src/services/boingPoolsSimple.js';
import { WBOING_HEX } from '../src/services/boingSwapQuote.js';

const USDC = `0x${'11'.repeat(32)}`;
const OTHER = `0x${'22'.repeat(32)}`;
const tokens = [
  { id: WBOING_HEX, symbol: 'BOING', decimals: 18 },
  { id: USDC, symbol: 'USDC', decimals: 6 },
  { id: OTHER, symbol: 'OTH', decimals: 0 },
];
const E18 = 10n ** 18n;

test('tokenPriceInBoing reads the BOING pool; native BOING is 1; unlisted is null', () => {
  // 1000 USDC : 500 BOING -> 1 USDC = 0.5 BOING
  const c = poolCard({ poolHex: `0x${'aa'.repeat(32)}`, tokenAHex: USDC, tokenBHex: WBOING_HEX, reserveA: 1000n * 10n ** 6n, reserveB: 500n * E18 }, tokens);
  assert.equal(tokenPriceInBoing(WBOING_HEX, [c]), 1);
  assert.ok(Math.abs(tokenPriceInBoing(USDC, [c]) - 0.5) < 1e-9);
  assert.equal(tokenPriceInBoing(OTHER, [c]), null);
});

test('lpPositionsInBoing values a 10% LP share from reserves', () => {
  const c = poolCard(
    { poolHex: `0x${'aa'.repeat(32)}`, tokenAHex: USDC, tokenBHex: WBOING_HEX, reserveA: 1000n * 10n ** 6n, reserveB: 500n * E18 },
    tokens,
    { balance: 10n, totalLp: 100n }
  );
  const unp = poolCard({ poolHex: `0x${'bb'.repeat(32)}`, tokenAHex: OTHER, tokenBHex: USDC, reserveA: 5n, reserveB: 5n }, tokens, { balance: 1n, totalLp: 5n });
  const r = lpPositionsInBoing([c, unp]);
  assert.equal(r.rows.length, 2);
  // 100 USDC (=50 BOING) + 50 BOING
  assert.ok(Math.abs(r.totalBoing - 100) < 1e-9);
  assert.equal(r.unpriced, 1);
});
