/**
 * Pure helpers for the simple Boing swap card: token labels, best custody pool, local quote, button state.
 * No React, no RPC (Node-testable: `node --test scripts/boing-swap-quote.test.mjs`).
 */

/** Known canonical testnet tokens (fallback labels when the indexer / directory has no metadata). */
export const KNOWN_BOING_TOKENS = Object.freeze({
  '0x6676f971ade3982406efa3e2cdb0477923f8f2a15624c4b6ad3a432817a75e93': { symbol: 'USDC', name: 'USD Coin (test)' },
  '0x6fce9d3e3f13df9fc17e3fd947148a4e6ce6966538b7dd9bf2a891d3b9699c6b': { symbol: 'tBOING', name: 'Boing Token (test)' },
});

const norm = (h) => (typeof h === 'string' ? h.trim().toLowerCase() : '');

/** Directory / indexer labels are often synthetic ("0x6676f971…a75e9", "Pool token 0x6676…"); never show those. */
const cleanLabel = (v) => {
  const t = typeof v === 'string' ? v.trim() : '';
  if (!t || /0x[0-9a-f]{4,}/i.test(t) || /^[0-9a-f]{16,}$/i.test(t)) return '';
  return t;
};

/**
 * Tokens tradable through custody pools, with symbol / name (never raw hex as a label).
 * @param {Array<{ tokenAHex: string, tokenBHex: string, tokenADecimals?: number|null, tokenBDecimals?: number|null }>} pools
 * @param {Array<{ id: string, symbol?: string, name?: string }>} directory
 */
export function custodyTokenList(pools, directory = []) {
  const byId = new Map();
  for (const d of directory || []) if (d?.id) byId.set(norm(d.id), d);
  const out = new Map();
  for (const p of pools || []) {
    for (const [hex, dec] of [[p.tokenAHex, p.tokenADecimals], [p.tokenBHex, p.tokenBDecimals]]) {
      const id = norm(hex);
      if (!id || out.has(id)) continue;
      const known = KNOWN_BOING_TOKENS[id];
      const d = byId.get(id);
      const symbol = known?.symbol || cleanLabel(d?.symbol) || 'Token';
      const name = cleanLabel(d?.name) || known?.name || 'Unlisted token';
      out.set(id, { id, symbol, name, decimals: typeof dec === 'number' ? dec : 0 });
    }
  }
  return [...out.values()];
}

/**
 * Constant-product quote matching the custody pools (v7+ fee-on-input, all floors, whole units):
 * inAfterFee = floor(in * (10000 - fee) / 10000); out = floor(rOut * inAfterFee / (rIn + inAfterFee)).
 * Price impact is measured against the fee-adjusted spot price, so whole-unit rounding loss on tiny trades shows up.
 */
export function quoteCustodyPoolLocal(pool, tokenInHex, amountIn) {
  const inIsA = norm(tokenInHex) === norm(pool.tokenAHex);
  const rIn = BigInt(inIsA ? pool.reserveA : pool.reserveB);
  const rOut = BigInt(inIsA ? pool.reserveB : pool.reserveA);
  const fee = BigInt(pool.feeBps ?? 30);
  const a = BigInt(amountIn);
  if (a <= 0n || rIn <= 0n || rOut <= 0n) return null;
  const aAfterFee = (a * (10000n - fee)) / 10000n;
  const amountOut = aAfterFee > 0n ? (rOut * aAfterFee) / (rIn + aAfterFee) : 0n;
  // ideal = a * (1 - fee) * rOut / rIn, kept as a fraction (idealNum / (rIn * 10000)).
  const idealNum = a * (10000n - fee) * rOut;
  const priceImpactBps = idealNum > 0n ? Number(((idealNum - amountOut * rIn * 10000n) * 10000n) / idealNum) : 0;
  const feeAmount = (a * fee + 9999n) / 10000n;
  return { amountOut, priceImpactBps, feeBps: Number(fee), feeAmount, rIn, rOut };
}

/** Marginal rate for 1 unit of `tokenInHex` after the pool fee (reserve ratio; number, display only). */
export function spotRateAfterFee(pool, tokenInHex) {
  if (!pool) return null;
  const inIsA = norm(tokenInHex) === norm(pool.tokenAHex);
  const rIn = Number(inIsA ? pool.reserveA : pool.reserveB);
  const rOut = Number(inIsA ? pool.reserveB : pool.reserveA);
  if (!(rIn > 0) || !(rOut > 0)) return null;
  return (rOut / rIn) * (1 - Number(pool.feeBps ?? 30) / 10000);
}

/** Exact LP fee on `amountIn` as a short decimal string ("0.015"); tokens are whole units, the fee is pro-rata. */
export function formatFee(amountIn, feeBps) {
  if (!amountIn || feeBps == null) return null;
  const v = (Number(amountIn) * Number(feeBps)) / 10000;
  if (!Number.isFinite(v)) return null;
  return v >= 1000 ? v.toLocaleString('en-US', { maximumFractionDigits: 0 }) : String(Number(v.toPrecision(4)));
}

/** Best direct custody pool for the pair (highest output for `amountIn`, or deepest when no amount). */
export function pickBestCustodyPool(pools, tokenInHex, tokenOutHex, amountIn) {
  const a = norm(tokenInHex);
  const b = norm(tokenOutHex);
  if (!a || !b || a === b) return null;
  const candidates = (pools || []).filter((p) => {
    const x = norm(p.tokenAHex);
    const y = norm(p.tokenBHex);
    return (x === a && y === b) || (x === b && y === a);
  });
  let best = null;
  for (const p of candidates) {
    const q = amountIn && amountIn > 0n ? quoteCustodyPoolLocal(p, a, amountIn) : null;
    const score = q ? q.amountOut : BigInt(norm(p.tokenAHex) === a ? p.reserveB : p.reserveA);
    if (!best || score > best.score) best = { pool: p, quote: q, score };
  }
  return best;
}

/** Parse a whole-number amount (tokens have 0 decimals); null for empty / invalid / zero. */
export function parseWholeAmount(raw) {
  const t = String(raw ?? '').trim().replace(/,/g, '');
  if (!/^\d+$/.test(t)) return null;
  const n = BigInt(t);
  return n > 0n ? n : null;
}

/** min out = floor(out * (1 - slippage)). */
export function minReceived(amountOut, slippagePercent) {
  const bps = BigInt(Math.max(0, Math.min(5000, Math.round(Number(slippagePercent) * 100))));
  return (BigInt(amountOut) * (10000n - bps)) / 10000n;
}

/**
 * Primary button: one of connect / enter_amount / no_route / insufficient / approve_swap / swap / busy.
 * @returns {{ kind: string, label: string, disabled: boolean }}
 */
export function swapButtonState({ connected, wrongNetwork, amountIn, balance, hasRoute, needsApproval, busyLabel, symbolIn }) {
  if (busyLabel) return { kind: 'busy', label: busyLabel, disabled: true };
  if (!connected) return { kind: 'connect', label: 'Connect wallet', disabled: false };
  if (wrongNetwork) return { kind: 'wrong_network', label: 'Switch to Boing testnet', disabled: true };
  if (!amountIn) return { kind: 'enter_amount', label: 'Enter amount', disabled: true };
  if (!hasRoute) return { kind: 'no_route', label: 'No route for this pair', disabled: true };
  if (balance != null && amountIn > balance) return { kind: 'insufficient', label: `Insufficient ${symbolIn} balance`, disabled: true };
  if (needsApproval) return { kind: 'approve_swap', label: `Approve ${symbolIn} & swap`, disabled: false };
  return { kind: 'swap', label: 'Swap', disabled: false };
}

/** Thousands separators for whole amounts. */
export function formatWhole(n) {
  if (n == null) return '—';
  return BigInt(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Rate "x.xxx" (4 significant digits): pass (amountIn, amountOut), or (1, spotRateAfterFee(...)). */
export function formatRate(amountIn, amountOut) {
  if (!amountIn || amountOut == null) return null;
  const r = Number(amountOut) / Number(amountIn);
  if (!Number.isFinite(r) || r <= 0) return null;
  return r >= 1000 ? r.toLocaleString('en-US', { maximumFractionDigits: 0 }) : r.toPrecision(4).replace(/\.?0+$/, '');
}
