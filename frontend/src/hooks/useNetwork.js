import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContext';

export function useNetwork() {
  const { account, provider } = useWallet();
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadNetwork = useCallback(async () => {
    try {
      setLoading(true);
      const network = await provider.getNetwork();
      setNetwork({
        chainId: network.chainId,
        name: getNetworkName(network.chainId),
        rpcUrl: getNetworkRPC(network.chainId),
        explorer: getNetworkExplorer(network.chainId),
        nativeCurrency: getNativeCurrency(network.chainId)
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
        { chainId: `0x${chainId.toString(16)}` }
      ]);
      await loadNetwork();
    } catch (error) {
      console.error('Failed to switch network:', error);
      // If the network doesn't exist, try to add it
      if (error.code === 4902) {
        await addNetwork(chainId);
      }
    }
  };

  const addNetwork = async (chainId) => {
    const networkConfig = getNetworkConfig(chainId);
    if (!networkConfig) return;

    try {
      await provider.send('wallet_addEthereumChain', [networkConfig]);
      await loadNetwork();
    } catch (error) {
      console.error('Failed to add network:', error);
    }
  };

  const getNetworkName = (chainId) => {
    switch (chainId) {
      case 1: return 'Ethereum';
      case 137: return 'Polygon';
      case 56: return 'BSC';
      case 42161: return 'Arbitrum';
      case 10: return 'Optimism';
      case 250: return 'Fantom';
      case 43114: return 'Avalanche';
      case 804: return 'PulseChain';
      case 369: return 'PulseChain Testnet';
      case 100: return 'Gnosis Chain';
      case 10200: return 'Gnosis Chiado';
      case 8453: return 'Base';
      case 59144: return 'Linea';
      case 1101: return 'Polygon zkEVM';
      case 324: return 'zkSync Era';
      case 534352: return 'Scroll';
      case 1284: return 'Moonbeam';
      case 1285: return 'Moonriver';
      case 11155111: return 'Sepolia';
      case 80001: return 'Mumbai';
      case 97: return 'BSC Testnet';
      case 11155420: return 'Optimism Sepolia';
      case 421614: return 'Arbitrum Sepolia';
      case 84532: return 'Base Sepolia';
      default: return 'Unknown Network';
    }
  };

  const getNetworkRPC = (chainId) => {
    switch (chainId) {
      case 1: return 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID';
      case 137: return 'https://polygon-rpc.com';
      case 56: return 'https://bsc-dataseed.binance.org';
      case 42161: return 'https://arb1.arbitrum.io/rpc';
      case 10: return 'https://mainnet.optimism.io';
      case 250: return 'https://rpc.ftm.tools';
      case 43114: return 'https://api.avax.network/ext/bc/C/rpc';
      case 804: return 'https://rpc.pulsechain.com';
      case 369: return 'https://rpc.v4.testnet.pulsechain.com';
      case 100: return 'https://rpc.gnosischain.com';
      case 10200: return 'https://rpc.chiadochain.net';
      case 8453: return 'https://mainnet.base.org';
      case 59144: return 'https://rpc.linea.build';
      case 1101: return 'https://zkevm-rpc.com';
      case 324: return 'https://mainnet.era.zksync.io';
      case 534352: return 'https://rpc.scroll.io';
      case 1284: return 'https://rpc.api.moonbeam.network';
      case 1285: return 'https://rpc.api.moonriver.moonbeam.network';
      case 11155111: return 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID';
      case 80001: return 'https://rpc-mumbai.maticvigil.com';
      case 97: return 'https://data-seed-prebsc-1-s1.binance.org:8545';
      case 11155420: return 'https://sepolia.optimism.io';
      case 421614: return 'https://sepolia-rollup.arbitrum.io/rpc';
      case 84532: return 'https://sepolia.base.org';
      default: return '';
    }
  };

  const getNetworkExplorer = (chainId) => {
    switch (chainId) {
      case 1: return 'https://etherscan.io';
      case 137: return 'https://polygonscan.com';
      case 56: return 'https://bscscan.com';
      case 42161: return 'https://arbiscan.io';
      case 10: return 'https://optimistic.etherscan.io';
      case 250: return 'https://ftmscan.com';
      case 43114: return 'https://snowtrace.io';
      case 804: return 'https://scan.pulsechain.com';
      case 369: return 'https://scan.v4.testnet.pulsechain.com';
      case 100: return 'https://gnosisscan.io';
      case 10200: return 'https://blockscout.chiadochain.net';
      case 8453: return 'https://basescan.org';
      case 59144: return 'https://lineascan.build';
      case 1101: return 'https://zkevm.polygonscan.com';
      case 324: return 'https://explorer.zksync.io';
      case 534352: return 'https://scrollscan.com';
      case 1284: return 'https://moonbeam.moonscan.io';
      case 1285: return 'https://moonriver.moonscan.io';
      case 11155111: return 'https://sepolia.etherscan.io';
      case 80001: return 'https://mumbai.polygonscan.com';
      case 97: return 'https://testnet.bscscan.com';
      case 11155420: return 'https://sepolia-optimism.etherscan.io';
      case 421614: return 'https://sepolia.arbiscan.io';
      case 84532: return 'https://sepolia.basescan.org';
      default: return '';
    }
  };

  const getNativeCurrency = (chainId) => {
    switch (chainId) {
      case 1: return { name: 'Ether', symbol: 'ETH', decimals: 18 };
      case 137: return { name: 'MATIC', symbol: 'MATIC', decimals: 18 };
      case 56: return { name: 'BNB', symbol: 'BNB', decimals: 18 };
      case 42161: return { name: 'Ether', symbol: 'ETH', decimals: 18 };
      case 10: return { name: 'Ether', symbol: 'ETH', decimals: 18 };
      case 250: return { name: 'Fantom', symbol: 'FTM', decimals: 18 };
      case 43114: return { name: 'Avalanche', symbol: 'AVAX', decimals: 18 };
      case 804: return { name: 'Pulse', symbol: 'PLS', decimals: 18 };
      case 369: return { name: 'Test Pulse', symbol: 'tPLS', decimals: 18 };
      case 100: return { name: 'xDAI', symbol: 'XDAI', decimals: 18 };
      case 10200: return { name: 'xDAI', symbol: 'XDAI', decimals: 18 };
      case 8453: return { name: 'Ether', symbol: 'ETH', decimals: 18 };
      case 59144: return { name: 'Ether', symbol: 'ETH', decimals: 18 };
      case 1101: return { name: 'Ether', symbol: 'ETH', decimals: 18 };
      case 324: return { name: 'Ether', symbol: 'ETH', decimals: 18 };
      case 534352: return { name: 'Ether', symbol: 'ETH', decimals: 18 };
      case 1284: return { name: 'Glimmer', symbol: 'GLMR', decimals: 18 };
      case 1285: return { name: 'Moonriver', symbol: 'MOVR', decimals: 18 };
      case 11155111: return { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 };
      case 80001: return { name: 'MATIC', symbol: 'MATIC', decimals: 18 };
      case 97: return { name: 'Test BNB', symbol: 'tBNB', decimals: 18 };
      case 11155420: return { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 };
      case 421614: return { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 };
      case 84532: return { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 };
      default: return { name: 'Unknown', symbol: 'UNKNOWN', decimals: 18 };
    }
  };

  const getNetworkConfig = (chainId) => {
    const nativeCurrency = getNativeCurrency(chainId);
    const rpcUrl = getNetworkRPC(chainId);
    const explorer = getNetworkExplorer(chainId);
    
    if (!rpcUrl) return null;

    return {
      chainId: `0x${chainId.toString(16)}`,
      chainName: getNetworkName(chainId),
      nativeCurrency,
      rpcUrls: [rpcUrl],
      blockExplorerUrls: [explorer]
    };
  };

  return {
    network,
    loading,
    switchNetwork,
    addNetwork
  };
} 