import React, { useEffect, useState } from 'react';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { baseAppUtils } from './BaseMiniAppWrapper';

const BaseNetworkOptimizer = () => {
  const { account, switchNetwork } = useWalletConnection();
  const [isBaseApp, setIsBaseApp] = useState(false);
  const [showBasePrompt, setShowBasePrompt] = useState(false);

  useEffect(() => {
    const checkBaseApp = () => {
      const inBaseApp = baseAppUtils.isInBaseApp();
      setIsBaseApp(inBaseApp);
      
      // Show prompt if in Base App but not on Base network
      if (inBaseApp && account) {
        const currentChainId = window.ethereum?.chainId;
        if (currentChainId && parseInt(currentChainId, 16) !== 8453) {
          setShowBasePrompt(true);
        }
      }
    };

    checkBaseApp();
  }, [account]);

  const handleSwitchToBase = async () => {
    try {
      await switchNetwork(8453);
      setShowBasePrompt(false);
    } catch (error) {
      console.error('Failed to switch to Base network:', error);
    }
  };

  if (!isBaseApp || !showBasePrompt) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Optimize for Base
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Switch to Base network for faster transactions and lower fees
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleSwitchToBase}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-md transition-colors"
              >
                Switch to Base
              </button>
              <button
                onClick={() => setShowBasePrompt(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
                style={{ 
                  color: 'var(--text-tertiary)',
                  backgroundColor: 'var(--bg-tertiary)'
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for Base network optimization
export const useBaseOptimization = () => {
  const { account } = useWalletConnection();
  const [isBaseNetwork, setIsBaseNetwork] = useState(false);
  const [isBaseApp, setIsBaseApp] = useState(false);

  useEffect(() => {
    const checkBaseNetwork = () => {
      const currentChainId = window.ethereum?.chainId;
      const onBase = currentChainId && parseInt(currentChainId, 16) === 8453;
      setIsBaseNetwork(onBase);
    };

    const checkBaseApp = () => {
      const inBaseApp = baseAppUtils.isInBaseApp();
      setIsBaseApp(inBaseApp);
    };

    checkBaseNetwork();
    checkBaseApp();

    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', checkBaseNetwork);
      return () => window.ethereum.removeListener('chainChanged', checkBaseNetwork);
    }
  }, [account]);

  return {
    isBaseNetwork,
    isBaseApp,
    isOptimized: isBaseApp && isBaseNetwork
  };
};

// Component for Base-specific features
export const BaseFeatures = () => {
  const { isOptimized } = useBaseOptimization();

  if (!isOptimized) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border border-blue-500/10 rounded-lg p-4 mb-6">
      <div className="flex items-center space-x-2 mb-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Base Network Features
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
          <span style={{ color: 'var(--text-secondary)' }}>Ultra-low gas fees</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
          <span style={{ color: 'var(--text-secondary)' }}>Fast transactions</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
          <span style={{ color: 'var(--text-secondary)' }}>Ethereum security</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
          <span style={{ color: 'var(--text-secondary)' }}>Coinbase integration</span>
        </div>
      </div>
    </div>
  );
};

export default BaseNetworkOptimizer;
