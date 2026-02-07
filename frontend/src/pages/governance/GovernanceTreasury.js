import React from 'react';
import { Helmet } from 'react-helmet-async';
import { PageHeader, PageCard } from '../../components/PageLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MOCK_TREASURY = {
  totalUSD: 2450000,
  allocations: [
    { name: 'Liquidity', value: 1200000, color: '#06b6d4' },
    { name: 'Grants', value: 500000, color: '#8b5cf6' },
    { name: 'Development', value: 450000, color: '#10b981' },
    { name: 'Marketing', value: 200000, color: '#f59e0b' },
    { name: 'Reserve', value: 100000, color: '#6366f1' },
  ],
  recentTransactions: [
    { id: 1, type: 'Deposit', amount: '+50,000 USDC', date: '2025-02-04', description: 'Protocol fee accumulation' },
    { id: 2, type: 'Withdrawal', amount: '-10,000 USDC', date: '2025-02-03', description: 'Grant disbursement' },
    { id: 3, type: 'Deposit', amount: '+25,000 ETH', date: '2025-02-02', description: 'Liquidity rewards' },
  ],
};

export default function GovernanceTreasury() {
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <PageCard>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Total Treasury</p>
            <p className="text-3xl font-bold text-cyan-400">${MOCK_TREASURY.totalUSD.toLocaleString()}</p>
          </PageCard>
          <PageCard>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Multisig Signers</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>3/5</p>
          </PageCard>
          <PageCard>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Last Updated</p>
            <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Feb 4, 2025</p>
          </PageCard>
        </div>

        <PageCard className="mb-8">
          <h3 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Allocation Breakdown</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={MOCK_TREASURY.allocations} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9CA3AF" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" stroke="#9CA3AF" width={70} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} formatter={(v) => [`$${v.toLocaleString()}`, '']} />
              <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </PageCard>

        <PageCard>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Transactions</h3>
          <div className="space-y-3">
            {MOCK_TREASURY.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: 'var(--border-color)' }}>
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{tx.description}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{tx.date}</p>
                </div>
                <span className={tx.type === 'Deposit' ? 'text-green-400' : 'text-red-400'}>{tx.amount}</span>
              </div>
            ))}
          </div>
        </PageCard>
      </div>
    </>
  );
}
