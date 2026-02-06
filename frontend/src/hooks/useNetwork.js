import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { getNetworkByChainId, getWalletAddChainParams } from '../config/networks';

/**
 * Network state and actions derived from WalletContext and config/networks.
 * Adding a new chain: add it to config/networks.js NETWORKS; wallet_addEthereumChain
 * will use getWalletAddChainParams(chainId) from that single source.
 */
export function useNetwork() {
  const { account, provider } = useWallet();
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadNetwork = useCallback(async () => {
    try {
      setLoading(true);
      const net = await provider.getNetwork();
      const chainId = Number(net.chainId);
      const config = getNetworkByChainId(chainId);
      setNetwork(config ? {
        chainId,
        name: config.name,
        rpcUrl: config.rpcUrl,
        explorer: config.explorer,
        nativeCurrency: config.nativeCurrency
      } : {
        chainId,
        name: `Chain ${chainId}`,
        rpcUrl: '',
        explorer: '',
        nativeCurrency: { name: 'Unknown', symbol: 'UNKNOWN', decimals: 18 }
      });
    } catch (error) {
      console.error('Failed to load network:', error);
      setNetwork(null);
    } finally {
      setLoading(false);
    }
  }, [provider]);

  useEffect(() => {
    if (provider) {
      loadNetwork();
    } else {
      setNetwork(null);
      setLoading(false);
    }
  }, [provider, account, loadNetwork]);

  const switchNetwork = async (chainId) => {
    if (!provider) return;
    try {
      await provider.send('wallet_switchEthereumChain', [
        { chainId: `0x${Number(chainId).toString(16)}` }
      ]);
      await loadNetwork();
    } catch (error) {
      if (error?.code === 4902) {
        await addNetwork(chainId);
      } else {
        console.error('Failed to switch network:', error);
      }
    }
  };

  const addNetwork = async (chainId) => {
    const params = getWalletAddChainParams(chainId);
    if (!params || !provider) return;
    try {
      await provider.send('wallet_addEthereumChain', [params]);
      await loadNetwork();
    } catch (error) {
      console.error('Failed to add network:', error);
    }
  };

  return {
    network,
    loading,
    switchNetwork,
    addNetwork
  };
}
