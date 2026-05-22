// Shared analytics time-range config and aggregation helpers

export const ANALYTICS_TIME_RANGES = [
  { id: '24h', name: '24 Hours', shortLabel: '24h', days: 1 },
  { id: '7d', name: '7 Days', shortLabel: '7d', days: 7 },
  { id: '30d', name: '30 Days', shortLabel: '30d', days: 30 },
  { id: '1y', name: '1 Year', shortLabel: '1y', days: 365 },
  { id: 'all', name: 'All Time', shortLabel: 'All', days: null },
];

export const VALID_ANALYTICS_RANGES = ANALYTICS_TIME_RANGES.map((r) => r.id);

export function isValidAnalyticsRange(range) {
  return VALID_ANALYTICS_RANGES.includes(range);
}

export function getRangeMeta(range) {
  return ANALYTICS_TIME_RANGES.find((r) => r.id === range) || ANALYTICS_TIME_RANGES[0];
}

export function getRangeLabel(range) {
  return getRangeMeta(range).name;
}

export function getRangeShortLabel(range) {
  return getRangeMeta(range).shortLabel;
}

export function getRangeWindowMs(range) {
  const meta = getRangeMeta(range);
  if (meta.days == null) return null;
  return meta.days * 24 * 60 * 60 * 1000;
}

export function getRangeStartTimestampSec(range, nowSec = Math.floor(Date.now() / 1000)) {
  if (range === 'all') return 0;
  const meta = getRangeMeta(range);
  return nowSec - meta.days * 86400;
}

export function getCoinGeckoMarketChartDays(range) {
  const map = { '24h': 1, '7d': 7, '30d': 30, '1y': 365, all: 'max' };
  return map[range] ?? 7;
}

export function getChartMaxPoints(range) {
  const map = { '24h': 24, '7d': 7, '30d': 30, '1y': 52, all: 60 };
  return map[range] ?? 7;
}

export function formatChartTimeLabel(timestamp, range) {
  const date = new Date(timestamp);
  if (range === '24h') {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
  }
  if (range === '7d' || range === '30d') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/** Sum daily DEX volume points for a selected window. 24h uses the latest daily point. */
export function aggregateSeriesVolume(series, range) {
  if (!series?.length) return 0;
  const numeric = series.map((p) => Number(p.volume) || 0).filter((v) => v >= 0);
  if (!numeric.length) return 0;
  if (range === '24h') return numeric[numeric.length - 1];
  return numeric.reduce((sum, v) => sum + v, 0);
}

export function formatUsdVolume(value) {
  if (value == null || Number.isNaN(value) || value === 0) return null;
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function resolveVolumeMetric({
  timeRange,
  analytics,
  defiLlamaVolumeData,
  historicalVolumeData,
  geckoTerminalVolume,
  marketData,
}) {
  const chartVolume = aggregateSeriesVolume(defiLlamaVolumeData, timeRange);
  if (chartVolume > 0) {
    return {
      volume: chartVolume,
      source:
        timeRange === '24h'
          ? 'DEX volume (DefiLlama daily, latest point)'
          : `DEX volume (DefiLlama, ${getRangeLabel(timeRange).toLowerCase()} sum)`,
    };
  }

  if (
    analytics?.totalVolume &&
    parseFloat(analytics.totalVolume) > 0 &&
    analytics.range === timeRange
  ) {
    return {
      volume: parseFloat(analytics.totalVolume),
      source: `DEX volume (backend API, ${getRangeShortLabel(timeRange)})`,
    };
  }

  const fallbackChart = aggregateSeriesVolume(historicalVolumeData, timeRange);
  if (fallbackChart > 0) {
    return {
      volume: fallbackChart,
      source: `Bitcoin market volume proxy (CoinGecko, ${getRangeShortLabel(timeRange)})`,
    };
  }

  if (timeRange === '24h' && geckoTerminalVolume?.volume24h) {
    return { volume: geckoTerminalVolume.volume24h, source: 'DEX volume sample (GeckoTerminal 24h)' };
  }

  if (timeRange === '24h' && marketData?.data?.total_volume?.usd) {
    return { volume: marketData.data.total_volume.usd, source: 'Global crypto market (CoinGecko 24h)' };
  }

  return { volume: null, source: null };
}

export function sampleTimeSeries(series, range) {
  if (!series?.length) return [];
  const maxPoints = getChartMaxPoints(range);
  const step = Math.max(1, Math.floor(series.length / maxPoints));
  return series.filter((_, i) => i % step === 0 || i === series.length - 1);
}
