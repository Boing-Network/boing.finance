import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getNetworkByChainId } from '../config/networks';
import toast from 'react-hot-toast';

const WalletContext = createContext();

export { WalletContext };

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletType, setWalletType] = useState(null);
  const [lastErrorTime, setLastErrorTime] = useState(0);
  const [userDisconnected, setUserDisconnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Debounce error messages to prevent spam
  const showErrorWithDebounce = useCallback((message) => {
    const now = Date.now();
    if (now - lastErrorTime > 2000) {
      toast.error(message);
      setLastErrorTime(now);
    }
  }, [lastErrorTime]);

  const handleAccountsChanged = useCallback(async (accounts) => {
    const wasDisconnected = localStorage.getItem('userDisconnected') === 'true';
    if (wasDisconnected) return;
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      if (!userDisconnected) {
        setAccount(accounts[0]);
      }
    }
  }, [userDisconnected]);

  const handleChainChanged = useCallback(async (chainId) => {
    const wasDisconnected = localStorage.getItem('userDisconnected') === 'true';
    if (wasDisconnected || userDisconnected) return;
    let newChainId;
    if (typeof chainId === 'string') {
      newChainId = chainId.startsWith('0x') ? parseInt(chainId, 16) : parseInt(chainId, 10);
    } else {
      newChainId = parseInt(chainId);
    }
    if (isNaN(newChainId)) return;
    setChainId(newChainId);
    const network = getNetworkByChainId(newChainId);
    if (!network) {
      showErrorWithDebounce(`Network with chain ID ${newChainId} is not supported. Please switch to a supported network.`);
    }
  }, [userDisconnected, showErrorWithDebounce]);

  // Define disconnectWallet first
  const disconnectWallet = useCallback(async () => {
    try {
      setAccount(null);
      setProvider(null);
      setSigner(null);
      setChainId(null);
      setIsConnected(false);
      setWalletType(null);
      setUserDisconnected(true);
      
      // Store disconnection state
      localStorage.setItem('userDisconnected', 'true');
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletType');
      
      console.log('Wallet disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    disconnectWallet();
  }, [disconnectWallet]);

  const setupEventListeners = useCallback(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener('disconnect', handleDisconnect);
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    }
  }, [handleAccountsChanged, handleChainChanged, handleDisconnect]);

  // Define connectWalletSilently first
  const connectWalletSilently = useCallback(async (accountAddress = null, networkChainId = null, ethereumProvider = null, forceReconnect = false) => {
    setIsConnecting(true);
    
    try {
      if (typeof window === 'undefined') {
        throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.');
      }

      // Use provided provider or fallback to window.ethereum
      const provider = ethereumProvider || window.ethereum;

      if (!provider) {
        throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.');
      }

      if (forceReconnect) {
        setUserDisconnected(false);
        localStorage.removeItem('userDisconnected');
      }

      const wasDisconnected = localStorage.getItem('userDisconnected') === 'true';
      
      if (wasDisconnected) {
        localStorage.removeItem('walletConnected');
        localStorage.removeItem('walletType');
        setUserDisconnected(false);
        localStorage.removeItem('userDisconnected');
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      let detectedWalletType = 'unknown';
      if (provider.isCoinbaseWallet) {
        detectedWalletType = 'coinbase';
      } else if (provider.isMetaMask) {
        detectedWalletType = 'metamask';
      }

      // Use eth_accounts for silent connection (doesn't prompt)
      const accounts = await provider.request({
        method: 'eth_accounts'
      });

      if (accounts.length === 0) {
        // If no accounts, try requesting (will prompt)
        const requestedAccounts = await provider.request({
          method: 'eth_requestAccounts'
        });
        if (requestedAccounts.length === 0) {
          throw new Error('No accounts found');
        }
        const account = accountAddress || requestedAccounts[0];
        const chainId = networkChainId || parseInt(await provider.request({ method: 'eth_chainId' }), 16);
        const ethersProvider = new ethers.BrowserProvider(provider);
        const signer = await ethersProvider.getSigner();

        const network = getNetworkByChainId(chainId);
        if (!network) {
          showErrorWithDebounce(`Network with chain ID ${chainId} is not supported. Please switch to a supported network.`);
          setIsConnecting(false);
          return false;
        }

        setAccount(account);
        setProvider(ethersProvider);
        setSigner(signer);
        setChainId(chainId);
        setIsConnected(true);
        setWalletType(detectedWalletType);

        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletType', detectedWalletType);
        localStorage.removeItem('userDisconnected');

        return true;
      }

      const account = accountAddress || accounts[0];
      const chainId = networkChainId || parseInt(await provider.request({ method: 'eth_chainId' }), 16);

      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();

      const network = getNetworkByChainId(chainId);
      if (!network) {
        showErrorWithDebounce(`Network with chain ID ${chainId} is not supported. Please switch to a supported network.`);
        setIsConnecting(false);
        return false;
      }

      setAccount(account);
      setProvider(ethersProvider);
      setSigner(signer);
      setChainId(chainId);
      setIsConnected(true);
      setWalletType(detectedWalletType);

      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletType', detectedWalletType);
      localStorage.removeItem('userDisconnected');

      return true;

    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [showErrorWithDebounce]);

  const checkWalletConnection = useCallback(async () => {
    // Don't check if already connected
    if (isConnected && account) {
      console.log('[WalletContext] Already connected, skipping check');
      return;
    }

    // Check if user was previously disconnected
    const wasDisconnected = localStorage.getItem('userDisconnected') === 'true';
    if (wasDisconnected) {
      // User was disconnected, skipping auto-connect
      return;
    }

    // Check if wallet was previously connected
    const wasConnected = localStorage.getItem('walletConnected') === 'true';
    if (!wasConnected) {
      // No previous connection found
      return;
    }

    // Wait a bit more to ensure wallet providers are fully initialized
    await new Promise(resolve => setTimeout(resolve, 300));

    // Get the last used wallet provider
    const lastWalletType = localStorage.getItem('walletType');
    const providers = detectWalletProviders();
    let lastProvider = null;

    // IMPORTANT: Always use the specific provider, never window.ethereum directly
    // This prevents Phantom from intercepting the call and showing a popup
    if (lastWalletType === 'metamask' && providers.metamask) {
      lastProvider = providers.metamask;
    } else if (lastWalletType === 'coinbase' && providers.coinbase) {
      lastProvider = providers.coinbase;
    } else {
      // If we don't have a specific provider match, don't try to reconnect
      // This prevents Phantom from intercepting
      // No matching wallet provider found
      // Clear invalid connection state
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletType');
      return;
    }

    if (!lastProvider) {
      // No wallet provider available
      // Clear invalid connection state
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletType');
      return;
    }

    try {
      // Use eth_accounts (silent, no prompt) on the specific provider
      // This avoids Phantom interception since we're using the direct provider reference
      const accounts = await lastProvider.request({ method: 'eth_accounts' });
      if (accounts.length > 0 && !userDisconnected) {
        const chainId = await lastProvider.request({ method: 'eth_chainId' });
        console.log('[WalletContext] Reconnecting to wallet silently:', {
          account: accounts[0],
          chainId: parseInt(chainId, 16),
          walletType: lastWalletType
        });
        await connectWalletSilently(accounts[0], parseInt(chainId, 16), lastProvider);
      } else {
        // No accounts available - clearing connection state
        // Clear connection state if no accounts
        localStorage.removeItem('walletConnected');
        localStorage.removeItem('walletType');
      }
    } catch (error) {
      console.error('[WalletContext] Error checking wallet connection:', error);
      // Clear connection state on error
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletType');
    }
  }, [isConnected, account, userDisconnected, connectWalletSilently]);

  // Initialize wallet connection on mount
  useEffect(() => {
    if (isInitialized) return;
    
    const initWallet = async () => {
      // Initializing wallet connection
      const wasDisconnected = localStorage.getItem('userDisconnected') === 'true';
      setUserDisconnected(wasDisconnected);
      
      // Setup event listeners first
      setupEventListeners();
      
      // Then check for existing connection - only if not disconnected
      if (!wasDisconnected) {
        // Wait longer to ensure all wallet providers are fully loaded
        // This prevents the wallet selection prompt from appearing
        await new Promise(resolve => setTimeout(resolve, 800));
        await checkWalletConnection();
      }
      
      setIsInitialized(true);
      console.log('[WalletContext] Wallet initialization complete', {
        isConnected,
        account,
        wasDisconnected
      });
    };
    
    // Only initialize once
    initWallet();
    
    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [isInitialized, checkWalletConnection, handleAccountsChanged, handleChainChanged, handleDisconnect, setupEventListeners]);

  const detectWalletProviders = () => {
    const providers = {
      metamask: null,
      coinbase: null,
      phantom: null
    };

    // Check if Phantom is installed (Phantom can inject into window.ethereum)
    const isPhantomInstalled = typeof window !== 'undefined' && (
      window.phantom?.ethereum || 
      (window.ethereum && window.ethereum.isPhantom)
    );

    // Check for multiple providers first
    if (typeof window !== 'undefined' && window.ethereum && window.ethereum.providers) {
      window.ethereum.providers.forEach(provider => {
        if (provider.isMetaMask && !provider.isCoinbaseWallet && !provider.isPhantom) {
          providers.metamask = provider;
        }
        if (provider.isCoinbaseWallet) {
          providers.coinbase = provider;
        }
        if (provider.isPhantom) {
          providers.phantom = provider;
        }
      });
    }

    // Check for single provider (but avoid Phantom if we're looking for MetaMask/Coinbase)
    if (typeof window !== 'undefined' && window.ethereum) {
      // Only use window.ethereum directly if it's not Phantom
      if (window.ethereum.isMetaMask && !window.ethereum.isCoinbaseWallet && !window.ethereum.isPhantom) {
        providers.metamask = window.ethereum;
      }
      if (window.ethereum.isCoinbaseWallet && !window.ethereum.isPhantom) {
        providers.coinbase = window.ethereum;
      }
      if (window.ethereum.isPhantom) {
        providers.phantom = window.ethereum;
      }
    }

    // Aggressive MetaMask detection when Coinbase Wallet is overriding window.ethereum
    if (!providers.metamask && typeof window !== 'undefined') {
      // Method 1: Check if MetaMask is available in the global scope
      if (window.metamask) {
        providers.metamask = window.metamask;
      }
      
      // Method 2: Try to access MetaMask through the extension API
      if (typeof window.ethereum !== 'undefined' && window.ethereum.providers) {
        const metamaskProvider = window.ethereum.providers.find(p => p.isMetaMask && !p.isCoinbaseWallet);
        if (metamaskProvider) {
          providers.metamask = metamaskProvider;
        }
      }
      
      // Method 3: Try to detect MetaMask by checking for its specific properties
      if (typeof window !== 'undefined') {
        // Look for MetaMask in various possible locations
        const possibleMetaMaskLocations = [
          window.metamask,
          window.ethereum?.providers?.find(p => p.isMetaMask && !p.isCoinbaseWallet),
          window.web3?.currentProvider,
          window.web3?.givenProvider
        ];
        
        for (let i = 0; i < possibleMetaMaskLocations.length; i++) {
          const provider = possibleMetaMaskLocations[i];
          if (provider && provider.isMetaMask && !provider.isCoinbaseWallet) {
            providers.metamask = provider;
            break;
          }
        }
      }
      
      // Method 4: Try to create a new MetaMask provider instance
      if (!providers.metamask && typeof window !== 'undefined') {
        try {
          // This is a more aggressive approach - try to access MetaMask directly
          if (window.ethereum && window.ethereum.providers) {
            // Force MetaMask to be the active provider temporarily
            const originalProvider = window.ethereum;
            const metamaskProvider = window.ethereum.providers.find(p => p.isMetaMask && !p.isCoinbaseWallet);
            if (metamaskProvider) {
              // Temporarily set MetaMask as the active provider
              window.ethereum = metamaskProvider;
              providers.metamask = metamaskProvider;
              // Restore original provider
              window.ethereum = originalProvider;
            }
          }
        } catch (error) {
          // Silent error handling
        }
      }
    }

    return providers;
  };

  const getWalletProvider = useCallback((targetWalletType) => {
    const providers = detectWalletProviders();
    
    if (targetWalletType === 'metamask') {
      return providers.metamask;
    } else if (targetWalletType === 'coinbase') {
      return providers.coinbase;
    }
    
    // Fallback to current ethereum provider
    return typeof window !== 'undefined' ? window.ethereum : null;
  }, []);

  const connectWalletWithProvider = useCallback(async (ethereumProvider, walletType, targetChainId = null) => {
    setIsConnecting(true);
    
    try {
      if (!ethereumProvider) {
        throw new Error('No wallet provider provided');
      }

      // Detect wallet type if not provided
      let detectedWalletType = walletType || 'unknown';
      if (!walletType) {
        if (ethereumProvider.isCoinbaseWallet) {
          detectedWalletType = 'coinbase';
        } else if (ethereumProvider.isMetaMask) {
          detectedWalletType = 'metamask';
        }
      }

      // Request account access
      const accounts = await ethereumProvider.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const account = accounts[0];
      let chainId = targetChainId;
      
      if (!chainId) {
        chainId = parseInt(await ethereumProvider.request({ method: 'eth_chainId' }), 16);
      } else {
        // Switch to target network if different
        const currentChainId = parseInt(await ethereumProvider.request({ method: 'eth_chainId' }), 16);
        if (currentChainId !== chainId) {
          try {
            await ethereumProvider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${chainId.toString(16)}` }],
            });
          } catch (switchError) {
            if (switchError.code === 4902) {
              // Network not added, add it
              const network = getNetworkByChainId(chainId);
              if (network) {
                await ethereumProvider.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: `0x${chainId.toString(16)}`,
                    chainName: network.name,
                    nativeCurrency: network.nativeCurrency,
                    rpcUrls: [network.rpcUrl],
                    blockExplorerUrls: [network.explorer],
                  }],
                });
              }
            } else {
              throw switchError;
            }
          }
        }
      }

      const provider = new ethers.BrowserProvider(ethereumProvider);
      const signer = await provider.getSigner();

      const network = getNetworkByChainId(chainId);
      if (!network) {
        showErrorWithDebounce(`Network with chain ID ${chainId} is not supported. Please switch to a supported network.`);
        setIsConnecting(false);
        return false;
      }

      setAccount(account);
      setProvider(provider);
      setSigner(signer);
      setChainId(chainId);
      setIsConnected(true);
      setWalletType(detectedWalletType);
      setUserDisconnected(false);

      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletType', detectedWalletType);
      localStorage.removeItem('userDisconnected');

      return true;

    } catch (error) {
      console.error('Error connecting wallet with provider:', error);
      toast.error(error.message || 'Failed to connect wallet');
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [showErrorWithDebounce]);

  const connectWallet = async (accountAddress = null, networkChainId = null, forceReconnect = false) => {
    setIsConnecting(true);
    
    try {
      if (typeof window === 'undefined') {
        throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.');
      }

      // Use the default ethereum provider
      const ethereumProvider = window.ethereum;

      if (!ethereumProvider) {
        throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.');
      }

      // If forceReconnect is true, clear the disconnection flag
      if (forceReconnect) {
        setUserDisconnected(false);
        localStorage.removeItem('userDisconnected');
      }

      // Check if user was previously disconnected
      const wasDisconnected = localStorage.getItem('userDisconnected') === 'true';
      
      // If user was disconnected, we need to force a fresh connection
      if (wasDisconnected) {
        // Clear all connection state
        localStorage.removeItem('walletConnected');
        localStorage.removeItem('walletType');
        setUserDisconnected(false);
        localStorage.removeItem('userDisconnected');
        
        // Wait a moment to ensure state is cleared
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Detect wallet type from the provider
      let detectedWalletType = 'unknown';
      if (ethereumProvider.isCoinbaseWallet) {
        detectedWalletType = 'coinbase';
      } else if (ethereumProvider.isMetaMask) {
        detectedWalletType = 'metamask';
      }

      // Request account access - this will show the approval dialog
      const accounts = await ethereumProvider.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const account = accountAddress || accounts[0];
      const chainId = networkChainId || parseInt(await ethereumProvider.request({ method: 'eth_chainId' }), 16);

      // Create provider and signer
      const provider = new ethers.BrowserProvider(ethereumProvider);
      const signer = await provider.getSigner();

      // Check if network is supported
      const network = getNetworkByChainId(chainId);
      if (!network) {
        showErrorWithDebounce(`Network with chain ID ${chainId} is not supported. Please switch to a supported network.`);
        setIsConnecting(false);
        return false;
      }

      // Update state
      setAccount(account);
      setProvider(provider);
      setSigner(signer);
      setChainId(chainId);
      setIsConnected(true);
      setWalletType(detectedWalletType);

      // Store connection in localStorage
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletType', detectedWalletType);
      localStorage.removeItem('userDisconnected'); // Clear disconnection flag

      const walletName = detectedWalletType === 'coinbase' ? 'Coinbase Wallet' : 'MetaMask';
      toast.success(`Connected to ${network.name} via ${walletName}`);
      return true;

    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const forceFreshConnection = async () => {
    // This function forces a completely fresh connection
    // by clearing all cached state and requesting new permissions
    setIsConnecting(true);
    
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.');
      }

      // Clear any existing connection state
      setUserDisconnected(false);
      localStorage.removeItem('userDisconnected');
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletType');

      // Use the default ethereum provider
      const ethereumProvider = window.ethereum;

      // Try to revoke any existing permissions first (only for MetaMask)
      if (ethereumProvider.isMetaMask) {
        try {
          if (ethereumProvider.request && typeof ethereumProvider.request === 'function') {
            await ethereumProvider.request({
              method: 'wallet_revokePermissions',
              params: [{ eth_accounts: {} }]
            });
          }
        } catch (revokeError) {
          // Silent error handling
        }
      }

      // Wait a moment for the revocation to take effect
      await new Promise(resolve => setTimeout(resolve, 500));

      // Try to force wallet to show approval by clearing connection state
      
      // Method 1: Try to clear any existing connection by checking accounts first
      try {
        const existingAccounts = await ethereumProvider.request({
          method: 'eth_accounts'
        });
        
        if (existingAccounts.length > 0) {
          // Wallet still has cached connection
        }
      } catch (accountsError) {
        // Silent error handling
      }

      // Method 2: Force new account request
      let accounts;
      try {
        accounts = await ethereumProvider.request({
          method: 'eth_requestAccounts'
        });
      } catch (requestError) {
        // If eth_requestAccounts fails, try a different approach
        if (requestError.code === 4001) {
          throw new Error('Wallet connection was cancelled');
        } else {
          throw new Error('Failed to request account access: ' + requestError.message);
        }
      }

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const account = accounts[0];
      const chainId = parseInt(await ethereumProvider.request({ method: 'eth_chainId' }), 16);

      // Create provider and signer
      const provider = new ethers.BrowserProvider(ethereumProvider);
      const signer = await provider.getSigner();

      // Check if network is supported
      const network = getNetworkByChainId(chainId);
      if (!network) {
        showErrorWithDebounce(`Network with chain ID ${chainId} is not supported. Please switch to a supported network.`);
        setIsConnecting(false);
        return false;
      }

      // Detect wallet type
      let detectedWalletType = 'unknown';
      if (ethereumProvider.isCoinbaseWallet) {
        detectedWalletType = 'coinbase';
      } else if (ethereumProvider.isMetaMask) {
        detectedWalletType = 'metamask';
      }

      // Update state
      setAccount(account);
      setProvider(provider);
      setSigner(signer);
      setChainId(chainId);
      setIsConnected(true);
      setWalletType(detectedWalletType);
      setUserDisconnected(false);

      // Store connection in localStorage
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletType', detectedWalletType);
      localStorage.removeItem('userDisconnected');

      const walletName = detectedWalletType === 'coinbase' ? 'Coinbase Wallet' : 'MetaMask';
      toast.success(`Fresh connection established with ${network.name} via ${walletName}`);
      return true;

    } catch (error) {
      console.error('Error forcing fresh connection:', error);
      toast.error(error.message || 'Failed to establish fresh connection');
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const debugWalletState = () => {
    console.log('=== Wallet Debug Info ===');
    console.log('Current Account:', account);
    console.log('Is Connected:', isConnected);
    console.log('Is Connecting:', isConnecting);
    console.log('User Disconnected:', userDisconnected);
    console.log('Chain ID:', chainId);
    console.log('Wallet Type:', walletType);
    console.log('localStorage userDisconnected:', localStorage.getItem('userDisconnected'));
    console.log('localStorage walletConnected:', localStorage.getItem('walletConnected'));
    console.log('localStorage walletType:', localStorage.getItem('walletType'));
    
    if (typeof window !== 'undefined' && window.ethereum) {
      console.log('Wallet Available:', true);
      console.log('Is Connected:', window.ethereum.isConnected());
      console.log('Is MetaMask:', window.ethereum.isMetaMask);
      console.log('Is Coinbase Wallet:', window.ethereum.isCoinbaseWallet);
      console.log('Selected Address:', window.ethereum.selectedAddress);
      
      // Check permissions
      window.ethereum.request({ method: 'wallet_getPermissions' })
        .then(permissions => {
          console.log('Wallet Permissions:', permissions);
        })
        .catch(error => {
          console.log('Could not get permissions:', error);
        });
    } else {
      console.log('Wallet Available:', false);
    }
    console.log('========================');
  };

  const switchNetwork = async (targetChainId) => {
    console.log('🔄 Attempting to switch to network:', targetChainId);
    if (!isConnected || !window.ethereum) {
      console.log('❌ Cannot switch network: wallet not connected or no ethereum provider');
      toast.error('Please connect your wallet first');
      return false;
    }

    try {
      const targetNetwork = getNetworkByChainId(targetChainId);
      
      if (!targetNetwork) {
        console.log('❌ Target network not supported:', targetChainId);
        throw new Error(`Network with chain ID ${targetChainId} is not supported`);
      }

      console.log('📡 Requesting network switch to:', targetNetwork.name);
      // Try to switch network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });

      console.log('✅ Network switch successful:', targetNetwork.name);
      
      // Wait for the network to actually change and stabilize
      console.log('⏳ Waiting for network to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify the network has actually changed
      const currentChainId = parseInt(await window.ethereum.request({ method: 'eth_chainId' }), 16);
      if (currentChainId !== targetChainId) {
        console.log('⚠️ Network change not confirmed, waiting longer...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Manually update the chainId state since the chainChanged event might not fire reliably
      console.log('📊 Manually updating chainId state to:', targetChainId);
      setChainId(targetChainId);
      
      // Update provider and signer for the new network
      console.log('🔄 Updating provider and signer for new network...');
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      const newSigner = await newProvider.getSigner();
      setProvider(newProvider);
      setSigner(newSigner);
      console.log('✅ Provider and signer updated for new network');
      
      toast.success(`Switched to ${targetNetwork.name}`);
      return true;

    } catch (switchError) {
      console.log('⚠️ Network switch failed:', switchError);
      // If the network doesn't exist in the wallet, add it
      if (switchError.code === 4902) {
        try {
          const targetNetwork = getNetworkByChainId(targetChainId);
          console.log('📡 Adding network to wallet:', targetNetwork.name);
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${targetChainId.toString(16)}`,
              chainName: targetNetwork.name,
              nativeCurrency: targetNetwork.nativeCurrency,
              rpcUrls: [targetNetwork.rpcUrl],
              blockExplorerUrls: [targetNetwork.explorer],
            }],
          });
          console.log('✅ Network added and switched successfully:', targetNetwork.name);
          
          // Wait for the network to actually change and stabilize
          console.log('⏳ Waiting for network to stabilize...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Manually update the chainId state after adding and switching
          console.log('📊 Manually updating chainId state to:', targetChainId);
          setChainId(targetChainId);
          
          // Update provider and signer for the new network
          console.log('🔄 Updating provider and signer for new network...');
          const newProvider = new ethers.BrowserProvider(window.ethereum);
          const newSigner = await newProvider.getSigner();
          setProvider(newProvider);
          setSigner(newSigner);
          console.log('✅ Provider and signer updated for new network');
          
          toast.success(`Added and switched to ${targetNetwork.name}`);
          return true;
        } catch (addError) {
          console.log('❌ Failed to add network:', addError);
          toast.error('Failed to add network to wallet');
          return false;
        }
      } else {
        console.log('❌ Network switch error:', switchError);
        toast.error('Failed to switch network');
        return false;
      }
    }
  };

  const getCurrentNetwork = () => {
    return chainId ? getNetworkByChainId(chainId) : null;
  };

  const getAccountBalance = async () => {
    if (!provider || !account) return null;
    
    try {
      // Check if provider's network matches current chainId
      const providerNetwork = await provider.getNetwork();
      if (Number(providerNetwork.chainId) !== chainId) {
        console.log('⚠️ Provider network mismatch, waiting for network to sync...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Add a small delay to ensure provider is ready for the new network
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const balance = await provider.getBalance(account);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      // Don't show error toast for network change errors, just return null
      if (error.code === 'NETWORK_ERROR' || error.message.includes('network changed')) {
        console.log('⚠️ Network change detected, retrying balance fetch...');
        // Try one more time after a longer delay
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const balance = await provider.getBalance(account);
          return ethers.formatEther(balance);
        } catch (retryError) {
          console.log('❌ Balance fetch retry failed:', retryError);
          return null;
        }
      }
      return null;
    }
  };

  const value = {
    account,
    provider,
    signer,
    chainId,
    isConnecting,
    isConnected,
    walletType,
    connectWallet,
    disconnectWallet,
    forceFreshConnection,
    switchNetwork,
    getCurrentNetwork,
    getAccountBalance,
    debugWalletState,
    detectWalletProviders,
    getWalletProvider,
    connectWalletWithProvider,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}; 