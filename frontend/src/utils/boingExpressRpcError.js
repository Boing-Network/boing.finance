/**
 * Format Boing Express / JSON-RPC errors for toasts.
 * Delegates to `boing-sdk` `explainBoingRpcError` when a numeric RPC `code` is present; keeps a few wallet UX tweaks.
 */
import { BoingRpcError, explainBoingRpcError, mapInjectedProviderErrorToUiMessage } from 'boing-sdk';

/**
 * @param {unknown} raw
 * @returns {BoingRpcError | null}
 */
function tryBoingRpcError(raw) {
  if (raw instanceof BoingRpcError) return raw;
  if (!raw || typeof raw !== 'object') return null;
  const code = raw.code;
  if (typeof code !== 'number') return null;
  const msg = typeof raw.message === 'string' ? raw.message : 'Request failed';
  const data = raw.data?.rpc?.data ?? raw.data;
  return new BoingRpcError(code, msg, data);
}

/**
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

    const br = tryBoingRpcError(e);
    if (br) {
      return explainBoingRpcError(br);
    }

    const injectedUi = mapInjectedProviderErrorToUiMessage(e);
    if (injectedUi && injectedUi !== 'Wallet request failed. Try again or use a Boing-compatible wallet.') {
      return injectedUi;
    }

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
