// Token Watchlist Component
// Manage watchlist and price/volume alerts

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWatchlist, removeFromWatchlist, addAlert, getAlerts, removeAlert, markAlertTriggered } from '../utils/tokenWatchlist';
import coingeckoService from '../services/coingeckoService';
import { getNetworkByChainId } from '../config/networks';
import { notificationService } from '../utils/notifications';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';
import OptimizedImage from './OptimizedImage';

const TokenWatchlist = ({ onClose }) => {
  const [watchlist, setWatchlist] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [alertForm, setAlertForm] = useState({
    type: 'price',
    condition: 'above',
    value: '',
    enabled: true
  });

  useEffect(() => {
    setWatchlist(getWatchlist());
    setAlerts(getAlerts());
  }, []);

  // Fetch prices for watchlist tokens
  const { data: prices, isLoading: pricesLoading } = useQuery({
    queryKey: ['watchlist-prices', watchlist.map(t => `${t.address}-${t.chainId}`).join(',')],
    queryFn: async () => {
      const priceData = {};
      for (const token of watchlist) {
        try {
          const networkName = getNetworkByChainId(token.chainId)?.name?.toLowerCase() || 'ethereum';
          const price = await coingeckoService.getTokenPrice(token.address, networkName);
          priceData[`${token.address}-${token.chainId}`] = price;
        } catch (error) {
          console.error(`Error fetching price for ${token.address}:`, error);
        }
      }
      return priceData;
    },
    enabled: watchlist.length > 0,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Check alerts
  useEffect(() => {
    if (!prices || watchlist.length === 0) return;

    const checkAlerts = () => {
      const activeAlerts = alerts.filter(a => a.enabled && !a.triggered);
      
      activeAlerts.forEach(alert => {
        const priceKey = `${alert.address}-${alert.chainId}`;
        const currentPrice = prices[priceKey]?.usd;
        
        if (!currentPrice) return;

        let shouldTrigger = false;
        
        if (alert.type === 'price') {
          if (alert.condition === 'above' && currentPrice >= parseFloat(alert.value)) {
            shouldTrigger = true;
          } else if (alert.condition === 'below' && currentPrice <= parseFloat(alert.value)) {
            shouldTrigger = true;
          }
        } else if (alert.type === 'volume') {
          // Volume alerts would need volume data from CoinGecko
          // For now, we'll skip volume alerts
        }

        if (shouldTrigger) {
          markAlertTriggered(alert.id);
          const token = watchlist.find(t => t.address === alert.address && t.chainId === alert.chainId);
          
          // Show notification
          notificationService.notify({
            title: `Alert: ${token?.name || 'Token'}`,
            body: `Price ${alert.condition === 'above' ? 'reached' : 'dropped to'} $${alert.value}`,
            icon: '/favicon.png'
          });

          toast.success(`Alert triggered: ${token?.name || 'Token'} price ${alert.condition === 'above' ? 'reached' : 'dropped to'} $${alert.value}`);
          
          // Update alerts state
          setAlerts(getAlerts());
        }
      });
    };

    const interval = setInterval(checkAlerts, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [prices, watchlist, alerts]);

  const handleRemoveFromWatchlist = (address, chainId) => {
    removeFromWatchlist(address, chainId);
    setWatchlist(getWatchlist());
    setAlerts(getAlerts());
    toast.success('Token removed from watchlist');
  };

  const handleAddAlert = () => {
    if (!selectedToken || !alertForm.value) {
      toast.error('Please fill in all alert fields');
      return;
    }

    addAlert({
      ...alertForm,
      address: selectedToken.address,
      chainId: selectedToken.chainId,
      tokenName: selectedToken.name,
      tokenSymbol: selectedToken.symbol
    });

    setAlerts(getAlerts());
    setShowAddAlert(false);
    setAlertForm({ type: 'price', condition: 'above', value: '', enabled: true });
    toast.success('Alert added successfully');
  };

  const handleRemoveAlert = (alertId) => {
    removeAlert(alertId);
    setAlerts(getAlerts());
    toast.success('Alert removed');
  };

  return (
    <div className="rounded-lg border p-6" style={{
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--border-color)'
    }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Token Watchlist
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Monitor tokens and set price alerts
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close watchlist"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Watchlist Tokens */}
      {watchlist.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">No tokens in watchlist</p>
          <p className="text-sm text-gray-500">Add tokens from the token explorer to start monitoring</p>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {watchlist.map((token) => {
            const priceKey = `${token.address}-${token.chainId}`;
            const price = prices?.[priceKey];
            const tokenAlerts = alerts.filter(
              a => a.address === token.address && a.chainId === token.chainId
            );

            return (
              <div
                key={`${token.address}-${token.chainId}`}
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {token.logoUrl && (
                      <OptimizedImage
                        src={token.logoUrl}
                        alt={token.name}
                        className="w-10 h-10 rounded-full"
                        fallback={<div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                          {token.symbol?.charAt(0) || '?'}
                        </div>}
                      />
                    )}
                    <div>
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {token.name}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {token.symbol}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {pricesLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : price ? (
                      <div className="text-right">
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          ${price.usd?.toFixed(4) || '0.0000'}
                        </p>
                        {price.usd_24h_change && (
                          <p className={`text-xs ${price.usd_24h_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {price.usd_24h_change >= 0 ? '+' : ''}{price.usd_24h_change.toFixed(2)}%
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Price unavailable</p>
                    )}
                    <button
                      onClick={() => {
                        setSelectedToken(token);
                        setShowAddAlert(true);
                      }}
                      className="px-3 py-1 rounded text-sm transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      Add Alert
                    </button>
                    <button
                      onClick={() => handleRemoveFromWatchlist(token.address, token.chainId)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      aria-label="Remove from watchlist"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Token Alerts */}
                {tokenAlerts.length > 0 && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Active Alerts:
                    </p>
                    <div className="space-y-1">
                      {tokenAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-center justify-between text-xs p-2 rounded"
                          style={{ backgroundColor: 'var(--bg-tertiary)' }}
                        >
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {alert.type === 'price' ? 'Price' : 'Volume'} {alert.condition} ${alert.value}
                            {alert.triggered && ' (Triggered)'}
                          </span>
                          <button
                            onClick={() => handleRemoveAlert(alert.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Alert Modal */}
      {showAddAlert && selectedToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="rounded-lg border p-6 max-w-md w-full" style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)'
          }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Add Alert for {selectedToken.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Alert Type
                </label>
                <select
                  value={alertForm.type}
                  onChange={(e) => setAlertForm({ ...alertForm, type: e.target.value })}
                  className="w-full p-2 rounded border"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  <option value="price">Price</option>
                  <option value="volume">Volume (Coming Soon)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Condition
                </label>
                <select
                  value={alertForm.condition}
                  onChange={(e) => setAlertForm({ ...alertForm, condition: e.target.value })}
                  className="w-full p-2 rounded border"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Value (USD)
                </label>
                <input
                  type="number"
                  value={alertForm.value}
                  onChange={(e) => setAlertForm({ ...alertForm, value: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full p-2 rounded border"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-color)'
                  }}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={alertForm.enabled}
                  onChange={(e) => setAlertForm({ ...alertForm, enabled: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Enable alert
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddAlert(false);
                  setSelectedToken(null);
                }}
                className="px-4 py-2 rounded transition-colors"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddAlert}
                className="px-4 py-2 rounded transition-colors"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                Add Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenWatchlist;

