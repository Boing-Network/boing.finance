// Crypto Fear & Greed Index (Alternative.me — free, no API key)

const FNG_API = 'https://api.alternative.me/fng/';

export async function getFearGreedIndex(limit = 1) {
  try {
    const res = await fetch(`${FNG_API}?limit=${limit}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`FNG API ${res.status}`);
    const json = await res.json();
    const rows = json?.data || [];
    return rows.map((row) => ({
      value: parseInt(row.value, 10),
      classification: row.value_classification,
      timestamp: row.timestamp ? new Date(parseInt(row.timestamp, 10) * 1000).toISOString() : null,
    }));
  } catch (error) {
    console.warn('Fear & Greed fetch failed:', error.message);
    return [];
  }
}

export function getFearGreedColor(value) {
  if (value <= 25) return { text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/40', label: 'Extreme Fear' };
  if (value <= 45) return { text: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/40', label: 'Fear' };
  if (value <= 55) return { text: 'text-gray-300', bg: 'bg-gray-500/20', border: 'border-gray-500/40', label: 'Neutral' };
  if (value <= 75) return { text: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/40', label: 'Greed' };
  return { text: 'text-emerald-300', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', label: 'Extreme Greed' };
}

const fearGreedService = { getFearGreedIndex, getFearGreedColor };
export default fearGreedService;
