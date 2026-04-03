/**
 * Format Boing Express / JSON-RPC errors for toasts (QA reject, nested `data`).
 * Aligns with boing-sdk `explainBoingRpcError` / docs/BOING-RPC-ERROR-CODES-FOR-DAPPS.md (no SDK bundle required here).
 * @param {unknown} e
 * @returns {string}
 */
export function formatBoingExpressRpcError(e) {
  if (e && typeof e === 'object') {
    const err = e;
    const code = err.code;
    const msg = typeof err.message === 'string' ? err.message : '';

    if (code === 4001) {
      return 'Cancelled in your wallet.';
    }
    if (code === -32016 || /rate limit/i.test(msg)) {
      return 'Rate limited — wait a minute and try again.';
    }
    if (code === -32050) {
      const rpcData = err.data?.rpc?.data ?? err.data;
      const detail =
        rpcData && typeof rpcData === 'object' && typeof rpcData.message === 'string'
          ? rpcData.message
          : null;
      const rule =
        rpcData && typeof rpcData === 'object' && rpcData.rule_id != null
          ? String(rpcData.rule_id)
          : null;
      if (detail && rule) return `QA rejected (${rule}): ${detail}`;
      if (detail) return `Deployment checks: ${detail}`;
      return 'This deployment did not pass the network quality checks. Use an allowed contract type or see Boing docs.';
    }
    if (code === -32051) {
      const rpcData = err.data?.rpc?.data ?? err.data;
      const h =
        rpcData && typeof rpcData === 'object' && typeof rpcData.tx_hash === 'string'
          ? rpcData.tx_hash
          : null;
      return h
        ? `Deployment queued for the QA pool (reference ${h.slice(0, 18)}…). An administrator may need to vote.`
        : 'Deployment queued for the community QA pool — check Boing docs for boing_qaPoolVote.';
    }
    if (code === -32054) return 'QA pool is disabled on this network.';
    if (code === -32055) return 'QA pool is full — try again later.';
    if (code === -32056) return 'QA pool limit reached for your account — try again later.';
    if (code === -32057) return 'This RPC requires operator authentication.';

    if ('message' in err) {
      const rpcData = err.data?.rpc?.data ?? err.data;
      if (rpcData && typeof rpcData === 'object') {
        const bits = [];
        if (rpcData.rule_id != null) bits.push(`rule_id: ${rpcData.rule_id}`);
        if (rpcData.doc_url) bits.push(String(rpcData.doc_url));
        if (rpcData.message && typeof rpcData.message === 'string') bits.push(rpcData.message);
        if (bits.length) return `${msg || 'Request failed'} — ${bits.join(' | ')}`;
      }
      if (typeof code === 'number' && msg) {
        return `${msg} (code ${code})`;
      }
      if (msg) return msg;
    }
  }
  if (e && typeof e === 'object' && typeof e.message === 'string') return e.message;
  return String(e);
}
