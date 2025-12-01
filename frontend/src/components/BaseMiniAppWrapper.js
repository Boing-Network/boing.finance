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
      // Set a maximum timeout for initialization
      const initTimeout = setTimeout(() => {
        console.log('⏰ Initialization timeout reached, proceeding anyway');
        setIsLoading(false);
      }, 15000); // 15 second timeout
      
      try {
        // Check if we're running inside Farcaster (improved mobile detection)
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isMobile = /iphone|ipad|ipod|android|mobile|webos|blackberry|windows phone/i.test(userAgent);
        
        const isInFarcaster = window.parent !== window || 
                             window.location !== window.parent.location ||
                             document.referrer.includes('farcaster.xyz') ||
                             document.referrer.includes('warpcast.com') ||
                             window.location.href.includes('farcaster.xyz') ||
                             window.location.href.includes('warpcast.com') ||
                             userAgent.includes('farcaster') ||
                             userAgent.includes('warpcast') ||
                             // Check for Farcaster-specific environment variables or globals
                             window.farcaster ||
                             window.warpcast ||
                             // Check URL parameters that might indicate Farcaster
                             new URLSearchParams(window.location.search).has('farcaster') ||
                             new URLSearchParams(window.location.search).has('warpcast') ||
                             // Additional mobile-specific checks
                             (isMobile && (window.location.hostname.includes('farcaster') || 
                                          window.location.hostname.includes('warpcast'))) ||
                             // Check for Farcaster-specific headers or meta tags
                             document.querySelector('meta[name="farcaster"]') ||
                             document.querySelector('meta[name="warpcast"]');

        setIsFarcasterApp(isInFarcaster);

        if (isInFarcaster) {
          console.log('🔍 Detected Farcaster environment');
          console.log('User Agent:', window.navigator.userAgent);
          console.log('Referrer:', document.referrer);
          console.log('URL:', window.location.href);
          console.log('Is Mobile:', isMobile);
          
          try {
            // Dynamically import Farcaster MiniApp SDK
            console.log('📦 Loading Farcaster MiniApp SDK...');
            const { sdk: farcasterSdk } = await import('@farcaster/miniapp-sdk');
            
            console.log('✅ Farcaster MiniApp SDK loaded successfully');
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
            console.log('🚀 Calling farcasterSdk.actions.ready()...');
            
            // Add timeout for mobile devices
            const readyPromise = farcasterSdk.actions.ready();
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('SDK ready() timeout')), 10000)
            );
            
            await Promise.race([readyPromise, timeoutPromise]);
            console.log('✅ Farcaster MiniApp ready() called successfully');
          } catch (error) {
            console.error('❌ Farcaster MiniApp SDK failed to initialize:', error);
            console.error('Error details:', error.message, error.stack);
            
            // For mobile devices, try a fallback approach
            if (isMobile) {
              console.log('🔄 Attempting mobile fallback...');
              try {
                // Try to call ready() without waiting
                if (window.farcaster && window.farcaster.actions) {
                  window.farcaster.actions.ready();
                  console.log('✅ Mobile fallback successful');
                }
              } catch (fallbackError) {
                console.error('❌ Mobile fallback failed:', fallbackError);
              }
            }
            // Continue without Farcaster features
          }
        } else {
          // Not in Farcaster, but check if we should try anyway on mobile
          console.log('ℹ️ Not running in Farcaster environment');
          console.log('User Agent:', window.navigator.userAgent);
          console.log('Referrer:', document.referrer);
          console.log('URL:', window.location.href);
          console.log('Is Mobile:', isMobile);
          
          // For mobile devices, try to initialize SDK anyway as a fallback
          if (isMobile) {
            console.log('🔄 Mobile fallback: Attempting SDK initialization anyway...');
            try {
              const { sdk: farcasterSdk } = await import('@farcaster/miniapp-sdk');
              console.log('✅ Mobile fallback SDK loaded');
              setSdk(farcasterSdk);
              
              // Try to call ready() without waiting
              farcasterSdk.actions.ready().catch(err => {
                console.log('ℹ️ Mobile fallback ready() failed (expected):', err.message);
              });
              
              console.log('✅ Mobile fallback initialization complete');
            } catch (fallbackError) {
              console.log('ℹ️ Mobile fallback failed (expected):', fallbackError.message);
            }
          }
        }
      } catch (error) {
        console.warn('MiniApp initialization failed:', error);
        // Continue without MiniApp features
      } finally {
        clearTimeout(initTimeout);
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
  // eslint-disable-next-line no-unused-vars
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
