/**
 * Pure helpers for the simple Pools / Your liquidity tabs (custody v8/v9 pools with whole-unit v2 tokens, and
 * v10 native BOING pools where wBOING is shown as BOING with 18 decimals). Amounts are base units.
 * No React, no RPC: Node-testable (`node --test scripts/boing-pools-simple.test.mjs`).
 * Math mirrors the pool bytecode: LP minted = min(a*T/ra, b*T/rb) (first deposit min(a, b));
 * remove pays floor(burn*ra/T), floor(burn*rb/T).
 */
import { formatTokenAmount, isNativeBoingPool, poolSideDecimals } from './boingSwapQuote.js';

const norm = (h) => (typeof h === 'string' ? h.trim().toLowerCase() : '');
const big = (v) => {
  try {
    return typeof v === 'bigint' ? v : BigInt(v ?? 0);
  } catch {
    return 0n;
  }
};

/** Short readable number for a ratio (4 significant digits, no trailing zeros). */
export function formatRatio(r) {
  if (!Number.isFinite(r) || r <= 0) return null;
  if (r >= 1000) return r.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (r >= 0.0001) return String(Number(r.toPrecision(4)));
  return r.toExponential(2);
}

/** Share of `part` in `total` as a percent string ("12.34%"), "<0.01%" for dust, null when no total. */
export function formatSharePct(part, total) {
  const p = big(part);
  const t = big(total);
  if (t <= 0n || p <= 0n) return null;
  const bps = (p * 10000n) / t;
  if (bps === 0n) return '<0.01%';
  return `${bps / 100n}.${(bps % 100n).toString().padStart(2, '0')}%`;
}

/**
 * Pool card model. `tokens`: list from `custodyTokenList` ({ id, symbol, name }).
 * `lp` (optional): { balance, totalLp } for the connected wallet.
 */
export function poolCard(pool, tokens, lp = null) {
  const byId = new Map((tokens || []).map((t) => [norm(t.id), t]));
  const a = byId.get(norm(pool.tokenAHex)) || { id: norm(pool.tokenAHex), symbol: 'Token', name: 'Unlisted token' };
  const b = byId.get(norm(pool.tokenBHex)) || { id: norm(pool.tokenBHex), symbol: 'Token', name: 'Unlisted token' };
  const ra = big(pool.reserveA);
  const rb = big(pool.reserveB);
  const decA = a.decimals ?? poolSideDecimals(pool, 'a');
  const decB = b.decimals ?? poolSideDecimals(pool, 'b');
  // Prices per whole token (reserves are base units).
  const priceBperA = ra > 0n && rb > 0n ? (Number(rb) / Number(ra)) * 10 ** (decA - decB) : null;
  const priceAperB = ra > 0n && rb > 0n ? (Number(ra) / Number(rb)) * 10 ** (decB - decA) : null;
  const balance = lp ? big(lp.balance) : 0n;
  const totalLp = lp ? big(lp.totalLp) : 0n;
  const [youA, youB] = balance > 0n && totalLp > 0n ? [(balance * ra) / totalLp, (balance * rb) / totalLp] : [0n, 0n];
  return {
    poolHex: norm(pool.poolHex),
    tokenA: a,
    tokenB: b,
    pairLabel: `${a.symbol} / ${b.symbol}`,
    decimalsA: decA,
    decimalsB: decB,
    /** v10 pool pairing native BOING: deposits wrap and withdrawals unwrap automatically. */
    native: isNativeBoingPool(pool),
    reserveA: ra,
    reserveB: rb,
    feeBps: pool.feeBps ?? 30,
    liquidityLine: `${formatTokenAmount(ra, decA, 4)} ${a.symbol} + ${formatTokenAmount(rb, decB, 4)} ${b.symbol}`,
    /** "1 USDC ≈ 0.9937 tBOING" (B per A) and the inverse. */
    priceLine: priceBperA != null ? `1 ${a.symbol} ≈ ${formatRatio(priceBperA)} ${b.symbol}` : 'No liquidity yet',
    priceLineInverse: priceAperB != null ? `1 ${b.symbol} ≈ ${formatRatio(priceAperB)} ${a.symbol}` : null,
    empty: !(ra > 0n && rb > 0n),
    lpBalance: balance,
    totalLp,
    sharePct: formatSharePct(balance, totalLp),
    youA,
    youB,
  };
}

/** Filter cards by symbol / name / pasted token or pool address (case-insensitive). */
export function filterPoolCards(cards, query) {
  const q = norm(query).replace(/\s+/g, ' ');
  if (!q) return cards || [];
  const parts = q.split(/[\s/]+/).filter(Boolean);
  return (cards || []).filter((c) => {
    const hay = [c.tokenA.symbol, c.tokenA.name, c.tokenB.symbol, c.tokenB.name, c.tokenA.id, c.tokenB.id, c.poolHex]
      .map((s) => norm(s))
      .join(' ');
    return parts.every((p) => hay.includes(p));
  });
}

/** Other side of a deposit at the pool ratio (rounded up so the full `amount` counts), null for an empty pool. */
export function pairedAmount(card, side, amount) {
  const x = big(amount);
  if (x <= 0n || card.empty) return null;
  const [rIn, rOut] = side === 'a' ? [card.reserveA, card.reserveB] : [card.reserveB, card.reserveA];
  return (x * rOut + rIn - 1n) / rIn;
}

/** LP minted by add_liquidity (pool math). */
export function lpMinted(ra, rb, totalLp, a, b) {
  const A = big(a);
  const B = big(b);
  const RA = big(ra);
  const RB = big(rb);
  const T = big(totalLp);
  if (A <= 0n || B <= 0n) return 0n;
  if (T === 0n) return A < B ? A : B;
  if (RA === 0n || RB === 0n) return 0n;
  const x = (A * T) / RA;
  const y = (B * T) / RB;
  return x < y ? x : y;
}

/**
 * Add-liquidity preview: LP you get, resulting pool share, and how much of each token the pool actually uses
 * (the pool keeps the ratio; any excess on one side is not refunded by v8 pools, so the UI pairs amounts exactly).
 */
export function addLiquidityPreview(card, amountA, amountB, currentLp = 0n) {
  const a = big(amountA);
  const b = big(amountB);
  if (a <= 0n || b <= 0n) return null;
  const minted = lpMinted(card.reserveA, card.reserveB, card.totalLp, a, b);
  if (minted <= 0n) return { minted: 0n, sharePct: null, tooSmall: true };
  const newTotal = card.totalLp + minted;
  const mine = big(currentLp) + minted;
  return { minted, sharePct: formatSharePct(mine, newTotal), tooSmall: false };
}

/** Remove preview for `pct` (1..100) of the wallet's LP: burn amount and tokens received. */
export function removeLiquidityPreview(card, pct) {
  const p = BigInt(Math.max(0, Math.min(100, Math.round(Number(pct) || 0))));
  const burn = p === 100n ? card.lpBalance : (card.lpBalance * p) / 100n;
  if (burn <= 0n || card.totalLp <= 0n) return { burn: 0n, outA: 0n, outB: 0n };
  return { burn, outA: (burn * card.reserveA) / card.totalLp, outB: (burn * card.reserveB) / card.totalLp };
}

/** `floor(x * (10000 - bps) / 10000)` but never above x and at least 0 (min amounts for remove). */
export function withSlippageFloor(x, slippagePercent = 0.5) {
  const bps = BigInt(Math.max(0, Math.min(5000, Math.round(Number(slippagePercent) * 100))));
  return (big(x) * (10000n - bps)) / 10000n;
}

/** True when a visible string carries raw hex (>= 16 hex chars after 0x). */
export function containsRawHex(s) {
  return /0x[0-9a-f]{16,}/i.test(String(s ?? ''));
}
