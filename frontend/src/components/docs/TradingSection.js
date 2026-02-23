import React from 'react';

const TradingSection = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Trading Guide</h2>
        <p className=" text-lg leading-relaxed mb-8"
          style={{ color: 'var(--text-secondary)'  }}>
          Learn how to trade tokens on boing.finance with our comprehensive guide. From basic swaps to advanced 
          trading strategies, we'll walk you through everything you need to know to start trading safely and efficiently.
        </p>
      </div>

      {/* Getting Started */}
      <div>
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Getting Started with Trading</h3>
        <div className="space-y-6">
          <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Step 1: Connect Your Wallet</h4>
            <div className="space-y-3">
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>1. Click the "Connect Wallet" button in the top right corner</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>2. Choose your preferred wallet (MetaMask, WalletConnect, etc.)</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>3. Approve the connection request in your wallet</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>4. Ensure you have sufficient native tokens for gas fees</p>
            </div>
          </div>

          <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Step 2: Select Network</h4>
            <div className="space-y-3">
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>1. Use the network selector to choose your desired blockchain</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>2. Consider gas fees and transaction speed when selecting</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>3. Ensure your wallet is connected to the same network</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>4. Switch networks in your wallet if prompted</p>
            </div>
          </div>

          <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Step 3: Choose Trading Pair</h4>
            <div className="space-y-3">
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>1. Select the token you want to trade from (From field)</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>2. Select the token you want to trade to (To field)</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>3. Browse popular tokens or search for specific tokens</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>4. Check if the trading pair has sufficient liquidity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Interface */}
      <div>
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Understanding the Trading Interface</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Input Fields</h4>
            <ul className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
              <li>• <strong>Amount In:</strong> Enter the amount you want to trade</li>
              <li>• <strong>Amount Out:</strong> Shows the expected output (calculated automatically)</li>
              <li>• <strong>Token Selection:</strong> Click to choose different tokens</li>
              <li>• <strong>Balance Display:</strong> Shows your current token balance</li>
            </ul>
          </div>

          <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Trading Details</h4>
            <ul className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
              <li>• <strong>Price Impact:</strong> How much your trade affects the price</li>
              <li>• <strong>Minimum Received:</strong> Worst-case scenario for slippage</li>
              <li>• <strong>Network Fee:</strong> Estimated gas cost for the transaction</li>
              <li>• <strong>Exchange Rate:</strong> Current price ratio between tokens</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Trading Parameters */}
      <div>
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Trading Parameters</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Slippage Tolerance</h4>
            <p className=" mb-3"
          style={{ color: 'var(--text-secondary)'  }}>
              The maximum price movement you're willing to accept during trade execution.
            </p>
            <div className="space-y-2 text-sm "
          style={{ color: 'var(--text-secondary)'  }}>
              <div>• <strong>0.1%:</strong> Very tight (may fail on volatile tokens)</div>
              <div>• <strong>0.5%:</strong> Standard (recommended for most trades)</div>
              <div>• <strong>1.0%:</strong> Loose (for less liquid tokens)</div>
            </div>
          </div>

          <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Gas Settings</h4>
            <p className=" mb-3"
          style={{ color: 'var(--text-secondary)'  }}>
              Control transaction speed and cost by adjusting gas parameters.
            </p>
            <div className="space-y-2 text-sm "
          style={{ color: 'var(--text-secondary)'  }}>
              <div>• <strong>Slow:</strong> Lower cost, longer wait time</div>
              <div>• <strong>Standard:</strong> Balanced cost and speed</div>
              <div>• <strong>Fast:</strong> Higher cost, faster execution</div>
            </div>
          </div>

          <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Deadline</h4>
            <p className=" mb-3"
          style={{ color: 'var(--text-secondary)'  }}>
              Maximum time to wait for transaction confirmation before it expires.
            </p>
            <div className="space-y-2 text-sm "
          style={{ color: 'var(--text-secondary)'  }}>
              <div>• <strong>20 minutes:</strong> Standard deadline</div>
              <div>• <strong>Custom:</strong> Set your own deadline</div>
              <div>• <strong>Auto:</strong> Automatically calculated</div>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Strategies */}
      <div>
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Trading Strategies</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Basic Trading</h4>
            <ul className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
              <li>• Start with small amounts to learn the interface</li>
              <li>• Always check price impact before confirming trades</li>
              <li>• Use standard slippage settings for most trades</li>
              <li>• Keep some native tokens for gas fees</li>
            </ul>
          </div>

          <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Advanced Trading</h4>
            <ul className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
              <li>• Use limit orders for better price control</li>
              <li>• Monitor liquidity depth for large trades</li>
              <li>• Consider gas costs when choosing networks</li>
              <li>• Use cross-chain bridging for arbitrage opportunities</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Common Issues */}
      <div>
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Common Trading Issues</h3>
        <div className="space-y-4">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold  mb-3"
          style={{ color: 'var(--text-primary)'  }}>Transaction Failed</h4>
            <div className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
              <p><strong>Possible causes:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Insufficient gas fees</li>
                <li>Slippage tolerance too low</li>
                <li>Insufficient token balance</li>
                <li>Network congestion</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold  mb-3"
          style={{ color: 'var(--text-primary)'  }}>High Price Impact</h4>
            <div className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
              <p><strong>Solutions:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Reduce trade size</li>
                <li>Check if other DEXs have better liquidity</li>
                <li>Wait for better market conditions</li>
                <li>Consider using limit orders</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold  mb-3"
          style={{ color: 'var(--text-primary)'  }}>Token Not Found</h4>
            <div className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
              <p><strong>Solutions:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Check if token exists on the selected network</li>
                <li>Add token contract address manually</li>
                <li>Verify token contract is legitimate</li>
                <li>Check if token has sufficient liquidity</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div>
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Trading Best Practices</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>✅ Do's</h4>
            <ul className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
              <li>• Always verify token contracts before trading</li>
              <li>• Start with small amounts to test</li>
              <li>• Keep some native tokens for gas fees</li>
              <li>• Use hardware wallets for large amounts</li>
              <li>• Monitor transaction status</li>
              <li>• Check liquidity before trading</li>
            </ul>
          </div>

          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>❌ Don'ts</h4>
            <ul className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
              <li>• Don't trade tokens you don't understand</li>
              <li>• Don't use maximum slippage for large trades</li>
              <li>• Don't share private keys or seed phrases</li>
              <li>• Don't trade without checking gas fees</li>
              <li>• Don't ignore price impact warnings</li>
              <li>• Don't trade on untrusted networks</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingSection; 