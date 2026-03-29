/**
 * Boing Express injected provider — native VM transactions (boing_signTransaction / boing_sendTransaction).
 * Requires window.boing from the extension; MetaMask cannot sign Boing bincode txs.
 */

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
 * Sign, simulate when available, and submit via the wallet’s configured RPC.
 * @param {{ request: Function }} provider
 * @param {Record<string, unknown>} txObject
 * @returns {Promise<string>} Transaction hash from the node
 */
export async function boingExpressSendTransaction(provider, txObject) {
  if (!provider || typeof provider.request !== 'function') {
    throw new Error('Boing Express provider not available');
  }
  return provider.request({
    method: 'boing_sendTransaction',
    params: [txObject]
  });
}
