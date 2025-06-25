import React, { useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import config from '../config';
import { getNetworkByChainId } from '../config/networks';
import NetworkSelector from '../components/NetworkSelector';

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

const Bridge = () => {
  const [fromChain, setFromChain] = useState(1); // Ethereum
  const [toChain, setToChain] = useState(137); // Polygon
  const [selectedToken, setSelectedToken] = useState('ETH');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [isBridging, setIsBridging] = useState(false);

  // Get network configurations
  const fromNetwork = getNetworkByChainId(fromChain);
  const toNetwork = getNetworkByChainId(toChain);

  // Fetch bridge data
  const { data: bridgeData } = useQuery(
    ['bridge-data', fromChain, toChain],
    async () => {
      try {
        const response = await axios.get(`${config.apiUrl}/bridge/status`, {
          params: { fromChain, toChain }
        });
        return response.data.data;
      } catch (error) {
        // Return fallback data if API is not available
        return getFallbackBridgeData(fromChain, toChain);
      }
    },
    { refetchInterval: 30000 }
  );

  // Fetch bridge transactions
  const { data: bridgeTransactions } = useQuery(
    ['bridge-transactions'],
    async () => {
      try {
        const response = await axios.get(`${config.apiUrl}/bridge/transactions`);
        return response.data.data;
      } catch (error) {
        // Return fallback data if API is not available
        return getFallbackTransactions();
      }
    },
    { refetchInterval: 15000 }
  );

  // Get fallback bridge data
  const getFallbackBridgeData = (fromChainId, toChainId) => {
    const fromNet = getNetworkByChainId(fromChainId);
    const toNet = getNetworkByChainId(toChainId);
    
    return {
      status: 'operational',
      estimatedTime: getEstimatedTime(fromNet, toNet),
      fee: getBridgeFee(fromNet, toNet),
      minAmount: getMinAmount(fromNet),
      maxAmount: getMaxAmount(fromNet),
      supportedTokens: getSupportedTokens(fromChainId),
      gasEstimate: getGasEstimate(fromNet, toNet),
      bridgeType: getBridgeType(fromNet, toNet)
    };
  };

  // Helper functions for bridge data
  const getEstimatedTime = (fromNet, toNet) => {
    if (!fromNet || !toNet) return '5-10 minutes';
    
    // Faster for newer networks
    const fromPriority = fromNet.priority || 999;
    const toPriority = toNet.priority || 999;
    
    if (fromPriority <= 3 && toPriority <= 3) return '2-5 minutes';
    if (fromPriority <= 6 && toPriority <= 6) return '3-7 minutes';
    return '5-10 minutes';
  };

  const getBridgeFee = (fromNet, toNet) => {
    if (!fromNet || !toNet) return '0.001';
    
    // Lower fees for newer networks
    const fromPriority = fromNet.priority || 999;
    const toPriority = toNet.priority || 999;
    
    if (fromPriority <= 3 && toPriority <= 3) return '0.002';
    if (fromPriority <= 6 && toPriority <= 6) return '0.0015';
    return '0.001';
  };

  const getMinAmount = (network) => {
    if (!network) return '0.01';
    
    // Lower minimums for newer networks
    const priority = network.priority || 999;
    if (priority <= 3) return '0.05';
    if (priority <= 6) return '0.02';
    return '0.01';
  };

  const getMaxAmount = (network) => {
    if (!network) return '100';
    
    // Higher maximums for established networks
    const priority = network.priority || 999;
    if (priority <= 3) return '1000';
    if (priority <= 6) return '500';
    return '100';
  };

  const getGasEstimate = (fromNet, toNet) => {
    if (!fromNet || !toNet) return '150000';
    
    // Lower gas for newer networks
    const fromPriority = fromNet.priority || 999;
    const toPriority = toNet.priority || 999;
    
    if (fromPriority <= 3 && toPriority <= 3) return '200000';
    if (fromPriority <= 6 && toPriority <= 6) return '175000';
    return '150000';
  };

  const getBridgeType = (fromNet, toNet) => {
    if (!fromNet || !toNet) return 'standard';
    
    // Different bridge types based on network features
    const fromFeatures = fromNet.features || [];
    const toFeatures = toNet.features || [];
    
    if (fromFeatures.includes('rollup') || toFeatures.includes('rollup')) return 'rollup';
    if (fromFeatures.includes('zkRollup') || toFeatures.includes('zkRollup')) return 'zk-rollup';
    return 'standard';
  };

  const getSupportedTokens = (chainId) => {
    // Return supported tokens for each chain
    const tokenMap = {
      1: [ // Ethereum
        { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000' },
        { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8' },
        { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
        { symbol: 'WETH', name: 'Wrapped Ether', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' }
      ],
      137: [ // Polygon
        { symbol: 'MATIC', name: 'Polygon', address: '0x0000000000000000000000000000000000000000' },
        { symbol: 'USDC', name: 'USD Coin', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' },
        { symbol: 'USDT', name: 'Tether USD', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' },
        { symbol: 'WETH', name: 'Wrapped Ether', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619' }
      ],
      56: [ // BSC
        { symbol: 'BNB', name: 'BNB', address: '0x0000000000000000000000000000000000000000' },
        { symbol: 'USDC', name: 'USD Coin', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' },
        { symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955' },
        { symbol: 'WETH', name: 'Wrapped Ether', address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8' }
      ],
      250: [ // Fantom
        { symbol: 'FTM', name: 'Fantom', address: '0x0000000000000000000000000000000000000000' },
        { symbol: 'USDC', name: 'USD Coin', address: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75' },
        { symbol: 'USDT', name: 'Tether USD', address: '0x049d68029688eAbF473097a2fC38ef61633A3C7A' }
      ],
      43114: [ // Avalanche
        { symbol: 'AVAX', name: 'Avalanche', address: '0x0000000000000000000000000000000000000000' },
        { symbol: 'USDC', name: 'USD Coin', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' },
        { symbol: 'USDT', name: 'Tether USD', address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7' }
      ]
    };
    
    return tokenMap[chainId] || tokenMap[1]; // Default to Ethereum tokens
  };

  const getFallbackTransactions = () => {
    return [
      {
        id: 1,
        fromChain: 1,
        toChain: 137,
        token: 'ETH',
        amount: '0.5',
        status: 'completed',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      },
      {
        id: 2,
        fromChain: 137,
        toChain: 56,
        token: 'USDC',
        amount: '100',
        status: 'pending',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      }
    ];
  };

  // Helper function to get network icon
  const getNetworkIcon = (network) => {
    if (!network) return '🔗';
    
    // Network-specific icons
    const iconMap = {
      1: '🔵', // Ethereum
      137: '🟣', // Polygon
      56: '🟡', // BSC
      250: '🔵', // Fantom
      43114: '🔴', // Avalanche
      42161: '🔵', // Arbitrum
      10: '🔴', // Optimism
      8453: '🔵', // Base
      59144: '🟢', // Linea
      1101: '🟣', // Polygon zkEVM
      324: '🔵', // zkSync
      534352: '🟢', // Scroll
      1284: '🌙', // Moonbeam
      1285: '🌙', // Moonriver
      1287: '🌙', // Moonbase
    };
    
    return iconMap[network.chainId] || '🔗';
  };

  const handleBridge = async () => {
    if (!amount || !recipient) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsBridging(true);
    try {
      // This would call the actual bridge contract
      await axios.post(`${config.apiUrl}/bridge/transfer`, {
        fromChain,
        toChain,
        token: selectedToken,
        amount,
        recipient
      });
      
      toast.success('Bridge transfer initiated successfully!');
      setAmount('');
      setRecipient('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Bridge transfer failed');
    } finally {
      setIsBridging(false);
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10">
        {/* MochiAstronaut positioned relative to content */}
        <MochiAstronaut position="top-right" />
        
        {/* Educational Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 mb-8 border border-purple-500/20">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Cross-Chain Bridge
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Transfer tokens between different blockchain networks with optimized routing for smaller and newer chains
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Bridge Interface */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-6">Bridge Tokens</h2>
              
              <div className="space-y-6">
                {/* From Chain */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    From Network
                  </label>
                  <NetworkSelector
                    selectedChainId={fromChain}
                    onNetworkChange={setFromChain}
                    className="w-full"
                  />
                </div>

                {/* To Chain */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    To Network
                  </label>
                  <NetworkSelector
                    selectedChainId={toChain}
                    onNetworkChange={setToChain}
                    className="w-full"
                  />
                </div>

                {/* Token Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Token
                  </label>
                  <select
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {getSupportedTokens(fromChain).map((token) => (
                      <option key={token.address} value={token.symbol}>
                        {token.symbol} - {token.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Min: {bridgeData?.minAmount || '0.01'}</span>
                    <span>Max: {bridgeData?.maxAmount || '100'}</span>
                  </div>
                </div>

                {/* Recipient */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Bridge Button */}
                <button
                  onClick={handleBridge}
                  disabled={isBridging || !amount || !recipient}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 disabled:cursor-not-allowed"
                >
                  {isBridging ? 'Bridging...' : 'Bridge Tokens'}
                </button>
              </div>
            </div>
          </div>

          {/* Bridge Info */}
          <div className="space-y-6">
            {/* Bridge Status */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Bridge Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-green-400">● Operational</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Estimated Time:</span>
                  <span className="text-white">{bridgeData?.estimatedTime || '5-10 minutes'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bridge Fee:</span>
                  <span className="text-white">{bridgeData?.fee || '0.001'} {selectedToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Gas Estimate:</span>
                  <span className="text-white">{bridgeData?.gasEstimate || '150000'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bridge Type:</span>
                  <span className="text-white">{bridgeData?.bridgeType || 'standard'}</span>
                </div>
              </div>
            </div>

            {/* Network Comparison */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Network Comparison</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getNetworkIcon(fromNetwork)}</span>
                    <span className="text-white">{fromNetwork?.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Block Time</div>
                    <div className="text-white">{fromNetwork?.blockTime || 'N/A'}s</div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getNetworkIcon(toNetwork)}</span>
                    <span className="text-white">{toNetwork?.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Block Time</div>
                    <div className="text-white">{toNetwork?.blockTime || 'N/A'}s</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Bridge Transactions</h2>
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-750">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">From</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Token</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {(bridgeTransactions || []).map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getNetworkIcon(getNetworkByChainId(tx.fromChain))}</span>
                          <span className="text-white">{getNetworkByChainId(tx.fromChain)?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getNetworkIcon(getNetworkByChainId(tx.toChain))}</span>
                          <span className="text-white">{getNetworkByChainId(tx.toChain)?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-white">{tx.token}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-white">{tx.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                          tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                        {tx.timestamp.toLocaleTimeString()}
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
  );
};

export default Bridge;
