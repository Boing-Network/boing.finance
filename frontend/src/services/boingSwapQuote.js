/**
 * Pure helpers for the simple Boing swap card: token labels, best custody pool, local quote, button state.
 * No React, no RPC (Node-testable: `node --test scripts/boing-swap-quote.test.mjs`).
 */

/**
 * Canonical testnet wBOING (wrapped native BOING, 18 decimals). The UI never shows wBOING: it appears as native
 * "BOING" and swaps / liquidity wrap and unwrap it automatically in the same signed batch.
 */
export const WBOING_HEX = (
  (typeof process !== 'undefined' && process.env?.REACT_APP_BOING_WBOING?.trim()) ||
  '0x35555ffee114ba1698dcb6cd5f6d0ce56bf264dc6f386991c00cab22020d9c55'
).toLowerCase();

/** Native BOING has 18 decimals. */
export const BOING_DECIMALS = 18;

/** Keep this much native BOING back on "Max" so the network fee (or the 1 BOING failed-tx fee) can still be paid. */
export const NATIVE_FEE_RESERVE = 1000000000000000000n;

/** True when `id` is the token the UI shows as native BOING (wBOING). */
export const isNativeBoingId = (id) => typeof id === 'string' && id.trim().toLowerCase() === WBOING_HEX;

/** Known canonical testnet tokens (fallback labels when the indexer / directory has no metadata). */
export const KNOWN_BOING_TOKENS = Object.freeze({
  [WBOING_HEX]: { symbol: 'BOING', name: 'Boing (native)', native: true, decimals: BOING_DECIMALS },
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
      const decimals = known?.decimals ?? (typeof dec === 'number' ? dec : 0);
      out.set(id, { id, symbol, name, decimals, native: Boolean(known?.native) });
    }
  }
  return [...out.values()];
}

/**
 * Pool tokens that would still be labelled "Token" / "Unlisted token" (no known label, no real directory name).
 * The card looks these up with a full `boing_getDexToken` (the light directory only returns hex placeholders).
 * @param {Array<{ tokenAHex: string, tokenBHex: string }>} pools
 * @param {Array<{ id: string, symbol?: string, name?: string }>} directory
 * @returns {string[]}
 */
export function custodyTokensNeedingMetadata(pools, directory = []) {
  const byId = new Map();
  for (const d of directory || []) if (d?.id) byId.set(norm(d.id), d);
  const out = new Set();
  for (const p of pools || []) {
    for (const hex of [p.tokenAHex, p.tokenBHex]) {
      const id = norm(hex);
      if (!id || KNOWN_BOING_TOKENS[id]) continue;
      const d = byId.get(id);
      if (!cleanLabel(d?.symbol)) out.add(id);
    }
  }
  return [...out];
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
  // Share of the output lost to flooring to whole base units (vs the exact constant-product result).
  const cpNum = rOut * aAfterFee;
  const cpDen = rIn + aAfterFee;
  const roundingLossBps = cpNum > 0n ? Number(((cpNum - amountOut * cpDen) * 10000n) / cpNum) : 0;
  return { amountOut, priceImpactBps, roundingLossBps, feeBps: Number(fee), feeAmount, rIn, rOut };
}

/**
 * Marginal rate for 1 whole `tokenInHex` after the pool fee, in whole `tokenOut` (number, display only).
 * Decimals default to the pool row's (`tokenADecimals` / `tokenBDecimals`); wBOING is 18, testnet tokens 0.
 */
export function spotRateAfterFee(pool, tokenInHex, decIn, decOut) {
  if (!pool) return null;
  const inIsA = norm(tokenInHex) === norm(pool.tokenAHex);
  const rIn = Number(inIsA ? pool.reserveA : pool.reserveB);
  const rOut = Number(inIsA ? pool.reserveB : pool.reserveA);
  if (!(rIn > 0) || !(rOut > 0)) return null;
  const dA = poolSideDecimals(pool, 'a');
  const dB = poolSideDecimals(pool, 'b');
  const di = decIn ?? (inIsA ? dA : dB);
  const dout = decOut ?? (inIsA ? dB : dA);
  return (rOut / rIn) * 10 ** (di - dout) * (1 - Number(pool.feeBps ?? 30) / 10000);
}

/** Decimals of pool side `'a'` / `'b'` (known tokens win over the listing; default 0). */
export function poolSideDecimals(pool, side) {
  const hex = side === 'a' ? pool?.tokenAHex : pool?.tokenBHex;
  const known = KNOWN_BOING_TOKENS[norm(hex)];
  if (known?.decimals != null) return known.decimals;
  const d = side === 'a' ? pool?.tokenADecimals : pool?.tokenBDecimals;
  return typeof d === 'number' ? d : 0;
}

/** LP fee on `amountIn` (base units of a `decimals` token) as a short decimal string ("0.015"). */
export function formatFee(amountIn, feeBps, decimals = 0) {
  if (!amountIn || feeBps == null) return null;
  const v = (Number(amountIn) / 10 ** decimals) * (Number(feeBps) / 10000);
  if (!Number.isFinite(v)) return null;
  return v >= 1000 ? v.toLocaleString('en-US', { maximumFractionDigits: 0 }) : String(Number(v.toPrecision(4)));
}

/** True when the pool pairs native BOING (wBOING): those are v10 pools, swapped through an auto-wrap batch. */
export function isNativeBoingPool(pool) {
  return Boolean(pool) && (isNativeBoingId(pool.tokenAHex) || isNativeBoingId(pool.tokenBHex));
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

/**
 * Parse a user amount for a token with `decimals` (0 = whole units only) into base units; null for empty,
 * invalid, zero, or more fraction digits than the token has.
 */
export function parseTokenAmount(raw, decimals = 0) {
  const t = String(raw ?? '').trim().replace(/,/g, '');
  if (!t || t === '.' || !/^\d*(\.\d*)?$/.test(t)) return null;
  const [w, f = ''] = t.split('.');
  if (f.length > decimals) return null;
  const d = BigInt(decimals);
  const n = BigInt(w || '0') * 10n ** d + BigInt((f + '0'.repeat(decimals)).slice(0, decimals) || '0');
  return n > 0n ? n : null;
}

/** Keep only what an amount field for `decimals` may hold (digits, one dot, at most `decimals` fraction digits). */
export function sanitizeAmountInput(raw, decimals = 0) {
  const s = String(raw ?? '').replace(/,/g, '');
  if (!decimals) return s.replace(/[^\d]/g, '');
  const cleaned = s.replace(/[^\d.]/g, '');
  const i = cleaned.indexOf('.');
  if (i < 0) return cleaned;
  return `${cleaned.slice(0, i)}.${cleaned.slice(i + 1).replace(/\./g, '').slice(0, decimals)}`;
}

/** Base units -> plain decimal string for an input field (no separators, full precision, no trailing zeros). */
export function toAmountInput(n, decimals = 0) {
  if (n == null) return '';
  const v = BigInt(n);
  if (!decimals) return v.toString();
  const base = 10n ** BigInt(decimals);
  const f = (v % base).toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${v / base}${f ? `.${f}` : ''}`;
}

/** Base units -> readable amount ("1,234.5678"); `maxFrac` fraction digits (truncated), "<0.000001" for dust. */
export function formatTokenAmount(n, decimals = 0, maxFrac = 6) {
  if (n == null) return '—';
  const v = BigInt(n);
  if (!decimals) return formatWhole(v);
  const base = 10n ** BigInt(decimals);
  const w = v / base;
  const f = (v % base).toString().padStart(decimals, '0').slice(0, maxFrac).replace(/0+$/, '');
  if (w === 0n && !f && v > 0n) return `<0.${'0'.repeat(Math.max(0, maxFrac - 1))}1`;
  return `${formatWhole(w)}${f ? `.${f}` : ''}`;
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
export function swapButtonState({ connected, wrongNetwork, amountIn, balance, hasRoute, needsApproval, busyLabel, symbolIn, walletNeedsUpdate = false }) {
  if (busyLabel) return { kind: 'busy', label: busyLabel, disabled: true };
  if (!connected) return { kind: 'connect', label: 'Connect wallet', disabled: false };
  if (wrongNetwork) return { kind: 'wrong_network', label: 'Switch to Boing testnet', disabled: true };
  if (!amountIn) return { kind: 'enter_amount', label: 'Enter amount', disabled: true };
  if (!hasRoute) return { kind: 'no_route', label: 'No route for this pair', disabled: true };
  // Paying with BOING sends it with the wrap call, which older Boing Express versions cannot sign.
  if (walletNeedsUpdate) return { kind: 'update_wallet', label: `Update Boing Express to swap ${symbolIn || 'BOING'}`, disabled: true };
  if (balance != null && amountIn > balance) return { kind: 'insufficient', label: `Insufficient ${symbolIn} balance`, disabled: true };
  if (needsApproval) return { kind: 'approve_swap', label: `Approve ${symbolIn} & swap`, disabled: false };
  return { kind: 'swap', label: 'Swap', disabled: false };
}

/** Thousands separators for whole amounts. */
export function formatWhole(n) {
  if (n == null) return '—';
  return BigInt(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Rate "x.xxx" (4 significant digits): pass (amountIn, amountOut), or (1, spotRateAfterFee(...)).
 * With base-unit amounts of tokens with decimals, pass `decIn` / `decOut` so the rate is per whole token.
 */
export function formatRate(amountIn, amountOut, decIn = 0, decOut = 0) {
  if (!amountIn || amountOut == null) return null;
  const r = (Number(amountOut) / Number(amountIn)) * 10 ** (decIn - decOut);
  if (!Number.isFinite(r) || r <= 0) return null;
  if (r >= 1000) return r.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (r < 0.0001) return r.toExponential(2);
  return r.toPrecision(4).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

/**
 * Token picker search: match symbol / name (case-insensitive, prefix or substring) or a pasted 32-byte address.
 * `unlistedAddress` is set when the query is an address that no pool trades yet (UI: "No pool yet — create one").
 * @returns {{ matches: Array<{ id: string, symbol: string, name: string }>, unlistedAddress: string | null }}
 */
export function filterPickerTokens(tokens, query) {
  const list = tokens || [];
  const q = norm(query);
  if (!q) return { matches: list, unlistedAddress: null };
  if (/^0x[0-9a-f]{64}$/.test(q)) {
    const hit = list.filter((t) => norm(t.id) === q);
    return { matches: hit, unlistedAddress: hit.length ? null : q };
  }
  const score = (t) => {
    const s = norm(t.symbol);
    const n = norm(t.name);
    if (s === q) return 0;
    if (s.startsWith(q)) return 1;
    if (s.includes(q)) return 2;
    if (n.includes(q)) return 3;
    if (q.length >= 6 && norm(t.id).includes(q.replace(/^0x/, ''))) return 4;
    return -1;
  };
  const matches = list
    .map((t) => [score(t), t])
    .filter(([s]) => s >= 0)
    .sort((a, b) => a[0] - b[0])
    .map(([, t]) => t);
  return { matches, unlistedAddress: null };
}
