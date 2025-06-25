import React from 'react';

const OverviewSection = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-6">Platform Overview</h2>
        <p className="text-gray-300 text-lg leading-relaxed mb-6">
          mochi is a next-generation decentralized exchange (DEX) that enables seamless trading across multiple blockchain networks. 
          Built with modern web3 technologies, mochi provides a unified platform for token swapping, liquidity provision, 
          cross-chain bridging, and comprehensive portfolio management.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h3 className="text-xl font-semibold text-white mb-3">🎯 Mission</h3>
            <p className="text-gray-300">
              Democratize access to decentralized finance by providing a seamless, 
              cross-chain trading experience that works across all major blockchain networks.
            </p>
          </div>
          
          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h3 className="text-xl font-semibold text-white mb-3">🌟 Vision</h3>
            <p className="text-gray-300">
              Become the go-to platform for cross-chain DeFi activities, 
              enabling users to trade any token on any network from a single interface.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-white mb-4">Key Principles</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="text-3xl mb-2">🔓</div>
            <h4 className="text-lg font-semibold text-white mb-2">Permissionless</h4>
            <p className="text-gray-300 text-sm">
              Anyone can create trading pairs and add liquidity without approval
            </p>
          </div>
          
          <div className="text-center p-4">
            <div className="text-3xl mb-2">🌐</div>
            <h4 className="text-lg font-semibold text-white mb-2">Cross-Chain</h4>
            <p className="text-gray-300 text-sm">
              Trade tokens across multiple blockchain networks seamlessly
            </p>
          </div>
          
          <div className="text-center p-4">
            <div className="text-3xl mb-2">⚡</div>
            <h4 className="text-lg font-semibold text-white mb-2">Fast & Efficient</h4>
            <p className="text-gray-300 text-sm">
              Optimized for speed and cost-effectiveness across all networks
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-white mb-4">Architecture Overview</h3>
        <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Frontend Layer</h4>
              <ul className="text-gray-300 space-y-2">
                <li>• React.js with modern UI/UX</li>
                <li>• Web3 integration with ethers.js</li>
                <li>• Real-time data updates</li>
                <li>• Cross-chain wallet support</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Smart Contract Layer</h4>
              <ul className="text-gray-300 space-y-2">
                <li>• Solidity-based DEX contracts</li>
                <li>• Automated Market Maker (AMM)</li>
                <li>• Cross-chain bridge functionality</li>
                <li>• Multi-network deployment</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-white mb-4">Getting Started</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
              1
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">Connect Your Wallet</h4>
              <p className="text-gray-300">
                Connect your Web3 wallet (MetaMask, WalletConnect, etc.) to start trading. 
                mochi supports all major wallet providers across multiple networks.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
              2
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">Select Network</h4>
              <p className="text-gray-300">
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
              <h4 className="text-lg font-semibold text-white mb-2">Start Trading</h4>
              <p className="text-gray-300">
                Swap tokens, provide liquidity, or bridge assets across networks. 
                All transactions are executed directly on-chain for maximum security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection; 