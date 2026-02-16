import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import config from '../config';
import { useWallet } from '../contexts/WalletContext';
import { useChainType } from '../contexts/SolanaWalletContext';
import { LiquiditySolanaContent } from '../components/SolanaFeaturePlaceholder';
import { Helmet } from 'react-helmet-async';
import { getNetworkByChainId } from '../config/networks';
import { DexFeatureBanner } from '../components/NetworkSupportBanner';

// Helper function to get API URL
const getApiUrl = () => {
  return config.apiUrl || 'http://localhost:8787';
};

const Liquidity = () => {
  const { isSolana } = useChainType();
  const { isConnected, account } = useWalletConnection();
  const { chainId, switchNetwork } = useWallet();
  const [_settingsOpen, _setSettingsOpen] = useState(false);
  const [_settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('swapSettings');
    return saved ? JSON.parse(saved) : { slippage: 0.5, deadline: 20, darkMode: false };
  });
  const [pairs, setPairs] = useState([]);
  const [loading] = useState(true);

  // Fetch pairs data
  useEffect(() => {
    const fetchPools = async () => {
      try {
        const response = await axios.get(`${getApiUrl()}/api/liquidity/pools`);
        if (response.data.success) {
          setPairs(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch pools:', error);
      }
    };

    fetchPools();
  }, []);

  // Fetch user's liquidity positions - React Query v5 API
  const { data: liquidityData, isLoading: liquidityLoading } = useQuery({
    queryKey: ['user-liquidity', account],
    queryFn: async () => {
      // Fetching user liquidity positions
      if (!account) {
        throw new Error('No wallet connected');
      }
      const response = await axios.get(`${getApiUrl()}/api/liquidity/positions/${account}`);
      const positions = response.data.data || [];
      
      // Calculate summary data from positions
      const totalValue = positions.reduce((sum, pos) => sum + (pos.value || 0), 0);
      const feesEarned = positions.reduce((sum, pos) => sum + (pos.fees || 0), 0);
      const avgAPY = positions.length > 0 
        ? positions.reduce((sum, pos) => sum + (pos.apy || 0), 0) / positions.length 
        : 0;
      
      return {
        totalValue,
        feesEarned,
        avgAPY,
        positions
      };
    },
    refetchInterval: 30000,
    enabled: !!account,
    retry: false
  });

  // Helper functions
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const getChainName = (id) => getNetworkByChainId(id)?.name || (typeof id === 'string' ? id : `Chain ${id}`);

  const handleCollectFees = (_positionId) => {
    toast.success('Fees collected successfully!');
  };

  const handleRemoveLiquidity = (_positionId) => {
    toast.success('Liquidity removed successfully!');
  };

  const handleCreatePair = () => {
    // Implementation needed
  };

  const _handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('liquiditySettings', JSON.stringify(newSettings));
  };

  if (isSolana) return <LiquiditySolanaContent />;

  // Show connect wallet message if not connected
  if (!isConnected || !account) {
    return (
      <>
        <Helmet>
          <title>Add Liquidity | boing.finance — Earn Fees on EVM & Solana</title>
          <meta name="description" content="Add liquidity and earn trading fees on EVM and Solana. Create and manage pools in one place with boing.finance." />
          <meta name="keywords" content="liquidity pools, DeFi, yield farming, AMM, automated market maker, liquidity provision" />
          <meta property="og:title" content="Add Liquidity | boing.finance" />
          <meta property="og:description" content="Add liquidity and earn fees on EVM and Solana." />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://boing.finance/pools" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Liquidity Pools - boing.finance" />
          <meta name="twitter:description" content="Provide liquidity to earn rewards." />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
        </Helmet>
        <div className="relative max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden"><div className="relative z-10"><div className="text-center py-12">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Connect Your Wallet</h1>
              <p className="text-gray-300 mb-8">Connect your wallet to add liquidity and earn fees.</p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200">
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Add Liquidity | boing.finance — Earn Fees on EVM & Solana</title>
        <meta name="description" content="Add liquidity and earn trading fees on EVM and Solana. Create and manage pools in one place with boing.finance." />
        <meta name="keywords" content="liquidity, DeFi, boing finance, EVM, Solana, AMM, earn fees" />
        <meta property="og:title" content="Add Liquidity | boing.finance" />
        <meta property="og:description" content="Add liquidity and earn fees on EVM and Solana." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/liquidity" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Add Liquidity | boing.finance" />
        <meta name="twitter:description" content="Earn fees by adding liquidity on EVM and Solana." />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
      </Helmet>
      <div className="relative min-h-screen">{/* Main Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <DexFeatureBanner featureLabel="Liquidity" currentChainId={chainId} onSwitchNetwork={switchNetwork} />
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 sm:mb-4">
              Liquidity Provision
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
              Provide liquidity to trading pairs and earn a share of trading fees. 
              The more liquidity you provide, the more fees you earn!
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-4 sm:mt-6">
              <button
                disabled
                className="bg-gray-600 text-gray-400 px-3 sm:px-4 py-2 rounded-lg font-medium cursor-not-allowed border border-gray-500 text-sm sm:text-base"
              >
                📊 View All Pools
              </button>
              <button
                disabled
                className="bg-gray-600 text-gray-400 px-3 sm:px-4 py-2 rounded-lg font-medium cursor-not-allowed border border-gray-500 text-sm sm:text-base"
              >
                🔄 Start Trading
              </button>
              <a
                href="/docs"
                className="bg-white/20 hover:bg-white/30 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors border border-white/30 text-sm sm:text-base"
              >
                📖 Learn More
              </a>
            </div>
          </div>

          {/* User Liquidity Summary */}
          {isConnected && liquidityData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Value</p>
                    <p className="text-xl sm:text-2xl font-bold text-white">${formatNumber(liquidityData.totalValue)}</p>
                  </div>
                  <div className="text-green-400">
                    <svg width="20 sm:w-24" height="20 sm:h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Fees Earned</p>
                    <p className="text-xl sm:text-2xl font-bold text-white">${formatNumber(liquidityData.feesEarned)}</p>
                  </div>
                  <div className="text-blue-400">
                    <svg width="20 sm:w-24" height="20 sm:h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Avg APY</p>
                    <p className="text-xl sm:text-2xl font-bold text-white">{liquidityData.avgAPY.toFixed(2)}%</p>
                  </div>
                  <div className="text-purple-400">
                    <svg width="20 sm:w-24" height="20 sm:h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Liquidity Pools */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-0">Liquidity Pools</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Total Pools:</span>
                    <span className="text-sm text-white font-medium">{pairs.length || 0}</span>
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-3 sm:space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gray-700 rounded-lg h-16 sm:h-20"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {pairs.slice(0, 5).map((pair) => (
                      <div
                        key={pair.address}
                        className="bg-gray-750 rounded-lg p-3 sm:p-4 hover:bg-gray-700 transition-colors cursor-pointer"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-xs sm:text-sm">LP</span>
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm sm:text-base">{pair.token0Symbol}/{pair.token1Symbol}</p>
                              <p className="text-gray-400 text-xs sm:text-sm">{getChainName(pair.chainId)}</p>
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-white font-medium text-sm sm:text-base">${formatNumber(pair.tvl)}</p>
                            <p className="text-green-400 text-xs sm:text-sm">{pair.apy}% APY</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 sm:mt-6">
                  <button
                    disabled
                    className="w-full bg-gray-600 text-gray-400 font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg cursor-not-allowed text-center block text-sm sm:text-base"
                  >
                    View All Pools
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Quick Actions</h3>
                <div className="space-y-2 sm:space-y-3">
                  <button
                    disabled
                    className="w-full bg-gray-600 text-gray-400 font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg cursor-not-allowed text-sm sm:text-base"
                  >
                    📊 Create New Pair
                  </button>
                  <a
                    href="/deploy-token"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition duration-200 text-center block text-sm sm:text-base"
                  >
                    🪙 Create Token
                  </a>
                  <button
                    disabled
                    className="w-full bg-gray-600 text-gray-400 font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg cursor-not-allowed text-center text-sm sm:text-base"
                  >
                    🔄 Start Trading
                  </button>
                </div>
              </div>

              {/* Liquidity Info */}
              <div className="bg-gradient-to-br from-green-600/20 to-blue-600/20 rounded-xl p-4 sm:p-6 border border-green-500/30">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">💧</div>
                  <h4 className="text-base sm:text-lg font-semibold text-white mb-2">How Liquidity Works</h4>
                  <p className="text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4">
                    Provide equal values of both tokens to create a trading pair. 
                    Earn fees from every trade in the pool!
                  </p>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>• Earn 0.3% of every trade</p>
                    <p>• Withdraw anytime</p>
                    <p>• No lock-up period</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Positions */}
          {isConnected && liquidityData && (
            <div className="mt-6 sm:mt-8">
              <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Your Liquidity Positions</h3>
                
                {liquidityLoading ? (
                  <div className="space-y-3 sm:space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gray-700 rounded-lg h-20 sm:h-24"></div>
                      </div>
                    ))}
                  </div>
                ) : liquidityData.positions.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {liquidityData.positions.map((position) => (
                      <div key={position.id} className="bg-gray-750 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-xs sm:text-sm">LP</span>
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm sm:text-base">{position.token0Symbol}/{position.token1Symbol}</p>
                              <p className="text-gray-400 text-xs sm:text-sm">{position.network}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                            <div className="text-left sm:text-right">
                              <p className="text-white font-medium text-sm sm:text-base">${formatNumber(position.value)}</p>
                              <p className="text-green-400 text-xs sm:text-sm">{position.apy}% APY</p>
                            </div>
                            
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleCollectFees(position.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium py-1 sm:py-2 px-2 sm:px-3 rounded-lg transition-colors"
                              >
                                Collect
                              </button>
                              <button
                                onClick={() => handleRemoveLiquidity(position.id)}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium py-1 sm:py-2 px-2 sm:px-3 rounded-lg transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-600">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                            <div>
                              <span className="text-gray-400">Fees Earned:</span>
                              <p className="text-white">${formatNumber(position.feesEarned)}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">Share:</span>
                              <p className="text-white">{position.share}%</p>
                            </div>
                            <div>
                              <span className="text-gray-400">Added:</span>
                              <p className="text-white">{new Date(position.addedAt).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">Last Claim:</span>
                              <p className="text-white">{position.lastClaimed ? new Date(position.lastClaimed).toLocaleDateString() : 'Never'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">💧</div>
                    <h4 className="text-lg sm:text-xl font-semibold text-white mb-2">No Liquidity Positions</h4>
                    <p className="text-gray-300 text-sm sm:text-base mb-4">
                      Start providing liquidity to earn trading fees and rewards.
                    </p>
                    <button
                      onClick={handleCreatePair}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
                    >
                      Add Liquidity
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Not Connected State */}
          {!isConnected && (
            <div className="text-center py-8 sm:py-12">
              <div className="text-4xl sm:text-6xl mb-4">🔗</div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">Connect Your Wallet</h3>
              <p className="text-gray-300 text-sm sm:text-base mb-4">
                Connect your wallet to view your liquidity positions and start providing liquidity.
              </p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base">
                Connect Wallet
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Liquidity; 