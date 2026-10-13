import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { apiPath } from '../config';
import { useWallet } from '../contexts/WalletContext';
import { useChainType } from '../contexts/SolanaWalletContext';
import SolanaLiquidityPanel from '../components/SolanaLiquidityPanel';
import { Helmet } from 'react-helmet-async';
import { getNetworkByChainId, BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { DexFeatureBanner } from '../components/NetworkSupportBanner';
import NativeBoingManagePoolPanel from '../components/NativeBoingManagePoolPanel';
import NativeAmmLpVaultPanel from '../components/NativeAmmLpVaultPanel';
import NativeLiquidityPositionsPanel from '../components/NativeLiquidityPositionsPanel';
import EvmLiquidityManagePanel from '../components/EvmLiquidityManagePanel';
import EmptyState from '../components/EmptyState';

const Liquidity = () => {
  const { isSolana } = useChainType();
  const { isConnected, account, connectWallet } = useWalletConnection();
  const { chainId, switchNetwork } = useWallet();
  const [_settingsOpen, _setSettingsOpen] = useState(false);
  const [_settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('swapSettings');
    return saved ? JSON.parse(saved) : { slippage: 0.5, deadline: 20, darkMode: false };
  });
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch pairs data
  useEffect(() => {
    const fetchPools = async () => {
      setLoading(true);
      try {
        const response = await axios.get(apiPath('liquidity/pools'));
        if (response.data.success) {
          setPairs(response.data.data || []);
        } else {
          setPairs([]);
        }
      } catch (error) {
        console.error('Failed to fetch pools:', error);
        // Avoid toast spam on the disconnected empty screen; connected users get a plain next step.
        if (account) {
          toast.error('Couldn’t load pools. Try Browse pools, or refresh.');
        }
        setPairs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
  }, [account]);

  // Fetch user's liquidity positions - React Query v5 API
  const { data: liquidityData, isLoading: liquidityLoading } = useQuery({
    queryKey: ['user-liquidity', account],
    queryFn: async () => {
      // Fetching user liquidity positions
      if (!account) {
        throw new Error('No wallet connected');
      }
      const response = await axios.get(apiPath(`liquidity/positions/${account}`));
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
    staleTime: 60_000,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
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

  const handleCollectFees = () => {
    toast('Fees stay in the pool. Remove LP below to realize them — there is no separate collect.', {
      duration: 5000,
    });
  };

  const _handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('liquiditySettings', JSON.stringify(newSettings));
  };

  if (isSolana) return <SolanaLiquidityPanel />;

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
        </Helmet>
        <div className="relative max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden"><div className="relative z-10"><div className="text-center py-12">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Your liquidity</h1>
              <p className="text-gray-300 mb-8">Connect a wallet to add or remove liquidity.</p>
              <button
                type="button"
                onClick={connectWallet}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
              >
                Connect wallet
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
      </Helmet>
      <div className="relative w-full min-w-0">{/* Main Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <DexFeatureBanner featureLabel="Liquidity" currentChainId={chainId} onSwitchNetwork={switchNetwork} />
          {Number(chainId) === BOING_NATIVE_L1_CHAIN_ID ? (
            <div className="mb-6">
              <NativeBoingManagePoolPanel />
              <NativeLiquidityPositionsPanel />
              <details className="mt-4">
                <summary
                  className="cursor-pointer text-sm font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Advanced — LP vault
                </summary>
                <div className="mt-3">
                  <NativeAmmLpVaultPanel compact />
                </div>
              </details>
            </div>
          ) : (
            isConnected && <EvmLiquidityManagePanel />
          )}
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 sm:mb-4">
              Your liquidity
            </h1>
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
              Add or remove tokens from a pool to earn a share of swap fees.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-3 mt-4 sm:mt-6">
              <Link
                to="/pools"
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors border border-cyan-500/40 text-sm sm:text-base"
              >
                Browse pools
              </Link>
              <Link
                to="/swap"
                className="text-sm underline text-cyan-300 hover:text-cyan-200"
              >
                Swap
              </Link>
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
                ) : pairs.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {pairs.slice(0, 5).map((pair) => (
                      <div
                        key={pair.address}
                        className="bg-gray-750 rounded-lg p-3 sm:p-4 hover:bg-gray-700 transition-colors"
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
                ) : (
                  <EmptyState
                    variant="pools"
                    title="No pools listed here"
                    description="Browse pools to pick a pair, or create one if you are starting fresh."
                    actionHref="/pools"
                    actionLabel="Browse pools"
                  />
                )}
              </div>
            </div>

            {/* Next steps */}
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Need a new pair?</h3>
                <Link
                  to="/create-pool"
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition duration-200 text-center block text-sm sm:text-base"
                >
                  Create pool
                </Link>
                <p className="text-xs text-gray-500 mt-3">
                  Otherwise use the form above to add to an existing pool.
                </p>
              </div>

              <details className="bg-gradient-to-br from-green-600/20 to-blue-600/20 rounded-xl p-4 sm:p-6 border border-green-500/30">
                <summary className="cursor-pointer text-base sm:text-lg font-semibold text-white">
                  How liquidity works
                </summary>
                <p className="text-gray-300 text-xs sm:text-sm mt-3 mb-3">
                  Create a pool to start a new pair, or add to an existing pool with the form above.
                  Fees stay in the pool until you remove liquidity.
                </p>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>• Fees are realized when you remove liquidity</p>
                  <p>• There is no separate “collect fees” step on this path</p>
                </div>
              </details>
            </div>
          </div>

          {/* User Positions */}
          {isConnected && liquidityData && (
            <div className="mt-6 sm:mt-8">
              <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Saved positions</h3>
                <p className="text-sm text-gray-400 mb-4 sm:mb-6">
                  Recent positions from this app. Use the form above to add or remove on-chain.
                </p>
                
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
                                type="button"
                                onClick={handleCollectFees}
                                className="bg-gray-600 hover:bg-gray-500 text-white text-xs sm:text-sm font-medium py-1 sm:py-2 px-2 sm:px-3 rounded-lg transition-colors"
                              >
                                About fees
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
                              <span className="text-gray-400">Fees in pool:</span>
                              <p className="text-white">{position.lastClaimed ? new Date(position.lastClaimed).toLocaleDateString() : 'In pool'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    variant="pools"
                    title="No saved positions yet"
                    description="Create a pool or add liquidity. Positions show here after the app records them."
                    actionHref="/create-pool"
                    actionLabel="Create Pool"
                  />
                )}
              </div>
            </div>
          )}

          {/* Not Connected State — unreachable when early-return above; kept defensive */}
          {!isConnected && (
            <div className="text-center py-8 sm:py-12">
              <div className="text-4xl sm:text-6xl mb-4" aria-hidden>🔗</div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">Connect Your Wallet</h3>
              <p className="text-gray-300 text-sm sm:text-base mb-4">
                Connect your wallet to view your liquidity positions and start providing liquidity.
              </p>
              <button
                type="button"
                onClick={connectWallet}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
              >
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