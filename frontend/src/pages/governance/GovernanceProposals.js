import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { PageHeader, PageCard } from '../../components/PageLayout';
import { useWalletConnection } from '../../hooks/useWalletConnection';

const MOCK_PROPOSALS = [
  { id: 1, title: 'Increase protocol fee to 0.05%', status: 'active', votesFor: 125000, votesAgainst: 32000, endDate: '2025-02-15', description: 'Proposal to raise protocol fee from 0.03% to 0.05% to fund treasury growth.' },
  { id: 2, title: 'Add Base network support', status: 'passed', votesFor: 89200, votesAgainst: 12000, endDate: '2025-02-10', description: 'Deploy boing.finance infrastructure on Base network.' },
  { id: 3, title: 'Treasury allocation for grants', status: 'rejected', votesFor: 45000, votesAgainst: 78000, endDate: '2025-02-08', description: 'Allocate 50,000 USDC from treasury for community grants program.' },
  { id: 4, title: 'Governance parameter update', status: 'active', votesFor: 23000, votesAgainst: 8000, endDate: '2025-02-18', description: 'Reduce quorum threshold from 10% to 5% for faster decision-making.' },
];

const statusColors = { active: 'bg-green-500/20 text-green-400', passed: 'bg-blue-500/20 text-blue-400', rejected: 'bg-red-500/20 text-red-400' };

export default function GovernanceProposals() {
  const { account } = useWalletConnection();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? MOCK_PROPOSALS : MOCK_PROPOSALS.filter((p) => p.status === filter);

  return (
    <>
      <Helmet>
        <title>Governance Proposals | boing.finance</title>
        <meta name="description" content="View and vote on boing.finance governance proposals." />
      </Helmet>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <PageHeader
          title="Governance Proposals"
          subtitle="View active proposals, vote with your BOING tokens, and shape the future of boing.finance."
        >
          {account && (
            <Link to="/governance/vote" className="px-4 py-2 rounded-lg font-medium bg-cyan-500 hover:bg-cyan-600 text-white transition-colors">
              Create Proposal
            </Link>
          )}
        </PageHeader>

        <div className="flex gap-2 mb-6">
          {['all', 'active', 'passed', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/30' : 'border border-transparent hover:bg-gray-700/50'}`}
              style={{ color: filter === f ? undefined : 'var(--text-secondary)' }}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map((p) => (
            <PageCard key={p.id} className="hover:border-cyan-400/30 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{p.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status]}`}>{p.status}</span>
                  </div>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{p.description}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Ends: {p.endDate}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-400">For: {p.votesFor.toLocaleString()}</span>
                    <span className="text-red-400">Against: {p.votesAgainst.toLocaleString()}</span>
                  </div>
                  {p.status === 'active' && account && (
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30">Vote For</button>
                      <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30">Vote Against</button>
                    </div>
                  )}
                </div>
              </div>
            </PageCard>
          ))}
        </div>

        {!account && (
          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-tertiary)' }}>
            Connect your wallet to vote on proposals and create new ones.
          </p>
        )}
      </div>
    </>
  );
}
