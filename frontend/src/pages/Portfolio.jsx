import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../contexts/WalletContext';
import { useChainType } from '../contexts/SolanaWalletContext';
import PortfolioSolanaContent from '../components/PortfolioSolanaContent';
import { Helmet } from 'react-helmet-async';
import { ethers } from 'ethers';
import { useBlockchainPools } from '../hooks/useBlockchainPools';
// getUserLiquidityPositions and getUserCreatedPools are not used - using blockchain hooks instead
import externalDexService from '../services/externalDexService';
import portfolioService from '../services/portfolioService';
import theGraphService from '../services/theGraphService';
import alchemyService from '../services/alchemyService';
import { NETWORKS } from '../config/networks';
import { exportPortfolio, exportPortfolioPDF } from '../utils/exportData';
import { notificationService } from '../utils/notifications';
import { PortfolioSummarySkeleton, TokenBalanceSkeleton, ChartSkeleton } from '../components/SkeletonLoader';
import { savePortfolioSnapshot, getPortfolioHistoryForChart } from '../utils/portfolioHistory';
import { saveSnapshot, getSnapshots } from '../services/portfolioSnapshotService';
import SharePortfolioModal from '../components/SharePortfolioModal';
import NFTDetailModal from '../components/NFTDetailModal';
import EmptyState from '../components/EmptyState';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

// MochiAstronaut component

export default function Portfolio() {
  const { isSolana } = useChainType();
  const [searchParams, setSearchParams] = useSearchParams();
  const { account, chainId, connectWallet } = useWallet();
  const [selectedNetwork, setSelectedNetwork] = useState('all');
  const tabFromUrl = searchParams.get('tab');
  const collectionFromUrl = searchParams.get('collection');
  const [activeTab, setActiveTab] = useState(() => {
    if (searchParams.get('collection')) return 'nfts';
    const t = searchParams.get('tab');
    return t && ['overview','tokens','pools','nfts'].includes(t) ? t : 'overview';
  });
  // Sync activeTab when URL query changes (e.g. deep link to /portfolio?tab=nfts&collection=0x...)
  useEffect(() => {
    const tab = searchParams.get('tab');
    const coll = searchParams.get('collection');
    if (coll) setActiveTab('nfts');
    else if (tab && ['overview','tokens','pools','nfts'].includes(tab)) setActiveTab(tab);
  }, [searchParams]);
  const [trackedNetworks, setTrackedNetworks] = useState([chainId || 11155111]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedNft, setSelectedNft] = useState(null);
  const [hideZeroBalances, setHideZeroBalances] = useState(() => {
    try { return JSON.parse(localStorage.getItem('boing_hide_zero_balances') ?? 'true'); } catch { return true; }
  });
  const [groupByNetwork, setGroupByNetwork] = useState(() => {
    try { return JSON.parse(localStorage.getItem('boing_group_by_network') ?? 'false'); } catch { return false; }
  });

  // Blockchain pools hook - hooks must be called unconditionally
  const blockchainPoolsHook = useBlockchainPools();
  
  // Safely extract values with defaults
  const blockchainInitialized = blockchainPoolsHook?.isInitialized || false;
  const _blockchainLoading = blockchainPoolsHook?.isLoading || false;
  const blockchainError = blockchainPoolsHook?.error || null;
  const getBlockchainUserPositions = blockchainPoolsHook?.getUserPositions || (async () => []);
  const getBlockchainCreatedPools = blockchainPoolsHook?.getUserCreatedPools || (async () => []);
  // eslint-disable-next-line no-unused-vars
  const getBlockchainPortfolioValue = blockchainPoolsHook?.getUserPortfolioValue || (async () => 0);
  // eslint-disable-next-line no-unused-vars
  const getBlockchainSepoliaPools = blockchainPoolsHook?.getAllSepoliaPools || (async () => []);

  // Fetch user's liquidity positions - Works in API-only mode
  const { data: userPools, isLoading: poolsLoading, refetch: refetchPools } = useQuery({
    queryKey: ['user-pools-portfolio', account, chainId, blockchainInitialized],
    queryFn: async () => {
      // Fetching user pools
      if (!account) return [];
      
      try {
        let allPositions = [];
        
        // Try blockchain positions if contracts are available
        if (blockchainInitialized) {
          try {
            const yourDexPositions = await getBlockchainUserPositions();
            allPositions = [...(yourDexPositions || [])];
          } catch (error) {
            console.warn('[Portfolio] Blockchain positions failed, using API fallback:', error.message);
          }
        }
        
        // Always try API-based positions (The Graph) for better coverage
        try {
          const networkMap = {
            1: 'ethereum',
            137: 'polygon',
            56: 'binance-smart-chain',
            42161: 'arbitrum',
            10: 'optimism',
            8453: 'base',
            11155111: 'ethereum',
            6913: 'ethereum',
          };
          const network = networkMap[chainId] || 'ethereum';
          const graphPositions = await theGraphService.getUserPositions(account, network);
          if (graphPositions && graphPositions.positions) {
            const formattedPositions = graphPositions.positions.map(pos => ({
              address: pos.pool?.id,
              token0: { symbol: pos.pool?.token0?.symbol, name: pos.pool?.token0?.name },
              token1: { symbol: pos.pool?.token1?.symbol, name: pos.pool?.token1?.name },
              liquidity: pos.liquidity,
              chainId,
              source: 'thegraph'
            }));
            allPositions = [...allPositions, ...formattedPositions];
          }
        } catch (error) {
          // The Graph positions failed
        }
        
        // For Sepolia, also get positions from other DEXs
        if (chainId === 11155111) {
          try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            await externalDexService.initialize(provider);
            const externalPositions = await externalDexService.getUserExternalPositions(account, chainId);
            allPositions = [...allPositions, ...(externalPositions || [])];
          } catch (error) {
            // External DEX positions failed
          }
        }
        
        return allPositions;
      } catch (error) {
        return [];
      }
    },
    refetchInterval: 30000,
    enabled: !!account, // Enable even without blockchain initialization
    retry: 1,
    retryDelay: 1000,
    onError: () => {
      // Silently handle errors
    }
  });

  // Fetch user's created pools from blockchain - React Query v5 API
  const { data: createdPools, isLoading: createdPoolsLoading } = useQuery({
    queryKey: ['created-pools-portfolio', account, chainId, blockchainInitialized],
    queryFn: async () => {
      // Fetching created pools
      if (!account || !blockchainInitialized) return [];
      try {
        return await getBlockchainCreatedPools();
      } catch (error) {
        return [];
      }
    },
    refetchInterval: 30000,
    enabled: !!account && blockchainInitialized,
    retry: 1,
    retryDelay: 1000,
    onError: () => {
      // Silently handle errors
    }
  });

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

  // Networks that support Alchemy NFT API (excludes BSC)
  const nftSupportedChainIds = [1, 137, 42161, 10, 8453, 11155111];

  // Fetch NFTs for connected wallet - React Query v5 API
  const { data: nftData, isLoading: nftsLoading, refetch: refetchNfts } = useQuery({
    queryKey: ['user-nfts', account, chainId, trackedNetworks],
    queryFn: async () => {
      if (!account) return { ownedNfts: [], totalCount: 0 };
      let chainsToFetch = trackedNetworks.filter(id => nftSupportedChainIds.includes(Number(id)));
      if (chainsToFetch.length === 0) chainsToFetch = [chainId && nftSupportedChainIds.includes(Number(chainId)) ? chainId : 1];
      const allNfts = [];
      for (const cid of chainsToFetch) {
        try {
          const res = await alchemyService.getNFTsForOwner(cid, account, { pageSize: 100 });
          const withChain = (res.ownedNfts || []).map(n => ({ ...n, chainId: cid }));
          allNfts.push(...withChain);
        } catch (e) {
          console.warn('[Portfolio] NFT fetch failed for chain', cid, e);
        }
      }
      return { ownedNfts: allNfts, totalCount: allNfts.length };
    },
    refetchInterval: 60000,
    enabled: !!account && activeTab === 'nfts',
    retry: 1
  });

  // Fetch token balances across networks - React Query v5 API
  const { data: tokenBalances, isLoading: balancesLoading, refetch: refetchBalances } = useQuery({
    queryKey: ['token-balances', account, trackedNetworks],
    queryFn: async () => {
      // Fetching token balances
      if (!account) return null;
      return await portfolioService.getMultiNetworkPortfolio(account, trackedNetworks);
    },
    refetchInterval: 60000, // Refetch every minute
    enabled: !!account,
    retry: 2
  });

  // Calculate portfolio summary - Works in API-only mode
  const { data: portfolioSummary = {
    totalValue: 0,
    change24h: 0,
    averageAPY: 0,
    totalTokens: 0,
    liquidityProvided: 0,
    totalPools: 0
  }, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio-summary', account, chainId, filteredUserPools, tokenBalances],
    queryFn: async () => {
      // Calculating portfolio summary
      if (!account) {
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
    refetchInterval: 30000,
    enabled: !!account, // Enable even without blockchain initialization
    retry: 2
  });

  // Sync URL tab param to activeTab
  useEffect(() => {
    if (tabFromUrl && ['overview','tokens','pools','nfts'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Update tracked networks when chainId changes
  useEffect(() => {
    if (chainId && !trackedNetworks.includes(chainId)) {
      setTrackedNetworks([...trackedNetworks, chainId]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setTrackedNetworks functional update not used; trackedNetworks intentionally omitted
  }, [chainId]);

  // Save portfolio snapshot periodically (localStorage + D1 API)
  useEffect(() => {
    if (portfolioSummary && portfolioSummary.totalValue && account) {
      const value = parseFloat(portfolioSummary.totalValue);
      if (value > 0) {
        savePortfolioSnapshot(value);
        saveSnapshot(account, value, chainId).catch(() => {});
      }
    }
  }, [portfolioSummary, account, chainId]);

  // Fetch portfolio history from D1 (Cloudflare) for PnL chart
  const { data: apiHistory } = useQuery({
    queryKey: ['portfolio-history-d1', account],
    queryFn: async () => {
      if (!account) return null;
      const data = await getSnapshots(account, 30);
      return data;
    },
    enabled: !!account,
    staleTime: 60000
  });

  // Get portfolio history for charts (D1 API preferred, localStorage fallback)
  const portfolioHistory7d = useMemo(() => {
    if (apiHistory && apiHistory.length > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const filtered = apiHistory
        .filter((h) => new Date(h.timestamp) >= cutoff)
        .map((h) => ({ date: h.date || new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: h.value, timestamp: h.timestamp }))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      return filtered.length > 0 ? filtered : getPortfolioHistoryForChart(7);
    }
    return getPortfolioHistoryForChart(7);
  }, [apiHistory]);
  const _portfolioHistory30d = useMemo(() => {
    if (apiHistory && apiHistory.length > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const filtered = apiHistory
        .filter((h) => new Date(h.timestamp) >= cutoff)
        .map((h) => ({ date: h.date || new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: h.value, timestamp: h.timestamp }))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      return filtered.length > 0 ? filtered : getPortfolioHistoryForChart(30);
    }
    return getPortfolioHistoryForChart(30);
  }, [apiHistory]);

  const networks = [
    { id: 'all', name: 'All Networks', color: 'bg-gray-500' },
    { id: '1', name: 'Ethereum', color: 'bg-blue-500' },
    { id: '137', name: 'Polygon', color: 'bg-purple-500' },
    { id: '56', name: 'BSC', color: 'bg-yellow-500' },
    { id: '42161', name: 'Arbitrum', color: 'bg-blue-600' },
    { id: '10', name: 'Optimism', color: 'bg-red-500' },
    { id: '11155111', name: 'Sepolia', color: 'bg-gray-500' },
    { id: '6913', name: 'Boing Testnet', color: 'bg-teal-500' },
  ];

  // Persist view preferences
  useEffect(() => {
    localStorage.setItem('boing_hide_zero_balances', JSON.stringify(hideZeroBalances));
  }, [hideZeroBalances]);
  useEffect(() => {
    localStorage.setItem('boing_group_by_network', JSON.stringify(groupByNetwork));
  }, [groupByNetwork]);

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

  if (isSolana) return <PortfolioSolanaContent />;

  if (!account) {
    return (
      <div className="relative z-10 container mx-auto px-4 py-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Portfolio
            </h1>
            <p className="text-xl mb-8" style={{ color: 'var(--text-secondary)' }}>
              Connect your wallet to view your portfolio on EVM and Solana.
            </p>
            <div
              className="rounded-2xl shadow-xl p-8 max-w-md mx-auto"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
              }}
            >
              <p className="text-gray-400 mb-4">Connect your wallet to view balances, liquidity positions, and performance.</p>
              <button
                onClick={() => connectWallet()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full"
              >
                Connect Wallet
              </button>
              <p className="text-gray-500 text-sm mt-4">Or use the Connect Wallet button in the navigation bar</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Portfolio | boing.finance — Track Balances on EVM & Solana</title>
        <meta name="description" content="Track your DeFi portfolio in one place. Balances, NFTs, and performance on EVM and Solana with boing.finance." />
        <meta name="keywords" content="DeFi portfolio, token balances, boing finance, EVM, Solana, portfolio tracking" />
        <meta property="og:title" content="Portfolio | boing.finance" />
        <meta property="og:description" content="Track balances and performance on EVM and Solana." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/portfolio" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Portfolio | boing.finance" />
        <meta name="twitter:description" content="Track your DeFi portfolio on EVM and Solana." />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
      </Helmet>
      <div
        className="relative min-h-screen"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header - Compact */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Portfolio
                  </h1>
                  <p className="text-sm sm:text-base mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Assets and performance
                  </p>
                </div>
                <div className="flex-1 flex flex-wrap justify-center sm:justify-end gap-2">
                  <button
                    onClick={() => {
                      refetchPools();
                      refetchBalances();
                      refetchNfts();
                      toast.success('Portfolio data refreshed');
                    }}
                    disabled={balancesLoading || poolsLoading || nftsLoading}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                    title="Refresh portfolio data"
                  >
                    <svg className={`w-4 h-4 ${(balancesLoading || poolsLoading || nftsLoading) ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                  {(tokenBalances?.balances?.length > 0 || filteredUserPools?.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {tokenBalances?.balances?.length > 0 && (
                        <>
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
                        </>
                      )}
                      <button
                        onClick={() => {
                          exportPortfolioPDF({
                            totalValue: portfolioSummary?.totalValue || '0',
                            totalTokens: portfolioSummary?.totalTokens || 0,
                            totalPools: portfolioSummary?.totalPools || 0,
                            balances: tokenBalances?.balances || []
                          });
                          toast.success('Portfolio exported as PDF!');
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <span>📄</span> Export PDF
                      </button>
                      <button
                        onClick={() => setShowShareModal(true)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <span>🔗</span> Share
                      </button>
                    </div>
                  )}
                  {(!tokenBalances?.balances?.length && !filteredUserPools?.length) && (
                    <span className="text-gray-500 text-sm self-center">Connect wallet & add assets to export</span>
                  )}
                </div>
              </div>
            </div>

            {/* Info Banner - Show when blockchain services not available */}
            {blockchainError && !blockchainInitialized && (
              <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">ℹ️</span>
                  <div className="flex-1">
                    <p className="text-yellow-200 font-medium mb-1">API-Only Mode</p>
                    <p className="text-yellow-300/80 text-sm">
                      DEX contracts not available on this network. Portfolio is showing data from APIs (Alchemy, The Graph, CoinGecko).
                      For full DEX features, switch to Sepolia testnet.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Hero Summary - Total Value + 24h Change */}
            <div
              className="rounded-2xl p-6 sm:p-8 mb-6"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Total Value</p>
                  <p className="text-3xl sm:text-4xl font-bold text-blue-400">
                    ${portfolioSummary?.totalValue ? parseFloat(portfolioSummary.totalValue).toLocaleString() : '0'}
                  </p>
                </div>
                <div className="flex items-baseline gap-4">
                  <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-tertiary)' }}>24h</p>
                    <p className={`text-xl sm:text-2xl font-bold ${portfolioSummary?.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {portfolioSummary?.change24h >= 0 ? '+' : ''}{portfolioSummary?.change24h ? parseFloat(portfolioSummary.change24h).toFixed(2) : '0'}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs + Network Filter - Inline */}
            <div
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl mb-6"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="flex gap-1 overflow-x-auto">
                {[
                  { id: 'overview', label: 'Overview', icon: '📊' },
                  { id: 'tokens', label: 'Tokens', icon: '🪙' },
                  { id: 'pools', label: 'Pools', icon: '🏊' },
                  { id: 'nfts', label: 'Collectibles', icon: '🖼️' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setSearchParams(tab.id === 'overview' ? {} : { tab: tab.id }); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id ? 'shadow-md' : 'hover:opacity-80'
                    }`}
                    style={
                      activeTab === tab.id
                        ? { backgroundColor: 'var(--primary-color)', color: 'var(--bg-primary)' }
                        : { color: 'var(--text-secondary)' }
                    }
                  >
                    <span className="mr-1.5">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {networks.map((network) => (
                  <button
                    key={network.id}
                    onClick={() => setSelectedNetwork(network.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedNetwork === network.id
                        ? `${network.color} text-white`
                        : ''
                    }`}
                    style={selectedNetwork !== network.id ? { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' } : {}}
                  >
                    {network.id === 'all' ? 'All' : network.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Portfolio Content */}
            {portfolioLoading || (balancesLoading && !tokenBalances) ? (
              <div className="space-y-8">
                <PortfolioSummarySkeleton />
                <div className="rounded-2xl shadow-xl p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <TokenBalanceSkeleton count={5} />
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Secondary Stats - Compact (Total Value + 24h in hero above) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div
                    className="rounded-xl p-4"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                  >
                    <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>APY</h3>
                    <p className="text-xl font-bold text-green-400">
                      {portfolioSummary?.averageAPY ? `${portfolioSummary.averageAPY.toFixed(2)}%` : '0.00%'}
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-4"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                  >
                    <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Tokens</h3>
                    <p className="text-xl font-bold text-purple-400">
                      {portfolioSummary?.totalTokens ? portfolioSummary.totalTokens.toLocaleString() : '0'}
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-4"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                  >
                    <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Liquidity</h3>
                    <p className="text-xl font-bold text-yellow-400">
                      ${portfolioSummary?.liquidityProvided ? parseFloat(portfolioSummary.liquidityProvided).toLocaleString() : '0'}
                    </p>
                  </div>
                </div>

                {/* Portfolio Value Chart */}
                <div className="rounded-2xl shadow-xl p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Portfolio Value History</h2>
                  </div>
                  {portfolioHistory7d.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={portfolioHistory7d} isAnimationActive animationDuration={800} animationEasing="ease-out">
                        <defs>
                          <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-40" style={{ stroke: 'var(--border-color)' }} />
                        <XAxis dataKey="date" style={{ stroke: 'var(--text-tertiary)' }} />
                        <YAxis style={{ stroke: 'var(--text-tertiary)' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                          labelStyle={{ color: 'var(--text-primary)' }}
                          formatter={(value) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Portfolio Value']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="var(--accent-cyan)" 
                          fill="url(#portfolioGradient)" 
                          name="Portfolio Value"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <ChartSkeleton height="300px" />
                  )}
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
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                      <h2 className="text-2xl font-bold text-white">Token Balances</h2>
                      <div className="flex flex-wrap items-center gap-2">
                        <label htmlFor="portfolio-hide-zero" className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                          <input
                            id="portfolio-hide-zero"
                            name="hideZeroBalances"
                            type="checkbox"
                            checked={hideZeroBalances}
                            onChange={(e) => setHideZeroBalances(e.target.checked)}
                            className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                          />
                          Hide zero balances
                        </label>
                        <label htmlFor="portfolio-group-network" className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                          <input
                            id="portfolio-group-network"
                            name="groupByNetwork"
                            type="checkbox"
                            checked={groupByNetwork}
                            onChange={(e) => setGroupByNetwork(e.target.checked)}
                            className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                          />
                          Group by network
                        </label>
                        <label htmlFor="portfolio-network-select" className="sr-only">Network</label>
                        <select
                          id="portfolio-network-select"
                          name="trackedNetwork"
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
                      (() => {
                        const filtered = tokenBalances.balances
                          .filter(b => !hideZeroBalances || parseFloat(b.balance) > 0)
                          .sort((a, b) => (b.value || 0) - (a.value || 0));
                        const grouped = groupByNetwork
                          ? filtered.reduce((acc, t) => {
                              const net = NETWORKS[t.chainId]?.name || t.network || `Chain ${t.chainId}`;
                              if (!acc[net]) acc[net] = [];
                              acc[net].push(t);
                              return acc;
                            }, {})
                          : null;
                        return (
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
                            {grouped ? Object.entries(grouped).flatMap(([network, tokens]) => [
                              <tr key={`header-${network}`} className="bg-gray-700/50">
                                <td colSpan={6} className="px-6 py-2 text-sm font-semibold text-cyan-400">{network}</td>
                              </tr>,
                              ...tokens.map((token, index) => (
                                <tr key={`${network}-${token.symbol}-${token.chainId}-${index}`} className="hover:bg-gray-700 transition-colors">
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
                              ))
                            ]) : filtered.map((token, index) => (
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
                        );
                      })()
                    ) : (
                      <EmptyState
                        variant="tokens"
                        title="No token balances found"
                        description="Token balances will appear here once detected on the selected network(s). Try swapping or bridging tokens."
                        actionLabel="Go to Swap"
                        actionHref="/swap"
                      />
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
                      <EmptyState
                        variant="pools"
                        title="No liquidity positions found"
                        description="Add liquidity to a pool to earn trading fees."
                        actionLabel="Add Liquidity"
                        actionHref="/create-pool"
                      />
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
                      <EmptyState
                        variant="pools"
                        title="You haven't created any pools yet"
                        description="Create a new liquidity pool to provide trading pairs."
                        actionLabel="Create Your First Pool"
                        actionHref="/create-pool"
                      />
                    )}
                  </div>
                </div>
                  </>
                )}

                {/* NFTs Tab */}
                {activeTab === 'nfts' && (
                  <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                      <h2 className="text-2xl font-bold text-white">Collectibles</h2>
                      <p className="text-sm text-gray-400">
                        NFTs from supported EVM chains (via Alchemy)
                      </p>
                    </div>
                    {collectionFromUrl && (
                      <div className="mb-4 rounded-lg p-3 bg-blue-900/20 border border-blue-500/30 flex items-center justify-between flex-wrap gap-2">
                        <span className="text-sm text-blue-200">
                          Deep link: showing collection <code className="px-1.5 py-0.5 rounded bg-gray-700 text-blue-300">{collectionFromUrl.slice(0, 10)}...{collectionFromUrl.slice(-8)}</code>
                        </span>
                        <button
                          type="button"
                          onClick={() => setSearchParams({ tab: 'nfts' })}
                          className="text-xs text-blue-300 hover:text-blue-200"
                        >
                          Show all
                        </button>
                      </div>
                    )}
                    {nftsLoading ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[...Array(10)].map((_, i) => (
                          <div key={i} className="bg-gray-700 rounded-xl h-48 animate-pulse" />
                        ))}
                      </div>
                    ) : nftData?.ownedNfts?.length > 0 ? (
                      (() => {
                        const nftsList = collectionFromUrl
                          ? nftData.ownedNfts.filter((nft) => (nft?.contract?.address || '').toLowerCase() === collectionFromUrl.toLowerCase())
                          : nftData.ownedNfts;
                        if (collectionFromUrl && nftsList.length === 0) {
                          return (
                            <EmptyState
                              variant="nfts"
                              title="No NFTs from this collection"
                              description={`You don't own any NFTs from collection ${collectionFromUrl.slice(0, 10)}... in your wallet.`}
                              actionLabel="Show all NFTs"
                              actionHref="/portfolio?tab=nfts"
                            />
                          );
                        }
                        return (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {nftsList.map((nft, idx) => {
                          const img = nft?.media?.[0]?.gateway || nft?.media?.[0]?.raw || nft?.image?.cachedUrl || nft?.image?.originalUrl || nft?.contract?.openSea?.imageUrl;
                          const name = nft?.title || nft?.contract?.name || `#${nft?.tokenId}`;
                          const collection = nft?.contract?.name || 'Unknown';
                          const explorer = NETWORKS[nft?.chainId]?.explorer || 'https://etherscan.io';
                          const nftWithExplorer = { ...nft, explorer };
                          return (
                            <button
                              key={`${nft.contract?.address}-${nft.tokenId}-${idx}`}
                              type="button"
                              onClick={() => setSelectedNft(nftWithExplorer)}
                              className="interactive-card group bg-gray-700 rounded-xl overflow-hidden border border-gray-600 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 text-left w-full"
                            >
                              <div className="aspect-square bg-gray-600 relative overflow-hidden">
                                {img ? (
                                  <img
                                    src={img}
                                    alt={name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23374151" width="100" height="100"/><text x="50" y="55" font-size="12" fill="%239ca3af" text-anchor="middle">NFT</text></svg>';
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">🖼️</div>
                                )}
                              </div>
                              <div className="p-3">
                                <p className="text-white font-medium truncate" title={name}>{name}</p>
                                <p className="text-gray-400 text-sm truncate" title={collection}>{collection}</p>
                                <p className="text-gray-500 text-xs mt-1">{NETWORKS[nft?.chainId]?.name || `Chain ${nft?.chainId}`}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                        );
                      })()
                    ) : (
                      <EmptyState
                        variant="nfts"
                        title="No collectibles found"
                        description="NFTs on supported EVM chains will appear here."
                        secondaryLabel="View Bridge"
                        secondaryHref="/bridge"
                      />
                    )}
                  </div>
                )}

              </div>
            )}
          </div>        </div>
      </div>
      
      {/* Share Portfolio Modal */}
      {selectedNft && (
        <NFTDetailModal nft={selectedNft} onClose={() => setSelectedNft(null)} />
      )}
      <SharePortfolioModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        portfolioData={{
          totalValue: portfolioSummary?.totalValue || '0',
          totalTokens: portfolioSummary?.totalTokens || 0,
          totalPools: portfolioSummary?.totalPools || 0,
          balances: tokenBalances?.balances || []
        }}
      />
    </>
  );
}