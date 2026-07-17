// Onchain research intelligence — synthesize live data into actionable research outputs

export const MULTI_CHAIN_COVERAGE = [
  { id: 'ethereum', label: 'Ethereum', layer: 'L1', domains: ['DeFi', 'LST', 'Perps'] },
  { id: 'base', label: 'Base', layer: 'L2', domains: ['Consumer', 'Memecoins', 'Bridge inflow'] },
  { id: 'arbitrum', label: 'Arbitrum', layer: 'L2', domains: ['Perps', 'DeFi', 'Gaming'] },
  { id: 'optimism', label: 'Optimism', layer: 'L2', domains: ['DeFi', 'Governance'] },
  { id: 'polygon', label: 'Polygon', layer: 'L2/Sidechain', domains: ['Payments', 'DeFi'] },
  { id: 'bsc', label: 'BSC', layer: 'L1', domains: ['CEX flow', 'DeFi'] },
  { id: 'solana', label: 'Solana', layer: 'L1', domains: ['Perps', 'Memecoins', 'NFTs'] },
  { id: 'boing', label: 'Boing L1', layer: 'Native', domains: ['Native AMM', 'Testnet ops'] },
];

/**
 * Derive coverage status from live networkStats (and optional Solana presence).
 * @returns {'live'|'partial'|'no data'}
 */
export function resolveCoverageStatus(chainId, networkStats) {
  if (!networkStats || typeof networkStats !== 'object') return 'no data';

  const aliases = {
    ethereum: ['ethereum', 'eth'],
    base: ['base'],
    arbitrum: ['arbitrum'],
    optimism: ['optimism'],
    polygon: ['polygon'],
    bsc: ['bsc', 'binance-smart-chain', 'bnb'],
    solana: ['solana'],
    boing: ['boing', 'boing l1', 'boing-network'],
  };

  const keys = Object.keys(networkStats);
  const matchKey = keys.find((k) => {
    const nk = String(k).toLowerCase();
    const list = aliases[chainId] || [chainId];
    return list.some((a) => nk === a || nk.includes(a));
  });

  if (!matchKey) return 'no data';
  const stats = networkStats[matchKey];
  const volume = parseFloat(stats?.volume) || 0;
  const pools = stats?.pools || 0;
  if (volume > 0 || pools > 0) return 'live';
  return 'partial';
}
const NETWORK_ALIASES = {
  ethereum: 'ethereum',
  eth: 'ethereum',
  base: 'base',
  arbitrum: 'arbitrum',
  optimism: 'optimism',
  polygon: 'polygon',
  bsc: 'bsc',
  'binance-smart-chain': 'bsc',
  solana: 'solana',
};

function normalizeNetwork(name) {
  if (!name) return 'unknown';
  return NETWORK_ALIASES[String(name).toLowerCase()] || String(name).toLowerCase();
}

export function computeLiquidityMigration(networkStats) {
  if (!networkStats || typeof networkStats !== 'object') return { flows: [], leaders: [], signal: null };

  const entries = Object.entries(networkStats)
    .map(([network, stats]) => ({
      network: normalizeNetwork(network),
      label: network,
      volume: parseFloat(stats?.volume) || 0,
      pools: stats?.pools || 0,
    }))
    .filter((e) => e.volume > 0)
    .sort((a, b) => b.volume - a.volume);

  const total = entries.reduce((s, e) => s + e.volume, 0);
  if (total <= 0) return { flows: [], leaders: [], signal: null };

  const flows = entries.map((e) => ({
    ...e,
    share: (e.volume / total) * 100,
  }));

  const l2Ids = new Set(['base', 'arbitrum', 'optimism', 'polygon']);
  const l2Share = flows.filter((f) => l2Ids.has(f.network)).reduce((s, f) => s + f.share, 0);
  const ethShare = flows.find((f) => f.network === 'ethereum')?.share || 0;

  let signal = null;
  if (l2Share >= 40) {
    signal = {
      type: 'migration',
      headline: 'L2 liquidity concentration elevated',
      detail: `${l2Share.toFixed(0)}% of tracked DEX volume sits on L2s — monitor bridge inflows and native pair depth.`,
    };
  } else if (ethShare >= 50) {
    signal = {
      type: 'concentration',
      headline: 'Ethereum-dominant flow regime',
      detail: `${ethShare.toFixed(0)}% volume on Ethereum — L1 depth likely driving large-size routing.`,
    };
  }

  return { flows, leaders: flows.slice(0, 5), signal, l2Share, ethShare };
}

export function computeNarrativeSignals({ trendingTokens = [], cryptoNews, fearGreed }) {
  const narratives = [];
  const tokens = (trendingTokens || []).slice(0, 8);

  tokens.forEach((t) => {
    const symbol = t.item?.symbol || t.symbol || '';
    const name = t.item?.name || t.name || symbol;
    const score = t.item?.score || t.item?.market_cap_rank || 0;
    if (!symbol) return;
    narratives.push({
      tag: symbol,
      label: name,
      strength: score ? Math.min(100, score) : 50,
      type: 'momentum',
      source: 'CoinGecko trending',
    });
  });

  if (fearGreed?.value != null) {
    narratives.push({
      tag: 'Sentiment',
      label: fearGreed.classification || 'Market mood',
      strength: fearGreed.value,
      type: fearGreed.value >= 55 ? 'risk-on' : fearGreed.value <= 45 ? 'risk-off' : 'neutral',
      source: 'Fear & Greed Index',
    });
  }

  (cryptoNews?.articles || []).slice(0, 4).forEach((article) => {
    if (!article?.title) return;
    narratives.push({
      tag: 'News',
      label: article.title.slice(0, 80),
      strength: 40,
      type: 'headline',
      source: article.source || 'NewsAPI',
    });
  });

  return { narratives: narratives.slice(0, 12) };
}

export function computeSmartFlowSignals(topPairs = [], trendingTokens = []) {
  const signals = [];
  const trendingSymbols = new Set(
    (trendingTokens || []).map((t) => (t.item?.symbol || t.symbol || '').toUpperCase()).filter(Boolean)
  );

  (topPairs || []).slice(0, 10).forEach((pair) => {
    const vol = parseFloat(pair.volume) || 0;
    const liq = parseFloat(pair.liquidity) || 0;
    const t0 = (pair.token0Symbol || '').toUpperCase();
    const t1 = (pair.token1Symbol || '').toUpperCase();
    const volToLiq = liq > 0 ? vol / liq : 0;

    const isTrending = trendingSymbols.has(t0) || trendingSymbols.has(t1);
    if (volToLiq > 0.5 || isTrending) {
      signals.push({
        pair: `${pair.token0Symbol}/${pair.token1Symbol}`,
        network: pair.network,
        volume: vol,
        liquidity: liq,
        volToLiq,
        isTrending,
        signal: isTrending && volToLiq > 0.3
          ? 'Narrative + flow convergence'
          : volToLiq > 0.5
            ? 'High turnover vs liquidity (smart-flow proxy)'
            : 'Trending pair activity',
      });
    }
  });

  return signals.sort((a, b) => b.volToLiq - a.volToLiq).slice(0, 8);
}

export function generateActionableInsights({
  networkStats,
  topPairs,
  trendingTokens,
  fearGreed,
  marketData,
  liquidityMigration,
  smartFlows,
}) {
  const insights = [];
  const migration = liquidityMigration || computeLiquidityMigration(networkStats);
  const flows = smartFlows || computeSmartFlowSignals(topPairs, trendingTokens);

  if (migration.signal) {
    insights.push({
      id: 'liq-migration',
      category: 'Liquidity migration',
      title: migration.signal.headline,
      signal: migration.signal.detail,
      interpretation: 'Volume share shifts often precede bridge routing changes and native DEX depth rebalancing across ecosystems.',
      action: 'Map top destination chains; watch bridge netflow and top pool reserve deltas on those networks.',
      confidence: migration.l2Share >= 45 ? 'high' : 'medium',
      source: 'GeckoTerminal / backend network stats',
    });
  }

  if (flows[0]) {
    insights.push({
      id: 'smart-flow',
      category: 'Smart money proxy',
      title: `Elevated flow on ${flows[0].pair}`,
      signal: `${flows[0].network} pair shows ${(flows[0].volToLiq * 100).toFixed(0)}% 24h vol/liquidity${flows[0].isTrending ? ' with narrative overlap' : ''}.`,
      interpretation: 'High turnover relative to pool depth can indicate informed flow or short-term momentum positioning.',
      action: 'Validate with wallet cohort behavior and follow-on liquidity adds before sizing exposure.',
      confidence: flows[0].isTrending ? 'high' : 'medium',
      source: 'DEX pair analytics',
    });
  }

  const trending = (trendingTokens || [])[0];
  if (trending) {
    const sym = trending.item?.symbol || trending.symbol;
    insights.push({
      id: 'narrative-early',
      category: 'Narrative / early activity',
      title: `${sym} leading social & market attention`,
      signal: 'Token appears in global trending — early narrative formation phase.',
      interpretation: 'Narrative-led regimes often see liquidity migrate into related pairs before broader market pricing.',
      action: 'Add to watchlist; monitor swap cadence and LP depth on primary deployment chain.',
      confidence: 'medium',
      source: 'CoinGecko trending',
    });
  }

  if (fearGreed?.value != null) {
    const risk = fearGreed.value >= 60 ? 'risk-on' : fearGreed.value <= 40 ? 'risk-off' : 'balanced';
    insights.push({
      id: 'macro-sentiment',
      category: 'Macro overlay',
      title: `Sentiment at ${fearGreed.value} (${fearGreed.classification})`,
      signal: `${risk} positioning environment for spot and perps books.`,
      interpretation: 'Extreme readings historically correlate with mean-reversion in short-horizon flow intensity.',
      action: fearGreed.value >= 75
        ? 'Tighten risk; favor hedged or delta-neutral structures.'
        : fearGreed.value <= 25
          ? 'Scan for contrarian accumulation in high-quality liquidity pools.'
          : 'Maintain baseline sizing; focus on idiosyncratic narrative alpha.',
      confidence: 'medium',
      source: 'Alternative.me Fear & Greed',
    });
  }

  const mcapChange = marketData?.data?.market_cap_change_percentage_24h_usd;
  if (mcapChange != null) {
    insights.push({
      id: 'market-regime',
      category: 'Market regime',
      title: `Global mcap ${mcapChange >= 0 ? '+' : ''}${mcapChange.toFixed(2)}% (24h)`,
      signal: mcapChange >= 0 ? 'Expansionary tape' : 'Risk-off tape',
      interpretation: 'Regime context filters which narratives sustain follow-through vs. mean-revert.',
      action: mcapChange >= 0
        ? 'Prioritize momentum narratives with rising onchain turnover.'
        : 'Prioritize liquidity quality and reduce chase exposure on low-depth pairs.',
      confidence: 'high',
      source: 'CoinGecko global',
    });
  }

  return insights.slice(0, 6);
}

export function computeBehavioralFingerprint(transactions, stats) {
  const list = transactions || [];
  if (!list.length) return null;

  const swapRatio = stats?.byType?.swap / stats?.total || 0;
  const liqRatio = stats?.byType?.liquidity / stats?.total || 0;
  const bridgeRatio = stats?.byType?.bridge / stats?.total || 0;

  const chainEntries = Object.entries(stats?.byChain || {}).sort((a, b) => b[1] - a[1]);
  const primaryChain = chainEntries[0];
  const chainConcentration = primaryChain && stats?.total
    ? (primaryChain[1] / stats.total) * 100
    : 0;

  const hourBuckets = new Array(24).fill(0);
  list.forEach((tx) => {
    const h = new Date(tx.timestamp || 0).getHours();
    if (!Number.isNaN(h)) hourBuckets[h] += 1;
  });
  const peakHour = hourBuckets.indexOf(Math.max(...hourBuckets));

  let persona = 'Balanced operator';
  if (swapRatio > 0.6) persona = 'Active trader';
  else if (liqRatio > 0.4) persona = 'Liquidity provider';
  else if (bridgeRatio > 0.3) persona = 'Cross-chain migrator';

  const patterns = [];
  if (chainConcentration >= 70) {
    patterns.push({
      label: 'Chain concentration',
      value: `${chainConcentration.toFixed(0)}% on primary chain`,
      insight: 'Wallet behavior clusters on a single ecosystem — useful for cohort tagging.',
    });
  }
  if (swapRatio > 0.5) {
    patterns.push({
      label: 'Swap-dominant flow',
      value: `${(swapRatio * 100).toFixed(0)}% swaps`,
      insight: 'High swap cadence — monitor for momentum or arb-style execution patterns.',
    });
  }
  if (bridgeRatio > 0.15) {
    patterns.push({
      label: 'Liquidity migration signal',
      value: `${(bridgeRatio * 100).toFixed(0)}% bridge txs`,
      insight: 'Cross-chain routing active — aligns with ecosystem rotation research.',
    });
  }
  patterns.push({
    label: 'Activity peak (UTC)',
    value: `${peakHour}:00`,
    insight: 'Temporal clustering helps align surveillance windows with likely execution times.',
  });

  return { persona, patterns, swapRatio, liqRatio, bridgeRatio, chainConcentration, primaryChain };
}

export function computePortfolioResearchInsights({ allocation = [], topMovers, enrichedSummary, change7d }) {
  const insights = [];
  if (allocation[0]) {
    insights.push({
      title: 'Exposure concentration',
      signal: `${allocation[0].name} = ${allocation[0].percent.toFixed(1)}% of tracked value`,
      action: allocation[0].percent > 40
        ? 'Consider hedging or diversifying if thesis is not high-conviction.'
        : 'Balanced sleeve sizing — monitor correlation during risk-off regimes.',
    });
  }
  if (topMovers?.gainers?.[0]) {
    insights.push({
      title: 'Narrative tailwind',
      signal: `${topMovers.gainers[0].symbol} +${topMovers.gainers[0].change24h.toFixed(2)}% (24h)`,
      action: 'Validate onchain turnover supports price — avoid low-liquidity chase.',
    });
  }
  if (change7d != null) {
    insights.push({
      title: '7d performance context',
      signal: `${change7d >= 0 ? '+' : ''}${change7d.toFixed(2)}% portfolio drift`,
      action: change7d > 5
        ? 'Review whether gains are narrative-driven; trim into illiquid strength if needed.'
        : 'Baseline risk budget — scan for early ecosystem entries.',
    });
  }
  if (enrichedSummary?.change24h != null) {
    insights.push({
      title: 'Daily P&L overlay',
      signal: `${enrichedSummary.change24h >= 0 ? '+' : ''}${Number(enrichedSummary.change24h).toFixed(2)}% (24h)`,
      action: 'Cross-reference with macro sentiment and primary chain flow before rebalancing.',
    });
  }
  return insights.slice(0, 4);
}

export const RESEARCH_PAGE_BRIEFS = {
  analytics: {
    eyebrow: 'Onchain intelligence · Case study dashboard',
    title: 'Multi-chain research workspace',
    description:
      'Live synthesis of liquidity migration, narrative momentum, smart-flow proxies, and macro sentiment — the same workflow used for trading research and operational crypto analysis.',
    capabilities: ['Liquidity migration', 'Narrative radar', 'Smart-flow signals', 'Actionable briefs'],
  },
  portfolio: {
    eyebrow: 'Holdings intelligence',
    title: 'Exposure & behavioral context',
    description:
      'Portfolio-level view connecting allocation, movers, and performance drift to research actions — how onchain holdings translate into risk decisions.',
    capabilities: ['Exposure map', 'Mover analysis', 'Performance overlay'],
  },
  activity: {
    eyebrow: 'Wallet flow analysis',
    title: 'Behavioral fingerprint & execution PnL',
    description:
      'Wallet activity decomposed into chain clustering, flow type ratios, swap performance, and temporal patterns — verifiable output from real transaction data.',
    capabilities: ['Behavior clustering', 'Flow ratios', 'Trading PnL', 'Cadence analysis'],
  },
  watchlist: {
    eyebrow: 'Narrative surveillance',
    title: 'Early ecosystem & momentum watch',
    description:
      'Curated token monitor for narrative tracking and price regime shifts — the front line for early activity detection before broader market pricing.',
    capabilities: ['Narrative watch', '24h movers', 'Multi-chain tokens'],
  },
};
