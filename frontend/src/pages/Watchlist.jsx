// Watchlist Page
// Track favorite tokens with live prices

import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import TokenWatchlist from '../components/TokenWatchlist';
import LiveMarketPulse from '../components/LiveMarketPulse';

export default function Watchlist() {
  return (
    <>
      <Helmet>
        <title>Watchlist | boing.finance — Track Token Prices</title>
        <meta name="description" content="Track your favorite tokens with live prices and 24h movers on boing.finance." />
      </Helmet>
      <div className="relative w-full min-w-0">
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Watchlist</h1>
              <p className="text-sm sm:text-base text-gray-400">
                Track tokens you care about with live prices and 24h performance
              </p>
            </div>

            <LiveMarketPulse />

            <TokenWatchlist />

            <div className="flex flex-wrap gap-4 mt-6 text-sm">
              <Link to="/analytics" className="text-cyan-400 hover:text-cyan-300">Market analytics →</Link>
              <Link to="/portfolio" className="text-cyan-400 hover:text-cyan-300">Portfolio →</Link>
              <Link to="/activity" className="text-cyan-400 hover:text-cyan-300">Trading activity →</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
