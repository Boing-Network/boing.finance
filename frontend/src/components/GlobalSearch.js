// Global Search Component
// Provides a global search bar with autocomplete and keyboard shortcuts

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { debounce } from '../utils/debounce';
import TokenScanner from '../services/tokenScanner';
import coingeckoService from '../services/coingeckoService';
import { NETWORKS } from '../config/networks';
import toast from 'react-hot-toast';

const GlobalSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const tokenScanner = new TokenScanner();

  // Load search history (support legacy string[] and new { query, type?, chainId?, networkName? }[])
  useEffect(() => {
    const raw = localStorage.getItem('boing_search_history');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const normalized = Array.isArray(parsed)
        ? parsed.map((item) =>
            typeof item === 'string'
              ? { query: item, type: item.startsWith('0x') ? 'address' : undefined }
              : { query: item.query || item, type: item.type, chainId: item.chainId, networkName: item.networkName }
          )
        : [];
      setSearchHistory(normalized);
    } catch (e) {
      setSearchHistory([]);
    }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Debounced search function (debounce hides deps from eslint; intentional)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce wrapper has unknown deps
  const performSearch = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const searchResults = [];

        // Address-based search: use TokenScanner
        if (searchQuery.startsWith('0x') && searchQuery.length >= 10) {
          for (const [chainId, network] of Object.entries(NETWORKS)) {
            try {
              const token = await tokenScanner.searchToken(searchQuery, parseInt(chainId));
              if (token) {
                searchResults.push({
                  type: 'token',
                  data: { ...token, address: token.address },
                  network: network.name,
                  chainId: parseInt(chainId)
                });
                break; // Found on one network
              }
            } catch (error) {
              console.warn(`Search failed for ${network.name}:`, error);
            }
          }
        } else {
          // Name/symbol search: use CoinGecko API (coins + NFTs)
          try {
            const cgResults = await coingeckoService.searchTokens(searchQuery);
            if (cgResults?.coins?.length > 0) {
              cgResults.coins.slice(0, 4).forEach((coin) => {
                searchResults.push({
                  type: 'coin',
                  data: {
                    id: coin.id,
                    name: coin.name,
                    symbol: (coin.symbol || '').toUpperCase(),
                    thumb: coin.thumb,
                    marketCapRank: coin.market_cap_rank
                  }
                });
              });
            }
            if (cgResults?.nfts?.length > 0) {
              cgResults.nfts.slice(0, 3).forEach((nft) => {
                searchResults.push({
                  type: 'nft',
                  data: {
                    id: nft.id,
                    name: nft.name,
                    symbol: nft.symbol || '',
                    thumb: nft.thumb,
                    nftContractId: nft.nft_contract_id
                  }
                });
              });
            }
          } catch (cgError) {
            console.warn('CoinGecko search failed:', cgError);
          }
        }

        // Add route matches (all pages are live)
        const routes = [
          { name: 'Deploy Token', path: '/deploy-token', icon: '🚀', comingSoon: false },
          { name: 'Portfolio', path: '/portfolio', icon: '💼', comingSoon: false },
          { name: 'Activity', path: '/activity', icon: '📋', comingSoon: false },
          { name: 'Analytics', path: '/analytics', icon: '📊', comingSoon: false },
          { name: 'Tokens', path: '/tokens', icon: '🪙', comingSoon: false },
          { name: 'Pools', path: '/pools', icon: '🏊', comingSoon: false },
          { name: 'Swap', path: '/swap', icon: '🔄', comingSoon: false },
          { name: 'Bridge', path: '/bridge', icon: '🌉', comingSoon: false }
        ];

        // Match routes: exact substring or fuzzy (each word in query appears in name/path)
        const qLower = searchQuery.toLowerCase().trim();
        const qWords = qLower.split(/\s+/).filter(Boolean);
        routes.forEach(route => {
          const nameLower = route.name.toLowerCase();
          const pathLower = route.path.toLowerCase();
          const fullLower = `${nameLower} ${pathLower}`;
          const exactMatch = nameLower.includes(qLower) || pathLower.includes(qLower);
          const fuzzyMatch = qWords.length > 0 && qWords.every(word => fullLower.includes(word));
          if (exactMatch || fuzzyMatch) {
            searchResults.push({
              type: 'route',
              data: route
            });
          }
        });

        setResults(searchResults.slice(0, 10)); // Limit to 10 results
      } catch (error) {
        console.error('Search error:', error);
        toast.error('Search failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    performSearch(value);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleSelectResult(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelectResult(results[0]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Handle result selection
  const handleSelectResult = (result) => {
    const entry =
      result.type === 'token' && result.chainId != null
        ? { query, type: 'address', chainId: result.chainId, networkName: result.network }
        : result.type === 'route'
          ? { query, type: 'route' }
          : result.type === 'coin'
            ? { query, type: 'coin' }
            : result.type === 'nft'
              ? { query, type: 'nft' }
              : { query, type: undefined };
    const isSame = (h) =>
      h.query === entry.query &&
      (entry.type !== 'address' || (h.chainId === entry.chainId && h.networkName === entry.networkName));
    const newHistory = [entry, ...searchHistory.filter(h => !isSame(h))].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('boing_search_history', JSON.stringify(newHistory));

    if (result.type === 'route') {
      // Check if route is coming soon
      if (result.data.comingSoon) {
        // Still navigate to show coming soon page
        navigate(result.data.path);
        onClose();
      } else {
        navigate(result.data.path);
        onClose();
      }
    } else if (result.type === 'token') {
      navigate(`/tokens?address=${result.data.address}&network=${result.chainId}`);
      onClose();
    } else if (result.type === 'coin') {
      navigate(`/tokens?coinId=${encodeURIComponent(result.data.id)}`);
      onClose();
    } else if (result.type === 'nft') {
      navigate('/portfolio?tab=nfts');
      onClose();
    }
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black bg-opacity-75 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-search-label"
    >
      <div 
        className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <label htmlFor="global-search-input" className="sr-only">Search tokens, NFTs, addresses, or pages</label>
            <input
              ref={inputRef}
              id="global-search-input"
              name="globalSearch"
              type="text"
              autoComplete="off"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Search tokens, NFTs, addresses, or pages... (Press / to focus)"
              className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg"
              role="combobox"
              aria-label="Global search"
              aria-autocomplete="list"
              aria-controls="search-results"
              aria-expanded={results.length > 0}
            />
            {query && (
              <button
                onClick={handleClear}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors px-2 py-1 rounded"
              aria-label="Close search"
            >
              ESC
            </button>
          </div>
        </div>

        {/* Search Results */}
        <div id="search-results" className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-400 mt-4">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <ul role="listbox" aria-label="Search results">
              {results.map((result, index) => (
                <li
                  key={index}
                  role="option"
                  aria-selected={index === selectedIndex}
                  className={`p-4 cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-[var(--secondary-bg)] border-l-4 border-primary'
                      : 'hover:bg-gray-700 border-l-4 border-transparent'
                  }`}
                  onClick={() => handleSelectResult(result)}
                >
                  <div className="flex items-center space-x-3">
                    {((result.type === 'coin' || result.type === 'nft') && result.data.thumb) ? (
                      <img src={result.data.thumb} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <span className="text-2xl">
                        {result.type === 'route' ? result.data.icon : result.type === 'nft' ? '🖼️' : '🪙'}
                      </span>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">
                          {result.type === 'route' ? result.data.name : result.data.name || result.data.symbol}
                        </span>
                        {result.type === 'coin' && result.data.marketCapRank && (
                          <span className="text-xs text-gray-500">#{result.data.marketCapRank}</span>
                        )}
                        {result.type === 'route' && result.data.comingSoon && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-400/30">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {result.type === 'route' 
                          ? result.data.path
                          : result.type === 'coin'
                            ? `${result.data.symbol} • CoinGecko`
                            : result.type === 'nft'
                              ? 'NFT Collection • View in Portfolio'
                              : `${result.data.symbol} • ${result.network}`
                        }
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 uppercase">
                      {result.type}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : query ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">No results found</p>
              <p className="text-sm text-gray-500 mt-2">Try searching for a token address, symbol, or page name</p>
            </div>
          ) : searchHistory.length > 0 ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-400">Recent Searches</h3>
                <button
                  type="button"
                  onClick={() => {
                    setSearchHistory([]);
                    localStorage.removeItem('boing_search_history');
                  }}
                  className="text-xs text-primary hover:text-secondary"
                >
                  Clear
                </button>
              </div>
              <ul>
                {searchHistory.slice(0, 8).map((item, index) => {
                  const q = typeof item === 'string' ? item : item.query;
                  const label =
                    typeof item === 'object' && item.networkName && (item.type === 'address' || item.query?.startsWith?.('0x'))
                      ? `Address · ${item.networkName}`
                      : q?.startsWith?.('0x')
                        ? 'Address'
                        : item.type === 'route'
                          ? 'Page'
                          : item.type === 'coin' || item.type === 'nft'
                            ? item.type
                            : 'Search';
                  return (
                    <li
                      key={`${q}-${item.chainId ?? ''}-${index}`}
                      className="p-2 hover:bg-gray-700 rounded cursor-pointer flex items-center justify-between group"
                      onClick={() => {
                        setQuery(q);
                        performSearch(q);
                      }}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-300 truncate">{q}</span>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-400 mb-4">Start typing to search...</p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>• Search for token addresses (0x...)</p>
                <p>• Search for token names, NFT collections</p>
                <p>• Search for page names (Deploy, Portfolio, etc.)</p>
                <p>• Press <kbd className="px-2 py-1 bg-gray-700 rounded">/</kbd> to open search</p>
              </div>
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="p-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span><kbd className="px-1.5 py-0.5 bg-gray-700 rounded">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Enter</kbd> Select</span>
            <span><kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Esc</kbd> Close</span>
          </div>
          <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;

