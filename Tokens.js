import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import config from '../config';

const Tokens = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChain, setSelectedChain] = useState('all');
  const [sortBy, setSortBy] = useState('marketCap');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedToken, setSelectedToken] = useState(null);

  // Fetch all tokens
  const { data: tokens, isLoading: tokensLoading } = useQuery(
    ['tokens', selectedChain],
    async () => {
      const response = await axios.get(`${config.apiUrl}/tokens`, {
        params: { 
          chainId: selectedChain === 'all' ? null : selectedChain,
          limit: 100 
        }
      });
      return response.data.data;
    },
    { refetchInterval: 60000 }
  );

  // Fetch top tokens by volume
  const { data: topVolumeTokens } = useQuery(
    ['top-volume-tokens', selectedChain],
    async () => {
      const response = await axios.get(`${config.apiUrl}/tokens/top/volume`, {
        params: { 
          chainId: selectedChain === 'all' ? null : selectedChain,
          limit: 10 
        }
      });
      return response.data.data;
    },
    { refetchInterval: 30000 }
  );

  // Fetch top tokens by market cap
  const { data: topMarketCapTokens } = useQuery(
    ['top-marketcap-tokens', selectedChain],
    async () => {
      const response = await axios.get(`${config.apiUrl}/tokens/top/marketcap`, {
        params: { 
          chainId: selectedChain === 'all' ? null : selectedChain,
          limit: 10 
        }
      });
      return response.data.data;
    },
    { refetchInterval: 30000 }
  );

  // Filter and sort tokens
  const filteredAndSortedTokens = React.useMemo(() => {
    if (!tokens) return [];

    let filtered = tokens.filter(token => {
      const matchesSearch = searchTerm === '' || 
        token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.address.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesChain = selectedChain === 'all' || token.chainId.toString() === selectedChain;
      
      return matchesSearch && matchesChain;
    });

    // Sort tokens
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'marketCap':
          aValue = parseFloat(a.marketCap || 0);
          bValue = parseFloat(b.marketCap || 0);
          break;
        case 'volume':
          aValue = parseFloat(a.volume24h || 0);
          bValue = parseFloat(b.volume24h || 0);
          break;
        case 'price':
          aValue = parseFloat(a.priceUsd || 0);
          bValue = parseFloat(b.priceUsd || 0);
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        default:
          aValue = parseFloat(a.marketCap || 0);
          bValue = parseFloat(b.marketCap || 0);
      }

      if (sortBy === 'name') {
        return sortOrder === 'desc' ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
      }
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    return filtered;
  }, [tokens, searchTerm, selectedChain, sortBy, sortOrder]);

  const getChainName = (chainId) => {
    switch (chainId) {
      case 1: return 'Ethereum';
      case 137: return 'Polygon';
      case 56: return 'BSC';
      default: return `Chain ${chainId}`;
    }
  };

  const getChainColor = (chainId) => {
    switch (chainId) {
      case 1: return 'text-blue-400';
      case 137: return 'text-purple-400';
      case 56: return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const formatNumber = (num) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Token Explorer</h1>
        <p className="text-gray-300">Discover and analyze tokens across multiple blockchains</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tokens..."
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Chain</label>
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Chains</option>
              <option value="1">Ethereum</option>
              <option value="137">Polygon</option>
              <option value="56">BSC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="marketCap">Market Cap</option>
              <option value="volume">Volume</option>
              <option value="price">Price</option>
              <option value="name">Name</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400">Total Tokens</h3>
          <p className="text-2xl font-bold text-white">{filteredAndSortedTokens.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400">Total Market Cap</h3>
          <p className="text-2xl font-bold text-white">
            ${formatNumber(filteredAndSortedTokens.reduce((sum, token) => sum + parseFloat(token.marketCap || 0), 0))}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400">24h Volume</h3>
          <p className="text-2xl font-bold text-white">
            ${formatNumber(filteredAndSortedTokens.reduce((sum, token) => sum + parseFloat(token.volume24h || 0), 0))}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400">Avg Price</h3>
          <p className="text-2xl font-bold text-white">
            ${(filteredAndSortedTokens.reduce((sum, token) => sum + parseFloat(token.priceUsd || 0), 0) / 
               Math.max(filteredAndSortedTokens.length, 1)).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tokens Table */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Token</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Chain</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Market Cap</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">24h Volume</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {tokensLoading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-gray-300 mt-2">Loading tokens...</p>
                      </td>
                    </tr>
                  ) : filteredAndSortedTokens.length > 0 ? (
                    filteredAndSortedTokens.map((token) => (
                      <tr key={token.id} className="hover:bg-gray-700 cursor-pointer" onClick={() => setSelectedToken(token)}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {token.symbol.slice(0, 2)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">
                                {token.name}
                              </div>
                              <div className="text-sm text-gray-400">
                                {token.symbol}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getChainColor(token.chainId)}`}>
                            {getChainName(token.chainId)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          ${parseFloat(token.priceUsd || 0).toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          ${formatNumber(parseFloat(token.marketCap || 0))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          ${formatNumber(parseFloat(token.volume24h || 0))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/swap?token=${token.address}`;
                              }}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              Trade
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(token.address);
                                toast.success('Token address copied!');
                              }}
                              className="text-gray-400 hover:text-gray-300 transition-colors"
                            >
                              Copy
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <p className="text-gray-300">No tokens found matching your criteria</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Top Tokens by Volume */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top by Volume</h3>
            <div className="space-y-3">
              {topVolumeTokens?.slice(0, 5).map((token, index) => (
                <div key={token.id} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                  <div className="flex items-center">
                    <span className="text-gray-400 text-sm mr-2">#{index + 1}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{token.symbol}</p>
                      <p className="text-gray-400 text-xs">{token.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm">${formatNumber(parseFloat(token.volume24h || 0))}</p>
                    <p className="text-gray-400 text-xs">${parseFloat(token.priceUsd || 0).toFixed(4)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Tokens by Market Cap */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top by Market Cap</h3>
            <div className="space-y-3">
              {topMarketCapTokens?.slice(0, 5).map((token, index) => (
                <div key={token.id} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                  <div className="flex items-center">
                    <span className="text-gray-400 text-sm mr-2">#{index + 1}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{token.symbol}</p>
                      <p className="text-gray-400 text-xs">{token.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm">${formatNumber(parseFloat(token.marketCap || 0))}</p>
                    <p className="text-gray-400 text-xs">${parseFloat(token.priceUsd || 0).toFixed(4)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Token Details */}
          {selectedToken && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Token Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Name</span>
                  <span className="text-white">{selectedToken.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Symbol</span>
                  <span className="text-white">{selectedToken.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Price</span>
                  <span className="text-white">${parseFloat(selectedToken.priceUsd || 0).toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Market Cap</span>
                  <span className="text-white">${formatNumber(parseFloat(selectedToken.marketCap || 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">24h Volume</span>
                  <span className="text-white">${formatNumber(parseFloat(selectedToken.volume24h || 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Decimals</span>
                  <span className="text-white">{selectedToken.decimals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Chain</span>
                  <span className={`${getChainColor(selectedToken.chainId)}`}>
                    {getChainName(selectedToken.chainId)}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-700">
                  <p className="text-gray-300 text-xs mb-2">Contract Address</p>
                  <p className="text-white text-xs font-mono break-all">
                    {selectedToken.address}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tokens; 