/**
 * Reference economics for Boing native (BOING) in the app UI.
 * Used where CoinGecko / oracles do not list BOING — not a live market price.
 */
import { BOING_NATIVE_L1_CHAIN_ID } from './networks';

export const BOING_USD_REFERENCE_PRICE = 5;

export function isBoingNativeFeeChain(chainId) {
  return chainId === BOING_NATIVE_L1_CHAIN_ID;
}

/** USD value for a human-readable BOING amount (e.g. plan fee "3" → $15). */
export function getBoingNativeFeeUsd(tokenAmount) {
  const n = typeof tokenAmount === 'number' ? tokenAmount : parseFloat(String(tokenAmount));
  if (Number.isNaN(n)) return null;
  return n * BOING_USD_REFERENCE_PRICE;
}

export function formatUsdReferenceLabel(usd) {
  if (usd == null || Number.isNaN(Number(usd))) return '';
  const n = Number(usd);
  const maxFrac = n >= 100 || Number.isInteger(n) ? 0 : 2;
  return `(~$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: maxFrac })})`;
}

/** CoinGecko-style shape for portfolio pricing integration. */
export function getBoingNativePriceDatum() {
  return { usd: BOING_USD_REFERENCE_PRICE, usd_24h_change: 0 };
}
