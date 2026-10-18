/**
 * LI.FI (EVM swap + cross-chain) and Jupiter (Solana swap) quotes.
 * Optional secrets: LIFI_API_KEY, JUPITER_API_KEY (higher rate limits).
 */

const LIFI_QUOTE = 'https://li.quest/v1/quote';
const JUPITER_LITE = 'https://lite-api.jup.ag/swap/v1';
const JUPITER_FULL = 'https://api.jup.ag/swap/v1';
const INTEGRATOR = 'boing.finance';
/** Default platform fee on cross-chain quotes (0.005 = 0.5%). */
export const DEFAULT_BRIDGE_FEE = 0.005;

export function resolveBridgeFee(env) {
  const raw = env?.LIFI_INTEGRATOR_FEE;
  const n = raw != null && raw !== '' ? Number(raw) : DEFAULT_BRIDGE_FEE;
  if (!Number.isFinite(n) || n < 0 || n >= 1) return DEFAULT_BRIDGE_FEE;
  return n;
}

const EVM_RECIPIENT = /^0x[0-9a-fA-F]{40}$/;
const SOL_RECIPIENT = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const BTC_RECIPIENT = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{24,74}$/;

export function resolveFeeRecipient(env) {
  const addr = String(env?.LIFI_FEE_RECIPIENT || env?.PLATFORM_WALLET || '').trim();
  if (EVM_RECIPIENT.test(addr) && !/^0x0+$/i.test(addr)) return addr;
  return '';
}

export function resolveFeeRecipients(env) {
  const evm = resolveFeeRecipient(env);
  const sol = String(env?.LIFI_FEE_RECIPIENT_SOL || '').trim();
  const btc = String(env?.LIFI_FEE_RECIPIENT_BTC || '').trim();
  return {
    evm: evm || null,
    sol: SOL_RECIPIENT.test(sol) ? sol : null,
    btc: BTC_RECIPIENT.test(btc) ? btc : null,
  };
}

function lifiHeaders(env) {
  const headers = {
    Accept: 'application/json',
    'x-lifi-integrator': INTEGRATOR,
  };
  if (env?.LIFI_API_KEY) headers['x-lifi-api-key'] = env.LIFI_API_KEY;
  return headers;
}

function jupiterHeaders(env) {
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (env?.JUPITER_API_KEY) headers['x-api-key'] = env.JUPITER_API_KEY;
  return headers;
}

export async function fetchLifiQuote({
  chainId,
  fromChain,
  toChain,
  fromToken,
  toToken,
  fromAmount,
  fromAddress,
  slippage,
  env,
  fee,
}) {
  const sourceChain = fromChain ?? chainId;
  const destChain = toChain ?? chainId;
  const params = new URLSearchParams({
    fromChain: String(sourceChain),
    toChain: String(destChain),
    fromToken,
    toToken,
    fromAmount: String(fromAmount),
    fromAddress,
    integrator: INTEGRATOR,
    order: 'CHEAPEST',
  });
  if (slippage != null && Number.isFinite(Number(slippage))) {
    params.set('slippage', String(slippage));
  }
  if (fee != null && Number.isFinite(Number(fee)) && Number(fee) > 0) {
    params.set('fee', String(fee));
  }

  const res = await fetch(`${LIFI_QUOTE}?${params}`, { headers: lifiHeaders(env) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body.message || body.error || `LI.FI quote failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return body;
}

/**
 * Pass-through LI.FI quote for the Bridge page: any LI.FI chain (EVM, Solana, Bitcoin, Sui, Tron…), optional
 * `toAddress`. Adds the integrator, the platform fee (cross-chain only) and the API key server-side.
 * Returns `{ ok, status, body }` with LI.FI's own body so the browser can explain errors.
 */
const LIFI_PARAM = /^[A-Za-z0-9:._-]{1,128}$/;
export function buildLifiPassthroughParams(query, fee) {
  const pick = (k) => (query[k] == null ? '' : String(query[k]).trim());
  const out = new URLSearchParams();
  for (const k of ['fromChain', 'toChain', 'fromToken', 'toToken', 'fromAddress']) {
    const v = pick(k);
    if (!LIFI_PARAM.test(v)) return { error: `${k} is missing or invalid` };
    out.set(k, v);
  }
  const amount = pick('fromAmount');
  if (!/^[0-9]{1,78}$/.test(amount) || /^0+$/.test(amount)) return { error: 'fromAmount must be a positive integer in base units' };
  out.set('fromAmount', amount);
  const toAddress = pick('toAddress');
  if (toAddress) {
    if (!LIFI_PARAM.test(toAddress)) return { error: 'toAddress is invalid' };
    out.set('toAddress', toAddress);
  }
  const slippage = Number(pick('slippage') || '0.005');
  if (!Number.isFinite(slippage) || slippage <= 0 || slippage > 0.5) return { error: 'slippage must be between 0 and 0.5' };
  out.set('slippage', String(slippage));
  const order = pick('order').toUpperCase();
  out.set('order', order === 'FASTEST' ? 'FASTEST' : 'CHEAPEST');
  out.set('integrator', INTEGRATOR);
  if (out.get('fromChain') !== out.get('toChain') && fee != null && Number(fee) > 0) out.set('fee', String(fee));
  return { params: out };
}

export async function fetchLifiQuotePassthrough(params, env) {
  const res = await fetch(`${LIFI_QUOTE}?${params}`, { headers: lifiHeaders(env) });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export async function fetchJupiterQuote({ inputMint, outputMint, amount, slippageBps, env }) {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: String(amount),
    slippageBps: String(slippageBps ?? 50),
    restrictIntermediateTokens: 'true',
  });
  const bases = env?.JUPITER_API_KEY ? [JUPITER_FULL, JUPITER_LITE] : [JUPITER_LITE, JUPITER_FULL];
  let lastErr;
  for (const base of bases) {
    try {
      const res = await fetch(`${base}/quote?${params}`, { headers: jupiterHeaders(env) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        lastErr = new Error(body.error || body.message || `Jupiter quote failed (${res.status})`);
        continue;
      }
      return body;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Jupiter quote failed');
}

export async function fetchJupiterSwapTx({ quoteResponse, userPublicKey, env }) {
  const bases = env?.JUPITER_API_KEY ? [JUPITER_FULL, JUPITER_LITE] : [JUPITER_LITE, JUPITER_FULL];
  let lastErr;
  for (const base of bases) {
    try {
      const res = await fetch(`${base}/swap`, {
        method: 'POST',
        headers: jupiterHeaders(env),
        body: JSON.stringify({
          quoteResponse,
          userPublicKey,
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto',
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.swapTransaction) {
        lastErr = new Error(body.error || body.message || `Jupiter swap build failed (${res.status})`);
        continue;
      }
      return body;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Jupiter swap build failed');
}

export function summarizeLifiQuote(quote, toDecimals) {
  const estimate = quote?.estimate || {};
  const tool = quote?.toolDetails?.name || quote?.tool || 'Aggregator';
  const toAmount = estimate.toAmount || estimate.toAmountMin || '0';
  let amountOutHuman = toAmount;
  try {
    const decimals = Number(toDecimals);
    if (Number.isFinite(decimals) && decimals >= 0) {
      const raw = BigInt(toAmount);
      const base = 10n ** BigInt(decimals);
      const whole = raw / base;
      const frac = (raw % base).toString().padStart(decimals, '0').replace(/0+$/, '');
      amountOutHuman = frac ? `${whole}.${frac}` : whole.toString();
    }
  } catch {
    /* keep raw */
  }
  const feeCosts = Array.isArray(estimate.feeCosts)
    ? estimate.feeCosts.map((f) => ({
        name: f.name || f.token?.symbol || 'Fee',
        percentage: f.percentage || f.percentageFee || null,
        amountUSD: f.amountUSD || null,
        included: f.included !== false,
      }))
    : [];
  const durationSec = Number(estimate.executionDuration);
  return {
    provider: 'lifi',
    venue: tool,
    amountOutRaw: toAmount,
    amountOutHuman,
    toAmountMin: estimate.toAmountMin || toAmount,
    approvalAddress: estimate.approvalAddress || null,
    transactionRequest: quote.transactionRequest || null,
    gasCostUSD: estimate.gasCosts?.[0]?.amountUSD || null,
    fromAmountUSD: estimate.fromAmountUSD || null,
    toAmountUSD: estimate.toAmountUSD || null,
    executionDuration: Number.isFinite(durationSec) ? durationSec : null,
    feeCosts,
  };
}
