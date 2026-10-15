import { evmLite } from '../utils/evmLite';
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useWallet } from '../contexts/WalletContext';
import { useChainType } from '../contexts/SolanaWalletContext';
import { PoolsSolanaContent } from '../components/SolanaFeaturePlaceholder';
import EmptyState from '../components/EmptyState';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getUserLiquidityPositions,
  getUserCreatedPools,
  fetchUserPoolsFromBlockchain,
  getPoolAnalytics
} from '../services/poolService';
import { useBlockchainPools } from '../hooks/useBlockchainPools';
import { getNetworkByChainId } from '../config/networks';
import getFeatureSupport from '../config/featureSupport';
import { getNetworkBadgeBgClass } from '../utils/networkBadgeClasses';
import useEscapeKey from '../hooks/useEscapeKey';

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
    } catch (error) {
      toast.error('Failed to remove liquidity');
    } finally {
      setIsLoading(false);
    }
  };

  const getChainName = (chainId) => {
    const names = { 1: 'Ethereum', 137: 'Polygon', 56: 'BSC', 42161: 'Arbitrum', 10: 'Optimism', 8453: 'Base', 11155111: 'Sepolia', 6913: 'Boing Testnet', 43114: 'Avalanche', 250: 'Fantom', 59144: 'Linea', 324: 'zkSync Era', 534352: 'Scroll', 1101: 'Polygon zkEVM', 5000: 'Mantle', 81457: 'Blast', 204: 'opBNB', 34443: 'Mode' };
    return names[chainId] || `Chain ${chainId}`;
  };

  const getChainColor = (chainId) => getNetworkBadgeBgClass(chainId);

  return (
    <div className="td-card td-card--quiet p-5 sm:p-6 transition-colors hover:border-[var(--border-hover)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--finance-primary)', color: '#041018' }}>
              <span className="font-bold text-sm">
                {pool.token0?.symbol?.charAt(0) || 'T'}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--finance-green-mid)', color: '#041018' }}>
              <span className="font-bold text-sm">
                {pool.token1?.symbol?.charAt(0) || 'T'}
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {pool.token0?.symbol}/{pool.token1?.symbol}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className={`td-badge ${getChainColor(pool.chainId)}`}>
                {getChainName(pool.chainId)}
              </span>
              {pool.source && (
                <span
                  className="td-badge"
                  style={{
                    backgroundColor: pool.isYourPool ? 'var(--finance-green-mid)' : 'var(--finance-primary)',
                  }}
                >
                  {pool.source}
                </span>
              )}
              {type === 'created' && (
                <span
                  className="td-badge"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--finance-primary) 25%, transparent)',
                    color: 'var(--finance-primary)',
                    border: '1px solid color-mix(in srgb, var(--finance-primary) 40%, transparent)',
                  }}
                >
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
          <p className="text-finance-green font-medium">
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
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onViewDetails(pool)}
          className="td-btn td-btn--primary flex-1 text-sm"
        >
          View Details
        </button>
        {type === 'user' && (
          <>
            <button
              type="button"
              onClick={handleCollectFees}
              disabled={isLoading}
              className="td-btn td-btn--green text-sm disabled:opacity-50"
            >
              {isLoading ? '...' : 'Collect Fees'}
            </button>
            <button
              type="button"
              onClick={handleRemoveLiquidity}
              disabled={isLoading}
              className="td-btn td-btn--ghost text-sm disabled:opacity-50"
              style={{ color: 'var(--finance-red-light)' }}
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
const PoolDetailsModal = ({ pool, isOpen, onClose, onAddLiquidity, onRemoveLiquidity, onCollectFees }) => {
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'add', 'remove'
  const [token0Amount, setToken0Amount] = useState('');
  const [token1Amount, setToken1Amount] = useState('');
  const [removePercentage, setRemovePercentage] = useState(25); // Default 25%
  const [isLoading, setIsLoading] = useState(false);
  useEscapeKey(isOpen, onClose);

  if (!isOpen || !pool) return null;

  const handleAddLiquidity = async () => {
    if (!token0Amount || !token1Amount) {
      toast.error('Please enter amounts for both tokens');
      return;
    }
    
    setIsLoading(true);
    try {
      await onAddLiquidity(pool.address, token0Amount, token1Amount, pool.chainId);
      onClose();
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
      onClose();
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
    } catch (error) {
      toast.error('Failed to collect fees: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateToken1Amount = (token0Input) => {
    if (!token0Input || !pool.token0?.reserve || !pool.token1?.reserve) return '';
    const token0Reserve = parseFloat(evmLite.formatUnits(pool.token0.reserve, pool.token0.decimals));
    const token1Reserve = parseFloat(evmLite.formatUnits(pool.token1.reserve, pool.token1.decimals));
    const ratio = token1Reserve / token0Reserve;
    return (parseFloat(token0Input) * ratio).toFixed(6);
  };

  const handleToken0AmountChange = (value) => {
    setToken0Amount(value);
    setToken1Amount(calculateToken1Amount(value));
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'var(--shadow)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pool-details-title"
      onClick={onClose}
    >
      <div
        className="td-modal td-modal--wide p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="pool-details-title" className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Pool Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl hover:opacity-80 transition-opacity"
            style={{ color: 'var(--text-tertiary)' }}
            aria-label="Close pool details"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="td-segmented w-full mb-6" role="tablist" aria-label="Pool actions">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'details'}
            onClick={() => setActiveTab('details')}
            className={`td-segmented__btn flex-1 ${activeTab === 'details' ? 'td-segmented__btn--active' : ''}`}
          >
            Details
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'add'}
            onClick={() => setActiveTab('add')}
            className={`td-segmented__btn flex-1 ${activeTab === 'add' ? 'td-segmented__btn--active' : ''}`}
          >
            Add Liquidity
          </button>
          {pool.userShare && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'remove'}
              onClick={() => setActiveTab('remove')}
              className={`td-segmented__btn flex-1 ${activeTab === 'remove' ? 'td-segmented__btn--active' : ''}`}
            >
              Remove
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
                      {pool.lpBalance ? parseFloat(evmLite.formatUnits(pool.lpBalance, 18)).toFixed(4) : '0.0000'}
                    </p>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleCollectFees}
                    disabled={isLoading}
                    className="td-btn td-btn--green disabled:opacity-50"
                  >
                    {isLoading ? 'Collecting…' : 'Collect Fees'}
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
                  <label htmlFor="pool-add-token0-amount" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {pool.token0?.symbol} Amount
                  </label>
                  <input
                    id="pool-add-token0-amount"
                    name="token0Amount"
                    type="number"
                    value={token0Amount}
                    onChange={(e) => handleToken0AmountChange(e.target.value)}
                    placeholder="0.0"
                    className="td-field__input"
                  />
                </div>
                
                <div>
                  <label htmlFor="pool-add-token1-amount" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {pool.token1?.symbol} Amount
                  </label>
                  <input
                    id="pool-add-token1-amount"
                    name="token1Amount"
                    type="number"
                    value={token1Amount}
                    onChange={(e) => setToken1Amount(e.target.value)}
                    placeholder="0.0"
                    className="td-field__input"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={handleAddLiquidity}
                  disabled={isLoading || !token0Amount || !token1Amount}
                  className="td-btn td-btn--green w-full disabled:opacity-50"
                >
                  {isLoading ? 'Adding liquidity…' : 'Add Liquidity'}
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
                        type="button"
                        className={`td-segmented__btn ${removePercentage === percent ? 'td-segmented__btn--active' : ''}`}
                        style={removePercentage === percent ? { color: 'var(--finance-red-light)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--finance-red) 45%, transparent)' } : undefined}
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
                  type="button"
                  onClick={handleRemoveLiquidity}
                  disabled={isLoading}
                  className="td-btn td-btn--danger w-full disabled:opacity-50"
                >
                  {isLoading ? 'Removing…' : `Remove ${removePercentage}%`}
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
  const getChainColorForTable = (chainId) => getNetworkBadgeBgClass(chainId);

  if (!pools || pools.length === 0) {
    return (
      <div className="text-center py-8">
        <p style={{ color: 'var(--text-tertiary)' }}>No pools found</p>
      </div>
    );
  }

  const renderPoolAvatars = (pool) => (
    <div className="flex -space-x-2 shrink-0">
      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--finance-primary)', color: '#041018' }}>
        <span className="font-bold text-sm">
          {pool.token0?.symbol?.charAt(0) || 'T'}
        </span>
      </div>
      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--finance-green-mid)', color: '#041018' }}>
        <span className="font-bold text-sm">
          {pool.token1?.symbol?.charAt(0) || 'T'}
        </span>
      </div>
    </div>
  );

  const renderPoolBadges = (pool) => (
    <div className="flex flex-wrap items-center gap-1.5 mt-1">
      <span className={`td-badge ${getChainColorForTable(pool.chainId)}`}>
        {getChainNameForTable(pool.chainId)}
      </span>
      {pool.source && (
        <span
          className="td-badge"
          style={{
            backgroundColor: pool.isYourPool ? 'var(--finance-green-mid)' : 'var(--finance-primary)',
          }}
        >
          {pool.source}
        </span>
      )}
    </div>
  );

  return (
    <div className="td-pool-list">
      {/* Mobile card list */}
      <div className="lg:hidden divide-y" style={{ borderColor: 'var(--border-color)' }}>
        {pools.map((pool, index) => (
          <button
            key={`mobile-${pool.address}-${index}`}
            type="button"
            className="td-pool-row w-full text-left"
            onClick={() => handleRowClick(pool)}
          >
            <div className="flex items-start gap-3 min-w-0">
              {renderPoolAvatars(pool)}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {pool.token0?.symbol}/{pool.token1?.symbol}
                </div>
                {renderPoolBadges(pool)}
              </div>
              <span className="shrink-0" style={{ color: 'var(--finance-primary)' }} aria-hidden>→</span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Total Liquidity</dt>
                <dd className="font-medium" style={{ color: 'var(--text-primary)' }}>{pool.formattedTvl ? pool.formattedTvl : '$0'}</dd>
              </div>
              <div>
                <dt className="text-xs" style={{ color: 'var(--text-tertiary)' }}>APY</dt>
                <dd className="font-medium" style={{ color: 'var(--finance-green)' }}>
                  {pool.apy && pool.apy > 0 ? `${pool.apy.toFixed(2)}%` : 'No data'}
                </dd>
              </div>
              <div>
                <dt className="text-xs" style={{ color: 'var(--text-tertiary)' }}>24h Volume</dt>
                <dd className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {pool.formattedVolume24h && pool.volume24h > 0 ? pool.formattedVolume24h : 'No data'}
                </dd>
              </div>
              <div>
                <dt className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Fee</dt>
                <dd className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {pool.fee ? `${(pool.fee * 100).toFixed(2)}%` : '0.3%'}
                </dd>
              </div>
            </dl>
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block">
      <div className="td-pool-list__head">
        <div className="grid grid-cols-11 gap-4 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          <div className="col-span-3">Pool</div>
          <div className="col-span-2">Total Liquidity</div>
          <div className="col-span-2">APY</div>
          <div className="col-span-2">24h Volume</div>
          <div className="col-span-2">Fee</div>
        </div>
      </div>

      <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
        {pools.map((pool, index) => (
          <div
            key={`${pool.address}-${index}`}
            className="td-pool-row group"
            onClick={() => handleRowClick(pool)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleRowClick(pool);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="grid grid-cols-11 gap-4 items-center relative z-10">
              <div className="col-span-3">
                <div className="flex items-center space-x-3">
                  {renderPoolAvatars(pool)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium flex items-center truncate" style={{ color: 'var(--text-primary)' }}>
                      {pool.token0?.symbol}/{pool.token1?.symbol}
                      <span className="ml-2 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        →
                      </span>
                    </div>
                    {renderPoolBadges(pool)}
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {pool.formattedTvl ? pool.formattedTvl : '$0'}
                </div>
              </div>

              <div className="col-span-2">
                <div className="font-medium" style={{ color: 'var(--finance-green)' }}>
                  {pool.apy && pool.apy > 0 ? `${pool.apy.toFixed(2)}%` : 'No data'}
                </div>
              </div>

              <div className="col-span-2">
                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {pool.formattedVolume24h && pool.volume24h > 0 ? pool.formattedVolume24h : 'No data'}
                </div>
              </div>

              <div className="col-span-2">
                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {pool.fee ? `${(pool.fee * 100).toFixed(2)}%` : '0.3%'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};

const Pools = () => {
  const { isSolana } = useChainType();
  const { isConnected, account, connectWallet } = useWalletConnection();
  const { chainId } = useWallet();
  const navigate = useNavigate();
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
    staleTime: 60_000,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    retry: 1, // Reduce retries to prevent long loading
    retryDelay: 1000,
    onError: (_error) => {
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
    staleTime: 60_000,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    retry: 2
  });

  // Fetch all pools - React Query v5 API
  const { data: allPools, isLoading: allPoolsLoading } = useQuery({
    queryKey: ['all-pools', chainId, blockchainInitialized],
    queryFn: async () => {
      // Fetching all pools
      try {
        const hasDex = getFeatureSupport(Number(chainId) || 0).hasDex;
        if (hasDex && blockchainInitialized) {
          if (chainId === 11155111) {
            return await getAllSepoliaPools(30);
          }
          return await getAllPoolsFromBlockchain(chainId);
        }
        return await getAllPoolsFromBlockchain(chainId);
      } catch (error) {
        console.error('[Pools] Error fetching all pools:', error);
        // Return empty array instead of throwing to prevent page crash
        return [];
      }
    },
    staleTime: 60_000,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    retry: 1, // Reduce retries
    retryDelay: 1000,
    enabled: getFeatureSupport(Number(chainId) || 0).hasDex ? blockchainInitialized : true,
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
      if (getFeatureSupport(Number(chainId) || 0).hasDex && blockchainInitialized && searchTerm.trim()) {
        if (chainId === 11155111) {
          const totalLimit = Math.max(500, searchPage * searchLimit);
          return await getAllSepoliaPools(totalLimit);
        }
        return await getAllPoolsFromBlockchain(chainId);
      } else {
        // Fallback to API for other networks - using blockchain service
        return await getAllPoolsFromBlockchain(chainId);
      }
    },
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    retry: 2,
    enabled: getFeatureSupport(Number(chainId) || 0).hasDex
      ? blockchainInitialized && searchTerm.trim().length > 0
      : true,
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

  const handleAddLiquidity = async (poolAddress, amount0, amount1) => {
    const src =
      (selectedPool && (!poolAddress || selectedPool.address === poolAddress) && selectedPool) ||
      (Array.isArray(userPools) ? userPools.find((p) => p.address === poolAddress) : null);
    const q = new URLSearchParams();
    if (src?.token0?.address) q.set('tokenA', src.token0.address);
    if (src?.token1?.address) q.set('tokenB', src.token1.address);
    if (amount0) q.set('amountA', String(amount0));
    if (amount1) q.set('amountB', String(amount1));
    toast('Finish add/remove on the Liquidity page for this pair.');
    navigate(q.toString() ? `/liquidity?${q.toString()}` : '/liquidity');
  };

  const handleCollectFees = async () => {
    toast('Fees stay in the pool until you remove LP — there is no separate collect.', { icon: 'ℹ️' });
    navigate('/liquidity');
  };

  const handleRemoveLiquidity = async (poolAddress) => {
    const src =
      (selectedPool && (!poolAddress || selectedPool.address === poolAddress) && selectedPool) ||
      (Array.isArray(userPools) ? userPools.find((p) => p.address === poolAddress) : null);
    const q = new URLSearchParams();
    if (src?.token0?.address) q.set('tokenA', src.token0.address);
    if (src?.token1?.address) q.set('tokenB', src.token1.address);
    toast('Remove LP from the Liquidity page.', { icon: 'ℹ️' });
    navigate(q.toString() ? `/liquidity?${q.toString()}` : '/liquidity');
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
          <title>Liquidity Pools | boing.finance — View & Manage Pools</title>
          <meta name="description" content="View and manage your liquidity pools on EVM and Solana. Track positions and earn fees with boing.finance." />
        </Helmet>
        <div className="relative w-full min-w-0">
          <div className="relative z-10 container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto text-center">
              <header className="td-hero td-hero--center mb-8">
                <span className="td-hero__eyebrow">Trade</span>
                <h1 className="td-hero__title">Pools</h1>
                <p className="td-hero__subtitle">Connect your wallet to see pools and your liquidity.</p>
              </header>
              <div className="td-card p-8">
                <EmptyState
                  variant="pools"
                  title="Wallet Required"
                  description="Connect your wallet to view your liquidity pools and earnings."
                  actionLabel="Connect Wallet"
                  action={connectWallet}
                />
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

      <div className="relative w-full min-w-0">
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <header className="td-hero td-hero--center mb-8">
              <span className="td-hero__eyebrow">Trade</span>
              <h1 className="td-hero__title">Pools</h1>
              <p className="td-hero__subtitle">
                See available pools and manage your liquidity
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                On Boing, factory pairs also appear under{' '}
                <a href="/swap?tab=pools" className="underline" style={{ color: 'var(--finance-primary)' }}>
                  Swap → Pools
                </a>
                .
              </p>
            </header>

            {/* Tabs */}
            <div className="td-panel-surface p-2 mb-8">
              <div
                className="flex space-x-2"
                role="tablist"
                aria-label="Pools views"
                onKeyDown={(e) => {
                  const ids = tabs.map((t) => t.id);
                  const i = ids.indexOf(activeTab);
                  if (e.key === 'ArrowRight' && i < ids.length - 1) {
                    e.preventDefault();
                    setActiveTab(ids[i + 1]);
                  } else if (e.key === 'ArrowLeft' && i > 0) {
                    e.preventDefault();
                    setActiveTab(ids[i - 1]);
                  }
                }}
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    id={`pools-tab-${tab.id}`}
                    tabIndex={activeTab === tab.id ? 0 : -1}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                      activeTab === tab.id ? 'td-segmented__btn--active' : ''
                    }`}
                    style={
                      activeTab === tab.id
                        ? undefined
                        : { color: 'var(--text-secondary)' }
                    }
                  >
                    {tab.name}
                    {tab.count > 0 && (
                      <span
                        className="ml-2 text-xs px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                        }}
                      >
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
                    <h2 className="td-section-title mb-0">My Liquidity Positions</h2>
                    
                    {/* View Toggle */}
                    <div className="flex items-center space-x-2">
                      <label className="text-sm" style={{ color: 'var(--text-tertiary)' }}>View:</label>
                      <div className="td-segmented">
                        <button
                          type="button"
                          onClick={() => setViewMode('list')}
                          className={`td-segmented__btn ${viewMode === 'list' ? 'td-segmented__btn--active' : ''}`}
                        >
                          List
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('cards')}
                          className={`td-segmented__btn ${viewMode === 'cards' ? 'td-segmented__btn--active' : ''}`}
                        >
                          Cards
                        </button>
                      </div>
                    </div>
                  </div>

                  {userPoolsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="td-card td-card--quiet p-6 animate-pulse">
                          <div className="h-4 rounded mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
                          <div className="h-3 rounded mb-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
                          <div className="h-3 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
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
                    <EmptyState
                      variant="pools"
                      title="No Liquidity Positions"
                      description="You haven't provided liquidity to any pools yet."
                      actionHref="/create-pool"
                      actionLabel="Create Your First Pool"
                    />
                  )}
                </div>
              )}

              {/* Created Pools Tab */}
              {activeTab === 'created' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="td-section-title mb-0">Pools You Created</h2>
                    
                    {/* View Toggle */}
                    <div className="flex items-center space-x-2">
                      <label className="text-sm" style={{ color: 'var(--text-tertiary)' }}>View:</label>
                      <div className="td-segmented">
                        <button
                          type="button"
                          onClick={() => setViewMode('list')}
                          className={`td-segmented__btn ${viewMode === 'list' ? 'td-segmented__btn--active' : ''}`}
                        >
                          List
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('cards')}
                          className={`td-segmented__btn ${viewMode === 'cards' ? 'td-segmented__btn--active' : ''}`}
                        >
                          Cards
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {createdPoolsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="td-card td-card--quiet p-6 animate-pulse">
                          <div className="h-4 rounded mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
                          <div className="h-3 rounded mb-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
                          <div className="h-3 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
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
                    <EmptyState
                      variant="pools"
                      title="No created pools"
                      description="You haven't created any pools yet."
                      actionHref="/create-pool"
                      actionLabel="Create Your First Pool"
                    />
                  )}
                </div>
              )}

              {/* All Pools Tab */}
              {activeTab === 'all-pools' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="td-section-title mb-0">All Available Pools</h2>
                  </div>

                  {/* Search Bar */}
                  <div className="mb-6">
                    <div className="relative">
                      <label htmlFor="pools-search" className="sr-only">Search pools by token symbol or name</label>
                      <input
                        id="pools-search"
                        name="poolsSearch"
                        type="text"
                        autoComplete="off"
                        placeholder="Search pools by token symbol or name, then press Enter..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="td-field__input w-full py-3 pl-12 pr-28"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: 'var(--text-tertiary)' }}>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-1 gap-1">
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={handleClearSearch}
                            className="p-2"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleSearch}
                          className="td-btn td-btn--primary text-sm py-1.5"
                        >
                          Search
                        </button>
                      </div>
                    </div>
                    {isSearching && searchTerm && (
                      <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
                        Searching for: <span style={{ color: 'var(--finance-primary)' }}>{searchTerm}</span>
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
                        <label className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Sort by:</label>
                        <select
                          value={sortBy}
                          onChange={(e) => handleSortChange(e.target.value)}
                          className="td-field__input text-sm py-2 w-auto"
                        >
                          <option value="tvl">TVL</option>
                          <option value="apy">APY</option>
                          <option value="volume24h">24h Volume</option>
                          <option value="fee">Fee</option>
                          <option value="name">Name</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="td-btn td-btn--ghost text-sm"
                      >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </button>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center space-x-2">
                      <label className="text-sm" style={{ color: 'var(--text-tertiary)' }}>View:</label>
                      <div className="td-segmented">
                        <button
                          type="button"
                          onClick={() => setViewMode('list')}
                          className={`td-segmented__btn ${viewMode === 'list' ? 'td-segmented__btn--active' : ''}`}
                        >
                          List
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('cards')}
                          className={`td-segmented__btn ${viewMode === 'cards' ? 'td-segmented__btn--active' : ''}`}
                        >
                          Cards
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {allPoolsLoading || (isSearching && searchTerm.trim() && searchPoolsLoading) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="td-card td-card--quiet p-6 animate-pulse">
                          <div className="h-4 rounded mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
                          <div className="h-3 rounded mb-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
                          <div className="h-3 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
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
                      variant={isSearching && searchTerm.trim() ? 'search' : 'pools'}
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
                            className="td-btn td-btn--primary disabled:opacity-50"
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
      />
    </>
  );
};

export default Pools; 