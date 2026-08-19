import coingeckoService from './coingeckoService';
import { getTokenOhlcv } from './geckoterminalService';
import { getNetworkByChainId, BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import {
  COINGECKO_COIN_BY_SYMBOL,
  COINGECKO_NATIVE_COIN_BY_CHAIN,
  COINGECKO_PLATFORM_BY_CHAIN,
  GECKOTERMINAL_NETWORK_BY_CHAIN,
  SOLANA_COINGECKO_PLATFORM,
  SOLANA_GECKOTERMINAL_NETWORK,
} from '../config/marketDataNetworks';

const ZERO = '0x0000000000000000000000000000000000000000';

function isUsableAddress(address) {
  if (!address || typeof address !== 'string') return false;
  if (address === ZERO) return false;
  return true;
}

function seriesFromCgPrices(prices) {
  if (!Array.isArray(prices) || prices.length < 2) return [];
  return prices
    .map(([t, p]) => {
      const ts = Number(t);
      const price = Number(p);
      if (!Number.isFinite(ts) || !Number.isFinite(price) || price <= 0) return null;
      return { t: ts, p: price };
    })
    .filter(Boolean);
}

function withSpot(points, spotUsd, change24h, source) {
  const last = points[points.length - 1]?.p ?? null;
  const price = Number.isFinite(Number(spotUsd)) ? Number(spotUsd) : last;
  return {
    points,
    price,
    change24h: Number.isFinite(Number(change24h)) ? Number(change24h) : null,
    source,
    unavailableReason: null,
  };
}

async function fromCoinGeckoCoin(coinId, days) {
  if (!coinId) return null;
  const [history, spot] = await Promise.all([
    coingeckoService.getPriceHistoryByCoinId(coinId, days),
    coingeckoService.getCoinPrice(coinId),
  ]);
  const points = seriesFromCgPrices(history?.prices);
  if (points.length < 2) return null;
  return withSpot(points, spot?.usd, spot?.usd_24h_change, 'coingecko');
}

async function fromCoinGeckoContract(address, platform, days) {
  if (!isUsableAddress(address) || !platform) return null;
  const [history, spot] = await Promise.all([
    coingeckoService.getPriceHistory(address, days, platform),
    coingeckoService.getTokenPrice(address, platform),
  ]);
  const points = seriesFromCgPrices(history?.prices);
  if (points.length < 2) return null;
  return withSpot(points, spot?.usd, spot?.usd_24h_change, 'coingecko');
}

async function fromGeckoTerminal(network, address, days) {
  if (!network || !isUsableAddress(address)) return null;
  const gt = await getTokenOhlcv(network, address, days);
  if (!gt?.points?.length) return null;
  const last = gt.points[gt.points.length - 1].p;
  const first = gt.points[0].p;
  const change = first > 0 ? ((last - first) / first) * 100 : null;
  return {
    points: gt.points,
    price: last,
    change24h: days <= 1 ? change : null,
    source: 'geckoterminal',
    unavailableReason: null,
  };
}

function empty(reason) {
  return { points: [], price: null, change24h: null, source: null, unavailableReason: reason };
}

const SPOT_MAX_AGE_MS = 12_000;

async function coinSpot(coinId) {
  if (!coinId) return null;
  const spot = await coingeckoService.getCoinPrice(coinId, { maxAgeMs: SPOT_MAX_AGE_MS });
  const price = Number(spot?.usd);
  if (!Number.isFinite(price) || price <= 0) return null;
  return {
    price,
    change24h: Number.isFinite(Number(spot?.usd_24h_change)) ? Number(spot.usd_24h_change) : null,
    source: 'coingecko',
  };
}

async function contractSpot(address, platform) {
  if (!isUsableAddress(address) || !platform) return null;
  const spot = await coingeckoService.getTokenPrice(address, platform, { maxAgeMs: SPOT_MAX_AGE_MS });
  const price = Number(spot?.usd);
  if (!Number.isFinite(price) || price <= 0) return null;
  return {
    price,
    change24h: Number.isFinite(Number(spot?.usd_24h_change)) ? Number(spot.usd_24h_change) : null,
    source: 'coingecko',
  };
}

/**
 * Latest USD quote (short cache) so Swap can move the last chart point between history refreshes.
 */
export async function fetchTokenSpot(params) {
  const symbol = String(params?.symbol || '').toUpperCase();
  const address = params?.address || '';
  const isNative = Boolean(params?.isNative);
  const isSolana = params?.chain === 'solana';

  if (isSolana) {
    if (isNative || symbol === 'SOL') {
      const s = await coinSpot('solana');
      if (s) return s;
    }
    const bySymbol = COINGECKO_COIN_BY_SYMBOL[symbol];
    if (bySymbol) {
      const s = await coinSpot(bySymbol);
      if (s) return s;
    }
    const s = await contractSpot(address, SOLANA_COINGECKO_PLATFORM);
    if (s) return s;
    return { price: null, change24h: null, source: null, unavailableReason: 'unlisted' };
  }

  const chainId = Number(params?.chainId);
  if (chainId === BOING_NATIVE_L1_CHAIN_ID) {
    return { price: null, change24h: null, source: null, unavailableReason: 'native-l1' };
  }
  const network = getNetworkByChainId(chainId);
  if (network?.isTestnet) {
    return { price: null, change24h: null, source: null, unavailableReason: 'testnet' };
  }

  const nativeCoin =
    (isNative && COINGECKO_NATIVE_COIN_BY_CHAIN[chainId]) || COINGECKO_COIN_BY_SYMBOL[symbol] || null;

  if (isNative && nativeCoin) {
    const s = await coinSpot(nativeCoin);
    if (s) return s;
  }
  const platform = COINGECKO_PLATFORM_BY_CHAIN[chainId];
  if (isUsableAddress(address) && platform) {
    const s = await contractSpot(address, platform);
    if (s) return s;
  }
  if (!isNative && nativeCoin) {
    const s = await coinSpot(nativeCoin);
    if (s) return s;
  }
  return { price: null, change24h: null, source: null, unavailableReason: 'unlisted' };
}

/** Replace or append the live spot so the series moves without waiting for a full history refetch. */
export function overlayLivePrice(points, livePrice) {
  if (!Array.isArray(points) || points.length === 0) return points || [];
  const n = Number(livePrice);
  if (!Number.isFinite(n) || n <= 0) return points;
  const next = points.map((row) => ({ t: row.t, p: row.p }));
  const now = Date.now();
  const last = next[next.length - 1];
  if (now - last.t < 180_000) {
    next[next.length - 1] = { t: now, p: n };
  } else {
    next.push({ t: now, p: n });
  }
  return next;
}

/**
 * USD line series for Swap. CoinGecko first (listed majors), GeckoTerminal fallback (DEX tokens).
 * @param {{ chain?: 'evm' | 'solana', chainId?: number, address?: string, isNative?: boolean, symbol?: string, days?: number }} params
 */
export async function fetchTokenChart(params) {
  const days = Number(params?.days) > 0 ? Number(params.days) : 7;
  const symbol = String(params?.symbol || '').toUpperCase();
  const address = params?.address || '';
  const isNative = Boolean(params?.isNative);
  const isSolana = params?.chain === 'solana';

  if (isSolana) {
    if (isNative || symbol === 'SOL') {
      const cg = await fromCoinGeckoCoin('solana', days);
      if (cg) return cg;
    }
    const bySymbol = COINGECKO_COIN_BY_SYMBOL[symbol];
    if (bySymbol) {
      const cg = await fromCoinGeckoCoin(bySymbol, days);
      if (cg) return cg;
    }
    const cg = await fromCoinGeckoContract(address, SOLANA_COINGECKO_PLATFORM, days);
    if (cg) return cg;
    const gt = await fromGeckoTerminal(SOLANA_GECKOTERMINAL_NETWORK, address, days);
    if (gt) return gt;
    return empty('unlisted');
  }

  const chainId = Number(params?.chainId);
  if (chainId === BOING_NATIVE_L1_CHAIN_ID) return empty('native-l1');
  const network = getNetworkByChainId(chainId);
  if (network?.isTestnet) return empty('testnet');

  const nativeCoin =
    (isNative && COINGECKO_NATIVE_COIN_BY_CHAIN[chainId]) || COINGECKO_COIN_BY_SYMBOL[symbol] || null;

  if (isNative && nativeCoin) {
    const cg = await fromCoinGeckoCoin(nativeCoin, days);
    if (cg) return cg;
  }

  const platform = COINGECKO_PLATFORM_BY_CHAIN[chainId];
  if (isUsableAddress(address) && platform) {
    const cg = await fromCoinGeckoContract(address, platform, days);
    if (cg) return cg;
  }

  if (!isNative && nativeCoin) {
    const cg = await fromCoinGeckoCoin(nativeCoin, days);
    if (cg) return cg;
  }

  const gtNet = GECKOTERMINAL_NETWORK_BY_CHAIN[chainId];
  if (isUsableAddress(address) && gtNet) {
    const gt = await fromGeckoTerminal(gtNet, address, days);
    if (gt) return gt;
  }

  return empty('unlisted');
}

export function formatUsd(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${n.toPrecision(3)}`;
}

export function formatUsdCompact(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n >= 1) return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${n.toPrecision(4)}`;
}
