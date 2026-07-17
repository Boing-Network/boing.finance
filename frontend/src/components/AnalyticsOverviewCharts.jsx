import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartSkeleton } from './SkeletonLoader';
import { downloadCSV } from '../utils/exportData';
import { getRangeLabel } from '../utils/analyticsTimeRange';
import { CHART_COLORS } from '../theme/designTokens';
import toast from 'react-hot-toast';

/**
 * Lazy-loaded Overview charts (Recharts) for Analytics.
 */
export default function AnalyticsOverviewCharts({
  timeRange,
  generateTimeSeriesData,
  volumeChartSource,
  geckoTerminalVolume,
  volumeLoading,
  analytics,
}) {
  const queryClient = useQueryClient();
  const networkEntries = Object.entries(analytics?.networkStats || {});
  const hasNetworkStats = networkEntries.length > 0;
  const byType = analytics?.userActivity?.byType || {};

  return (
    <div className="space-y-6">
      {/* Volume Chart */}
      <div className="card rounded-2xl shadow-xl p-6">
        <div className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h2 className="text-2xl font-bold text-white">Volume Over Time ({getRangeLabel(timeRange)})</h2>
            {generateTimeSeriesData.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const rows = generateTimeSeriesData.map(({ time, volume, timestamp }) => ({
                    Time: time,
                    'Volume (USD)': Math.round(volume),
                    Timestamp: timestamp ? new Date(timestamp).toISOString() : '',
                  }));
                  downloadCSV(rows, `volume-chart-${timeRange}-${new Date().toISOString().split('T')[0]}`);
                  toast.success('Volume chart exported as CSV');
                }}
                className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Export CSV
              </button>
            )}
          </div>
          {generateTimeSeriesData.length > 0 && volumeChartSource && (
            <div
              className={`${
                volumeChartSource === 'defillama'
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-blue-500/10 border-blue-500/30'
              } rounded-lg p-3 mb-4 border`}
            >
              <p
                className={`text-sm ${
                  volumeChartSource === 'defillama' ? 'text-green-300' : 'text-blue-300'
                }`}
              >
                <span className="font-semibold">
                  {volumeChartSource === 'defillama'
                    ? 'DefiLlama (DEX volume):'
                    : 'CoinGecko (Bitcoin volume):'}
                </span>{' '}
                {volumeChartSource === 'defillama'
                  ? 'Real aggregated DEX trading volume across chains. Source: api.llama.fi.'
                  : 'Fallback: Bitcoin trading volume from CoinGecko as market proxy.'}
                {volumeChartSource === 'defillama' && geckoTerminalVolume?.volume24h && (
                  <span className="block mt-1 text-green-200/90">
                    24h volume cross-checked with GeckoTerminal (second DEX source).
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
        {volumeLoading ? (
          <ChartSkeleton height="300px" />
        ) : generateTimeSeriesData.length > 0 ? (
          <div aria-label={`Volume over time chart for ${getRangeLabel(timeRange)}`}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={generateTimeSeriesData}
                isAnimationActive
                animationDuration={800}
                animationEasing="ease-out"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis
                  dataKey="time"
                  stroke="var(--text-tertiary)"
                  angle={timeRange === '1y' || timeRange === 'all' ? -45 : 0}
                  textAnchor={timeRange === '1y' || timeRange === 'all' ? 'end' : 'middle'}
                  height={timeRange === '1y' || timeRange === 'all' ? 80 : 30}
                />
                <YAxis
                  stroke="var(--text-tertiary)"
                  tickFormatter={(value) => {
                    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
                    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
                    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
                    return `$${(value / 1e3).toFixed(2)}K`;
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                  formatter={(value) =>
                    `$${parseFloat(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                  }
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="var(--accent-cyan)"
                  fill="var(--accent-cyan)"
                  fillOpacity={0.3}
                  name="Volume (USD)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center gap-3 text-center px-4">
            <p className="text-gray-400">Volume data not available for this time range.</p>
            <p className="text-gray-500 text-sm">
              We use DefiLlama (DEX volume) and CoinGecko as fallback. Try another range or refresh.
            </p>
            <button
              type="button"
              onClick={async () => {
                await queryClient.invalidateQueries({ queryKey: ['defillama-dex-volume'] });
                await queryClient.invalidateQueries({ queryKey: ['historical-volume'] });
                toast.success('Refreshing...');
              }}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Try refreshing
            </button>
          </div>
        )}
      </div>

      {/* Network Performance */}
      <div className="card rounded-2xl shadow-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-white">Network Performance</h2>
          {hasNetworkStats && (
            <button
              type="button"
              onClick={() => {
                const rows = networkEntries.map(([network, stats]) => ({
                  Network: network,
                  'Volume (USD)': parseFloat(stats.volume || 0).toLocaleString(),
                  Users: stats.users || 0,
                  Pools: stats.pools || 0,
                }));
                downloadCSV(rows, `network-performance-${new Date().toISOString().split('T')[0]}`);
                toast.success('Network Performance exported as CSV!');
              }}
              className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
            >
              Export CSV
            </button>
          )}
        </div>
        {hasNetworkStats ? (
          <>
            <div className="mb-6" aria-label="Network performance bar chart">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={networkEntries.map(([network, stats]) => ({
                    network,
                    volume: parseFloat(stats.volume || 0),
                    users: stats.users || 0,
                    pools: stats.pools || 0,
                  }))}
                  isAnimationActive
                  animationDuration={600}
                  animationEasing="ease-out"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="network" stroke="var(--text-tertiary)" />
                  <YAxis stroke="var(--text-tertiary)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Legend />
                  <Bar dataKey="volume" fill="var(--accent-cyan)" name="Volume (USD)" />
                  <Bar dataKey="pools" fill="var(--success-color)" name="Pools" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {networkEntries.map(([network, stats]) => (
                <div key={network} className="bg-gray-700 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">{network}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Volume:</span>
                      <span className="text-white">${parseFloat(stats.volume || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Users:</span>
                      <span className="text-white">{stats.users ? stats.users.toLocaleString() : '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Pools:</span>
                      <span className="text-white">{stats.pools ? stats.pools.toLocaleString() : '0'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="bg-gray-700/50 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-gray-300 mb-2">Network Performance Data Unavailable</p>
              <p className="text-sm text-gray-400 mb-4">
                {analytics && Object.keys(analytics).length > 0
                  ? 'Network statistics are being fetched from the backend. If this persists, the backend may not have collected data yet.'
                  : 'Network-specific statistics require backend API integration.'}
              </p>
              <p className="text-xs text-gray-500">Data source: GeckoTerminal, DefiLlama, CoinGecko</p>
            </div>
          </div>
        )}
      </div>

      {hasNetworkStats && (
        <div
          className="rounded-2xl shadow-xl p-6"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <h2 className="text-2xl font-bold text-white mb-6">Network Distribution</h2>
          <div aria-label="Network volume distribution pie chart">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart isAnimationActive animationDuration={600} animationEasing="ease-out">
                <Pie
                  data={networkEntries.map(([network, stats]) => ({
                    name: network,
                    value: parseFloat(stats.volume || 0),
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="var(--accent-cyan)"
                  dataKey="value"
                >
                  {networkEntries.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* User Activity */}
      <div className="card rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6">User Activity</h2>
        {analytics?.userActivity && (analytics.userActivity?.totalActions ?? 0) > 0 ? (
          <>
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-700 rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-1">Total Actions</p>
                  <p className="text-3xl font-bold text-white">
                    {(analytics?.userActivity?.totalActions ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-700 rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-1">Unique Users</p>
                  <p className="text-3xl font-bold text-white">
                    {(analytics?.userActivity?.uniqueUsers ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-700 rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-1">Activity Types</p>
                  <p className="text-3xl font-bold text-white">{Object.keys(byType).length}</p>
                </div>
              </div>
              {Object.keys(byType).length > 0 && (
                <div aria-label="User activity by type chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Object.entries(byType).map(([action, count]) => ({
                        action: action.replace('_', ' ').toUpperCase(),
                        count: Array.isArray(count) ? count.length : count,
                      }))}
                      isAnimationActive
                      animationDuration={600}
                      animationEasing="ease-out"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="action" stroke="var(--text-tertiary)" />
                      <YAxis stroke="var(--text-tertiary)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: 'var(--text-primary)' }}
                      />
                      <Legend />
                      <Bar dataKey="count" fill="var(--accent-purple)" name="Actions" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            {analytics?.userActivity?.recentActivity?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                <div className="space-y-2">
                  {(analytics?.userActivity?.recentActivity || []).slice(0, 10).map((activity, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <span className="text-white font-medium capitalize">
                          {activity.action?.replace('_', ' ') || 'Unknown'}
                        </span>
                        {activity.chainId && (
                          <span className="text-gray-400 text-sm ml-2">Chain: {activity.chainId}</span>
                        )}
                      </div>
                      <span className="text-gray-400 text-sm">
                        {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="bg-gray-700/50 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-gray-300 mb-2">User Activity Data Unavailable</p>
              <p className="text-sm text-gray-400 mb-4">
                {analytics && Object.keys(analytics).length > 0
                  ? 'No user activity has been tracked yet. Activity will appear once users perform actions.'
                  : 'User activity metrics require backend API integration.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
