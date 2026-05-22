// Personal trading PnL estimates from swap activity (USD via current prices)

const TOKEN_PRICE_IDS = {
  ETH: 'ethereum',
  WETH: 'ethereum',
  BTC: 'bitcoin',
  WBTC: 'wrapped-bitcoin',
  USDC: 'usd-coin',
  USDT: 'tether',
  DAI: 'dai',
  MATIC: 'matic-network',
  POL: 'matic-network',
  BNB: 'binancecoin',
  SOL: 'solana',
  ARB: 'arbitrum',
  OP: 'optimism',
  LINK: 'chainlink',
  UNI: 'uniswap',
  AAVE: 'aave',
  AVAX: 'avalanche-2',
  CRV: 'curve-dao-token',
  MKR: 'maker',
  LDO: 'lido-dao',
  PEPE: 'pepe',
  SHIB: 'shiba-inu',
};

const STABLES = new Set(['USDC', 'USDT', 'DAI', 'USDC.E', 'BUSD', 'FRAX', 'TUSD']);

export function symbolToCoinId(symbol) {
  if (!symbol) return null;
  const normalized = String(symbol).toUpperCase().replace(/^\$/, '').trim();
  if (STABLES.has(normalized)) return TOKEN_PRICE_IDS[normalized] || 'usd-coin';
  return TOKEN_PRICE_IDS[normalized] || null;
}

export function parseTokenAmount(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number' && !Number.isNaN(raw)) return raw;
  const match = String(raw).trim().match(/^([\d,.]+)/);
  if (!match) return null;
  const n = parseFloat(match[1].replace(/,/g, ''));
  return Number.isNaN(n) ? null : n;
}

function getSwapSymbols(tx) {
  const tokenIn = tx.from || tx.tokenIn || '';
  const tokenOut = tx.to || tx.tokenOut || '';
  return {
    tokenIn: String(tokenIn).split(/[\s/]/)[0],
    tokenOut: String(tokenOut).split(/[\s/]/)[0],
  };
}

function getSwapAmounts(tx) {
  return {
    amountIn: parseTokenAmount(tx.amount ?? tx.amountIn),
    amountOut: parseTokenAmount(tx.value ?? tx.amountOut),
  };
}

function resolvePrice(symbol, priceMap) {
  const upper = String(symbol).toUpperCase();
  if (STABLES.has(upper)) return 1;
  const coinId = symbolToCoinId(symbol);
  return coinId ? priceMap[coinId]?.usd : null;
}

export function collectSwapCoinIds(swaps) {
  const ids = new Set();
  (swaps || []).forEach((tx) => {
    const { tokenIn, tokenOut } = getSwapSymbols(tx);
    const inId = symbolToCoinId(tokenIn);
    const outId = symbolToCoinId(tokenOut);
    if (inId) ids.add(inId);
    if (outId) ids.add(outId);
  });
  return [...ids];
}

export function computeTradingPnl(swaps, priceMap = {}) {
  const list = (swaps || []).filter((tx) => tx.type === 'swap');
  let estimatedVolumeUsd = 0;
  let estimatedNetPnlUsd = 0;
  let pricedSwapCount = 0;
  let winningSwaps = 0;
  const pairCounts = {};

  list.forEach((tx) => {
    const { tokenIn, tokenOut } = getSwapSymbols(tx);
    const { amountIn, amountOut } = getSwapAmounts(tx);
    const pairKey = `${tokenIn}/${tokenOut}`;
    pairCounts[pairKey] = (pairCounts[pairKey] || 0) + 1;

    const priceIn = resolvePrice(tokenIn, priceMap);
    const priceOut = resolvePrice(tokenOut, priceMap);

    if (amountIn == null || amountOut == null || priceIn == null || priceOut == null) return;

    const usdIn = amountIn * priceIn;
    const usdOut = amountOut * priceOut;
    estimatedVolumeUsd += Math.max(usdIn, usdOut);
    estimatedNetPnlUsd += usdOut - usdIn;
    pricedSwapCount += 1;
    if (usdOut > usdIn) winningSwaps += 1;
  });

  const topPairEntry = Object.entries(pairCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    swapCount: list.length,
    pricedSwapCount,
    estimatedVolumeUsd,
    estimatedNetPnlUsd,
    avgSwapSizeUsd: pricedSwapCount > 0 ? estimatedVolumeUsd / pricedSwapCount : 0,
    winRate: pricedSwapCount > 0 ? (winningSwaps / pricedSwapCount) * 100 : null,
    topPair: topPairEntry ? { pair: topPairEntry[0], count: topPairEntry[1] } : null,
  };
}

export function formatUsd(value) {
  if (value == null || Number.isNaN(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
}
