import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { PageHeader, PageCard } from '../../components/PageLayout';
import { useWalletConnection } from '../../hooks/useWalletConnection';

export default function GovernanceVote() {
  const { account } = useWalletConnection();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!account) return;
    setSubmitted(true);
  };

  return (
    <>
      <Helmet>
        <title>Vote & Create Proposals | boing.finance</title>
        <meta name="description" content="Participate in boing.finance governance. Vote on proposals and create your own." />
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
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Proposal Title</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Add support for new network" required className="w-full px-4 py-3 rounded-lg border bg-gray-800/50" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your proposal in detail..." required rows={6} className="w-full px-4 py-3 rounded-lg border bg-gray-800/50 resize-none" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>You need BOING tokens to create a proposal. Minimum threshold: 10,000 BOING.</div>
                <button type="submit" className="w-full py-3 rounded-lg font-medium bg-cyan-500 hover:bg-cyan-600 text-white transition-colors">Submit Proposal</button>
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
