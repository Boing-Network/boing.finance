import React, { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { ArrowDown, Settings, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { getApiUrl } from '../config.js';
import { getNetworkByChainId } from '../config/networks';
import { useWalletConnection } from '../hooks/useWalletConnection';

// Helper function to get chain name
const getChainName = (chainId) => {
  const network = getNetworkByChainId(chainId);
  return network ? network.name : 'Unknown';
};

// Add AnimatedBackground and MochiAstronaut imports (define in this file for now)
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
function MochiAstronaut({ position = "top-right" }) {
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
        return "absolute right-0 top-0 mt-4 mr-4 z-20";
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

const Swap = () => {
  const [tokenIn, setTokenIn] = useState('ETH');
  const [tokenOut, setTokenOut] = useState('USDC');
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [tokens, setTokens] = useState([]);

  // Wallet connection
  const { 
    isConnected, 
    account 
  } = useWalletConnection();

  // Load tokens from API
  useEffect(() => {
    const loadTokens = async () => {
      try {
        const apiUrl = getApiUrl();
        const response = await axios.get(`${apiUrl}/tokens`);
        if (response.data.success && response.data.data.length > 0) {
          setTokens(response.data.data);
        } else {
          // Set empty array if no tokens available
          setTokens([]);
        }
      } catch (error) {
        console.error('Failed to load tokens:', error.message);
        setTokens([]);
      }
    };

    loadTokens();
  }, []);

  // Calculate output amount (dynamic based on token prices)
  useEffect(() => {
    if (tokenIn && tokenOut && amountIn && parseFloat(amountIn) > 0) {
      // Find token prices from API data
      const tokenInData = tokens.find(t => t.symbol === tokenIn);
      const tokenOutData = tokens.find(t => t.symbol === tokenOut);
      
      if (tokenInData && tokenOutData && tokenInData.price && tokenOutData.price) {
        const rate = tokenInData.price / tokenOutData.price;
        const calculated = parseFloat(amountIn) * rate;
        setAmountOut(calculated.toFixed(6));
      } else {
        // Fallback calculation if prices not available
        setAmountOut('0.0');
      }
    } else {
      setAmountOut('');
    }
  }, [tokenIn, tokenOut, amountIn, tokens]);

  // Handlers
  const handleSwap = async () => {
    if (!tokenIn || !tokenOut || !amountIn || !amountOut) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSwapping(true);
    try {
      // Simulate swap
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Swap completed successfully!');
      setAmountIn('');
      setAmountOut('');
    } catch (error) {
      toast.error('Swap failed');
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10">
        {/* Educational Banner */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 mb-8 border border-green-500/20">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">
                🔄 Trade Any Token - Create Any Pair!
              </h2>
              <p className="text-green-100 mb-4">
                Can't find the token you want to trade? Create a new trading pair! 
                mochi supports any ERC-20 token - no permission required.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-white/30"
                >
                  📊 Create New Pair
                </button>
                <a
                  href="/liquidity"
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-white/30"
                >
                  💧 Add Liquidity
                </a>
                <a
                  href="/docs"
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-white/30"
                >
                  📖 Learn More
                </a>
              </div>
            </div>
            <div className="hidden md:block ml-6">
              <div className="text-right">
                <div className="text-3xl text-white font-bold">∞</div>
                <div className="text-green-100 text-sm">Unlimited Tokens</div>
              </div>
            </div>
            {/* Mobile version of Unlimited Tokens */}
            <div className="block md:hidden ml-4">
              <div className="text-xl text-white font-bold">∞</div>
              <div className="text-green-100 text-xs">Unlimited</div>
            </div>
          </div>
        </div>

        {/* Token Creation Info Section */}
        <div id="token-info" className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6">How Token Trading Works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="text-3xl mb-4">🪙</div>
              <h4 className="text-lg font-semibold text-white mb-2">Any ERC-20 Token</h4>
              <p className="text-gray-300 text-sm">
                Trade any token that follows the ERC-20 standard. 
                From major cryptocurrencies to newly launched projects.
              </p>
              <div className="mt-4 p-3 bg-gray-750 rounded-lg">
                <code className="text-xs text-green-400">
                  {/* All ERC-20 tokens supported */}
                  {/* No whitelist required */}
                  {/* Instant trading capability */}
                </code>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="text-3xl mb-4">🔗</div>
              <h4 className="text-lg font-semibold text-white mb-2">Permissionless Pairs</h4>
              <p className="text-gray-300 text-sm">
                Anyone can create trading pairs for any token combination. 
                No approval process - just add liquidity and start trading.
              </p>
              <div className="mt-4 p-3 bg-gray-750 rounded-lg">
                <code className="text-xs text-green-400">
                  factory.createPair(tokenA, tokenB)
                  {/* Instant pair creation */}
                  {/* Community-driven liquidity */}
                </code>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="text-3xl mb-4">⚡</div>
              <h4 className="text-lg font-semibold text-white mb-2">Instant Trading</h4>
              <p className="text-gray-300 text-sm">
                Once a pair exists with liquidity, anyone can trade it immediately. 
                No waiting for exchange listings or approvals.
              </p>
              <div className="mt-4 p-3 bg-gray-750 rounded-lg">
                <code className="text-xs text-green-400">
                  pair.swap(amountIn, amountOut)
                  {/* Instant execution */}
                  {/* Automated market making */}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Main Swap Interface */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Swap Interface */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Swap Tokens</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Available Tokens:</span>
                  <span className="text-sm text-white font-medium">{tokens.length}</span>
                  <span className="text-xs text-green-400">+ ∞ New</span>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Token In Selection */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">From</label>
                    <span className="text-xs text-gray-400">Balance: 0.0</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="0.0"
                        value={amountIn}
                        onChange={(e) => setAmountIn(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-white font-medium">
                      {tokenIn}
                    </button>
                  </div>
                </div>

                {/* Swap Direction Button */}
                <div className="flex justify-center -my-2">
                  <button className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full">
                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </button>
                </div>

                {/* Token Out Selection */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">To</label>
                    <span className="text-xs text-gray-400">Balance: 0.0</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="0.0"
                        value={amountOut}
                        onChange={(e) => setAmountOut(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-white font-medium">
                      {tokenOut}
                    </button>
                  </div>
                </div>

                {/* Swap Details */}
                <div className="bg-gray-750 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price Impact:</span>
                    <span className="text-white">0.12%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Minimum Received:</span>
                    <span className="text-white">{amountOut ? (parseFloat(amountOut) * 0.995).toFixed(6) : '0.0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network Fee:</span>
                    <span className="text-white">~$5.00</span>
                  </div>
                </div>

                {/* Swap Button */}
                <button
                  onClick={handleSwap}
                  disabled={!tokenIn || !tokenOut || !amountIn || isSwapping}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg transition duration-200 disabled:cursor-not-allowed text-lg"
                >
                  {isSwapping ? 'Swapping...' : 'Swap Tokens'}
                </button>

                {/* Create Pair Hint */}
                {(!tokenIn || !tokenOut) && (
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-400">💡</span>
                      <p className="text-blue-300 text-sm">
                        Can't find the token you want to trade? 
                        <button 
                          className="text-blue-200 hover:text-blue-100 underline ml-1"
                        >
                          Create a new trading pair
                        </button>
                        {' '}for any ERC-20 token!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Token Selection Panel */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
                >
                  📊 Create New Pair
                </button>
                <a
                  href="/liquidity"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 text-center"
                >
                  💧 Add Liquidity
                </a>
                <a
                  href="/tokens"
                  className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 text-center"
                >
                  🪙 Browse Tokens
                </a>
              </div>
            </div>

            {/* Popular Tokens */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Popular Tokens</h3>
              <div className="space-y-3">
                {tokens.slice(0, 5).map((token) => (
                  <button
                    key={token.address}
                    onClick={() => !tokenIn ? setTokenIn(token.symbol) : setTokenOut(token.symbol)}
                    className="w-full flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{token.symbol[0]}</span>
                      </div>
                      <div className="text-left">
                        <div className="text-white font-medium">{token.symbol}</div>
                        <div className="text-gray-400 text-sm">{token.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">${token.price}</div>
                      <div className="text-gray-400 text-xs">{getChainName(token.chainId)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Token Creation Info */}
            <div className="bg-gradient-to-br from-green-600/20 to-blue-600/20 rounded-xl p-6 border border-green-500/30">
              <div className="text-center">
                <div className="text-3xl mb-3">🆕</div>
                <h4 className="text-lg font-semibold text-white mb-2">New Token?</h4>
                <p className="text-gray-300 text-sm mb-4">
                  Don't see your token? Create a trading pair for any ERC-20 token instantly!
                </p>
                <button
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                >
                  Create Pair
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MochiAstronaut position="top-right" />
    </div>
  );
};

export default Swap; 