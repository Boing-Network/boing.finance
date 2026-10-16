/**
 * Browser services for the Publish interface page: RPC via the app proxy, observer draft, and the
 * claim + set_interface submission (ONE native batch tx when the node and wallet support it).
 */
import { boingJsonRpc } from './boingTestnetRpc';
import { boingExpressContractCallSignSimulateSubmit } from './boingExpressNativeTx';
import { nodeBatchSupport } from './linkedNftTokenRegistry';
import { flowTxsToBatchTx, isWalletBatchUnsupportedError } from '../utils/linkedNftLinkBatch';
import { inspectContract, recordMatches, hex0x, INTERFACE_REGISTRY_ID } from '../utils/publishInterface';
import { fetchInterfaceRecord, interfaceJsonHashHex, readInterfaceBlob, storageWordReaderFromRpc } from 'boing-sdk';

export const rpc = (method, params) => boingJsonRpc(method, params);

/** Read a boing://iface-blob/ URI back from chain and check BLAKE3 against the published hash. */
export async function verifyBoingHosted(uri, interfaceHash) {
  const bytes = await readInterfaceBlob(uri, storageWordReaderFromRpc(rpc));
  return { ok: interfaceJsonHashHex(bytes).toLowerCase() === hex0x(interfaceHash).toLowerCase(), bytes: bytes.length };
}

export function inspectContractForWallet(wallet, contract) {
  return inspectContract(rpc, { wallet, contract });
}

/** The observer's analysis (template match / decoded selectors) via the same-origin proxy. */
export async function fetchObserverInterface(contract) {
  const r = await fetch(`/api/observer-interface?network=testnet&id=${encodeURIComponent(hex0x(contract))}`);
  if (!r.ok) throw new Error(`Observer analysis unavailable (HTTP ${r.status})`);
  return r.json();
}

/** Try to read the hosted file from the browser (may fail on CORS; the observer fetches server-side). */
export async function fetchHostedText(uri) {
  const r = await fetch(uri, { cache: 'no-store' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
}

/**
 * Submit the planned txs. Batch when >1 step and the node advertises batch; falls back to one tx per step
 * when the wallet cannot sign `batch`.
 * @returns {Promise<{ batched: boolean, txHashes: string[] }>}
 */
export async function submitPublishPlan(provider, wallet, txs, { onStep } = {}) {
  const txHashes = [];
  const opts = { senderHex: hex0x(wallet), waitForInclusion: true };
  const support = await nodeBatchSupport();
  if (txs.length > 1 && support.nodeBatch && txs.length <= support.maxSteps) {
    try {
      onStep?.('batch');
      txHashes.push(await boingExpressContractCallSignSimulateSubmit(provider, flowTxsToBatchTx(txs), opts));
      return { batched: true, txHashes };
    } catch (e) {
      if (!isWalletBatchUnsupportedError(e)) throw e;
    }
  }
  for (let i = 0; i < txs.length; i++) {
    onStep?.(i);
    txHashes.push(await boingExpressContractCallSignSimulateSubmit(provider, txs[i], opts));
  }
  return { batched: false, txHashes };
}

/** Poll the registry until it shows the new record (or time out). */
export async function waitForRecord(contract, expect, { timeoutMs = 60_000, intervalMs = 2_000 } = {}) {
  const getStorage = async (reg, key) => rpc('boing_getContractStorage', [reg, key]);
  const until = Date.now() + timeoutMs;
  for (;;) {
    const { record } = await fetchInterfaceRecord(getStorage, hex0x(contract), INTERFACE_REGISTRY_ID);
    if (recordMatches(record, expect)) return record;
    if (Date.now() > until) return null;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}