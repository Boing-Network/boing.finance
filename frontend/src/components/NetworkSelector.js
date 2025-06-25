import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { getMainnetNetworks } from '../config/networks';
import { ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const NetworkSelector = () => {
  const { isConnected, chainId, switchNetwork, getCurrentNetwork } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);

  const currentNetwork = getCurrentNetwork();
  const supportedNetworks = getMainnetNetworks();

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
    // You can add network-specific icons here
    const icons = {
      1: '🔵', // Ethereum
      137: '🟣', // Polygon
      56: '🟡', // BSC
      250: '🔵', // Fantom
      43114: '🔴', // Avalanche
      42161: '🔵', // Arbitrum
      10: '🔴', // Optimism
      8453: '🔵', // Base
      59144: '🟣', // Linea
      1101: '🟣', // Polygon zkEVM
      324: '🔵', // zkSync
      534352: '🟢', // Scroll
      1284: '🌙', // Moonbeam
      1285: '🌙', // Moonriver
    };
    return icons[network.chainId] || '🌐';
  };

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-2 text-gray-400">
        <GlobeAltIcon className="w-4 h-4" />
        <span className="text-sm">Connect wallet to switch networks</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
      >
        <span className="text-lg">{getNetworkIcon(currentNetwork)}</span>
        <span className="text-sm">{currentNetwork?.name || 'Unknown Network'}</span>
        <ChevronDownIcon className="w-3 h-3" />
      </button>

      {showDropdown && (
        <div className="absolute left-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-400 px-3 py-2 border-b border-gray-700">
              Select Network
            </div>
            
            {supportedNetworks.map((network) => (
              <button
                key={network.chainId}
                onClick={() => handleNetworkSwitch(network.chainId)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-3 ${
                  chainId === network.chainId
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <span className="text-lg">{getNetworkIcon(network)}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{network.name}</div>
                  <div className="text-xs text-gray-400">
                    {network.nativeCurrency.symbol}
                  </div>
                </div>
                {chainId === network.chainId && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </button>
            ))}
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
};

export default NetworkSelector; 