/**
 * Same-chain swap quotes via LI.FI (EVM) and Jupiter (Solana).
 * Optional secrets: LIFI_API_KEY, JUPITER_API_KEY (higher rate limits).
 */

const LIFI_QUOTE = 'https://li.quest/v1/quote';
const JUPITER_LITE = 'https://lite-api.jup.ag/swap/v1';
const JUPITER_FULL = 'https://api.jup.ag/swap/v1';
const INTEGRATOR = 'boing.finance';

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

export async function fetchLifiQuote({ chainId, fromToken, toToken, fromAmount, fromAddress, slippage, env }) {
  const params = new URLSearchParams({
    fromChain: String(chainId),
    toChain: String(chainId),
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
  return {
    provider: 'lifi',
    venue: tool,
    amountOutRaw: toAmount,
    amountOutHuman,
    toAmountMin: estimate.toAmountMin || toAmount,
    approvalAddress: estimate.approvalAddress || null,
    transactionRequest: quote.transactionRequest || null,
    gasCostUSD: estimate.gasCosts?.[0]?.amountUSD || null,
  };
}
