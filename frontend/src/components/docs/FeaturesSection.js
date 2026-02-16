import React from 'react';

const FeaturesSection = () => {
  const features = [
    {
      icon: '💱',
      title: 'Token Swapping',
      description: 'Instant token swaps with best price routing across multiple DEXs',
      details: [
        'Automated Market Maker (AMM) with constant product formula',
        'Slippage protection and price impact calculation',
        'Multi-hop routing for optimal trade execution',
        'Real-time price feeds and market data'
      ]
    },
    {
      icon: '💧',
      title: 'Liquidity Provision',
      description: 'Earn fees by providing liquidity to trading pairs',
      details: [
        'Permissionless pair creation for any ERC-20 tokens',
        'Automated fee collection and compound rewards',
        'Impermanent loss protection mechanisms',
        'Liquidity mining and yield farming opportunities'
      ]
    },
    {
      icon: '🌉',
      title: 'Cross-Chain Bridge',
      description: 'Seamlessly transfer tokens between different blockchain networks',
      details: [
        'Support for 15+ blockchain networks',
        'Secure bridge infrastructure with multi-sig protection',
        'Real-time bridge status and transaction tracking',
        'Optimized gas fees and fast confirmation times'
      ]
    },
    {
      icon: '📊',
      title: 'Analytics Dashboard',
      description: 'Comprehensive market data and trading analytics',
      details: [
        'Real-time price charts and trading volume',
        'Portfolio performance tracking and P&L analysis',
        'Market trends and token discovery tools',
        'Historical data and performance metrics'
      ]
    },
    {
      icon: '💼',
      title: 'Portfolio Management',
      description: 'Unified view of your assets on EVM and Solana',
      details: [
        'Cross-chain portfolio aggregation',
        'Asset allocation and diversification tracking',
        'Transaction history and tax reporting tools',
        'Performance benchmarking and goal setting'
      ]
    },
    {
      icon: '🪙',
      title: 'Token Management',
      description: 'Discover, track, and manage tokens on EVM and Solana',
      details: [
        'Token discovery and trending lists',
        'Custom token lists and watchlists',
        'Token information and contract verification',
        'Price alerts and market notifications'
      ]
    },
    {
      icon: '🚀',
      title: 'Token & NFT Deployment',
      description: 'Deploy tokens, create NFTs, and create liquidity pools',
      details: [
        'Deploy ERC-20 tokens with custom supply and metadata',
        'Create and mint NFTs with metadata and images',
        'Create new trading pairs and liquidity pools',
        'No coding required—deploy from the web interface'
      ]
    },
    {
      icon: '📜',
      title: 'Governance',
      description: 'Participate in protocol governance and vote on proposals',
      details: [
        'View and vote on governance proposals',
        'DAO treasury and roadmap visibility',
        'Community forums and social links',
        'Educational resources on how governance works'
      ]
    },
    {
      icon: '🎯',
      title: 'BOING Ecosystem',
      description: 'NFT staking, points, rewards, and community activities',
      details: [
        'Stake Boing NFTs for rewards',
        'Earn points through trading and liquidity',
        'Community activities and events',
        'Roadmap and upcoming initiatives'
      ]
    },
    {
      icon: '🤖',
      title: 'AI DeFi Assistant & Tools',
      description: 'Get help and use built-in tools',
      details: [
        'AI DeFi Assistant for questions and guidance',
        'DeFi 101 learning resource',
        'Transaction history and tracking',
        'Developer tools and contract utilities'
      ]
    }
  ];

  const technicalFeatures = [
    {
      category: 'Smart Contracts',
      items: [
        'Solidity-based DEX contracts with security best practices',
        'Automated Market Maker (AMM) implementation',
        'Cross-chain bridge contracts with multi-sig security',
        'Upgradeable contract architecture',
        'Open source smart contracts'
      ]
    },
    {
      category: 'Frontend',
      items: [
        'React.js with modern UI/UX design',
        'Web3 integration with ethers.js',
        'Real-time data updates and notifications',
        'Mobile-responsive design for all devices'
      ]
    },
    {
      category: 'Backend',
      items: [
        'Cloudflare Workers for serverless backend',
        'D1 database for data persistence',
        'Real-time price feeds and market data',
        'API endpoints for third-party integrations'
      ]
    },
    {
      category: 'Security',
      items: [
        'Multi-sig bridge security',
        'Open source smart contracts',
        'Rate limiting and DDoS protection',
        'Secure wallet integration'
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Platform Features</h2>
        <p className="text-lg leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
          boing.finance offers a comprehensive suite of DeFi features designed to provide the best 
          cross-chain trading experience. From basic token swaps to governance, NFT creation, and the BOING ecosystem, 
          every feature is built with security, efficiency, and user experience in mind.
        </p>
      </div>

      {/* Core Features */}
      <div>
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Core Features</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div key={index} className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
              <div className="flex items-start space-x-4">
                <div className="text-3xl">{feature.icon}</div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold  mb-2"
          style={{ color: 'var(--text-primary)'  }}>{feature.title}</h4>
                  <p className=" mb-4"
          style={{ color: 'var(--text-secondary)'  }}>{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.details.map((detail, idx) => (
                      <li key={idx} className=" text-sm flex items-start"
          style={{ color: 'var(--text-secondary)'  }}>
                        <span className="text-blue-400 mr-2">•</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Features */}
      <div>
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Technical Features</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {technicalFeatures.map((category, index) => (
            <div key={index} className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
              <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>{category.category}</h4>
              <ul className="space-y-2">
                {category.items.map((item, idx) => (
                  <li key={idx} className=" text-sm flex items-start"
          style={{ color: 'var(--text-secondary)'  }}>
                    <span className="text-green-400 mr-2">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Features */}
      <div>
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Advanced Features</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-lg p-6 border border-blue-500/30">
            <div className="text-3xl mb-3">🤖</div>
            <h4 className="text-lg font-semibold  mb-2"
          style={{ color: 'var(--text-primary)'  }}>Smart Routing</h4>
            <p className=" text-sm"
          style={{ color: 'var(--text-secondary)'  }}>
              Intelligent routing that finds the best path for your trades across multiple DEXs and networks
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-green-600/20 to-blue-600/20 rounded-lg p-6 border border-green-500/30">
            <div className="text-3xl mb-3">⚡</div>
            <h4 className="text-lg font-semibold  mb-2"
          style={{ color: 'var(--text-primary)'  }}>Gas Optimization</h4>
            <p className=" text-sm"
          style={{ color: 'var(--text-secondary)'  }}>
              Advanced gas estimation to minimize costs on EVM and Solana
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg p-6 border border-purple-500/30">
            <div className="text-3xl mb-3">🔔</div>
            <h4 className="text-lg font-semibold  mb-2"
          style={{ color: 'var(--text-primary)'  }}>Notifications</h4>
            <p className=" text-sm"
          style={{ color: 'var(--text-secondary)'  }}>
              Real-time notifications for price alerts, transaction confirmations, and market updates
            </p>
          </div>
        </div>
      </div>

      {/* Feature Comparison */}
      <div>
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Feature Comparison</h3>
        <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }} overflow-x-auto"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
          <table className="w-full">
            <thead>
              <tr className="border-b "
          style={{ borderColor: 'var(--border-color)'  }}>
                <th className="text-left  font-semibold py-3"
          style={{ color: 'var(--text-primary)'  }}>Feature</th>
                <th className="text-center  font-semibold py-3"
          style={{ color: 'var(--text-primary)'  }}>boing.finance</th>
                <th className="text-center font-semibold py-3" style={{ color: 'var(--text-tertiary)' }}>Traditional DEXs</th>
              </tr>
            </thead>
            <tbody className="space-y-2">
              <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                <td className=" py-3"
          style={{ color: 'var(--text-secondary)'  }}>Cross-Chain Trading</td>
                <td className="text-center text-green-400 py-3">✓</td>
                <td className="text-center text-red-400 py-3">✗</td>
              </tr>
              <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                <td className=" py-3"
          style={{ color: 'var(--text-secondary)'  }}>Multi-Network Support</td>
                <td className="text-center text-green-400 py-3">15+ Networks</td>
                <td className="text-center py-3" style={{ color: 'var(--text-tertiary)' }}>1-2 Networks</td>
              </tr>
              <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                <td className=" py-3"
          style={{ color: 'var(--text-secondary)'  }}>Permissionless Pairs</td>
                <td className="text-center text-green-400 py-3">✓</td>
                <td className="text-center text-green-400 py-3">✓</td>
              </tr>
              <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                <td className=" py-3"
          style={{ color: 'var(--text-secondary)'  }}>Portfolio Management</td>
                <td className="text-center text-green-400 py-3">Cross-Chain</td>
                <td className="text-center py-3" style={{ color: 'var(--text-tertiary)' }}>Single Chain</td>
              </tr>
              <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                <td className=" py-3"
          style={{ color: 'var(--text-secondary)'  }}>Gas Optimization</td>
                <td className="text-center text-green-400 py-3">Advanced</td>
                <td className="text-center py-3" style={{ color: 'var(--text-tertiary)' }}>Basic</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection; 