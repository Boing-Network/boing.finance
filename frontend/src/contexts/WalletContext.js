import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getNetworkByChainId, NETWORKS } from '../config/networks';
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
  const [preferredWalletType, setPreferredWalletType] = useState(null);
  const [lastErrorTime, setLastErrorTime] = useState(0);
  const [userDisconnected, setUserDisconnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Debounce error messages to prevent spam
  const showErrorWithDebounce = (message) => {
    const now = Date.now();
    if (now - lastErrorTime > 2000) { // Only show error if 2 seconds have passed
      toast.error(message);
      setLastErrorTime(now);
    }
  };

  // Initialize wallet connection on mount
  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized) {
      return;
    }

    const initWallet = async () => {
      console.log('🔄 Initializing wallet...');
      // Check if user previously disconnected
      const wasDisconnected = localStorage.getItem('userDisconnected') === 'true';
      setUserDisconnected(wasDisconnected);
      
      // Only auto-connect if user hasn't explicitly disconnected
      if (!wasDisconnected) {
        await checkWalletConnection();
      }
      console.log('🔗 Setting up event listeners...');
      setupEventListeners();
      setIsInitialized(true);
      console.log('✅ Wallet initialization complete');
    };
    initWallet();

    // Cleanup function to remove event listeners
    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [isInitialized]);

  const setupEventListeners = () => {
    console.log('🎧 Setting up event listeners...');
    if (typeof window !== 'undefined' && window.ethereum) {
      // Remove any existing listeners first to prevent duplicates
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener('disconnect', handleDisconnect);
      
      // Add new listeners
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);
      console.log('✅ Event listeners attached successfully');
    } else {
      console.log('❌ No ethereum provider found, cannot attach event listeners');
    }
  };

  const checkWalletConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        // Check if user has explicitly disconnected
        const wasDisconnected = localStorage.getItem('userDisconnected') === 'true';
        
        if (wasDisconnected) {
          return;
        }

        // Check if already connected to prevent duplicate connections
        if (isConnected && account) {
          return;
        }

        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0 && !userDisconnected) {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          // Auto-connect without showing toast
          await connectWalletSilently(accounts[0], parseInt(chainId, 16));
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const handleAccountsChanged = async (accounts) => {
    // Check if user has explicitly disconnected
    const wasDisconnected = localStorage.getItem('userDisconnected') === 'true';
    
    if (wasDisconnected) {
      return;
    }

    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      // Only update account if user hasn't explicitly disconnected
      if (!userDisconnected) {
        setAccount(accounts[0]);
      }
    }
  };

  const handleChainChanged = async (chainId) => {
    console.log('🔄 Chain changed event received:', chainId);
    // Check if user has explicitly disconnected
    const wasDisconnected = localStorage.getItem('userDisconnected') === 'true';
    
    if (wasDisconnected) {
      console.log('❌ User has explicitly disconnected, ignoring chain change');
      return;
    }
    
    // Only handle chain changes if user hasn't explicitly disconnected
    if (userDisconnected) {
      console.log('❌ User is disconnected, ignoring chain change');
      return;
    }
    
    // Handle different formats of chainId
    let newChainId;
    if (typeof chainId === 'string') {
      if (chainId.startsWith('0x')) {
        newChainId = parseInt(chainId, 16);
      } else {
        newChainId = parseInt(chainId, 10);
      }
    } else {
      newChainId = parseInt(chainId);
    }
    
    if (isNaN(newChainId)) {
      console.error('❌ Failed to parse chain ID:', chainId);
      return;
    }
    
    console.log('📊 Updating chainId state from', chainId, 'to', newChainId);
    setChainId(newChainId);
    // Check if the new network is supported
    const network = getNetworkByChainId(newChainId);
    if (!network) {
      console.log('⚠️ Network not supported:', newChainId);
      showErrorWithDebounce(`Network with chain ID ${newChainId} is not supported. Please switch to a supported network.`);
    } else {
      console.log('✅ Network supported:', network.name);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  const setPreferredWallet = (walletType) => {
    setPreferredWalletType(walletType);
    localStorage.setItem('preferredWalletType', walletType);
    console.log('Preferred wallet type set to:', walletType);
  };

  const getPreferredWallet = () => {
    return preferredWalletType || localStorage.getItem('preferredWalletType');
  };

  const detectWalletProviders = () => {
    const providers = {
      metamask: null,
      coinbase: null
    };

    // Check for multiple providers first
    if (typeof window !== 'undefined' && window.ethereum && window.ethereum.providers) {
      window.ethereum.providers.forEach(provider => {
        if (provider.isMetaMask && !provider.isCoinbaseWallet) {
          providers.metamask = provider;
        }
        if (provider.isCoinbaseWallet) {
          providers.coinbase = provider;
        }
      });
    }

    // Check for single provider
    if (typeof window !== 'undefined' && window.ethereum) {
      if (window.ethereum.isMetaMask && !window.ethereum.isCoinbaseWallet) {
        providers.metamask = window.ethereum;
      }
      if (window.ethereum.isCoinbaseWallet) {
        providers.coinbase = window.ethereum;
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

  const getWalletProvider = (targetWalletType) => {
    const providers = detectWalletProviders();
    
    if (targetWalletType === 'metamask') {
      if (!providers.metamask) {
        throw new Error('MetaMask not detected. Please make sure MetaMask is installed and unlocked.');
      }
      return providers.metamask;
    } else if (targetWalletType === 'coinbase') {
      if (!providers.coinbase) {
        throw new Error('Coinbase Wallet not detected. Please make sure Coinbase Wallet is installed and unlocked.');
      }
      return providers.coinbase;
    }
    
    // Fallback to current ethereum provider
    return window.ethereum;
  };

  const checkMetaMaskAvailability = () => {
    // Check if MetaMask extension is installed
    if (typeof window !== 'undefined') {
      // Method 1: Check if MetaMask is in the providers array
      if (window.ethereum && window.ethereum.providers) {
        const metamaskProvider = window.ethereum.providers.find(p => p.isMetaMask && !p.isCoinbaseWallet);
        if (metamaskProvider) {
          return metamaskProvider;
        }
      }
      
      // Method 2: Check if MetaMask is available globally
      if (window.metamask) {
        return window.metamask;
      }
      
      // Method 3: Check if MetaMask is the current provider
      if (window.ethereum && window.ethereum.isMetaMask && !window.ethereum.isCoinbaseWallet) {
        return window.ethereum;
      }
      
      // Method 4: Try to detect MetaMask by checking for its extension
      try {
        // This is a more direct approach
        if (window.ethereum && window.ethereum.providers) {
          // Available providers logging removed
        }
      } catch (error) {
        // Silent error handling
      }
    }
    
    return null;
  };

  const connectWalletSilently = async (accountAddress = null, networkChainId = null, forceReconnect = false) => {
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

      // Don't show toast for silent connections
      return true;

    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

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

  const disconnectWallet = async () => {
    try {
      // Try to revoke permissions using available methods
      if (typeof window !== 'undefined' && window.ethereum) {
        // Get the current wallet provider
        const currentWalletType = localStorage.getItem('walletType');
        let ethereumProvider = window.ethereum;
        
        if (currentWalletType) {
          ethereumProvider = getWalletProvider(currentWalletType);
        }
        
        if (!ethereumProvider) {
          ethereumProvider = window.ethereum;
        }
        
        // Detect wallet type for specific disconnection methods
        const isCoinbaseWallet = ethereumProvider.isCoinbaseWallet;
        const isMetaMask = ethereumProvider.isMetaMask;

        if (isCoinbaseWallet) {
          // Coinbase Wallet specific disconnection
          
          // Method 1: Try Coinbase Wallet's disconnect method
          try {
            if (ethereumProvider.disconnect && typeof ethereumProvider.disconnect === 'function') {
              await ethereumProvider.disconnect();
            }
          } catch (disconnectError) {
            // Silent error handling
          }

          // Method 2: Try to clear connection by requesting accounts
          try {
            await ethereumProvider.request({
              method: 'eth_accounts'
            });
          } catch (accountsError) {
            // Silent error handling
          }

          // Method 3: Try to force account disconnection by requesting empty accounts
          try {
            // This might force Coinbase Wallet to clear the connection
            await ethereumProvider.request({
              method: 'eth_requestAccounts'
            });
          } catch (requestError) {
            // Silent error handling
          }

        } else if (isMetaMask) {
          // MetaMask specific disconnection
          
          // Method 1: Try wallet_revokePermissions (if available)
          try {
            if (ethereumProvider.request && typeof ethereumProvider.request === 'function') {
              await ethereumProvider.request({
                method: 'wallet_revokePermissions',
                params: [{ eth_accounts: {} }]
              });
            }
          } catch (revokeError) {
            // Method 2: Try to disconnect using MetaMask's disconnect method
            try {
              if (ethereumProvider.disconnect && typeof ethereumProvider.disconnect === 'function') {
                await ethereumProvider.disconnect();
              }
            } catch (disconnectError) {
              // Silent error handling
            }
          }

          // Method 3: Try to clear the connection by requesting empty accounts
          try {
            await ethereumProvider.request({
              method: 'eth_accounts'
            });
          } catch (accountsError) {
            // Silent error handling
          }
        } else {
          // Generic disconnection for unknown wallet types
          
          try {
            if (ethereumProvider.disconnect && typeof ethereumProvider.disconnect === 'function') {
              await ethereumProvider.disconnect();
            }
          } catch (disconnectError) {
            // Silent error handling
          }

          // Try generic permission revocation (only for MetaMask)
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
        }
      }
    } catch (error) {
      // Silent error handling
    }

    // Clear all state
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setIsConnected(false);
    setWalletType(null);
    setUserDisconnected(true);

    // Clear localStorage
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletType');
    localStorage.setItem('userDisconnected', 'true'); // Set disconnection flag
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
          const walletName = ethereumProvider.isCoinbaseWallet ? 'Coinbase Wallet' : 'MetaMask';
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

  const switchToWallet = async (targetWalletType) => {
    console.log(`Attempting to switch to ${targetWalletType}...`);
    
    try {
      const providers = detectWalletProviders();
      
      if (targetWalletType === 'metamask') {
        if (!providers.metamask) {
          // Try additional detection methods
          const metamaskProvider = checkMetaMaskAvailability();
          if (metamaskProvider) {
            console.log('MetaMask found through additional detection');
            return metamaskProvider;
          }
          
          throw new Error('MetaMask not available. Please make sure MetaMask is installed and unlocked. If you have both MetaMask and Coinbase Wallet installed, try temporarily disabling Coinbase Wallet to test MetaMask connection.');
        }
        
        // Try to switch to MetaMask provider
        if (window.ethereum && window.ethereum.providers) {
          // Find MetaMask in the providers array
          const metamaskProvider = window.ethereum.providers.find(p => p.isMetaMask && !p.isCoinbaseWallet);
          if (metamaskProvider) {
            // Try to activate MetaMask
            try {
              await metamaskProvider.request({ method: 'eth_accounts' });
              console.log('Successfully switched to MetaMask');
              return metamaskProvider;
            } catch (error) {
              console.log('Failed to activate MetaMask:', error);
            }
          }
        }
        
        // If we can't switch, use the detected MetaMask provider
        return providers.metamask;
        
      } else if (targetWalletType === 'coinbase') {
        if (!providers.coinbase) {
          throw new Error('Coinbase Wallet not available. Please make sure Coinbase Wallet is installed and unlocked.');
        }
        return providers.coinbase;
      }
      
      throw new Error(`Unknown wallet type: ${targetWalletType}`);
      
    } catch (error) {
      console.error('Error switching wallet:', error);
      throw error;
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
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}; 