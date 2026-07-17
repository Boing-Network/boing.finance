import React from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartSkeleton } from './SkeletonLoader';
import { CHART_COLORS } from '../theme/designTokens';

/**
 * Lazy-loaded Portfolio value history + allocation charts (Recharts).
 */
export default function PortfolioCharts({ portfolioHistory7d, allocationSlices, showAllocation }) {
  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl shadow-xl p-6 border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Portfolio Value History
          </h2>
        </div>
        {portfolioHistory7d.length > 0 ? (
          <div aria-label="Portfolio value history chart">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={portfolioHistory7d}
                isAnimationActive
                animationDuration={800}
                animationEasing="ease-out"
              >
                <defs>
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="opacity-40"
                  style={{ stroke: 'var(--border-color)' }}
                />
                <XAxis dataKey="date" style={{ stroke: 'var(--text-tertiary)' }} />
                <YAxis style={{ stroke: 'var(--text-tertiary)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                  formatter={(value) => [
                    `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    'Portfolio Value',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--accent-cyan)"
                  fill="url(#portfolioGradient)"
                  name="Portfolio Value"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <ChartSkeleton height="300px" />
        )}
      </div>

      {showAllocation && allocationSlices.length > 0 && (
        <div
          className="rounded-2xl shadow-xl p-6 border"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Asset Allocation
          </h2>
          <div aria-label="Asset allocation pie chart">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={allocationSlices}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {allocationSlices.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [
                    `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
                    'Value',
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
