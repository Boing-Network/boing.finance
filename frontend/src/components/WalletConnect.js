import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { ChevronDownIcon, WalletIcon, XMarkIcon } from '@heroicons/react/24/outline';

const WalletConnect = () => {
  const {
    account,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    getCurrentNetwork,
    getAccountBalance,
  } = useWallet();

  const [showDropdown, setShowDropdown] = useState(false);
  const [balance, setBalance] = useState(null);

  // Get balance when account changes
  React.useEffect(() => {
    if (isConnected && account) {
      getAccountBalance().then(setBalance);
    } else {
      setBalance(null);
    }
  }, [isConnected, account, getAccountBalance]);

  const handleConnect = async () => {
    await connectWallet();
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setShowDropdown(false);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance) => {
    if (!balance) return '0.00';
    const num = parseFloat(balance);
    if (num < 0.01) return '< 0.01';
    return num.toFixed(4);
  };

  const currentNetwork = getCurrentNetwork();

  if (isConnecting) {
    return (
      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span>Connecting...</span>
      </button>
    );
  }

  if (isConnected) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <WalletIcon className="w-4 h-4" />
          <span>{formatAddress(account)}</span>
          <ChevronDownIcon className="w-4 h-4" />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
            <div className="p-4">
              {/* Account Info */}
              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-1">Connected Account</div>
                <div className="text-white font-mono text-sm break-all">{account}</div>
              </div>

              {/* Network Info */}
              {currentNetwork && (
                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-1">Network</div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-white text-sm">{currentNetwork.name}</span>
                  </div>
                </div>
              )}

              {/* Balance */}
              {balance !== null && (
                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-1">Balance</div>
                  <div className="text-white text-sm">
                    {formatBalance(balance)} {currentNetwork?.nativeCurrency?.symbol || 'ETH'}
                  </div>
                </div>
              )}

              {/* Disconnect Button */}
              <button
                onClick={handleDisconnect}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <XMarkIcon className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        )}

        {/* Click outside to close dropdown */}
        {showDropdown && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
    >
      <WalletIcon className="w-4 h-4" />
      <span>Connect Wallet</span>
    </button>
  );
};

export default WalletConnect; 