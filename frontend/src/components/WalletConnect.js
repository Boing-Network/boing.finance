import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { ChevronDownIcon, WalletIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const WalletConnect = () => {
  const {
    account,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    forceFreshConnection,
    getCurrentNetwork,
    getAccountBalance,
    walletType
  } = useWallet();

  const [showDropdown, setShowDropdown] = useState(false);
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Get balance when account changes
  React.useEffect(() => {
    let isMounted = true;
    if (isConnected && account) {
      setBalanceLoading(true);
      getAccountBalance().then((bal) => {
        if (isMounted) {
          setBalance(bal);
          setBalanceLoading(false);
        }
      });
    } else {
      setBalance(null);
      setBalanceLoading(false);
    }
    return () => { isMounted = false; };
  }, [isConnected, account, getAccountBalance]);

  const handleConnect = async () => {
    // Check if user was previously disconnected
    const wasDisconnected = localStorage.getItem('userDisconnected') === 'true';
    
    if (wasDisconnected) {
      // Use force fresh connection to ensure approval dialog
      await forceFreshConnection();
    } else {
      // Use normal connection
      await connectWallet();
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setShowDropdown(false);
    
    // Show additional message about manual wallet disconnection and permission revocation
    setTimeout(() => {
      const walletName = walletType === 'coinbase' ? 'Coinbase Wallet' : walletType === 'metamask' ? 'MetaMask' : 'wallet';
      toast.success(`Disconnected from app. To switch wallets or ensure complete privacy, please also disconnect from ${walletName} settings and revoke permissions.`, {
        duration: 8000,
        icon: '🔗',
      });
    }, 1000);
  };

  const formatAddress = (address) => {
    if (!address || typeof address !== 'string') return '';
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
          className="bg-theme-secondary hover:bg-theme-tertiary text-theme-primary px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 border border-theme"
        >
          <WalletIcon className="w-4 h-4" />
          <span>{formatAddress(account)}</span>
          <ChevronDownIcon className="w-4 h-4" />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-theme-card rounded-lg shadow-lg border border-theme z-50">
            <div className="p-4">
              {/* Account Info */}
              <div className="mb-4">
                <div className="text-sm text-theme-tertiary mb-1">Connected Account</div>
                <div className="text-theme-primary font-mono text-sm break-all">{account || 'No account'}</div>
              </div>

              {/* Network Info */}
              {currentNetwork && (
                <div className="mb-4">
                  <div className="text-sm text-theme-tertiary mb-1">Network</div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-theme-primary text-sm">{currentNetwork.name}</span>
                  </div>
                </div>
              )}

              {/* Balance */}
              <div className="mb-4">
                <div className="text-sm text-theme-tertiary mb-1">Balance</div>
                <div className="text-theme-primary text-sm min-h-[1.5em] flex items-center">
                  {balanceLoading ? (
                    <span className="w-4 h-4 border-2 border-theme-primary border-t-transparent rounded-full animate-spin inline-block mr-2"></span>
                  ) : balance !== null ? (
                    <>{formatBalance(balance)} {currentNetwork?.nativeCurrency?.symbol || 'ETH'}</>
                  ) : (
                    '--'
                  )}
                </div>
              </div>

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