// Watchlist Page — track tokens you care about

import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import TokenWatchlist from '../components/TokenWatchlist';
import LiveMarketPulse from '../components/LiveMarketPulse';
import ResearchBriefBanner from '../components/research/ResearchBriefBanner';

export default function Watchlist() {
  return (
    <>
      <Helmet>
        <title>Watchlist | boing.finance</title>
        <meta name="description" content="Track tokens you care about — prices and 24h change across chains." />
      </Helmet>
      <div className="relative w-full min-w-0">
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Watchlist</h1>
              <p className="text-sm sm:text-base text-gray-400">
                Track tokens you care about — prices and 24h change
              </p>
            </div>

            <ResearchBriefBanner page="watchlist" compact />

            <LiveMarketPulse />

            <TokenWatchlist />

            <p className="mt-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Related:{' '}
              <Link to="/analytics" className="text-cyan-400 hover:text-cyan-300">Analytics</Link>
              {' · '}
              <Link to="/activity" className="text-cyan-400 hover:text-cyan-300">Activity</Link>
              {' · '}
              <Link to="/portfolio" className="text-cyan-400 hover:text-cyan-300">Portfolio</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
