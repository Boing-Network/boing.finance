import React from 'react';

const NetworksSection = () => {
  const networks = [
    {
      category: 'Major Networks',
      networks: [
        { name: 'Ethereum', chainId: 1, symbol: 'ETH', features: ['High Security', 'Largest Ecosystem'] },
        { name: 'Polygon', chainId: 137, symbol: 'MATIC', features: ['Low Fees', 'Fast Transactions'] },
        { name: 'BNB Smart Chain', chainId: 56, symbol: 'BNB', features: ['High Throughput', 'Low Costs'] }
      ]
    },
    {
      category: 'Layer 2 Networks',
      networks: [
        { name: 'Arbitrum One', chainId: 42161, symbol: 'ARB', features: ['Rollup', 'Low Fees'] },
        { name: 'Optimism', chainId: 10, symbol: 'OP', features: ['Rollup', 'Fast Finality'] },
        { name: 'Base', chainId: 8453, symbol: 'ETH', features: ['Coinbase Backed', 'Rollup'] },
        { name: 'Linea', chainId: 59144, symbol: 'ETH', features: ['Consensys Backed', 'Rollup'] },
        { name: 'Polygon zkEVM', chainId: 1101, symbol: 'ETH', features: ['zkRollup', 'Polygon Backed'] },
        { name: 'zkSync Era', chainId: 324, symbol: 'ETH', features: ['zkRollup', 'High Throughput'] },
        { name: 'Scroll', chainId: 534352, symbol: 'ETH', features: ['zkRollup', 'Native Ethereum Compatibility'] }
      ]
    },
    {
      category: 'Alternative Layer 1s',
      networks: [
        { name: 'Fantom', chainId: 250, symbol: 'FTM', features: ['Fast Finality', 'Low Fees'] },
        { name: 'Avalanche', chainId: 43114, symbol: 'AVAX', features: ['Subnet Support', 'High Throughput'] },
        { name: 'Moonbeam', chainId: 1284, symbol: 'GLMR', features: ['Parachain', 'Ethereum Compatibility'] },
        { name: 'Moonriver', chainId: 1285, symbol: 'MOVR', features: ['Parachain', 'Ethereum Compatibility'] },
        { name: 'PulseChain', chainId: 804, symbol: 'PLS', features: ['Ethereum Fork', 'Low Fees'] },
        { name: 'Gnosis Chain', chainId: 100, symbol: 'XDAI', features: ['Sidechain', 'Stablecoin Backed'] }
      ]
    }
  ];

  const networkFeatures = [
    {
      title: 'ERC-20 Token Standard',
      description: 'All supported networks use the ERC-20 standard for fungible tokens',
      icon: '🪙'
    },
    {
      title: 'EVM Compatibility',
      description: 'All networks run the Ethereum Virtual Machine for seamless contract deployment',
      icon: '⚙️'
    },
    {
      title: 'Cross-Chain Bridging',
      description: 'Transfer tokens between any supported network using our bridge infrastructure',
      icon: '🌉'
    },
    {
      title: 'Unified Interface',
      description: 'Trade on any network from a single, consistent user interface',
      icon: '🖥️'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold style={{ color: 'var(--text-primary)' }} mb-6">Supported Networks</h2>
        <p className="style={{ color: 'var(--text-secondary)' }} text-lg leading-relaxed mb-8">
          mochi supports 15+ blockchain networks, from major Layer 1s to emerging Layer 2 solutions. 
          All networks use the ERC-20 token standard and are EVM-compatible, ensuring seamless 
          cross-chain trading and liquidity provision.
        </p>
      </div>

      {/* Network Categories */}
      {networks.map((category, index) => (
        <div key={index}>
          <h3 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-6">{category.category}</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.networks.map((network, idx) => (
              <div key={idx} className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }}">{network.name}</h4>
                  <span className="text-sm text-gray-400">#{network.chainId}</span>
                </div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="style={{ color: 'var(--text-primary)' }} font-bold text-sm">{network.symbol[0]}</span>
                  </div>
                  <span className="style={{ color: 'var(--text-secondary)' }} font-medium">{network.symbol}</span>
                </div>
                <div className="space-y-2">
                  {network.features.map((feature, featureIdx) => (
                    <div key={featureIdx} className="flex items-center space-x-2">
                      <span className="text-green-400 text-sm">✓</span>
                      <span className="style={{ color: 'var(--text-secondary)' }} text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Network Features */}
      <div>
        <h3 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-6">Network Features</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {networkFeatures.map((feature, index) => (
            <div key={index} className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
              <div className="flex items-start space-x-4">
                <div className="text-3xl">{feature.icon}</div>
                <div>
                  <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-2">{feature.title}</h4>
                  <p className="style={{ color: 'var(--text-secondary)' }}">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Network Comparison */}
      <div>
        <h3 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-6">Network Comparison</h3>
        <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }} overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b style={{ borderColor: 'var(--border-color)' }}">
                <th className="text-left style={{ color: 'var(--text-primary)' }} font-semibold py-3">Network</th>
                <th className="text-center style={{ color: 'var(--text-primary)' }} font-semibold py-3">Type</th>
                <th className="text-center style={{ color: 'var(--text-primary)' }} font-semibold py-3">Block Time</th>
                <th className="text-center style={{ color: 'var(--text-primary)' }} font-semibold py-3">Gas Limit</th>
                <th className="text-center style={{ color: 'var(--text-primary)' }} font-semibold py-3">Features</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-700">
                <td className="style={{ color: 'var(--text-secondary)' }} py-3">Ethereum</td>
                <td className="text-center style={{ color: 'var(--text-secondary)' }} py-3">Layer 1</td>
                <td className="text-center style={{ color: 'var(--text-secondary)' }} py-3">12s</td>
                <td className="text-center style={{ color: 'var(--text-secondary)' }} py-3">30M</td>
                <td className="text-center style={{ color: 'var(--text-secondary)' }} py-3">High Security</td>
              </tr>
              <tr className="border-b border-gray-700">
                <td className="style={{ color: 'var(--text-secondary)' }} py-3">Polygon</td>
                <td className="text-center style={{ color: 'var(--text-secondary)' }} py-3">Sidechain</td>
                <td className="text-center style={{ color: 'var(--text-secondary)' }} py-3">2s</td>
                <td className="text-center style={{ color: 'var(--text-secondary)' }} py-3">30M</td>
                <td className="text-center style={{ color: 'var(--text-secondary)' }} py-3">Low Fees</td>
              </tr>
              <tr className="border-b border-gray-700">
                <td className="style={{ color: 'var(--text-secondary)' }} py-3">Arbitrum</td>
                <td className="text-center style={{ color: 'var(--text-secondary)' }} py-3">Rollup</td>
                <td className="text-center style={{ color: 'var(--text-secondary)' }} py-3">1s</td>
                <td className="text-center style={{ color: 'var(--text-secondary)' }} py-3">100M</td>
                <td className="text-center style={{ color: 'var(--text-secondary)' }} py-3">Low Fees</td>
              </tr>
              <tr className="border-b border-gray-700">
                <td className="style={{ color: 'var(--text-secondary)' }} py-3">Base</td>
                <td className="text-center style={{ color: 'var(--text-secondary)' }} py-3">Rollup</td>
                <td className="text-center style={{ color: 'var(--text-secondary)' }} py-3">2s</td>
                <td className="text-center style={{ color: 'var(--text-secondary)' }} py-3">30M</td>
                <td className="text-center style={{ color: 'var(--text-secondary)' }} py-3">Coinbase Backed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Adding New Networks */}
      <div>
        <h3 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-6">Adding New Networks</h3>
        <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
          <p className="style={{ color: 'var(--text-secondary)' }} mb-4">
            mochi is designed to easily support new blockchain networks. To add a new network:
          </p>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-600 style={{ color: 'var(--text-primary)' }} rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                1
              </div>
              <div>
                <h4 className="style={{ color: 'var(--text-primary)' }} font-semibold mb-1">Network Requirements</h4>
                <p className="style={{ color: 'var(--text-secondary)' }} text-sm">
                  The network must be EVM-compatible and support ERC-20 tokens
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-blue-600 style={{ color: 'var(--text-primary)' }} rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                2
              </div>
              <div>
                <h4 className="style={{ color: 'var(--text-primary)' }} font-semibold mb-1">Configuration</h4>
                <p className="style={{ color: 'var(--text-secondary)' }} text-sm">
                  Add network details to the configuration file with RPC endpoint and chain ID
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-blue-600 style={{ color: 'var(--text-primary)' }} rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                3
              </div>
              <div>
                <h4 className="style={{ color: 'var(--text-primary)' }} font-semibold mb-1">Contract Deployment</h4>
                <p className="style={{ color: 'var(--text-secondary)' }} text-sm">
                  Deploy DEX contracts on the new network using the same Solidity code
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-blue-600 style={{ color: 'var(--text-primary)' }} rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                4
              </div>
              <div>
                <h4 className="style={{ color: 'var(--text-primary)' }} font-semibold mb-1">Bridge Integration</h4>
                <p className="style={{ color: 'var(--text-secondary)' }} text-sm">
                  Integrate with cross-chain bridge infrastructure for seamless transfers
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworksSection; 