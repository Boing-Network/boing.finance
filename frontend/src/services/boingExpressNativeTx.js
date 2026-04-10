/**
 * Boing Express injected provider — native VM transactions (boing_signTransaction / boing_sendTransaction).
 * Requires window.boing from the extension; MetaMask cannot sign Boing bincode txs.
 *
 * Security: boing.finance never submits unsigned txs. `submitBoingSignedTransaction` is only used with
 * hex from `boingExpressSignTransaction` (user-approved Ed25519 signature in the extension).
 */

import { BOING_QA_PLACEHOLDER_DESCRIPTION_HASH_HEX, bytesToHex, transactionIdFromSignedTransactionHex } from 'boing-sdk';
import { simulateBoingSignedTransaction, submitBoingSignedTransaction } from './boingNativeVm';
import { normalizeBoingFaucetAccountHex } from './boingTestnetRpc';

/**
 * @param {string} addr
 * @returns {string | null}
 */
function normAccountHex32(addr) {
  return normalizeBoingFaucetAccountHex(addr);
}

/**
 * Normalize wallet return value from **`boing_signTransaction`** (some builds return `{ hex: "0x…" }` etc.).
 * Never use **`String(nonString)`** — that becomes **`[object Object]`** and breaks **`boing_submitTransaction`** (EOF decode).
 * @param {unknown} raw
 * @returns {string}
 */
export function coerceBoingSignedTxHex(raw) {
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t.length === 0) {
      throw new Error('Boing Express returned an empty signed transaction.');
    }
    return t.startsWith('0x') || t.startsWith('0X') ? `0x${t.slice(2).toLowerCase()}` : `0x${t.toLowerCase()}`;
  }
  if (raw instanceof Uint8Array) {
    return bytesToHex(raw);
  }
  if (Array.isArray(raw) && raw.length > 0 && raw.every((x) => typeof x === 'number' && x >= 0 && x <= 255)) {
    return bytesToHex(new Uint8Array(raw));
  }
  if (raw && typeof raw === 'object') {
    for (const k of ['signedTransaction', 'signed_tx', 'transactionHex', 'transaction', 'hex', 'result']) {
      const v = /** @type {Record<string, unknown>} */ (raw)[k];
      if (typeof v === 'string' && v.trim()) {
        return coerceBoingSignedTxHex(v);
      }
      if (v instanceof Uint8Array) {
        return coerceBoingSignedTxHex(v);
      }
    }
  }
  throw new Error(
    'Boing Express did not return a signed transaction hex string from boing_signTransaction. Update Boing Express or report this to the wallet team.',
  );
}

/**
 * **`preflightContractDeployMetaQa`** passes **`BOING_QA_PLACEHOLDER_DESCRIPTION_HASH_HEX`** when the meta tx omits
 * **`description_hash`**. If the wallet signs **`Option::None`** for that field while the node expects the same
 * **`description_hash` bytes` as QA (or a consistent placeholder), decoding can fail with **`unexpected end of file`**.
 * Always send the explicit placeholder so sign + submit match QA.
 * @param {Record<string, unknown>} tx
 * @returns {Record<string, unknown>}
 */
function normalizeContractDeployMetaForSign(tx) {
  if (!tx || tx.type !== 'contract_deploy_meta') {
    return tx;
  }
  // Deep plain object for the extension (structured clone / postMessage safe; drops undefined).
  const out = JSON.parse(JSON.stringify(tx));
  const dh = typeof out.description_hash === 'string' ? out.description_hash.trim() : '';
  if (!dh) {
    out.description_hash = BOING_QA_PLACEHOLDER_DESCRIPTION_HASH_HEX;
  }
  // Some wallet builds expect explicit empty access lists + CREATE2 option for bincode parity with the node.
  out.access_list = {
    read: Array.isArray(out.access_list?.read) ? out.access_list.read : [],
    write: Array.isArray(out.access_list?.write) ? out.access_list.write : [],
  };
  if (!Object.prototype.hasOwnProperty.call(out, 'create2_salt')) {
    out.create2_salt = null;
  }
  return out;
}

const TX_DECODE_ERR_RE = /unexpected end of file|Invalid transaction:\s*io error:/i;

/**
 * Union explicit read/write with `boing_simulateTransaction` `suggested_access_list` (matches boing-sdk `mergeAccessListWithSimulation`).
 * @param {string[]} read
 * @param {string[]} write
 * @param {{ suggested_access_list?: { read?: string[], write?: string[] } }} sim
 * @returns {{ read: string[], write: string[] }}
 */
export function mergeAccessListWithSimulation(read, write, sim) {
  const sug = sim?.suggested_access_list;
  if (!sug) {
    return { read: [...read], write: [...write] };
  }
  const r = new Set();
  const w = new Set();
  for (const x of read) {
    const n = normAccountHex32(x);
    if (n) r.add(n);
  }
  for (const x of write) {
    const n = normAccountHex32(x);
    if (n) w.add(n);
  }
  for (const x of sug.read || []) {
    const n = normAccountHex32(x);
    if (n) r.add(n);
  }
  for (const x of sug.write || []) {
    const n = normAccountHex32(x);
    if (n) w.add(n);
  }
  return { read: [...r], write: [...w] };
}

/**
 * @param {{ request: Function }} provider — window.boing
 * @param {Record<string, unknown>} txObject — see Boing Express inpage docs (type: transfer, contract_deploy, …)
 * @returns {Promise<string>} 0x-prefixed hex signed transaction
 */
export async function boingExpressSignTransaction(provider, txObject) {
  if (!provider || typeof provider.request !== 'function') {
    throw new Error('Boing Express provider not available');
  }
  const raw = await provider.request({
    method: 'boing_signTransaction',
    params: [txObject],
  });
  return coerceBoingSignedTxHex(raw);
}

/**
 * Sign and broadcast. For **`contract_deploy_meta`** (token / NFT / pool wizards), uses **`boing_signTransaction`**
 * then **`boing_submitTransaction`** via the app’s Boing JSON-RPC proxy — avoids wallet **`boing_sendTransaction`**
 * bugs that surface as `Invalid transaction: io error: unexpected end of file` after approval.
 * Other kinds still use **`boing_sendTransaction`**.
 *
 * @param {{ request: Function }} provider
 * @param {Record<string, unknown>} txObject
 * @param {{ returnSubmitMeta?: boolean }} [options] — when true and `type === 'contract_deploy_meta'`, returns `{ txHash, boingTxIdHex }` for receipt / Observer follow-up
 * @returns {Promise<string | { txHash: string, boingTxIdHex: string | null }>}
 */
export async function boingExpressSendTransaction(provider, txObject, options = {}) {
  if (!provider || typeof provider.request !== 'function') {
    throw new Error('Boing Express provider not available');
  }
  const returnSubmitMeta = options.returnSubmitMeta === true;

  if (txObject && txObject.type === 'contract_deploy_meta') {
    const forSign = normalizeContractDeployMetaForSign(txObject);
    const signedHex = await boingExpressSignTransaction(provider, forSign);
    let boingTxIdHex = null;
    try {
      boingTxIdHex = transactionIdFromSignedTransactionHex(signedHex);
    } catch {
      boingTxIdHex = null;
    }
    const pack = (txHash) => (returnSubmitMeta ? { txHash, boingTxIdHex } : txHash);
    try {
      const sub = await submitBoingSignedTransaction(signedHex);
      const txHash = sub && typeof sub === 'object' && sub.tx_hash != null ? String(sub.tx_hash) : String(sub);
      return pack(txHash);
    } catch (subErr) {
      const m = subErr instanceof Error ? subErr.message : String(subErr);
      if (TX_DECODE_ERR_RE.test(m)) {
        try {
          const hash = await provider.request({
            method: 'boing_sendTransaction',
            params: [forSign],
          });
          if (typeof hash === 'string') return pack(hash);
        } catch {
          /* fall through to original error */
        }
      }
      throw subErr;
    }
  }
  const out = await provider.request({
    method: 'boing_sendTransaction',
    params: [txObject],
  });
  return typeof out === 'string' ? out : String(out);
}

/**
 * Sign `contract_call`, simulate, widen access list when the node suggests — stop on first successful simulation
 * (does not submit). Use for preview-before-broadcast flows.
 *
 * @param {{ request: Function }} provider
 * @param {Record<string, unknown>} txObject
 * @param {{ maxSimulationRetries?: number }} [options]
 * @returns {Promise<{ signedHex: string, simulation: Awaited<ReturnType<typeof simulateBoingSignedTransaction>> }>}
 */
export async function boingExpressContractCallSignSimulateUntilOk(provider, txObject, options = {}) {
  if (!provider || typeof provider.request !== 'function') {
    throw new Error('Boing Express provider not available');
  }
  const max = options.maxSimulationRetries ?? 6;
  const base = { ...txObject };
  const initialRead = Array.isArray(base.access_list?.read) ? [...base.access_list.read] : [];
  const initialWrite = Array.isArray(base.access_list?.write) ? [...base.access_list.write] : [];
  let read = initialRead;
  let write = initialWrite;

  let lastSim = null;
  for (let attempt = 0; attempt < max; attempt += 1) {
    const fullTx = {
      ...base,
      access_list: { read, write },
    };
    const signedHex = await boingExpressSignTransaction(provider, fullTx);
    lastSim = await simulateBoingSignedTransaction(signedHex);

    if (lastSim?.success) {
      return { signedHex, simulation: lastSim };
    }

    if (lastSim?.access_list_covers_suggestion === false && lastSim?.suggested_access_list) {
      const m = mergeAccessListWithSimulation(read, write, lastSim);
      read = m.read;
      write = m.write;
      continue;
    }

    const errMsg = lastSim?.error || 'Simulation failed';
    const e = new Error(errMsg);
    e.simulation = lastSim;
    e.attempt = attempt;
    throw e;
  }

  const e = new Error(`Access list retry limit exceeded (${max})`);
  e.simulation = lastSim;
  throw e;
}

/**
 * Sign `contract_call` (or any Express tx object), simulate via public RPC, widen `access_list` when the node
 * reports `access_list_covers_suggestion === false`, then submit. Each retry re-prompts signing in the extension.
 *
 * @param {{ request: Function }} provider
 * @param {Record<string, unknown>} txObject — must include `type`, `contract`, `calldata`, and usually `access_list`
 * @param {{ maxSimulationRetries?: number }} [options]
 * @returns {Promise<string>} tx hash from `boing_submitTransaction`
 */
export async function boingExpressContractCallSignSimulateSubmit(provider, txObject, options = {}) {
  const { signedHex, simulation } = await boingExpressContractCallSignSimulateUntilOk(provider, txObject, options);
  if (!simulation?.success) {
    const e = new Error(simulation?.error || 'Simulation failed');
    e.simulation = simulation;
    throw e;
  }
  const sub = await submitBoingSignedTransaction(signedHex);
  if (sub && typeof sub === 'object' && sub.tx_hash) return sub.tx_hash;
  return String(sub);
}
