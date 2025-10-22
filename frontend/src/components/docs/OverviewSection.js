import React from 'react';

const OverviewSection = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Platform Overview</h2>
        <p className="text-lg leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
          boing.finance is a next-generation decentralized exchange (DEX) that enables seamless trading across multiple blockchain networks. 
          Built with modern web3 technologies, boing.finance provides a unified platform for token swapping, liquidity provision, 
          cross-chain bridging, token deployment, and comprehensive portfolio management.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>🎯 Mission</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Democratize access to decentralized finance by providing a seamless, 
              cross-chain trading experience that works across all major blockchain networks.
            </p>
          </div>
          
          <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>🌟 Vision</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Become the go-to platform for cross-chain DeFi activities, 
              enabling users to trade any token on any network from a single interface.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Key Features</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="text-3xl mb-2">💱</div>
            <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Token Swapping</h4>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Instant token swaps with competitive rates and minimal slippage
            </p>
          </div>
          
          <div className="text-center p-4 rounded-lg border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="text-3xl mb-2">💧</div>
            <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Liquidity Provision</h4>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Earn fees by providing liquidity to trading pairs
            </p>
          </div>
          
          <div className="text-center p-4 rounded-lg border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="text-3xl mb-2">🌉</div>
            <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Cross-Chain Bridge</h4>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Seamlessly transfer tokens between different blockchain networks
            </p>
          </div>
          
          <div className="text-center p-4 rounded-lg border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="text-3xl mb-2">🪙</div>
            <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Token Deployment</h4>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Deploy your own tokens with advanced features and customization
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Key Principles</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="text-3xl mb-2">🔓</div>
            <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Permissionless</h4>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Anyone can create trading pairs and add liquidity without approval
            </p>
          </div>
          
          <div className="text-center p-4">
            <div className="text-3xl mb-2">🌐</div>
            <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Cross-Chain</h4>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Trade tokens across multiple blockchain networks seamlessly
            </p>
          </div>
          
          <div className="text-center p-4">
            <div className="text-3xl mb-2">⚡</div>
            <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Fast & Efficient</h4>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Optimized for speed and cost-effectiveness across all networks
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Supported Networks</h3>
        <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: 'Ethereum', icon: '🔵', type: 'Mainnet' },
              { name: 'Polygon', icon: '🟣', type: 'Mainnet' },
              { name: 'BSC', icon: '🟡', type: 'Mainnet' },
              { name: 'Arbitrum', icon: '🔵', type: 'Mainnet' },
              { name: 'Optimism', icon: '🔴', type: 'Mainnet' },
              { name: 'Base', icon: '🔵', type: 'Mainnet' },
              { name: 'Avalanche', icon: '🔴', type: 'Mainnet' },
              { name: 'Fantom', icon: '🔵', type: 'Mainnet' },
              { name: 'Sepolia', icon: '🧪', type: 'Testnet' },
              { name: 'Mumbai', icon: '🧪', type: 'Testnet' },
              { name: 'BSC Testnet', icon: '🧪', type: 'Testnet' },
              { name: 'Arbitrum Sepolia', icon: '🧪', type: 'Testnet' }
            ].map((network, index) => (
              <div key={index} className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="text-2xl mb-1">{network.icon}</div>
                <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{network.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{network.type}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Architecture Overview</h3>
        <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Frontend Layer</h4>
              <ul className="space-y-2" style={{ color: 'var(--text-secondary)' }}>
                <li>• React.js with modern UI/UX</li>
                <li>• Web3 integration with ethers.js</li>
                <li>• Real-time data updates</li>
                <li>• Cross-chain wallet support</li>
                <li>• Responsive design for all devices</li>
                <li>• Advanced analytics and portfolio tracking</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Smart Contract Layer</h4>
              <ul className="space-y-2" style={{ color: 'var(--text-secondary)' }}>
                <li>• Solidity-based DEX contracts</li>
                <li>• Automated Market Maker (AMM)</li>
                <li>• Cross-chain bridge functionality</li>
                <li>• Multi-network deployment</li>
                <li>• Advanced token standards</li>
                <li>• Open source and verifiable contracts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Getting Started</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
              1
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Connect Your Wallet</h4>
              <p style={{ color: 'var(--text-secondary)' }}>
                Connect your Web3 wallet (MetaMask, WalletConnect, etc.) to start trading. 
                boing.finance supports all major wallet providers across multiple networks.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
              2
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Select Network</h4>
              <p style={{ color: 'var(--text-secondary)' }}>
                Choose from 15+ supported blockchain networks including Ethereum, Polygon, 
                Arbitrum, Base, and many more emerging networks.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
              3
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Start Trading</h4>
              <p style={{ color: 'var(--text-secondary)' }}>
                Swap tokens, provide liquidity, bridge assets across networks, or deploy your own tokens. 
                All transactions are executed directly on-chain for maximum security.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Why Choose boing.finance?</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>🚀 Advanced Features</h4>
            <ul className="space-y-2" style={{ color: 'var(--text-secondary)' }}>
              <li>• Cross-chain token bridging</li>
              <li>• Advanced token deployment</li>
              <li>• Real-time analytics dashboard</li>
              <li>• Portfolio tracking across networks</li>
              <li>• Gas fee optimization</li>
              <li>• Multi-wallet support</li>
            </ul>
          </div>
          
          <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>🔒 Security & Reliability</h4>
            <ul className="space-y-2" style={{ color: 'var(--text-secondary)' }}>
              <li>• Open source smart contracts</li>
              <li>• Multi-signature bridge security</li>
              <li>• Time-lock mechanisms</li>
              <li>• Emergency pause functionality</li>
              <li>• Automated monitoring systems</li>
              <li>• Transparent operations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection; 