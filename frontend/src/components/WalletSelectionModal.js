import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { getSupportedNetworks } from '../config/networks';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const WalletSelectionModal = ({ isOpen, onClose, onWalletSelected }) => {
  const { detectWalletProviders, connectWalletWithProvider } = useWallet();
  const [availableWallets, setAvailableWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const providers = detectWalletProviders();
      const wallets = [];

      if (providers.metamask) {
        wallets.push({
          id: 'metamask',
          name: 'MetaMask',
          icon: '🦊',
          provider: providers.metamask,
          available: true
        });
      }

      if (providers.coinbase) {
        wallets.push({
          id: 'coinbase',
          name: 'Coinbase Wallet',
          icon: '🔷',
          provider: providers.coinbase,
          available: true
        });
      }

      // Check for other common wallets
      if (typeof window !== 'undefined' && window.ethereum) {
        if (!providers.metamask && !providers.coinbase) {
          wallets.push({
            id: 'other',
            name: 'Other Wallet',
            icon: '💼',
            provider: window.ethereum,
            available: true
          });
        }
      }

      if (wallets.length === 0) {
        wallets.push({
          id: 'none',
          name: 'No Wallet Detected',
          icon: '❌',
          provider: null,
          available: false,
          message: 'Please install MetaMask or Coinbase Wallet'
        });
      }

      setAvailableWallets(wallets);
    }
  }, [isOpen, detectWalletProviders]);

  const handleWalletSelect = (wallet) => {
    if (!wallet.available) {
      toast.error(wallet.message || 'This wallet is not available');
      return;
    }
    setSelectedWallet(wallet);
  };

  const handleConnect = async () => {
    if (!selectedWallet || !selectedWallet.available) {
      toast.error('Please select a wallet');
      return;
    }

    if (!selectedNetwork) {
      toast.error('Please select a network');
      return;
    }

    setIsConnecting(true);
    try {
      const success = await connectWalletWithProvider(
        selectedWallet.provider,
        selectedWallet.id,
        selectedNetwork.chainId
      );

      if (success) {
        toast.success(`Connected to ${selectedNetwork.name} via ${selectedWallet.name}`);
        if (onWalletSelected) {
          onWalletSelected(selectedWallet, selectedNetwork);
        }
        onClose();
      } else {
        toast.error('Failed to connect wallet');
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const supportedNetworks = getSupportedNetworks();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-theme-card rounded-lg shadow-xl max-w-md w-full mx-4 border border-theme">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-theme">
          <h2 className="text-xl font-bold text-theme-primary">Select Wallet & Network</h2>
          <button
            onClick={onClose}
            className="text-theme-tertiary hover:text-theme-primary transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Wallet Selection */}
          <div>
            <h3 className="text-sm font-semibold text-theme-secondary mb-3">Select Wallet</h3>
            <div className="space-y-2">
              {availableWallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => handleWalletSelect(wallet)}
                  disabled={!wallet.available}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedWallet?.id === wallet.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-theme hover:border-theme-primary'
                  } ${
                    !wallet.available
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{wallet.icon}</span>
                      <div>
                        <div className="font-medium text-theme-primary">{wallet.name}</div>
                        {!wallet.available && wallet.message && (
                          <div className="text-xs text-theme-tertiary mt-1">{wallet.message}</div>
                        )}
                      </div>
                    </div>
                    {selectedWallet?.id === wallet.id && (
                      <CheckIcon className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Network Selection */}
          {selectedWallet && selectedWallet.available && (
            <div>
              <h3 className="text-sm font-semibold text-theme-secondary mb-3">Select Network</h3>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {supportedNetworks.map((network) => (
                  <button
                    key={network.chainId}
                    onClick={() => setSelectedNetwork(network)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedNetwork?.chainId === network.chainId
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-theme hover:border-theme-primary'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-theme-primary text-sm">{network.name}</div>
                        <div className="text-xs text-theme-tertiary">{network.symbol}</div>
                      </div>
                      {selectedNetwork?.chainId === network.chainId && (
                        <CheckIcon className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Connect Button */}
          {selectedWallet && selectedWallet.available && selectedNetwork && (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <span>Connect to {selectedNetwork.name}</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletSelectionModal;

