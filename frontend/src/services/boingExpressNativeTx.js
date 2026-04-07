/**
 * Boing Express injected provider — native VM transactions (boing_signTransaction / boing_sendTransaction).
 * Requires window.boing from the extension; MetaMask cannot sign Boing bincode txs.
 *
 * Security: boing.finance never submits unsigned txs. `submitBoingSignedTransaction` is only used with
 * hex from `boingExpressSignTransaction` (user-approved Ed25519 signature in the extension).
 */

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
 * Plain JSON object for the extension: drops non-enumerable fields and (for some wallets) supplies explicit
 * `create2_salt: null` so Option fields deserialize like `boing_signTransaction`, not a broken `boing_sendTransaction` path.
 * @param {Record<string, unknown>} tx
 * @returns {Record<string, unknown>}
 */
function plainContractDeployMetaForExpress(tx) {
  const o = JSON.parse(JSON.stringify(tx));
  if (o && o.type === 'contract_deploy_meta' && !Object.prototype.hasOwnProperty.call(o, 'create2_salt')) {
    o.create2_salt = null;
  }
  return o;
}

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
  return provider.request({
    method: 'boing_signTransaction',
    params: [txObject]
  });
}

/**
 * Sign and broadcast. For **`contract_deploy_meta`** (token / NFT / pool wizards), uses **`boing_signTransaction`**
 * then **`boing_submitTransaction`** via the app’s Boing JSON-RPC proxy — avoids wallet **`boing_sendTransaction`**
 * bugs that surface as `Invalid transaction: io error: unexpected end of file` after approval.
 * Other kinds still use **`boing_sendTransaction`**.
 *
 * @param {{ request: Function }} provider
 * @param {Record<string, unknown>} txObject
 * @returns {Promise<string>} Transaction hash from the node
 */
export async function boingExpressSendTransaction(provider, txObject) {
  if (!provider || typeof provider.request !== 'function') {
    throw new Error('Boing Express provider not available');
  }
  if (txObject && txObject.type === 'contract_deploy_meta') {
    const plain = plainContractDeployMetaForExpress(txObject);
    const signed = await provider.request({
      method: 'boing_signTransaction',
      params: [plain],
    });
    const signedHex = typeof signed === 'string' ? signed : String(signed);
    const sub = await submitBoingSignedTransaction(signedHex);
    if (sub && typeof sub === 'object' && sub.tx_hash) return sub.tx_hash;
    return String(sub);
  }
  return provider.request({
    method: 'boing_sendTransaction',
    params: [txObject],
  });
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
      access_list: { read, write }
    };
    const signedHex = await boingExpressSignTransaction(provider, fullTx);
    lastSim = await simulateBoingSignedTransaction(signedHex);

    if (lastSim?.success) {
      const sub = await submitBoingSignedTransaction(signedHex);
      if (sub && typeof sub === 'object' && sub.tx_hash) return sub.tx_hash;
      return String(sub);
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
