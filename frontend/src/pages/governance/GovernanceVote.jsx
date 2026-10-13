import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { PageHeader, PageCard } from '../../components/PageLayout';
import { useWalletConnection } from '../../hooks/useWalletConnection';
import { useNetwork } from '../../hooks/useNetwork';
import { createProposal } from '../../services/governanceApi';

export default function GovernanceVote() {
  const { account, connectWallet } = useWalletConnection();
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
        <title>Create a proposal | boing.finance</title>
        <meta name="description" content="Submit a community proposal for signaling on boing.finance." />
      </Helmet>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <PageHeader
          title="Create a proposal"
          subtitle="Share an idea for community signaling — not on-chain voting yet."
        />

        <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Submissions go to the governance API for review. No BOING balance check today.{' '}
          <Link to="/governance/learn" className="text-cyan-400 hover:text-cyan-300">
            How it works
          </Link>
          {' · '}
          <Link to="/governance/proposals" className="text-cyan-400 hover:text-cyan-300">
            Proposals
          </Link>
        </p>

        {account ? (
          <PageCard>
            {submitted ? (
              <div className="text-center py-8">
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Proposal submitted</h3>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                  It will show in Proposals after review.
                </p>
                <Link to="/governance/proposals" className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-medium">
                  View proposals
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="governance-proposal-title" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Title
                  </label>
                  <input
                    id="governance-proposal-title"
                    name="title"
                    type="text"
                    autoComplete="off"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Add support for a new network"
                    required
                    className="w-full px-4 py-3 rounded-lg border bg-gray-800/50"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label htmlFor="governance-proposal-description" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Description
                  </label>
                  <textarea
                    id="governance-proposal-description"
                    name="description"
                    autoComplete="off"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What should the community consider?"
                    required
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg border bg-gray-800/50 resize-none"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
                {error && <p className="text-amber-400 text-sm">{error}</p>}
                <details className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <summary className="cursor-pointer">Planned rules</summary>
                  <p className="mt-2">
                    Future versions may require holding BOING to create proposals. Not enforced in this form yet.
                  </p>
                </details>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg font-medium bg-cyan-500 hover:bg-cyan-600 text-white transition-colors disabled:opacity-50"
                >
                  {loading ? 'Submitting…' : 'Submit proposal'}
                </button>
              </form>
            )}
          </PageCard>
        ) : (
          <PageCard className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Connect wallet to submit</h3>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Connect your wallet, then write a short title and description.
            </p>
            <button
              type="button"
              onClick={() => connectWallet?.()}
              className="px-4 py-2 rounded-lg font-medium bg-cyan-500 hover:bg-cyan-600 text-white transition-colors"
            >
              Connect wallet
            </button>
          </PageCard>
        )}
      </div>
    </>
  );
}
