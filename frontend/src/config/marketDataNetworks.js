/**
 * Public-market IDs for CoinGecko and GeckoTerminal.
 * Used by Swap charts and spot USD — not Boing pool data.
 */

export const COINGECKO_PLATFORM_BY_CHAIN = {
  1: 'ethereum',
  137: 'polygon-pos',
  56: 'binance-smart-chain',
  42161: 'arbitrum-one',
  10: 'optimistic-ethereum',
  8453: 'base',
  43114: 'avalanche',
  250: 'fantom',
  100: 'xdai',
  59144: 'linea',
  1101: 'polygon-zkevm',
  324: 'zksync',
  534352: 'scroll',
  1284: 'moonbeam',
  1285: 'moonriver',
  5000: 'mantle',
  81457: 'blast',
  204: 'opbnb',
  34443: 'mode',
};

export const GECKOTERMINAL_NETWORK_BY_CHAIN = {
  1: 'eth',
  137: 'polygon_pos',
  56: 'bsc',
  42161: 'arbitrum',
  10: 'optimism',
  8453: 'base',
  43114: 'avax',
  250: 'ftm',
  100: 'xdai',
  59144: 'linea',
  1101: 'polygon-zkevm',
  324: 'zksync',
  534352: 'scroll',
  1284: 'moonbeam',
  1285: 'moonriver',
  5000: 'mantle',
  81457: 'blast',
  204: 'opbnb',
  34443: 'mode',
};

/** Native gas token → CoinGecko coin id (L2 ETH maps to ethereum). */
export const COINGECKO_NATIVE_COIN_BY_CHAIN = {
  1: 'ethereum',
  10: 'ethereum',
  8453: 'ethereum',
  42161: 'ethereum',
  59144: 'ethereum',
  1101: 'ethereum',
  324: 'ethereum',
  534352: 'ethereum',
  81457: 'ethereum',
  34443: 'ethereum',
  137: 'matic-network',
  56: 'binancecoin',
  204: 'binancecoin',
  43114: 'avalanche-2',
  250: 'fantom',
  100: 'xdai',
  1284: 'moonbeam',
  1285: 'moonriver',
  5000: 'mantle',
};

export const COINGECKO_COIN_BY_SYMBOL = {
  ETH: 'ethereum',
  WETH: 'weth',
  MATIC: 'matic-network',
  POL: 'polygon-ecosystem-token',
  BNB: 'binancecoin',
  AVAX: 'avalanche-2',
  FTM: 'fantom',
  SOL: 'solana',
  USDC: 'usd-coin',
  USDT: 'tether',
};

export const SOLANA_COINGECKO_PLATFORM = 'solana';
export const SOLANA_GECKOTERMINAL_NETWORK = 'solana';
