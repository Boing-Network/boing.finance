import React from 'react';
import { Helmet } from 'react-helmet-async';
import { PageHeader, PageCard } from '../../components/PageLayout';

const MILESTONES = [
  { phase: 'Q1 2025', title: 'Community Launch', status: 'completed', items: ['NFT Staking beta', 'Points system launch', 'Community activities'] },
  { phase: 'Q2 2025', title: 'Rewards & Engagement', status: 'current', items: ['Points redemption', 'Leaderboards', 'Seasonal campaigns'] },
  { phase: 'Q3 2025', title: 'Ecosystem Growth', status: 'upcoming', items: ['Partner integrations', 'Cross-chain NFTs', 'Ambassador program'] },
  { phase: 'Q4 2025', title: 'Advanced Features', status: 'upcoming', items: ['NFT marketplace', 'Loyalty tiers', 'Exclusive perks'] },
];

export default function BoingRoadmap() {
  return (
    <>
      <Helmet>
        <title>Boing Roadmap | boing.finance — Ecosystem & Growth</title>
        <meta name="description" content="Boing ecosystem roadmap: NFT staking, points, and community growth." />
      </Helmet>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <PageHeader title="Boing Roadmap" subtitle="Our community-focused roadmap for NFT staking, points, and ecosystem growth." />

        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-purple-500/30" />
          <div className="space-y-8">
            {MILESTONES.map((m) => (
              <div key={m.phase} className="relative pl-14">
                <div className="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    backgroundColor: m.status === 'completed' ? '#10b981' : m.status === 'current' ? '#8b5cf6' : 'var(--bg-tertiary)',
                    color: m.status === 'upcoming' ? 'var(--text-tertiary)' : '#fff',
                  }}
                >
                  {m.status === 'completed' ? '✓' : m.status === 'current' ? '•' : '○'}
                </div>
                <PageCard className="border-l-4" style={{ borderLeftColor: m.status === 'current' ? '#8b5cf6' : 'transparent' }}>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">{m.phase}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${m.status === 'completed' ? 'bg-green-500/20 text-green-400' : m.status === 'current' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>{m.status}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{m.title}</h3>
                  <ul className="space-y-1">
                    {m.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span className="text-purple-400">•</span> {item}
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
