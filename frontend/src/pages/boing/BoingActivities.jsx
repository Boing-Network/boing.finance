import React from 'react';
import { Helmet } from 'react-helmet-async';
import { PageHeader, PageCard } from '../../components/PageLayout';
import EmptyState from '../../components/EmptyState';

export default function BoingActivities() {
  return (
    <>
      <Helmet>
        <title>Community Activities | boing.finance — Events & Campaigns</title>
        <meta name="description" content="Community activities, campaigns, and events. Get involved with boing.finance." />
      </Helmet>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <PageHeader title="Community Activities" subtitle="Campaigns and events for the Boing community — announced when live." />

        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-900/20 px-4 py-3 text-sm text-amber-100">
          <strong>No live campaigns right now:</strong> Past sample Swapathon and workshop listings were removed so they are not mistaken for active reward programs.
        </div>

        <EmptyState
          variant="activity"
          title="No active campaigns"
          description="When campaigns or community calls go live, they will appear here. Follow Discord and Twitter for announcements."
          actionHref="https://discord.gg/7RDtQtQvBW"
          actionLabel="Join Discord"
          secondaryHref="https://twitter.com/boing_finance"
          secondaryLabel="Follow on X"
        />

        <PageCard className="mt-8 text-center py-6">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Have an idea for a community event? Reach out via Contact Us or Discord.
          </p>
        </PageCard>
      </div>
    </>
  );
}
