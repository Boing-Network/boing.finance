/**
 * Optional Boing L1 priority tips for Express-signed txs.
 * Product direction: always pay a Solana-like micro base fee; tip is optional for faster inclusion.
 * Maps Swap settings `gasPriority` onto the SDK tip ladder (static fallback matches MICRO_FEE schedule).
 */

/** @typedef {'low' | 'medium' | 'high' | 'normal' | 'faster' | 'priority' | 'urgent'} TipPriorityLabel */

/** Micro transfer fee at execution_gas_fee_bps=100 (~0.00021 BOING). */
const MICRO_TRANSFER_FEE = 210_000_000_000_000n;

/**
 * @param {TipPriorityLabel | string | null | undefined} priority
 * @returns {bigint} tip in ledger base units (0 = normal / no tip)
 */
export function priorityTipFromGasSetting(priority) {
  const key = String(priority || 'normal').toLowerCase();
  // Align with boing-sdk suggestPriorityTipLadder: normal=0, faster=1×micro, priority=10×, urgent=100×.
  // Map legacy Swap gasPriority low/medium/high → normal/faster/priority.
  if (key === 'low' || key === 'normal') return 0n;
  if (key === 'medium' || key === 'faster') return MICRO_TRANSFER_FEE;
  if (key === 'high' || key === 'priority') return MICRO_TRANSFER_FEE * 10n;
  if (key === 'urgent') return MICRO_TRANSFER_FEE * 100n;
  return 0n;
}

/**
 * Attach `priority_tip` (decimal string) for Boing Express dApp JSON when tip > 0.
 * @param {Record<string, unknown>} txObject
 * @param {bigint | number | string | null | undefined} tip
 * @returns {Record<string, unknown>}
 */
export function withBoingPriorityTip(txObject, tip) {
  if (!txObject || typeof txObject !== 'object') return txObject;
  let t = 0n;
  try {
    if (typeof tip === 'bigint') t = tip;
    else if (typeof tip === 'number' && Number.isFinite(tip) && tip >= 0) t = BigInt(Math.floor(tip));
    else if (typeof tip === 'string' && /^\d+$/.test(tip.trim())) t = BigInt(tip.trim());
  } catch {
    t = 0n;
  }
  if (t <= 0n) {
    const { priority_tip: _a, priorityTip: _b, ...rest } = txObject;
    return rest;
  }
  return { ...txObject, priority_tip: t.toString() };
}
