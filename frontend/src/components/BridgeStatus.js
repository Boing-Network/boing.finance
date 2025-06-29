import React, { useState, useEffect } from 'react';
import { InfoTooltip } from './Tooltip';

export default function BridgeStatus({ className = '' }) {
  const [bridgeStatus, setBridgeStatus] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBridgeStatus();
    const interval = setInterval(loadBridgeStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadBridgeStatus = async () => {
    setLoading(true);
    try {
      // In a real app, this would fetch from your bridge API
      // For demo purposes, we'll use mock data
      const mockStatus = {
        ethereum: { status: 'operational', latency: 120, lastUpdate: Date.now() },
        polygon: { status: 'operational', latency: 85, lastUpdate: Date.now() },
        bsc: { status: 'operational', latency: 95, lastUpdate: Date.now() },
        arbitrum: { status: 'degraded', latency: 250, lastUpdate: Date.now() },
        optimism: { status: 'operational', latency: 110, lastUpdate: Date.now() },
        avalanche: { status: 'operational', latency: 75, lastUpdate: Date.now() }
      };
      
      setBridgeStatus(mockStatus);
    } catch (error) {
      console.error('Failed to load bridge status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'down': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
        return (
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        );
      case 'degraded':
        return (
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
        );
      case 'down':
        return (
          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
        );
      default:
        return (
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        );
    }
  };

  const getLatencyColor = (latency) => {
    if (latency < 100) return 'text-green-400';
    if (latency < 200) return 'text-yellow-400';
    return 'text-red-400';
  };

  const networks = [
    { id: 'ethereum', name: 'Ethereum', icon: '🔵' },
    { id: 'polygon', name: 'Polygon', icon: '🟣' },
    { id: 'bsc', name: 'BSC', icon: '🟡' },
    { id: 'arbitrum', name: 'Arbitrum', icon: '🔵' },
    { id: 'optimism', name: 'Optimism', icon: '🔴' },
    { id: 'avalanche', name: 'Avalanche', icon: '🔴' }
  ];

  if (loading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Bridge Status</h3>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-700 rounded h-4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Bridge Status</h3>
        <div className="flex items-center space-x-2">
          <InfoTooltip content="Real-time status of cross-chain bridges. Green = operational, Yellow = degraded, Red = down" />
          <button
            onClick={loadBridgeStatus}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Refresh bridge status"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {networks.map((network) => {
          const status = bridgeStatus[network.id];
          if (!status) return null;

          return (
            <div key={network.id} className="flex items-center justify-between p-3 bg-gray-750 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{network.icon}</span>
                <div>
                  <p className="text-white font-medium">{network.name}</p>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(status.status)}
                    <span className={`text-xs capitalize ${getStatusColor(status.status)}`}>
                      {status.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`text-sm font-medium ${getLatencyColor(status.latency)}`}>
                  {status.latency}ms
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(status.lastUpdate).toLocaleTimeString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Overall Status:</span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-green-400 font-medium">Operational</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-400">Active Bridges:</span>
          <span className="text-white font-medium">
            {Object.values(bridgeStatus).filter(s => s.status === 'operational').length}/{Object.keys(bridgeStatus).length}
          </span>
        </div>
      </div>
    </div>
  );
} 