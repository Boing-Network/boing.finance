// CoinGecko API Service
// Public/demo tiers are aggressively rate-limited. This client coalesces in-flight
// requests, shares a per-id cache, serves stale data on 429, and ignores placeholder keys.

import { cachedFetch } from '../utils/apiClient';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const RAW_COINGECKO_API_KEY = process.env.REACT_APP_COINGECKO_API_KEY;
const REQUEST_TIMEOUT_MS = 8000;
const SIMPLE_TTL_MS = 60_000;
const HEAVY_TTL_MS = 5 * 60_000;
const MAX_CONCURRENT = 2;

function isUsableSecret(value) {
  if (!value || typeof value !== 'string') return false;
  const v = value.trim();
  if (!v) return false;
  const lower = v.toLowerCase();
  if (lower.startsWith('your_')) return false;
  if (lower.includes('_here')) return false;
  if (lower === 'changeme' || lower === 'placeholder') return false;
  return true;
}

export function hasCoinGeckoApiKey() {
  return isUsableSecret(RAW_COINGECKO_API_KEY);
}

const COINGECKO_API_KEY = hasCoinGeckoApiKey() ? RAW_COINGECKO_API_KEY.trim() : '';

const memoryCache = new Map();
const inFlight = new Map();
const simpleById = new Map();
const tokenByKey = new Map();

let activeCount = 0;
const waitQueue = [];

function cacheGet(key, ttlMs, allowStale = false) {
  const row = memoryCache.get(key);
  if (!row) return null;
  if (Date.now() - row.timestamp < ttlMs) return row.data;
  return allowStale ? row.data : null;
}

function cacheSet(key, data) {
  memoryCache.set(key, { data, timestamp: Date.now() });
}

function pumpQueue() {
  while (activeCount < MAX_CONCURRENT && waitQueue.length) {
    const job = waitQueue.shift();
    activeCount += 1;
    job()
      .then((value) => job.resolve(value))
      .catch((err) => job.reject(err))
      .finally(() => {
        activeCount -= 1;
        pumpQueue();
      });
  }
}

function enqueue(run) {
  return new Promise((resolve, reject) => {
    const job = async () => run();
    job.resolve = resolve;
    job.reject = reject;
    waitQueue.push(job);
    pumpQueue();
  });
}

async function fetchJson(url, { ttlMs = SIMPLE_TTL_MS, cacheKey = url } = {}) {
  const fresh = cacheGet(cacheKey, ttlMs);
  if (fresh != null) return fresh;
  if (inFlight.has(cacheKey)) return inFlight.get(cacheKey);

  const pending = enqueue(async () => {
    const stillFresh = cacheGet(cacheKey, ttlMs);
    if (stillFresh != null) return stillFresh;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (response.status === 429) {
        const stale = cacheGet(cacheKey, ttlMs, true);
        if (stale != null) return stale;
        throw new Error('CoinGecko API error: 429');
      }
      if (!response.ok) {
        const stale = cacheGet(cacheKey, ttlMs, true);
        if (stale != null) return stale;
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      const data = await response.json();
      cacheSet(cacheKey, data);
      return data;
    } catch (error) {
      const stale = cacheGet(cacheKey, ttlMs, true);
      if (stale != null) return stale;
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }).finally(() => {
    inFlight.delete(cacheKey);
  });

  inFlight.set(cacheKey, pending);
  return pending;
}

function rememberSimplePrices(data) {
  if (!data || typeof data !== 'object') return;
  const now = Date.now();
  for (const [id, row] of Object.entries(data)) {
    if (row && typeof row === 'object') simpleById.set(id, { data: row, timestamp: now });
  }
}

function rememberTokenPrices(network, data) {
  if (!data || typeof data !== 'object') return;
  const now = Date.now();
  for (const [address, row] of Object.entries(data)) {
    if (row && typeof row === 'object') {
      tokenByKey.set(`${network}_${address.toLowerCase()}`, { data: row, timestamp: now });
    }
  }
}

class CoinGeckoService {
  constructor() {
    this.cacheTimeout = SIMPLE_TTL_MS;
  }

  getApiUrl(endpoint) {
    const url = `${COINGECKO_API_BASE}${endpoint}`;
    if (COINGECKO_API_KEY) {
      const separator = endpoint.includes('?') ? '&' : '?';
      return `${url}${separator}x_cg_demo_api_key=${COINGECKO_API_KEY}`;
    }
    return url;
  }

  async getGlobalMarketData() {
    try {
      return await fetchJson(this.getApiUrl('/global'), { ttlMs: HEAVY_TTL_MS });
    } catch (error) {
      console.error('Error fetching global market data:', error);
      return null;
    }
  }

  async getTokenPrice(contractAddress, network = 'ethereum', options = {}) {
    if (network === 'coins') {
      return this.getCoinPrice(contractAddress, options);
    }
    const maxAge = Number.isFinite(options.maxAgeMs) ? options.maxAgeMs : SIMPLE_TTL_MS;
    const addr = String(contractAddress || '').toLowerCase();
    const local = tokenByKey.get(`${network}_${addr}`);
    if (local && Date.now() - local.timestamp < maxAge) return local.data;

    try {
      const data = await fetchJson(
        this.getApiUrl(
          `/simple/token_price/${network}?contract_addresses=${addr}&vs_currencies=usd&include_24hr_change=true`
        ),
        { ttlMs: maxAge, cacheKey: `token_price_${network}_${addr}` }
      );
      rememberTokenPrices(network, data);
      return data?.[addr] || null;
    } catch (error) {
      console.error('Error fetching token price:', error);
      return local?.data || null;
    }
  }

  async getTokenPrices(contractAddresses, network = 'ethereum') {
    const list = (Array.isArray(contractAddresses) ? contractAddresses : String(contractAddresses).split(','))
      .map((a) => String(a || '').trim().toLowerCase())
      .filter(Boolean);
    if (!list.length) return {};

    const now = Date.now();
    const out = {};
    const missing = [];
    for (const addr of list) {
      const local = tokenByKey.get(`${network}_${addr}`);
      if (local && now - local.timestamp < SIMPLE_TTL_MS) out[addr] = local.data;
      else missing.push(addr);
    }
    if (!missing.length) return out;

    try {
      const data = await fetchJson(
        this.getApiUrl(
          `/simple/token_price/${network}?contract_addresses=${missing.join(',')}&vs_currencies=usd&include_24hr_change=true`
        ),
        { ttlMs: SIMPLE_TTL_MS, cacheKey: `token_prices_${network}_${missing.slice().sort().join(',')}` }
      );
      rememberTokenPrices(network, data);
      return { ...out, ...(data || {}) };
    } catch (error) {
      console.error('Error fetching token prices:', error);
      return out;
    }
  }

  async getTokenInfo(contractAddress, network = 'ethereum') {
    try {
      return await fetchJson(
        this.getApiUrl(`/coins/${network}/contract/${contractAddress}`),
        { ttlMs: HEAVY_TTL_MS, cacheKey: `token_info_${network}_${contractAddress}` }
      );
    } catch (error) {
      console.error('Error fetching token info:', error);
      return null;
    }
  }

  async getSimplePrices(coinIds) {
    const ids = (Array.isArray(coinIds) ? coinIds : String(coinIds).split(','))
      .map((id) => String(id || '').trim())
      .filter(Boolean);
    if (!ids.length) return {};

    const now = Date.now();
    const out = {};
    const missing = [];
    for (const id of ids) {
      const local = simpleById.get(id);
      if (local && now - local.timestamp < SIMPLE_TTL_MS) out[id] = local.data;
      else missing.push(id);
    }
    if (!missing.length) return out;

    const sorted = [...missing].sort();
    try {
      const data = await fetchJson(
        this.getApiUrl(`/simple/price?ids=${sorted.join(',')}&vs_currencies=usd&include_24hr_change=true`),
        { ttlMs: SIMPLE_TTL_MS, cacheKey: `simple_prices_${sorted.join(',')}` }
      );
      rememberSimplePrices(data);
      return { ...out, ...(data || {}) };
    } catch (error) {
      console.error('Error fetching simple prices:', error);
      return out;
    }
  }

  async getCoinPrice(coinId, options = {}) {
    const maxAge = Number.isFinite(options.maxAgeMs) ? options.maxAgeMs : SIMPLE_TTL_MS;
    const local = simpleById.get(coinId);
    if (local && Date.now() - local.timestamp < maxAge) return local.data;
    const batch = await this.getSimplePrices([coinId]);
    return batch?.[coinId] || local?.data || null;
  }

  async getMarketChartByCoinId(coinId, days = 7) {
    const cacheKey = `market_chart_${coinId}_${days}`;
    const cached = cacheGet(cacheKey, HEAVY_TTL_MS, true);
    if (cached && cacheGet(cacheKey, days <= 1 ? 45_000 : HEAVY_TTL_MS)) return cached;
    try {
      const url = this.getApiUrl(`/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`);
      const data = await cachedFetch(url, {}, { ttlMs: HEAVY_TTL_MS, retries: 1 });
      if (data) cacheSet(cacheKey, data);
      return data ?? cached ?? null;
    } catch (error) {
      console.error('Error fetching market chart:', error);
      return cached ?? null;
    }
  }

  async getPriceHistoryByCoinId(coinId, days = 7) {
    return this.getMarketChartByCoinId(coinId, days);
  }

  async getPriceHistory(contractAddress, days = 7, network = 'ethereum') {
    const ttl = days <= 1 ? 45_000 : HEAVY_TTL_MS;
    try {
      return await fetchJson(
        this.getApiUrl(
          `/coins/${network}/contract/${contractAddress}/market_chart?vs_currency=usd&days=${days}`
        ),
        { ttlMs: ttl, cacheKey: `history_${network}_${contractAddress}_${days}` }
      );
    } catch (error) {
      console.error('Error fetching price history:', error);
      return null;
    }
  }

  async getCoinById(coinId) {
    try {
      return await fetchJson(
        this.getApiUrl(
          `/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
        ),
        { ttlMs: HEAVY_TTL_MS, cacheKey: `coin_${coinId}` }
      );
    } catch (error) {
      console.error('Error fetching coin by ID:', error);
      return null;
    }
  }

  async searchTokens(query) {
    try {
      return await fetchJson(
        this.getApiUrl(`/search?query=${encodeURIComponent(query)}`),
        { ttlMs: 30_000, cacheKey: `search_${String(query || '').toLowerCase()}` }
      );
    } catch (error) {
      console.error('Error searching tokens:', error);
      return { coins: [], nfts: [], exchanges: [] };
    }
  }

  async getNftMarkets(limit = 10) {
    if (!hasCoinGeckoApiKey()) return [];
    try {
      const data = await fetchJson(
        this.getApiUrl(`/nfts/markets?order=volume_24h_native_desc&per_page=${limit}`),
        { ttlMs: HEAVY_TTL_MS, cacheKey: `nft_markets_${limit}` }
      );
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('Error fetching NFT markets:', error);
      return [];
    }
  }

  async getTrendingTokens() {
    try {
      return await fetchJson(this.getApiUrl('/search/trending'), {
        ttlMs: HEAVY_TTL_MS,
        cacheKey: 'trending',
      });
    } catch (error) {
      console.error('Error fetching trending tokens:', error);
      return { coins: [] };
    }
  }

  async getMarketData(contractAddress, network = 'ethereum') {
    try {
      return await fetchJson(
        this.getApiUrl(
          `/coins/${network}/contract/${contractAddress}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
        ),
        { ttlMs: HEAVY_TTL_MS, cacheKey: `market_${network}_${contractAddress}` }
      );
    } catch (error) {
      console.error('Error fetching market data:', error);
      return null;
    }
  }

  clearCache() {
    memoryCache.clear();
    simpleById.clear();
    tokenByKey.clear();
    inFlight.clear();
  }
}

const coingeckoServiceInstance = new CoinGeckoService();
export default coingeckoServiceInstance;
