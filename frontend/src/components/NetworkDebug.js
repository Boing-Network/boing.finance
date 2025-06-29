import React from 'react';
import { NETWORKS, getNetworkByChainId, validateNetworkConfiguration, checkNetworkConfigurationIssues } from '../config/networks';

const NetworkDebug = () => {
  const validation = validateNetworkConfiguration();
  const configIssues = checkNetworkConfigurationIssues();
  
  const testChainIds = [100, 256, 804, 137, 56, 10]; // Test specific chain IDs
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg text-white text-sm">
      <h3 className="text-lg font-bold mb-4">Network Configuration Debug</h3>
      
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Configuration Status:</h4>
        <div>✅ Valid: {validation.isValid ? 'Yes' : 'No'}</div>
        <div>📊 Total Networks: {validation.totalNetworks}</div>
        <div>🌐 Mainnet Networks: {validation.mainnetNetworks}</div>
        <div>🧪 Testnet Networks: {validation.testnetNetworks}</div>
      </div>
      
      {validation.issues.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2 text-red-400">Validation Issues:</h4>
          <ul className="list-disc list-inside text-red-300">
            {validation.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
      
      {configIssues.hasIssues && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2 text-red-400">Configuration Issues:</h4>
          <ul className="list-disc list-inside text-red-300">
            {configIssues.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Chain ID Tests:</h4>
        {testChainIds.map(chainId => {
          const network = getNetworkByChainId(chainId);
          return (
            <div key={chainId} className="mb-1">
              <span className={network ? 'text-green-400' : 'text-red-400'}>
                {network ? '✅' : '❌'} Chain {chainId}: {network ? network.name : 'Not Found'}
              </span>
            </div>
          );
        })}
      </div>
      
      <div className="mb-4">
        <h4 className="font-semibold mb-2">All Supported Chain IDs:</h4>
        <div className="text-xs text-gray-300">
          {configIssues.uniqueChainIds.join(', ')}
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold mb-2">Gnosis Chain Details:</h4>
        <div>Chain ID 100: {getNetworkByChainId(100) ? '✅ Found' : '❌ Not Found'}</div>
        {getNetworkByChainId(100) && (
          <div className="text-xs text-gray-300 ml-4">
            Name: {getNetworkByChainId(100).name}<br/>
            Symbol: {getNetworkByChainId(100).symbol}<br/>
            RPC: {getNetworkByChainId(100).rpcUrl}<br/>
            Explorer: {getNetworkByChainId(100).explorer}
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <h4 className="font-semibold mb-2">Troubleshooting:</h4>
        <div className="text-xs text-gray-300">
          <div>• Chain ID 256 is Huobi ECO Chain (HECO) - not in our config</div>
          <div>• Chain ID 100 should be Gnosis Chain - check if it's found above</div>
          <div>• If issues persist, try clearing browser cache and refreshing</div>
        </div>
      </div>
    </div>
  );
};

export default NetworkDebug; 