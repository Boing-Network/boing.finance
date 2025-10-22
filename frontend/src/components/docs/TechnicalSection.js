import React from 'react';

const TechnicalSection = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">Technical Specifications</h2>
        <p className="style={{ color: 'var(--text-secondary)' }} text-lg">
          Comprehensive technical documentation for boing.finance, including smart contract architecture, 
          protocol specifications, and integration details.
        </p>
      </div>

      {/* Smart Contract Architecture */}
      <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
        <h3 className="text-xl font-semibold style={{ color: 'var(--text-primary)' }} mb-4">Smart Contract Architecture</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-medium style={{ color: 'var(--text-primary)' }} mb-3">Core Contracts</h4>
            <ul className="space-y-2 style={{ color: 'var(--text-secondary)' }}">
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <div>
                  <strong>DEXFactory</strong> - Manages trading pair creation and deployment
                  <br />
                  <span className="text-sm text-gray-400">Creates and tracks all trading pairs</span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <div>
                  <strong>DEXRouter</strong> - Handles swap routing and calculations
                  <br />
                  <span className="text-sm text-gray-400">Optimizes trade execution and slippage</span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <div>
                  <strong>DEXPair</strong> - Individual trading pair contracts
                  <br />
                  <span className="text-sm text-gray-400">Manages liquidity and price calculations</span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <div>
                  <strong>CrossChainBridge</strong> - Enables cross-chain token transfers
                  <br />
                  <span className="text-sm text-gray-400">Secure bridging between networks</span>
                </div>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-medium style={{ color: 'var(--text-primary)' }} mb-3">Supporting Contracts</h4>
            <ul className="space-y-2 style={{ color: 'var(--text-secondary)' }}">
              <li className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                <div>
                  <strong>PriceOracle</strong> - Provides price feeds for tokens
                  <br />
                  <span className="text-sm text-gray-400">Chainlink integration for accurate pricing</span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                <div>
                  <strong>WETH</strong> - Wrapped Ether implementation
                  <br />
                  <span className="text-sm text-gray-400">Enables ETH trading as ERC-20</span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                <div>
                  <strong>AdvancedERC20</strong> - Enhanced token standard
                  <br />
                  <span className="text-sm text-gray-400">Advanced features for token deployment</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Protocol Specifications */}
      <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
        <h3 className="text-xl font-semibold style={{ color: 'var(--text-primary)' }} mb-4">Protocol Specifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-medium style={{ color: 'var(--text-primary)' }} mb-3">AMM Model</h4>
            <ul className="space-y-2 style={{ color: 'var(--text-secondary)' }}">
              <li>• <strong>Constant Product Formula:</strong> x * y = k</li>
              <li>• <strong>Automated Market Making</strong> for continuous liquidity</li>
              <li>• <strong>Price Discovery</strong> through supply and demand</li>
              <li>• <strong>Slippage Protection</strong> with configurable limits</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-medium style={{ color: 'var(--text-primary)' }} mb-3">Fee Structure</h4>
            <ul className="space-y-2 style={{ color: 'var(--text-secondary)' }}">
              <li>• <strong>Trading Fee:</strong> 0.3% per swap</li>
              <li>• <strong>Protocol Fee:</strong> 0.05% (0.25% to LPs)</li>
              <li>• <strong>Bridge Fee:</strong> Variable based on network</li>
              <li>• <strong>Gas Optimization:</strong> Minimal transaction costs</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Security Features */}
      <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
        <h3 className="text-xl font-semibold style={{ color: 'var(--text-primary)' }} mb-4">Security Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-lg font-medium style={{ color: 'var(--text-primary)' }} mb-2">🔒 Access Control</h4>
            <ul className="text-sm style={{ color: 'var(--text-secondary)' }} space-y-1">
              <li>• Role-based permissions</li>
              <li>• Multi-signature support</li>
              <li>• Timelock mechanisms</li>
              <li>• Ownership renunciation</li>
            </ul>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-lg font-medium style={{ color: 'var(--text-primary)' }} mb-2">🛡️ Protection</h4>
            <ul className="text-sm style={{ color: 'var(--text-secondary)' }} space-y-1">
              <li>• Reentrancy guards</li>
              <li>• Overflow protection</li>
              <li>• Slippage controls</li>
              <li>• Emergency pause</li>
            </ul>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-lg font-medium style={{ color: 'var(--text-primary)' }} mb-2">🔍 Auditing</h4>
            <ul className="text-sm style={{ color: 'var(--text-secondary)' }} space-y-1">
              <li>• Open source code review</li>
              <li>• Community security feedback</li>
              <li>• Internal testing procedures</li>
              <li>• Continuous code quality checks</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Gas Optimization */}
      <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
        <h3 className="text-xl font-semibold style={{ color: 'var(--text-primary)' }} mb-4">Gas Optimization</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-medium style={{ color: 'var(--text-primary)' }} mb-3">Optimization Techniques</h4>
            <ul className="space-y-2 style={{ color: 'var(--text-secondary)' }}">
              <li>• <strong>Batch Operations:</strong> Multiple swaps in single transaction</li>
              <li>• <strong>Gas Estimation:</strong> Accurate cost prediction</li>
              <li>• <strong>Efficient Storage:</strong> Optimized data structures</li>
              <li>• <strong>Minimal External Calls:</strong> Reduced gas consumption</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-medium style={{ color: 'var(--text-primary)' }} mb-3">Network-Specific Optimizations</h4>
            <ul className="space-y-2 style={{ color: 'var(--text-secondary)' }}">
              <li>• <strong>Ethereum:</strong> Layer 2 integration support</li>
              <li>• <strong>Polygon:</strong> Optimized for low gas fees</li>
              <li>• <strong>BSC:</strong> High throughput optimizations</li>
              <li>• <strong>Arbitrum:</strong> Rollup-specific features</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Network Integration */}
      <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
        <h3 className="text-xl font-semibold style={{ color: 'var(--text-primary)' }} mb-4">Network Integration</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-medium style={{ color: 'var(--text-primary)' }} mb-3">Supported Networks</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                <div key={index} className="bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">{network.icon}</div>
                  <div className="style={{ color: 'var(--text-primary)' }} font-medium text-sm">{network.name}</div>
                  <div className="text-gray-400 text-xs">{network.type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Development Tools */}
      <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
        <h3 className="text-xl font-semibold style={{ color: 'var(--text-primary)' }} mb-4">Development Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-medium style={{ color: 'var(--text-primary)' }} mb-3">SDK & Libraries</h4>
            <ul className="space-y-2 style={{ color: 'var(--text-secondary)' }}">
              <li>• <strong>JavaScript SDK:</strong> Easy integration for web apps</li>
              <li>• <strong>React Hooks:</strong> Pre-built components</li>
              <li>• <strong>TypeScript Support:</strong> Full type safety</li>
              <li>• <strong>Web3 Integration:</strong> Wallet connection utilities</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-medium style={{ color: 'var(--text-primary)' }} mb-3">Testing & Deployment</h4>
            <ul className="space-y-2 style={{ color: 'var(--text-secondary)' }}">
              <li>• <strong>Hardhat Integration:</strong> Development framework</li>
              <li>• <strong>Test Suites:</strong> Comprehensive testing</li>
              <li>• <strong>Deployment Scripts:</strong> Automated deployment</li>
              <li>• <strong>Verification Tools:</strong> Contract verification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicalSection; 