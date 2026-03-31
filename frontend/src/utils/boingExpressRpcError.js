/**
 * Format Boing Express / JSON-RPC errors for toasts (QA reject, nested `data`).
 * @param {unknown} e
 * @returns {string}
 */
export function formatBoingExpressRpcError(e) {
  if (e && typeof e === 'object' && 'message' in e) {
    const err = e;
    const rpcData = err.data?.rpc?.data ?? err.data;
    if (rpcData && typeof rpcData === 'object') {
      const bits = [];
      if (rpcData.rule_id != null) bits.push(`rule_id: ${rpcData.rule_id}`);
      if (rpcData.doc_url) bits.push(String(rpcData.doc_url));
      if (rpcData.message && typeof rpcData.message === 'string') bits.push(rpcData.message);
      if (bits.length) return `${err.message} — ${bits.join(' | ')}`;
    }
    if (typeof err.code === 'number') {
      return `${err.message} (code ${err.code})`;
    }
    if (typeof err.message === 'string') return err.message;
  }
  if (e && typeof e === 'object' && typeof e.message === 'string') return e.message;
  return String(e);
}
