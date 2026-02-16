import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { PageHeader, PageCard } from '../../components/PageLayout';
import { useWalletConnection } from '../../hooks/useWalletConnection';
import { useNetwork } from '../../hooks/useNetwork';
import { createProposal } from '../../services/governanceApi';

export default function GovernanceVote() {
  const { account } = useWalletConnection();
  const { chainId } = useNetwork();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) return;
    setLoading(true);
    setError(null);
    try {
      await createProposal({ chainId: chainId || 1, title, description, createdBy: account, status: 'pending' });
      setSubmitted(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Governance Vote | boing.finance — Proposals & DAO</title>
        <meta name="description" content="Vote on proposals and create your own. Participate in boing.finance DAO governance." />
      </Helmet>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <PageHeader title="Governance Vote" subtitle="Create proposals and vote using your BOING tokens. Your voice shapes the protocol." />

        <div className="flex gap-4 mb-8">
          <Link to="/governance/proposals" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">← Back to Proposals</Link>
          <Link to="/governance/learn" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">How it works</Link>
        </div>

        {account ? (
          <PageCard>
            {submitted ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Proposal Submitted</h3>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Your proposal has been submitted for review. It will appear in the proposals list after verification.</p>
                <Link to="/governance/proposals" className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-medium">View Proposals</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="governance-proposal-title" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Proposal Title</label>
                  <input id="governance-proposal-title" name="title" type="text" autoComplete="off" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Add support for new network" required className="w-full px-4 py-3 rounded-lg border bg-gray-800/50" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label htmlFor="governance-proposal-description" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Description</label>
                  <textarea id="governance-proposal-description" name="description" autoComplete="off" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your proposal in detail..." required rows={6} className="w-full px-4 py-3 rounded-lg border bg-gray-800/50 resize-none" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                {error && <p className="text-amber-400 text-sm">{error}</p>}
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>You need BOING tokens to create a proposal. Minimum threshold: 10,000 BOING.</div>
                <button type="submit" disabled={loading} className="w-full py-3 rounded-lg font-medium bg-cyan-500 hover:bg-cyan-600 text-white transition-colors disabled:opacity-50">Submit Proposal</button>
              </form>
            )}
          </PageCard>
        ) : (
          <PageCard className="text-center py-12">
            <div className="text-5xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Connect Wallet to Vote</h3>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>Connect your wallet to create proposals and vote on governance decisions. Your BOING token balance determines your voting power.</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Use the Connect Wallet button in the navigation bar.</p>
          </PageCard>
        )}
      </div>
    </>
  );
}
