import { getNetworkTrendingPools } from './geckoterminalService';
import { GECKOTERMINAL_NETWORK_BY_CHAIN, SOLANA_GECKOTERMINAL_NETWORK } from '../config/marketDataNetworks';

const QUOTE_SYMBOLS = new Set([
  'WETH', 'ETH', 'WBNB', 'BNB', 'WMATIC', 'MATIC', 'POL', 'WAVAX', 'AVAX',
  'WFTM', 'FTM', 'USDC', 'USDT', 'DAI', 'USDCE', 'USDBC', 'USDC.E',
  'WSOL', 'SOL', 'WBTC', 'CBBTC', 'WETH.E',
]);

function tokenFromInclude(included, relId) {
  if (!relId) return null;
  const row = included.find((item) => item?.id === relId && item?.type === 'token');
  const a = row?.attributes;
  if (!a?.address || !a?.symbol) return null;
  return {
    address: String(a.address),
    symbol: String(a.symbol).toUpperCase(),
    name: a.name || String(a.symbol),
    decimals: Number.isFinite(Number(a.decimals)) ? Number(a.decimals) : 18,
    logo: a.image_url || '',
  };
}

function pickDiscovery(base, quote, attrs) {
  if (!base) return null;
  const quoteIsQuote = quote && QUOTE_SYMBOLS.has(quote.symbol);
  const baseIsQuote = QUOTE_SYMBOLS.has(base.symbol);
  if (quoteIsQuote && !baseIsQuote) {
    return {
      token: base,
      quoteSymbol: quote.symbol,
      priceUsd: Number(attrs.base_token_price_usd),
    };
  }
  if (baseIsQuote && quote && !QUOTE_SYMBOLS.has(quote.symbol)) {
    return {
      token: quote,
      quoteSymbol: base.symbol,
      priceUsd: Number(attrs.quote_token_price_usd),
    };
  }
  return {
    token: base,
    quoteSymbol: quote?.symbol || 'USD',
    priceUsd: Number(attrs.base_token_price_usd),
  };
}

export function formatMarketPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n >= 1) return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return n.toPrecision(4);
}

export function formatMarketVolume(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function formatMarketChange(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

/**
 * Live trending DEX markets for the active chain (GeckoTerminal pools).
 * @param {{ chainId?: number, solana?: boolean }} opts
 */
export async function fetchChainDexMarkets({ chainId, solana } = {}) {
  const network = solana ? SOLANA_GECKOTERMINAL_NETWORK : GECKOTERMINAL_NETWORK_BY_CHAIN[Number(chainId)];
  if (!network) return [];
  const { pools, included } = await getNetworkTrendingPools(network);
  const seen = new Set();
  const markets = [];
  for (const pool of pools) {
    const attrs = pool?.attributes || {};
    const baseId = pool?.relationships?.base_token?.data?.id;
    const quoteId = pool?.relationships?.quote_token?.data?.id;
    const base = tokenFromInclude(included, baseId);
    const quote = tokenFromInclude(included, quoteId);
    const picked = pickDiscovery(base, quote, attrs);
    if (!picked?.token?.address) continue;
    const key = picked.token.address.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    markets.push({
      id: pool.id || key,
      address: picked.token.address,
      symbol: picked.token.symbol,
      name: picked.token.name,
      decimals: picked.token.decimals,
      logo: picked.token.logo,
      quoteSymbol: picked.quoteSymbol,
      pair: `${picked.token.symbol}/${picked.quoteSymbol}`,
      priceUsd: Number.isFinite(picked.priceUsd) ? picked.priceUsd : null,
      change24h: Number(attrs.price_change_percentage?.h24),
      volume24h: Number(attrs.volume_usd?.h24),
      dex: pool?.relationships?.dex?.data?.id || '',
    });
  }
  return markets;
}
