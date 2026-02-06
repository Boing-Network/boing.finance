import React, { useState, useEffect, useMemo } from 'react';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useNetwork } from '../hooks/useNetwork';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { getApiUrl } from '../config';
import { getSupportedNetworks } from '../config/networks';
import TokenManagementModal from '../components/TokenManagementModal';
import EmptyState from '../components/EmptyState';
import { useAchievements } from '../contexts/AchievementContext';

// Add AnimatedBackground and BoingAstronaut components

export default function Bridge() {
  const { account } = useWalletConnection();
  const { network } = useNetwork();
  const { record: recordAchievement } = useAchievements() || {};

  // Bridge state
  const [amount, setAmount] = useState('');
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('ETH');
  const [fromChain, setFromChain] = useState(1); // Ethereum
  const [toChain, setToChain] = useState(137); // Polygon
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeTransactions, setBridgeTransactions] = useState([]);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [selectingToken, setSelectingToken] = useState(null); // 'from' or 'to'
  const [tokens, setTokens] = useState([]);
  const [estimatedFee, setEstimatedFee] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState('5-10 minutes');
  const [bridgeRoute, setBridgeRoute] = useState(null);

  // Supported networks from central config (config/networks.js) – add new chains there
  const supportedNetworks = useMemo(() =>
    getSupportedNetworks().map((n) => ({
      id: n.chainId,
      name: n.name,
      symbol: n.symbol,
      icon: '🔗',
      rpcUrl: n.rpcUrl
    })),
    []
  );

  // Load tokens from API
  useEffect(() => {
    const loadTokens = async () => {
      try {
        const apiUrl = getApiUrl();
        const response = await axios.get(`${apiUrl}/tokens`);
        if (response.data.success && response.data.data.length > 0) {
          setTokens(response.data.data);
        } else {
          // Set default tokens if API fails
          setTokens([
            { symbol: 'ETH', name: 'Ethereum', logo: '🔵', price: 2000 },
            { symbol: 'USDC', name: 'USD Coin', logo: '🔵', price: 1 },
            { symbol: 'USDT', name: 'Tether', logo: '🟢', price: 1 },
            { symbol: 'WBTC', name: 'Wrapped Bitcoin', logo: '🟠', price: 40000 },
            { symbol: 'MATIC', name: 'Polygon', logo: '🟣', price: 0.8 },
            { symbol: 'BNB', name: 'Binance Coin', logo: '🟡', price: 300 }
          ]);
        }
      } catch (error) {
        console.error('Failed to load tokens:', error.message);
        // Set default tokens as fallback
        setTokens([
          { symbol: 'ETH', name: 'Ethereum', logo: '🔵', price: 2000 },
          { symbol: 'USDC', name: 'USD Coin', logo: '🔵', price: 1 },
          { symbol: 'USDT', name: 'Tether', logo: '🟢', price: 1 },
          { symbol: 'WBTC', name: 'Wrapped Bitcoin', logo: '🟠', price: 40000 },
          { symbol: 'MATIC', name: 'Polygon', logo: '🟣', price: 0.8 },
          { symbol: 'BNB', name: 'Binance Coin', logo: '🟡', price: 300 }
        ]);
      }
    };

    loadTokens();
  }, []);

  // Calculate bridge fee and time
  useEffect(() => {
    if (amount && fromChain && toChain) {
      // Calculate fee based on networks and amount
      const baseFee = 0.001; // Base fee in ETH
      const amountFee = parseFloat(amount) * 0.0001; // 0.01% of amount
      const totalFee = baseFee + amountFee;
      setEstimatedFee(totalFee);

      // Estimate time based on networks
      const timeEstimates = {
        '1-137': '5-10 minutes', // Ethereum to Polygon
        '1-56': '10-15 minutes',  // Ethereum to BSC
        '1-42161': '5-10 minutes', // Ethereum to Arbitrum
        '137-1': '10-15 minutes',  // Polygon to Ethereum
        '56-1': '15-20 minutes',   // BSC to Ethereum
        '42161-1': '10-15 minutes' // Arbitrum to Ethereum
      };
      
      const route = `${fromChain}-${toChain}`;
      setEstimatedTime(timeEstimates[route] || '10-15 minutes');
      
      // Set bridge route for UI
      setBridgeRoute({
        from: supportedNetworks.find(n => n.id === fromChain),
        to: supportedNetworks.find(n => n.id === toChain)
      });
    }
  }, [amount, fromChain, toChain, supportedNetworks]);

  // Load bridge transactions
  useEffect(() => {
    const loadTransactions = async () => {
      if (!account) return;
      
      try {
        const apiUrl = getApiUrl();
        const response = await axios.get(`${apiUrl}/bridge/transactions/${account}`);
        if (response.data.success) {
          setBridgeTransactions(response.data.data || []);
        }
      } catch (error) {
        console.error('Failed to load bridge transactions:', error);
        // Set mock data for demo
        setBridgeTransactions([
          {
            id: '1',
            fromChain: 1,
            toChain: 137,
            fromToken: 'ETH',
            toToken: 'ETH',
            amount: '0.5',
            status: 'completed',
            timestamp: Date.now() - 3600000,
            txHash: '0x123...abc'
          },
          {
            id: '2',
            fromChain: 137,
            toChain: 1,
            fromToken: 'USDC',
            toToken: 'USDC',
            amount: '100',
            status: 'pending',
            timestamp: Date.now() - 1800000,
            txHash: '0x456...def'
          }
        ]);
      }
    };

    loadTransactions();
  }, [account]);

  const handleBridge = async () => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (fromChain === toChain) {
      toast.error('Source and destination chains must be different');
      return;
    }

    setIsBridging(true);
    
    try {
      // Simulate bridge transaction
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Add transaction to list
      const newTransaction = {
        id: Date.now().toString(),
        fromChain,
        toChain,
        fromToken,
        toToken,
        amount,
        status: 'pending',
        timestamp: Date.now(),
        txHash: `0x${Math.random().toString(16).substr(2, 8)}...`
      };
      
      setBridgeTransactions(prev => [newTransaction, ...prev]);
      
      toast.success('Bridge transaction initiated! Check your transaction history for updates.');
      recordAchievement?.(account, 'bridge', 'first_bridge');
      setAmount('');
      
    } catch (error) {
      toast.error('Bridge transaction failed');
    } finally {
      setIsBridging(false);
    }
  };

  const handleTokenSelect = (token) => {
    if (selectingToken === 'from') {
      setFromToken(token.symbol);
    } else if (selectingToken === 'to') {
      setToToken(token.symbol);
    }
    setTokenModalOpen(false);
  };

  const openTokenModal = (tokenType) => {
    setSelectingToken(tokenType);
    setTokenModalOpen(true);
  };

  const switchChains = () => {
    const tempChain = fromChain;
    setFromChain(toChain);
    setToChain(tempChain);
  };

  const getTokenLogo = (symbol) => {
    const token = tokens.find(t => t.symbol === symbol);
    return token?.logo || '🔵';
  };

  const getTokenName = (symbol) => {
    const token = tokens.find(t => t.symbol === symbol);
    return token?.name || symbol;
  };

  const getNetworkInfo = (chainId) => {
    return supportedNetworks.find(n => n.id === chainId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // eslint-disable-next-line no-unused-vars
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return (
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'pending':
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
        );
      case 'failed':
        return (
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>Cross-Chain Bridge - boing.finance</title>
        <meta name="description" content="Bridge tokens between different blockchains with boing.finance. Secure, fast, and cost-effective cross-chain transfers." />
        <meta name="keywords" content="cross-chain bridge, blockchain bridge, token bridge, DeFi bridge, multi-chain" />
        <meta property="og:title" content="Cross-Chain Bridge - boing.finance" />
        <meta property="og:description" content="Bridge tokens between different blockchains with boing.finance." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/bridge" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Cross-Chain Bridge - boing.finance" />
        <meta name="twitter:description" content="Bridge tokens between different blockchains." />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
      </Helmet>
      <div className="relative min-h-screen">{/* Main Content Container */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 sm:mb-4">
              Cross-Chain Bridge
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
              Transfer tokens seamlessly between different blockchains
            </p>
          </div>

          {/* Bridge Interface */}
          <div id="bridge-form" className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Bridge Tokens</h2>

            {/* Network Selection */}
            <div className="space-y-4 sm:space-y-6 mb-4 sm:mb-6">
              {/* From Network */}
              <div className="bg-gray-750 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm sm:text-base">From Network</span>
                  <span className="text-xs sm:text-sm text-gray-500">Balance: 0.0</span>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={fromChain}
                    onChange={(e) => setFromChain(parseInt(e.target.value))}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  >
                    {supportedNetworks.map((network) => (
                      <option key={network.id} value={network.id}>
                        {network.icon} {network.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Switch Networks Button */}
              <div className="flex justify-center">
                <button
                  onClick={switchChains}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  aria-label="Switch networks"
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
              </div>

              {/* To Network */}
              <div className="bg-gray-750 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm sm:text-base">To Network</span>
                  <span className="text-xs sm:text-sm text-gray-500">Balance: 0.0</span>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={toChain}
                    onChange={(e) => setToChain(parseInt(e.target.value))}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  >
                    {supportedNetworks.map((network) => (
                      <option key={network.id} value={network.id}>
                        {network.icon} {network.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Token Selection */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => openTokenModal('from')}
                  className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center sm:justify-start"
                >
                  <span className="text-xl sm:text-2xl">{getTokenLogo(fromToken)}</span>
                  <span className="text-white font-medium text-sm sm:text-base">{getTokenName(fromToken)}</span>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => openTokenModal('to')}
                  className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center sm:justify-start"
                >
                  <span className="text-xl sm:text-2xl">{getTokenLogo(toToken)}</span>
                  <span className="text-white font-medium text-sm sm:text-base">{getTokenName(toToken)}</span>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div className="bg-gray-750 rounded-xl p-4 mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm sm:text-base">Amount</span>
                <span className="text-gray-400 text-xs sm:text-sm">Balance: 0.0</span>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-xl sm:text-2xl font-bold text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Bridge Details */}
            <div className="bg-gray-750 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm sm:text-base">Estimated Fee</span>
                <span className="text-white text-sm sm:text-base">{estimatedFee.toFixed(4)} ETH</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm sm:text-base">Estimated Time</span>
                <span className="text-white text-sm sm:text-base">{estimatedTime}</span>
              </div>
              
              {bridgeRoute && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm sm:text-base">Route</span>
                  <span className="text-white text-sm sm:text-base">
                    {bridgeRoute.from.icon} {bridgeRoute.from.name} → {bridgeRoute.to.icon} {bridgeRoute.to.name}
                  </span>
                </div>
              )}
            </div>

            {/* Bridge Button */}
            <div className="mt-4 sm:mt-6">
              <button
                onClick={handleBridge}
                disabled={isBridging || !account || !amount || parseFloat(amount) <= 0 || fromChain === toChain}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-colors text-base sm:text-lg"
              >
                {isBridging ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 sm:h-5 w-4 sm:w-5 border-b-2 border-white mr-2"></div>
                    Bridging...
                  </div>
                ) : (
                  'Bridge Tokens'
                )}
              </button>
            </div>
          </div>

          {/* Bridge Status */}
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Bridge Status</h3>
            
            {bridgeTransactions.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {bridgeTransactions.map((tx) => (
                  <div key={tx.id} className="bg-gray-750 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(tx.status)}`}></div>
                        <div>
                          <p className="text-white font-medium text-sm sm:text-base">
                            {tx.amount} {tx.fromToken} → {tx.toToken}
                          </p>
                          <p className="text-gray-400 text-xs sm:text-sm">
                            {getNetworkInfo(tx.fromChain).name} → {getNetworkInfo(tx.toChain).name}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                        <span className={`text-xs sm:text-sm font-medium ${getStatusColor(tx.status)}`}>
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </span>
                        <span className="text-gray-400 text-xs sm:text-sm">
                          {new Date(tx.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    {tx.txHash && (
                      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-600">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                          <span className="text-gray-400 text-xs sm:text-sm">Tx Hash:</span>
                          <code className="bg-gray-700 px-2 py-1 rounded text-xs font-mono break-all text-gray-200">
                            {tx.txHash}
                          </code>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                variant="bridge"
                title="No bridge transactions yet"
                description="Bridge tokens across networks to see your transaction history here."
                actionLabel="Bridge tokens"
                actionHref="#bridge-form"
              />
            )}
          </div>

          {/* Bridge Information */}
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">How Bridge Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <h4 className="text-white font-semibold mb-2 text-sm sm:text-base">Select Networks</h4>
                <p className="text-gray-300 text-xs sm:text-sm">Choose source and destination blockchains</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <h4 className="text-white font-semibold mb-2 text-sm sm:text-base">Enter Amount</h4>
                <p className="text-gray-300 text-xs sm:text-sm">Specify the amount you want to bridge</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <h4 className="text-white font-semibold mb-2 text-sm sm:text-base">Confirm & Wait</h4>
                <p className="text-gray-300 text-xs sm:text-sm">Confirm transaction and wait for completion</p>
              </div>
            </div>
          </div>
        </div>

        {/* Token Management Modal */}
        <TokenManagementModal
          isOpen={tokenModalOpen}
          onClose={() => setTokenModalOpen(false)}
          onTokenSelect={handleTokenSelect}
          currentNetwork={network?.chainId}
        />
      </div>
    </>
  );
} 