/**
 * Solana Wallet Context
 * Provides Solana wallet state and methods (Phantom, Solflare, etc.)
 * Separate from EVM WalletContext - use ChainTypeSelector to switch between EVM and Solana
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Connection } from '@solana/web3.js';

const SolanaWalletContext = createContext();

export { SolanaWalletContext };

export const useSolanaWallet = () => {
  const context = useContext(SolanaWalletContext);
  if (!context) {
    throw new Error('useSolanaWallet must be used within SolanaWalletProvider');
  }
  return context;
};

// Chain type constants
export const CHAIN_TYPE_EVM = 'evm';
export const CHAIN_TYPE_SOLANA = 'solana';

export const ChainTypeContext = createContext();

export const useChainType = () => {
  const context = useContext(ChainTypeContext);
  if (!context) {
    return { chainType: CHAIN_TYPE_EVM, setChainType: () => {} };
  }
  return context;
};

export const SolanaWalletProvider = ({ children }) => {
  const [publicKey, setPublicKey] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [balance, setBalance] = useState(null);
  const [connection, setConnection] = useState(null);
  const [chainType, setChainTypeState] = useState(() => {
    try {
      return localStorage.getItem('boing_chain_type') || CHAIN_TYPE_EVM;
    } catch {
      return CHAIN_TYPE_EVM;
    }
  });

  const [solanaNetwork, setSolanaNetworkState] = useState(() => {
    try {
      return localStorage.getItem('boing_solana_network') || (process.env.REACT_APP_SOLANA_NETWORK === 'mainnet' ? 'mainnet' : 'devnet');
    } catch {
      return 'devnet';
    }
  });

  const network = solanaNetwork;
  const setSolanaNetwork = useCallback((net) => {
    setSolanaNetworkState(net);
    try {
      localStorage.setItem('boing_solana_network', net);
    } catch (e) {
      // ignore
    }
  }, []);

  const rpcUrl = network === 'mainnet'
    ? (process.env.REACT_APP_SOLANA_MAINNET_RPC || 'https://api.mainnet-beta.solana.com')
    : (process.env.REACT_APP_SOLANA_DEVNET_RPC || 'https://api.devnet.solana.com');

  useEffect(() => {
    setConnection(new Connection(rpcUrl));
  }, [rpcUrl]);

  const setChainType = useCallback((type) => {
    setChainTypeState(type);
    try {
      localStorage.setItem('boing_chain_type', type);
    } catch (e) {
      // ignore
    }
  }, []);

  // Fetch SOL balance
  const refreshBalance = useCallback(async () => {
    if (!publicKey || !connection) return null;
    try {
      const bal = await connection.getBalance(publicKey);
      setBalance(bal / 1e9); // Convert lamports to SOL
      return bal / 1e9;
    } catch (err) {
      console.error('Solana balance fetch error:', err);
      return null;
    }
  }, [publicKey, connection]);

  useEffect(() => {
    if (connected && publicKey) {
      refreshBalance();
    } else {
      setBalance(null);
    }
  }, [connected, publicKey, refreshBalance]);

  // Connect via injected wallet (Phantom, Solflare, etc.)
  const connectWallet = useCallback(async () => {
    if (typeof window === 'undefined' || !window.solana) {
      throw new Error('No Solana wallet found. Please install Phantom or Solflare.');
    }
    setConnecting(true);
    try {
      const resp = await window.solana.connect();
      const pk = resp.publicKey;
      setPublicKey(pk);
      setConnected(true);
      return pk;
    } catch (err) {
      console.error('Solana connect error:', err);
      throw err;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    if (window.solana?.disconnect) {
      window.solana.disconnect();
    }
    setPublicKey(null);
    setConnected(false);
    setBalance(null);
  }, []);

  // Listen for account/network changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.solana) return;
    const handleAccountChange = (newPk) => {
      if (newPk) {
        setPublicKey(newPk);
      } else {
        disconnectWallet();
      }
    };
    window.solana.on?.('accountChanged', handleAccountChange);
    return () => {
      window.solana.off?.('accountChanged', handleAccountChange);
    };
  }, [disconnectWallet]);

  const signTransaction = useCallback(async (transaction) => {
    if (!window.solana?.signTransaction) throw new Error('Wallet does not support signing');
    return window.solana.signTransaction(transaction);
  }, []);

  const value = {
    publicKey,
    address: publicKey?.toBase58?.() ?? null,
    connected,
    connecting,
    balance,
    connection,
    network,
    setSolanaNetwork,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    signTransaction,
  };

  const chainTypeValue = {
    chainType,
    setChainType,
    isSolana: chainType === CHAIN_TYPE_SOLANA,
    isEVM: chainType === CHAIN_TYPE_EVM,
  };

  return (
    <ChainTypeContext.Provider value={chainTypeValue}>
      <SolanaWalletContext.Provider value={value}>
        {children}
      </SolanaWalletContext.Provider>
    </ChainTypeContext.Provider>
  );
};
