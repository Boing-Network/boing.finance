import React, { useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import config from '../config';

// Add AnimatedBackground and MochiAstronaut components (define in this file for now)
function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      <svg width="100%" height="100%" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
        {/* Floating orbs */}
        <circle cx="200" cy="200" r="60" fill="#00E0FF" opacity="0.12">
          <animate attributeName="cy" values="200;220;200" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle cx="1200" cy="300" r="40" fill="#7B61FF" opacity="0.10">
          <animate attributeName="cy" values="300;320;300" dur="7s" repeatCount="indefinite" />
        </circle>
        <circle cx="700" cy="600" r="80" fill="#00FFB2" opacity="0.08">
          <animate attributeName="cy" values="600;620;600" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="400" cy="700" r="30" fill="#fff" opacity="0.07">
          <animate attributeName="cy" values="700;720;700" dur="5s" repeatCount="indefinite" />
        </circle>
        
        {/* Additional floating elements */}
        <circle cx="1000" cy="150" r="25" fill="#FF6B6B" opacity="0.09">
          <animate attributeName="cx" values="1000;1020;1000" dur="9s" repeatCount="indefinite" />
        </circle>
        <circle cx="300" cy="500" r="35" fill="#4ECDC4" opacity="0.11">
          <animate attributeName="cy" values="500;480;500" dur="10s" repeatCount="indefinite" />
        </circle>
        <circle cx="1100" cy="650" r="20" fill="#45B7D1" opacity="0.08">
          <animate attributeName="cx" values="1100;1080;1100" dur="11s" repeatCount="indefinite" />
        </circle>
        
        {/* Rotating geometric shapes */}
        <rect x="150" y="100" width="40" height="40" fill="#FFD93D" opacity="0.06" rx="8">
          <animateTransform attributeName="transform" type="rotate" values="0 170 120;360 170 120" dur="15s" repeatCount="indefinite" />
        </rect>
        <polygon points="1300,200 1320,180 1340,200 1320,220" fill="#FF8A80" opacity="0.07">
          <animateTransform attributeName="transform" type="rotate" values="0 1320 200;360 1320 200" dur="12s" repeatCount="indefinite" />
        </polygon>
        <ellipse cx="600" cy="300" rx="30" ry="15" fill="#81C784" opacity="0.08">
          <animateTransform attributeName="transform" type="rotate" values="0 600 300;360 600 300" dur="18s" repeatCount="indefinite" />
        </ellipse>
        
        {/* Twinkling stars */}
        <circle cx="300" cy="100" r="2" fill="#fff">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="900" cy="200" r="1.5" fill="#00E0FF">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="1300" cy="500" r="2" fill="#7B61FF">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="500" cy="150" r="1.8" fill="#FF6B6B">
          <animate attributeName="opacity" values="0.1;0.8;0.1" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="800" cy="400" r="1.2" fill="#4ECDC4">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="1200" cy="100" r="1.6" fill="#FFD93D">
          <animate attributeName="opacity" values="0.3;0.9;0.3" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="200" cy="600" r="1.4" fill="#FF8A80">
          <animate attributeName="opacity" values="0.1;0.7;0.1" dur="3.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="1000" cy="700" r="1.7" fill="#81C784">
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2.9s" repeatCount="indefinite" />
        </circle>
        
        {/* Floating particles */}
        <circle cx="400" cy="300" r="3" fill="#00E0FF" opacity="0.4">
          <animate attributeName="cy" values="300;280;300" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="800" cy="500" r="2" fill="#7B61FF" opacity="0.3">
          <animate attributeName="cx" values="800;820;800" dur="5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.05;0.3" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="600" cy="700" r="2.5" fill="#00FFB2" opacity="0.35">
          <animate attributeName="cy" values="700;680;700" dur="6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0.08;0.35" dur="6s" repeatCount="indefinite" />
        </circle>
        
        {/* Pulsing elements */}
        <circle cx="1000" cy="400" r="15" fill="#FF6B6B" opacity="0.05">
          <animate attributeName="r" values="15;25;15" dur="8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.05;0.15;0.05" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="200" cy="400" r="12" fill="#4ECDC4" opacity="0.06">
          <animate attributeName="r" values="12;20;12" dur="10s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.06;0.12;0.06" dur="10s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

function MochiAstronaut({ position }) {
  let className = "animate-float z-20";
  if (position === "bottom-right") className += " absolute bottom-8 right-8";
  else className += " absolute right-0 top-0 mt-[-30px] mr-[-30px]";

  return (
    <svg width="60" height="60" viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <ellipse cx="100" cy="175" rx="28" ry="8" fill="#1e293b" opacity="0.13" />
        <ellipse cx="100" cy="85" rx="48" ry="44" fill="#fff" stroke="#bfc9d9" strokeWidth="3" />
        <ellipse cx="100" cy="85" rx="42" ry="38" fill="#00E0FF" fillOpacity="0.2" stroke="#7dd3fc" strokeWidth="3" />
        <ellipse cx="100" cy="90" rx="32" ry="30" fill="#f8fafc" stroke="#bfc9d9" strokeWidth="2" />
        <ellipse cx="88" cy="95" rx="5" ry="5" fill="#60a5fa" />
        <ellipse cx="112" cy="95" rx="5" ry="5" fill="#60a5fa" />
        <ellipse cx="88" cy="94" rx="1.2" ry="2" fill="#fff" opacity="0.7" />
        <ellipse cx="112" cy="94" rx="1.2" ry="2" fill="#fff" opacity="0.7" />
        <ellipse cx="85" cy="75" rx="12" ry="6" fill="#fff" opacity="0.18" />
        <ellipse cx="100" cy="140" rx="28" ry="24" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
        <ellipse cx="78" cy="135" rx="7" ry="13" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
        <ellipse cx="122" cy="135" rx="7" ry="13" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
        <ellipse cx="72" cy="147" rx="6" ry="6" fill="#f8fafc" stroke="#bfc9d9" strokeWidth="2" />
        <ellipse cx="128" cy="147" rx="6" ry="6" fill="#f8fafc" stroke="#bfc9d9" strokeWidth="2" />
        <ellipse cx="88" cy="165" rx="7" ry="12" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
        <ellipse cx="112" cy="165" rx="7" ry="12" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
        <ellipse cx="88" cy="180" rx="8" ry="4" fill="#a5b4fc" />
        <ellipse cx="112" cy="180" rx="8" ry="4" fill="#a5b4fc" />
        <ellipse cx="100" cy="150" rx="10" ry="8" fill="#bae6fd" stroke="#7dd3fc" strokeWidth="1.5" />
      </g>
      <animateTransform attributeName="transform" type="translate" values="0 0; 0 -12; 0 0" dur="4s" repeatCount="indefinite" />
    </svg>
  );
}

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
    if (!pools || pools.length === 0) return [];
    
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
    <div className="relative max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10">
        {/* MochiAstronaut positioned relative to content */}
        <MochiAstronaut position="top-right" />
        
        {/* Educational Banner */}
        <div className="p-6 mb-8 border border-green-500/20 rounded-xl">
          <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-4">Liquidity Pools</h1>
              <p className="text-gray-300 text-sm sm:text-base">Explore and analyze all available trading pools</p>
            </div>

            {/* Filters and Search */}
            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">Search</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search pools..."
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">Chain</label>
                  <select
                    value={selectedChain}
                    onChange={(e) => setSelectedChain(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Chains</option>
                    <option value="1">Ethereum</option>
                    <option value="137">Polygon</option>
                    <option value="56">BSC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="volume">Volume</option>
                    <option value="liquidity">Liquidity</option>
                    <option value="fee">Fee Rate</option>
                    <option value="apy">APY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">Order</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                <h3 className="text-xs sm:text-sm font-medium text-gray-400">Total Pools</h3>
                <p className="text-xl sm:text-2xl font-bold text-white">{filteredAndSortedPools.length}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                <h3 className="text-xs sm:text-sm font-medium text-gray-400">Total Liquidity</h3>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  ${formatNumber(filteredAndSortedPools.reduce((sum, pool) => {
                    const liquidity = parseFloat(pool.reserve0) * (pool.priceUsd || 1) + 
                                     parseFloat(pool.reserve1) * (pool.priceUsd || 1);
                    return sum + liquidity;
                  }, 0))}
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                <h3 className="text-xs sm:text-sm font-medium text-gray-400">24h Volume</h3>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  ${formatNumber(filteredAndSortedPools.reduce((sum, pool) => sum + parseFloat(pool.volume24h || 0), 0))}
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                <h3 className="text-xs sm:text-sm font-medium text-gray-400">Avg Fee Rate</h3>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {(filteredAndSortedPools.reduce((sum, pool) => sum + parseFloat(pool.feeRate || 0), 0) / 
                    Math.max(filteredAndSortedPools.length, 1) * 100).toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Pools Table */}
            <div className="bg-gray-800 rounded-lg overflow-x-auto">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Pool
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Chain
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Liquidity
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        24h Volume
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Fee Rate
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        APY
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {poolsLoading ? (
                      <tr>
                        <td colSpan="7" className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                          <div className="animate-spin rounded-full h-6 sm:h-8 w-6 sm:w-8 border-b-2 border-blue-500 mx-auto"></div>
                          <p className="text-gray-300 mt-2 text-sm sm:text-base">Loading pools...</p>
                        </td>
                      </tr>
                    ) : filteredAndSortedPools.length > 0 ? (
                      filteredAndSortedPools.map((pool) => (
                        <tr key={pool.id} className="hover:bg-gray-700 transition-colors">
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                  <span className="text-white font-bold text-xs sm:text-sm">
                                    {pool.token0Symbol[0]}{pool.token1Symbol[0]}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-2 sm:ml-4">
                                <div className="text-xs sm:text-sm font-medium text-white">
                                  {pool.token0Symbol}/{pool.token1Symbol}
                                </div>
                                <div className="text-xs text-gray-400 hidden sm:block">
                                  {formatAddress(pool.address)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getChainColor(pool.chainId)}`}>
                              {getChainName(pool.chainId)}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-white">
                            ${formatNumber(parseFloat(pool.reserve0) * (pool.priceUsd || 1) + 
                               parseFloat(pool.reserve1) * (pool.priceUsd || 1))}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-white">
                            ${formatNumber(parseFloat(pool.volume24h || 0))}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-white">
                            {(parseFloat(pool.feeRate || 0) * 100).toFixed(2)}%
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-green-400">
                            {(parseFloat(pool.apy || 0) * 100).toFixed(2)}%
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                            <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
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
                        <td colSpan="7" className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                          <p className="text-gray-300 text-sm sm:text-base">No pools found matching your criteria</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pool Details */}
            {filteredAndSortedPools.length > 0 && (
              <div className="mt-6 sm:mt-8 bg-gray-800 rounded-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Pool Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Pool Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-300 text-sm">Ethereum</span>
                        <span className="text-white text-sm">45%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300 text-sm">Polygon</span>
                        <span className="text-white text-sm">35%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300 text-sm">BSC</span>
                        <span className="text-white text-sm">20%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Top Pairs</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-300 text-sm">ETH/USDC</span>
                        <span className="text-white text-sm">$2.5M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300 text-sm">LINK/ETH</span>
                        <span className="text-white text-sm">$1.8M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300 text-sm">UNI/USDT</span>
                        <span className="text-white text-sm">$900K</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Performance</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-300 text-sm">Avg APY</span>
                        <span className="text-green-400 text-sm">14.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300 text-sm">Success Rate</span>
                        <span className="text-green-400 text-sm">99.8%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300 text-sm">Active Pools</span>
                        <span className="text-white text-sm">156</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pools;
