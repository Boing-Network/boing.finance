/**
 * Boing block explorer (Observer) URL helpers for chain 6913.
 * Paths follow public Observer routes used across the app; adjust if upstream changes.
 */

export const BOING_OBSERVER_BASE_URL = 'https://boing.observer';

/**
 * @param {string | null | undefined} accountIdHex — Boing AccountId (typically 0x + 64 hex) or other address shape the explorer accepts
 * @returns {string}
 */
export function getBoingObserverAccountUrl(accountIdHex) {
  if (!accountIdHex || typeof accountIdHex !== 'string') {
    return BOING_OBSERVER_BASE_URL;
  }
  const t = accountIdHex.trim();
  if (!t) return BOING_OBSERVER_BASE_URL;
  return `${BOING_OBSERVER_BASE_URL}/account/${t}`;
}

export function getBoingObserverHomeUrl() {
  return BOING_OBSERVER_BASE_URL;
}

/**
 * Transaction deep link (Observer layout; align with `boing-sdk` `explorerTxUrl` when RPC provides a different base).
 * @param {string | null | undefined} txIdHex — 32-byte Boing `tx_id` (`0x` + 64 hex)
 */
export function getBoingObserverTxUrl(txIdHex) {
  if (!txIdHex || typeof txIdHex !== 'string') {
    return BOING_OBSERVER_BASE_URL;
  }
  const t = txIdHex.trim();
  if (!t) return BOING_OBSERVER_BASE_URL;
  return `${BOING_OBSERVER_BASE_URL}/tx/${t}`;
}
