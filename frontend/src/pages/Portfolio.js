import React, { useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import config from '../config';
import { useWalletConnection } from '../hooks/useWalletConnection';

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

const Portfolio = () => {
  const [selectedChain] = useState('all');
  const { isConnected, account } = useWalletConnection();

  // Use connected wallet address or show connect message
  const walletAddress = account || null;

  // Fetch portfolio data
  const { data: portfolio, isLoading } = useQuery(
    ['portfolio', walletAddress, selectedChain],
    async () => {
      if (!walletAddress) {
        throw new Error('No wallet connected');
      }
      const response = await axios.get(`${config.apiUrl}/portfolio/${walletAddress}`, {
        params: { chainId: selectedChain === 'all' ? null : selectedChain }
      });
      return response.data.data;
    },
    { 
      refetchInterval: 30000,
      enabled: !!walletAddress,
      retry: false
    }
  );

  const getChainName = (chainId) => {
    const chains = { 1: 'Ethereum', 137: 'Polygon', 56: 'BSC' };
    return chains[chainId] || 'Unknown';
  };

  const getChainColor = (chainId) => {
    const colors = { 1: 'bg-blue-100 text-blue-800', 137: 'bg-purple-100 text-purple-800', 56: 'bg-yellow-100 text-yellow-800' };
    return colors[chainId] || 'bg-gray-100 text-gray-800';
  };

  const formatNumber = (num) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  // Show connect wallet message if not connected
  if (!isConnected || !walletAddress) {
    return (
      <div className="relative max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
        <AnimatedBackground />
        <div className="relative z-10">
          <MochiAstronaut position="top-right" />
          <div className="text-center py-12">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Connect Your Wallet</h1>
            <p className="text-gray-300 mb-8">Connect your wallet to view your portfolio</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200">
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="relative max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
        <AnimatedBackground />
        <div className="relative z-10">
          <MochiAstronaut position="top-right" />
          <div className="text-center py-12">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Loading Portfolio...</h1>
            <p className="text-gray-300">Fetching your portfolio data</p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no portfolio data
  if (!portfolio) {
    return (
      <div className="relative max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
        <AnimatedBackground />
        <div className="relative z-10">
          <MochiAstronaut position="top-right" />
          <div className="text-center py-12">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">No Portfolio Data</h1>
            <p className="text-gray-300 mb-8">Start trading to build your portfolio</p>
            <a href="/swap" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200">
              Start Trading
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10">
        {/* MochiAstronaut positioned relative to content */}
        <MochiAstronaut position="top-right" />
        
        {/* Portfolio Header */}
        <div className="mb-8">
          <div className="relative">
            <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
              <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-4">Portfolio</h1>
                <p className="text-gray-300 text-sm sm:text-base">Track your assets and trading performance</p>
              </div>

              {/* Portfolio Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-400">Total Value</h3>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    ${formatNumber(portfolio?.totalValue || 125000)}
                  </p>
                  <p className="text-xs sm:text-sm text-green-400">+8.5% (24h)</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-400">24h Change</h3>
                  <p className="text-xl sm:text-2xl font-bold text-green-400">
                    +${formatNumber(portfolio?.change24h || 9850)}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400">+8.5%</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-400">Total Assets</h3>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {portfolio?.totalAssets || 12}
                  </p>
                  <p className="text-xs sm:text-sm text-blue-400">Across 3 chains</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-400">APY</h3>
                  <p className="text-xl sm:text-2xl font-bold text-green-400">
                    {(portfolio?.apy || 14.5).toFixed(1)}%
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400">From liquidity</p>
                </div>
              </div>

              {/* Asset Allocation Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
                <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Asset Allocation</h3>
                  <div className="space-y-3 sm:space-y-4">
                    {portfolio.tokens.slice(0, 5).map((token, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: getChainColor(token.chainId) }}
                          ></div>
                          <span className="text-gray-300 text-sm">{token.symbol}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-white text-sm">${formatNumber(token.value)}</p>
                          <p className="text-gray-400 text-xs">{parseFloat(token.balance).toFixed(2)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Performance Chart</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {portfolio.transactions.slice(0, 5).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-700 rounded">
                        <span className="text-gray-300 text-xs sm:text-sm">{tx.timestamp.toLocaleString()}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 sm:w-20 bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${(tx.value / 150000) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-white text-xs sm:text-sm">${formatNumber(tx.value)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Assets Table */}
              <div className="bg-gray-800 rounded-lg overflow-hidden mb-6 sm:mb-8">
                <div className="p-4 sm:p-6 border-b border-gray-700">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Your Assets</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Asset
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Chain
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Balance
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          24h Change
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {portfolio.tokens.map((token, index) => (
                        <tr key={index} className="hover:bg-gray-700 transition-colors">
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                  <span className="text-white font-bold text-xs sm:text-sm">
                                    {token.symbol[0]}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-2 sm:ml-4">
                                <div className="text-xs sm:text-sm font-medium text-white">
                                  {token.symbol}
                                </div>
                                <div className="text-xs text-gray-400 hidden sm:block">
                                  {token.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getChainColor(token.chainId)}`}>
                              {getChainName(token.chainId)}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-white">
                            {parseFloat(token.balance).toFixed(4)}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-white">
                            ${token.price.toFixed(2)}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-white">
                            ${formatNumber(token.value)}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                            <span className={token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                              {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                            <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                              <button
                                onClick={() => window.location.href = `/swap?from=${token.symbol}`}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                Trade
                              </button>
                              <button
                                onClick={() => window.location.href = `/liquidity?token=${token.symbol}`}
                                className="text-green-400 hover:text-green-300 transition-colors"
                              >
                                Add LP
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Liquidity Positions */}
              <div className="bg-gray-800 rounded-lg overflow-hidden mb-6 sm:mb-8">
                <div className="p-4 sm:p-6 border-b border-gray-700">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Liquidity Positions</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Pair
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Chain
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Liquidity
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Share
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Fees (24h)
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
                      {portfolio.liquidityPositions.map((position, index) => (
                        <tr key={index} className="hover:bg-gray-700 transition-colors">
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="text-xs sm:text-sm font-medium text-white">
                              {position.pair}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getChainColor(position.chainId)}`}>
                              {getChainName(position.chainId)}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-white">
                            ${formatNumber(position.liquidity)}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-white">
                            {(position.share * 100).toFixed(2)}%
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-white">
                            ${formatNumber(position.value)}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-green-400">
                            ${position.fees.toFixed(2)}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-green-400">
                            {position.apy.toFixed(1)}%
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                            <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                              <button
                                onClick={() => window.location.href = `/liquidity?pair=${position.pair}`}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                Manage
                              </button>
                              <button
                                onClick={() => window.location.href = `/swap?pair=${position.pair}`}
                                className="text-green-400 hover:text-green-300 transition-colors"
                              >
                                Trade
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-700">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Recent Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Details
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Chain
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {portfolio.transactions.map((tx, index) => (
                        <tr key={index} className="hover:bg-gray-700 transition-colors">
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center">
                              <span className="text-lg mr-2">
                                {tx.type === 'swap' ? '🔄' : tx.type === 'add_liquidity' ? '➕' : '📄'}
                              </span>
                              <span className="text-xs sm:text-sm font-medium text-white capitalize">
                                {tx.type.replace('_', ' ')}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="text-xs sm:text-sm text-white">
                              {tx.type === 'swap' ? `${tx.from} → ${tx.to}` : tx.pair}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-white">
                            {tx.amount}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-white">
                            ${formatNumber(tx.value)}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getChainColor(tx.chainId)}`}>
                              {getChainName(tx.chainId)}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-400">
                            {tx.timestamp.toLocaleString()}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio; 