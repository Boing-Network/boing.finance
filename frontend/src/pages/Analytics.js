import React, { useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import config from '../config';

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

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedChain, setSelectedChain] = useState('all');

  // Fetch analytics overview
  const { data: analytics } = useQuery(
    ['analytics-overview', selectedChain],
    async () => {
      const response = await axios.get(`${config.apiUrl}/analytics/overview`, {
        params: { chainId: selectedChain === 'all' ? null : selectedChain }
      });
      return response.data.data;
    },
    { refetchInterval: 60000 }
  );

  // Fetch recent swaps
  const { data: recentSwaps, isLoading: recentSwapsLoading } = useQuery(
    ['recent-swaps', selectedChain],
    async () => {
      const response = await axios.get(`${config.apiUrl}/swap/recent`, {
        params: { 
          chainId: selectedChain === 'all' ? null : selectedChain,
          limit: 10 
        }
      });
      return response.data.data;
    },
    { refetchInterval: 30000 }
  );

  // Fetch volume data
  const { data: volumeData } = useQuery(
    ['volume-data', timeRange, selectedChain],
    async () => {
      const response = await axios.get(`${config.apiUrl}/analytics/volume`, {
        params: { 
          timeRange,
          chainId: selectedChain === 'all' ? null : selectedChain
        }
      });
      return response.data.data || [];
    },
    { refetchInterval: 60000 }
  );

  // Fetch top pairs data
  const { data: topPairs } = useQuery(
    ['top-pairs', selectedChain],
    async () => {
      const response = await axios.get(`${config.apiUrl}/analytics/top-pairs`, {
        params: { 
          chainId: selectedChain === 'all' ? null : selectedChain,
          limit: 5
        }
      });
      return response.data.data || [];
    },
    { refetchInterval: 60000 }
  );

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
        <div className="p-6 mb-8 border border-orange-500/20 rounded-xl">
          {/* Main content here */}
          <div className="relative">
            <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
              <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-4">Analytics Dashboard</h1>
                <p className="text-gray-300 text-sm sm:text-base">Real-time market data and trading statistics</p>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">Time Range</label>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="1h">Last Hour</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>
                </div>
                <div className="flex-1 min-w-0">
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
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-400">Total Volume</h3>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    ${analytics?.swapStats?.totalVolume ? 
                      formatNumber(analytics.swapStats.totalVolume) : 
                      '0.00M'
                    }
                  </p>
                  <p className="text-xs sm:text-sm text-green-400">+12.5% from last period</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-400">Total Swaps</h3>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {analytics?.swapStats?.totalSwaps ? 
                      analytics.swapStats.totalSwaps.toLocaleString() : 
                      '0'
                    }
                  </p>
                  <p className="text-xs sm:text-sm text-green-400">+8.3% from last period</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-400">Active Users</h3>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {analytics?.swapStats?.activeUsers ? 
                      analytics.swapStats.activeUsers.toLocaleString() : 
                      '1,234'
                    }
                  </p>
                  <p className="text-xs sm:text-sm text-green-400">+15.2% from last period</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-400">Total Pools</h3>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {analytics?.topPools?.length || 156}
                  </p>
                  <p className="text-xs sm:text-sm text-blue-400">Active liquidity pools</p>
                </div>
              </div>

              {/* Charts and Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
                {/* Volume Chart */}
                <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Trading Volume (24h)</h3>
                  {volumeData && volumeData.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {volumeData.map((data, index) => (
                        <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-700 rounded">
                          <span className="text-gray-300 text-xs sm:text-sm">{data.time}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 sm:w-20 bg-gray-600 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${(data.volume / Math.max(...volumeData.map(d => d.volume))) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-white text-xs sm:text-sm">${formatNumber(data.volume)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-400 text-sm">No volume data available</p>
                    </div>
                  )}
                </div>

                {/* Top Trading Pairs */}
                <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Top Trading Pairs</h3>
                  {topPairs && topPairs.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {topPairs.map((pair, index) => (
                        <div key={index} className="flex justify-between items-center p-2 sm:p-3 bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <span className="text-gray-400 text-xs sm:text-sm">#{index + 1}</span>
                            <div>
                              <p className="text-white font-medium text-sm sm:text-base">{pair.pair}</p>
                              <p className="text-gray-400 text-xs sm:text-sm">
                                ${formatNumber(pair.volume)} volume
                              </p>
                            </div>
                          </div>
                          <div className={`text-xs sm:text-sm font-medium ${
                            pair.change >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {pair.change >= 0 ? '+' : ''}{pair.change}%
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-400 text-sm">No trading pairs data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Swaps */}
              <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Recent Swaps</h3>
                {recentSwapsLoading ? (
                  <div className="text-center py-6 sm:py-8">
                    <div className="animate-spin rounded-full h-6 sm:h-8 w-6 sm:w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-300 mt-2 text-sm sm:text-base">Loading recent swaps...</p>
                  </div>
                ) : recentSwaps?.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {recentSwaps.slice(0, 5).map((swap) => (
                      <div key={swap.id} className="flex justify-between items-center p-2 sm:p-3 bg-gray-700 rounded-lg">
                        <div>
                          <p className="text-white text-xs sm:text-sm">
                            {swap.tokenIn} → {swap.tokenOut}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {new Date(swap.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white text-xs sm:text-sm">
                            {parseFloat(swap.amountIn).toFixed(4)}
                          </p>
                          <p className="text-gray-400 text-xs">
                            ${(parseFloat(swap.amountIn) * 2500).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {/* Sample data when API is not available */}
                    {[
                      { tokenIn: 'ETH', tokenOut: 'USDC', amount: '2.5', time: '2 minutes ago' },
                      { tokenIn: 'LINK', tokenOut: 'ETH', amount: '150.0', time: '5 minutes ago' },
                      { tokenIn: 'USDC', tokenOut: 'UNI', amount: '1000.0', time: '8 minutes ago' },
                      { tokenIn: 'ETH', tokenOut: 'AAVE', amount: '1.2', time: '12 minutes ago' },
                      { tokenIn: 'USDT', tokenOut: 'LINK', amount: '500.0', time: '15 minutes ago' },
                    ].map((swap, index) => (
                      <div key={index} className="flex justify-between items-center p-2 sm:p-3 bg-gray-700 rounded-lg">
                        <div>
                          <p className="text-white text-xs sm:text-sm">
                            {swap.tokenIn} → {swap.tokenOut}
                          </p>
                          <p className="text-gray-400 text-xs">{swap.time}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white text-xs sm:text-sm">{swap.amount}</p>
                          <p className="text-gray-400 text-xs">~$2,500.00</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
                <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Chain Distribution</h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Ethereum</span>
                      <span className="text-white text-sm">45.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Polygon</span>
                      <span className="text-white text-sm">32.8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">BSC</span>
                      <span className="text-white text-sm">22.0%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Token Categories</h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Stablecoins</span>
                      <span className="text-white text-sm">38.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">DeFi Tokens</span>
                      <span className="text-white text-sm">42.3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Others</span>
                      <span className="text-white text-sm">19.2%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Performance Metrics</h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Avg Swap Size</span>
                      <span className="text-white text-sm">$1,247</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Success Rate</span>
                      <span className="text-green-400 text-sm">99.7%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Avg Gas Used</span>
                      <span className="text-white text-sm">125,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
