import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import config from '../config';
import { useWallet } from '../contexts/WalletContext';
import { Helmet } from 'react-helmet-async';

// MochiAstronaut component
function MochiAstronaut({ position = "bottom-left" }) {
  const getPositionClasses = () => {
    switch (position) {
      case "top-right":
        return "absolute right-0 top-0 mt-4 mr-4 z-20";
      case "bottom-right":
        return "absolute right-0 bottom-0 mb-4 mr-4 z-20";
      case "top-left":
        return "absolute left-0 top-0 mt-4 ml-4 z-20";
      case "bottom-left":
        return "absolute left-0 bottom-0 mb-4 ml-4 z-20";
      default:
        return "absolute left-0 bottom-0 mb-4 ml-4 z-20";
    }
  };

  return (
    <svg width="60" height="60" viewBox="0 0 200 200" className={`animate-float ${getPositionClasses()}`} fill="none" xmlns="http://www.w3.org/2000/svg">
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

export default function Portfolio() {
  const { account } = useWallet();
  const [selectedNetwork, setSelectedNetwork] = useState('all');

  const { data: portfolio, isLoading, error } = useQuery(
    ['portfolio', account, selectedNetwork],
    () => fetchPortfolio(account, selectedNetwork),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      enabled: !!account,
    }
  );

  const fetchPortfolio = async (walletAddress, network) => {
    if (!walletAddress) return {};
    try {
      const response = await axios.get(`${config.apiUrl}/portfolio/${walletAddress}${network !== 'all' ? `?network=${network}` : ''}`);
      return response.data.data || {};
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
      return {};
    }
  };

  const networks = [
    { id: 'all', name: 'All Networks', color: 'bg-gray-500' },
    { id: 'ethereum', name: 'Ethereum', color: 'bg-blue-500' },
    { id: 'polygon', name: 'Polygon', color: 'bg-purple-500' },
    { id: 'bsc', name: 'BSC', color: 'bg-yellow-500' },
    { id: 'arbitrum', name: 'Arbitrum', color: 'bg-blue-600' },
    { id: 'optimism', name: 'Optimism', color: 'bg-red-500' },
  ];

  if (!account) {
    return (
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Portfolio
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Connect your wallet to view your portfolio and track your assets across all networks.
            </p>
            <div className="bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700 max-w-md mx-auto">
              <p className="text-gray-400 mb-4">Please connect your wallet to continue</p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Portfolio - boing.finance</title>
        <meta name="description" content="Manage your DeFi portfolio with boing.finance. Track balances, earnings, and performance across all supported blockchains." />
        <meta name="keywords" content="DeFi portfolio, cryptocurrency portfolio, token balances, portfolio tracking, multi-chain portfolio" />
        <meta property="og:title" content="Portfolio - boing.finance" />
        <meta property="og:description" content="Manage your DeFi portfolio with boing.finance." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/portfolio" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Portfolio - boing.finance" />
        <meta name="twitter:description" content="Manage your DeFi portfolio." />
      </Helmet>
      <div className="relative min-h-screen">
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">
                Portfolio
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Track your assets, balances, and earnings across all supported blockchains.
              </p>
            </div>

            {/* Network Filter */}
            <div className="bg-gray-800 rounded-2xl shadow-xl p-6 mb-8 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6">Filter by Network</h2>
              <div className="flex flex-wrap gap-4">
                {networks.map((network) => (
                  <button
                    key={network.id}
                    onClick={() => setSelectedNetwork(network.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedNetwork === network.id
                        ? `${network.color} text-white`
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {network.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Portfolio Content */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-300 mt-4">Loading portfolio...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-400">Failed to load portfolio. Please try again.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Portfolio Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Total Value</h3>
                    <p className="text-3xl font-bold text-blue-400">
                      ${portfolio.totalValue ? parseFloat(portfolio.totalValue).toLocaleString() : '0'}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">Across all networks</p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">24h Change</h3>
                    <p className={`text-3xl font-bold ${portfolio.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {portfolio.change24h >= 0 ? '+' : ''}{portfolio.change24h ? parseFloat(portfolio.change24h).toFixed(2) : '0'}%
                    </p>
                    <p className="text-sm text-gray-400 mt-2">In the last 24 hours</p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Total Tokens</h3>
                    <p className="text-3xl font-bold text-purple-400">
                      {portfolio.totalTokens ? portfolio.totalTokens.toLocaleString() : '0'}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">Unique tokens held</p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Liquidity Provided</h3>
                    <p className="text-3xl font-bold text-yellow-400">
                      ${portfolio.liquidityProvided ? parseFloat(portfolio.liquidityProvided).toLocaleString() : '0'}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">In pools</p>
                  </div>
                </div>

                {/* Token Holdings */}
                <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                  <h2 className="text-2xl font-bold text-white mb-6">Token Holdings</h2>
                  {portfolio.tokens && portfolio.tokens.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Token
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Network
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Balance
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Value
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              24h Change
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                          {portfolio.tokens.map((token, index) => (
                            <tr key={index} className="hover:bg-gray-700 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-white font-bold text-sm">
                                      {token.symbol?.charAt(0) || 'T'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-white font-medium">{token.symbol}</span>
                                    <p className="text-sm text-gray-400">{token.name}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                                {token.network}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-white">
                                {parseFloat(token.balance).toLocaleString()} {token.symbol}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-white">
                                ${parseFloat(token.value || 0).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                                  {token.change24h >= 0 ? '+' : ''}{parseFloat(token.change24h || 0).toFixed(2)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-300">No tokens found in your portfolio.</p>
                    </div>
                  )}
                </div>

                {/* Liquidity Positions */}
                <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                  <h2 className="text-2xl font-bold text-white mb-6">Liquidity Positions</h2>
                  {portfolio.liquidityPositions && portfolio.liquidityPositions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {portfolio.liquidityPositions.map((position, index) => (
                        <div key={index} className="bg-gray-700 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-white">
                              {position.token0Symbol}/{position.token1Symbol}
                            </h3>
                            <span className="text-sm text-gray-400">{position.network}</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-300">Value:</span>
                              <span className="text-white">${parseFloat(position.value || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">APY:</span>
                              <span className="text-green-400">{parseFloat(position.apy || 0).toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Earned:</span>
                              <span className="text-yellow-400">${parseFloat(position.earned || 0).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="mt-4 flex space-x-2">
                            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors">
                              Add More
                            </button>
                            <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors">
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-300">No liquidity positions found.</p>
                      <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                        Add Liquidity
                      </button>
                    </div>
                  )}
                </div>

                {/* Transaction History */}
                <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                  <h2 className="text-2xl font-bold text-white mb-6">Recent Transactions</h2>
                  {portfolio.transactions && portfolio.transactions.length > 0 ? (
                    <div className="space-y-4">
                      {portfolio.transactions.slice(0, 10).map((tx, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              tx.type === 'swap' ? 'bg-blue-500' : 
                              tx.type === 'add' ? 'bg-green-500' : 
                              tx.type === 'remove' ? 'bg-red-500' : 'bg-gray-500'
                            }`}></div>
                            <div>
                              <p className="text-white font-medium capitalize">{tx.type}</p>
                              <p className="text-sm text-gray-400">{tx.network}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-medium">${parseFloat(tx.value || 0).toLocaleString()}</p>
                            <p className="text-sm text-gray-400">{new Date(tx.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-300">No recent transactions found.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <MochiAstronaut position="bottom-left" />
        </div>
      </div>
    </>
  );
} 