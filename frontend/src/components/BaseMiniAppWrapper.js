import React, { useEffect, useState } from 'react';
import { useWalletConnection } from '../hooks/useWalletConnection';

// Farcaster MiniApp SDK integration wrapper
const BaseMiniAppWrapper = ({ children }) => {
  const [sdk, setSdk] = useState(null);
  const [isFarcasterApp, setIsFarcasterApp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { account, switchNetwork } = useWalletConnection();

  useEffect(() => {
    const initializeMiniApp = async () => {
      try {
        // Check if we're running inside Farcaster
        const isInFarcaster = window.parent !== window || 
                             window.location !== window.parent.location ||
                             document.referrer.includes('farcaster.xyz') ||
                             window.location.href.includes('farcaster.xyz') ||
                             window.location.href.includes('warpcast.com');

        setIsFarcasterApp(isInFarcaster);

        if (isInFarcaster) {
          try {
            // Dynamically import Farcaster MiniApp SDK
            const { sdk: farcasterSdk } = await import('@farcaster/miniapp-sdk');
            
            setSdk(farcasterSdk);

            // Set up event listeners
            farcasterSdk.on('walletConnected', (wallet) => {
              console.log('Wallet connected via Farcaster:', wallet);
            });

            farcasterSdk.on('networkChanged', (network) => {
              console.log('Network changed via Farcaster:', network);
            });

            farcasterSdk.on('transactionCompleted', (tx) => {
              console.log('Transaction completed via Farcaster:', tx);
            });

            // Signal that the app is ready - THIS IS CRITICAL!
            await farcasterSdk.actions.ready();
            console.log('✅ Farcaster MiniApp ready() called successfully');
          } catch (error) {
            console.warn('Farcaster MiniApp SDK not available or failed to initialize:', error);
            // Continue without Farcaster features
          }
        } else {
          // Not in Farcaster, just set loading to false
          console.log('Not running in Farcaster environment');
        }
      } catch (error) {
        console.warn('MiniApp initialization failed:', error);
        // Continue without MiniApp features
      } finally {
        setIsLoading(false);
      }
    };

    initializeMiniApp();
  }, [switchNetwork]);

  // Auto-switch to Base network when in Farcaster App
  useEffect(() => {
    if (isFarcasterApp && account && sdk) {
      // Check if user is on Base network, if not, suggest switching
      const currentChainId = window.ethereum?.chainId;
      if (currentChainId && parseInt(currentChainId, 16) !== 8453) {
        // Show a subtle notification about Base network
        console.log('Consider switching to Base network for optimal experience');
      }
    }
  }, [isFarcasterApp, account, sdk]);

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

  // Render children with Farcaster App context
  return (
    <div className="farcaster-mini-app-container">
      {isFarcasterApp && (
        <div className="farcaster-app-indicator">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2 mb-4 mx-4">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span style={{ color: 'var(--text-secondary)' }}>
                Running in Farcaster - Optimized for DeFi
              </span>
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

// Hook to access Farcaster MiniApp instance
export const useFarcasterMiniApp = () => {
  const [sdk, setSdk] = useState(null);
  const [isFarcasterApp, setIsFarcasterApp] = useState(false);

  useEffect(() => {
    const checkFarcasterApp = () => {
      const isInFarcaster = window.parent !== window || 
                           window.location !== window.parent.location ||
                           document.referrer.includes('farcaster.xyz') ||
                           window.location.href.includes('farcaster.xyz') ||
                           window.location.href.includes('warpcast.com');
      
      setIsFarcasterApp(isInFarcaster);
    };

    checkFarcasterApp();
  }, []);

  return { sdk, isFarcasterApp };
};

// Utility functions for Farcaster App integration
export const farcasterAppUtils = {
  // Check if running in Farcaster
  isInFarcaster: () => {
    return window.parent !== window || 
           window.location !== window.parent.location ||
           document.referrer.includes('farcaster.xyz') ||
           window.location.href.includes('farcaster.xyz') ||
           window.location.href.includes('warpcast.com');
  },

  // Get Base network configuration (Farcaster supports Base)
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
