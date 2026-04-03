/**
 * External Swap & Bridge URLs per network.
 * Used when Boing DEX/Bridge is not deployed - provides users a path to swap/bridge.
 * Mainnet-ready: verified URLs from official DEX/bridge aggregators.
 */

/** Official Boing Express wallet (Boing VM signing). See boing.network THREE-CODEBASE-ALIGNMENT.md. */
export const BOING_EXPRESS_ORIGIN = 'https://boing.express';

export const EXTERNAL_SWAP_URLS = {
  1: 'https://app.1inch.io',
  137: 'https://app.uniswap.org',
  56: 'https://pancakeswap.finance',
  42161: 'https://app.uniswap.org',
  10: 'https://app.uniswap.org',
  8453: 'https://app.uniswap.org',
  43114: 'https://traderjoexyz.com',
  250: 'https://spooky.fi',
  59144: 'https://kyberswap.com/linea',
  324: 'https://app.syncswap.xyz',
  534352: 'https://kyberswap.com/scroll',
  1101: 'https://app.uniswap.org',
  5000: 'https://app.agni.finance',
  81457: 'https://app.uniswap.org',
  204: 'https://pancakeswap.finance',
  34443: 'https://app.uniswap.org',
  11155111: 'https://app.uniswap.org',
};

export const EXTERNAL_BRIDGE_URLS = {
  default: 'https://li.fi',
  1: 'https://li.fi',
  137: 'https://li.fi',
  56: 'https://li.fi',
  42161: 'https://li.fi',
  10: 'https://li.fi',
  8453: 'https://li.fi',
  43114: 'https://core.app',
  250: 'https://li.fi',
  59144: 'https://li.fi',
  324: 'https://li.fi',
  534352: 'https://li.fi',
  1101: 'https://li.fi',
  5000: 'https://li.fi',
  81457: 'https://li.fi',
  204: 'https://li.fi',
  34443: 'https://li.fi',
  11155111: 'https://www.alchemy.com/faucets/ethereum-sepolia',
};

/**
 * Get external swap URL for a chain (when Boing DEX not deployed).
 */
export function getExternalSwapUrl(chainId) {
  return EXTERNAL_SWAP_URLS[chainId] || EXTERNAL_SWAP_URLS[1];
}

/**
 * Get external bridge URL for a chain.
 */
export function getExternalBridgeUrl(chainId) {
  return EXTERNAL_BRIDGE_URLS[chainId] || EXTERNAL_BRIDGE_URLS.default;
}
