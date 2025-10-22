import React, { useState } from 'react';
import { getContractAddresses, isNetworkSupported, CONTRACTS } from '../../config/contracts';
import { getNetworkByChainId } from '../../config/networks';

const SmartContractsSection = () => {
  const [selectedNetwork, setSelectedNetwork] = useState('11155111'); // Default to Sepolia

  // Get all supported networks - use CONTRACTS directly to avoid null issues
  const supportedNetworks = Object.keys(CONTRACTS).map(chainId => ({
    chainId: parseInt(chainId),
    network: getNetworkByChainId(parseInt(chainId))
  })).filter(network => network.network && isNetworkSupported(network.chainId));

  const contracts = getContractAddresses(selectedNetwork);
  const currentNetwork = getNetworkByChainId(parseInt(selectedNetwork));

  const getNetworkIcon = (chainId) => {
    const icons = {
      1: '🔵', // Ethereum
      137: '🟣', // Polygon
      56: '🟡', // BSC
      804: '💜', // PulseChain
      100: '🟢', // Gnosis Chain
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
      11155111: '🧪', // Sepolia
      80001: '🧪', // Mumbai
      97: '🧪', // BSC Testnet
      11155420: '🧪', // Optimism Sepolia
      421614: '🧪', // Arbitrum Sepolia
      84532: '🧪', // Base Sepolia
      369: '💜', // PulseChain Testnet
      10200: '🟢', // Gnosis Chiado
    };
    return icons[chainId] || '🌐';
  };

  const getContractTypeIcon = (contractName) => {
    const icons = {
      dexFactory: '🏭',
      dexRouter: '🔄',
      crossChainBridge: '🌉',
      priceOracle: '📊',
      weth: '🔵',
      mockUSDC: '💵',
      mockETH: '⚡',
      mockDAI: '💎',
    };
    return icons[contractName] || '📄';
  };

  const getContractDescription = (contractName) => {
    const descriptions = {
      dexFactory: 'Manages trading pair creation and deployment',
      dexRouter: 'Handles swap routing and calculations',
      crossChainBridge: 'Enables cross-chain token transfers',
      priceOracle: 'Provides price feeds for tokens',
      weth: 'Wrapped Ether implementation',
      mockUSDC: 'Mock USDC token for testing',
      mockETH: 'Mock ETH token for testing',
      mockDAI: 'Mock DAI token for testing',
    };
    return descriptions[contractName] || 'Smart contract';
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">Smart Contracts</h2>
        <p className="style={{ color: 'var(--text-secondary)' }} text-lg">
          Complete overview of all deployed smart contracts across supported networks. 
          All contracts are verified on their respective block explorers.
        </p>
      </div>

      {/* Network Selector */}
      <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
        <h3 className="text-xl font-semibold style={{ color: 'var(--text-primary)' }} mb-4">Select Network</h3>
        <div className="flex flex-wrap gap-3">
          {supportedNetworks.map(({ chainId, network }) => (
            <button
              key={chainId}
              onClick={() => setSelectedNetwork(chainId.toString())}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                selectedNetwork === chainId.toString()
                  ? 'bg-blue-600 style={{ color: 'var(--text-primary)' }}'
                  : 'bg-gray-700 style={{ color: 'var(--text-secondary)' }} hover:style={{ color: 'var(--text-primary)' }} hover:bg-gray-600'
              }`}
            >
              <span className="text-lg">{getNetworkIcon(chainId)}</span>
              <span>{network.name}</span>
              {network.isTestnet && (
                <span className="text-xs bg-yellow-600 style={{ color: 'var(--text-primary)' }} px-2 py-1 rounded">
                  TESTNET
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Network Info */}
      {currentNetwork && (
        <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">{getNetworkIcon(currentNetwork.chainId)}</span>
            <div>
              <h3 className="text-xl font-semibold style={{ color: 'var(--text-primary)' }}">{currentNetwork.name}</h3>
              <p className="text-gray-400">Chain ID: {currentNetwork.chainId}</p>
            </div>
            {currentNetwork.isTestnet && (
              <span className="bg-yellow-600 style={{ color: 'var(--text-primary)' }} px-3 py-1 rounded-full text-sm font-medium">
                Testnet
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm style={{ color: 'var(--text-secondary)' }}">
            <div>
              <span className="font-medium">Explorer:</span>
              <a 
                href={currentNetwork.explorer} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 ml-2 underline"
              >
                {currentNetwork.explorer.replace('https://', '')}
              </a>
            </div>
            <div>
              <span className="font-medium">Native Currency:</span>
              <span className="ml-2">{currentNetwork.nativeCurrency.name} ({currentNetwork.nativeCurrency.symbol})</span>
            </div>
            <div>
              <span className="font-medium">Block Time:</span>
              <span className="ml-2">~{currentNetwork.blockTime} seconds</span>
            </div>
            <div>
              <span className="font-medium">Gas Limit:</span>
              <span className="ml-2">{currentNetwork.gasLimit.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Contracts List */}
      {contracts && (
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold style={{ color: 'var(--text-primary)' }}">Deployed Contracts</h3>
          
          {/* Core DEX Contracts */}
          <div>
            <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-4 border-b style={{ borderColor: 'var(--border-color)' }} pb-2">
              Core DEX Contracts
            </h4>
            <div className="grid gap-4">
              {['dexFactory', 'dexRouter', 'crossChainBridge', 'priceOracle', 'weth'].map(contractName => {
                const address = contracts[contractName];
                if (!address || address === '0x0000000000000000000000000000000000000000') return null;
                
                return (
                  <ContractCard
                    key={contractName}
                    name={contractName}
                    address={address}
                    network={currentNetwork}
                    icon={getContractTypeIcon(contractName)}
                    description={getContractDescription(contractName)}
                  />
                );
              })}
            </div>
          </div>

          {/* Mock Tokens */}
          {contracts.tokens && Object.keys(contracts.tokens).length > 0 && (
            <div>
              <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-4 border-b style={{ borderColor: 'var(--border-color)' }} pb-2">
                Mock Tokens (Testing)
              </h4>
              <div className="grid gap-4">
                {Object.entries(contracts.tokens).map(([tokenName, address]) => {
                  if (!address || address === '0x0000000000000000000000000000000000000000') return null;
                  
                  return (
                    <ContractCard
                      key={tokenName}
                      name={tokenName}
                      address={address}
                      network={currentNetwork}
                      icon={getContractTypeIcon(tokenName)}
                      description={getContractDescription(tokenName)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Trading Pairs */}
          {contracts.pairs && Object.keys(contracts.pairs).length > 0 && (
            <div>
              <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-4 border-b style={{ borderColor: 'var(--border-color)' }} pb-2">
                Trading Pairs
              </h4>
              <div className="grid gap-4">
                {Object.entries(contracts.pairs).map(([pairName, address]) => {
                  if (!address || address === '0x0000000000000000000000000000000000000000') return null;
                  
                  return (
                    <ContractCard
                      key={pairName}
                      name={pairName}
                      address={address}
                      network={currentNetwork}
                      icon="🔄"
                      description={`Trading pair for ${pairName.replace(/([A-Z])/g, ' $1').trim()}`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Contracts Message */}
      {(!contracts || Object.keys(contracts).length === 0) && (
        <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-8 border style={{ borderColor: 'var(--border-color)' }} text-center">
          <div className="text-6xl mb-4">🏗️</div>
          <h3 className="text-xl font-semibold style={{ color: 'var(--text-primary)' }} mb-2">No Contracts Deployed</h3>
          <p className="text-gray-400">
            No smart contracts have been deployed on {currentNetwork?.name || 'this network'} yet.
          </p>
        </div>
      )}

      {/* Contract Verification Info */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-3">✅ Contract Verification</h3>
        <p className="style={{ color: 'var(--text-secondary)' }} mb-4">
          All deployed contracts are verified on their respective block explorers. This means:
        </p>
        <ul className="style={{ color: 'var(--text-secondary)' }} space-y-2">
          <li>• <strong>Source Code Available:</strong> Full contract source code is publicly viewable</li>
          <li>• <strong>Transparency:</strong> Anyone can audit and verify the contract logic</li>
          <li>• <strong>Security:</strong> Verified contracts are more trustworthy for users</li>
          <li>• <strong>Interoperability:</strong> Other dApps can easily integrate with verified contracts</li>
        </ul>
      </div>

      {/* Security Features */}
      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-3">🔒 Security Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 style={{ color: 'var(--text-secondary)' }}">
          <div>
            <h4 className="font-semibold style={{ color: 'var(--text-primary)' }} mb-2">Smart Contract Security</h4>
            <ul className="space-y-1 text-sm">
              <li>• Reentrancy protection</li>
              <li>• Overflow protection</li>
              <li>• Access control mechanisms</li>
              <li>• Input validation</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold style={{ color: 'var(--text-primary)' }} mb-2">Platform Security</h4>
            <ul className="space-y-1 text-sm">
              <li>• Multi-sig bridge security</li>
              <li>• Time-lock mechanisms</li>
              <li>• Emergency pause functionality</li>
              <li>• Regular security audits</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Contract Card Component
const ContractCard = ({ name, address, network, icon, description }) => {
  const getExplorerUrl = (address, network) => {
    if (!network || !address) return '#';
    return `${network.explorer}/address/${address}`;
  };
  const explorerUrl = getExplorerUrl(address, network);
  
  return (
    <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }} hover:border-gray-500 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h5 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} capitalize">
              {name.replace(/([A-Z])/g, ' $1').trim()}
            </h5>
            <p className="text-gray-400 text-sm">{description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-green-600 style={{ color: 'var(--text-primary)' }} px-2 py-1 rounded text-xs font-medium">
            Verified
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <span className="text-gray-400 text-sm">Contract Address:</span>
          <div className="flex items-center space-x-2 mt-1">
            <code className="bg-gray-800 text-green-400 px-3 py-2 rounded text-sm font-mono break-all">
              {address}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(address)}
              className="text-gray-400 hover:style={{ color: 'var(--text-primary)' }} transition-colors"
              title="Copy address"
            >
              📋
            </button>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 style={{ color: 'var(--text-primary)' }} px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <span>🔍</span>
            <span>View on Explorer</span>
          </a>
          <a
            href={`${explorerUrl}#code`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-600 hover:bg-gray-700 style={{ color: 'var(--text-primary)' }} px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <span>📄</span>
            <span>View Source</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default SmartContractsSection; 