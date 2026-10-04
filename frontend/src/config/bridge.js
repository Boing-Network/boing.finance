import { getNetworkByChainId } from './networks';
import { getExternalBridgeUrl } from './networkExternalLinks';

/** LI.FI native gas token sentinel. */
export const LIFI_NATIVE = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

/** LI.FI integrator id — must match Partner Portal registration. */
export const LIFI_INTEGRATOR = 'boing.finance';

/** Platform service fee as a LI.FI `fee` decimal (0.005 = 0.5%). */
export const PLATFORM_BRIDGE_FEE = 0.005;
export const PLATFORM_BRIDGE_FEE_BPS = 50;
export const PLATFORM_BRIDGE_FEE_LABEL = '0.5%';

/**
 * Public fee-recipient address for display. LI.FI actually pays the wallet
 * configured for this integrator on https://portal.li.fi/ — set that to the
 * same address. Optional; fee still applied on quotes without it.
 */
export function getLifiFeeRecipient() {
  const raw = import.meta.env.REACT_APP_LIFI_FEE_RECIPIENT || '';
  const addr = String(raw).trim();
  if (/^0x[0-9a-fA-F]{40}$/.test(addr) && !/^0x0+$/i.test(addr)) return addr;
  return '';
}

export function getLifiFeeRecipients() {
  const sol = String(import.meta.env.REACT_APP_LIFI_FEE_RECIPIENT_SOL || '').trim();
  const btc = String(import.meta.env.REACT_APP_LIFI_FEE_RECIPIENT_BTC || '').trim();
  return {
    evm: getLifiFeeRecipient() || null,
    sol: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(sol) ? sol : null,
    btc: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{24,74}$/.test(btc) ? btc : null,
  };
}

/** Popular bridge assets per EVM chain (LI.FI native sentinel for gas tokens). */
const TOKENS = {
  1: [
    native('ETH'),
    erc20('USDC', 'USD Coin', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6),
    erc20('USDT', 'Tether USD', '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6),
    erc20('WETH', 'Wrapped Ether', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18),
  ],
  137: [
    native('MATIC'),
    erc20('USDC', 'USD Coin', '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', 6),
    erc20('USDT', 'Tether USD', '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', 6),
    erc20('WETH', 'Wrapped Ether', '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', 18),
  ],
  56: [
    native('BNB'),
    erc20('USDC', 'USD Coin', '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', 18),
    erc20('USDT', 'Tether USD', '0x55d398326f99059fF775485246999027B3197955', 18),
    erc20('WBNB', 'Wrapped BNB', '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', 18),
  ],
  42161: [
    native('ETH'),
    erc20('USDC', 'USD Coin', '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', 6),
    erc20('USDT', 'Tether USD', '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', 6),
    erc20('WETH', 'Wrapped Ether', '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', 18),
  ],
  10: [
    native('ETH'),
    erc20('USDC', 'USD Coin', '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', 6),
    erc20('USDT', 'Tether USD', '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', 6),
    erc20('WETH', 'Wrapped Ether', '0x4200000000000000000000000000000000000006', 18),
  ],
  8453: [
    native('ETH'),
    erc20('USDC', 'USD Coin', '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 6),
    erc20('WETH', 'Wrapped Ether', '0x4200000000000000000000000000000000000006', 18),
  ],
  43114: [
    native('AVAX'),
    erc20('USDC', 'USD Coin', '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', 6),
    erc20('USDT', 'Tether USD', '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', 6),
  ],
};

function native(symbol) {
  return { symbol, name: symbol, address: LIFI_NATIVE, decimals: 18, isNative: true };
}

function erc20(symbol, name, address, decimals) {
  return { symbol, name, address, decimals, isNative: false };
}

export function getBridgeTokensForChain(chainId) {
  const listed = TOKENS[Number(chainId)];
  if (listed) return listed;
  const net = getNetworkByChainId(chainId);
  const symbol = net?.nativeCurrency?.symbol || 'ETH';
  return [native(symbol)];
}

export function resolveBridgeToken(chainId, symbolOrToken) {
  if (symbolOrToken && typeof symbolOrToken === 'object' && symbolOrToken.address) {
    const addr = symbolOrToken.address;
    const isNative =
      symbolOrToken.isNative ||
      !addr ||
      addr === '0x0000000000000000000000000000000000000000' ||
      addr.toLowerCase() === LIFI_NATIVE.toLowerCase();
    return {
      symbol: symbolOrToken.symbol,
      name: symbolOrToken.name || symbolOrToken.symbol,
      address: isNative ? LIFI_NATIVE : addr,
      decimals: symbolOrToken.decimals ?? 18,
      isNative,
    };
  }
  const symbol = String(symbolOrToken || '').toUpperCase();
  const tokens = getBridgeTokensForChain(chainId);
  const hit = tokens.find((t) => t.symbol.toUpperCase() === symbol);
  if (hit) return hit;
  const net = getNetworkByChainId(chainId);
  if (net?.nativeCurrency?.symbol && symbol === String(net.nativeCurrency.symbol).toUpperCase()) {
    return native(net.nativeCurrency.symbol);
  }
  return null;
}

export function buildLifiDeepLink({ fromChain, toChain, fromToken, toToken, fromAmount }) {
  const params = new URLSearchParams({
    fromChain: String(fromChain),
    toChain: String(toChain),
    fromToken: fromToken || LIFI_NATIVE,
    toToken: toToken || LIFI_NATIVE,
  });
  if (fromAmount) params.set('fromAmount', String(fromAmount));
  return `https://jumper.exchange/?${params.toString()}`;
}

export function getBridgeFallbackUrl(chainId) {
  return getExternalBridgeUrl(chainId) || 'https://li.fi';
}
