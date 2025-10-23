import React, { useEffect, useState } from 'react';
import { useWalletConnection } from '../hooks/useWalletConnection';

// Base MiniApp SDK integration wrapper
const BaseMiniAppWrapper = ({ children }) => {
  const [miniApp, setMiniApp] = useState(null);
  const [isBaseApp, setIsBaseApp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { account, switchNetwork } = useWalletConnection();

  useEffect(() => {
    const initializeMiniApp = async () => {
      try {
        // Check if we're running inside Base App
        const isInBaseApp = window.parent !== window || 
                           window.location !== window.parent.location ||
                           document.referrer.includes('base.org') ||
                           window.location.href.includes('base.org');

        setIsBaseApp(isInBaseApp);

        if (isInBaseApp) {
          // Dynamically import the Base MiniApp SDK
          const { MiniApp } = await import('@base/minikit');
          
          const miniAppInstance = new MiniApp({
            // Configuration for Base MiniApp
            theme: 'dark', // Match your app's theme
            features: {
              wallet: true,
              transactions: true,
              analytics: true
            }
          });

          setMiniApp(miniAppInstance);

          // Initialize the mini app
          await miniAppInstance.initialize();

          // Set up event listeners
          miniAppInstance.on('walletConnected', (wallet) => {
            console.log('Wallet connected via Base App:', wallet);
          });

          miniAppInstance.on('networkChanged', (network) => {
            console.log('Network changed via Base App:', network);
            // Auto-switch to Base network if user is in Base App
            if (network.chainId === 8453) {
              switchNetwork(8453);
            }
          });

          miniAppInstance.on('transactionCompleted', (tx) => {
            console.log('Transaction completed via Base App:', tx);
          });

          // Signal that the app is ready
          miniAppInstance.actions.ready();
        }
      } catch (error) {
        console.warn('Base MiniApp SDK not available or failed to initialize:', error);
        // Continue without Base App features
      } finally {
        setIsLoading(false);
      }
    };

    initializeMiniApp();
  }, [switchNetwork]);

  // Auto-switch to Base network when in Base App
  useEffect(() => {
    if (isBaseApp && account && miniApp) {
      // Check if user is on Base network, if not, suggest switching
      const currentChainId = window.ethereum?.chainId;
      if (currentChainId && parseInt(currentChainId, 16) !== 8453) {
        // Show a subtle notification about Base network
        console.log('Consider switching to Base network for optimal experience');
      }
    }
  }, [isBaseApp, account, miniApp]);

  // Show loading state while initializing
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Initializing Boing Finance...</p>
        </div>
      </div>
    );
  }

  // Render children with Base App context
  return (
    <div className="base-mini-app-container">
      {isBaseApp && (
        <div className="base-app-indicator">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 mb-4 mx-4">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span style={{ color: 'var(--text-secondary)' }}>
                Running in Base App - Optimized for Base network
              </span>
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

// Hook to access Base MiniApp instance
export const useBaseMiniApp = () => {
  const [miniApp, setMiniApp] = useState(null);
  const [isBaseApp, setIsBaseApp] = useState(false);

  useEffect(() => {
    const checkBaseApp = () => {
      const isInBaseApp = window.parent !== window || 
                         window.location !== window.parent.location ||
                         document.referrer.includes('base.org') ||
                         window.location.href.includes('base.org');
      
      setIsBaseApp(isInBaseApp);
    };

    checkBaseApp();
  }, []);

  return { miniApp, isBaseApp };
};

// Utility functions for Base App integration
export const baseAppUtils = {
  // Check if running in Base App
  isInBaseApp: () => {
    return window.parent !== window || 
           window.location !== window.parent.location ||
           document.referrer.includes('base.org') ||
           window.location.href.includes('base.org');
  },

  // Get Base network configuration
  getBaseNetworkConfig: () => ({
    chainId: 8453,
    chainName: 'Base',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org'],
  }),

  // Optimize transaction for Base network
  optimizeForBase: (txParams) => {
    return {
      ...txParams,
      gasPrice: undefined, // Let Base handle gas pricing
      maxFeePerGas: undefined,
      maxPriorityFeePerGas: undefined,
    };
  }
};

export default BaseMiniAppWrapper;
