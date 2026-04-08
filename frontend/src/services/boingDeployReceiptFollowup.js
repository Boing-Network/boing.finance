import { fetchBoingTransactionReceipt } from './boingTestnetRpc';

/**
 * @param {unknown} receipt — `boing_getTransactionReceipt` result
 * @returns {string | null} first non-zero 32-byte `address` on a log (deploy / contract attribution)
 */
export function pickDeployedAccountIdFromBoingReceipt(receipt) {
  if (!receipt || typeof receipt !== 'object') return null;
  const logs = /** @type {Record<string, unknown>} */ (receipt).logs;
  if (!Array.isArray(logs)) return null;
  for (const log of logs) {
    if (!log || typeof log !== 'object') continue;
    const a = /** @type {Record<string, unknown>} */ (log).address;
    if (typeof a === 'string' && /^0x[0-9a-fA-F]{64}$/i.test(a)) {
      const hex = `0x${a.slice(2).toLowerCase()}`;
      if (!/^0x0{64}$/i.test(hex)) return hex;
    }
  }
  const rd = /** @type {Record<string, unknown>} */ (receipt).return_data;
  if (typeof rd === 'string') {
    const x = rd.trim();
    if (/^0x[0-9a-fA-F]{64}$/i.test(x)) {
      const hex = `0x${x.slice(2).toLowerCase()}`;
      if (!/^0x0{64}$/i.test(hex)) return hex;
    }
  }
  return null;
}

/**
 * Poll until receipt exists and logs carry a deployed contract id, or attempts exhausted.
 * @param {string} txIdHex
 * @param {{ maxAttempts?: number, delayMs?: number, signal?: AbortSignal }} [options]
 * @returns {Promise<string | null>}
 */
export async function waitForBoingDeployReceiptAccount(txIdHex, options = {}) {
  const maxAttempts = options.maxAttempts ?? 24;
  const delayMs = options.delayMs ?? 1500;
  for (let i = 0; i < maxAttempts; i += 1) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
    let receipt;
    try {
      receipt = await fetchBoingTransactionReceipt(txIdHex, { signal: options.signal });
    } catch {
      continue;
    }
    if (receipt == null) continue;
    if (receipt.success === false) return null;
    const id = pickDeployedAccountIdFromBoingReceipt(receipt);
    if (id) return id;
  }
  return null;
}

/**
 * Best-effort background poll so the UI does not block on inclusion (can be tens of seconds).
 * @param {string | null | undefined} txIdHex
 * @param {(deployedAccountId: string) => void} onDeployedAccount
 */
export function scheduleBoingDeployReceiptFollowup(txIdHex, onDeployedAccount) {
  if (!txIdHex || typeof txIdHex !== 'string') return;
  void (async () => {
    try {
      const id = await waitForBoingDeployReceiptAccount(txIdHex, { maxAttempts: 28, delayMs: 1500 });
      if (id) onDeployedAccount(id);
    } catch {
      /* non-fatal */
    }
  })();
}
