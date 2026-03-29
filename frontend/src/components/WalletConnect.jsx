import React, { useState, useRef } from 'react';
import { useCloseOnPointerOutside } from '../hooks/useCloseOnPointerOutside';
import { useWallet } from '../contexts/WalletContext';
import { useSolanaWallet, useChainType, CHAIN_TYPE_SOLANA } from '../contexts/SolanaWalletContext';
import { ChevronDownIcon, WalletIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import WalletSelectionModal from './WalletSelectionModal';

const WalletConnect = () => {
  const chainType = useChainType?.()?.chainType ?? 'evm';
  const isSolana = chainType === CHAIN_TYPE_SOLANA;

  const evmWallet = useWallet();
  const solanaWallet = useSolanaWallet?.() ?? null;

  const [showDropdown, setShowDropdown] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const walletDropdownRootRef = useRef(null);
  const [evmBalance, setEvmBalance] = useState(null);
  const [evmBalanceLoading, setEvmBalanceLoading] = useState(false);

  const account = isSolana ? (solanaWallet?.address ?? null) : evmWallet.account;
  const isConnected = isSolana ? (solanaWallet?.connected ?? false) : evmWallet.isConnected;
  const isConnecting = isSolana ? (solanaWallet?.connecting ?? false) : evmWallet.isConnecting;
  const displayBalance = isSolana ? (solanaWallet?.balance ?? null) : evmBalance;
  const balanceLoading = isSolana ? false : evmBalanceLoading;

  // EVM balance when EVM chain
  React.useEffect(() => {
    if (isSolana) return;
    let isMounted = true;
    if (evmWallet.isConnected && evmWallet.account) {
      setEvmBalanceLoading(true);
      evmWallet.getAccountBalance?.().then((bal) => {
        if (isMounted) {
          setEvmBalance(bal);
          setEvmBalanceLoading(false);
        }
      });
    } else {
      setEvmBalance(null);
      setEvmBalanceLoading(false);
    }
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- evmWallet object identity changes; we depend on its properties
  }, [isSolana, evmWallet.isConnected, evmWallet.account, evmWallet.getAccountBalance]);

  const handleConnect = async () => {
    // Both EVM and Solana open the same modal (modal shows network toggle for Solana, wallet list for EVM)
    setShowWalletModal(true);
  };

  const handleDisconnect = () => {
    if (isSolana && solanaWallet) {
      solanaWallet.disconnectWallet();
      setShowDropdown(false);
      toast.success('Solana wallet disconnected.');
      return;
    }
    evmWallet.disconnectWallet();
    setShowDropdown(false);
    const walletName = evmWallet.walletType === 'coinbase' ? 'Coinbase Wallet' : evmWallet.walletType === 'metamask' ? 'MetaMask' : 'wallet';
    setTimeout(() => {
      toast.success(`Disconnected. To fully revoke, also disconnect from ${walletName} settings.`, {
        duration: 6000,
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

  const currentNetwork = isSolana ? { name: 'Solana', nativeCurrency: { symbol: 'SOL' } } : evmWallet.getCurrentNetwork?.();

  useCloseOnPointerOutside(
    showDropdown,
    (node) => Boolean(walletDropdownRootRef.current?.contains(node)),
    () => setShowDropdown(false)
  );

  if (isConnecting) {
    return (
      <button type="button" className="btn-wallet-connect px-4 py-2 rounded-lg flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-[var(--bg-primary)] border-t-transparent rounded-full animate-spin" />
        <span>Connecting...</span>
      </button>
    );
  }

  if (isConnected) {
    return (
      <div ref={walletDropdownRootRef} className="relative">
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="bg-theme-secondary hover:bg-theme-tertiary text-theme-primary px-2.5 py-2 min-[1150px]:max-xl:px-2 xl:px-4 rounded-lg text-xs min-[1150px]:max-xl:text-xs xl:text-sm font-medium transition-colors flex items-center gap-1.5 xl:gap-2 border border-theme max-w-[min(100%,11rem)] min-[1150px]:max-xl:max-w-[9rem] xl:max-w-[13rem] 2xl:max-w-none min-w-0"
          title={account || undefined}
        >
          <WalletIcon className="w-4 h-4 shrink-0" />
          <span className="truncate min-w-0">{formatAddress(account)}</span>
          <ChevronDownIcon className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
        </button>

        {showDropdown && (
          <div className="dropdown-menu-glass-solid absolute right-0 mt-2 w-64 rounded-lg z-[120]">
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
                  {isSolana && solanaWallet?.setSolanaNetwork ? (
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-black/10 border border-theme w-fit">
                      {['devnet', 'mainnet'].map((net) => (
                        <button
                          key={net}
                          onClick={() => solanaWallet.setSolanaNetwork(net)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            solanaWallet?.network === net ? 'bg-[var(--secondary-bg)] text-primary' : 'hover:bg-white/5'
                          }`}
                          style={{ color: solanaWallet?.network === net ? 'var(--primary-color)' : 'var(--text-secondary)' }}
                        >
                          {net === 'mainnet' ? 'Mainnet' : 'Devnet'}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-theme-primary text-sm">{currentNetwork.name}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Balance */}
              <div className="mb-4">
                <div className="text-sm text-theme-tertiary mb-1">Balance</div>
                <div className="text-theme-primary text-sm min-h-[1.5em] flex items-center">
                  {balanceLoading ? (
                    <span className="w-4 h-4 border-2 border-theme-primary border-t-transparent rounded-full animate-spin inline-block mr-2"></span>
                  ) : displayBalance !== null ? (
                    <>{formatBalance(displayBalance)} {currentNetwork?.nativeCurrency?.symbol || 'ETH'}</>
                  ) : (
                    '--'
                  )}
                </div>
              </div>

              {/* Switch Wallet / Network - opens modal (EVM: wallet list; Solana: network toggle + reconnect) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(false);
                  setTimeout(() => setShowWalletModal(true), 100);
                }}
                className="w-full btn-dropdown-action px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 mb-2"
              >
                <ArrowPathIcon className="w-4 h-4 shrink-0 opacity-90" />
                <span>{isSolana ? 'Network / Wallet' : 'Switch Wallet'}</span>
              </button>

              {/* Disconnect Button */}
              <button
                type="button"
                onClick={handleDisconnect}
                className="w-full btn-dropdown-danger px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2"
              >
                <XMarkIcon className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleConnect}
        className="btn-wallet-connect px-4 py-2 rounded-lg flex items-center space-x-2"
      >
        <WalletIcon className="w-4 h-4" />
        <span>Connect Wallet</span>
      </button>
      
      <WalletSelectionModal
        isOpen={showWalletModal}
        onClose={() => {
          setShowWalletModal(false);
        }}
        onWalletSelected={() => setShowWalletModal(false)}
      />
    </>
  );
};

export default WalletConnect; 