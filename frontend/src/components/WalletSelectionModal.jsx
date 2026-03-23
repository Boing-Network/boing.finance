import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWallet } from '../contexts/WalletContext';
import { useChainType, useSolanaWallet, CHAIN_TYPE_SOLANA } from '../contexts/SolanaWalletContext';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const WalletSelectionModal = ({ isOpen, onClose, onWalletSelected }) => {
  const { detectWalletProviders, connectWalletWithProvider } = useWallet();
  const chainType = useChainType?.()?.chainType ?? 'evm';
  const isSolana = chainType === CHAIN_TYPE_SOLANA;
  const solanaWallet = useSolanaWallet?.() ?? null;
  const [availableWallets, setAvailableWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (isOpen && !isSolana) {
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
  }, [isOpen, isSolana, detectWalletProviders]);

  const handleWalletSelect = (wallet) => {
    if (!wallet.available) {
      toast.error(wallet.message || 'This wallet is not available');
      return;
    }
    setSelectedWallet(wallet);
  };

  const handleConnectEVM = async () => {
    if (!selectedWallet || !selectedWallet.available) {
      toast.error('Please select a wallet');
      return;
    }

    setIsConnecting(true);
    try {
      const success = await connectWalletWithProvider(
        selectedWallet.provider,
        selectedWallet.id,
        null
      );

      if (success) {
        toast.success(`Connected via ${selectedWallet.name}`);
        if (onWalletSelected) {
          onWalletSelected(selectedWallet);
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

  const handleConnectSolana = async () => {
    if (!solanaWallet?.connectWallet) {
      toast.error('Solana wallet not available. Install Phantom or Solflare.');
      return;
    }
    setIsConnecting(true);
    try {
      await solanaWallet.connectWallet();
      toast.success('Solana wallet connected!');
      if (onWalletSelected) onWalletSelected({ id: 'solana' });
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to connect Solana wallet.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle click outside modal to close
  const handleOverlayClick = (e) => {
    // Only close if clicking the overlay itself, not the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Use portal to render modal at document body level
  // This ensures it's above all other content and not affected by parent z-index
  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleOverlayClick}
      style={{ 
        zIndex: 99999, 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        overflow: 'auto'
      }}
    >
      <div 
        className="bg-theme-card rounded-lg shadow-xl max-w-md w-full border border-theme flex flex-col max-h-[90vh]"
        onClick={(e) => {
          e.stopPropagation();
        }}
        style={{ 
          zIndex: 100000,
          position: 'relative',
          margin: 'auto'
        }}
      >
        {/* Header - Fixed at top */}
        <div className="flex items-center justify-between p-6 border-b border-theme flex-shrink-0 bg-theme-card rounded-t-lg">
          <h2 className="text-xl font-bold text-theme-primary">{isSolana ? 'Connect Solana' : 'Select Wallet'}</h2>
          <button
            onClick={onClose}
            className="text-theme-tertiary hover:text-theme-primary transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <div className="space-y-6">
            {isSolana ? (
              /* Solana: network toggle + connect */
              <>
                <div>
                  <h3 className="text-sm font-semibold text-theme-secondary mb-3">Solana network</h3>
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-black/10 border border-theme w-fit">
                    {['devnet', 'mainnet'].map((net) => (
                      <button
                        key={net}
                        onClick={() => solanaWallet?.setSolanaNetwork?.(net)}
                        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                          solanaWallet?.network === net ? 'bg-[var(--secondary-bg)] text-primary' : 'hover:bg-white/5 text-theme-secondary'
                        }`}
                        style={{ color: solanaWallet?.network === net ? 'var(--primary-color)' : undefined }}
                      >
                        {net === 'mainnet' ? 'Mainnet' : 'Devnet'}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-theme-tertiary mt-2">Switch network before connecting. Use Phantom or Solflare.</p>
                </div>
              </>
            ) : (
              /* EVM: wallet list */
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
            )}
          </div>
        </div>

        {/* Connect Button - Fixed at bottom */}
        <div className="p-6 border-t border-theme flex-shrink-0">
          {isSolana ? (
            <button
              onClick={handleConnectSolana}
              disabled={isConnecting}
              className="w-full btn-primary disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <span>Connect Solana Wallet</span>
              )}
            </button>
          ) : selectedWallet && selectedWallet.available ? (
            <button
              onClick={handleConnectEVM}
              disabled={isConnecting}
              className="w-full btn-primary disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <span>Connect with {selectedWallet.name}</span>
              )}
            </button>
          ) : (
            <div className="h-[48px] flex items-center justify-center">
              <span className="text-sm text-theme-tertiary">{isSolana ? 'Choose network above, then connect' : 'Select a wallet to connect'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render modal using portal at document body level
  return createPortal(modalContent, document.body);
};

export default WalletSelectionModal;

