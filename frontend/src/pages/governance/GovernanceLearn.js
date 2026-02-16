import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { PageHeader, PageCard } from '../../components/PageLayout';

const SECTIONS = [
  {
    title: 'What is Governance?',
    content: 'boing.finance uses a decentralized governance model where BOING token holders can propose and vote on protocol changes. This includes parameter updates, treasury allocations, and new feature proposals.',
  },
  {
    title: 'How to Vote',
    content: 'Connect your wallet with BOING tokens to the governance portal. Your voting power is proportional to your token balance. Browse active proposals, read the details, and cast your vote (For or Against) before the voting period ends.',
  },
  {
    title: 'Creating a Proposal',
    content: 'To create a proposal, you need a minimum of 10,000 BOING tokens. Draft your proposal with a clear title and description, then submit it for community review. Proposals go through a discussion period before voting begins.',
  },
  {
    title: 'Voting Period & Quorum',
    content: 'Each proposal has a 7-day voting period. A proposal passes when it receives more For votes than Against votes, and when the total votes meet the quorum threshold (currently 5% of circulating supply).',
  },
  {
    title: 'Treasury & Execution',
    content: 'The DAO treasury holds protocol fees and reserves. Successful proposals that involve treasury spending are executed by a multisig of elected signers after a timelock period for security.',
  },
];

export default function GovernanceLearn() {
  return (
    <>
      <Helmet>
        <title>How Governance Works | boing.finance — Voting & Proposals</title>
        <meta name="description" content="Learn how boing.finance governance works: voting, proposals, quorum, and DAO structure." />
      </Helmet>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <PageHeader title="How Governance Works" subtitle="A guide to participating in boing.finance DAO governance." />

        <div className="space-y-6 mb-8">
          {SECTIONS.map((s) => (
            <PageCard key={s.title}>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{s.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s.content}</p>
            </PageCard>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          <Link to="/governance/proposals" className="px-4 py-2 rounded-lg font-medium bg-cyan-500 hover:bg-cyan-600 text-white transition-colors">View Proposals</Link>
          <Link to="/governance/vote" className="px-4 py-2 rounded-lg font-medium border hover:bg-gray-700/50 transition-colors" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>Create Proposal</Link>
          <Link to="/governance/treasury" className="px-4 py-2 rounded-lg font-medium border hover:bg-gray-700/50 transition-colors" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>View Treasury</Link>
        </div>
      </div>
    </>
  );
}
