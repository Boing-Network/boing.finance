import React, { useState, useRef } from 'react';
import { useCloseOnPointerOutside } from '../hooks/useCloseOnPointerOutside';
import { useWallet } from '../contexts/WalletContext';
import { getMainnetNetworks, getTestnetNetworks } from '../config/networks';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const NetworkSelector = () => {
  const { isConnected, chainId, switchNetwork, getCurrentNetwork } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const networkDropdownRootRef = useRef(null);

  const currentNetwork = getCurrentNetwork();
  const mainnetNetworks = getMainnetNetworks();
  const testnetNetworks = getTestnetNetworks();

  useCloseOnPointerOutside(
    showDropdown,
    (node) => Boolean(networkDropdownRootRef.current?.contains(node)),
    () => setShowDropdown(false)
  );

  const handleNetworkSwitch = async (networkChainId) => {
    if (!isConnected) {
      return;
    }

    const success = await switchNetwork(networkChainId);
    if (success) {
      setShowDropdown(false);
    }
  };

  const getNetworkIcon = (network) => {
    if (!network || !network.chainId) return '🌐';
    const icons = {
      1: '🔵', // Ethereum
      137: '🟣', // Polygon
      56: '🟡', // BSC
      42161: '🔵', // Arbitrum
      10: '🔴', // Optimism
      8453: '🔵', // Base
      43114: '❄️', // Avalanche
      250: '💜', // Fantom
      59144: '🔷', // Linea
      324: '🟦', // zkSync Era
      534352: '📜', // Scroll
      1101: '🟣', // Polygon zkEVM
      5000: '🟤', // Mantle
      81457: '💛', // Blast
      204: '🟡', // opBNB
      34443: '🟣', // Mode
      6913: '🌀', // Boing Testnet
      11155111: '🧪', // Sepolia
      80001: '🧪', // Mumbai
      97: '🧪', // BSC Testnet
    };
    return icons[network.chainId] || '🌐';
  };

  if (!isConnected || !currentNetwork) {
    return null;
  }

  return (
    <div ref={networkDropdownRootRef} className="relative">
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="bg-theme-secondary hover:bg-theme-tertiary text-theme-primary px-3 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 border border-theme"
      >
        <span className="text-lg">{getNetworkIcon(currentNetwork)}</span>
        <span className="text-sm">{currentNetwork?.name || 'Unknown Network'}</span>
        <ChevronDownIcon className="w-3 h-3" />
      </button>

      {showDropdown && (
        <div className="dropdown-menu-glass-solid absolute left-0 mt-2 w-72 rounded-lg z-[120] max-h-96 overflow-y-auto">
          <div className="p-2">
            {/* Mainnet Networks */}
            {mainnetNetworks.length > 0 && (
              <>
                <div className="text-xs text-theme-tertiary px-3 py-2 border-b border-theme font-medium">
                  Mainnet Networks
                </div>
                {mainnetNetworks.map((network) => (
                  <button
                    type="button"
                    key={network.chainId}
                    onClick={() => handleNetworkSwitch(network.chainId)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-3 border ${
                      chainId === network.chainId
                        ? 'dropdown-network-row-selected'
                        : 'border-transparent text-theme-secondary hover:text-theme-primary hover:bg-theme-secondary'
                    }`}
                  >
                    <span className="text-lg">{getNetworkIcon(network)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{network.name}</div>
                      <div className="text-xs text-theme-tertiary">
                        {network.nativeCurrency.symbol}
                      </div>
                    </div>
                    {chainId === network.chainId && (
                      <div className="w-2 h-2 rounded-full shrink-0 dropdown-network-row-dot" aria-hidden />
                    )}
                  </button>
                ))}
              </>
            )}

            {/* Testnet Networks */}
            {testnetNetworks.length > 0 && (
              <>
                <div className="text-xs text-theme-tertiary px-3 py-2 border-b border-theme font-medium mt-2">
                  Testnet Networks
                </div>
                {testnetNetworks.map((network) => (
                  <button
                    type="button"
                    key={network.chainId}
                    onClick={() => handleNetworkSwitch(network.chainId)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-3 border ${
                      chainId === network.chainId
                        ? 'dropdown-network-row-selected'
                        : 'border-transparent text-theme-secondary hover:text-theme-primary hover:bg-theme-secondary'
                    }`}
                  >
                    <span className="text-lg">{getNetworkIcon(network)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{network.name}</div>
                      <div className="text-xs text-theme-tertiary">
                        {network.nativeCurrency.symbol} {network.features?.includes('dexDeployed') && '• DEX Deployed'}
                      </div>
                    </div>
                    {chainId === network.chainId && (
                      <div className="w-2 h-2 rounded-full shrink-0 dropdown-network-row-dot" aria-hidden />
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkSelector; 