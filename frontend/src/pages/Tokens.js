import React, { useState, useEffect } from 'react';
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

const Tokens = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChain, setSelectedChain] = useState('all');
  const [sortBy, setSortBy] = useState('volume');
  const [sortOrder, setSortOrder] = useState('desc');
  const [tokens, setTokens] = useState([]);

  // Load tokens from API
  useEffect(() => {
    const loadTokens = async () => {
      try {
        const apiUrl = getApiUrl();
        const response = await axios.get(`${apiUrl}/tokens`);
        if (response.data.success && response.data.data.length > 0) {
          setTokens(response.data.data);
        } else {
          setTokens([]);
        }
      } catch (error) {
        console.error('Failed to load tokens:', error.message);
        setTokens([]);
      }
    };

    loadTokens();
  }, []);

  // Filter and sort tokens
  const filteredAndSortedTokens = tokens
    .filter(token => {
      const matchesSearch = token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           token.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesChain = selectedChain === 'all' || token.chainId === selectedChain;
      return matchesSearch && matchesChain;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'marketCap':
          aValue = parseFloat(a.marketCap || 0);
          bValue = parseFloat(b.marketCap || 0);
          break;
        case 'price':
          aValue = parseFloat(a.priceUsd || 0);
          bValue = parseFloat(b.priceUsd || 0);
          break;
        case 'volume24h':
          aValue = parseFloat(a.volume24h || 0);
          bValue = parseFloat(b.volume24h || 0);
          break;
        case 'change24h':
          aValue = parseFloat(a.change24h || 0);
          bValue = parseFloat(b.change24h || 0);
          break;
        default:
          aValue = parseFloat(a.marketCap || 0);
          bValue = parseFloat(b.marketCap || 0);
      }
      
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

  return (
    <div className="relative max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10">
        {/* MochiAstronaut positioned relative to content */}
        <MochiAstronaut position="top-right" />
        
        {/* Educational Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 mb-8 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">
                🪙 Discover & Create Any Token!
              </h2>
              <p className="text-purple-100 mb-4">
                Browse thousands of tokens or create your own! mochi supports any ERC-20 token. 
                Deploy your token and instantly create trading pairs - no permission required.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-white/30"
                >
                  🚀 Deploy New Token
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
                  📖 Learn How
                </a>
              </div>
            </div>
            <div className="hidden md:block ml-6">
              <div className="text-right">
                <div className="text-3xl text-white font-bold">∞</div>
                <div className="text-purple-100 text-sm">Unlimited Tokens</div>
              </div>
            </div>
            {/* Mobile version of Unlimited Tokens */}
            <div className="block md:hidden ml-4">
              <div className="text-xl text-white font-bold">∞</div>
              <div className="text-purple-100 text-xs">Unlimited</div>
            </div>
          </div>
        </div>

        {/* Token Creation Info Section */}
        <div id="token-creation" className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6">How Token Creation Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="text-3xl mb-4">🚀</div>
              <h4 className="text-lg font-semibold text-white mb-2">Deploy Your Token</h4>
              <p className="text-gray-300 text-sm">
                Create any ERC-20 token on Ethereum or supported networks. 
                Set your token's name, symbol, and total supply.
              </p>
              <div className="mt-4 p-3 bg-gray-750 rounded-lg">
                <code className="text-xs text-green-400">
                  {/* Deploy ERC-20 token */}
                  {/* Customize parameters */}
                  {/* No approval needed */}
                </code>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="text-3xl mb-4">🔗</div>
              <h4 className="text-lg font-semibold text-white mb-2">Create Trading Pair</h4>
              <p className="text-gray-300 text-sm">
                Instantly create trading pairs for your token. 
                Pair with ETH, USDC, or any other ERC-20 token.
              </p>
              <div className="mt-4 p-3 bg-gray-750 rounded-lg">
                <code className="text-xs text-green-400">
                  factory.createPair(myToken, USDC)
                  {/* Instant pair creation */}
                  {/* Community-driven */}
                </code>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="text-3xl mb-4">💧</div>
              <h4 className="text-lg font-semibold text-white mb-2">Add Liquidity</h4>
              <p className="text-gray-300 text-sm">
                Provide initial liquidity to establish your token's price. 
                Start earning fees from trades immediately.
              </p>
              <div className="mt-4 p-3 bg-gray-750 rounded-lg">
                <code className="text-xs text-green-400">
                  pair.mint(amount0, amount1)
                  {/* Set initial price */}
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
                <h4 className="text-lg font-semibold text-white">Deploy New Token</h4>
                <span className="text-green-400 text-sm font-medium">No Approval</span>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Create your own ERC-20 token and immediately start trading. Perfect for new projects, communities, or experiments.
              </p>
              <button
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
              >
                Deploy Token
              </button>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">Create Trading Pair</h4>
                <span className="text-green-400 text-sm font-medium">Permissionless</span>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Create trading pairs for any token combination. No waiting for exchange listings or approvals.
              </p>
              <a
                href="/liquidity"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 text-center"
              >
                Create Pair
              </a>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search tokens by name, symbol, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-4">
              <select
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Chains</option>
                <option value="1">Ethereum</option>
                <option value="137">Polygon</option>
                <option value="56">BSC</option>
              </select>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="marketCap-desc">Market Cap (High to Low)</option>
                <option value="marketCap-asc">Market Cap (Low to High)</option>
                <option value="volume24h-desc">Volume (High to Low)</option>
                <option value="volume24h-asc">Volume (Low to High)</option>
                <option value="change24h-desc">24h Change (High to Low)</option>
                <option value="change24h-asc">24h Change (Low to High)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tokens Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-750">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Token</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">24h Change</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Market Cap</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">24h Volume</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Chain</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredAndSortedTokens.length > 0 ? (
                  filteredAndSortedTokens.map((token) => (
                    <tr key={token.address} className="hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">{token.symbol[0]}</span>
                          </div>
                          <div>
                            <div className="text-white font-medium">{token.symbol}</div>
                            <div className="text-gray-400 text-sm">{token.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                        {token.priceUsd.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-medium ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {token.change24h >= 0 ? '+' : ''}{token.change24h}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-white">
                        ${token.marketCap.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-white">
                        ${token.volume24h.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${token.chainId === '1' ? 'bg-blue-100 text-blue-800' : token.chainId === '137' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                          {token.chainId === '1' ? 'Ethereum' : token.chainId === '137' ? 'Polygon' : 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <a
                            href={`/swap?tokenIn=${token.address}`}
                            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                          >
                            Trade
                          </a>
                          <a
                            href={`/liquidity?token=${token.address}`}
                            className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
                          >
                            Add LP
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 sm:py-12 text-center">
                      <p className="text-gray-300 text-sm sm:text-base">No tokens found matching your criteria</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Token Creation CTA */}
        <div className="mt-8 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl p-8 border border-purple-500/30">
          <div className="text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold text-white mb-4">Ready to Create Your Token?</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Don't see the token you want? Create your own! Deploy any ERC-20 token and instantly create trading pairs. 
              No permission required - just deploy, add liquidity, and start trading.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
              >
                Deploy New Token
              </button>
              <a
                href="/liquidity"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200 text-center"
              >
                Create Trading Pair
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tokens;
