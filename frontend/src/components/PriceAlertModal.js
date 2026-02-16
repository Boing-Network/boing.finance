// Price Alert Modal Component
// Allows users to create and manage price alerts

import React, { useState, useEffect } from 'react';
import { addPriceAlert, getPriceAlerts, removePriceAlert } from '../utils/priceAlerts';
import toast from 'react-hot-toast';

export default function PriceAlertModal({ isOpen, onClose, token }) {
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState('above');
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (isOpen && token) {
      const allAlerts = getPriceAlerts();
      const tokenAlerts = allAlerts.filter(a => 
        a.tokenAddress?.toLowerCase() === token.address?.toLowerCase() &&
        a.chainId === token.chainId
      );
      setAlerts(tokenAlerts);
    }
  }, [isOpen, token]);

  const handleCreateAlert = () => {
    if (!targetPrice || parseFloat(targetPrice) <= 0) {
      toast.error('Please enter a valid target price');
      return;
    }

    const alert = addPriceAlert({
      tokenAddress: token.address,
      tokenSymbol: token.symbol,
      tokenName: token.name,
      chainId: token.chainId,
      targetPrice: parseFloat(targetPrice),
      condition,
      currentPrice: token.price || 0
    });

    if (alert) {
      toast.success(`Price alert created for ${token.symbol}`);
      setTargetPrice('');
      const allAlerts = getPriceAlerts();
      const tokenAlerts = allAlerts.filter(a => 
        a.tokenAddress?.toLowerCase() === token.address?.toLowerCase() &&
        a.chainId === token.chainId
      );
      setAlerts(tokenAlerts);
    } else {
      toast.error('Failed to create alert');
    }
  };

  const handleRemoveAlert = (alertId) => {
    if (removePriceAlert(alertId)) {
      toast.success('Alert removed');
      const allAlerts = getPriceAlerts();
      const tokenAlerts = allAlerts.filter(a => 
        a.tokenAddress?.toLowerCase() === token.address?.toLowerCase() &&
        a.chainId === token.chainId
      );
      setAlerts(tokenAlerts);
    }
  };

  if (!isOpen || !token) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Price Alerts for {token.symbol}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current Price */}
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <p className="text-gray-400 text-sm mb-1">Current Price</p>
          <p className="text-2xl font-bold text-white">
            ${token.price ? token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '0.00'}
          </p>
        </div>

        {/* Create New Alert */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Alert</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="price-alert-condition" className="block text-gray-300 text-sm mb-2">Alert when price is</label>
              <select
                id="price-alert-condition"
                name="condition"
                autoComplete="off"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600"
              >
                <option value="above">Above</option>
                <option value="below">Below</option>
              </select>
            </div>
            <div>
              <label htmlFor="price-alert-target" className="block text-gray-300 text-sm mb-2">Target Price (USD)</label>
              <input
                id="price-alert-target"
                name="targetPrice"
                type="number"
                autoComplete="off"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="0.00"
                step="0.000001"
                min="0"
                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleCreateAlert}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Create Alert
            </button>
          </div>
        </div>

        {/* Existing Alerts */}
        {alerts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Active Alerts</h3>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium">
                      {alert.condition === 'above' ? 'Above' : 'Below'} ${alert.targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </p>
                    {alert.triggeredAt && (
                      <p className="text-green-400 text-sm">Triggered {new Date(alert.triggeredAt).toLocaleString()}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveAlert(alert.id)}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    title="Remove alert"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {alerts.length === 0 && (
          <p className="text-gray-400 text-center py-4">No active alerts</p>
        )}
      </div>
    </div>
  );
}

