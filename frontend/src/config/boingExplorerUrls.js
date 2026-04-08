/**
 * Boing block explorer URL helpers for chain 6913.
 * Default base is public Observer; prefer RPC `end_user.explorer_url` (via BoingNativeDexIntegrationContext)
 * or `REACT_APP_BOING_EXPLORER_BASE_URL` when operators use a staging explorer.
 */

export const BOING_OBSERVER_BASE_URL = 'https://boing.observer';

function trimExplorerBase(url) {
  if (!url || typeof url !== 'string') return BOING_OBSERVER_BASE_URL;
  const t = url.trim().replace(/\/+$/, '');
  return t || BOING_OBSERVER_BASE_URL;
}

/**
 * @param {string | null | undefined} baseUrl
 * @param {string | null | undefined} accountIdHex
 */
export function buildBoingExplorerAccountUrl(baseUrl, accountIdHex) {
  const base = trimExplorerBase(baseUrl || BOING_OBSERVER_BASE_URL);
  if (!accountIdHex || typeof accountIdHex !== 'string') return base;
  const t = accountIdHex.trim();
  if (!t) return base;
  return `${base}/account/${t}`;
}

/**
 * @param {string | null | undefined} baseUrl
 * @param {string | null | undefined} txIdHex — 32-byte Boing `tx_id`
 */
export function buildBoingExplorerTxUrl(baseUrl, txIdHex) {
  const base = trimExplorerBase(baseUrl || BOING_OBSERVER_BASE_URL);
  if (!txIdHex || typeof txIdHex !== 'string') return base;
  const t = txIdHex.trim();
  if (!t) return base;
  return `${base}/tx/${t}`;
}

/**
 * @param {string | null | undefined} accountIdHex
 * @returns {string}
 */
export function getBoingObserverAccountUrl(accountIdHex) {
  return buildBoingExplorerAccountUrl(BOING_OBSERVER_BASE_URL, accountIdHex);
}

export function getBoingObserverHomeUrl() {
  return BOING_OBSERVER_BASE_URL;
}

/**
 * @param {string | null | undefined} txIdHex
 * @returns {string}
 */
export function getBoingObserverTxUrl(txIdHex) {
  return buildBoingExplorerTxUrl(BOING_OBSERVER_BASE_URL, txIdHex);
}
