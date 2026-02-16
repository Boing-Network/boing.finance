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

const geckoterminalService = { getDexVolume24h };
export default geckoterminalService;
