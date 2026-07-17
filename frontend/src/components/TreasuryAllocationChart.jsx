import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/** Lazy-loaded treasury allocation bar chart. */
export default function TreasuryAllocationChart({ allocations = [] }) {
  return (
    <div aria-label="Treasury allocation breakdown chart">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={allocations} layout="vertical" margin={{ left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis
            type="number"
            stroke="var(--text-tertiary)"
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <YAxis type="category" dataKey="name" stroke="var(--text-tertiary)" width={70} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
            }}
            formatter={(v) => [`$${v.toLocaleString()}`, '']}
          />
          <Bar dataKey="value" fill="var(--accent-cyan)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
