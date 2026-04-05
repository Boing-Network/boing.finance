import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { getNetworkByChainId, getWalletAddChainParams, BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import toast from 'react-hot-toast';
import {
  getWindowBoingProvider,
  isBoingNamedProvider,
  isBoingNativeAccountIdHex,
  requestAccountsFromBoingCompatibleProvider,
  getChainIdFromBoingCompatibleProvider,
  switchToBoingTestnetInWallet
} from '../utils/boingWalletDiscovery';
import {
  forgetBoingExpressConnectionProof,
  notifyBoingExpressWalletAccountChanged,
  requestBoingExpressConnectionProof
} from '../utils/boingExpressConnectionProof';

/**
 * ethers v6 BrowserProvider expects EVM 20-byte addresses. Boing Express exposes 32-byte
 * native AccountIds (see BOING-EXPRESS-WALLET.md)—getSigner cannot wrap those for Solidity deploys.
 * @returns {{ browserProvider: import('ethers').BrowserProvider, signer: import('ethers').JsonRpcSigner | null, evmSignerUnavailableReason: 'boing_native_account' | null }}
 */
async function createBrowserProviderAndSigner(eip1193Provider, accountAddress) {
  const browserProvider = new ethers.BrowserProvider(eip1193Provider);

  let signer = null;
  try {
    signer = await browserProvider.getSigner();
  } catch (e) {
    console.warn('[WalletContext] getSigner() failed, will retry with address if available:', e?.message || e);
  }
  // ethers rejects 32-byte Boing AccountIds as EVM addresses—skip getSigner(account) for those
  if (!signer && accountAddress && !isBoingNativeAccountIdHex(accountAddress)) {
    try {
      signer = await browserProvider.getSigner(accountAddress);
    } catch (e2) {
      console.warn('[WalletContext] getSigner(account) failed:', e2?.message || e2);
    }
  }

  const evmSignerUnavailableReason =
    !signer && isBoingNativeAccountIdHex(accountAddress) ? 'boing_native_account' : null;

  return { browserProvider, signer, evmSignerUnavailableReason };
}

/**
 * @param {import('ethers').JsonRpcSigner | null} signer
 * @param {'boing_native_account' | null} evmSignerUnavailableReason
 * @param {{ reconnectHint?: boolean }} [opts]
 */
function toastIfNoEvmSigner(signer, evmSignerUnavailableReason, opts = {}) {
  if (signer) return;
  if (evmSignerUnavailableReason === 'boing_native_account') {
    toast(
      'Boing Express is connected with a native Boing account (32-byte). This app’s ERC-20 deploy and EVM transactions need a 20-byte Ethereum address—use MetaMask or another EVM wallet with “EVM” selected (e.g. Sepolia), or use Boing Native VM for native Boing tools.',
      { duration: 10000 }
    );
    return;
  }
  toast.error(
    opts.reconnectHint
      ? 'Transaction signing is not ready. Try opening your wallet extension or connect again.'
      : 'Wallet connected, but transaction signing is not ready. Try disconnect and connect again.'
  );
}

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
  const activeEip1193ProviderRef = useRef(null);
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

  const getActiveRawEip1193 = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return activeEip1193ProviderRef.current || window.ethereum;
  }, []);

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
        notifyBoingExpressWalletAccountChanged(accounts[0]);
        setAccount(accounts[0]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omit disconnectWallet to avoid stale closure
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
      activeEip1193ProviderRef.current = null;
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
      forgetBoingExpressConnectionProof();

      console.log('Wallet disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    disconnectWallet();
  }, [disconnectWallet]);

  const setupEventListeners = useCallback(() => {
    const raw = typeof window !== 'undefined'
      ? (activeEip1193ProviderRef.current || window.ethereum)
      : null;
    if (raw && typeof raw.removeListener === 'function') {
      raw.removeListener('accountsChanged', handleAccountsChanged);
      raw.removeListener('chainChanged', handleChainChanged);
      raw.removeListener('disconnect', handleDisconnect);
      raw.on('accountsChanged', handleAccountsChanged);
      raw.on('chainChanged', handleChainChanged);
      raw.on('disconnect', handleDisconnect);
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
        forgetBoingExpressConnectionProof();
      }

      const wasDisconnected = localStorage.getItem('userDisconnected') === 'true';
      
      if (wasDisconnected) {
        localStorage.removeItem('walletConnected');
        localStorage.removeItem('walletType');
        setUserDisconnected(false);
        localStorage.removeItem('userDisconnected');
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const isBoingWallet =
        provider === getWindowBoingProvider() ||
        isBoingNamedProvider(provider);

      let detectedWalletType = 'unknown';
      if (isBoingWallet) {
        detectedWalletType = 'boingExpress';
      } else if (provider.isCoinbaseWallet) {
        detectedWalletType = 'coinbase';
      } else if (provider.isMetaMask) {
        detectedWalletType = 'metamask';
      }

      let accounts = await provider.request({ method: 'eth_accounts' });

      if (accounts.length === 0) {
        if (isBoingWallet) {
          try {
            accounts = await requestAccountsFromBoingCompatibleProvider(provider);
          } catch {
            accounts = [];
          }
        } else {
          const requestedAccounts = await provider.request({
            method: 'eth_requestAccounts'
          });
          if (requestedAccounts.length === 0) {
            throw new Error('No accounts found');
          }
          accounts = requestedAccounts;
        }
      }

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const account = accountAddress || accounts[0];
      const chainId =
        networkChainId ??
        (isBoingWallet
          ? await getChainIdFromBoingCompatibleProvider(provider)
          : parseInt(await provider.request({ method: 'eth_chainId' }), 16));

      activeEip1193ProviderRef.current = provider;

      const { browserProvider: ethersProvider, signer, evmSignerUnavailableReason } =
        await createBrowserProviderAndSigner(provider, account);

      const network = getNetworkByChainId(chainId);
      if (!network) {
        showErrorWithDebounce(`Network with chain ID ${chainId} is not supported. Please switch to a supported network.`);
        activeEip1193ProviderRef.current = null;
        setIsConnecting(false);
        return false;
      }

      if (isBoingWallet) {
        const proof = await requestBoingExpressConnectionProof(provider, account);
        if (!proof.ok) {
          activeEip1193ProviderRef.current = null;
          localStorage.removeItem('walletConnected');
          localStorage.removeItem('walletType');
          setIsConnecting(false);
          return false;
        }
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

      setupEventListeners();

      toastIfNoEvmSigner(signer, evmSignerUnavailableReason);

      return true;

    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [showErrorWithDebounce, setupEventListeners]);

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
    } else if (lastWalletType === 'boingExpress' && providers.boingExpress) {
      lastProvider = providers.boingExpress;
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
      // Prefer silent eth_accounts; if the extension is slow or permissions need re-activation,
      // request accounts once (may prompt) before dropping a previously saved session.
      let accounts = await lastProvider.request({ method: 'eth_accounts' });
      if (accounts.length === 0 && wasConnected && !userDisconnected) {
        try {
          if (lastWalletType === 'boingExpress') {
            accounts = await requestAccountsFromBoingCompatibleProvider(lastProvider);
          } else {
            accounts = await lastProvider.request({ method: 'eth_requestAccounts' });
          }
        } catch {
          accounts = [];
        }
      }
      if (accounts.length > 0 && !userDisconnected) {
        let chainIdNum;
        if (lastWalletType === 'boingExpress') {
          chainIdNum = await getChainIdFromBoingCompatibleProvider(lastProvider);
        } else {
          const hex = await lastProvider.request({ method: 'eth_chainId' });
          chainIdNum = parseInt(hex, 16);
        }
        if (Number.isNaN(chainIdNum)) {
          try {
            chainIdNum = await getChainIdFromBoingCompatibleProvider(lastProvider);
          } catch {
            chainIdNum = NaN;
          }
        }
        if (Number.isNaN(chainIdNum)) {
          localStorage.removeItem('walletConnected');
          localStorage.removeItem('walletType');
          return;
        }
        await connectWalletSilently(accounts[0], chainIdNum, lastProvider);
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
      // Wallet initialization complete
    };
    
    // Only initialize once
    initWallet();
    
    return () => {
      if (typeof window !== 'undefined') {
        const raw = activeEip1193ProviderRef.current || window.ethereum;
        if (raw && typeof raw.removeListener === 'function') {
          raw.removeListener('accountsChanged', handleAccountsChanged);
          raw.removeListener('chainChanged', handleChainChanged);
          raw.removeListener('disconnect', handleDisconnect);
        }
      }
    };
  }, [isInitialized, checkWalletConnection, handleAccountsChanged, handleChainChanged, handleDisconnect, setupEventListeners]);

  const detectWalletProviders = () => {
    const providers = {
      metamask: null,
      coinbase: null,
      phantom: null,
      boingExpress: null
    };

    const winBoing = getWindowBoingProvider();
    if (winBoing) {
      providers.boingExpress = winBoing;
    }

    // Check if Phantom is installed (Phantom can inject into window.ethereum)
    const _isPhantomInstalled = typeof window !== 'undefined' && (
      window.phantom?.ethereum || 
      (window.ethereum && window.ethereum.isPhantom)
    );

    // Check for multiple providers first
    if (typeof window !== 'undefined' && window.ethereum && window.ethereum.providers) {
      window.ethereum.providers.forEach(provider => {
        if (isBoingNamedProvider(provider) && !providers.boingExpress) {
          providers.boingExpress = provider;
        }
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
      if (isBoingNamedProvider(window.ethereum) && !providers.boingExpress) {
        providers.boingExpress = window.ethereum;
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
    } else if (targetWalletType === 'boingExpress') {
      return providers.boingExpress || getWindowBoingProvider();
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

      const isBoingWallet =
        ethereumProvider === getWindowBoingProvider() ||
        isBoingNamedProvider(ethereumProvider) ||
        walletType === 'boingExpress';

      let detectedWalletType = walletType || 'unknown';
      if (!walletType || detectedWalletType === 'unknown') {
        if (isBoingWallet) {
          detectedWalletType = 'boingExpress';
        } else if (ethereumProvider.isCoinbaseWallet) {
          detectedWalletType = 'coinbase';
        } else if (ethereumProvider.isMetaMask) {
          detectedWalletType = 'metamask';
        }
      }

      const accounts = await requestAccountsFromBoingCompatibleProvider(ethereumProvider);

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const account = accounts[0];
      let chainId = targetChainId;

      if (!chainId) {
        chainId = await getChainIdFromBoingCompatibleProvider(ethereumProvider);
      } else {
        const currentChainId = await getChainIdFromBoingCompatibleProvider(ethereumProvider);
        if (currentChainId !== chainId) {
          if (chainId === BOING_NATIVE_L1_CHAIN_ID && !isBoingWallet) {
            toast.error(
              'Boing testnet needs Boing Express (EVM wallets cannot sign Boing VM transactions). Install from boing.express and connect with it.'
            );
            setIsConnecting(false);
            return false;
          }
          let switchedViaBoing = false;
          if (chainId === BOING_NATIVE_L1_CHAIN_ID && isBoingWallet) {
            switchedViaBoing = await switchToBoingTestnetInWallet(ethereumProvider);
          }
          if (!switchedViaBoing) {
            try {
              await ethereumProvider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chainId.toString(16)}` }],
              });
            } catch (switchError) {
              if (switchError.code === 4902) {
                const addParams = getWalletAddChainParams(chainId);
                if (addParams) {
                  await ethereumProvider.request({
                    method: 'wallet_addEthereumChain',
                    params: [addParams],
                  });
                }
              } else {
                throw switchError;
              }
            }
          }
          chainId = await getChainIdFromBoingCompatibleProvider(ethereumProvider);
        }
      }

      activeEip1193ProviderRef.current = ethereumProvider;

      const { browserProvider: ethersBrowserProvider, signer: evmSigner, evmSignerUnavailableReason } =
        await createBrowserProviderAndSigner(ethereumProvider, account);

      const network = getNetworkByChainId(chainId);
      if (!network) {
        showErrorWithDebounce(`Network with chain ID ${chainId} is not supported. Please switch to a supported network.`);
        activeEip1193ProviderRef.current = null;
        setIsConnecting(false);
        return false;
      }

      if (isBoingWallet) {
        const proof = await requestBoingExpressConnectionProof(ethereumProvider, account);
        if (!proof.ok) {
          activeEip1193ProviderRef.current = null;
          if (proof.reason === 'user_rejected') {
            toast.error('Sign the connection message in Boing Express to continue.');
          } else {
            toast.error(
              'Boing Express must sign the connection message. Update the extension or use boing_signMessage / personal_sign support.'
            );
          }
          setIsConnecting(false);
          return false;
        }
      }

      setAccount(account);
      setProvider(ethersBrowserProvider);
      setSigner(evmSigner);
      setChainId(chainId);
      setIsConnected(true);
      setWalletType(detectedWalletType);
      setUserDisconnected(false);

      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletType', detectedWalletType);
      localStorage.removeItem('userDisconnected');

      setupEventListeners();

      toastIfNoEvmSigner(evmSigner, evmSignerUnavailableReason);

      return true;

    } catch (error) {
      console.error('Error connecting wallet with provider:', error);
      toast.error(error.message || 'Failed to connect wallet');
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [showErrorWithDebounce, setupEventListeners]);

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
        forgetBoingExpressConnectionProof();
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

      const isBoingWallet = isBoingNamedProvider(ethereumProvider);

      let detectedWalletType = 'unknown';
      if (isBoingWallet) {
        detectedWalletType = 'boingExpress';
      } else if (ethereumProvider.isCoinbaseWallet) {
        detectedWalletType = 'coinbase';
      } else if (ethereumProvider.isMetaMask) {
        detectedWalletType = 'metamask';
      }

      const accounts = isBoingWallet
        ? await requestAccountsFromBoingCompatibleProvider(ethereumProvider)
        : await ethereumProvider.request({
            method: 'eth_requestAccounts'
          });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const account = accountAddress || accounts[0];
      const chainId =
        networkChainId ??
        (isBoingWallet
          ? await getChainIdFromBoingCompatibleProvider(ethereumProvider)
          : parseInt(await ethereumProvider.request({ method: 'eth_chainId' }), 16));

      activeEip1193ProviderRef.current = ethereumProvider;

      const { browserProvider: ethersBrowserProvider, signer: evmSigner, evmSignerUnavailableReason } =
        await createBrowserProviderAndSigner(ethereumProvider, account);

      // Check if network is supported
      const network = getNetworkByChainId(chainId);
      if (!network) {
        showErrorWithDebounce(`Network with chain ID ${chainId} is not supported. Please switch to a supported network.`);
        activeEip1193ProviderRef.current = null;
        setIsConnecting(false);
        return false;
      }

      if (isBoingWallet) {
        const proof = await requestBoingExpressConnectionProof(ethereumProvider, account);
        if (!proof.ok) {
          activeEip1193ProviderRef.current = null;
          if (proof.reason === 'user_rejected') {
            toast.error('Sign the connection message in Boing Express to continue.');
          } else {
            toast.error(
              'Boing Express must sign the connection message. Update the extension or use boing_signMessage / personal_sign support.'
            );
          }
          setIsConnecting(false);
          return false;
        }
      }

      // Update state
      setAccount(account);
      setProvider(ethersBrowserProvider);
      setSigner(evmSigner);
      setChainId(chainId);
      setIsConnected(true);
      setWalletType(detectedWalletType);

      // Store connection in localStorage
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletType', detectedWalletType);
      localStorage.removeItem('userDisconnected'); // Clear disconnection flag

      setupEventListeners();

      const walletName =
        detectedWalletType === 'coinbase'
          ? 'Coinbase Wallet'
          : detectedWalletType === 'boingExpress'
            ? 'Boing Express'
            : 'MetaMask';
      toast.success(`Connected to ${network.name} via ${walletName}`);
      toastIfNoEvmSigner(evmSigner, evmSignerUnavailableReason);
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
      forgetBoingExpressConnectionProof();

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

      const isBoingWallet = isBoingNamedProvider(ethereumProvider);

      // Method 2: Force new account request
      let accounts;
      try {
        accounts = isBoingWallet
          ? await requestAccountsFromBoingCompatibleProvider(ethereumProvider)
          : await ethereumProvider.request({
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
      const chainId = isBoingWallet
        ? await getChainIdFromBoingCompatibleProvider(ethereumProvider)
        : parseInt(await ethereumProvider.request({ method: 'eth_chainId' }), 16);

      activeEip1193ProviderRef.current = ethereumProvider;

      const { browserProvider: ethersBrowserProvider, signer: evmSigner, evmSignerUnavailableReason } =
        await createBrowserProviderAndSigner(ethereumProvider, account);

      // Check if network is supported
      const network = getNetworkByChainId(chainId);
      if (!network) {
        showErrorWithDebounce(`Network with chain ID ${chainId} is not supported. Please switch to a supported network.`);
        activeEip1193ProviderRef.current = null;
        setIsConnecting(false);
        return false;
      }

      if (isBoingWallet) {
        const proof = await requestBoingExpressConnectionProof(ethereumProvider, account);
        if (!proof.ok) {
          activeEip1193ProviderRef.current = null;
          if (proof.reason === 'user_rejected') {
            toast.error('Sign the connection message in Boing Express to continue.');
          } else {
            toast.error(
              'Boing Express must sign the connection message. Update the extension or use boing_signMessage / personal_sign support.'
            );
          }
          setIsConnecting(false);
          return false;
        }
      }

      // Detect wallet type
      let detectedWalletType = 'unknown';
      if (isBoingWallet) {
        detectedWalletType = 'boingExpress';
      } else if (ethereumProvider.isCoinbaseWallet) {
        detectedWalletType = 'coinbase';
      } else if (ethereumProvider.isMetaMask) {
        detectedWalletType = 'metamask';
      }

      // Update state
      setAccount(account);
      setProvider(ethersBrowserProvider);
      setSigner(evmSigner);
      setChainId(chainId);
      setIsConnected(true);
      setWalletType(detectedWalletType);
      setUserDisconnected(false);

      // Store connection in localStorage
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletType', detectedWalletType);
      localStorage.removeItem('userDisconnected');

      setupEventListeners();

      const walletName =
        detectedWalletType === 'coinbase'
          ? 'Coinbase Wallet'
          : detectedWalletType === 'boingExpress'
            ? 'Boing Express'
            : 'MetaMask';
      toast.success(`Fresh connection established with ${network.name} via ${walletName}`);
      toastIfNoEvmSigner(evmSigner, evmSignerUnavailableReason, { reconnectHint: true });
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
    const raw = getActiveRawEip1193();
    if (!isConnected || !raw) {
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

      const isBoingWallet =
        raw === getWindowBoingProvider() ||
        isBoingNamedProvider(raw) ||
        walletType === 'boingExpress';

      console.log('📡 Requesting network switch to:', targetNetwork.name);

      if (targetChainId === BOING_NATIVE_L1_CHAIN_ID && !isBoingWallet) {
        toast.error(
          'Boing testnet only works with Boing Express. Install from boing.express, connect here with Boing Express, then switch network.'
        );
        return false;
      }

      if (targetChainId === BOING_NATIVE_L1_CHAIN_ID && isBoingWallet) {
        const switched = await switchToBoingTestnetInWallet(raw);
        if (switched) {
          await new Promise(resolve => setTimeout(resolve, 600));
          const newId = await getChainIdFromBoingCompatibleProvider(raw);
          setChainId(newId);
          try {
            const { browserProvider: bp, signer: sig } = await createBrowserProviderAndSigner(raw, account);
            setProvider(bp);
            setSigner(sig);
          } catch (e) {
            console.warn('[WalletContext] Ethers refresh after boing_switchChain:', e);
          }
          toast.success(`Switched to ${targetNetwork.name}`);
          setupEventListeners();
          return true;
        }
      }

      await raw.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });

      console.log('✅ Network switch successful:', targetNetwork.name);
      
      // Wait for the network to actually change and stabilize
      console.log('⏳ Waiting for network to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify the network has actually changed
      const currentChainId = await getChainIdFromBoingCompatibleProvider(raw);
      if (currentChainId !== targetChainId) {
        console.log('⚠️ Network change not confirmed, waiting longer...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Manually update the chainId state since the chainChanged event might not fire reliably
      console.log('📊 Manually updating chainId state to:', targetChainId);
      setChainId(targetChainId);
      
      // Update provider and signer for the new network
      console.log('🔄 Updating provider and signer for new network...');
      const { browserProvider: bp, signer: sig } = await createBrowserProviderAndSigner(raw, account);
      setProvider(bp);
      setSigner(sig);
      console.log('✅ Provider and signer updated for new network');
      
      toast.success(`Switched to ${targetNetwork.name}`);
      setupEventListeners();
      return true;

    } catch (switchError) {
      console.log('⚠️ Network switch failed:', switchError);
      // If the network doesn't exist in the wallet, add it (mainnet-ready: uses rpcUrls array with fallbacks)
      if (switchError.code === 4902) {
        try {
          const addParams = getWalletAddChainParams(targetChainId);
          if (!addParams) {
            throw new Error('Network config not available');
          }
          const targetNetwork = getNetworkByChainId(targetChainId);
          console.log('📡 Adding network to wallet:', targetNetwork.name);
          await raw.request({
            method: 'wallet_addEthereumChain',
            params: [addParams],
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
          const { browserProvider: bp, signer: sig } = await createBrowserProviderAndSigner(raw, account);
          setProvider(bp);
          setSigner(sig);
          console.log('✅ Provider and signer updated for new network');
          
          toast.success(`Added and switched to ${targetNetwork.name}`);
          setupEventListeners();
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
      const net = chainId != null ? getNetworkByChainId(chainId) : null;
      const decimals = net?.nativeCurrency?.decimals ?? 18;
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error('Error getting balance:', error);
      // Don't show error toast for network change errors, just return null
      if (error.code === 'NETWORK_ERROR' || error.message.includes('network changed')) {
        console.log('⚠️ Network change detected, retrying balance fetch...');
        // Try one more time after a longer delay
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const balance = await provider.getBalance(account);
          const net = chainId != null ? getNetworkByChainId(chainId) : null;
          const decimals = net?.nativeCurrency?.decimals ?? 18;
          return ethers.formatUnits(balance, decimals);
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