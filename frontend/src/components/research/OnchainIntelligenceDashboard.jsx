import React, { useMemo } from 'react';
import SmartFlowsView from './SmartFlowsView';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  computeLiquidityMigration,
  computeNarrativeSignals,
  computeSmartFlowSignals,
  generateActionableInsights,
  MULTI_CHAIN_COVERAGE,
} from '../../utils/researchIntelligence';
import { CHART_COLORS } from '../../theme/designTokens';

function InsightCard({ insight }) {
  const confidenceColor = {
    high: 'border-green-500/40 bg-green-500/5',
    medium: 'border-yellow-500/40 bg-yellow-500/5',
    low: 'border-gray-500/40 bg-gray-500/5',
  }[insight.confidence] || 'border-gray-500/40 bg-gray-500/5';

  return (
    <article className={`rounded-xl p-4 border ${confidenceColor}`}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-purple-300">{insight.category}</span>
        <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">{insight.confidence} confidence</span>
      </div>
      <h3 className="text-base font-bold text-white mb-2">{insight.title}</h3>
      <p className="text-sm text-cyan-200/90 mb-2"><span className="text-gray-500">Signal · </span>{insight.signal}</p>
      <p className="text-sm text-gray-300 mb-2"><span className="text-gray-500">Read · </span>{insight.interpretation}</p>
      <p className="text-sm text-green-300/90"><span className="text-gray-500">Action · </span>{insight.action}</p>
      <p className="text-xs text-gray-500 mt-3">Source: {insight.source}</p>
    </article>
  );
}

export default function OnchainIntelligenceDashboard({
  analytics,
  trendingTokens,
  marketData,
  fearGreed,
  cryptoNews,
  timeRange,
}) {
  const liquidityMigration = useMemo(
    () => computeLiquidityMigration(analytics?.networkStats),
    [analytics?.networkStats]
  );

  const narrativeSignals = useMemo(
    () => computeNarrativeSignals({ trendingTokens, cryptoNews, fearGreed: fearGreed?.[0] }),
    [trendingTokens, cryptoNews, fearGreed]
  );

  const smartFlows = useMemo(
    () => computeSmartFlowSignals(analytics?.topPairs, trendingTokens),
    [analytics?.topPairs, trendingTokens]
  );

  const insights = useMemo(
    () => generateActionableInsights({
      networkStats: analytics?.networkStats,
      topPairs: analytics?.topPairs,
      trendingTokens,
      fearGreed: fearGreed?.[0],
      marketData,
      liquidityMigration,
      smartFlows,
    }),
    [analytics, trendingTokens, marketData, fearGreed, liquidityMigration, smartFlows]
  );

  return (
    <div id="analytics-panel-intelligence" role="tabpanel" className="space-y-6">
      {/* Methodology strip */}
      <div className="rounded-xl p-4 border border-purple-500/30 bg-purple-500/5">
        <h3 className="text-sm font-bold text-purple-200 mb-2">How to read this dashboard</h3>
        <p className="text-sm text-gray-300">
          Each panel translates <strong className="text-white">live onchain & market data</strong> into research outputs:
          liquidity migration (where volume is routing), narrative radar (attention + sentiment),
          smart-flow proxies (high turnover pairs), and <strong className="text-white">actionable briefs</strong> with explicit trade/research decisions.
          Period: <span className="text-cyan-400">{timeRange === 'all' ? 'All time' : timeRange}</span>.
        </p>
      </div>

      {/* Actionable case studies */}
      <section>
        <h2 className="text-xl font-bold text-white mb-1">Actionable research briefs</h2>
        <p className="text-sm text-gray-400 mb-4">Case-study format: signal → interpretation → decision (from current data)</p>
        {insights.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm py-8 text-center rounded-xl border border-gray-700">
            Briefs populate when market and DEX data loads — try Refresh or switch time range.
          </p>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liquidity migration */}
        <section
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <h2 className="text-lg font-bold text-white mb-1">Liquidity migration</h2>
          <p className="text-xs text-gray-400 mb-4">DEX volume share by ecosystem · routing & bridge-flow proxy</p>
          {liquidityMigration.flows.length > 0 ? (
            <>
              {liquidityMigration.signal && (
                <div className="mb-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                  <p className="text-sm font-medium text-cyan-200">{liquidityMigration.signal.headline}</p>
                  <p className="text-xs text-gray-400 mt-1">{liquidityMigration.signal.detail}</p>
                </div>
              )}
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={liquidityMigration.flows} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis type="number" unit="%" stroke="var(--text-tertiary)" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="label" width={72} stroke="var(--text-tertiary)" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                    formatter={(v, name) => (name === 'share' ? [`${v.toFixed(1)}%`, 'Volume share'] : [v, name])}
                  />
                  <Bar dataKey="share" radius={[0, 4, 4, 0]}>
                    {liquidityMigration.flows.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : (
            <p className="text-gray-500 text-sm py-6 text-center">Network volume data loading from DEX indexers…</p>
          )}
        </section>

        {/* Narrative radar */}
        <section
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <h2 className="text-lg font-bold text-white mb-1">Narrative radar</h2>
          <p className="text-xs text-gray-400 mb-4">Trending tokens, sentiment & headlines · early attention signals</p>
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {narrativeSignals.narratives.length > 0 ? (
              narrativeSignals.narratives.map((n, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/60 border border-gray-700">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-purple-300">{Math.round(n.strength)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{n.tag}</p>
                    <p className="text-xs text-gray-400 line-clamp-2">{n.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{n.type} · {n.source}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm py-6 text-center">Narrative signals appear with trending & news data.</p>
            )}
          </div>
        </section>
      </div>

      {/* Smart flow signals */}
      <section
        className="rounded-2xl p-5"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <h2 className="text-lg font-bold text-white mb-1">Smart-flow proxies</h2>
        <p className="text-xs text-gray-400 mb-4">
          Pairs with high vol/liquidity or narrative overlap · behavioral pattern for informed-flow research
        </p>
        {smartFlows.length > 0 ? (
          <SmartFlowsView rows={smartFlows} />
        ) : (
          <p className="text-gray-500 text-sm py-4">Smart-flow table fills when top pair volume data is available.</p>
        )}
      </section>

      {/* Multi-chain matrix */}
      <section
        className="rounded-2xl p-5"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <h2 className="text-lg font-bold text-white mb-1">Multi-chain coverage matrix</h2>
        <p className="text-xs text-gray-400 mb-4">Solana, Base, L2s, L1 & native Boing · perps-relevant ecosystems highlighted</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MULTI_CHAIN_COVERAGE.map((chain) => (
            <div key={chain.id} className="p-3 rounded-xl bg-gray-800/50 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white">{chain.label}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">{chain.status}</span>
              </div>
              <p className="text-xs text-cyan-400 mb-2">{chain.layer}</p>
              <div className="flex flex-wrap gap-1">
                {chain.domains.map((d) => (
                  <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-300">{d}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
