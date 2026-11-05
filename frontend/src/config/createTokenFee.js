/**
 * Platform fee for Create Token (boing.finance).
 *
 * Fee is a **percent of initial mint supply** (token units to the platform treasury),
 * not a fixed BOING charge. Live default: **0.5% (50 bps)** — Nico soft-confirmed;
 * matches the bridge fee target. Override with `REACT_APP_CREATE_TOKEN_FEE_BPS` if needed.
 *
 * Fee collection needs a Boing treasury AccountId
 * ({@link PLATFORM_CREATE_TOKEN_FEE_RECIPIENT} / `REACT_APP_CREATE_TOKEN_FEE_RECIPIENT`).
 */

/** Safe read for Vite env (undefined under plain Node tests). */
function readEnv(name) {
  try {
    const env = import.meta.env;
    if (!env || typeof env !== 'object') return '';
    return String(env[name] ?? '').trim();
  } catch {
    return '';
  }
}

/**
 * Normalize a Boing AccountId hex (with or without `0x`) to lowercase `0x` + 64 hex.
 * @param {string} raw
 * @returns {string} normalized hex or ''
 */
export function normalizeCreateTokenFeeRecipient(raw) {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return '';
  const hex = trimmed.startsWith('0x') || trimmed.startsWith('0X') ? trimmed.slice(2) : trimmed;
  if (!/^[0-9a-fA-F]{64}$/.test(hex) || /^0+$/.test(hex)) return '';
  return `0x${hex.toLowerCase()}`;
}

/**
 * Live Create Token platform fee in basis points (50 = 0.5% of initial mint).
 * Same rate target as `PLATFORM_BRIDGE_FEE_BPS` in `bridge.js`.
 */
export const PLATFORM_CREATE_TOKEN_FEE_BPS = 50;

/**
 * Live Create Token fee treasury (Boing L1 AccountId). Public address — safe to commit.
 * Override with `REACT_APP_CREATE_TOKEN_FEE_RECIPIENT` (hex with or without `0x`).
 */
export const PLATFORM_CREATE_TOKEN_FEE_RECIPIENT =
  '0xd692627aaedf987f8854e84ab3c4d581d73f6adc13a3d86b512dc9f0d3635237';

/** @returns {number} */
export function getCreateTokenFeeBps() {
  const raw = readEnv('REACT_APP_CREATE_TOKEN_FEE_BPS');
  if (raw && /^\d+$/.test(raw)) {
    const n = Number(raw);
    if (n >= 0 && n <= 10_000) return n;
  }
  return PLATFORM_CREATE_TOKEN_FEE_BPS;
}

/** Human label, e.g. "0.5%". */
export function getCreateTokenFeeLabel(bps = getCreateTokenFeeBps()) {
  const pct = bps / 100;
  const trimmed = Number.isInteger(pct)
    ? String(pct)
    : String(Number(pct.toFixed(4))).replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
  return `${trimmed}%`;
}

/**
 * Boing L1 AccountId (`0x` + 64 hex) that receives the fee share of minted supply.
 * Env override wins when valid; otherwise the committed live default.
 * @returns {string} normalized hex or ''
 */
export function getCreateTokenFeeRecipient() {
  const fromEnv = normalizeCreateTokenFeeRecipient(readEnv('REACT_APP_CREATE_TOKEN_FEE_RECIPIENT'));
  if (fromEnv) return fromEnv;
  return normalizeCreateTokenFeeRecipient(PLATFORM_CREATE_TOKEN_FEE_RECIPIENT);
}

/**
 * Split initial mint into creator + platform fee (whole units; fee rounds down).
 * Fee of 0 or supply too small for 1 fee unit → feeAmount 0n.
 *
 * @param {bigint | string | number} supply
 * @param {number} [feeBps]
 * @returns {{
 *   supply: bigint,
 *   feeBps: number,
 *   feeLabel: string,
 *   feeAmount: bigint,
 *   creatorAmount: bigint,
 *   recipient: string,
 *   collectionReady: boolean,
 * }}
 */
export function planCreateTokenPlatformFee(supply, feeBps = getCreateTokenFeeBps()) {
  const total =
    typeof supply === 'bigint' ? supply : BigInt(String(supply ?? '0').trim().replace(/[_,\s]/g, '') || '0');
  const bps = Math.max(0, Math.min(10_000, Number(feeBps) || 0));
  let feeAmount = 0n;
  if (bps > 0 && total > 0n) {
    feeAmount = (total * BigInt(bps)) / 10000n;
  }
  if (feeAmount >= total) {
    // Never take the whole mint; leave at least 1 unit with the creator when possible.
    feeAmount = total > 1n ? total - 1n : 0n;
  }
  const recipient = getCreateTokenFeeRecipient();
  return {
    supply: total,
    feeBps: bps,
    feeLabel: getCreateTokenFeeLabel(bps),
    feeAmount,
    creatorAmount: total - feeAmount,
    recipient,
    collectionReady: Boolean(recipient) && feeAmount > 0n,
  };
}

/** Short copy for UI banners. */
export function createTokenFeeNoticeText(plan) {
  const p = plan || planCreateTokenPlatformFee(0n);
  const rateNote = `${p.feeLabel} of initial mint`;
  if (!p.recipient) {
    return `Platform fee: ${rateNote}. Treasury AccountId not set yet — fee is shown only; collection stays off until the recipient env is set.`;
  }
  if (p.feeAmount <= 0n) {
    return `Platform fee: ${rateNote}. Supply is too small for a whole-unit fee cut.`;
  }
  return `Platform fee: ${rateNote} → ${p.feeAmount.toString()} tokens to the platform treasury after create (separate Express approval).`;
}
