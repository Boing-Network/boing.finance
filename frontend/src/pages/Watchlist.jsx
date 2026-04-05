// Watchlist Page
// Displays user's token watchlist

import React from 'react';
import { Helmet } from 'react-helmet-async';
import TokenWatchlist from '../components/TokenWatchlist';

export default function Watchlist() {
  return (
    <>
      <Helmet>
        <title>Token Watchlist | boing.finance — Track Prices</title>
        <meta name="description" content="Track your favorite tokens with real-time prices on boing.finance. Watchlist for EVM and Solana." />
      </Helmet>
      <div className="relative w-full min-w-0">
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Token Watchlist</h1>
              <p className="text-xl text-gray-300">
                Track your favorite tokens with real-time price updates
              </p>
            </div>
            <TokenWatchlist />
          </div>
        </div>
      </div>
    </>
  );
}

