import React from 'react';

const BridgeSection = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Cross-Chain Bridge Guide</h2>
        <p className=" text-lg leading-relaxed mb-8"
          style={{ color: 'var(--text-secondary)'  }}>
          Learn how to transfer tokens between different blockchain networks using boing.finance's cross-chain bridge. 
          Our bridge infrastructure enables seamless asset movement across 15+ supported networks.
        </p>
      </div>

      {/* What is Cross-Chain Bridging */}
      <div>
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>What is Cross-Chain Bridging?</h3>
        <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
          <p className=" mb-4"
          style={{ color: 'var(--text-secondary)'  }}>
            Cross-chain bridging allows you to transfer tokens from one blockchain network to another. 
            This enables you to access different DeFi protocols, take advantage of lower gas fees, 
            or participate in network-specific opportunities.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="text-2xl mb-2">🌉</div>
              <h4 className=" font-semibold mb-2"
          style={{ color: 'var(--text-primary)'  }}>Network Transfer</h4>
              <p className=" text-sm"
          style={{ color: 'var(--text-secondary)'  }}>Move tokens between blockchains</p>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl mb-2">🔒</div>
              <h4 className=" font-semibold mb-2"
          style={{ color: 'var(--text-primary)'  }}>Secure</h4>
              <p className=" text-sm"
          style={{ color: 'var(--text-secondary)'  }}>Multi-sig protection and security features</p>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl mb-2">⚡</div>
              <h4 className=" font-semibold mb-2"
          style={{ color: 'var(--text-primary)'  }}>Fast</h4>
              <p className=" text-sm"
          style={{ color: 'var(--text-secondary)'  }}>Optimized for speed and efficiency</p>
            </div>
          </div>
        </div>
      </div>

      {/* How Bridging Works */}
      <div>
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>How Cross-Chain Bridging Works</h3>
        <div className="space-y-6">
          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Step 1: Initiate Transfer</h4>
            <div className="space-y-3">
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>1. Select source network and token</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>2. Choose destination network</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>3. Enter amount to transfer</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>4. Review fees and estimated time</p>
            </div>
          </div>

          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Step 2: Lock and Mint</h4>
            <div className="space-y-3">
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>1. Tokens are locked on source network</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>2. Validators verify the transaction</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>3. Equivalent tokens are minted on destination</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>4. Transaction is recorded on both networks</p>
            </div>
          </div>

          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Step 3: Confirmation</h4>
            <div className="space-y-3">
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>1. Wait for required confirmations</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>2. Receive tokens on destination network</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>3. Transaction hash provided for tracking</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>4. Bridge status updated in real-time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Supported Networks */}
      <div>
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Supported Bridge Routes</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Major Networks</h4>
            <ul className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
              <li>• Ethereum ↔ Polygon</li>
              <li>• Ethereum ↔ Arbitrum</li>
              <li>• Ethereum ↔ Optimism</li>
              <li>• Ethereum ↔ Base</li>
              <li>• Polygon ↔ Arbitrum</li>
              <li>• Polygon ↔ BSC</li>
            </ul>
          </div>

          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Layer 2 Networks</h4>
            <ul className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
              <li>• Arbitrum ↔ Optimism</li>
              <li>• Base ↔ Linea</li>
              <li>• zkSync ↔ Scroll</li>
              <li>• Polygon zkEVM ↔ Arbitrum</li>
              <li>• All L2s ↔ Ethereum</li>
              <li>• Cross-L2 transfers</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bridge Fees */}
      <div>
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Bridge Fees and Costs</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Network Fees</h4>
            <p className=" mb-3"
          style={{ color: 'var(--text-secondary)'  }}>
              Gas fees for transactions on both source and destination networks.
            </p>
            <div className="space-y-2 text-sm "
          style={{ color: 'var(--text-secondary)'  }}>
              <div>• <strong>Source:</strong> Lock/burn transaction</div>
              <div>• <strong>Destination:</strong> Mint transaction</div>
              <div>• <strong>Varies by:</strong> Network congestion</div>
              <div>• <strong>Estimated:</strong> Shown before transfer</div>
            </div>
          </div>

          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Bridge Fees</h4>
            <p className=" mb-3"
          style={{ color: 'var(--text-secondary)'  }}>
              Small percentage fee for bridge infrastructure and maintenance.
            </p>
            <div className="space-y-2 text-sm "
          style={{ color: 'var(--text-secondary)'  }}>
              <div>• <strong>Standard:</strong> 0.1% of transfer amount</div>
              <div>• <strong>Minimum:</strong> $1 equivalent</div>
              <div>• <strong>Maximum:</strong> $50 equivalent</div>
              <div>• <strong>Paid in:</strong> Native tokens</div>
            </div>
          </div>

          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Processing Time</h4>
            <p className=" mb-3"
          style={{ color: 'var(--text-secondary)'  }}>
              Time required for bridge confirmation and token delivery.
            </p>
            <div className="space-y-2 text-sm "
          style={{ color: 'var(--text-secondary)'  }}>
              <div>• <strong>Fast networks:</strong> 2-5 minutes</div>
              <div>• <strong>Standard:</strong> 5-15 minutes</div>
              <div>• <strong>Ethereum:</strong> 10-30 minutes</div>
              <div>• <strong>Peak times:</strong> May be longer</div>
            </div>
          </div>
        </div>
      </div>

      {/* Using the Bridge */}
      <div>
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>How to Use the Bridge</h3>
        <div className="space-y-6">
          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Step 1: Connect and Select</h4>
            <div className="space-y-3">
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>1. Connect your wallet to boing.finance</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>2. Navigate to the Bridge page</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>3. Select source network from dropdown</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>4. Choose destination network</p>
            </div>
          </div>

          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Step 2: Choose Token and Amount</h4>
            <div className="space-y-3">
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>1. Select the token you want to bridge</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>2. Enter the amount to transfer</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>3. Review the exchange rate and fees</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>4. Check your balance and gas fees</p>
            </div>
          </div>

          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Step 3: Confirm and Transfer</h4>
            <div className="space-y-3">
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>1. Review all transaction details</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>2. Confirm the transfer in your wallet</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>3. Wait for source network confirmation</p>
              <p className=""
          style={{ color: 'var(--text-secondary)'  }}>4. Monitor bridge status for completion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bridge Security */}
      <div>
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Bridge Security</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Security Features</h4>
            <ul className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
              <li>• Multi-signature wallet protection</li>
              <li>• Open source smart contracts</li>
              <li>• Validator network consensus</li>
              <li>• Time-lock mechanisms</li>
              <li>• Emergency pause functionality</li>
              <li>• Real-time monitoring</li>
            </ul>
          </div>

          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Risk Mitigation</h4>
            <ul className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
              <li>• Start with small amounts</li>
              <li>• Verify contract addresses</li>
              <li>• Use official bridge only</li>
              <li>• Check network status</li>
              <li>• Keep transaction hashes</li>
              <li>• Monitor bridge health</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <div>
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Troubleshooting Bridge Issues</h3>
        <div className="space-y-4">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold  mb-3"
          style={{ color: 'var(--text-primary)'  }}>Transaction Stuck</h4>
            <div className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
              <p><strong>Possible causes:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Network congestion on source or destination</li>
                <li>Insufficient gas fees</li>
                <li>Bridge validator delays</li>
                <li>Network maintenance</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold  mb-3"
          style={{ color: 'var(--text-primary)'  }}>High Fees</h4>
            <div className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
              <p><strong>Solutions:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Wait for lower gas periods</li>
                <li>Use alternative bridge routes</li>
                <li>Consider Layer 2 networks</li>
                <li>Batch multiple transfers</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold  mb-3"
          style={{ color: 'var(--text-primary)'  }}>Token Not Received</h4>
            <div className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
              <p><strong>Check these:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Verify destination network in wallet</li>
                <li>Check bridge status page</li>
                <li>Contact support with transaction hash</li>
                <li>Ensure sufficient gas for claiming</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div>
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Bridge Best Practices</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>✅ Do's</h4>
            <ul className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
              <li>• Always verify network addresses</li>
              <li>• Start with small test transfers</li>
              <li>• Keep transaction hashes for tracking</li>
              <li>• Check bridge status before transfers</li>
              <li>• Use official bridge interfaces</li>
              <li>• Monitor gas fees and timing</li>
            </ul>
          </div>

          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>❌ Don'ts</h4>
            <ul className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
              <li>• Don't bridge during network maintenance</li>
              <li>• Don't use unofficial bridge interfaces</li>
              <li>• Don't ignore gas fee warnings</li>
              <li>• Don't bridge without checking status</li>
              <li>• Don't lose transaction hashes</li>
              <li>• Don't bridge unknown tokens</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BridgeSection; 