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
  resolveCoverageStatus,
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
        <span className="text-xs font-medium text-cyan-300">{insight.category}</span>
        <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">{insight.confidence} confidence</span>
      </div>
      <h3 className="text-base font-bold text-white mb-2">{insight.title}</h3>
      <p className="text-sm text-cyan-200/90 mb-2"><span className="text-gray-500">What we see · </span>{insight.signal}</p>
      <p className="text-sm text-gray-300 mb-2"><span className="text-gray-500">Why it matters · </span>{insight.interpretation}</p>
      <p className="text-sm text-green-300/90"><span className="text-gray-500">Suggested next step · </span>{insight.action}</p>
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
    <div id="analytics-panel-intelligence" role="tabpanel" aria-labelledby="tab-intelligence" className="space-y-6">
      <section>
        <h2 className="text-xl font-bold text-white mb-1">Market highlights</h2>
        <p className="text-sm text-gray-400 mb-4">
          What stands out for{' '}
          <span className="text-cyan-400">{timeRange === 'all' ? 'all time' : timeRange}</span>
          {' '}— and a simple next step
        </p>
        {insights.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm py-8 text-center rounded-xl border border-gray-700">
            Highlights appear when market data loads. Use Refresh above, or try Overview / Market.
          </p>
        )}
      </section>

      <details className="rounded-2xl border border-gray-700 overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
        <summary className="cursor-pointer px-4 sm:px-5 py-4 text-sm font-medium text-gray-200 hover:bg-gray-800/40">
          Advanced research tools
        </summary>
        <div className="px-4 sm:px-5 pb-5 space-y-6 border-t border-gray-700/80">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            <section>
              <h2 className="text-lg font-bold text-white mb-1">Where volume is going</h2>
              <p className="text-xs text-gray-400 mb-4">Share of DEX volume by network</p>
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
                <p className="text-gray-500 text-sm py-6 text-center">Network volume data loading…</p>
              )}
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-1">What&apos;s getting attention</h2>
              <p className="text-xs text-gray-400 mb-4">Trending tokens, sentiment, and headlines</p>
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {narrativeSignals.narratives.length > 0 ? (
                  narrativeSignals.narratives.map((n, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/60 border border-gray-700">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/15 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-cyan-300">{Math.round(n.strength)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{n.tag}</p>
                        <p className="text-xs text-gray-400 line-clamp-2">{n.label}</p>
                        <p className="text-xs text-gray-500 mt-1">{n.type} · {n.source}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm py-6 text-center">Attention signals appear with trending and news data.</p>
                )}
              </div>
            </section>
          </div>

          <section>
            <h2 className="text-lg font-bold text-white mb-1">Busy trading pairs</h2>
            <p className="text-xs text-gray-400 mb-4">
              Pairs with high volume relative to liquidity — useful for deeper research
            </p>
            {smartFlows.length > 0 ? (
              <SmartFlowsView rows={smartFlows} />
            ) : (
              <p className="text-gray-500 text-sm py-4">Pair table fills when top-pair volume data is available.</p>
            )}
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-1">Networks we cover</h2>
            <p className="text-xs text-gray-400 mb-4">Which ecosystems appear in this dashboard</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {MULTI_CHAIN_COVERAGE.map((chain) => {
                const status = resolveCoverageStatus(chain.id, analytics?.networkStats);
                const statusClass =
                  status === 'live'
                    ? 'bg-green-500/20 text-green-400'
                    : status === 'partial'
                      ? 'bg-yellow-500/20 text-yellow-300'
                      : 'bg-gray-600/40 text-gray-400';
                const statusLabel = status === 'live' ? 'active' : status === 'partial' ? 'partial' : 'pending';
                return (
                  <div key={chain.id} className="p-3 rounded-xl bg-gray-800/50 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">{chain.label}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${statusClass}`}>{statusLabel}</span>
                    </div>
                    <p className="text-xs text-cyan-400 mb-2">{chain.layer}</p>
                    <div className="flex flex-wrap gap-1">
                      {chain.domains.map((d) => (
                        <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-300">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </details>
    </div>
  );
}
