/**
 * Pure LI.FI helpers for the Bridge (no network, no app imports, so node tests can load them).
 * Chains come from GET https://li.quest/v1/chains, tokens from GET /v1/tokens, quotes from GET /v1/quote.
 */

/** Chain types the app can sign on the sending side: EVM wallets and the injected Solana wallet. */
export const SIGNABLE_CHAIN_TYPES = Object.freeze(['EVM', 'SVM']);
/** Every chain type LI.FI lists (used for GET /v1/chains?chainTypes=…). */
export const LIFI_CHAIN_TYPES = Object.freeze(['EVM', 'SVM', 'UTXO', 'MVM', 'TVM']);

export const LIFI_SOLANA_CHAIN_ID = 1151111081099710;
export const EVM_ZERO = '0x0000000000000000000000000000000000000000';
export const EVM_NATIVE_SENTINEL = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

const CHAIN_TYPE_LABEL = { EVM: 'EVM', SVM: 'Solana', UTXO: 'Bitcoin-style', MVM: 'Move', TVM: 'Tron' };

export function chainTypeLabel(chainType) {
  return CHAIN_TYPE_LABEL[chainType] || chainType || 'Other';
}

export function canSignOnChainType(chainType) {
  return SIGNABLE_CHAIN_TYPES.includes(chainType);
}

/** Normalise one /v1/chains entry. */
export function normalizeChain(c) {
  return {
    id: Number(c.id),
    key: String(c.key || ''),
    name: String(c.name || c.key || c.id),
    chainType: String(c.chainType || 'EVM'),
    logoURI: c.logoURI || '',
    coin: c.coin || c.nativeToken?.symbol || '',
    nativeToken: c.nativeToken ? normalizeToken(c.nativeToken) : null,
    mainnet: c.mainnet !== false,
    metamask: c.metamask || null,
  };
}

/** EVM first (Ethereum, then popular L2s), then Solana, then the rest by name. */
const CHAIN_PRIORITY = [1, 8453, 42161, 10, 137, 56, 43114, LIFI_SOLANA_CHAIN_ID, 20000000000001];

export function sortChains(chains) {
  const rank = (c) => {
    const i = CHAIN_PRIORITY.indexOf(c.id);
    return i === -1 ? CHAIN_PRIORITY.length : i;
  };
  return [...chains].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

export function searchChains(chains, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return chains;
  return chains.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.key.toLowerCase() === q ||
      String(c.id) === q ||
      chainTypeLabel(c.chainType).toLowerCase().includes(q) ||
      String(c.coin).toLowerCase() === q
  );
}

export function isNativeTokenAddress(address) {
  const a = String(address || '').toLowerCase();
  return (
    !a ||
    a === EVM_ZERO ||
    a === EVM_NATIVE_SENTINEL.toLowerCase() ||
    a === '11111111111111111111111111111111' ||
    a === 'bitcoin'
  );
}

/** Normalise one /v1/tokens or /v1/token entry. */
export function normalizeToken(t) {
  return {
    chainId: Number(t.chainId),
    address: String(t.address || ''),
    symbol: String(t.symbol || '?'),
    name: String(t.name || t.symbol || ''),
    decimals: Number(t.decimals ?? 18),
    logoURI: t.logoURI || '',
    priceUSD: t.priceUSD != null ? String(t.priceUSD) : '',
    coinKey: t.coinKey || '',
    verified: t.verificationStatus === 'verified',
    tags: Array.isArray(t.tags) ? t.tags : [],
  };
}

/** Compact array form for localStorage (token lists can hold thousands of entries). */
export function packTokens(tokens) {
  return tokens.map((t) => [t.address, t.symbol, t.name, t.decimals, t.logoURI, t.priceUSD, t.coinKey, t.verified ? 1 : 0]);
}

export function unpackTokens(chainId, rows) {
  return (rows || []).map(([address, symbol, name, decimals, logoURI, priceUSD, coinKey, verified]) => ({
    chainId: Number(chainId),
    address,
    symbol,
    name,
    decimals,
    logoURI,
    priceUSD,
    coinKey,
    verified: Boolean(verified),
    tags: [],
  }));
}

export function sameAddress(a, b) {
  return String(a || '').toLowerCase() === String(b || '').toLowerCase();
}

const POPULAR_KEYS = ['USDC', 'USDT', 'DAI', 'WETH', 'WBTC', 'USDC.e', 'ETH', 'SOL', 'BTC'];

/**
 * Popular ordering: native gas token, then well-known coins (by LI.FI coinKey), then verified tokens, then
 * the rest in LI.FI's own order (roughly by liquidity).
 */
export function sortTokensPopular(tokens) {
  const rank = (t) => {
    if (isNativeTokenAddress(t.address)) return 0;
    const i = POPULAR_KEYS.indexOf(t.coinKey || t.symbol);
    if (i !== -1) return 1 + i;
    return t.verified ? 50 : 100;
  };
  return tokens
    .map((t, i) => ({ t, i }))
    .sort((a, b) => rank(a.t) - rank(b.t) || a.i - b.i)
    .map((x) => x.t);
}

/** Search by symbol, name or address. Exact symbol first, then symbol prefix, then name / address matches. */
export function searchTokens(tokens, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return tokens;
  const scored = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i];
    const s = t.symbol.toLowerCase();
    const n = t.name.toLowerCase();
    const a = t.address.toLowerCase();
    let score = -1;
    if (a === q) score = 0;
    else if (s === q) score = 1;
    else if (s.startsWith(q)) score = 2;
    else if (n.startsWith(q)) score = 3;
    else if (s.includes(q) || n.includes(q)) score = 4;
    else if (q.length >= 6 && a.includes(q)) score = 5;
    if (score >= 0) scored.push({ t, score, verified: t.verified ? 0 : 1, i });
  }
  scored.sort((x, y) => x.score - y.score || x.verified - y.verified || x.i - y.i);
  return scored.map((x) => x.t);
}

/** Pick the same asset on another chain (by coinKey, then symbol), else that chain's gas token. */
export function matchTokenOnChain(token, tokens) {
  if (!tokens?.length) return null;
  if (token) {
    if (isNativeTokenAddress(token.address)) {
      const sameNative = tokens.find((t) => isNativeTokenAddress(t.address) && t.symbol === token.symbol);
      if (sameNative) return sameNative;
    }
    if (token.coinKey) {
      const byKey = tokens.find((t) => t.coinKey === token.coinKey);
      if (byKey) return byKey;
    }
    const bySymbol = tokens.find((t) => t.symbol === token.symbol);
    if (bySymbol) return bySymbol;
  }
  return tokens.find((t) => isNativeTokenAddress(t.address)) || tokens[0];
}

const ADDRESS_RULES = {
  EVM: /^0x[0-9a-fA-F]{40}$/,
  SVM: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  MVM: /^0x[0-9a-fA-F]{1,64}$/,
  TVM: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
};

/** Wallet address check for a chain (format only). */
export function isValidAddressForChain(address, chain) {
  const a = String(address || '').trim();
  if (!a || !chain) return false;
  if (chain.chainType === 'UTXO') {
    if (chain.key === 'btc') return /^(bc1[02-9ac-hj-np-z]{11,71}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/.test(a);
    return /^[a-zA-Z0-9]{26,95}$/.test(a);
  }
  const rule = ADDRESS_RULES[chain.chainType];
  return rule ? rule.test(a) : a.length >= 20;
}

/** Looks like a token address / mint the user pasted (not a symbol search). */
export function looksLikeTokenAddress(query, chainType) {
  const q = String(query || '').trim();
  if (chainType === 'EVM') return /^0x[0-9a-fA-F]{40}$/.test(q);
  if (chainType === 'SVM') return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(q);
  if (chainType === 'MVM') return /^0x[0-9a-fA-F]{1,64}(::\w+::\w+)?$/.test(q);
  return q.length >= 26 && !/\s/.test(q);
}

/**
 * Throwaway addresses used only to fetch a preview quote before a wallet / recipient is set. They are never
 * used to build a transaction the user signs (execution always re-quotes with the real addresses).
 */
const PREVIEW_ADDRESSES = {
  EVM: '0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0',
  SVM: '4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T',
  btc: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
};

export function previewAddressForChain(chain) {
  if (!chain) return null;
  if (chain.chainType === 'UTXO') return PREVIEW_ADDRESSES[chain.key] || null;
  return PREVIEW_ADDRESSES[chain.chainType] || null;
}

/** Decimal string → integer string in base units (no floats). Returns null when invalid. */
export function toBaseUnits(amount, decimals) {
  const s = String(amount ?? '').trim();
  if (!/^\d*\.?\d*$/.test(s) || s === '' || s === '.') return null;
  const [whole, frac = ''] = s.split('.');
  const d = Math.max(0, Number(decimals) || 0);
  if (frac.length > d && /[1-9]/.test(frac.slice(d))) return null;
  const units = `${whole || '0'}${frac.padEnd(d, '0').slice(0, d)}`.replace(/^0+(?=\d)/, '');
  return units;
}

/** Integer string in base units → short decimal string. */
export function fromBaseUnits(raw, decimals, maxFrac = 6) {
  let v;
  try {
    v = BigInt(String(raw ?? '0'));
  } catch {
    return '0';
  }
  const neg = v < 0n;
  if (neg) v = -v;
  const d = BigInt(Math.max(0, Number(decimals) || 0));
  const base = 10n ** d;
  const whole = v / base;
  let frac = (v % base).toString().padStart(Number(d), '0');
  // Keep significant digits for tiny amounts, otherwise trim to maxFrac.
  if (whole === 0n && frac.length > maxFrac) {
    const firstNonZero = frac.search(/[1-9]/);
    const keep = firstNonZero === -1 ? maxFrac : Math.max(maxFrac, firstNonZero + 3);
    frac = frac.slice(0, keep);
  } else {
    frac = frac.slice(0, maxFrac);
  }
  frac = frac.replace(/0+$/, '');
  const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${neg ? '-' : ''}${wholeStr}${frac ? `.${frac}` : ''}`;
}

export function formatUsd(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  if (n === 0) return '$0.00';
  if (n < 0.01) return '<$0.01';
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDuration(seconds) {
  const n = Number(seconds);
  if (!Number.isFinite(n)) return '';
  const s = Math.max(1, Math.round(n));
  if (s < 60) return `~${s} sec`;
  const m = Math.round(s / 60);
  if (m < 60) return `~${m} min`;
  const h = m / 60;
  return `~${h % 1 === 0 ? h : h.toFixed(1)} h`;
}

const sumUsd = (list) => list.reduce((acc, x) => acc + (Number(x?.amountUSD) || 0), 0);

/**
 * Plain summary of a /v1/quote step for the UI.
 * @param {any} step LI.FI quote (a Step with estimate, action, includedSteps, transactionRequest)
 * @param {{ platformFee?: number }} [opts]
 */
export function summarizeQuote(step, opts = {}) {
  const est = step?.estimate || {};
  const action = step?.action || {};
  const toToken = action.toToken || {};
  const fromToken = action.fromToken || {};
  const feeCosts = Array.isArray(est.feeCosts) ? est.feeCosts : [];
  const gasCosts = Array.isArray(est.gasCosts) ? est.gasCosts : [];
  let platformFeeAmount = null;
  let platformFeeUSD = null;
  const fees = feeCosts.map((f) => {
    const integrator = f?.feeSplit?.integratorFee;
    if (integrator != null && f.amount && Number(f.amount) > 0) {
      const share = Number(integrator) / Number(f.amount);
      platformFeeAmount = String(integrator);
      platformFeeUSD = Number.isFinite(share) ? (Number(f.amountUSD) || 0) * share : null;
    }
    return {
      name: f.name || 'Fee',
      description: f.description || '',
      amount: f.amount || '0',
      amountUSD: f.amountUSD ?? null,
      token: f.token ? normalizeToken(f.token) : null,
      included: f.included !== false,
      percentage: f.percentage ?? null,
    };
  });
  const gas = gasCosts.map((g) => ({
    amount: g.amount || '0',
    amountUSD: g.amountUSD ?? null,
    token: g.token ? normalizeToken(g.token) : null,
  }));
  const steps = (Array.isArray(step?.includedSteps) && step.includedSteps.length ? step.includedSteps : [step])
    .filter(Boolean)
    .map((s) => ({
      type: s.type,
      tool: s.toolDetails?.name || s.tool || '',
      logoURI: s.toolDetails?.logoURI || '',
      fromChainId: s.action?.fromChainId,
      toChainId: s.action?.toChainId,
      fromSymbol: s.action?.fromToken?.symbol,
      toSymbol: s.action?.toToken?.symbol,
    }));
  const toDecimals = toToken.decimals ?? 18;
  const notIncludedFeesUSD = sumUsd(fees.filter((f) => !f.included));
  return {
    id: step?.id || '',
    tool: step?.tool || '',
    toolName: step?.toolDetails?.name || step?.tool || 'LI.FI',
    toolLogo: step?.toolDetails?.logoURI || '',
    fromAmount: est.fromAmount || action.fromAmount || '0',
    toAmount: est.toAmount || '0',
    toAmountMin: est.toAmountMin || est.toAmount || '0',
    toDecimals,
    fromDecimals: fromToken.decimals ?? 18,
    toSymbol: toToken.symbol || '',
    fromSymbol: fromToken.symbol || '',
    fromAmountUSD: est.fromAmountUSD ?? null,
    toAmountUSD: est.toAmountUSD ?? null,
    durationSec: Number.isFinite(Number(est.executionDuration)) ? Number(est.executionDuration) : null,
    slippage: action.slippage ?? null,
    approvalAddress: est.approvalAddress || null,
    gasUSD: sumUsd(gas),
    feesUSD: sumUsd(fees),
    /** Fees paid on top of the amount you send (most fees are already taken out of what you receive). */
    extraCostUSD: sumUsd(gas) + notIncludedFeesUSD,
    platformFeeAmount,
    platformFeeUSD,
    platformFee: opts.platformFee ?? null,
    fees,
    gas,
    steps,
    fromChainId: action.fromChainId,
    toChainId: action.toChainId,
    toAddress: action.toAddress || '',
    fromAddress: action.fromAddress || '',
    hasTransaction: Boolean(step?.transactionRequest?.data),
  };
}

/**
 * Turn a LI.FI error body (or wallet / network error) into one sentence an average user understands.
 * LI.FI codes: https://docs.li.fi/api-reference/error-codes
 */
export function explainLifiError(input, ctx = {}) {
  const body = input && typeof input === 'object' ? input : {};
  const code = Number(body.code ?? body?.data?.code);
  const status = Number(body.status ?? body.httpStatus);
  const msg = String(body.message || body.error || body.shortMessage || (typeof input === 'string' ? input : '') || '');
  const low = msg.toLowerCase();
  const sym = ctx.fromSymbol || 'this token';

  if (body.code === 4001 || body.code === 'ACTION_REJECTED' || /user (rejected|denied)|rejected the request|request rejected/.test(low)) {
    return 'You cancelled the request in your wallet. Nothing was sent.';
  }
  if (status === 429 || code === 1005 || /rate limit|too many requests/.test(low)) {
    return 'Too many quote requests right now. Wait a minute and try again.';
  }
  if (/insufficient funds|exceeds balance|insufficient balance|not enough/.test(low)) {
    return `Your wallet doesn't have enough ${sym} (plus network gas) for this amount.`;
  }
  if (code === 1011 && /token/.test(low)) return 'That token address is not valid on this network, or LI.FI does not support it.';
  if (code === 1011 || code === 1000 || /invalid|validation|must be/.test(low)) {
    if (/address/.test(low)) return 'One of the addresses is not valid for its network. Check the recipient address.';
    return 'LI.FI could not use these settings. Check the amount and the tokens and try again.';
  }
  if (code === 1002 || code === 1001 || /no (available )?(quotes?|routes?)|none of the available routes/.test(low)) {
    return 'No route found for this pair and amount. Try a larger amount, a different token (USDC or the gas token usually work), or another network.';
  }
  if (code === 1003 || /not found/.test(low)) return 'LI.FI could not find that. Check the token or transaction and try again.';
  if (code === 1004 || /slippage/.test(low)) return 'The price moved too much. Raise slippage slightly or try again.';
  if (code === 1007 || /amount.*(too (low|small))|minimum/.test(low)) return 'The amount is too small for any bridge. Try a larger amount.';
  if (code === 1009 || /timeout|timed out/.test(low)) return 'LI.FI took too long to answer. Try again.';
  if (/failed to fetch|networkerror|network request failed|load failed/.test(low)) {
    return "Couldn't reach the bridge service. Check your connection and try again.";
  }
  if (/chain.*(not|un)supported|unsupported chain|unrecognized chain/.test(low)) {
    return 'Your wallet does not support this network. Add it to your wallet, or pick another network.';
  }
  return msg ? `Something went wrong: ${msg.slice(0, 160)}` : 'Something went wrong. Try again.';
}

/** /v1/status → one of 'pending' | 'done' | 'partial' | 'refunded' | 'failed' | 'not_found' and a plain message. */
export function explainStatus(statusBody) {
  const s = String(statusBody?.status || '').toUpperCase();
  const sub = String(statusBody?.substatus || '').toUpperCase();
  if (s === 'DONE') {
    if (sub === 'PARTIAL') return { state: 'partial', text: 'Arrived, but as a different token on the destination (the bridge could not complete the last swap).' };
    if (sub === 'REFUNDED') return { state: 'refunded', text: 'The transfer could not complete, so your tokens were refunded.' };
    return { state: 'done', text: 'Arrived on the destination network.' };
  }
  if (s === 'FAILED') return { state: 'failed', text: statusBody?.substatusMessage || 'The transfer failed. If tokens left your wallet, LI.FI will refund them.' };
  if (s === 'NOT_FOUND') return { state: 'pending', text: 'Waiting for the network to pick up your transaction…' };
  if (sub === 'WAIT_DESTINATION_TRANSACTION') return { state: 'pending', text: 'Sent. Waiting for the destination network…' };
  if (sub === 'WAIT_SOURCE_CONFIRMATIONS') return { state: 'pending', text: 'Waiting for confirmations on the sending network…' };
  if (sub === 'REFUND_IN_PROGRESS') return { state: 'pending', text: 'Refund in progress…' };
  return { state: 'pending', text: statusBody?.substatusMessage || 'Bridging in progress…' };
}

/** ABI-encode ERC-20 `allowance(owner, spender)` and `approve(spender, amount)` without pulling in a library. */
const pad32 = (hex) => hex.replace(/^0x/, '').toLowerCase().padStart(64, '0');
export function encodeAllowance(owner, spender) {
  return `0xdd62ed3e${pad32(owner)}${pad32(spender)}`;
}
export function encodeApprove(spender, amount) {
  return `0x095ea7b3${pad32(spender)}${pad32(BigInt(amount).toString(16))}`;
}

/** Keep a typed amount to digits and one dot ("1,5" → "1.5"). */
export function sanitizeAmount(v) {
  let s = String(v || '').replace(/,/g, '.').replace(/[^\d.]/g, '');
  const i = s.indexOf('.');
  if (i !== -1) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '');
  return s;
}
