/**
 * Native BOING sent with contract calls (`value` on `contract_call` / batch `contract_call` steps), e.g. the
 * wBOING `deposit` that starts a BOING -> token swap or a BOING liquidity add.
 *
 * Boing Express 0.1.18 and older (including the Chrome Web Store 0.1.17) do not know the `value` field and
 * silently sign the call without it. wBOING `deposit` then faults on a zero value, and the node reports the
 * VM's generic revert ("Batch step 0 failed: Invalid jump destination"). So: check the wallet's capability
 * before asking it to sign, and verify the signed bytes really carry the value before simulating / submitting.
 */

/** Minimum Boing Express version that signs `value` (ContractCallWithValue, payload 20 / batch step 2). */
export const NATIVE_VALUE_MIN_EXPRESS_VERSION = '0.1.19';

export const NATIVE_VALUE_WALLET_UPDATE_MESSAGE =
  `Your Boing Express version can't send BOING with contract calls, which swapping or adding liquidity with BOING needs. ` +
  `Update Boing Express to ${NATIVE_VALUE_MIN_EXPRESS_VERSION} or newer (or reload the unpacked extension), then refresh this page. Nothing was sent.`;

export const NATIVE_VALUE_WALLET_ERROR_CODE = 'BOING_WALLET_NO_NATIVE_VALUE';

/** Error thrown instead of submitting when the wallet cannot (or did not) sign the BOING value. */
export function nativeValueWalletError(detail) {
  const e = new Error(NATIVE_VALUE_WALLET_UPDATE_MESSAGE);
  e.code = NATIVE_VALUE_WALLET_ERROR_CODE;
  if (detail) e.detail = detail;
  return e;
}

function toBig(v) {
  if (v == null || v === '') return 0n;
  try {
    return BigInt(typeof v === 'string' ? v.trim() : v);
  } catch {
    return 0n;
  }
}

/**
 * Value-carrying calls of a Boing Express request object.
 * @param {Record<string, any>} tx `{ type: 'contract_call', value? }` or `{ type: 'batch', calls: [...] }`
 * @returns {{ index: number | null, contract: string, calldata: string, value: bigint }[]} `index` = batch step (0-based), null for a single call
 */
export function expressTxValueCalls(tx) {
  if (!tx || typeof tx !== 'object') return [];
  if (tx.type === 'contract_call') {
    const value = toBig(tx.value);
    return value > 0n ? [{ index: null, contract: String(tx.contract || ''), calldata: String(tx.calldata || '0x'), value }] : [];
  }
  if (tx.type === 'batch') {
    const calls = Array.isArray(tx.calls) ? tx.calls : Array.isArray(tx.steps) ? tx.steps : [];
    const out = [];
    calls.forEach((c, i) => {
      if (!c || c.type !== 'contract_call') return;
      const value = toBig(c.value);
      if (value > 0n) out.push({ index: i, contract: String(c.contract || ''), calldata: String(c.calldata || '0x'), value });
    });
    return out;
  }
  return [];
}

/** Total native BOING a request sends to contracts. */
export function expressTxNativeValue(tx) {
  return expressTxValueCalls(tx).reduce((a, c) => a + c.value, 0n);
}

function hexBytes(h) {
  const s = String(h || '').replace(/^0x/i, '');
  if (s.length % 2 || /[^0-9a-f]/i.test(s)) throw new Error('bad hex');
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function le(v, n) {
  const out = new Uint8Array(n);
  let x = BigInt(v);
  for (let i = 0; i < n; i += 1) {
    out[i] = Number(x & 0xffn);
    x >>= 8n;
  }
  return out;
}

function concat(parts) {
  const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function indexOfBytes(hay, needle) {
  outer: for (let i = 0; i + needle.length <= hay.length; i += 1) {
    for (let j = 0; j < needle.length; j += 1) if (hay[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}

/**
 * bincode of the call as ContractCallWithValue: `u32 tag | contract (32) | u64 len | calldata | u128 value`
 * (tag 2 as a batch step, 20 as a top-level payload).
 */
export function valueCallBincode(call, tag) {
  const calldata = hexBytes(call.calldata);
  return concat([le(tag, 4), hexBytes(call.contract), le(calldata.length, 8), calldata, le(call.value, 16)]);
}

/**
 * Does the wallet-signed transaction carry every requested value? Old wallets sign the same call without the
 * value (tag 1 / payload 3), which this catches before anything is simulated or submitted.
 * @param {string} signedHex 0x + bincode(SignedTransaction)
 * @param {ReturnType<typeof expressTxValueCalls>} calls
 */
export function signedTxCarriesValues(signedHex, calls) {
  if (!calls.length) return true;
  let bytes;
  try {
    bytes = hexBytes(signedHex);
  } catch {
    return false;
  }
  return calls.every((c) => {
    try {
      return indexOfBytes(bytes, valueCallBincode(c, c.index == null ? 20 : 2)) >= 0;
    } catch {
      return false;
    }
  });
}

/** Compare dotted versions (`0.1.19` vs `0.1.9`). */
export function versionAtLeast(v, min) {
  const a = String(v || '').split('.').map((x) => parseInt(x, 10) || 0);
  const b = String(min).split('.').map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0);
  }
  return true;
}

/**
 * Can this provider sign BOING-carrying contract calls?
 * - boing.express web wallet (popup) runs the current boing.express build: yes.
 * - Extension 0.1.19+ exposes `features: ['nativeValue']` / `version` and answers `boing_getCapabilities`.
 * - Older extensions have neither: no.
 * @returns {Promise<{ supported: boolean, version: string | null, source: string }>}
 */
export async function walletNativeValueSupport(provider) {
  if (!provider || typeof provider.request !== 'function') return { supported: false, version: null, source: 'none' };
  if (provider.isBoingWeb === true) return { supported: true, version: null, source: 'web' };
  const fromFlags = (features, version) => {
    if (Array.isArray(features)) return features.includes('nativeValue');
    if (typeof version === 'string' && version) return versionAtLeast(version, NATIVE_VALUE_MIN_EXPRESS_VERSION);
    return null;
  };
  const direct = fromFlags(provider.features, provider.version);
  if (direct != null) return { supported: direct, version: typeof provider.version === 'string' ? provider.version : null, source: 'provider' };
  try {
    const caps = await Promise.race([
      provider.request({ method: 'boing_getCapabilities', params: [] }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000)),
    ]);
    const r = fromFlags(caps?.features, caps?.version);
    if (r != null) return { supported: r, version: typeof caps?.version === 'string' ? caps.version : null, source: 'capabilities' };
  } catch {
    /* older wallets reject the unknown method */
  }
  return { supported: false, version: null, source: 'legacy' };
}

const STEP_REVERT_RE = /Batch step (\d+) failed:\s*Invalid jump destination/i;

/**
 * Human text for the VM's generic revert ("Invalid jump destination": Boing contracts revert by jumping out
 * of the code, so it is the contract saying no, not a VM bug).
 * @param {string} msg raw node / simulation error
 * @param {{ valueStepIndexes?: number[], singleCallValue?: boolean, stepLabels?: string[] }} [ctx]
 * @returns {string | null} null when the message is not a revert
 */
export function explainContractRevert(msg, ctx = {}) {
  const m = String(msg || '');
  const step = m.match(STEP_REVERT_RE);
  if (step) {
    const i = Number(step[1]);
    if (Array.isArray(ctx.valueStepIndexes) && ctx.valueStepIndexes.includes(i)) {
      return `${NATIVE_VALUE_WALLET_UPDATE_MESSAGE} (The BOING wrap step was rejected because no BOING arrived with it.)`;
    }
    const label = ctx.stepLabels?.[i];
    return (
      `Step ${i + 1}${label ? ` (${label})` : ''} was rejected by the contract, so the whole transaction was cancelled and nothing was spent. ` +
      'Usually the price moved past your slippage, or a balance or approval is short. Refresh the quote and try again.'
    );
  }
  if (/Invalid jump destination/i.test(m)) {
    if (ctx.singleCallValue) return NATIVE_VALUE_WALLET_UPDATE_MESSAGE;
    return 'The contract rejected this call, so nothing was spent. Check the amounts and balances and try again.';
  }
  return null;
}
