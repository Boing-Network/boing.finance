// Token Details Modal Component
// Shows comprehensive token information with price data, transaction history, etc.

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useQuery } from '@tanstack/react-query';
import coingeckoService from '../services/coingeckoService';
import etherscanService from '../services/etherscanService';
import { tokenFavorites } from '../utils/tokenFavorites';
import { getNetworkByChainId } from '../config/networks';
import toast from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';
import OptimizedImage from './OptimizedImage';

const TokenDetailsModal = ({ token, isOpen, onClose, network }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [priceData, setPriceData] = useState(null);
  const [holderCount, setHolderCount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Get network name for CoinGecko
  const getCoinGeckoNetwork = (chainId) => {
    const networkMap = {
      1: 'ethereum',
      137: 'polygon',
      56: 'binance-smart-chain',
      42161: 'arbitrum',
      10: 'optimistic-ethereum',
      8453: 'base',
      11155111: 'ethereum' // Sepolia uses ethereum
    };
    return networkMap[chainId] || 'ethereum';
  };

  // Check if token is favorite
  useEffect(() => {
    if (token) {
      setIsFavorite(tokenFavorites.isFavorite(token.chainId || network?.chainId, token.address));
    }
  }, [token, network]);

  // Fetch price data
  const { data: priceInfo, isLoading: priceLoading } = useQuery(
    ['tokenPrice', token?.address, network?.chainId],
    async () => {
      if (!token?.address || !network?.chainId) return null;
      const cgNetwork = getCoinGeckoNetwork(network.chainId);
      return await coingeckoService.getTokenPrice(token.address, cgNetwork);
    },
    {
      enabled: !!token && !!network,
      refetchInterval: 60000, // Refetch every minute
    }
  );

  // Fetch holder count
  useEffect(() => {
    if (token?.address && network?.chainId) {
      const fetchHolderCount = async () => {
        try {
          const networkName = getNetworkByChainId(network.chainId)?.name?.toLowerCase() || 'ethereum';
          const count = await etherscanService.getTokenHolders(token.address, networkName);
          setHolderCount(count);
        } catch (error) {
          console.error('Error fetching holder count:', error);
        }
      };
      fetchHolderCount();
    }
  }, [token, network]);

  // Fetch transactions
  useEffect(() => {
    if (token?.address && network?.chainId && activeTab === 'transactions') {
      const fetchTransactions = async () => {
        try {
          const networkName = getNetworkByChainId(network.chainId)?.name?.toLowerCase() || 'ethereum';
          const txs = await etherscanService.getTokenTransactions(token.address, token.address, networkName);
          setTransactions(txs.slice(0, 10)); // Limit to 10 recent
        } catch (error) {
          console.error('Error fetching transactions:', error);
        }
      };
      fetchTransactions();
    }
  }, [token, network, activeTab]);

  const toggleFavorite = () => {
    if (!token) return;
    
    const tokenData = {
      address: token.address,
      name: token.name,
      symbol: token.symbol,
      network: token.chainId || network?.chainId,
      decimals: token.decimals,
      totalSupply: token.totalSupply
    };

    if (isFavorite) {
      tokenFavorites.remove(tokenData.network, token.address);
      setIsFavorite(false);
      toast.success('Removed from favorites');
    } else {
      tokenFavorites.add(tokenData);
      setIsFavorite(true);
      toast.success('Added to favorites');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num < 0.01) return '< 0.01';
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const getExplorerUrl = (address) => {
    const chainId = token?.chainId || network?.chainId;
    const explorerMap = {
      1: `https://etherscan.io/token/${address}`,
      137: `https://polygonscan.com/token/${address}`,
      56: `https://bscscan.com/token/${address}`,
      42161: `https://arbiscan.io/token/${address}`,
      10: `https://optimistic.etherscan.io/token/${address}`,
      8453: `https://basescan.org/token/${address}`,
      11155111: `https://sepolia.etherscan.io/token/${address}`
    };
    return explorerMap[chainId] || `https://etherscan.io/token/${address}`;
  };

  if (!isOpen || !token) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="rounded-xl p-6 shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)'
      }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
              {token.symbol?.charAt(0) || 'T'}
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {token.name}
              </h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                {token.symbol}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleFavorite}
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: isFavorite ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                color: isFavorite ? '#fbbf24' : 'var(--text-secondary)'
              }}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg className="w-6 h-6" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)'
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          {['overview', 'transactions', 'price'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500'
                  : ''
              }`}
              style={{
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottomColor: activeTab === tab ? '#3b82f6' : 'transparent'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Price Info */}
            {priceLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : priceInfo ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>Price (USD)</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    ${formatNumber(priceInfo.usd)}
                  </p>
                  {priceInfo.usd_24h_change && (
                    <p className={`text-sm mt-1 ${priceInfo.usd_24h_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {priceInfo.usd_24h_change >= 0 ? '+' : ''}{priceInfo.usd_24h_change.toFixed(2)}% (24h)
                    </p>
                  )}
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>Holders</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {holderCount !== null ? formatNumber(holderCount) : 'Loading...'}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Token Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Token Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>Address</p>
                  <div className="flex items-center space-x-2">
                    <p className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {formatAddress(token.address)}
                    </p>
                    <button
                      onClick={() => copyToClipboard(token.address)}
                      className="p-1 rounded transition-colors"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>Network</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {getNetworkByChainId(token.chainId || network?.chainId)?.name || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>Total Supply</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {formatNumber(parseFloat(ethers.formatUnits(token.totalSupply || '0', token.decimals || 18)))}
                  </p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>Decimals</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {token.decimals || 18}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4 pt-4">
              <a
                href={getExplorerUrl(token.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 rounded-lg text-center transition-colors"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)'
                }}
              >
                View on Explorer
              </a>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Transactions</h3>
            {transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.map((tx, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {formatAddress(tx.hash)}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                          {new Date(parseInt(tx.timeStamp) * 1000).toLocaleString()}
                        </p>
                      </div>
                      <a
                        href={`${getExplorerUrl(token.address).replace('/token/', '/tx/')}${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                No transactions found
              </p>
            )}
          </div>
        )}

        {/* Price Tab */}
        {activeTab === 'price' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Price Information</h3>
            {priceLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : priceInfo ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-tertiary)' }}>Current Price</p>
                  <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    ${formatNumber(priceInfo.usd)}
                  </p>
                  {priceInfo.usd_24h_change && (
                    <p className={`text-lg mt-2 ${priceInfo.usd_24h_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {priceInfo.usd_24h_change >= 0 ? '+' : ''}{priceInfo.usd_24h_change.toFixed(2)}% (24h)
                    </p>
                  )}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Price data provided by CoinGecko
                </p>
              </div>
            ) : (
              <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                Price data not available for this token
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenDetailsModal;

