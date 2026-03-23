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
        <h2 className="text-3xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Supported Networks</h2>
        <p className=" text-lg leading-relaxed mb-8"
          style={{ color: 'var(--text-secondary)'  }}>
          boing.finance supports EVM chains (Ethereum, Polygon, Arbitrum, Base, and more) and Solana. 
          EVM networks use the ERC-20 token standard; Solana uses SPL tokens. Use the network selector 
          to switch chains and the Bridge to move assets cross-chain.
        </p>
      </div>

      {/* Network Categories */}
      {networks.map((category, index) => (
        <div key={index}>
          <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>{category.category}</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.networks.map((network, idx) => (
              <div key={idx} className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold "
          style={{ color: 'var(--text-primary)'  }}>{network.name}</h4>
                  <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>#{network.chainId}</span>
                </div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className=" font-bold text-sm"
          style={{ color: 'var(--text-primary)'  }}>{network.symbol[0]}</span>
                  </div>
                  <span className=" font-medium"
          style={{ color: 'var(--text-secondary)'  }}>{network.symbol}</span>
                </div>
                <div className="space-y-2">
                  {network.features.map((feature, featureIdx) => (
                    <div key={featureIdx} className="flex items-center space-x-2">
                      <span className="text-green-400 text-sm">✓</span>
                      <span className=" text-sm"
          style={{ color: 'var(--text-secondary)'  }}>{feature}</span>
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
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Network Features</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {networkFeatures.map((feature, index) => (
            <div key={index} className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-start space-x-4">
                <div className="text-3xl">{feature.icon}</div>
                <div>
                  <h4 className="text-lg font-semibold  mb-2"
          style={{ color: 'var(--text-primary)'  }}>{feature.title}</h4>
                  <p className=""
          style={{ color: 'var(--text-secondary)'  }}>{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Network Comparison */}
      <div>
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Network Comparison</h3>
        <div className="rounded-lg p-6 border overflow-x-auto" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <table className="w-full">
            <thead>
              <tr className="border-b "
          style={{ borderColor: 'var(--border-color)'  }}>
                <th className="text-left  font-semibold py-3"
          style={{ color: 'var(--text-primary)'  }}>Network</th>
                <th className="text-center  font-semibold py-3"
          style={{ color: 'var(--text-primary)'  }}>Type</th>
                <th className="text-center  font-semibold py-3"
          style={{ color: 'var(--text-primary)'  }}>Block Time</th>
                <th className="text-center  font-semibold py-3"
          style={{ color: 'var(--text-primary)'  }}>Gas Limit</th>
                <th className="text-center  font-semibold py-3"
          style={{ color: 'var(--text-primary)'  }}>Features</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                <td className=" py-3"
          style={{ color: 'var(--text-secondary)'  }}>Ethereum</td>
                <td className="text-center  py-3"
          style={{ color: 'var(--text-secondary)'  }}>Layer 1</td>
                <td className="text-center  py-3"
          style={{ color: 'var(--text-secondary)'  }}>12s</td>
                <td className="text-center  py-3"
          style={{ color: 'var(--text-secondary)'  }}>30M</td>
                <td className="text-center  py-3"
          style={{ color: 'var(--text-secondary)'  }}>High Security</td>
              </tr>
              <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                <td className=" py-3"
          style={{ color: 'var(--text-secondary)'  }}>Polygon</td>
                <td className="text-center  py-3"
          style={{ color: 'var(--text-secondary)'  }}>Sidechain</td>
                <td className="text-center  py-3"
          style={{ color: 'var(--text-secondary)'  }}>2s</td>
                <td className="text-center  py-3"
          style={{ color: 'var(--text-secondary)'  }}>30M</td>
                <td className="text-center  py-3"
          style={{ color: 'var(--text-secondary)'  }}>Low Fees</td>
              </tr>
              <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                <td className=" py-3"
          style={{ color: 'var(--text-secondary)'  }}>Arbitrum</td>
                <td className="text-center  py-3"
          style={{ color: 'var(--text-secondary)'  }}>Rollup</td>
                <td className="text-center  py-3"
          style={{ color: 'var(--text-secondary)'  }}>1s</td>
                <td className="text-center  py-3"
          style={{ color: 'var(--text-secondary)'  }}>100M</td>
                <td className="text-center  py-3"
          style={{ color: 'var(--text-secondary)'  }}>Low Fees</td>
              </tr>
              <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                <td className=" py-3"
          style={{ color: 'var(--text-secondary)'  }}>Base</td>
                <td className="text-center  py-3"
          style={{ color: 'var(--text-secondary)'  }}>Rollup</td>
                <td className="text-center  py-3"
          style={{ color: 'var(--text-secondary)'  }}>2s</td>
                <td className="text-center  py-3"
          style={{ color: 'var(--text-secondary)'  }}>30M</td>
                <td className="text-center  py-3"
          style={{ color: 'var(--text-secondary)'  }}>Coinbase Backed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Adding New Networks */}
      <div>
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Adding New Networks</h3>
        <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <p className=" mb-4"
          style={{ color: 'var(--text-secondary)'  }}>
            boing.finance is designed to easily support new blockchain networks. To add a new network:
          </p>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-600  rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1"
          style={{ color: 'var(--text-primary)'  }}>
                1
              </div>
              <div>
                <h4 className=" font-semibold mb-1"
          style={{ color: 'var(--text-primary)'  }}>Network Requirements</h4>
                <p className=" text-sm"
          style={{ color: 'var(--text-secondary)'  }}>
                  The network must be EVM-compatible and support ERC-20 tokens
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-blue-600  rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1"
          style={{ color: 'var(--text-primary)'  }}>
                2
              </div>
              <div>
                <h4 className=" font-semibold mb-1"
          style={{ color: 'var(--text-primary)'  }}>Configuration</h4>
                <p className=" text-sm"
          style={{ color: 'var(--text-secondary)'  }}>
                  Add network details to the configuration file with RPC endpoint and chain ID
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-blue-600  rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1"
          style={{ color: 'var(--text-primary)'  }}>
                3
              </div>
              <div>
                <h4 className=" font-semibold mb-1"
          style={{ color: 'var(--text-primary)'  }}>Contract Deployment</h4>
                <p className=" text-sm"
          style={{ color: 'var(--text-secondary)'  }}>
                  Deploy DEX contracts on the new network using the same Solidity code
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-blue-600  rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1"
          style={{ color: 'var(--text-primary)'  }}>
                4
              </div>
              <div>
                <h4 className=" font-semibold mb-1"
          style={{ color: 'var(--text-primary)'  }}>Bridge Integration</h4>
                <p className=" text-sm"
          style={{ color: 'var(--text-secondary)'  }}>
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