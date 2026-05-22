import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getFearGreedIndex, getFearGreedColor } from '../services/fearGreedService';

export default function FearGreedPanel() {
  const { data: current = [], isLoading } = useQuery({
    queryKey: ['fear-greed-current'],
    queryFn: () => getFearGreedIndex(1),
    refetchInterval: 3600000,
    staleTime: 1800000,
    retry: 1,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['fear-greed-history'],
    queryFn: () => getFearGreedIndex(30),
    refetchInterval: 3600000,
    staleTime: 1800000,
    retry: 1,
  });

  const latest = current[0];
  const colors = latest ? getFearGreedColor(latest.value) : getFearGreedColor(50);

  const chartData = [...history]
    .reverse()
    .map((row) => ({
      date: row.timestamp
        ? new Date(row.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : '',
      value: row.value,
    }));

  if (isLoading && !latest) {
    return (
      <div
        className="rounded-2xl p-6 animate-pulse"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <div className="h-6 w-48 rounded mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
        <div className="h-32 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
      </div>
    );
  }

  if (!latest) return null;

  return (
    <div
      className="rounded-2xl p-6"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        <div className="lg:w-64 shrink-0">
          <h2 className="text-xl font-bold text-white mb-1">Fear & Greed Index</h2>
          <p className="text-xs text-gray-400 mb-4">Market sentiment · Alternative.me</p>
          <div className={`rounded-xl p-5 border ${colors.bg} ${colors.border}`}>
            <p className={`text-5xl font-bold ${colors.text}`}>{latest.value}</p>
            <p className={`text-lg font-semibold mt-1 ${colors.text}`}>
              {latest.classification || colors.label}
            </p>
            <div className="mt-4 h-2 rounded-full bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${latest.value}%`,
                  background: `linear-gradient(90deg, #ef4444 0%, #f97316 25%, #9ca3af 50%, #22c55e 75%, #10b981 100%)`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              0 = Extreme Fear · 100 = Extreme Greed
            </p>
          </div>
        </div>
        {chartData.length > 1 && (
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-400 mb-3">30-day sentiment</h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fngGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} stroke="var(--text-tertiary)" tick={{ fontSize: 10 }} width={30} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  formatter={(v) => [v, 'Index']}
                />
                <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="url(#fngGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
