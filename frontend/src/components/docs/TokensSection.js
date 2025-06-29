import React from 'react';

const TokensSection = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-6">Token Management Guide</h2>
        <p className="text-gray-300 text-lg leading-relaxed mb-8">
          Learn how to discover, track, and manage tokens across all supported networks on mochi. 
          From popular tokens to newly launched projects, find everything you need to know about token management.
        </p>
      </div>

      {/* Token Discovery */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6">Token Discovery</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Browse Tokens</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• View trending tokens by volume</li>
              <li>• Filter by network and market cap</li>
              <li>• Sort by price change and volume</li>
              <li>• Search by name, symbol, or address</li>
              <li>• View verified and unverified tokens</li>
            </ul>
          </div>

          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Token Information</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Real-time price and market data</li>
              <li>• Trading volume and liquidity</li>
              <li>• Contract address and verification</li>
              <li>• Token supply and distribution</li>
              <li>• Social links and documentation</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Adding Custom Tokens */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6">Adding Custom Tokens</h3>
        <div className="space-y-6">
          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Step 1: Get Token Address</h4>
            <div className="space-y-3">
              <p className="text-gray-300">1. Find the token's contract address on the blockchain explorer</p>
              <p className="text-gray-300">2. Verify it's the correct token (check symbol and name)</p>
              <p className="text-gray-300">3. Ensure the token is ERC-20 compatible</p>
              <p className="text-gray-300">4. Check if the token has liquidity on the network</p>
            </div>
          </div>

          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Step 2: Add to mochi</h4>
            <div className="space-y-3">
              <p className="text-gray-300">1. Navigate to the Tokens page</p>
              <p className="text-gray-300">2. Click "Add Custom Token"</p>
              <p className="text-gray-300">3. Enter the contract address</p>
              <p className="text-gray-300">4. Verify token details and add to list</p>
            </div>
          </div>

          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Step 3: Start Trading</h4>
            <div className="space-y-3">
              <p className="text-gray-300">1. The token will appear in your token list</p>
              <p className="text-gray-300">2. Check if trading pairs exist</p>
              <p className="text-gray-300">3. Create a trading pair if needed</p>
              <p className="text-gray-300">4. Start trading or providing liquidity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Token Verification */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6">Token Verification</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">✅ Verified Tokens</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Contract source code verified</li>
              <li>• Token metadata confirmed</li>
              <li>• Open source code available</li>
              <li>• Community trust established</li>
              <li>• Regular trading volume</li>
            </ul>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">⚠️ Unverified Tokens</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Contract not verified</li>
              <li>• Limited trading history</li>
              <li>• Higher risk potential</li>
              <li>• Exercise caution</li>
              <li>• Research before trading</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Token Lists */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6">Token Lists and Watchlists</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Default Lists</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• <strong>Popular:</strong> High-volume, well-known tokens</li>
              <li>• <strong>Trending:</strong> Tokens with recent price action</li>
              <li>• <strong>New:</strong> Recently added tokens</li>
              <li>• <strong>Verified:</strong> Open source and verified tokens</li>
              <li>• <strong>Stablecoins:</strong> USD-pegged tokens</li>
            </ul>
          </div>

          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Custom Watchlists</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Create personal token lists</li>
              <li>• Add tokens for easy access</li>
              <li>• Set price alerts</li>
              <li>• Track portfolio favorites</li>
              <li>• Share lists with others</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Token Security */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6">Token Security</h3>
        <div className="space-y-4">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-3">Red Flags to Watch For</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Unverified contract addresses</li>
              <li>• Extremely high APY promises</li>
              <li>• No liquidity or trading volume</li>
              <li>• Suspicious token names or symbols</li>
              <li>• No social media presence</li>
              <li>• Copycat tokens of popular projects</li>
            </ul>
          </div>

          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-3">Security Best Practices</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Always verify contract addresses</li>
              <li>• Check token verification status</li>
              <li>• Research the project team</li>
              <li>• Review tokenomics and distribution</li>
              <li>• Start with small amounts</li>
              <li>• Use hardware wallets for large amounts</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Token Analytics */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6">Token Analytics</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Price Data</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Real-time price feeds</li>
              <li>• Historical price charts</li>
              <li>• Price change percentages</li>
              <li>• Market cap calculations</li>
              <li>• Price alerts</li>
            </ul>
          </div>

          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Trading Metrics</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• 24-hour trading volume</li>
              <li>• Liquidity depth</li>
              <li>• Number of holders</li>
              <li>• Transaction count</li>
              <li>• Market sentiment</li>
            </ul>
          </div>

          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Network Data</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Cross-chain availability</li>
              <li>• Bridge transfer volume</li>
              <li>• Network-specific metrics</li>
              <li>• Gas fee optimization</li>
              <li>• Network health status</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Token Creation */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6">Creating Your Own Token</h3>
        <div className="space-y-6">
          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Token Deployment</h4>
            <div className="space-y-3">
              <p className="text-gray-300">1. Choose the network for deployment</p>
              <p className="text-gray-300">2. Set token name, symbol, and total supply</p>
              <p className="text-gray-300">3. Configure token parameters (decimals, etc.)</p>
              <p className="text-gray-300">4. Deploy the smart contract</p>
              <p className="text-gray-300">5. Verify the contract on block explorer</p>
            </div>
          </div>

          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Creating Trading Pairs</h4>
            <div className="space-y-3">
              <p className="text-gray-300">1. Navigate to the Liquidity page</p>
              <p className="text-gray-300">2. Select your token and a base token (ETH, USDC, etc.)</p>
              <p className="text-gray-300">3. Provide initial liquidity to set the price</p>
              <p className="text-gray-300">4. The trading pair is now live</p>
              <p className="text-gray-300">5. Others can start trading your token</p>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">💡 Tips for Token Creators</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Provide sufficient initial liquidity</li>
              <li>• Set reasonable tokenomics</li>
              <li>• Verify your smart contract</li>
              <li>• Create a clear project roadmap</li>
              <li>• Engage with the community</li>
              <li>• Consider token vesting schedules</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Token Management Tools */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6">Token Management Tools</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Portfolio Tracking</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Track token balances across networks</li>
              <li>• Monitor portfolio performance</li>
              <li>• View profit/loss calculations</li>
              <li>• Set price alerts</li>
              <li>• Export transaction history</li>
            </ul>
          </div>

          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Advanced Features</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Token price comparison</li>
              <li>• Cross-chain arbitrage detection</li>
              <li>• Liquidity analysis tools</li>
              <li>• Token discovery algorithms</li>
              <li>• Market trend analysis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokensSection; 