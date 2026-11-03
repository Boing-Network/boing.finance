/**
 * Solana Wallet Context
 * Provides Solana wallet state and methods (Phantom, Solflare, etc.)
 * Separate from the EVM/Boing WalletContext. Mounted only by the /bridge page (lazy chunk).
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getSolanaRpcEndpoints, solanaConnectionConfig } from '../config/solanaConfig';

const SolanaWalletContext = createContext();

export { SolanaWalletContext };

const DEFAULT_SOLANA_WALLET_VALUE = {
  publicKey: null,
  address: null,
  connected: false,
  connecting: false,
  balance: null,
  connection: null,
  network: 'devnet',
  setSolanaNetwork: () => {},
  connectWallet: async () => { console.warn('Solana wallet not available - ensure SolanaWalletProvider wraps your app'); },
  disconnectWallet: () => {},
  refreshBalance: async () => null,
  signTransaction: async () => { throw new Error('Solana wallet not connected'); },
};

export const useSolanaWallet = () => {
  const context = useContext(SolanaWalletContext);
  if (!context) {
    return DEFAULT_SOLANA_WALLET_VALUE;
  }
  return context;
};

export const SolanaWalletProvider = ({ children }) => {
  const [publicKey, setPublicKey] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [balance, setBalance] = useState(null);
  const [connection, setConnection] = useState(null);
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { Connection } = await import('@solana/web3.js');
      const endpoints = getSolanaRpcEndpoints(network);
      for (const url of endpoints) {
        try {
          const conn = new Connection(url, solanaConnectionConfig());
          await conn.getLatestBlockhash('confirmed');
          if (!cancelled) setConnection(conn);
          return;
        } catch {
          // try the next RPC (Worker proxy, then optional dedicated Helius/env URL)
        }
      }
      if (!cancelled) {
        setConnection(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [network]);

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

  return (
    <SolanaWalletContext.Provider value={value}>
      {children}
    </SolanaWalletContext.Provider>
  );
};
