import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { PageHeader, PageCard } from '../../components/PageLayout';

const ACTIVITIES = [
  { id: 1, title: 'Swapathon — Trade & Earn', type: 'campaign', date: 'Feb 1–15, 2025', description: 'Complete swaps to earn bonus points. Top 100 earn exclusive NFT.', status: 'active' },
  { id: 2, title: 'Governance Workshop', type: 'event', date: 'Feb 10, 2025 • 3pm UTC', description: 'Live session on how to create and vote on proposals.', status: 'upcoming' },
  { id: 3, title: 'Liquidity Provider Rewards', type: 'campaign', date: 'Ongoing', description: 'Earn 2x points for adding liquidity to selected pools.', status: 'active' },
  { id: 4, title: 'Community Call #12', type: 'event', date: 'Feb 20, 2025 • 4pm UTC', description: 'Monthly community call. Updates, Q&A, and roadmap discussion.', status: 'upcoming' },
];

export default function BoingActivities() {
  return (
    <>
      <Helmet>
        <title>Community Activities | boing.finance</title>
        <meta name="description" content="Community activities, campaigns, and events on boing.finance." />
      </Helmet>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <PageHeader title="Community Activities" subtitle="Campaigns, events, and activities for the Boing community." />

        <div className="space-y-6">
          {ACTIVITIES.map((a) => (
            <PageCard key={a.id} className="hover:border-purple-400/30 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">{a.type}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${a.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-cyan-500/20 text-cyan-400'}`}>{a.status}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{a.title}</h3>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{a.description}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{a.date}</p>
                </div>
                {a.status === 'active' && a.type === 'campaign' && (
                  <Link to="/swap" className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium bg-purple-500 hover:bg-purple-600 text-white transition-colors">
                    Participate
                  </Link>
                )}
              </div>
            </PageCard>
          ))}
        </div>

        <PageCard className="mt-8 text-center py-6">
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Join our Discord and Twitter for the latest activity announcements.</p>
          <div className="flex justify-center gap-4">
            <a href="https://discord.gg/7RDtQtQvBW" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 font-medium">Discord</a>
            <a href="https://twitter.com/boing_finance" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 font-medium">Twitter</a>
          </div>
        </PageCard>
      </div>
    </>
  );
}
