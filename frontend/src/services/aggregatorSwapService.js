import { ethers } from 'ethers';
import { getNetworkByChainId } from '../config/networks';
import { getApiUrl } from '../config';

/** LI.FI native gas token sentinel. */
export const LIFI_NATIVE = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const SOLANA_USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const SOLANA_USDT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';

function aggregatorBase() {
  const api = getApiUrl();
  return `${String(api).replace(/\/$/, '')}/aggregator`;
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

async function fetchLifiQuoteDirect({ chainId, fromToken, toToken, fromAmount, fromAddress, slippage, signal, toDecimals }) {
  const params = new URLSearchParams({
    fromChain: String(chainId),
    toChain: String(chainId),
    fromToken,
    toToken,
    fromAmount: String(fromAmount),
    fromAddress,
    integrator: 'boing.finance',
    order: 'CHEAPEST',
    slippage: String(slippage ?? 0.005),
  });
  const { res, body } = await fetchJson(`https://li.quest/v1/quote?${params}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok || !body.transactionRequest) return null;
  const estimate = body.estimate || {};
  const toAmount = estimate.toAmount || '0';
  let amountOutHuman = toAmount;
  try {
    amountOutHuman = ethers.formatUnits(toAmount, toDecimals ?? 18);
  } catch {
    /* keep raw */
  }
  return {
    provider: 'lifi',
    venue: body.toolDetails?.name || body.tool || 'Aggregator',
    amountOutHuman,
    amountOutRaw: toAmount,
    approvalAddress: estimate.approvalAddress || null,
    transactionRequest: body.transactionRequest,
  };
}

export function isNativeSwapSymbol(symbol, chainId) {
  if (!symbol) return false;
  const s = String(symbol).toUpperCase();
  const native = getNetworkByChainId(chainId)?.nativeCurrency?.symbol;
  if (native && s === String(native).toUpperCase()) return true;
  return false;
}

export function resolveEvmSwapToken(symbol, chainId, userTokens) {
  if (isNativeSwapSymbol(symbol, chainId)) {
    return { address: LIFI_NATIVE, decimals: 18, isNative: true, symbol };
  }
  const token = (userTokens || []).find((t) => t.symbol === symbol);
  if (!token?.address || token.address === ethers.ZeroAddress) return null;
  return {
    address: token.address,
    decimals: token.decimals ?? 18,
    isNative: false,
    symbol: token.symbol,
  };
}

/**
 * @returns {Promise<null | {
 *   provider: 'lifi',
 *   venue: string,
 *   amountOutHuman: string,
 *   amountOutRaw: string,
 *   approvalAddress: string | null,
 *   transactionRequest: object,
 *   fromToken: string,
 *   toToken: string,
 *   fromAmount: string,
 * }>}
 */
export async function getEvmAggregatorQuote({
  chainId,
  fromSymbol,
  toSymbol,
  amountHuman,
  fromAddress,
  userTokens,
  slippagePercent,
  signal,
}) {
  const from = resolveEvmSwapToken(fromSymbol, chainId, userTokens);
  const to = resolveEvmSwapToken(toSymbol, chainId, userTokens);
  if (!from || !to || !fromAddress || !amountHuman) return null;
  if (from.address.toLowerCase() === to.address.toLowerCase()) return null;

  let fromAmount;
  try {
    fromAmount = ethers.parseUnits(String(amountHuman), from.decimals).toString();
  } catch {
    return null;
  }
  if (fromAmount === '0') return null;

  const slippage = Number(slippagePercent) > 0 ? Number(slippagePercent) / 100 : 0.005;
  const params = new URLSearchParams({
    chain: String(chainId),
    fromToken: from.address,
    toToken: to.address,
    fromAmount,
    fromAddress,
    toDecimals: String(to.decimals),
    slippage: String(slippage),
  });

  try {
    const res = await fetch(`${aggregatorBase()}/quote?${params}`, { signal });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.success && body.data?.transactionRequest) {
      const d = body.data;
      return {
        provider: 'lifi',
        venue: d.venue || 'Aggregator',
        amountOutHuman: d.amountOutHuman,
        amountOutRaw: d.amountOutRaw,
        approvalAddress: d.approvalAddress || null,
        transactionRequest: d.transactionRequest,
        fromToken: from.address,
        toToken: to.address,
        fromAmount,
        fromIsNative: from.isNative,
      };
    }
  } catch {
    /* fall through to public LI.FI */
  }

  const direct = await fetchLifiQuoteDirect({
    chainId,
    fromToken: from.address,
    toToken: to.address,
    fromAmount,
    fromAddress,
    slippage,
    signal,
    toDecimals: to.decimals,
  });
  if (!direct) return null;
  return {
    ...direct,
    fromToken: from.address,
    toToken: to.address,
    fromAmount,
    fromIsNative: from.isNative,
  };
}

export async function getJupiterQuote({ inputMint, outputMint, amount, slippagePercent, signal }) {
  const slippage = (Number(slippagePercent) || 0.5) / 100;
  const params = new URLSearchParams({
    chain: 'solana',
    fromToken: inputMint,
    toToken: outputMint,
    fromAmount: String(amount),
    fromAddress: inputMint,
    slippage: String(slippage),
  });
  try {
    const res = await fetch(`${aggregatorBase()}/quote?${params}`, { signal });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.success && body.data?.quoteResponse) {
      return { ...body.data };
    }
  } catch {
    /* public Jupiter */
  }
  const slippageBps = Math.round(slippage * 10000) || 50;
  const q = new URLSearchParams({
    inputMint,
    outputMint,
    amount: String(amount),
    slippageBps: String(slippageBps),
    restrictIntermediateTokens: 'true',
  });
  const { res, body } = await fetchJson(`https://lite-api.jup.ag/swap/v1/quote?${q}`, { signal });
  if (!res.ok || !body.outAmount) return null;
  const venue = body.routePlan?.[0]?.swapInfo?.label || 'Jupiter';
  return {
    provider: 'jupiter',
    venue,
    amountOutRaw: body.outAmount,
    quoteResponse: body,
  };
}

export async function buildJupiterSwapTx({ quoteResponse, userPublicKey }) {
  try {
    const res = await fetch(`${aggregatorBase()}/jupiter-swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteResponse, userPublicKey }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.success && body.data?.swapTransaction) {
      return body.data;
    }
  } catch {
    /* public Jupiter */
  }
  const { res, body } = await fetchJson('https://lite-api.jup.ag/swap/v1/swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    }),
  });
  if (!res.ok || !body.swapTransaction) {
    throw new Error(body.error || body.message || 'Could not build Jupiter swap');
  }
  return body;
}

const ERC20_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

export async function ensureErc20Allowance(tokenAddress, spender, amount, signer) {
  if (!tokenAddress || tokenAddress.toLowerCase() === LIFI_NATIVE.toLowerCase()) return;
  if (!spender || spender === ethers.ZeroAddress) return;
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  const owner = await signer.getAddress();
  const current = await token.allowance(owner, spender);
  if (current >= BigInt(amount)) return;
  const tx = await token.approve(spender, ethers.MaxUint256);
  await tx.wait();
}

export async function sendAggregatorSwap(quote, signer) {
  const req = quote?.transactionRequest;
  if (!req?.to || !req?.data) throw new Error('Quote expired — enter the amount again');
  if (!quote.fromIsNative && quote.fromToken) {
    await ensureErc20Allowance(quote.fromToken, quote.approvalAddress || req.to, quote.fromAmount, signer);
  }
  const tx = await signer.sendTransaction({
    to: req.to,
    data: req.data,
    value: req.value ? BigInt(req.value) : 0n,
    gasLimit: req.gasLimit ? BigInt(req.gasLimit) : undefined,
  });
  const receipt = await tx.wait();
  return { txHash: tx.hash, receipt };
}
