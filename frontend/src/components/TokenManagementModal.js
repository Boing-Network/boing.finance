import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import SecurityBadges from './SecurityBadges';
import EmptyState from './EmptyState';
import walletTokenService from '../services/walletTokenService';

export default function TokenManagementModal({ isOpen, onClose, onTokenSelect, currentNetwork, account, provider, chainId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customTokens, setCustomTokens] = useState([]);
  const [importAddress, setImportAddress] = useState('');
  const [importing, setImporting] = useState(false);
  const [activeTab, setActiveTab] = useState('my-tokens'); // my-tokens, popular, custom, import
  const [userTokens, setUserTokens] = useState([]);
  const [loadingUserTokens, setLoadingUserTokens] = useState(false);

  // Popular tokens by network
  const popularTokens = {
    1: [ // Ethereum
      { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', decimals: 18, logo: '🔵' },
      { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8', decimals: 6, logo: '🔵' },
      { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, logo: '🟡' },
      { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, logo: '🟡' },
      { symbol: 'WETH', name: 'Wrapped Ether', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, logo: '🔵' },
      { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18, logo: '🟣' },
    ],
    137: [ // Polygon
      { symbol: 'MATIC', name: 'Polygon', address: '0x0000000000000000000000000000000000000000', decimals: 18, logo: '🟣' },
      { symbol: 'USDC', name: 'USD Coin', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6, logo: '🔵' },
      { symbol: 'USDT', name: 'Tether USD', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6, logo: '🟡' },
      { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18, logo: '🟡' },
      { symbol: 'WMATIC', name: 'Wrapped MATIC', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18, logo: '🟣' },
    ],
    56: [ // BSC
      { symbol: 'BNB', name: 'BNB', address: '0x0000000000000000000000000000000000000000', decimals: 18, logo: '🟡' },
      { symbol: 'USDC', name: 'USD Coin', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18, logo: '🔵' },
      { symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18, logo: '🟡' },
      { symbol: 'BUSD', name: 'Binance USD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18, logo: '🟡' },
      { symbol: 'WBNB', name: 'Wrapped BNB', address: '0xbb4CdB9CBd36B01bD1cBaEF2aF8C6b1c6c6c6c6c', decimals: 18, logo: '🟡' },
    ],
    42161: [ // Arbitrum
      { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', decimals: 18, logo: '🔵' },
      { symbol: 'USDC', name: 'USD Coin', address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', decimals: 6, logo: '🔵' },
      { symbol: 'USDT', name: 'Tether USD', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6, logo: '🟡' },
      { symbol: 'WETH', name: 'Wrapped Ether', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18, logo: '🔵' },
    ]
  };

  useEffect(() => {
    // Load custom tokens from localStorage
    const saved = localStorage.getItem(`customTokens_${currentNetwork}`);
    if (saved) {
      setCustomTokens(JSON.parse(saved));
    }
  }, [currentNetwork]);

  // Fetch user tokens when modal opens and user is connected
  useEffect(() => {
    if (isOpen && account && provider && chainId) {
      fetchUserTokens();
    }
  }, [isOpen, account, provider, chainId]);

  const fetchUserTokens = async () => {
    if (!account || !provider || !chainId) return;
    
    setLoadingUserTokens(true);
    try {
      walletTokenService.initialize(provider, account, chainId, true); // Enable debug
      const tokens = await walletTokenService.getUserTokens();
      console.log('Fetched user tokens:', tokens);
      setUserTokens(tokens);
    } catch (error) {
      console.error('Failed to fetch user tokens:', error);
    } finally {
      setLoadingUserTokens(false);
    }
  };

  const saveCustomTokens = (tokens) => {
    setCustomTokens(tokens);
    localStorage.setItem(`customTokens_${currentNetwork}`, JSON.stringify(tokens));
  };

  const addCustomToken = (token) => {
    const exists = customTokens.some(t => t.address.toLowerCase() === token.address.toLowerCase());
    if (!exists) {
      const newTokens = [...customTokens, token];
      saveCustomTokens(newTokens);
    }
  };

  const removeCustomToken = (address) => {
    const newTokens = customTokens.filter(t => t.address.toLowerCase() !== address.toLowerCase());
    saveCustomTokens(newTokens);
  };

  const importToken = async () => {
    if (!ethers.isAddress(importAddress)) {
      alert('Invalid token address');
      return;
    }

    setImporting(true);
    try {
      // In a real app, you'd fetch token info from the blockchain
      // For demo purposes, we'll create a mock token
      const mockToken = {
        symbol: 'CUSTOM',
        name: 'Custom Token',
        address: importAddress,
        decimals: 18,
        logo: '🔴',
        isCustom: true
      };
      
      addCustomToken(mockToken);
      setImportAddress('');
      setActiveTab('custom');
    } catch (error) {
      alert('Failed to import token: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const filterTokens = (tokens) => {
    if (!searchTerm) return tokens;
    return tokens.filter(token => 
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleTokenSelect = (token) => {
    onTokenSelect(token);
    onClose();
  };

  const getCurrentTokens = () => {
    switch (activeTab) {
      case 'my-tokens':
        return userTokens;
      case 'popular':
        return popularTokens[currentNetwork] || [];
      case 'custom':
        return customTokens;
      case 'import':
        return [];
      default:
        return [];
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md max-h-[80vh] relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={onClose}
          aria-label="Close token management"
        >
          &times;
        </button>
        
        <h2 className="text-xl font-bold text-white mb-4">Select Token</h2>
        
        {/* Search */}
        <div className="mb-4">
          <label htmlFor="token-mgmt-search" className="sr-only">Search by name or paste address</label>
          <input
            id="token-mgmt-search"
            name="searchTerm"
            type="text"
            placeholder="Search by name or paste address"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-4 bg-gray-700 rounded-lg p-1">
          {[
            { key: 'my-tokens', label: 'My Tokens' },
            { key: 'popular', label: 'Popular' },
            { key: 'custom', label: 'Custom' },
            { key: 'import', label: 'Import' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-96">
          {activeTab === 'import' ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="token-mgmt-import-address" className="block text-sm font-medium text-gray-300 mb-2">
                  Token Contract Address
                </label>
                <input
                  id="token-mgmt-import-address"
                  name="importAddress"
                  type="text"
                  placeholder="0x..."
                  value={importAddress}
                  onChange={(e) => setImportAddress(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={importToken}
                disabled={importing || !importAddress}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : 'Import Token'}
              </button>
              <div className="text-xs text-gray-400">
                <p>⚠️ Import at your own risk</p>
                <p>• Verify the token contract address</p>
                <p>• Check token information carefully</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {activeTab === 'my-tokens' && loadingUserTokens ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading your tokens...</p>
                </div>
              ) : filterTokens(getCurrentTokens()).length > 0 ? (
                filterTokens(getCurrentTokens()).map((token) => (
                  <div
                    key={token.address}
                    className="flex items-center justify-between p-3 bg-gray-750 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => handleTokenSelect(token)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{token.logo}</div>
                      <div>
                        <p className="text-white font-medium">{token.symbol}</p>
                        <p className="text-gray-400 text-sm">{token.name}</p>
                        {activeTab === 'my-tokens' && token.balance && (
                          <p className="text-blue-400 text-xs">Balance: {token.formattedBalance}</p>
                        )}
                      </div>
                    </div>
                    {activeTab === 'custom' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCustomToken(token.address);
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                        aria-label="Remove token"
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <EmptyState
                  variant="tokens"
                  icon="🔍"
                  title="No tokens found"
                  description={
                    activeTab === 'my-tokens'
                      ? 'No tokens found in your wallet on this network.'
                      : activeTab === 'popular'
                      ? 'No popular tokens match your search. Try a different search term.'
                      : 'Add custom token addresses to track tokens not in our list.'
                  }
                />
              )}
            </div>
          )}
        </div>

        {/* Security Badges for Selected Token */}
        {activeTab === 'popular' && filterTokens(getCurrentTokens()).length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <SecurityBadges
              tokenAddress={filterTokens(getCurrentTokens())[0]?.address}
              network={{ chainId: currentNetwork }}
              showDetails={false}
            />
          </div>
        )}

        {/* Network Info */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 text-center">
            Network: {currentNetwork === 1 ? 'Ethereum' : 
                      currentNetwork === 137 ? 'Polygon' :
                      currentNetwork === 56 ? 'BSC' :
                      currentNetwork === 42161 ? 'Arbitrum' : 'Unknown'}
          </p>
        </div>
      </div>
    </div>
  );
} 