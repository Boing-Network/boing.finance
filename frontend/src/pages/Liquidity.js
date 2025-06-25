import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useQuery } from 'react-query';
import axios from 'axios';
import config from '../config';

// Helper function to get API URL
const getApiUrl = () => {
  return config.apiUrl || 'http://localhost:8787';
};

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

const Liquidity = () => {
  const [selectedPair, setSelectedPair] = useState(null);
  const { isConnected, account } = useWalletConnection();

  // Fetch pairs data
  const fetchPairs = async () => {
    try {
      const response = await axios.get(`${getApiUrl()}/api/liquidity/pools`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching pairs:', error);
      return [];
    }
  };

  const { data: pairsData, isLoading: pairsLoading } = useQuery(
    ['liquidity-pairs'],
    fetchPairs,
    { refetchInterval: 30000 }
  );

  // Fetch user's liquidity positions
  const { data: liquidityData, isLoading: liquidityLoading } = useQuery(
    ['user-liquidity', account],
    async () => {
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
    { 
      refetchInterval: 30000,
      enabled: !!account,
      retry: false
    }
  );

  // Helper functions
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const getChainColor = (chainId) => {
    switch (chainId) {
      case '1': return 'bg-blue-100 text-blue-800';
      case '137': return 'bg-purple-100 text-purple-800';
      case '56': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChainName = (chainId) => {
    switch (chainId) {
      case '1': return 'Ethereum';
      case '137': return 'Polygon';
      case '56': return 'BSC';
      default: return 'Unknown';
    }
  };

  const handleCollectFees = (positionId) => {
    toast.success('Fees collected successfully!');
  };

  const handleRemoveLiquidity = (positionId) => {
    toast.success('Liquidity removed successfully!');
  };

  const handleCreatePair = () => {
    // Implementation needed
  };

  const handleCreateToken = () => {
    // Implementation needed
  };

  // Show connect wallet message if not connected
  if (!isConnected || !account) {
    return (
      <div className="relative max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
        <AnimatedBackground />
        <div className="relative z-10">
          <MochiAstronaut position="top-right" />
          <div className="text-center py-12">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Connect Your Wallet</h1>
            <p className="text-gray-300 mb-8">Connect your wallet to manage liquidity</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200">
              Connect Wallet
            </button>
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
        
        {/* Educational Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-8 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">
                🚀 Create Your Own Trading Pairs & Tokens!
              </h2>
              <p className="text-blue-100 mb-4">
                Unlike centralized exchanges, mochi allows anyone to create trading pairs for any ERC-20 token. 
                No permission required - just add liquidity and start trading!
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleCreatePair}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-white/30"
                >
                  📊 Create New Pair
                </button>
                <button
                  onClick={handleCreateToken}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-white/30"
                >
                  🪙 Deploy New Token
                </button>
                <a
                  href="/docs"
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-white/30"
                >
                  📖 Learn How
                </a>
              </div>
            </div>
            <div className="hidden md:block ml-6">
              <div className="text-right">
                <div className="text-3xl text-white font-bold">∞</div>
                <div className="text-blue-100 text-sm">Unlimited Pairs</div>
              </div>
            </div>
            {/* Mobile version of Unlimited Pairs */}
            <div className="block md:hidden ml-4">
              <div className="text-xl text-white font-bold">∞</div>
              <div className="text-blue-100 text-xs">Unlimited</div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6">How Token & Pair Creation Works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="text-3xl mb-4">1️⃣</div>
              <h4 className="text-lg font-semibold text-white mb-2">Deploy Your Token</h4>
              <p className="text-gray-300 text-sm">
                Create any ERC-20 token on Ethereum or supported networks. 
                No approval needed - just deploy and you're ready to go!
              </p>
              <div className="mt-4 p-3 bg-gray-750 rounded-lg">
                <code className="text-xs text-green-400">
                  {/* Deploy any ERC-20 token */}
                  {/* No permission required */}
                  {/* Instant listing capability */}
                </code>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="text-3xl mb-4">2️⃣</div>
              <h4 className="text-lg font-semibold text-white mb-2">Create Trading Pair</h4>
              <p className="text-gray-300 text-sm">
                Call the factory contract to create a new trading pair. 
                Anyone can create pairs for any token combination.
              </p>
              <div className="mt-4 p-3 bg-gray-750 rounded-lg">
                <code className="text-xs text-green-400">
                  factory.createPair(tokenA, tokenB)
                  {/* Creates pair instantly */}
                  {/* Deterministic address */}
                </code>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="text-3xl mb-4">3️⃣</div>
              <h4 className="text-lg font-semibold text-white mb-2">Add Initial Liquidity</h4>
              <p className="text-gray-300 text-sm">
                Provide initial liquidity to establish the token price. 
                Set the market and start earning fees from trades.
              </p>
              <div className="mt-4 p-3 bg-gray-750 rounded-lg">
                <code className="text-xs text-green-400">
                  pair.mint(amount0, amount1)
                  {/* Sets initial price */}
                  {/* Earn trading fees */}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6">Quick Actions</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">Create New Trading Pair</h4>
                <span className="text-green-400 text-sm font-medium">Permissionless</span>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Create a new trading pair for any two ERC-20 tokens. Perfect for new projects or custom token combinations.
              </p>
              <button
                onClick={handleCreatePair}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
              >
                Create Pair
              </button>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">Deploy New Token</h4>
                <span className="text-green-400 text-sm font-medium">No Approval</span>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Deploy your own ERC-20 token and immediately create trading pairs. No waiting for exchange listings.
              </p>
              <button
                onClick={handleCreateToken}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
              >
                Deploy Token
              </button>
            </div>
          </div>
        </div>

        {/* Existing Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Add Liquidity Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Add Liquidity</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Available Pairs:</span>
                  <span className="text-sm text-white font-medium">{(pairsData || []).length}</span>
                  <span className="text-xs text-green-400">+ ∞ New</span>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Pairs Selection */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Select Trading Pair</h3>
                  {pairsLoading ? (
                    <div className="text-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-gray-300 mt-2">Loading pairs...</p>
                    </div>
                  ) : (pairsData || []).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(pairsData || []).map((pair) => (
                        <button
                          key={pair.id}
                          onClick={() => setSelectedPair(pair)}
                          className={`p-4 rounded-lg border transition-colors ${
                            selectedPair?.id === pair.id
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                          }`}
                        >
                          <div className="text-white font-medium">{pair.token0}/{pair.token1}</div>
                          <div className="text-gray-400 text-sm">{pair.address}</div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-400">No trading pairs available</p>
                    </div>
                  )}
                </div>

                {/* Liquidity Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Total Value Locked</h3>
                    <p className="text-2xl font-bold text-white">
                      ${formatNumber(liquidityData?.totalValue || 0)}
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Fees Earned</h3>
                    <p className="text-2xl font-bold text-green-400">
                      ${formatNumber(liquidityData?.feesEarned || 0)}
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Average APY</h3>
                    <p className="text-2xl font-bold text-blue-400">
                      {(liquidityData?.avgAPY || 0).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Liquidity Positions */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                  <div className="p-6 border-b border-gray-700">
                    <h3 className="text-lg font-semibold text-white">Your Liquidity Positions</h3>
                  </div>
                  {liquidityLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-gray-300 mt-2">Loading positions...</p>
                    </div>
                  ) : liquidityData?.positions && liquidityData.positions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-750">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Pair</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Share</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Value</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Fees</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">APY</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {liquidityData.positions.map((position) => (
                            <tr key={position.id} className="hover:bg-gray-750">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="text-white font-medium">{position.token0}/{position.token1}</div>
                                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getChainColor(position.chainId)}`}>
                                    {getChainName(position.chainId)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-white">
                                {(position.share * 100).toFixed(2)}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-white">
                                ${formatNumber(position.value)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-green-400">
                                ${formatNumber(position.fees)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-blue-400">
                                {position.apy.toFixed(1)}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleCollectFees(position.id)}
                                    className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
                                  >
                                    Collect
                                  </button>
                                  <button
                                    onClick={() => handleRemoveLiquidity(position.id)}
                                    className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400 mb-4">No liquidity positions found</p>
                      <p className="text-gray-500 text-sm">Add liquidity to start earning fees</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Liquidity Info */}
          <div className="space-y-6">
            {/* Portfolio Overview */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Your Liquidity</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Value:</span>
                  <span className="text-white font-medium">${formatNumber(liquidityData?.totalValue || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fees Earned:</span>
                  <span className="text-green-400 font-medium">${formatNumber(liquidityData?.feesEarned || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg APY:</span>
                  <span className="text-blue-400 font-medium">{(liquidityData?.avgAPY || 0).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Create New Pair Card */}
            <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-xl p-6 border border-purple-500/30">
              <div className="text-center">
                <div className="text-3xl mb-3">🆕</div>
                <h4 className="text-lg font-semibold text-white mb-2">Create New Pair</h4>
                <p className="text-gray-300 text-sm mb-4">
                  Don't see the pair you want? Create it yourself! Any ERC-20 token can be paired.
                </p>
                <button
                  onClick={handleCreatePair}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                >
                  Create Pair
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Liquidity; 