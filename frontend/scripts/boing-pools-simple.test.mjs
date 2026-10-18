import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addLiquidityPreview,
  containsRawHex,
  filterPoolCards,
  formatSharePct,
  lpMinted,
  pairedAmount,
  poolCard,
  removeLiquidityPreview,
  withSlippageFloor,
} from '../src/services/boingPoolsSimple.js';

const USDC = '0x6676f971ade3982406efa3e2cdb0477923f8f2a15624c4b6ad3a432817a75e93';
const TB = '0x6fce9d3e3f13df9fc17e3fd947148a4e6ce6966538b7dd9bf2a891d3b9699c6b';
const FV = '0x31357854f6371c8bafac0ff20296608d87db532bef06de8066d1fdd32c824b4e';
const tokens = [
  { id: USDC, symbol: 'USDC', name: 'USD Coin (test)' },
  { id: TB, symbol: 'tBOING', name: 'Boing Token (test)' },
  { id: FV, symbol: 'FV2C', name: 'Fresh v2 coin' },
];
const usdcTb = { poolHex: '0x2ad75c2e11b1e93761f4f8df39502deecbe7148324e5a80a951798142b2c5b61', tokenAHex: USDC, tokenBHex: TB, reserveA: 100350n, reserveB: 99719n, feeBps: 30 };
const fvUsdc = { poolHex: '0x9261b793dd4dcfbd7a0583b19b525f34910ecd5ce6b34d0520b3e8351b20c02e', tokenAHex: FV, tokenBHex: USDC, reserveA: 1000n, reserveB: 100n, feeBps: 30 };

test('pool cards: pair, liquidity, price, no hex', () => {
  const c = poolCard(fvUsdc, tokens);
  assert.equal(c.pairLabel, 'FV2C / USDC');
  assert.equal(c.liquidityLine, '1,000 FV2C + 100 USDC');
  assert.equal(c.priceLine, '1 FV2C ≈ 0.1 USDC');
  assert.equal(c.priceLineInverse, '1 USDC ≈ 10 FV2C');
  const u = poolCard(usdcTb, tokens);
  assert.equal(u.pairLabel, 'USDC / tBOING');
  assert.equal(u.priceLine, '1 USDC ≈ 0.9937 tBOING');
  for (const s of [c.pairLabel, c.liquidityLine, c.priceLine, u.pairLabel, u.liquidityLine, u.priceLine]) assert.ok(!containsRawHex(s));
  assert.equal(c.sharePct, null);
});

test('share and what you would get back', () => {
  const c = poolCard(usdcTb, tokens, { balance: 10000n, totalLp: 100000n });
  assert.equal(c.sharePct, '10.00%');
  assert.equal(c.youA, 10035n);
  assert.equal(c.youB, 9971n);
  assert.equal(formatSharePct(1n, 1000000n), '<0.01%');
});

test('search by symbol, pair or pasted address', () => {
  const cards = [poolCard(usdcTb, tokens), poolCard(fvUsdc, tokens)];
  assert.deepEqual(filterPoolCards(cards, 'fv2c').map((c) => c.pairLabel), ['FV2C / USDC']);
  assert.deepEqual(filterPoolCards(cards, 'usdc').length, 2);
  assert.deepEqual(filterPoolCards(cards, 'usdc / tboing').map((c) => c.pairLabel), ['USDC / tBOING']);
  assert.deepEqual(filterPoolCards(cards, TB.toUpperCase().replace('0X', '0x')).map((c) => c.pairLabel), ['USDC / tBOING']);
  assert.equal(filterPoolCards(cards, 'doge').length, 0);
});

test('add preview: auto-fill at the pool ratio and share you will own', () => {
  const c = poolCard(fvUsdc, tokens, { balance: 0n, totalLp: 316n });
  assert.equal(pairedAmount(c, 'a', 100n), 10n); // 100 FV2C pairs with 10 USDC
  assert.equal(pairedAmount(c, 'b', 10n), 100n);
  assert.equal(pairedAmount(c, 'a', 5n), 1n); // rounded up
  const p = addLiquidityPreview(c, 100n, 10n);
  assert.equal(p.minted, 31n); // min(100*316/1000, 10*316/100) = min(31, 31)
  assert.equal(p.sharePct, '8.93%'); // 31 / 347
  assert.equal(lpMinted(0n, 0n, 0n, 50n, 20n), 20n); // first deposit
  assert.equal(addLiquidityPreview(c, 1n, 1n).tooSmall, true);
});

test('remove preview: 25/50/75/Max', () => {
  const c = poolCard(usdcTb, tokens, { balance: 1000n, totalLp: 100000n });
  assert.deepEqual(removeLiquidityPreview(c, 25), { burn: 250n, outA: 250n, outB: 249n });
  assert.deepEqual(removeLiquidityPreview(c, 50), { burn: 500n, outA: 501n, outB: 498n });
  assert.deepEqual(removeLiquidityPreview(c, 100), { burn: 1000n, outA: 1003n, outB: 997n });
  assert.equal(withSlippageFloor(1003n, 0.5), 997n);
  assert.deepEqual(removeLiquidityPreview(poolCard(usdcTb, tokens), 50), { burn: 0n, outA: 0n, outB: 0n });
});

// Pools and Your liquidity moved from the Swap page tabs to /pools: old links redirect, cards link back to Swap.
import { poolsRedirectFromSwapSearch, parsePoolsTab, boingSwapPairHref, boingAddLiquidityHref } from '../src/utils/swapPoolsRedirect.js';

test('old Swap → Pools / Your liquidity links redirect to /pools; pool cards deep-link to Swap', () => {
  const P = `0x${'Ab'.repeat(32)}`;
  const p = `0x${'ab'.repeat(32)}`;
  assert.equal(poolsRedirectFromSwapSearch('?nativeTradeTab=pools'), '/pools');
  assert.equal(poolsRedirectFromSwapSearch('?tab=pools'), '/pools');
  assert.equal(poolsRedirectFromSwapSearch('?noIntro=1&nativeTradeTab=Pools'), '/pools?noIntro=1');
  assert.equal(poolsRedirectFromSwapSearch(`?nativePool=${P}`), `/pools?pool=${p}`);
  assert.equal(poolsRedirectFromSwapSearch('?nativePool=0x12'), null);
  assert.equal(poolsRedirectFromSwapSearch('?nativeTradeTab=liquidity'), '/pools?tab=liquidity');
  assert.equal(poolsRedirectFromSwapSearch('?tab=liquidity&noIntro=1'), '/pools?tab=liquidity&noIntro=1');
  assert.equal(poolsRedirectFromSwapSearch(`?nativeTradeTab=liquidity&addPool=${P}`), `/pools?tab=liquidity&addPool=${p}`);
  assert.equal(poolsRedirectFromSwapSearch(`?addPool=${P}`), `/pools?tab=liquidity&addPool=${p}`);
  assert.equal(poolsRedirectFromSwapSearch('?nativeTradeTab=advanced'), null);
  assert.equal(poolsRedirectFromSwapSearch('?nativeTradeTab=swap&nativeTokenIn=0xaa'), null);
  assert.equal(poolsRedirectFromSwapSearch(''), null);
  assert.equal(parsePoolsTab('liquidity'), 'liquidity');
  assert.equal(parsePoolsTab(null), 'all');
  assert.equal(parsePoolsTab('pools'), 'all');
  assert.equal(boingSwapPairHref('0xaa', '0xbb'), '/swap?nativeTokenIn=0xaa&nativeTokenOut=0xbb');
  assert.equal(boingAddLiquidityHref(P), `/pools?tab=liquidity&addPool=${P}`);
});
