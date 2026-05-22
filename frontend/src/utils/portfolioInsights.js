// Portfolio insights — allocation, movers, and performance helpers

export function computeWeightedChange24h(balances) {
  if (!balances?.length) return null;
  let totalValue = 0;
  let weightedChange = 0;

  balances.forEach((token) => {
    const value = parseFloat(token.value) || 0;
    const change = parseFloat(token.priceChange24h ?? token.change24h) || 0;
    if (value <= 0) return;
    totalValue += value;
    weightedChange += value * change;
  });

  if (totalValue <= 0) return null;
  return weightedChange / totalValue;
}

export function computeSnapshotChange24h(currentValue, history) {
  const value = parseFloat(currentValue);
  if (!value || !history?.length) return null;

  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const sorted = [...history]
    .filter((h) => h.value > 0 && h.timestamp)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  if (sorted.length < 2) return null;

  let baseline = sorted[0];
  for (const point of sorted) {
    if (new Date(point.timestamp).getTime() <= cutoff) baseline = point;
    else break;
  }

  const baselineValue = parseFloat(baseline.value);
  if (!baselineValue) return null;
  return ((value - baselineValue) / baselineValue) * 100;
}

export function computeAllocation(balances, limit = 8) {
  if (!balances?.length) return [];

  const withValue = balances
    .filter((t) => parseFloat(t.value) > 0)
    .sort((a, b) => (parseFloat(b.value) || 0) - (parseFloat(a.value) || 0));

  const total = withValue.reduce((sum, t) => sum + (parseFloat(t.value) || 0), 0);
  if (total <= 0) return [];

  const top = withValue.slice(0, limit);
  const restValue = withValue.slice(limit).reduce((sum, t) => sum + (parseFloat(t.value) || 0), 0);

  const slices = top.map((t) => ({
    name: t.symbol || 'Unknown',
    value: parseFloat(t.value) || 0,
    percent: ((parseFloat(t.value) || 0) / total) * 100,
  }));

  if (restValue > 0) {
    slices.push({ name: 'Other', value: restValue, percent: (restValue / total) * 100 });
  }

  return slices;
}

export function computeTopMovers(balances, count = 5) {
  if (!balances?.length) return { gainers: [], losers: [] };

  const priced = balances
    .filter((t) => parseFloat(t.value) > 0 && t.priceChange24h != null)
    .map((t) => ({
      symbol: t.symbol,
      name: t.name,
      value: parseFloat(t.value) || 0,
      change24h: parseFloat(t.priceChange24h) || 0,
    }));

  const gainers = [...priced].sort((a, b) => b.change24h - a.change24h).slice(0, count);
  const losers = [...priced].sort((a, b) => a.change24h - b.change24h).slice(0, count);

  return { gainers, losers };
}

export function computePeriodChange(history, days = 7) {
  if (!history?.length) return null;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const inRange = history
    .filter((h) => new Date(h.timestamp).getTime() >= cutoff && h.value > 0)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  if (inRange.length < 2) return null;
  const first = parseFloat(inRange[0].value);
  const last = parseFloat(inRange[inRange.length - 1].value);
  if (!first) return null;
  return ((last - first) / first) * 100;
}
