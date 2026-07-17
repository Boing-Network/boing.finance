import React from 'react';
import { Helmet } from 'react-helmet-async';
import { PageHeader, PageCard } from '../../components/PageLayout';

const MILESTONES = [
  { phase: 'Phase 1', title: 'Token Launch & DAO Formation', status: 'planned', date: 'Q4 2024', items: ['BOING token launch', 'Initial governance parameters', 'Snapshot integration'] },
  { phase: 'Phase 2', title: 'Governance Activation', status: 'planned', date: 'Q1 2025', items: ['On-chain voting', 'Proposal creation', 'Treasury multisig'] },
  { phase: 'Phase 3', title: 'Community Expansion', status: 'planned', date: 'Q2 2025', items: ['Grants program launch', 'Ambassador program', 'Governance workshops'] },
  { phase: 'Phase 4', title: 'Advanced Governance', status: 'planned', date: 'Q3 2025', items: ['Delegation system', 'Cross-chain governance', 'Quadratic voting'] },
];

export default function GovernanceRoadmap() {
  return (
    <>
      <Helmet>
        <title>Governance Roadmap | boing.finance — DAO Milestones</title>
        <meta name="description" content="Governance roadmap and milestones for the boing.finance DAO." />
      </Helmet>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <PageHeader title="Governance Roadmap" subtitle="Illustrative path toward decentralized governance — not a live milestone tracker." />

        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-900/20 px-4 py-3 text-sm text-amber-100">
          <strong>Planned / illustrative:</strong> Phases below are planning labels. On-chain Governor milestones are not marked complete until contracts ship.
        </div>

        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-cyan-500/30" />
          <div className="space-y-8">
            {MILESTONES.map((m) => (
              <div key={m.phase} className="relative pl-14">
                <div
                  className="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  {m.phase.slice(-1)}
                </div>
                <PageCard>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400">{m.phase}</span>
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{m.date}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400">{m.status}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{m.title}</h3>
                  <ul className="space-y-1">
                    {m.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span className="text-cyan-400">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </PageCard>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
