import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { PageHeader, PageCard } from '../../components/PageLayout';
import { useWalletConnection } from '../../hooks/useWalletConnection';
import { useNetwork } from '../../hooks/useNetwork';
import { getProposals, voteOnProposal } from '../../services/governanceApi';

const statusColors = { active: 'bg-green-500/20 text-green-400', passed: 'bg-blue-500/20 text-blue-400', rejected: 'bg-red-500/20 text-red-400', pending: 'bg-amber-500/20 text-amber-400' };

export default function GovernanceProposals() {
  const { account } = useWalletConnection();
  const { chainId } = useNetwork();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [votingId, setVotingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getProposals({ chainId: chainId || undefined, status: filter === 'all' ? undefined : filter })
      .then((data) => { if (!cancelled) setProposals(Array.isArray(data) ? data : []); })
      .catch((e) => { if (!cancelled) { setError(e.message); setProposals([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [chainId, filter]);

  const handleVote = async (proposalId, support) => {
    if (!account) return;
    setVotingId(proposalId);
    try {
      await voteOnProposal(proposalId, { voter: account, support });
      const updated = proposals.map((p) =>
        p.id === proposalId
          ? {
              ...p,
              votesFor: String(BigInt(p.votesFor || '0') + (support ? 1n : 0n)),
              votesAgainst: String(BigInt(p.votesAgainst || '0') + (support ? 0n : 1n)),
            }
          : p
      );
      setProposals(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setVotingId(null);
    }
  };

  const filtered = proposals;

  return (
    <>
      <Helmet>
        <title>Governance Proposals | boing.finance — View & Vote</title>
        <meta name="description" content="View and vote on boing.finance governance proposals. Shape the future of the protocol." />
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
          {['all', 'active', 'passed', 'rejected', 'pending'].map((f) => (
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

        {error && (
          <p className="text-amber-400 text-sm mb-4">API: {error}</p>
        )}

        {loading ? (
          <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>Loading proposals…</p>
        ) : filtered.length === 0 ? (
          <PageCard>
            <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
              No proposals yet. Create the first one from the Vote page.
            </p>
          </PageCard>
        ) : (
          <div className="space-y-4">
            {filtered.map((p) => (
              <PageCard key={p.id} className="hover:border-cyan-400/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{p.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status] || 'bg-gray-500/20'}`}>{p.status}</span>
                    </div>
                    <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{p.description}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Ends: {p.endDate || '—'}</p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-400">For: {Number(p.votesFor || 0).toLocaleString()}</span>
                      <span className="text-red-400">Against: {Number(p.votesAgainst || 0).toLocaleString()}</span>
                    </div>
                    {p.status === 'active' && account && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVote(p.id, 1)}
                          disabled={votingId === p.id}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-50"
                        >
                          {votingId === p.id ? '…' : 'Vote For'}
                        </button>
                        <button
                          onClick={() => handleVote(p.id, 0)}
                          disabled={votingId === p.id}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50"
                        >
                          Vote Against
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </PageCard>
            ))}
          </div>
        )}

        {!account && (
          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-tertiary)' }}>
            Connect your wallet to vote on proposals and create new ones.
          </p>
        )}
      </div>
    </>
  );
}
