import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../contexts/WalletContext';
import { Helmet } from 'react-helmet-async';
import { ethers } from 'ethers';
import { useBlockchainPools } from '../hooks/useBlockchainPools';
import { getUserLiquidityPositions, getUserCreatedPools } from '../services/poolService';
import externalDexService from '../services/externalDexService';
import portfolioService from '../services/portfolioService';
import { NETWORKS } from '../config/networks';
import { exportPortfolio } from '../utils/exportData';
import { notificationService } from '../utils/notifications';
import toast from 'react-hot-toast';

// MochiAstronaut component

export default function Portfolio() {
  const { account, chainId } = useWallet();
  const [selectedNetwork, setSelectedNetwork] = useState('all');
  const [activeTab, setActiveTab] = useState('overview'); // overview, tokens, pools
  const [trackedNetworks, setTrackedNetworks] = useState([chainId || 11155111]);

  // Blockchain pools hook
  const blockchainPoolsHook = useBlockchainPools();
  const {
    isInitialized: blockchainInitialized = false,
    isLoading: blockchainLoading = false,
    error: blockchainError = null,
    getUserPositions: getBlockchainUserPositions = async () => [],
    getUserCreatedPools: getBlockchainCreatedPools = async () => [],
    getUserPortfolioValue: getBlockchainPortfolioValue = async () => 0,
    getAllSepoliaPools: getBlockchainSepoliaPools = async () => []
  } = blockchainPoolsHook || {};

  // Fetch user's liquidity positions from blockchain
  const { data: userPools, isLoading: poolsLoading } = useQuery(
    ['user-pools-portfolio', account, chainId, blockchainInitialized],
    async () => {
      if (!account || !blockchainInitialized) return [];
      
      // Get positions from your DEX
      const yourDexPositions = await getBlockchainUserPositions();
      
      // For Sepolia, also get positions from other DEXs
      let allPositions = [...yourDexPositions];
      
      if (chainId === 11155111) { // Sepolia
        try {
          // Initialize external DEX service
          const provider = new ethers.BrowserProvider(window.ethereum);
          await externalDexService.initialize(provider);
          
          // Get positions from external DEXs
          const externalPositions = await externalDexService.getUserExternalPositions(account, chainId);
          allPositions = [...allPositions, ...externalPositions];
          
          if (externalPositions.length > 0) {
            console.log(`Found ${externalPositions.length} external DEX positions`);
          }
        } catch (error) {
          console.warn('Failed to fetch external DEX positions:', error);
        }
      }
      
      return allPositions;
    },
    {
      refetchInterval: 30000,
      enabled: !!account && blockchainInitialized,
      retry: 1, // Reduce retries
      retryDelay: 1000,
      onError: (error) => {
        console.error('User pools portfolio query error:', error);
        // Don't throw - let the component handle empty state
      }
    }
  );

  // Fetch user's created pools from blockchain
  const { data: createdPools, isLoading: createdPoolsLoading } = useQuery(
    ['created-pools-portfolio', account, chainId, blockchainInitialized],
    async () => {
      if (!account || !blockchainInitialized) return [];
      try {
        return await getBlockchainCreatedPools();
      } catch (error) {
        console.error('Error fetching created pools:', error);
        return [];
      }
    },
    {
      refetchInterval: 30000,
      enabled: !!account && blockchainInitialized,
      retry: 1,
      retryDelay: 1000,
      onError: (error) => {
        console.error('Created pools query error:', error);
      }
    }
  );

  // Filter pools by selected network
  const filteredUserPools = useMemo(() => {
    if (!userPools) return [];
    return userPools.filter(pool => {
      if (selectedNetwork === 'all') return true;
      return pool.chainId?.toString() === selectedNetwork;
    });
  }, [userPools, selectedNetwork]);

  const filteredCreatedPools = useMemo(() => {
    if (!createdPools) return [];
    return createdPools.filter(pool => {
      if (selectedNetwork === 'all') return true;
      return pool.chainId?.toString() === selectedNetwork;
    });
  }, [createdPools, selectedNetwork]);

  // Fetch token balances across networks
  const { data: tokenBalances, isLoading: balancesLoading } = useQuery(
    ['token-balances', account, trackedNetworks],
    async () => {
      if (!account) return null;
      return await portfolioService.getMultiNetworkPortfolio(account, trackedNetworks);
    },
    {
      refetchInterval: 60000, // Refetch every minute
      enabled: !!account,
      retry: 2
    }
  );

  // Calculate portfolio summary from blockchain data
  const { data: portfolioSummary = {
    totalValue: 0,
    change24h: 0,
    averageAPY: 0,
    totalTokens: 0,
    liquidityProvided: 0,
    totalPools: 0
  }, isLoading: portfolioLoading } = useQuery(
    ['portfolio-summary', account, chainId, blockchainInitialized, filteredUserPools],
    async () => {
      if (!account || !blockchainInitialized || !filteredUserPools) {
        return {
          totalValue: 0,
          change24h: 0,
          averageAPY: 0,
          totalTokens: 0,
          liquidityProvided: 0,
          totalPools: 0
        };
      }

      try {
        // Calculate summary from filtered user positions
        let totalValue = 0;
        let totalAPY = 0;
        let totalPools = filteredUserPools.length;
        let uniqueTokens = new Set();
        let liquidityProvided = 0;

        filteredUserPools.forEach(pool => {
          // Add token amounts to total value (simplified calculation)
          const token0Value = parseFloat(pool.token0?.formattedAmount || 0);
          const token1Value = parseFloat(pool.token1?.formattedAmount || 0);
          totalValue += token0Value + token1Value;
          
          // Track unique tokens
          if (pool.token0?.address) uniqueTokens.add(pool.token0.address);
          if (pool.token1?.address) uniqueTokens.add(pool.token1.address);
          
          // Add APY
          if (pool.apy) totalAPY += pool.apy;
          
          // Add liquidity provided
          liquidityProvided += token0Value + token1Value;
        });

        const averageAPY = totalPools > 0 ? totalAPY / totalPools : 0;

        // Add token balances value if available
        let tokenValue = 0;
        if (tokenBalances && tokenBalances.totalValue) {
          tokenValue = tokenBalances.totalValue;
        }

        return {
          totalValue: (totalValue + tokenValue).toFixed(2),
          change24h: 0, // TODO: Calculate 24h change
          averageAPY: averageAPY,
          totalTokens: uniqueTokens.size + (tokenBalances?.balances?.length || 0),
          liquidityProvided: liquidityProvided.toFixed(2),
          totalPools: totalPools
        };
      } catch (error) {
        console.error('Failed to calculate portfolio summary:', error);
        return {
          totalValue: 0,
          change24h: 0,
          averageAPY: 0,
          totalTokens: 0,
          liquidityProvided: 0,
          totalPools: 0
        };
      }
    },
    {
      refetchInterval: 30000,
      enabled: !!account && blockchainInitialized && !!filteredUserPools,
      retry: 2
    }
  );

  // Update tracked networks when chainId changes
  useEffect(() => {
    if (chainId && !trackedNetworks.includes(chainId)) {
      setTrackedNetworks([...trackedNetworks, chainId]);
    }
  }, [chainId]);

  const networks = [
    { id: 'all', name: 'All Networks', color: 'bg-gray-500' },
    { id: '1', name: 'Ethereum', color: 'bg-blue-500' },
    { id: '137', name: 'Polygon', color: 'bg-purple-500' },
    { id: '56', name: 'BSC', color: 'bg-yellow-500' },
    { id: '42161', name: 'Arbitrum', color: 'bg-blue-600' },
    { id: '10', name: 'Optimism', color: 'bg-red-500' },
    { id: '11155111', name: 'Sepolia', color: 'bg-gray-500' },
  ];

  // Send portfolio update notifications
  useEffect(() => {
    if (!portfolioSummary || !account) return;
    
    const notificationSettings = JSON.parse(localStorage.getItem('boing_notification_settings') || '{"portfolioUpdates": false}');
    if (!notificationSettings.portfolioUpdates) return;

    // Only notify if there's a significant change (more than 5%)
    const lastValue = parseFloat(localStorage.getItem('boing_last_portfolio_value') || '0');
    const currentValue = parseFloat(portfolioSummary.totalValue || '0');
    
    if (lastValue > 0 && Math.abs(currentValue - lastValue) / lastValue > 0.05) {
      const change24h = portfolioSummary.change24h || 0;
      notificationService.notifyPortfolioUpdate(currentValue, change24h);
    }
    
    localStorage.setItem('boing_last_portfolio_value', currentValue.toString());
  }, [portfolioSummary, account]);

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
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
      </Helmet>
      <div className="relative min-h-screen">
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1"></div>
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white">
                    Portfolio
                  </h1>
                </div>
                <div className="flex-1 flex justify-end">
                  {tokenBalances && tokenBalances.balances && tokenBalances.balances.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const portfolioData = tokenBalances.balances.map(token => ({
                            name: token.name || '',
                            symbol: token.symbol || '',
                            network: token.network || '',
                            balance: token.balance || '0',
                            usdValue: token.value || 0,
                            price: token.price || 0,
                            address: token.address || ''
                          }));
                          exportPortfolio(portfolioData, 'csv');
                          toast.success('Portfolio exported as CSV!');
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <span>📥</span> Export CSV
                      </button>
                      <button
                        onClick={() => {
                          const portfolioData = tokenBalances.balances.map(token => ({
                            name: token.name || '',
                            symbol: token.symbol || '',
                            network: token.network || '',
                            balance: token.balance || '0',
                            usdValue: token.value || 0,
                            price: token.price || 0,
                            address: token.address || ''
                          }));
                          exportPortfolio(portfolioData, 'json');
                          toast.success('Portfolio exported as JSON!');
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <span>📥</span> Export JSON
                      </button>
                    </div>
                  )}
                </div>
              </div>
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
            {portfolioLoading || blockchainLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-300 mt-4">Loading portfolio...</p>
              </div>
            ) : blockchainError ? (
              <div className="text-center py-12">
                <p className="text-red-400">Failed to load portfolio. Please try again.</p>
                <p className="text-gray-400 mt-2">{blockchainError}</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Portfolio Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Total Value</h3>
                    <p className="text-3xl font-bold text-blue-400">
                      ${portfolioSummary?.totalValue ? parseFloat(portfolioSummary.totalValue).toLocaleString() : '0'}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">Across all networks</p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">24h Change</h3>
                    <p className={`text-3xl font-bold ${portfolioSummary?.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {portfolioSummary?.change24h >= 0 ? '+' : ''}{portfolioSummary?.change24h ? parseFloat(portfolioSummary.change24h).toFixed(2) : '0'}%
                    </p>
                    <p className="text-sm text-gray-400 mt-2">In the last 24 hours</p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Average APY</h3>
                    <p className="text-3xl font-bold text-green-400">
                      {portfolioSummary?.averageAPY ? `${portfolioSummary.averageAPY.toFixed(2)}%` : '0.00%'}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">From liquidity positions</p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Total Tokens</h3>
                    <p className="text-3xl font-bold text-purple-400">
                      {portfolioSummary?.totalTokens ? portfolioSummary.totalTokens.toLocaleString() : '0'}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">Unique tokens held</p>
                  </div>
                  
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Liquidity Provided</h3>
                    <p className="text-3xl font-bold text-yellow-400">
                      ${portfolioSummary?.liquidityProvided ? parseFloat(portfolioSummary.liquidityProvided).toLocaleString() : '0'}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">In pools</p>
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                  <>
                {/* Overview Content - Summary Cards Already Shown Above */}
                {/* Quick Stats */}
                <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                  <h2 className="text-2xl font-bold text-white mb-6">Quick Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Top Token Balances</h3>
                      {tokenBalances && tokenBalances.balances && tokenBalances.balances.length > 0 ? (
                        <div className="space-y-2">
                          {tokenBalances.balances
                            .filter(b => parseFloat(b.balance) > 0)
                            .sort((a, b) => b.value - a.value)
                            .slice(0, 5)
                            .map((token, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">{token.symbol?.charAt(0) || 'T'}</span>
                                  </div>
                                  <span className="text-white text-sm">{token.symbol}</span>
                                </div>
                                <span className="text-white font-semibold">
                                  ${token.value ? token.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00'}
                                </span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">No token balances detected</p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Liquidity Positions</h3>
                      {filteredUserPools && filteredUserPools.length > 0 ? (
                        <div className="space-y-2">
                          {filteredUserPools.slice(0, 5).map((pool, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                              <span className="text-white text-sm">
                                {pool.token0?.symbol}/{pool.token1?.symbol}
                              </span>
                              <span className="text-green-400 text-sm font-semibold">
                                {pool.apy ? `${pool.apy.toFixed(2)}%` : '0%'} APY
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">No liquidity positions</p>
                      )}
                    </div>
                  </div>
                </div>
                  </>
                )}

                {/* Tokens Tab */}
                {activeTab === 'tokens' && (
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-white">Token Balances</h2>
                      <div className="flex items-center space-x-2">
                        <select
                          value={trackedNetworks[0] || chainId || 11155111}
                          onChange={(e) => setTrackedNetworks([parseInt(e.target.value)])}
                          className="px-3 py-2 rounded-lg bg-gray-700 text-white text-sm"
                        >
                          {Object.entries(NETWORKS).map(([id, network]) => (
                            <option key={id} value={id}>{network.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const allNetworks = Object.keys(NETWORKS).map(Number);
                            setTrackedNetworks(allNetworks);
                          }}
                          className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
                        >
                          Track All Networks
                        </button>
                      </div>
                    </div>

                    {balancesLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-gray-300 mt-4">Loading token balances...</p>
                      </div>
                    ) : tokenBalances && tokenBalances.balances && tokenBalances.balances.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                          <thead className="bg-gray-700">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Token</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Network</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Balance</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Price</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Value</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">24h Change</th>
                            </tr>
                          </thead>
                          <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {tokenBalances.balances
                              .filter(b => parseFloat(b.balance) > 0)
                              .sort((a, b) => b.value - a.value)
                              .map((token, index) => (
                                <tr key={index} className="hover:bg-gray-700 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-white font-bold text-sm">
                                          {token.symbol?.charAt(0) || 'T'}
                                        </span>
                                      </div>
                                      <div>
                                        <div className="text-white font-medium">{token.symbol}</div>
                                        <div className="text-sm text-gray-400">{token.name}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                                    {NETWORKS[token.chainId]?.name || `Chain ${token.chainId}`}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-white">
                                    {parseFloat(token.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })} {token.symbol}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-white">
                                    ${token.price ? token.price.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0.00'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-white font-semibold">
                                    ${token.value ? token.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00'}
                                  </td>
                                  <td className={`px-6 py-4 whitespace-nowrap ${token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {token.priceChange24h !== undefined ? (
                                      <>
                                        {token.priceChange24h >= 0 ? '+' : ''}
                                        {token.priceChange24h.toFixed(2)}%
                                      </>
                                    ) : 'N/A'}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                          <tfoot className="bg-gray-700">
                            <tr>
                              <td colSpan="4" className="px-6 py-4 text-right font-semibold text-white">
                                Total Portfolio Value:
                              </td>
                              <td colSpan="2" className="px-6 py-4 text-left font-bold text-blue-400">
                                ${tokenBalances.totalValue ? tokenBalances.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00'}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-4">💼</div>
                        <p className="text-gray-300 mb-2">No token balances found</p>
                        <p className="text-sm text-gray-400">
                          Token balances will appear here once detected on the selected network(s).
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Pools Tab */}
                {activeTab === 'pools' && (
                  <>
                {/* My Pools */}
                <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">My Pools</h2>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => window.location.href = '/pools'}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                      >
                        View All Pools
                      </button>
                      <button 
                        onClick={() => window.location.href = '/create-pool'}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                      >
                        Create Pool
                      </button>
                    </div>
                  </div>

                  {/* User Liquidity Positions */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-4">Liquidity Positions</h3>
                    {poolsLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="bg-gray-700 rounded-xl p-4 animate-pulse">
                            <div className="h-4 bg-gray-600 rounded mb-3"></div>
                            <div className="h-3 bg-gray-600 rounded mb-2"></div>
                            <div className="h-3 bg-gray-600 rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : filteredUserPools && filteredUserPools.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredUserPools.slice(0, 6).map((pool, index) => (
                          <div key={index} className="bg-gray-700 rounded-xl p-4 border border-gray-600">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold text-xs">
                                    {pool.token0?.symbol?.charAt(0) || 'T'}
                                  </span>
                                </div>
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold text-xs">
                                    {pool.token1?.symbol?.charAt(0) || 'T'}
                                  </span>
                                </div>
                                <h4 className="text-white font-medium">
                                  {pool.token0?.symbol}/{pool.token1?.symbol}
                                </h4>
                              </div>
                              <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">
                                {pool.fee ? `${(pool.fee * 100).toFixed(2)}%` : '0.3%'}
                              </span>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Your Share:</span>
                                <span className="text-white">
                                  {pool.userShare ? `${(pool.userShare * 100).toFixed(2)}%` : 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">LP Tokens:</span>
                                <span className="text-white">
                                  {pool.lpBalance ? parseFloat(ethers.formatUnits(pool.lpBalance, 18)).toFixed(4) : 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Token 0:</span>
                                <span className="text-white">
                                  {parseFloat(pool.token0?.formattedAmount || 0).toFixed(4)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Token 1:</span>
                                <span className="text-white">
                                  {parseFloat(pool.token1?.formattedAmount || 0).toFixed(4)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">APY:</span>
                                <span className="text-green-400 font-medium">
                                  {pool.apy ? `${pool.apy.toFixed(2)}%` : '0.00%'}
                                </span>
                              </div>
                            </div>
                            <div className="mt-3 flex space-x-2">
                              <button 
                                onClick={() => window.location.href = `/pools`}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 rounded transition-colors"
                              >
                                Manage
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-700 rounded-lg">
                        <p className="text-gray-300 mb-3">No liquidity positions found.</p>
                        <button 
                          onClick={() => window.location.href = '/create-pool'}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                        >
                          Add Liquidity
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Created Pools */}
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Pools You Created</h3>
                    {createdPoolsLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="bg-gray-700 rounded-xl p-4 animate-pulse">
                            <div className="h-4 bg-gray-600 rounded mb-3"></div>
                            <div className="h-3 bg-gray-600 rounded mb-2"></div>
                            <div className="h-3 bg-gray-600 rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : filteredCreatedPools && filteredCreatedPools.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCreatedPools.slice(0, 6).map((pool, index) => (
                          <div key={index} className="bg-gray-700 rounded-xl p-4 border border-gray-600">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold text-xs">
                                    {pool.token0?.symbol?.charAt(0) || 'T'}
                                  </span>
                                </div>
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold text-xs">
                                    {pool.token1?.symbol?.charAt(0) || 'T'}
                                  </span>
                                </div>
                                <h4 className="text-white font-medium">
                                  {pool.token0?.symbol}/{pool.token1?.symbol}
                                </h4>
                              </div>
                              <span className="text-xs text-purple-400 bg-purple-900 px-2 py-1 rounded">
                                Created
                              </span>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Total Liquidity:</span>
                                <span className="text-white">
                                  ${pool.totalLiquidity ? parseFloat(pool.totalLiquidity).toLocaleString() : '0'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">24h Volume:</span>
                                <span className="text-white">
                                  ${pool.volume24h ? parseFloat(pool.volume24h).toLocaleString() : '0'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Fee:</span>
                                <span className="text-white">
                                  {pool.fee ? `${(pool.fee * 100).toFixed(2)}%` : '0.3%'}
                                </span>
                              </div>
                            </div>
                            <div className="mt-3 flex space-x-2">
                              <button 
                                onClick={() => window.location.href = `/pools`}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium py-2 px-3 rounded transition-colors"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-700 rounded-lg">
                        <p className="text-gray-300 mb-3">You haven't created any pools yet.</p>
                        <button 
                          onClick={() => window.location.href = '/create-pool'}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                        >
                          Create Your First Pool
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                  </>
                )}
              </div>
            )}
          </div></div>
      </div>
    </>
  );
} 