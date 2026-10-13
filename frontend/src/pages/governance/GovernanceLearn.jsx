import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { PageHeader, PageCard } from '../../components/PageLayout';

const TODAY = [
  {
    title: 'What works today',
    content:
      'You can browse proposals and signal For/Against on the Proposals page. That updates an API registry — on-chain Governor voting is not live yet.',
  },
  {
    title: 'Create a proposal',
    content:
      'Use Create a proposal to submit a title and description to the same registry. No BOING balance threshold is enforced in the app today.',
  },
];

const PLANNED = [
  {
    title: 'Planned: voting power',
    content:
      'When on-chain governance ships, voting power is expected to follow BOING balance, with a proposal threshold and quorum. Exact numbers will be published then.',
  },
  {
    title: 'Planned: treasury execution',
    content:
      'Treasury spending from successful proposals is expected to use a timelock and elected signers. Until then, treasury figures are informational.',
  },
];

export default function GovernanceLearn() {
  return (
    <>
      <Helmet>
        <title>How Governance Works | boing.finance</title>
        <meta
          name="description"
          content="What governance works today on boing.finance (signaling) vs planned on-chain voting."
        />
      </Helmet>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <PageHeader
          title="How governance works"
          subtitle="What you can do today — and what is still planned."
        />

        <div className="space-y-6 mb-6">
          {TODAY.map((s) => (
            <PageCard key={s.title}>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {s.content}
              </p>
            </PageCard>
          ))}
        </div>

        <details className="mb-8 rounded-xl border px-4 py-3" style={{ borderColor: 'var(--border-color)' }}>
          <summary className="cursor-pointer text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Planned rules (not live yet)
          </summary>
          <div className="space-y-4 mt-4">
            {PLANNED.map((s) => (
              <div key={s.title}>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {s.content}
                </p>
              </div>
            ))}
          </div>
        </details>

        <div className="flex flex-wrap gap-3 items-center">
          <Link
            to="/governance/proposals"
            className="px-4 py-2 rounded-lg font-medium bg-cyan-500 hover:bg-cyan-600 text-white transition-colors"
          >
            View proposals
          </Link>
          <Link
            to="/governance/vote"
            className="text-sm underline"
            style={{ color: 'var(--finance-primary)' }}
          >
            Create a proposal
          </Link>
        </div>
      </div>
    </>
  );
}
