import React, { useState, useEffect, useCallback } from 'react';
import { InfoTooltip, WarningTooltip } from './Tooltip';

export default function GasFeeEstimator({ 
  network, 
  onGasPriceChange, 
  className = '',
  showAdvanced = false 
}) {
  const [gasPrices, setGasPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSpeed, setSelectedSpeed] = useState('standard');
  const [customGasPrice, setCustomGasPrice] = useState('');
  const [estimatedGasLimit] = useState(210000);

  const loadGasPrices = useCallback(async () => {
    setLoading(true);
    try {
      // In a real app, you'd fetch from gas price APIs like Etherscan, GasNow, etc.
      // For demo purposes, we'll use mock data
      const mockGasPrices = {
        1: { // Ethereum
          slow: { gwei: 15, usd: 2.50 },
          standard: { gwei: 25, usd: 4.20 },
          fast: { gwei: 40, usd: 6.80 },
          rapid: { gwei: 60, usd: 10.20 }
        },
        137: { // Polygon
          slow: { gwei: 30, usd: 0.05 },
          standard: { gwei: 50, usd: 0.08 },
          fast: { gwei: 80, usd: 0.13 },
          rapid: { gwei: 120, usd: 0.20 }
        },
        56: { // BSC
          slow: { gwei: 3, usd: 0.15 },
          standard: { gwei: 5, usd: 0.25 },
          fast: { gwei: 8, usd: 0.40 },
          rapid: { gwei: 12, usd: 0.60 }
        },
        42161: { // Arbitrum
          slow: { gwei: 0.1, usd: 0.30 },
          standard: { gwei: 0.15, usd: 0.45 },
          fast: { gwei: 0.25, usd: 0.75 },
          rapid: { gwei: 0.4, usd: 1.20 }
        }
      };

      setGasPrices(mockGasPrices[network?.chainId] || mockGasPrices[1]);
    } catch (error) {
      console.error('Failed to load gas prices:', error);
    } finally {
      setLoading(false);
    }
  }, [network]);

  useEffect(() => {
    if (network) {
      loadGasPrices();
    }
  }, [loadGasPrices, network]);

  useEffect(() => {
    if (gasPrices[selectedSpeed]) {
      onGasPriceChange?.(gasPrices[selectedSpeed]);
    }
  }, [selectedSpeed, gasPrices, onGasPriceChange]);

  const getSpeedColor = (speed) => {
    switch (speed) {
      case 'slow': return 'text-green-400';
      case 'standard': return 'text-blue-400';
      case 'fast': return 'text-yellow-400';
      case 'rapid': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSpeedIcon = (speed) => {
    switch (speed) {
      case 'slow':
        return (
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'standard':
        return (
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'fast':
        return (
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'rapid':
        return (
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const calculateTotalFee = (gasPrice) => {
    if (!gasPrice) return 0;
    return (gasPrice.gwei * estimatedGasLimit) / 1e9;
  };

  const calculateUSDTotal = (gasPrice) => {
    if (!gasPrice) return 0;
    return (gasPrice.usd * estimatedGasLimit) / 210000;
  };

  const handleCustomGasPrice = (value) => {
    setCustomGasPrice(value);
    if (value && !isNaN(value)) {
      const gwei = parseFloat(value);
      const usd = gwei * 0.000000001 * 2000; // Rough USD conversion
      onGasPriceChange?.({ gwei, usd, custom: true });
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Gas Fee Estimator</h3>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-700 rounded h-8"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Gas Fee Estimator</h3>
        <div className="flex items-center space-x-2">
          <InfoTooltip content="Estimated gas fees for different transaction speeds. Higher fees = faster confirmation." />
          <button
            onClick={loadGasPrices}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Refresh gas prices"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Gas Speed Options */}
      <div className="space-y-2 mb-4">
        {Object.entries(gasPrices).map(([speed, price]) => (
          <button
            key={speed}
            onClick={() => setSelectedSpeed(speed)}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
              selectedSpeed === speed
                ? 'bg-blue-600 text-white'
                : 'bg-gray-750 hover:bg-gray-700 text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              {getSpeedIcon(speed)}
              <div className="text-left">
                <p className="font-medium capitalize">{speed}</p>
                <p className="text-xs opacity-75">
                  {speed === 'slow' && '~5-10 min'}
                  {speed === 'standard' && '~2-5 min'}
                  {speed === 'fast' && '~30 sec'}
                  {speed === 'rapid' && '~15 sec'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">{price.gwei} Gwei</p>
              <p className="text-xs opacity-75">~${price.usd.toFixed(2)}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Selected Gas Fee Details */}
      {gasPrices[selectedSpeed] && (
        <div className="bg-gray-750 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Selected Speed:</span>
            <span className={`font-medium capitalize ${getSpeedColor(selectedSpeed)}`}>
              {selectedSpeed}
            </span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Gas Price:</span>
              <span className="text-white">{gasPrices[selectedSpeed].gwei} Gwei</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Estimated Gas Limit:</span>
              <span className="text-white">{estimatedGasLimit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Fee:</span>
              <span className="text-white">
                {calculateTotalFee(gasPrices[selectedSpeed]).toFixed(6)} ETH
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">USD Value:</span>
              <span className="text-white">
                ~${calculateUSDTotal(gasPrices[selectedSpeed]).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Custom Gas Price (Advanced) */}
      {showAdvanced && (
        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-gray-400 text-sm">Custom Gas Price:</span>
            <WarningTooltip content="Set a custom gas price. Higher values may result in faster confirmation but cost more." />
          </div>
          <div className="flex space-x-2">
            <input
              type="number"
              value={customGasPrice}
              onChange={(e) => handleCustomGasPrice(e.target.value)}
              placeholder="Enter Gwei"
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={() => setCustomGasPrice('')}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white rounded-lg transition-colors text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Network Info */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Network:</span>
          <span className="text-white">
            {network?.name || 'Unknown Network'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-gray-400">Last Updated:</span>
          <span className="text-white">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
} 