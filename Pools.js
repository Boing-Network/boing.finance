import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import config from '../config';

const Pools = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChain, setSelectedChain] = useState('all');
  const [sortBy, setSortBy] = useState('volume');
  const [sortOrder, setSortOrder] = useState('desc');

  // Fetch all pools
  const { data: pools, isLoading: poolsLoading } = useQuery(
    ['liquidity-pools', selectedChain],
    async () => {
      const response = await axios.get(`${config.apiUrl}/liquidity/pools`, {
        params: { 
          chainId: selectedChain === 'all' ? null : selectedChain,
          limit: 100 
        }
      });
      return response.data.data;
    },
    { refetchInterval: 30000 }
  );

  // Filter and sort pools
  const filteredAndSortedPools = React.useMemo(() => {
    if (!pools) return [];

    let filtered = pools.filter(pool => {
      const matchesSearch = searchTerm === '' || 
        pool.token0Symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pool.token1Symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${pool.token0Symbol}/${pool.token1Symbol}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesChain = selectedChain === 'all' || pool.chainId.toString() === selectedChain;
      
      return matchesSearch && matchesChain;
    });

    // Sort pools
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'volume':
          aValue = parseFloat(a.volume24h || 0);
          bValue = parseFloat(b.volume24h || 0);
          break;
        case 'liquidity':
          aValue = parseFloat(a.reserve0) * parseFloat(a.priceUsd || 1) + parseFloat(a.reserve1) * parseFloat(a.priceUsd || 1);
          bValue = parseFloat(b.reserve0) * parseFloat(b.priceUsd || 1) + parseFloat(b.reserve1) * parseFloat(b.priceUsd || 1);
          break;
        case 'fee':
          aValue = parseFloat(a.feeRate || 0);
          bValue = parseFloat(b.feeRate || 0);
          break;
        case 'apy':
          aValue = parseFloat(a.apy || 0);
          bValue = parseFloat(b.apy || 0);
          break;
        default:
          aValue = parseFloat(a.volume24h || 0);
          bValue = parseFloat(b.volume24h || 0);
      }

      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    return filtered;
  }, [pools, searchTerm, selectedChain, sortBy, sortOrder]);

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

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Liquidity Pools</h1>
        <p className="text-gray-300">Explore and analyze all available trading pools</p>
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
              placeholder="Search pools..."
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
              <option value="volume">Volume</option>
              <option value="liquidity">Liquidity</option>
              <option value="fee">Fee Rate</option>
              <option value="apy">APY</option>
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
          <h3 className="text-sm font-medium text-gray-400">Total Pools</h3>
          <p className="text-2xl font-bold text-white">{filteredAndSortedPools.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400">Total Liquidity</h3>
          <p className="text-2xl font-bold text-white">
            ${filteredAndSortedPools.reduce((sum, pool) => {
              const liquidity = parseFloat(pool.reserve0) * (pool.priceUsd || 1) + 
                               parseFloat(pool.reserve1) * (pool.priceUsd || 1);
              return sum + liquidity;
            }, 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400">24h Volume</h3>
          <p className="text-2xl font-bold text-white">
            ${filteredAndSortedPools.reduce((sum, pool) => sum + parseFloat(pool.volume24h || 0), 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400">Avg Fee Rate</h3>
          <p className="text-2xl font-bold text-white">
            {(filteredAndSortedPools.reduce((sum, pool) => sum + parseFloat(pool.feeRate || 0), 0) / 
              Math.max(filteredAndSortedPools.length, 1) * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Pools Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Pool
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Chain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Liquidity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  24h Volume
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Fee Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  APY
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {poolsLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-300 mt-2">Loading pools...</p>
                  </td>
                </tr>
              ) : filteredAndSortedPools.length > 0 ? (
                filteredAndSortedPools.map((pool) => (
                  <tr key={pool.address} className="hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {pool.token0Symbol[0]}{pool.token1Symbol[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {pool.token0Symbol}/{pool.token1Symbol}
                          </div>
                          <div className="text-sm text-gray-400">
                            {pool.address.slice(0, 8)}...{pool.address.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getChainColor(pool.chainId)}`}>
                        {getChainName(pool.chainId)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      ${(parseFloat(pool.reserve0) * (pool.priceUsd || 1) + 
                         parseFloat(pool.reserve1) * (pool.priceUsd || 1)).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      ${parseFloat(pool.volume24h || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {(parseFloat(pool.feeRate || 0) * 100).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">
                      {(parseFloat(pool.apy || 0) * 100).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.location.href = `/swap?pair=${pool.address}`}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Trade
                        </button>
                        <button
                          onClick={() => window.location.href = `/liquidity?pool=${pool.address}`}
                          className="text-green-400 hover:text-green-300 transition-colors"
                        >
                          Add Liquidity
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <p className="text-gray-300">No pools found matching your criteria</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pool Details Modal (placeholder) */}
      {filteredAndSortedPools.length > 0 && (
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Pool Details</h3>
          <p className="text-gray-300 text-sm">
            Click on a pool row to view detailed information including price charts, 
            liquidity distribution, and trading history.
          </p>
        </div>
      )}
    </div>
  );
};

export default Pools; 