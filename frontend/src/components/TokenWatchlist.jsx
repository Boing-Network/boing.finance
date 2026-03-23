// Token Watchlist Component
// Displays and manages user's watched tokens

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWatchlist, removeFromWatchlist, updateWatchlistPrice } from '../utils/tokenWatchlist';
import coingeckoService from '../services/coingeckoService';
import { NETWORKS } from '../config/networks';
import toast from 'react-hot-toast';
import OptimizedImage from './OptimizedImage';

export default function TokenWatchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [selectedChain, setSelectedChain] = useState('all');

  // Load watchlist on mount
  useEffect(() => {
    setWatchlist(getWatchlist());
  }, []);

  // Fetch prices for all tokens in watchlist
  const { data: tokenPrices, isLoading: pricesLoading } = useQuery({
    queryKey: ['watchlist-prices', watchlist],
    queryFn: async () => {
      if (watchlist.length === 0) return {};
      
      const prices = {};
      for (const token of watchlist) {
        try {
          const price = await coingeckoService.getTokenPrice(token.address, token.chainId);
          if (price) {
            prices[`${token.address}-${token.chainId}`] = price;
            updateWatchlistPrice(token.address, token.chainId, price);
          }
        } catch (error) {
          console.warn(`Failed to fetch price for ${token.symbol}:`, error);
        }
      }
      return prices;
    },
    refetchInterval: 60000, // Refetch every minute
    enabled: watchlist.length > 0
  });

  // Filter watchlist by chain
  const filteredWatchlist = watchlist.filter(token => {
    if (selectedChain === 'all') return true;
    return token.chainId?.toString() === selectedChain;
  });

  const handleRemove = (address, chainId, symbol) => {
    if (removeFromWatchlist(address, chainId)) {
      setWatchlist(getWatchlist());
      toast.success(`${symbol} removed from watchlist`);
    }
  };

  const getPriceChange = (token) => {
    const priceKey = `${token.address}-${token.chainId}`;
    const currentPrice = tokenPrices?.[priceKey] || token.price || 0;
    const previousPrice = token.price || 0;
    
    if (previousPrice === 0) return null;
    const change = ((currentPrice - previousPrice) / previousPrice) * 100;
    return change;
  };

  if (watchlist.length === 0) {
    return (
      <div className="bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700 text-center">
        <div className="text-6xl mb-4">⭐</div>
        <h3 className="text-xl font-bold text-white mb-2">No Tokens in Watchlist</h3>
        <p className="text-gray-400">Add tokens to your watchlist to track their prices</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Token Watchlist</h2>
        <select
          value={selectedChain}
          onChange={(e) => setSelectedChain(e.target.value)}
          className="px-4 py-2 rounded-lg bg-gray-700 text-white text-sm"
        >
          <option value="all">All Networks</option>
          {Object.entries(NETWORKS).map(([id, network]) => (
            <option key={id} value={id}>{network.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filteredWatchlist.map((token, index) => {
          const priceKey = `${token.address}-${token.chainId}`;
          const currentPrice = tokenPrices?.[priceKey] || token.price || 0;
          const priceChange = getPriceChange(token);
          const network = NETWORKS[token.chainId]?.name || 'Unknown';

          return (
            <div
              key={`${token.address}-${token.chainId}-${index}`}
              className="flex items-center justify-between p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center space-x-4 flex-1">
                {token.logo ? (
                  <OptimizedImage src={token.logo} alt={token.symbol} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{token.symbol?.charAt(0) || 'T'}</span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-white font-semibold">{token.symbol}</h3>
                    <span className="text-gray-400 text-sm">{token.name}</span>
                  </div>
                  <p className="text-gray-400 text-xs">{network}</p>
                </div>
              </div>
              
              <div className="text-right mr-4">
                {pricesLoading ? (
                  <div className="animate-pulse">
                    <div className="h-5 bg-gray-600 rounded w-20 mb-1"></div>
                    <div className="h-4 bg-gray-600 rounded w-16"></div>
                  </div>
                ) : (
                  <>
                    <p className="text-white font-semibold">
                      ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </p>
                    {priceChange !== null && (
                      <p className={`text-sm ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                      </p>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={() => handleRemove(token.address, token.chainId, token.symbol)}
                className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                title="Remove from watchlist"
              >
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
