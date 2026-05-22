// Watchlist Page — narrative surveillance & early ecosystem tracking

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
        <title>Narrative Watchlist | boing.finance — Early Ecosystem Tracking</title>
        <meta name="description" content="Track narrative momentum and early ecosystem tokens with live prices, 24h movers, and research-oriented surveillance across chains." />
      </Helmet>
      <div className="relative w-full min-w-0">
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Narrative Watchlist</h1>
              <p className="text-sm sm:text-base text-gray-400">
                Early attention signals & momentum tracking before broader market pricing
              </p>
            </div>

            <ResearchBriefBanner page="watchlist" compact />

            <LiveMarketPulse />

            <TokenWatchlist />

            <div className="flex flex-wrap gap-4 mt-6 text-sm">
              <Link to="/analytics?section=intelligence" className="text-cyan-400 hover:text-cyan-300">Onchain intelligence →</Link>
              <Link to="/activity" className="text-cyan-400 hover:text-cyan-300">Wallet flow analysis →</Link>
              <Link to="/portfolio" className="text-cyan-400 hover:text-cyan-300">Exposure intelligence →</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
