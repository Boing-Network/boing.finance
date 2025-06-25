import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getNetworkByChainId } from '../config/networks';
import toast from 'react-hot-toast';

const WalletContext = createContext();

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

  // Initialize wallet connection on mount
  useEffect(() => {
    const initWallet = async () => {
      await checkWalletConnection();
      setupEventListeners();
    };
    initWallet();
  }, []);

  const setupEventListeners = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    }
  };

  const checkWalletConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          await connectWallet(accounts[0], parseInt(chainId, 16));
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAccount(accounts[0]);
    }
  };

  const handleChainChanged = async (chainId) => {
    const newChainId = parseInt(chainId, 16);
    setChainId(newChainId);
    
    // Check if the new network is supported
    const network = getNetworkByChainId(newChainId);
    if (!network) {
      toast.error(`Network with chain ID ${newChainId} is not supported. Please switch to a supported network.`);
    } else {
      toast.success(`Switched to ${network.name}`);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  const connectWallet = async (accountAddress = null, networkChainId = null) => {
    setIsConnecting(true);
    
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const account = accountAddress || accounts[0];
      const chainId = networkChainId || parseInt(await window.ethereum.request({ method: 'eth_chainId' }), 16);

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Check if network is supported
      const network = getNetworkByChainId(chainId);
      if (!network) {
        toast.error(`Network with chain ID ${chainId} is not supported. Please switch to a supported network.`);
        setIsConnecting(false);
        return false;
      }

      // Update state
      setAccount(account);
      setProvider(provider);
      setSigner(signer);
      setChainId(chainId);
      setIsConnected(true);
      setWalletType('metamask');

      // Store connection in localStorage
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletType', 'metamask');

      toast.success(`Connected to ${network.name}`);
      return true;

    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setIsConnected(false);
    setWalletType(null);

    // Clear localStorage
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletType');

    toast.success('Wallet disconnected');
  };

  const switchNetwork = async (targetChainId) => {
    if (!isConnected || !window.ethereum) {
      toast.error('Please connect your wallet first');
      return false;
    }

    try {
      const targetNetwork = getNetworkByChainId(targetChainId);
      if (!targetNetwork) {
        throw new Error(`Network with chain ID ${targetChainId} is not supported`);
      }

      // Try to switch network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });

      toast.success(`Switched to ${targetNetwork.name}`);
      return true;

    } catch (switchError) {
      // If the network doesn't exist in the wallet, add it
      if (switchError.code === 4902) {
        try {
          const targetNetwork = getNetworkByChainId(targetChainId);
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
          toast.success(`Added and switched to ${targetNetwork.name}`);
          return true;
        } catch (addError) {
          toast.error('Failed to add network to wallet');
          return false;
        }
      } else {
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
      const balance = await provider.getBalance(account);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
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
    switchNetwork,
    getCurrentNetwork,
    getAccountBalance,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}; 