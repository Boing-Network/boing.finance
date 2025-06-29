import React from 'react';
import { useWallet } from '../contexts/WalletContext';

const WalletDebug = () => {
  const {
    account,
    isConnected,
    isConnecting,
    userDisconnected,
    chainId,
    walletType,
    debugWalletState,
    connectWallet,
    disconnectWallet
  } = useWallet();

  const handleDebug = () => {
    debugWalletState();
  };

  const handleForceConnect = async () => {
    console.log('Force connect triggered');
    await connectWallet(null, null, true);
  };

  const handleDisconnect = () => {
    console.log('Manual disconnect triggered');
    disconnectWallet();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700 z-50 max-w-sm">
      <h3 className="text-white font-bold mb-2">Wallet Debug</h3>
      
      <div className="text-xs text-gray-300 mb-3 space-y-1">
        <div>Account: {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'None'}</div>
        <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
        <div>Connecting: {isConnecting ? 'Yes' : 'No'}</div>
        <div>User Disconnected: {userDisconnected ? 'Yes' : 'No'}</div>
        <div>Chain ID: {chainId || 'None'}</div>
        <div>Wallet Type: {walletType || 'None'}</div>
      </div>

      <div className="space-y-2">
        <button
          onClick={handleDebug}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
        >
          Debug Console
        </button>
        
        <button
          onClick={handleForceConnect}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs"
        >
          Force Connect
        </button>
        
        <button
          onClick={handleDisconnect}
          className="w-full bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
        >
          Disconnect & Revoke
        </button>
      </div>
    </div>
  );
};

export default WalletDebug; 