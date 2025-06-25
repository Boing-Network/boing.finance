import { useWallet } from '../contexts/WalletContext';
import { useCallback } from 'react';
import toast from 'react-hot-toast';

export const useWalletConnection = () => {
  const wallet = useWallet();

  const connectWithRetry = useCallback(async () => {
    try {
      const success = await wallet.connectWallet();
      if (!success) {
        toast.error('Failed to connect wallet. Please try again.');
      }
      return success;
    } catch (error) {
      console.error('Wallet connection error:', error);
      toast.error('Wallet connection failed. Please check your wallet and try again.');
      return false;
    }
  }, [wallet]);

  const switchNetworkWithRetry = useCallback(async (chainId) => {
    try {
      const success = await wallet.switchNetwork(chainId);
      if (!success) {
        toast.error('Failed to switch network. Please try again.');
      }
      return success;
    } catch (error) {
      console.error('Network switch error:', error);
      toast.error('Failed to switch network. Please try again.');
      return false;
    }
  }, [wallet]);

  const signMessage = useCallback(async (message) => {
    if (!wallet.isConnected || !wallet.signer) {
      toast.error('Please connect your wallet first');
      return null;
    }

    try {
      const signature = await wallet.signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Message signing error:', error);
      toast.error('Failed to sign message');
      return null;
    }
  }, [wallet]);

  const sendTransaction = useCallback(async (transaction) => {
    if (!wallet.isConnected || !wallet.signer) {
      toast.error('Please connect your wallet first');
      return null;
    }

    try {
      const tx = await wallet.signer.sendTransaction(transaction);
      toast.success('Transaction sent! Waiting for confirmation...');
      return tx;
    } catch (error) {
      console.error('Transaction error:', error);
      toast.error('Transaction failed. Please try again.');
      return null;
    }
  }, [wallet]);

  const waitForTransaction = useCallback(async (txHash) => {
    if (!wallet.provider) {
      toast.error('No provider available');
      return null;
    }

    try {
      const receipt = await wallet.provider.waitForTransaction(txHash);
      if (receipt.status === 1) {
        toast.success('Transaction confirmed!');
      } else {
        toast.error('Transaction failed');
      }
      return receipt;
    } catch (error) {
      console.error('Transaction confirmation error:', error);
      toast.error('Failed to confirm transaction');
      return null;
    }
  }, [wallet.provider]);

  return {
    ...wallet,
    connectWithRetry,
    switchNetworkWithRetry,
    signMessage,
    sendTransaction,
    waitForTransaction,
  };
}; 