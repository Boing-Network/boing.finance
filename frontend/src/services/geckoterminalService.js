// GeckoTerminal API Service – second DEX data source for robustness
// Base URL: https://api.geckoterminal.com/api/v2
// Rate limit: ~10 calls/min (public). Use cachedFetch to respect cache TTL.

import { cachedFetch } from '../utils/apiClient';

const GEECKO_TERMINAL_BASE = 'https://api.geckoterminal.com/api/v2';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

/**
 * Get 24h DEX volume from GeckoTerminal trending pools (sample across networks).
 * Used as second source / fallback when DefiLlama is unavailable.
 * @returns {Promise<{ volume24h: number, source: 'geckoterminal' } | null>}
 */
export async function getDexVolume24h() {
  try {
    const url = `${GEECKO_TERMINAL_BASE}/networks/trending_pools`;
    const data = await cachedFetch(url, {}, { ttlMs: CACHE_TTL_MS, retries: 2 });
    if (!data?.data?.length) return null;

    let sum24h = 0;
    for (const pool of data.data) {
      const vol = pool?.attributes?.volume_usd;
      if (vol && typeof vol === 'object' && vol.h24 != null) {
        sum24h += Number(vol.h24) || 0;
      }
    }
    if (sum24h <= 0) return null;
    return { volume24h: sum24h, source: 'geckoterminal' };
  } catch (err) {
    console.warn('GeckoTerminal DEX volume error:', err?.message);
    return null;
  }
}

/**
 * Token USD close series from GeckoTerminal OHLCV (DEX-listed tokens CoinGecko may miss).
 * @param {string} network GeckoTerminal network id (eth, base, solana, …)
 * @param {string} tokenAddress contract or mint
 * @param {number} days 1 | 7 | 30
 * @returns {Promise<{ points: { t: number, p: number }[], source: 'geckoterminal' } | null>}
 */
export async function getTokenOhlcv(network, tokenAddress, days = 7) {
  if (!network || !tokenAddress) return null;
  const timeframe = days <= 1 ? 'hour' : days <= 7 ? 'hour' : 'day';
  const limit = days <= 1 ? 24 : days <= 7 ? 168 : 31;
  const url =
    `${GEECKO_TERMINAL_BASE}/networks/${encodeURIComponent(network)}` +
    `/tokens/${encodeURIComponent(tokenAddress)}/ohlcv/${timeframe}` +
    `?aggregate=1&limit=${limit}&currency=usd`;
  try {
    const data = await cachedFetch(url, {}, { ttlMs: CACHE_TTL_MS, retries: 1 });
    const rows = data?.data?.attributes?.ohlcv_list;
    if (!Array.isArray(rows) || rows.length < 2) return null;
    const points = rows
      .map((row) => {
        const t = Number(row?.[0]) * (String(row?.[0]).length < 12 ? 1000 : 1);
        const close = Number(row?.[4]);
        if (!Number.isFinite(t) || !Number.isFinite(close) || close <= 0) return null;
        return { t, p: close };
      })
      .filter(Boolean)
      .sort((a, b) => a.t - b.t);
    if (points.length < 2) return null;
    return { points, source: 'geckoterminal' };
  } catch (err) {
    console.warn('GeckoTerminal OHLCV error:', err?.message);
    return null;
  }
}

const geckoterminalService = { getDexVolume24h, getTokenOhlcv };
export default geckoterminalService;
