import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { PageHeader, PageCard } from '../../components/PageLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getTreasury } from '../../services/governanceApi';
import { useNetwork } from '../../hooks/useNetwork';

const FALLBACK_ALLOCATIONS = [
  { name: 'Liquidity', value: 0, color: '#06b6d4' },
  { name: 'Grants', value: 0, color: '#8b5cf6' },
  { name: 'Development', value: 0, color: '#10b981' },
  { name: 'Marketing', value: 0, color: '#f59e0b' },
  { name: 'Reserve', value: 0, color: '#6366f1' },
];

export default function GovernanceTreasury() {
  const { chainId } = useNetwork();
  const [data, setData] = useState({ totalUsd: '0', allocations: FALLBACK_ALLOCATIONS, multisigSigners: null, timestamp: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getTreasury(chainId || 1)
      .then((d) => {
        if (cancelled) return;
        const allocs = Array.isArray(d.allocations) && d.allocations.length
          ? d.allocations.map((a) => ({ name: a.name || a.label || 'Other', value: Number(a.value || 0), color: a.color || '#06b6d4' }))
          : FALLBACK_ALLOCATIONS;
        setData({ totalUsd: d.totalUsd || '0', allocations: allocs, multisigSigners: d.multisigSigners, timestamp: d.timestamp });
      })
      .catch((e) => { if (!cancelled) { setError(e.message); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [chainId]);
  return (
    <>
      <Helmet>
        <title>DAO Treasury | boing.finance</title>
        <meta name="description" content="View the boing.finance DAO treasury balance and allocations." />
      </Helmet>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <PageHeader
          title="DAO Treasury"
          subtitle="Transparent view of protocol treasury, allocations, and recent transactions."
        />

        {error && <p className="text-amber-400 text-sm mb-4">API: {error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <PageCard>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Total Treasury</p>
            {loading ? <p className="text-3xl font-bold text-cyan-400">…</p> : <p className="text-3xl font-bold text-cyan-400">${Number(data.totalUsd || 0).toLocaleString()}</p>}
          </PageCard>
          <PageCard>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Multisig Signers</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{data.multisigSigners || '—'}</p>
          </PageCard>
          <PageCard>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Last Updated</p>
            <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{data.timestamp ? new Date(data.timestamp).toLocaleDateString() : '—'}</p>
          </PageCard>
        </div>

        <PageCard className="mb-8">
          <h3 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Allocation Breakdown</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.allocations} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9CA3AF" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" stroke="#9CA3AF" width={70} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} formatter={(v) => [`$${v.toLocaleString()}`, '']} />
              <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </PageCard>

        <PageCard>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Transactions</h3>
          <div className="space-y-3">
            {data.recentTransactions?.length ? (
              data.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: 'var(--border-color)' }}>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{tx.description || tx.type}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{tx.date || tx.timestamp}</p>
                  </div>
                  <span className={tx.type === 'Deposit' ? 'text-green-400' : 'text-red-400'}>{tx.amount}</span>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>No recent transactions. Treasury data is populated when available.</p>
            )}
          </div>
        </PageCard>
      </div>
    </>
  );
}
