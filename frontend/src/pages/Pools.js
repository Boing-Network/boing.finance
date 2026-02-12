import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useWallet } from '../contexts/WalletContext';
import { useChainType } from '../contexts/SolanaWalletContext';
import { PoolsSolanaContent } from '../components/SolanaFeaturePlaceholder';
import EmptyState from '../components/EmptyState';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import {
  getUserLiquidityPositions,
  getUserCreatedPools,
  fetchUserPoolsFromBlockchain,
  getPoolAnalytics
} from '../services/poolService';
import { useBlockchainPools } from '../hooks/useBlockchainPools';
import { getNetworkByChainId } from '../config/networks';
import { useAchievements } from '../contexts/AchievementContext';
import ShareCardModal from '../components/ShareCardModal';

// Pool Card Component
const PoolCard = ({ pool, type = 'user', onViewDetails, onCollectFees, onRemoveLiquidity }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await getPoolAnalytics(pool.address, pool.chainId);
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to fetch pool analytics:', error);
      }
    };

    if (pool.address) {
      fetchAnalytics();
    }
  }, [pool.address, pool.chainId]);

  const handleCollectFees = async () => {
    setIsLoading(true);
    try {
      await onCollectFees(pool.address, pool.chainId);
      toast.success('Fees collected successfully!');
    } catch (error) {
      toast.error('Failed to collect fees');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    setIsLoading(true);
    try {
      await onRemoveLiquidity(pool.address, pool.lpBalance, pool.chainId);
      toast.success('Liquidity removed successfully!');
    } catch (error) {
      toast.error('Failed to remove liquidity');
    } finally {
      setIsLoading(false);
    }
  };

  const getChainName = (chainId) => {
    const names = { 1: 'Ethereum', 137: 'Polygon', 56: 'BSC', 42161: 'Arbitrum', 10: 'Optimism', 8453: 'Base', 11155111: 'Sepolia', 43114: 'Avalanche', 250: 'Fantom', 59144: 'Linea', 324: 'zkSync Era', 534352: 'Scroll', 1101: 'Polygon zkEVM', 5000: 'Mantle', 81457: 'Blast', 204: 'opBNB', 34443: 'Mode' };
    return names[chainId] || `Chain ${chainId}`;
  };

  const getChainColor = (chainId) => {
    const colors = { 1: 'bg-blue-500', 137: 'bg-purple-500', 56: 'bg-yellow-500', 42161: 'bg-blue-600', 10: 'bg-red-500', 8453: 'bg-indigo-500', 11155111: 'bg-gray-500', 43114: 'bg-red-600', 250: 'bg-blue-700', 59144: 'bg-cyan-500', 324: 'bg-indigo-600', 534352: 'bg-amber-400', 1101: 'bg-purple-600', 5000: 'bg-stone-600', 81457: 'bg-yellow-400', 204: 'bg-yellow-600', 34443: 'bg-red-700' };
    return colors[chainId] || 'bg-gray-500';
  };

  return (
    <div className="rounded-xl p-6 border transition-colors hover:opacity-95" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {pool.token0?.symbol?.charAt(0) || 'T'}
              </span>
            </div>
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {pool.token1?.symbol?.charAt(0) || 'T'}
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {pool.token0?.symbol}/{pool.token1?.symbol}
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChainColor(pool.chainId)} text-white`}>
                {getChainName(pool.chainId)}
              </span>
              {pool.source && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  pool.isYourPool ? 'bg-green-500' : 'bg-blue-500'
                } text-white`}>
                  {pool.source}
                </span>
              )}
              {type === 'created' && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500 text-white">
                  Created
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Fee</p>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{pool.fee ? `${(pool.fee * 100).toFixed(2)}%` : '0.3%'}</p>
        </div>
      </div>

      {/* Pool Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Token 0</p>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{pool.token0?.symbol}</p>
          {type === 'user' && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {parseFloat(pool.token0?.formattedAmount || pool.token0?.formattedReserve || 0).toFixed(4)}
            </p>
          )}
        </div>
        <div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Token 1</p>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{pool.token1?.symbol}</p>
          {type === 'user' && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {parseFloat(pool.token1?.formattedAmount || pool.token1?.formattedReserve || 0).toFixed(4)}
            </p>
          )}
        </div>
      </div>

      {/* Analytics for all pools */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>APY</p>
          <p className="text-green-600 dark:text-green-400 font-medium">
            {pool.apy && pool.apy > 0 ? `${pool.apy.toFixed(2)}%` : 'No data'}
          </p>
        </div>
        <div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>24h Volume</p>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {pool.formattedVolume24h && pool.volume24h > 0 ? pool.formattedVolume24h : 'No data'}
          </p>
        </div>
        {analytics && (
          <>
            <div>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Total Liquidity</p>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {analytics.totalLiquidity && parseFloat(analytics.totalLiquidity) > 0 ? `$${parseFloat(analytics.totalLiquidity).toLocaleString()}` : 'No data'}
              </p>
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Swap Count</p>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {pool.swapCount && pool.swapCount > 0 ? pool.swapCount.toLocaleString() : 'No data'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          onClick={() => onViewDetails(pool)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
        >
          View Details
        </button>
        {type === 'user' && (
          <>
            <button
              onClick={handleCollectFees}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
            >
              {isLoading ? '...' : 'Collect Fees'}
            </button>
            <button
              onClick={handleRemoveLiquidity}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
            >
              {isLoading ? '...' : 'Remove'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Pool Details Modal
const PoolDetailsModal = ({ pool, isOpen, onClose, onAddLiquidity, onRemoveLiquidity, onCollectFees, onLiquiditySuccess }) => {
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'add', 'remove'
  const [token0Amount, setToken0Amount] = useState('');
  const [token1Amount, setToken1Amount] = useState('');
  const [removePercentage, setRemovePercentage] = useState(25); // Default 25%
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !pool) return null;

  const handleAddLiquidity = async () => {
    if (!token0Amount || !token1Amount) {
      toast.error('Please enter amounts for both tokens');
      return;
    }
    
    setIsLoading(true);
    try {
      await onAddLiquidity(pool.address, token0Amount, token1Amount, pool.chainId);
      toast.success('Liquidity added successfully!');
      onLiquiditySuccess?.();
      setToken0Amount('');
      setToken1Amount('');
      setActiveTab('details');
    } catch (error) {
      toast.error('Failed to add liquidity: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    setIsLoading(true);
    try {
      await onRemoveLiquidity(pool.address, removePercentage, pool.chainId);
      toast.success('Liquidity removed successfully!');
      setRemovePercentage(25);
      setActiveTab('details');
    } catch (error) {
      toast.error('Failed to remove liquidity: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCollectFees = async () => {
    setIsLoading(true);
    try {
      await onCollectFees(pool.address, pool.chainId);
      toast.success('Fees collected successfully!');
    } catch (error) {
      toast.error('Failed to collect fees: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateToken1Amount = (token0Input) => {
    if (!token0Input || !pool.token0?.reserve || !pool.token1?.reserve) return '';
    const token0Reserve = parseFloat(ethers.formatUnits(pool.token0.reserve, pool.token0.decimals));
    const token1Reserve = parseFloat(ethers.formatUnits(pool.token1.reserve, pool.token1.decimals));
    const ratio = token1Reserve / token0Reserve;
    return (parseFloat(token0Input) * ratio).toFixed(6);
  };

  const handleToken0AmountChange = (value) => {
    setToken0Amount(value);
    setToken1Amount(calculateToken1Amount(value));
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Pool Details</h2>
          <button
            onClick={onClose}
            className="text-2xl hover:opacity-80 transition-opacity"
            style={{ color: 'var(--text-tertiary)' }}
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 rounded-lg p-1" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'details'
                ? 'bg-blue-600 text-white'
                : ''
            }`}
            style={activeTab !== 'details' ? { color: 'var(--text-secondary)' } : {}}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'add'
                ? 'bg-green-600 text-white'
                : ''
            }`}
            style={activeTab !== 'add' ? { color: 'var(--text-secondary)' } : {}}
          >
            Add Liquidity
          </button>
          {pool.userShare && (
            <button
              onClick={() => setActiveTab('remove')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'remove'
                  ? 'bg-red-600 text-white'
                  : ''
              }`}
              style={activeTab !== 'remove' ? { color: 'var(--text-secondary)' } : {}}
            >
              Remove Liquidity
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Pool Info */}
            <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Pool Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Pool Address</p>
                  <p className="font-mono text-sm break-all" style={{ color: 'var(--text-primary)' }}>{pool.address}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Trading Fee</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{pool.fee ? `${(pool.fee * 100).toFixed(2)}%` : '0.3%'}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>APY</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{pool.apy && pool.apy > 0 ? `${pool.apy.toFixed(2)}%` : 'No data'}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>24h Volume</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{pool.formattedVolume24h && pool.volume24h > 0 ? pool.formattedVolume24h : 'No data'}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Source</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{pool.source || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Total Liquidity</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{pool.formattedTvl ? pool.formattedTvl : '$0'}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>(Token amounts, not USD value)</p>
                </div>
              </div>
            </div>

            {/* Token Information */}
            <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Token Information</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{pool.token0?.symbol}</p>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{pool.token0?.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{pool.token0?.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {parseFloat(pool.token0?.formattedReserve || pool.token0?.formattedAmount || 0).toFixed(4)}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Reserve</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{pool.token1?.symbol}</p>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{pool.token1?.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{pool.token1?.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {parseFloat(pool.token1?.formattedReserve || pool.token1?.formattedAmount || 0).toFixed(4)}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Reserve</p>
                  </div>
                </div>
              </div>
            </div>

            {/* User Position */}
            {pool.userShare && (
              <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Your Position</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Your Share</p>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{(pool.userShare * 100).toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>LP Tokens</p>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {pool.lpBalance ? parseFloat(ethers.formatUnits(pool.lpBalance, 18)).toFixed(4) : '0.0000'}
                    </p>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleCollectFees}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    {isLoading ? 'Collecting...' : 'Collect Fees'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Liquidity Tab */}
        {activeTab === 'add' && (
          <div className="space-y-6">
            <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Add Liquidity</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {pool.token0?.symbol} Amount
                  </label>
                  <input
                    type="number"
                    value={token0Amount}
                    onChange={(e) => handleToken0AmountChange(e.target.value)}
                    placeholder="0.0"
                    className="w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {pool.token1?.symbol} Amount
                  </label>
                  <input
                    type="number"
                    value={token1Amount}
                    onChange={(e) => setToken1Amount(e.target.value)}
                    placeholder="0.0"
                    className="w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
                
                <button
                  onClick={handleAddLiquidity}
                  disabled={isLoading || !token0Amount || !token1Amount}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  {isLoading ? 'Adding Liquidity...' : 'Add Liquidity'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Liquidity Tab */}
        {activeTab === 'remove' && pool.userShare && (
          <div className="space-y-6">
            <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Remove Liquidity</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Remove Percentage
                  </label>
                  <div className="flex space-x-2 mb-3">
                    {[25, 50, 75, 100].map((percent) => (
                      <button
                        key={percent}
                        onClick={() => setRemovePercentage(percent)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          removePercentage === percent
                            ? 'bg-red-600 text-white'
                            : ''
                        }`}
                        style={removePercentage !== percent ? { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' } : {}}
                      >
                        {percent}%
                      </button>
                    ))}
                  </div>
                  
                  <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>You will receive:</p>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {pool.token0?.symbol}: {pool.token0?.formattedAmount ? ((parseFloat(pool.token0.formattedAmount) * removePercentage) / 100).toFixed(4) : '0.0000'}
                    </p>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {pool.token1?.symbol}: {pool.token1?.formattedAmount ? ((parseFloat(pool.token1.formattedAmount) * removePercentage) / 100).toFixed(4) : '0.0000'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleRemoveLiquidity}
                  disabled={isLoading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  {isLoading ? 'Removing Liquidity...' : `Remove ${removePercentage}% Liquidity`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Pool List Component
// eslint-disable-next-line no-unused-vars
const PoolList = ({ pools, type = 'all', onViewDetails, onCollectFees, onRemoveLiquidity }) => {
  // eslint-disable-next-line no-unused-vars
  const [isLoading, setIsLoading] = useState(false);

  // eslint-disable-next-line no-unused-vars
  const handleCollectFees = async (poolAddress, chainId, event) => {
    event.stopPropagation(); // Prevent row click
    setIsLoading(true);
    try {
      await onCollectFees(poolAddress, chainId);
      toast.success('Fees collected successfully!');
    } catch (error) {
      toast.error('Failed to collect fees');
    } finally {
      setIsLoading(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleRemoveLiquidity = async (poolAddress, lpAmount, chainId, event) => {
    event.stopPropagation(); // Prevent row click
    setIsLoading(true);
    try {
      await onRemoveLiquidity(poolAddress, lpAmount, chainId);
      toast.success('Liquidity removed successfully!');
    } catch (error) {
      toast.error('Failed to remove liquidity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = (pool) => {
    onViewDetails(pool);
  };

  const getChainNameForTable = (chainId) => getNetworkByChainId(chainId)?.name || `Chain ${chainId}`;
  const getChainColorForTable = (chainId) => {
    const colors = { 1: 'bg-blue-500', 137: 'bg-purple-500', 56: 'bg-yellow-500', 42161: 'bg-blue-600', 10: 'bg-red-500', 8453: 'bg-indigo-500', 11155111: 'bg-gray-500' };
    return colors[chainId] || 'bg-gray-500';
  };

  if (!pools || pools.length === 0) {
    return (
      <div className="text-center py-8">
        <p style={{ color: 'var(--text-tertiary)' }}>No pools found</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
      {/* Table Header */}
      <div className="px-6 py-4 border-b transition-colors duration-200" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
        <div className="grid grid-cols-11 gap-4 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          <div className="col-span-3">Pool</div>
          <div className="col-span-2">Total Liquidity</div>
          <div className="col-span-2">APY</div>
          <div className="col-span-2">24h Volume</div>
          <div className="col-span-2">Fee</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
        {pools.map((pool, index) => (
          <div 
            key={`${pool.address}-${index}`} 
            className="px-6 py-2 hover:shadow-lg hover:border-l-4 hover:border-l-blue-500 transition-all duration-200 cursor-pointer group relative"
            style={{ borderLeftColor: 'transparent' }}
            onClick={() => handleRowClick(pool)}
          >
            {/* Hover overlay for better visual feedback */}
            <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-5 transition-opacity duration-200 pointer-events-none"></div>
            
            <div className="grid grid-cols-11 gap-4 items-center relative z-10">
              {/* Pool Info */}
              <div className="col-span-3">
                <div className="flex items-center space-x-3">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <span className="text-white font-bold text-sm">
                        {pool.token0?.symbol?.charAt(0) || 'T'}
                      </span>
                    </div>
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <span className="text-white font-bold text-sm">
                        {pool.token1?.symbol?.charAt(0) || 'T'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium flex items-center group-hover:text-blue-300 transition-colors duration-200" style={{ color: 'var(--text-primary)' }}>
                      {pool.token0?.symbol}/{pool.token1?.symbol}
                      <span className="ml-2 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-200" style={{ color: 'var(--text-tertiary)' }}>
                        →
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChainColorForTable(pool.chainId)} text-white group-hover:shadow-md transition-shadow duration-200`}>
                        {getChainNameForTable(pool.chainId)}
                      </span>
                      {pool.source && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          pool.isYourPool ? 'bg-green-500' : 'bg-blue-500'
                        } text-white group-hover:shadow-md transition-shadow duration-200`}>
                          {pool.source}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* TVL */}
              <div className="col-span-2">
                <div className="text-white font-medium group-hover:text-blue-300 transition-colors duration-200">
                  {pool.formattedTvl ? pool.formattedTvl : '$0'}
                </div>
              </div>

              {/* APY */}
              <div className="col-span-2">
                <div className="text-green-400 font-medium group-hover:text-green-300 transition-colors duration-200">
                  {pool.apy && pool.apy > 0 ? `${pool.apy.toFixed(2)}%` : 'No data'}
                </div>
              </div>

              {/* 24h Volume */}
              <div className="col-span-2">
                <div className="text-white font-medium group-hover:text-blue-300 transition-colors duration-200">
                  {pool.formattedVolume24h && pool.volume24h > 0 ? pool.formattedVolume24h : 'No data'}
                </div>
              </div>

              {/* Fee */}
              <div className="col-span-2">
                <div className="text-white font-medium group-hover:text-blue-300 transition-colors duration-200">
                  {pool.fee ? `${(pool.fee * 100).toFixed(2)}%` : '0.3%'}
                </div>
              </div>
            </div>

            {/* User-specific info row (expanded) */}
          </div>
        ))}
      </div>
    </div>
  );
};

const Pools = () => {
  const { isSolana } = useChainType();
  const { isConnected, account } = useWalletConnection();
  const { chainId } = useWallet();
  const { record: recordAchievement } = useAchievements() || {};
  // Wallet state initialized
  const [activeTab, setActiveTab] = useState('all-pools');
  const [selectedPool, setSelectedPool] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [useBlockchainFallback, setUseBlockchainFallback] = useState(false);
  const [sortBy, setSortBy] = useState('volume24h'); // Default sort by 24h volume
  const [sortOrder, setSortOrder] = useState('desc'); // Default descending order
  const [viewMode, setViewMode] = useState('list'); // Default to list view
  const [searchQuery, setSearchQuery] = useState(''); // Search functionality
  const [searchTerm, setSearchTerm] = useState(''); // Actual search term to execute
  const [isSearching, setIsSearching] = useState(false); // Track if search is active
  const [searchPage, setSearchPage] = useState(1); // Search pagination
  const [searchLimit, setSearchLimit] = useState(50); // Initial search limit - increased from 10
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState(null);
  
  // Blockchain pools hook - hooks must be called unconditionally
  const blockchainPoolsHook = useBlockchainPools();
  
  // Safely extract values with defaults
  const blockchainInitialized = blockchainPoolsHook?.isInitialized || false;
  // const blockchainLoading = blockchainPoolsHook?.isLoading || false; // Unused
  // const blockchainError = blockchainPoolsHook?.error || null; // Unused, commented out
  // const getBlockchainUserPositions = blockchainPoolsHook?.getUserPositions || (async () => []); // Unused
  const getAllPoolsFromBlockchain = blockchainPoolsHook?.getAllPools || (async () => []);
  const getAllSepoliaPools = blockchainPoolsHook?.getAllSepoliaPools || (async () => []);
  // const getBlockchainCreatedPools = blockchainPoolsHook?.getUserCreatedPools || (async () => []); // Unused
  const getUserPositionInPool = blockchainPoolsHook?.getUserPositionInPool || (async () => null);

  // Fetch user pools - React Query v5 API
  // eslint-disable-next-line no-unused-vars
  const { data: userPools, isLoading: userPoolsLoading, refetch: refetchUserPools } = useQuery({
    queryKey: ['user-pools', account, chainId, useBlockchainFallback],
    queryFn: async () => {
      // Fetching user pools
      if (!account) return [];
      
      try {
        if (useBlockchainFallback) {
          return await fetchUserPoolsFromBlockchain(account, chainId);
        } else {
          return await getUserLiquidityPositions(account, chainId);
        }
      } catch (error) {
        console.error('[Pools] Error fetching user pools:', error);
        // Return empty array instead of throwing to prevent page crash
        return [];
      }
    },
    enabled: !!account,
    refetchInterval: 30000,
    retry: 1, // Reduce retries to prevent long loading
    retryDelay: 1000,
    onError: (error) => {
      // User pools query error
      setUseBlockchainFallback(true);
    }
  });

  // Fetch created pools - React Query v5 API
  const { data: createdPools, isLoading: createdPoolsLoading } = useQuery({
    queryKey: ['created-pools', account, chainId],
    queryFn: () => {
      // Fetching created pools
      return getUserCreatedPools(account, chainId);
    },
    enabled: !!account,
    refetchInterval: 30000,
    retry: 2
  });

  // Fetch all pools - React Query v5 API
  const { data: allPools, isLoading: allPoolsLoading } = useQuery({
    queryKey: ['all-pools', chainId, blockchainInitialized],
    queryFn: async () => {
      // Fetching all pools
      try {
        if (chainId === 11155111 && blockchainInitialized) { // Sepolia
          // Use blockchain service to get all Sepolia pools (limit to 30)
          return await getAllSepoliaPools(30);
        } else {
          // Fallback to API for other networks - using blockchain service
          return await getAllPoolsFromBlockchain(chainId);
        }
      } catch (error) {
        console.error('[Pools] Error fetching all pools:', error);
        // Return empty array instead of throwing to prevent page crash
        return [];
      }
    },
    refetchInterval: 60000,
    retry: 1, // Reduce retries
    retryDelay: 1000,
    enabled: chainId === 11155111 ? blockchainInitialized : true,
    onError: (error) => {
      console.error('[Pools] All pools query error:', error);
      // Don't throw - let the component handle empty state
    }
  });

  // Fetch all pools for search (unlimited) - React Query v5 API
  const { data: allPoolsForSearch, isLoading: searchPoolsLoading } = useQuery({
    queryKey: ['all-pools-search', chainId, blockchainInitialized, searchTerm, searchPage, searchLimit],
    queryFn: async () => {
      // Fetching pools for search
      if (chainId === 11155111 && blockchainInitialized && searchTerm.trim()) { // Sepolia
        // Use blockchain service to get all Sepolia pools (limited for search)
        const totalLimit = Math.max(500, searchPage * searchLimit); // Get at least 500 pools to ensure comprehensive search
        return await getAllSepoliaPools(totalLimit); // Get pools up to the current page
      } else {
        // Fallback to API for other networks - using blockchain service
        return await getAllPoolsFromBlockchain(chainId);
      }
    },
    refetchInterval: 60000,
    retry: 2,
    enabled: chainId === 11155111 ? blockchainInitialized && searchTerm.trim().length > 0 : true,
    staleTime: 30000 // Cache for 30 seconds
  });

  const handleViewDetails = async (pool) => {
    // If the pool already has user position data, just open the modal
    if (pool.token0?.formattedAmount !== undefined && pool.token1?.formattedAmount !== undefined) {
      setSelectedPool(pool);
      setIsModalOpen(true);
      return;
    }
    // Otherwise, fetch user position data for this pool
    const userPosition = await getUserPositionInPool(pool.address);
    if (userPosition) {
      // Merge user position data into the pool object
      setSelectedPool({ ...pool, ...userPosition });
    } else {
      setSelectedPool(pool); // fallback, but will show zeros
    }
    setIsModalOpen(true);
  };

  // eslint-disable-next-line no-unused-vars
  const handleAddLiquidity = async (poolAddress, token0Amount, token1Amount, chainId) => {
    // Implementation for adding liquidity
    console.log('Adding liquidity to pool:', poolAddress, 'Token0:', token0Amount, 'Token1:', token1Amount);
    // TODO: Implement actual liquidity addition logic
    throw new Error('Add liquidity functionality not yet implemented');
  };

  // eslint-disable-next-line no-unused-vars
  const handleCollectFees = async (poolAddress, chainId) => {
    // Implementation for collecting fees
    console.log('Collecting fees for pool:', poolAddress);
    // TODO: Implement actual fee collection logic
    throw new Error('Collect fees functionality not yet implemented');
  };

  // eslint-disable-next-line no-unused-vars
  const handleRemoveLiquidity = async (poolAddress, percentage, chainId) => {
    // Implementation for removing liquidity
    console.log('Removing liquidity from pool:', poolAddress, 'Percentage:', percentage);
    // TODO: Implement actual liquidity removal logic
    throw new Error('Remove liquidity functionality not yet implemented');
  };

  // Handle search execution
  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSearchTerm(searchQuery.trim());
      setIsSearching(true);
      setSearchPage(1); // Reset to first page
      setSearchLimit(50); // Reset to initial limit
    } else {
      setSearchTerm('');
      setIsSearching(false);
      setSearchPage(1);
      setSearchLimit(50);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchTerm('');
    setIsSearching(false);
    setSearchPage(1);
    setSearchLimit(50);
  };

  // Handle load more pools
  const handleLoadMore = () => {
    setSearchLimit(prevLimit => prevLimit + 50);
    // Don't increment page since we're using the same data source
    // The limit will determine how many pools to show from the already fetched data
  };

  // Sort pools based on current sort settings
  const getSortedPools = (pools) => {
    if (!pools) return [];
    
    // Use search pools if we have a search term and are actively searching, otherwise use regular pools
    const poolsToFilter = isSearching && searchTerm.trim() && allPoolsForSearch ? allPoolsForSearch : pools;
    
    // First filter by search query
    let filteredPools = poolsToFilter;
    if (isSearching && searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      filteredPools = poolsToFilter.filter(pool => {
        const token0Symbol = pool.token0?.symbol?.toLowerCase() || '';
        const token1Symbol = pool.token1?.symbol?.toLowerCase() || '';
        const token0Name = pool.token0?.name?.toLowerCase() || '';
        const token1Name = pool.token1?.name?.toLowerCase() || '';
        const poolName = `${token0Symbol}/${token1Symbol}`;
        
        return token0Symbol.includes(query) || 
               token1Symbol.includes(query) || 
               token0Name.includes(query) || 
               token1Name.includes(query) || 
               poolName.includes(query);
      });
    }
    
    // Then sort the filtered pools by 24h volume (for search results)
    let sortedPools = filteredPools.sort((a, b) => {
      let aValue, bValue;
      
      if (isSearching && searchTerm.trim()) {
        // For search results, always sort by 24h volume first (most traded first)
        aValue = a.volume24h || 0;
        bValue = b.volume24h || 0;
        // Sort in descending order (highest volume first)
        return bValue - aValue;
      } else {
        // For regular display, use the selected sort option
        switch (sortBy) {
          case 'tvl':
            aValue = a.tvl || 0;
            bValue = b.tvl || 0;
            break;
          case 'apy':
            aValue = a.apy || 0;
            bValue = b.apy || 0;
            break;
          case 'volume24h':
            aValue = a.volume24h || 0;
            bValue = b.volume24h || 0;
            break;
          case 'fee':
            aValue = a.fee || 0;
            bValue = b.fee || 0;
            break;
          case 'name':
            aValue = `${a.token0?.symbol || ''}/${a.token1?.symbol || ''}`.toLowerCase();
            bValue = `${b.token0?.symbol || ''}/${b.token1?.symbol || ''}`.toLowerCase();
            break;
          default:
            aValue = a.volume24h || 0; // Default to 24h volume
            bValue = b.volume24h || 0;
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      }
    });

    // Limit results for search (show only the most traded pools)
    if (isSearching && searchTerm.trim()) {
      sortedPools = sortedPools.slice(0, searchLimit);
    }
    
    return sortedPools;
  };

  // Handle sort change
  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const tabs = [
    { id: 'all-pools', name: 'All Pools', count: allPools?.length || 0 },
    { id: 'user', name: 'My Pools', count: userPools?.length || 0 },
    { id: 'created', name: 'Created', count: createdPools?.length || 0 }
  ];

  if (isSolana) return <PoolsSolanaContent />;

  if (!isConnected || !account) {
    return (
      <>
        <Helmet>
          <title>Pools - boing.finance</title>
          <meta name="description" content="View and manage your liquidity pools on boing.finance" />
        </Helmet>
        <div className="relative min-h-screen">
          <div className="relative z-10 container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-3xl font-bold text-white mb-4">Liquidity Pools</h1>
              <p className="text-gray-300 mb-8">Connect your wallet to view your pools</p>
              <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
                <div className="text-6xl mb-4">🏊</div>
                <h2 className="text-xl font-semibold text-white mb-2">Wallet Required</h2>
                <p className="text-gray-400 mb-6">Please connect your wallet to view your liquidity pools</p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200">
                  Connect Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Pools - boing.finance</title>
        <meta name="description" content="View and manage your liquidity pools on boing.finance" />
      </Helmet>

      <div className="relative min-h-screen">
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">Liquidity Pools</h1>
              <p className="text-xl text-gray-300">
                Manage your liquidity positions and explore available pools
              </p>
            </div>

            {/* Tabs */}
            <div className="bg-gray-800 rounded-xl p-2 mb-8 border border-gray-700">
              <div className="flex space-x-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {tab.name}
                    {tab.count > 0 && (
                      <span className="ml-2 bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {/* User Pools Tab */}
              {activeTab === 'user' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">My Liquidity Positions</h2>
                    
                    {/* View Toggle */}
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-400">View:</label>
                      <div className="flex bg-gray-700 rounded-lg p-1">
                        <button
                          onClick={() => setViewMode('list')}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            viewMode === 'list'
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          List
                        </button>
                        <button
                          onClick={() => setViewMode('cards')}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            viewMode === 'cards'
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Cards
                        </button>
                      </div>
                    </div>
                  </div>

                  {userPoolsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-gray-800 rounded-xl p-6 border border-gray-700 animate-pulse">
                          <div className="h-4 bg-gray-700 rounded mb-4"></div>
                          <div className="h-3 bg-gray-700 rounded mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : userPools && userPools.length > 0 ? (
                    viewMode === 'list' ? (
                      <PoolList
                        pools={userPools}
                        type="user"
                        onViewDetails={handleViewDetails}
                        onCollectFees={handleCollectFees}
                        onRemoveLiquidity={handleRemoveLiquidity}
                      />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userPools.map((pool, index) => (
                          <PoolCard
                            key={`${pool.address}-${index}`}
                            pool={pool}
                            type="user"
                            onViewDetails={handleViewDetails}
                            onCollectFees={handleCollectFees}
                            onRemoveLiquidity={handleRemoveLiquidity}
                          />
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🏊</div>
                      <h3 className="text-xl font-semibold text-white mb-2">No Liquidity Positions</h3>
                      <p className="text-gray-400 mb-6">
                        You haven't provided liquidity to any pools yet.
                      </p>
                      <button
                        onClick={() => window.location.href = '/create-pool'}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
                      >
                        Create Your First Pool
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Created Pools Tab */}
              {activeTab === 'created' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Pools You Created</h2>
                    
                    {/* View Toggle */}
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-400">View:</label>
                      <div className="flex bg-gray-700 rounded-lg p-1">
                        <button
                          onClick={() => setViewMode('list')}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            viewMode === 'list'
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          List
                        </button>
                        <button
                          onClick={() => setViewMode('cards')}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            viewMode === 'cards'
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Cards
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {createdPoolsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-gray-800 rounded-xl p-6 border border-gray-700 animate-pulse">
                          <div className="h-4 bg-gray-700 rounded mb-4"></div>
                          <div className="h-3 bg-gray-700 rounded mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : createdPools && createdPools.length > 0 ? (
                    viewMode === 'list' ? (
                      <PoolList
                        pools={createdPools}
                        type="created"
                        onViewDetails={handleViewDetails}
                      />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {createdPools.map((pool, index) => (
                          <PoolCard
                            key={`${pool.address}-${index}`}
                            pool={pool}
                            type="created"
                            onViewDetails={handleViewDetails}
                          />
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🏭</div>
                      <h3 className="text-xl font-semibold text-white mb-2">No Created Pools</h3>
                      <p className="text-gray-400 mb-6">
                        You haven't created any pools yet.
                      </p>
                      <button
                        onClick={() => window.location.href = '/create-pool'}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
                      >
                        Create Your First Pool
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* All Pools Tab */}
              {activeTab === 'all-pools' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">All Available Pools</h2>
                  </div>

                  {/* Search Bar */}
                  <div className="mb-6">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search pools by token symbol or name, then press Enter..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="w-full bg-gray-700 text-white px-4 py-3 pl-12 pr-20 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 placeholder-gray-400"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                        {searchQuery && (
                          <button
                            onClick={handleClearSearch}
                            className="p-2 text-gray-400 hover:text-white mr-1"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={handleSearch}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                        >
                          Search
                        </button>
                      </div>
                    </div>
                    {isSearching && searchTerm && (
                      <p className="text-sm text-gray-400 mt-2">
                        Searching for: <span className="text-blue-400">{searchTerm}</span>
                        {searchTerm.trim() && allPoolsForSearch ? (
                          <span className="ml-2">
                            (Showing {Math.min(getSortedPools(allPools).length, searchLimit)} of {allPoolsForSearch.filter(pool => {
                              const query = searchTerm.toLowerCase().trim();
                              const token0Symbol = pool.token0?.symbol?.toLowerCase() || '';
                              const token1Symbol = pool.token1?.symbol?.toLowerCase() || '';
                              const token0Name = pool.token0?.name?.toLowerCase() || '';
                              const token1Name = pool.token1?.name?.toLowerCase() || '';
                              const poolName = `${token0Symbol}/${token1Symbol}`;
                              
                              return token0Symbol.includes(query) || 
                                     token1Symbol.includes(query) || 
                                     token0Name.includes(query) || 
                                     token1Name.includes(query) || 
                                     poolName.includes(query);
                            }).length} matching pools)
                          </span>
                        ) : allPools && (
                          <span className="ml-2">
                            ({getSortedPools(allPools).length} of {allPools.length} pools)
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  
                  {/* Controls */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
                    {/* Sort Controls */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-400">Sort by:</label>
                        <select
                          value={sortBy}
                          onChange={(e) => handleSortChange(e.target.value)}
                          className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm border border-gray-600 focus:outline-none focus:border-blue-500"
                        >
                          <option value="tvl">TVL</option>
                          <option value="apy">APY</option>
                          <option value="volume24h">24h Volume</option>
                          <option value="fee">Fee</option>
                          <option value="name">Name</option>
                        </select>
                      </div>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm border border-gray-600 transition-colors"
                      >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </button>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-400">View:</label>
                      <div className="flex bg-gray-700 rounded-lg p-1">
                        <button
                          onClick={() => setViewMode('list')}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            viewMode === 'list'
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          List
                        </button>
                        <button
                          onClick={() => setViewMode('cards')}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            viewMode === 'cards'
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Cards
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {allPoolsLoading || (isSearching && searchTerm.trim() && searchPoolsLoading) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="bg-gray-800 rounded-xl p-6 border border-gray-700 animate-pulse">
                          <div className="h-4 bg-gray-700 rounded mb-4"></div>
                          <div className="h-3 bg-gray-700 rounded mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : allPools && allPools.length > 0 ? (
                    viewMode === 'list' ? (
                      <PoolList
                        pools={getSortedPools(allPools)}
                        type="all"
                        onViewDetails={handleViewDetails}
                        onCollectFees={handleCollectFees}
                        onRemoveLiquidity={handleRemoveLiquidity}
                      />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {getSortedPools(allPools).map((pool, index) => (
                          <PoolCard
                            key={`${pool.address}-${index}`}
                            pool={pool}
                            type="all"
                            onViewDetails={handleViewDetails}
                            onCollectFees={handleCollectFees}
                            onRemoveLiquidity={handleRemoveLiquidity}
                          />
                        ))}
                      </div>
                    )
                  ) : (
                    <EmptyState
                      variant="pools"
                      icon={isSearching && searchTerm.trim() ? '🔍' : '🏊'}
                      title={isSearching && searchTerm.trim() ? 'No pools found' : 'No pools available'}
                      description={
                        isSearching && searchTerm.trim()
                          ? `No pools found matching "${searchTerm}" on this network.`
                          : 'No pools are available on this network. Create a pool to get started.'
                      }
                      actionLabel="Create pool"
                      actionHref="/create-pool"
                    />
                  )}

                  {/* Load More Button for Search Results */}
                  {isSearching && searchTerm.trim() && allPoolsForSearch && getSortedPools(allPools).length > 0 && (
                    <div className="mt-6 text-center">
                      {(() => {
                        const totalMatching = allPoolsForSearch.filter(pool => {
                          const query = searchTerm.toLowerCase().trim();
                          const token0Symbol = pool.token0?.symbol?.toLowerCase() || '';
                          const token1Symbol = pool.token1?.symbol?.toLowerCase() || '';
                          const token0Name = pool.token0?.name?.toLowerCase() || '';
                          const token1Name = pool.token1?.name?.toLowerCase() || '';
                          const poolName = `${token0Symbol}/${token1Symbol}`;
                          
                          return token0Symbol.includes(query) || 
                                 token1Symbol.includes(query) || 
                                 token0Name.includes(query) || 
                                 token1Name.includes(query) || 
                                 poolName.includes(query);
                        }).length;
                        
                        const currentlyShowing = Math.min(getSortedPools(allPools).length, searchLimit);
                        const hasMore = currentlyShowing < totalMatching;
                        
                        return hasMore ? (
                          <button
                            onClick={handleLoadMore}
                            disabled={searchPoolsLoading}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition duration-200"
                          >
                            {searchPoolsLoading ? (
                              <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Loading...
                              </span>
                            ) : (
                              `Load 50 More Pools (${currentlyShowing} of ${totalMatching} shown)`
                            )}
                          </button>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pool Details Modal */}
      <PoolDetailsModal
        pool={selectedPool}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPool(null);
        }}
        onAddLiquidity={handleAddLiquidity}
        onRemoveLiquidity={handleRemoveLiquidity}
        onCollectFees={handleCollectFees}
        onLiquiditySuccess={() => {
          recordAchievement?.(account, 'liquidity_add', 'first_liquidity');
          if (selectedPool) {
            const pair = `${selectedPool.token0?.symbol || ''}/${selectedPool.token1?.symbol || ''}`;
            const chainName = getNetworkByChainId(selectedPool.chainId)?.name;
            setShareData({ pair, chainName });
            setShareModalOpen(true);
          }
        }}
      />
      <ShareCardModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        type="pool"
        data={shareData}
      />
    </>
  );
};

export default Pools; 