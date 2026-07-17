import React from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { NETWORKS } from '../config/networks';
import { CHART_COLORS } from '../theme/designTokens';

/**
 * Lazy-loaded Activity charts (Recharts).
 */
export default function ActivityCharts({ dailyChart, typeBreakdown, mostActiveChain }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <div className="lg:col-span-2 rounded-2xl p-5 bg-gray-800 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Activity (14 days)</h2>
        <div aria-label="Daily activity bar chart">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
              <YAxis stroke="#9CA3AF" allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F9FAFB' }}
              />
              <Bar dataKey="count" fill="#06B6D4" name="Transactions" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-2xl p-5 bg-gray-800 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">By type</h2>
        {typeBreakdown.length > 0 ? (
          <div aria-label="Activity by type pie chart">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={typeBreakdown}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {typeBreakdown.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-8">No breakdown yet</p>
        )}
        {mostActiveChain && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            Most active: {NETWORKS[mostActiveChain.chainId]?.name || `Chain ${mostActiveChain.chainId}`} (
            {mostActiveChain.count})
          </p>
        )}
      </div>
    </div>
  );
}
