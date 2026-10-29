/**
 * Attach a human-readable intent string for Boing Express approval UI.
 * Express 0.1.24+ shows `display` (or `description`) as Intent; older builds ignore unknown fields.
 * Not signed on-chain — presentation only.
 */

const MAX = 280;

/**
 * @param {Record<string, unknown>} txObject — Express `boing_signTransaction` / `boing_sendTransaction` object
 * @param {string | null | undefined} display — e.g. "Approve 10 YOLO to be swapped"
 * @returns {Record<string, unknown>}
 */
export function withBoingExpressDisplay(txObject, display) {
  if (!txObject || typeof txObject !== 'object') return txObject;
  if (display == null) return txObject;
  const t = String(display).trim().replace(/\s+/g, ' ');
  if (!t) return txObject;
  return { ...txObject, display: t.length > MAX ? `${t.slice(0, MAX - 1)}…` : t };
}

/**
 * Standard copy for DEX approve / swap prompts.
 * @param {{ kind: 'approve' | 'swap' | 'send', amount: string, symbol: string, amountOut?: string, symbolOut?: string, counterparty?: string }} p
 */
export function boingSwapIntentDisplay(p) {
  const amt = String(p.amount || '').trim() || '?';
  const sym = String(p.symbol || 'tokens').trim() || 'tokens';
  if (p.kind === 'approve') {
    const who = p.counterparty ? ` (${p.counterparty})` : '';
    return `Approve ${amt} ${sym} to be swapped${who}`;
  }
  if (p.kind === 'send') {
    return `Send ${amt} ${sym}`;
  }
  const out =
    p.amountOut != null && p.symbolOut
      ? ` for at least ${String(p.amountOut).trim()} ${String(p.symbolOut).trim()}`
      : '';
  const via = p.counterparty ? ` via ${p.counterparty}` : '';
  return `Swap ${amt} ${sym}${out}${via}`;
}
