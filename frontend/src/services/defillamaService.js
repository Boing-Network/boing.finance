// DefiLlama API Service
// Reliable, free DEX volume and TVL data - no API key required for basic usage
// Docs: https://api.llama.fi/ (overview/dexs, overview/chains, etc.)
// Uses shared apiClient for retries + caching.

import { cachedFetch } from '../utils/apiClient';

const DEFILLAMA_API = 'https://api.llama.fi';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

/**
 * Fetch DEX volume overview including historical chart.
 * totalDataChart: array of [unixTimestampSeconds, volumeUsd]
 * @returns {{ totalDataChart: Array<[number, number]> } | null}
 */
export async function getDexOverview() {
  try {
    const url = `${DEFILLAMA_API}/overview/dexs?excludeTotalDataChart=false`;
    const data = await cachedFetch(url, {}, { ttlMs: CACHE_TTL_MS, retries: 3 });
    return data?.totalDataChart ? data : null;
  } catch (err) {
    console.warn('DefiLlama DEX overview error:', err?.message);
    return null;
  }
}

/**
 * Get DEX volume chart data for the given time range.
 * Slices totalDataChart to the requested window (by timestamp).
 * @param {'24h'|'7d'|'30d'|'1y'} timeRange
 * @returns Promise<Array<{ time: string, volume: number, timestamp: number }>>
 */
export async function getDexVolumeChart(timeRange) {
  const data = await getDexOverview();
  if (!data?.totalDataChart?.length) return [];

  const now = Math.floor(Date.now() / 1000);
  const day = 86400;
  let fromTs = now;
  switch (timeRange) {
    case '24h':
      fromTs = now - 1 * day;
      break;
    case '7d':
      fromTs = now - 7 * day;
      break;
    case '30d':
      fromTs = now - 30 * day;
      break;
    case '1y':
      fromTs = now - 365 * day;
      break;
    default:
      fromTs = now - 7 * day;
  }

  const points = data.totalDataChart.filter(([ts]) => ts >= fromTs && ts <= now);
  if (points.length === 0) return [];

  const maxPoints = timeRange === '1y' ? 52 : timeRange === '30d' ? 30 : timeRange === '7d' ? 7 : 24;
  const step = Math.max(1, Math.floor(points.length / maxPoints));
  const sampled = points.filter((_, i) => i % step === 0 || i === points.length - 1);

  return sampled.map(([timestamp, volume]) => {
    const date = new Date(timestamp * 1000);
    let time =
      timeRange === '24h'
        ? date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
        : (timeRange === '7d' || timeRange === '30d')
          ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return { time, volume: Number(volume), timestamp: timestamp * 1000 };
  });
}

const defillamaService = { getDexOverview, getDexVolumeChart };
export default defillamaService;
