// Activity insights — aggregate trading activity for dashboards

const TYPE_LABELS = {
  swap: 'Swaps',
  liquidity: 'Liquidity',
  bridge: 'Bridge',
  other: 'Other',
};

export function filterByTimeRange(transactions, range) {
  if (!transactions?.length || range === 'all') return transactions || [];
  const windows = { '7d': 7, '30d': 30, '90d': 90 };
  const days = windows[range];
  if (!days) return transactions;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return transactions.filter((tx) => {
    const ts = new Date(tx.timestamp || 0).getTime();
    return !Number.isNaN(ts) && ts >= cutoff;
  });
}

export function computeActivityStats(transactions) {
  const list = transactions || [];
  const byType = { swap: 0, liquidity: 0, bridge: 0, other: 0 };
  const byChain = {};
  let lastActivity = null;

  list.forEach((tx) => {
    const type = byType[tx.type] !== undefined ? tx.type : 'other';
    byType[type] = (byType[type] || 0) + 1;
    const chain = tx.chainId ?? 'unknown';
    byChain[chain] = (byChain[chain] || 0) + 1;
    const ts = new Date(tx.timestamp || 0);
    if (!Number.isNaN(ts.getTime()) && (!lastActivity || ts > lastActivity)) {
      lastActivity = ts;
    }
  });

  const mostActiveChain = Object.entries(byChain).sort((a, b) => b[1] - a[1])[0];

  return {
    total: list.length,
    byType,
    byChain,
    typeBreakdown: Object.entries(byType)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({ name: TYPE_LABELS[type] || type, type, count })),
    mostActiveChain: mostActiveChain
      ? { chainId: mostActiveChain[0], count: mostActiveChain[1] }
      : null,
    lastActivity,
  };
}

export function computeDailyActivity(transactions, days = 14) {
  const buckets = {};
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = { date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count: 0, key };
  }

  (transactions || []).forEach((tx) => {
    const ts = new Date(tx.timestamp || 0);
    if (Number.isNaN(ts.getTime())) return;
    const key = ts.toISOString().slice(0, 10);
    if (buckets[key]) buckets[key].count += 1;
  });

  return Object.values(buckets);
}

export function formatActivityExportRow(tx) {
  return {
    Type: tx.type || 'other',
    Label: tx.from && tx.to ? `${tx.from} → ${tx.to}` : tx.action || tx.type || '',
    Amount: tx.amount || '',
    Chain: tx.chainId ?? '',
    Timestamp: tx.timestamp ? new Date(tx.timestamp).toISOString() : '',
    'Tx Hash': tx.txHash || '',
  };
}
