import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';

const HelpArticle = () => {
  const { articleId } = useParams();

  // Define all help articles with factual content
  const articles = {
    'connect-wallet': {
      title: 'How to Connect Your Wallet',
      category: 'Getting Started',
      content: `
        <h2>Connecting Your Wallet to boing.finance</h2>
        <p>boing.finance supports multiple wallet types for seamless DeFi interactions across 6 blockchain networks.</p>
        
        <h3>Supported Wallets</h3>
        <ul>
          <li><strong>MetaMask</strong> - Most popular browser wallet</li>
          <li><strong>WalletConnect</strong> - Connect mobile wallets</li>
          <li><strong>Trust Wallet</strong> - Mobile-first wallet</li>
          <li><strong>Coinbase Wallet</strong> - Coinbase's official wallet</li>
        </ul>
        
        <h3>Step-by-Step Connection</h3>
        <ol>
          <li>Click the "Connect Wallet" button in the top-right corner</li>
          <li>Select your preferred wallet from the list</li>
          <li>Approve the connection in your wallet popup</li>
          <li>Choose your desired network (Ethereum, Polygon, Arbitrum, etc.)</li>
        </ol>
        
        <h3>Network Support</h3>
        <p>boing.finance currently supports 6 major networks:</p>
        <ul>
          <li>Ethereum Mainnet</li>
          <li>Polygon</li>
          <li>Arbitrum One</li>
          <li>Optimism</li>
          <li>Base</li>
          <li>BNB Smart Chain</li>
        </ul>
        
        <h3>Troubleshooting</h3>
        <p><strong>If connection fails:</strong></p>
        <ul>
          <li>Ensure your wallet is unlocked</li>
          <li>Check that you're on a supported network</li>
          <li>Try refreshing the page and reconnecting</li>
          <li>Clear browser cache if issues persist</li>
        </ul>
        
        <p><em>Note: As a solo-founder project, we provide direct email support at support@boing.finance if you encounter any issues.</em></p>
      `
    },
    'first-swap': {
      title: 'Making Your First Swap',
      category: 'Getting Started',
      content: `
        <h2>Making Your First Token Swap</h2>
        <p>Learn how to execute your first token swap on boing.finance's cross-chain DEX platform.</p>
        
        <h3>Prerequisites</h3>
        <ul>
          <li>Connected wallet with sufficient balance</li>
          <li>ETH or native tokens for gas fees</li>
          <li>Tokens you want to swap</li>
        </ul>
        
        <h3>Step-by-Step Swap Process</h3>
        <ol>
          <li><strong>Navigate to Swap:</strong> Click "Swap" in the main navigation</li>
          <li><strong>Select Tokens:</strong> Choose the token you want to swap from and to</li>
          <li><strong>Enter Amount:</strong> Input the amount you want to swap</li>
          <li><strong>Review Details:</strong> Check the estimated output and price impact</li>
          <li><strong>Approve Token:</strong> If first time, approve the token for trading</li>
          <li><strong>Execute Swap:</strong> Click "Swap" and confirm in your wallet</li>
        </ol>
        
        <h3>Understanding Swap Details</h3>
        <ul>
          <li><strong>Price Impact:</strong> How your trade affects the token price</li>
          <li><strong>Slippage Tolerance:</strong> Maximum acceptable price movement</li>
          <li><strong>Minimum Received:</strong> Guaranteed minimum tokens you'll receive</li>
        </ul>
        
        <h3>Gas Fees</h3>
        <p>Gas fees vary by network:</p>
        <ul>
          <li><strong>Ethereum:</strong> Higher fees, more secure</li>
          <li><strong>Polygon:</strong> Lower fees, faster transactions</li>
          <li><strong>Arbitrum/Optimism:</strong> L2 scaling solutions with reduced costs</li>
        </ul>
        
        <h3>Best Practices</h3>
        <ul>
          <li>Start with small amounts to test the platform</li>
          <li>Check price impact for large trades</li>
          <li>Set appropriate slippage tolerance</li>
          <li>Ensure sufficient gas for the transaction</li>
        </ul>
      `
    },
    'network-switching': {
      title: 'Switching Between Networks',
      category: 'Getting Started',
      content: `
        <h2>Switching Between Blockchain Networks</h2>
        <p>boing.finance operates across multiple blockchain networks. Learn how to switch between them.</p>
        
        <h3>Supported Networks</h3>
        <p>boing.finance currently supports 6 major blockchain networks:</p>
        <ul>
          <li><strong>Ethereum Mainnet</strong> - Original smart contract platform</li>
          <li><strong>Polygon</strong> - Ethereum scaling solution</li>
          <li><strong>Arbitrum One</strong> - Optimistic rollup for Ethereum</li>
          <li><strong>Optimism</strong> - Layer 2 scaling solution</li>
          <li><strong>Base</strong> - Coinbase's Layer 2 network</li>
          <li><strong>BNB Smart Chain</strong> - Binance's blockchain</li>
        </ul>
        
        <h3>How to Switch Networks</h3>
        <ol>
          <li>Click the network selector in the top navigation</li>
          <li>Choose your desired network from the dropdown</li>
          <li>Approve the network switch in your wallet</li>
          <li>Wait for the network change to complete</li>
        </ol>
        
        <h3>Network-Specific Considerations</h3>
        <ul>
          <li><strong>Ethereum:</strong> Higher gas fees, most liquidity</li>
          <li><strong>Polygon:</strong> Low fees, fast transactions</li>
          <li><strong>Arbitrum/Optimism:</strong> Reduced fees, Ethereum security</li>
          <li><strong>Base:</strong> Coinbase integration, low fees</li>
          <li><strong>BNB Chain:</strong> Fast and cheap transactions</li>
        </ul>
        
        <h3>Cross-Chain Operations</h3>
        <p>boing.finance's bridge feature allows you to move tokens between networks:</p>
        <ul>
          <li>Access the Bridge from the main navigation</li>
          <li>Select source and destination networks</li>
          <li>Choose tokens to bridge</li>
          <li>Follow the bridging process</li>
        </ul>
        
        <h3>Troubleshooting Network Issues</h3>
        <ul>
          <li>Ensure your wallet supports the target network</li>
          <li>Add the network manually if not auto-detected</li>
          <li>Check your wallet's network settings</li>
          <li>Refresh the page after network changes</li>
        </ul>
      `
    },
    'swap-tokens': {
      title: 'How to Swap Tokens',
      category: 'Trading',
      content: `
        <h2>Token Swapping Guide</h2>
        <p>Complete guide to swapping tokens on boing.finance's cross-chain DEX platform.</p>
        
        <h3>Swap Interface Overview</h3>
        <p>The swap interface provides:</p>
        <ul>
          <li>Token selection dropdowns</li>
          <li>Amount input fields</li>
          <li>Real-time price information</li>
          <li>Slippage and deadline settings</li>
          <li>Price impact warnings</li>
        </ul>
        
        <h3>Advanced Swap Features</h3>
        <ul>
          <li><strong>Multi-Route Optimization:</strong> Finds best swap paths</li>
          <li><strong>Slippage Protection:</strong> Set maximum acceptable price movement</li>
          <li><strong>Deadline Setting:</strong> Transaction expiration time</li>
          <li><strong>Price Impact Warning:</strong> Alerts for large trades</li>
        </ul>
        
        <h3>Swap Settings</h3>
        <p>Customize your swap experience:</p>
        <ul>
          <li><strong>Default Slippage:</strong> 0.5% for stablecoins, 1% for others</li>
          <li><strong>Transaction Deadline:</strong> 20 minutes default</li>
          <li><strong>Auto Router:</strong> Automatically finds best routes</li>
        </ul>
        
        <h3>Understanding Fees</h3>
        <ul>
          <li><strong>Trading Fees:</strong> 0.3% per swap (0.25% to liquidity providers, 0.05% to protocol)</li>
          <li><strong>Gas Fees:</strong> Network-specific transaction costs</li>
          <li><strong>Price Impact:</strong> Market impact of your trade size</li>
        </ul>
        
        <h3>Best Practices for Trading</h3>
        <ul>
          <li>Check liquidity before large trades</li>
          <li>Use appropriate slippage tolerance</li>
          <li>Monitor price impact for large swaps</li>
          <li>Consider gas fees when choosing networks</li>
        </ul>
      `
    },
    'liquidity-pools': {
      title: 'Adding and Removing Liquidity',
      category: 'Trading',
      content: `
        <h2>Liquidity Pool Management</h2>
        <p>Learn how to provide liquidity to pools and earn trading fees on boing.finance.</p>
        
        <h3>What are Liquidity Pools?</h3>
        <p>Liquidity pools are collections of tokens that enable automated trading. By providing liquidity, you earn a portion of trading fees.</p>
        
        <h3>Adding Liquidity</h3>
        <ol>
          <li>Navigate to the "Liquidity" section</li>
          <li>Select "Add Liquidity"</li>
          <li>Choose the token pair you want to provide</li>
          <li>Enter the amounts for each token</li>
          <li>Review the pool share you'll receive</li>
          <li>Approve token transfers and add liquidity</li>
        </ol>
        
        <h3>Understanding Pool Shares</h3>
        <ul>
          <li><strong>LP Tokens:</strong> Represent your share of the pool</li>
          <li><strong>Fee Earnings:</strong> Proportional to your pool share</li>
          <li><strong>Impermanent Loss:</strong> Risk of price divergence</li>
        </ul>
        
        <h3>Removing Liquidity</h3>
        <ol>
          <li>Go to "Liquidity" section</li>
          <li>Find your position in the list</li>
          <li>Click "Remove" on your position</li>
          <li>Choose removal percentage</li>
          <li>Confirm the transaction</li>
        </ol>
        
        <h3>Risks and Considerations</h3>
        <ul>
          <li><strong>Impermanent Loss:</strong> Risk when token prices diverge</li>
          <li><strong>Smart Contract Risk:</strong> Potential for bugs or exploits</li>
          <li><strong>Market Risk:</strong> Token prices can decrease</li>
        </ul>
        
        <h3>Fees and Rewards</h3>
        <p>Liquidity providers earn:</p>
        <ul>
          <li>0.25% of all trading fees in the pool</li>
          <li>Proportional to their share of total liquidity</li>
          <li>Automatically added to the pool</li>
        </ul>
      `
    },
    'price-impact': {
      title: 'Understanding Price Impact',
      category: 'Trading',
      content: `
        <h2>Price Impact in Trading</h2>
        <p>Learn about price impact and how it affects your trades on boing.finance.</p>
        
        <h3>What is Price Impact?</h3>
        <p>Price impact is the difference between the current market price and the price you'll receive for your trade, caused by your trade size relative to available liquidity.</p>
        
        <h3>How Price Impact is Calculated</h3>
        <ul>
          <li>Based on available liquidity in the pool</li>
          <li>Larger trades have higher price impact</li>
          <li>Smaller pools are more susceptible to impact</li>
        </ul>
        
        <h3>Price Impact Levels</h3>
        <ul>
          <li><strong>0-0.5%:</strong> Low impact, minimal price movement</li>
          <li><strong>0.5-2%:</strong> Moderate impact, acceptable for most trades</li>
          <li><strong>2-5%:</strong> High impact, consider splitting the trade</li>
          <li><strong>5%+:</strong> Very high impact, significant price movement</li>
        </ul>
        
        <h3>Minimizing Price Impact</h3>
        <ul>
          <li>Split large trades into smaller chunks</li>
          <li>Use pools with higher liquidity</li>
          <li>Trade during high-volume periods</li>
          <li>Consider alternative trading pairs</li>
        </ul>
        
        <h3>Price Impact vs Slippage</h3>
        <ul>
          <li><strong>Price Impact:</strong> Actual price change from your trade</li>
          <li><strong>Slippage Tolerance:</strong> Maximum acceptable price movement</li>
          <li>Price impact should be less than your slippage tolerance</li>
        </ul>
        
        <h3>Best Practices</h3>
        <ul>
          <li>Always check price impact before trading</li>
          <li>Set appropriate slippage tolerance</li>
          <li>Consider the liquidity depth of the pool</li>
          <li>Monitor market conditions before large trades</li>
        </ul>
      `
    },
    'bridge-tokens': {
      title: 'How to Bridge Tokens',
      category: 'Cross-Chain Bridge',
      content: `
        <h2>Cross-Chain Token Bridging</h2>
        <p>Learn how to transfer tokens between different blockchain networks using boing.finance's bridge.</p>
        
        <h3>What is Token Bridging?</h3>
        <p>Token bridging allows you to move tokens from one blockchain network to another, enabling cross-chain DeFi interactions.</p>
        
        <h3>Supported Networks</h3>
        <p>boing.finance supports bridging between:</p>
        <ul>
          <li>Ethereum ↔ Polygon</li>
          <li>Ethereum ↔ Arbitrum One</li>
          <li>Ethereum ↔ Optimism</li>
          <li>Ethereum ↔ Base</li>
          <li>Ethereum ↔ BNB Smart Chain</li>
        </ul>
        
        <h3>How to Bridge Tokens</h3>
        <ol>
          <li>Navigate to the "Bridge" section</li>
          <li>Select source and destination networks</li>
          <li>Choose the token you want to bridge</li>
          <li>Enter the amount to bridge</li>
          <li>Review bridge fees and estimated time</li>
          <li>Approve and initiate the bridge transaction</li>
          <li>Wait for confirmation on both networks</li>
        </ol>
        
        <h3>Bridge Fees and Timeframes</h3>
        <ul>
          <li><strong>Ethereum to L2:</strong> 5-10 minutes, gas fees apply</li>
          <li><strong>L2 to Ethereum:</strong> 7 days challenge period, higher fees</li>
          <li><strong>L2 to L2:</strong> Varies by network, typically faster</li>
        </ul>
        
        <h3>Security Considerations</h3>
        <ul>
          <li>Always verify bridge contracts before use</li>
          <li>Start with small amounts to test</li>
          <li>Ensure you have gas tokens on both networks</li>
          <li>Keep transaction hashes for reference</li>
        </ul>
        
        <h3>Troubleshooting Bridge Issues</h3>
        <ul>
          <li>Check network connectivity</li>
          <li>Verify sufficient gas for transactions</li>
          <li>Contact support if transactions are stuck</li>
          <li>Use transaction explorers to track progress</li>
        </ul>
      `
    },
    'bridge-fees': {
      title: 'Bridge Fees and Timeframes',
      category: 'Cross-Chain Bridge',
      content: `
        <h2>Bridge Fees and Processing Times</h2>
        <p>Understanding the costs and timeframes for cross-chain token bridging on boing.finance.</p>
        
        <h3>Bridge Fee Structure</h3>
        <p>Bridge fees vary based on several factors:</p>
        <ul>
          <li><strong>Network pair:</strong> Different costs for different routes</li>
          <li><strong>Token type:</strong> Some tokens have additional fees</li>
          <li><strong>Transaction size:</strong> Larger amounts may have higher fees</li>
          <li><strong>Network congestion:</strong> Fees increase during high usage</li>
        </ul>
        
        <h3>Typical Fee Ranges</h3>
        <ul>
          <li><strong>Ethereum to Polygon:</strong> $5-15</li>
          <li><strong>Ethereum to Arbitrum:</strong> $8-20</li>
          <li><strong>Ethereum to Optimism:</strong> $10-25</li>
          <li><strong>L2 to L2:</strong> $2-8</li>
        </ul>
        
        <h3>Processing Timeframes</h3>
        <ul>
          <li><strong>Ethereum to L2:</strong> 5-15 minutes</li>
          <li><strong>L2 to Ethereum:</strong> 7 days (challenge period)</li>
          <li><strong>L2 to L2:</strong> 5-30 minutes</li>
          <li><strong>Emergency exits:</strong> Instant (higher fees)</li>
        </ul>
        
        <h3>Factors Affecting Speed</h3>
        <ul>
          <li><strong>Network congestion:</strong> Busy periods take longer</li>
          <li><strong>Challenge periods:</strong> Security delays for L2 exits</li>
          <li><strong>Validator activity:</strong> Bridge validator performance</li>
        </ul>
        
        <h3>Cost Optimization Tips</h3>
        <ul>
          <li>Bridge during off-peak hours</li>
          <li>Use L2 networks for lower fees</li>
          <li>Batch multiple small transfers</li>
          <li>Monitor gas prices before bridging</li>
        </ul>
        
        <h3>Fee Breakdown</h3>
        <p>Bridge fees typically include:</p>
        <ul>
          <li>Network gas fees</li>
          <li>Bridge protocol fees</li>
          <li>Validator rewards</li>
          <li>Security insurance</li>
        </ul>
      `
    },
    'bridge-security': {
      title: 'Bridge Security',
      category: 'Cross-Chain Bridge',
      content: `
        <h2>Cross-Chain Bridge Security</h2>
        <p>Understanding security measures and best practices for safe cross-chain token bridging.</p>
        
        <h3>Security Architecture</h3>
        <p>boing.finance's bridge implements multiple security layers:</p>
        <ul>
          <li><strong>Multi-signature wallets:</strong> Multiple validators required</li>
          <li><strong>Time locks:</strong> Delays for large transactions</li>
          <li><strong>Circuit breakers:</strong> Emergency pause mechanisms</li>
          <li><strong>Audit trails:</strong> Complete transaction logging</li>
        </ul>
        
        <h3>Validator Network</h3>
        <ul>
          <li>Distributed validator network</li>
          <li>Economic incentives for honest behavior</li>
          <li>Slashing mechanisms for malicious actors</li>
          <li>Regular validator rotation</li>
        </ul>
        
        <h3>Smart Contract Security</h3>
        <ul>
          <li>Verified smart contracts on all networks</li>
          <li>Regular security assessments</li>
          <li>Bug bounty program participation</li>
          <li>Upgrade mechanisms with timelocks</li>
        </ul>
        
        <h3>User Security Best Practices</h3>
        <ul>
          <li><strong>Verify URLs:</strong> Always use official boing.finance links</li>
          <li><strong>Check contract addresses:</strong> Verify against official sources</li>
          <li><strong>Start small:</strong> Test with small amounts first</li>
          <li><strong>Keep records:</strong> Save transaction hashes and details</li>
        </ul>
        
        <h3>Risk Factors</h3>
        <ul>
          <li><strong>Smart contract risk:</strong> Potential for bugs or exploits</li>
          <li><strong>Validator risk:</strong> Malicious validator behavior</li>
          <li><strong>Network risk:</strong> Blockchain network issues</li>
          <li><strong>Liquidity risk:</strong> Insufficient bridge liquidity</li>
        </ul>
        
        <h3>Emergency Procedures</h3>
        <ul>
          <li>Bridge can be paused in emergencies</li>
          <li>User funds remain safe during pauses</li>
          <li>Emergency exit mechanisms available</li>
          <li>Contact support for stuck transactions</li>
        </ul>
        
        <p><em>Note: As a solo-founder project, we're actively seeking funding to implement professional security audits and enhance our bridge security measures.</em></p>
      `
    },
    'failed-transactions': {
      title: 'Failed Transactions',
      category: 'Troubleshooting',
      content: `
        <h2>Dealing with Failed Transactions</h2>
        <p>Common causes of failed transactions and how to resolve them on boing.finance.</p>
        
        <h3>Common Causes of Failed Transactions</h3>
        <ul>
          <li><strong>Insufficient gas:</strong> Not enough gas to complete the transaction</li>
          <li><strong>Slippage exceeded:</strong> Price moved beyond your tolerance</li>
          <li><strong>Insufficient balance:</strong> Not enough tokens for the transaction</li>
          <li><strong>Network congestion:</strong> High network usage causing delays</li>
          <li><strong>Smart contract errors:</strong> Issues with the underlying contracts</li>
        </ul>
        
        <h3>Gas-Related Failures</h3>
        <p><strong>Solution:</strong></p>
        <ul>
          <li>Increase gas limit in your wallet settings</li>
          <li>Use higher gas price during congestion</li>
          <li>Try the transaction during off-peak hours</li>
        </ul>
        
        <h3>Slippage-Related Failures</h3>
        <p><strong>Solution:</strong></p>
        <ul>
          <li>Increase slippage tolerance</li>
          <li>Split large trades into smaller chunks</li>
          <li>Trade during higher liquidity periods</li>
        </ul>
        
        <h3>Balance-Related Failures</h3>
        <p><strong>Solution:</strong></p>
        <ul>
          <li>Ensure sufficient token balance</li>
          <li>Account for gas fees in ETH/native tokens</li>
          <li>Check for pending transactions</li>
        </ul>
        
        <h3>Network-Related Failures</h3>
        <p><strong>Solution:</strong></p>
        <ul>
          <li>Wait for network congestion to subside</li>
          <li>Try switching to a different network</li>
          <li>Use Layer 2 solutions for lower fees</li>
        </ul>
        
        <h3>Preventing Failed Transactions</h3>
        <ul>
          <li>Always check gas estimates before confirming</li>
          <li>Set appropriate slippage tolerance</li>
          <li>Monitor network conditions</li>
          <li>Keep sufficient balance for gas fees</li>
        </ul>
        
        <h3>Getting Help</h3>
        <p>If transactions continue to fail:</p>
        <ul>
          <li>Contact support at support@boing.finance</li>
          <li>Provide transaction hash and error details</li>
          <li>Include your wallet address and network</li>
        </ul>
      `
    },
    'high-gas-fees': {
      title: 'High Gas Fees',
      category: 'Troubleshooting',
      content: `
        <h2>Managing High Gas Fees</h2>
        <p>Strategies to reduce and manage gas fees when using boing.finance.</p>
        
        <h3>Understanding Gas Fees</h3>
        <p>Gas fees are the cost of executing transactions on blockchain networks. They vary based on:</p>
        <ul>
          <li><strong>Network congestion:</strong> Higher usage = higher fees</li>
          <li><strong>Transaction complexity:</strong> More operations = more gas</li>
          <li><strong>Gas price settings:</strong> Speed vs cost trade-off</li>
        </ul>
        
        <h3>Gas Fee Optimization Strategies</h3>
        <ul>
          <li><strong>Use Layer 2 networks:</strong> Polygon, Arbitrum, Optimism have lower fees</li>
          <li><strong>Time your transactions:</strong> Trade during off-peak hours</li>
          <li><strong>Batch operations:</strong> Combine multiple actions into one transaction</li>
          <li><strong>Choose optimal gas settings:</strong> Balance speed and cost</li>
        </ul>
        
        <h3>Network-Specific Gas Strategies</h3>
        <ul>
          <li><strong>Ethereum:</strong> Use "slow" or "standard" gas settings</li>
          <li><strong>Polygon:</strong> Very low fees, use for frequent trading</li>
          <li><strong>Arbitrum:</strong> Low fees with Ethereum security</li>
          <li><strong>Optimism:</strong> Reduced fees, good for DeFi activities</li>
        </ul>
        
        <h3>Gas Price Monitoring</h3>
        <ul>
          <li>Check gas tracker websites before trading</li>
          <li>Use wallet gas estimation features</li>
          <li>Monitor network congestion levels</li>
          <li>Set gas price alerts</li>
        </ul>
        
        <h3>Alternative Approaches</h3>
        <ul>
          <li><strong>Limit orders:</strong> Set trades to execute at specific prices</li>
          <li><strong>Batch trading:</strong> Execute multiple trades together</li>
          <li><strong>Layer 2 focus:</strong> Conduct most activities on L2 networks</li>
        </ul>
        
        <h3>When to Pay Higher Gas</h3>
        <ul>
          <li>Time-sensitive arbitrage opportunities</li>
          <li>Large trades where slippage matters more</li>
          <li>Emergency transactions</li>
          <li>High-value DeFi operations</li>
        </ul>
        
        <h3>Tools and Resources</h3>
        <ul>
          <li>Gas tracker websites (GasNow, ETH Gas Station)</li>
          <li>Wallet gas optimization features</li>
          <li>Network-specific gas calculators</li>
          <li>Transaction fee estimators</li>
        </ul>
      `
    },
    'token-not-found': {
      title: 'Token Not Found',
      category: 'Troubleshooting',
      content: `
        <h2>Token Not Showing Up</h2>
        <p>What to do when a token doesn't appear in the boing.finance interface.</p>
        
        <h3>Common Reasons Tokens Don't Appear</h3>
        <ul>
          <li><strong>New token:</strong> Recently launched tokens may not be indexed yet</li>
          <li><strong>Wrong network:</strong> Token exists on a different network</li>
          <li><strong>Low liquidity:</strong> Insufficient trading activity</li>
          <li><strong>Custom token:</strong> Requires manual addition</li>
          <li><strong>Contract issues:</strong> Token contract problems</li>
        </ul>
        
        <h3>Adding Custom Tokens</h3>
        <ol>
          <li>Click on the token selection dropdown</li>
          <li>Look for "Add Custom Token" option</li>
          <li>Enter the token contract address</li>
          <li>Verify token symbol, name, and decimals</li>
          <li>Confirm the token addition</li>
        </ol>
        
        <h3>Finding Token Contract Addresses</h3>
        <ul>
          <li>Check the token's official website</li>
          <li>Use blockchain explorers (Etherscan, etc.)</li>
          <li>Verify through official social media channels</li>
          <li>Cross-reference multiple sources</li>
        </ul>
        
        <h3>Network-Specific Considerations</h3>
        <ul>
          <li><strong>Ethereum:</strong> Most tokens available</li>
          <li><strong>Polygon:</strong> Many Ethereum tokens bridged</li>
          <li><strong>Arbitrum:</strong> Growing token ecosystem</li>
          <li><strong>BSC:</strong> Different token standard (BEP-20)</li>
        </ul>
        
        <h3>Verifying Token Authenticity</h3>
        <ul>
          <li>Check token contract on blockchain explorer</li>
          <li>Verify token supply and decimals</li>
          <li>Confirm token is not a honeypot</li>
          <li>Check for verified contract status</li>
        </ul>
        
        <h3>Getting Help</h3>
        <p>If you can't find or add a token:</p>
        <ul>
          <li>Contact support at support@boing.finance</li>
          <li>Provide token contract address and network</li>
          <li>Include any error messages received</li>
          <li>Share token details (name, symbol, decimals)</li>
        </ul>
        
        <h3>Token Support Requests</h3>
        <p>To request token addition to boing.finance:</p>
        <ul>
          <li>Email: support@boing.finance</li>
          <li>Subject: "Token Addition Request"</li>
          <li>Include: Contract address, network, token details</li>
          <li>Provide: Official website and documentation links</li>
        </ul>
      `
    },
    'wallet-security': {
      title: 'Wallet Security Best Practices',
      category: 'Security',
      content: `
        <h2>Protecting Your Wallet and Funds</h2>
        <p>Essential security practices to keep your wallet and digital assets safe when using boing.finance.</p>
        
        <h3>Wallet Security Fundamentals</h3>
        <ul>
          <li><strong>Never share seed phrases:</strong> Keep recovery phrases private</li>
          <li><strong>Use hardware wallets:</strong> Best security for large amounts</li>
          <li><strong>Enable 2FA:</strong> Two-factor authentication when available</li>
          <li><strong>Regular backups:</strong> Secure backup of wallet data</li>
        </ul>
        
        <h3>Safe Connection Practices</h3>
        <ul>
          <li><strong>Verify URLs:</strong> Always check you're on the official boing.finance site</li>
          <li><strong>Bookmark official site:</strong> Use bookmarks to avoid phishing</li>
          <li><strong>Check SSL certificates:</strong> Ensure secure connections</li>
          <li><strong>Be wary of links:</strong> Don't click suspicious links in emails/DMs</li>
        </ul>
        
        <h3>Transaction Security</h3>
        <ul>
          <li><strong>Double-check addresses:</strong> Verify recipient addresses before sending</li>
          <li><strong>Start small:</strong> Test with small amounts first</li>
          <li><strong>Review transaction details:</strong> Check amounts and fees</li>
          <li><strong>Use trusted networks:</strong> Avoid public WiFi for transactions</li>
        </ul>
        
        <h3>Smart Contract Interactions</h3>
        <ul>
          <li><strong>Verify contracts:</strong> Check contract addresses on explorers</li>
          <li><strong>Understand permissions:</strong> Know what you're approving</li>
          <li><strong>Revoke unused approvals:</strong> Regularly clean up permissions</li>
          <li><strong>Monitor for suspicious activity:</strong> Watch for unexpected transactions</li>
        </ul>
        
        <h3>Recognizing Scams</h3>
        <ul>
          <li><strong>Fake websites:</strong> Check URLs carefully</li>
          <li><strong>Phishing emails:</strong> Don't click links in suspicious emails</li>
          <li><strong>Fake support:</strong> Official support never asks for seed phrases</li>
          <li><strong>Pump and dump schemes:</strong> Be wary of "guaranteed" returns</li>
        </ul>
        
        <h3>Recovery and Backup</h3>
        <ul>
          <li><strong>Secure seed phrase storage:</strong> Use metal backups for important wallets</li>
          <li><strong>Multiple backups:</strong> Store in different secure locations</li>
          <li><strong>Test recovery:</strong> Practice restoring from backup</li>
          <li><strong>Emergency contacts:</strong> Share recovery info with trusted contacts</li>
        </ul>
        
        <h3>boing.finance Security</h3>
        <ul>
          <li>All contracts are verified on blockchain explorers</li>
          <li>No admin keys or backdoors in user funds</li>
          <li>Open source smart contracts</li>
          <li>Regular security assessments planned</li>
        </ul>
        
        <p><em>Note: As a solo-founder project, we're seeking funding to implement professional security audits and enhance platform security measures.</em></p>
      `
    },
    'avoid-scams': {
      title: 'Avoiding Scams and Phishing',
      category: 'Security',
      content: `
        <h2>Protecting Yourself from DeFi Scams</h2>
        <p>How to identify and avoid common scams and phishing attempts in the DeFi space.</p>
        
        <h3>Common DeFi Scams</h3>
        <ul>
          <li><strong>Fake token launches:</strong> Fraudulent token sales</li>
          <li><strong>Rug pulls:</strong> Developers abandoning projects</li>
          <li><strong>Honeypot contracts:</strong> Tokens you can buy but not sell</li>
          <li><strong>Fake airdrops:</strong> Scams disguised as free token distributions</li>
        </ul>
        
        <h3>Phishing Attacks</h3>
        <ul>
          <li><strong>Fake websites:</strong> Sites that look like legitimate platforms</li>
          <li><strong>Malicious links:</strong> Links in emails or messages</li>
          <li><strong>Social engineering:</strong> Manipulation to reveal sensitive info</li>
          <li><strong>Fake support:</strong> Scammers posing as customer service</li>
        </ul>
        
        <h3>Red Flags to Watch For</h3>
        <ul>
          <li><strong>Unrealistic promises:</strong> "Guaranteed" high returns</li>
          <li><strong>Urgency tactics:</strong> Pressure to act quickly</li>
          <li><strong>Poor grammar/spelling:</strong> Unprofessional communication</li>
          <li><strong>Unverified contracts:</strong> No audit or verification</li>
        </ul>
        
        <h3>Protecting Against Phishing</h3>
        <ul>
          <li><strong>Bookmark official sites:</strong> Use bookmarks, not links</li>
          <li><strong>Check URLs carefully:</strong> Look for typos or suspicious domains</li>
          <li><strong>Verify SSL certificates:</strong> Ensure secure connections</li>
          <li><strong>Never share seed phrases:</strong> Legitimate services never ask</li>
        </ul>
        
        <h3>Smart Contract Safety</h3>
        <ul>
          <li><strong>Verify contracts:</strong> Check on blockchain explorers</li>
          <li><strong>Read the code:</strong> Understand what you're interacting with</li>
          <li><strong>Check for audits:</strong> Look for professional security audits</li>
          <li><strong>Start small:</strong> Test with minimal amounts</li>
        </ul>
        
        <h3>Due Diligence Checklist</h3>
        <ul>
          <li>Research the team and project thoroughly</li>
          <li>Check for official social media presence</li>
          <li>Look for community discussions and reviews</li>
          <li>Verify token contract addresses</li>
          <li>Check liquidity and trading volume</li>
        </ul>
        
        <h3>What to Do If Scammed</h3>
        <ul>
          <li>Stop all interactions immediately</li>
          <li>Revoke token approvals if possible</li>
          <li>Report to relevant authorities</li>
          <li>Warn others in the community</li>
          <li>Contact support if it involves boing.finance</li>
        </ul>
        
        <h3>boing.finance Official Channels</h3>
        <ul>
          <li>Website: Always use official boing.finance domain</li>
          <li>Support: support@boing.finance (never share seed phrases)</li>
          <li>No official social media yet (seeking funding for expansion)</li>
        </ul>
      `
    },
    'private-keys': {
      title: 'Protecting Your Private Keys',
      category: 'Security',
      content: `
        <h2>Private Key and Seed Phrase Security</h2>
        <p>Essential practices for protecting your private keys and seed phrases when using DeFi platforms.</p>
        
        <h3>Understanding Private Keys</h3>
        <p>Private keys are cryptographic keys that control access to your wallet and funds. They must be kept secure at all times.</p>
        
        <h3>Seed Phrase Security</h3>
        <ul>
          <li><strong>Never share:</strong> Keep seed phrases completely private</li>
          <li><strong>Physical storage:</strong> Write down, don't store digitally</li>
          <li><strong>Multiple copies:</strong> Store in different secure locations</li>
          <li><strong>Metal backups:</strong> Use fire/water resistant storage</li>
        </ul>
        
        <h3>Best Practices for Storage</h3>
        <ul>
          <li><strong>Avoid screenshots:</strong> Don't save seed phrases as images</li>
          <li><strong>No cloud storage:</strong> Never store in cloud services</li>
          <li><strong>Secure locations:</strong> Use safes or secure storage</li>
          <li><strong>Trusted contacts:</strong> Share with trusted family members</li>
        </ul>
        
        <h3>Hardware Wallet Benefits</h3>
        <ul>
          <li>Private keys never leave the device</li>
          <li>Physical confirmation required for transactions</li>
          <li>Protection against malware and keyloggers</li>
          <li>Best security for significant amounts</li>
        </ul>
        
        <h3>Recognizing Key Theft Attempts</h3>
        <ul>
          <li><strong>Fake support requests:</strong> Never share keys with "support"</li>
          <li><strong>Phishing websites:</strong> Fake sites asking for keys</li>
          <li><strong>Social engineering:</strong> Manipulation to reveal keys</li>
          <li><strong>Malware:</strong> Software that steals keys</li>
        </ul>
        
        <h3>Recovery Planning</h3>
        <ul>
          <li><strong>Test recovery:</strong> Practice restoring from seed phrase</li>
          <li><strong>Emergency contacts:</strong> Share recovery info securely</li>
          <li><strong>Multiple wallets:</strong> Don't put all funds in one wallet</li>
          <li><strong>Regular backups:</strong> Update backups when needed</li>
        </ul>
        
        <h3>Wallet Security Features</h3>
        <ul>
          <li><strong>Password protection:</strong> Strong passwords for wallet access</li>
          <li><strong>Biometric security:</strong> Use fingerprint/face ID when available</li>
          <li><strong>Auto-lock:</strong> Enable automatic wallet locking</li>
          <li><strong>Transaction limits:</strong> Set limits for large transactions</li>
        </ul>
        
        <h3>What Never to Do</h3>
        <ul>
          <li>Never share seed phrases or private keys</li>
          <li>Don't enter keys on suspicious websites</li>
          <li>Avoid storing keys in unencrypted files</li>
          <li>Don't take photos of seed phrases</li>
          <li>Never send keys via email or messaging</li>
        </ul>
        
        <h3>Emergency Procedures</h3>
        <ul>
          <li>If keys are compromised, transfer funds immediately</li>
          <li>Create new wallet with fresh seed phrase</li>
          <li>Update all connected services</li>
          <li>Monitor for unauthorized transactions</li>
        </ul>
      `
    }
  };

  const article = articles[articleId];

  if (!article) {
    return (
      <>
        <Helmet>
          <title>Article Not Found - boing.finance Help Center</title>
        </Helmet>
        <div className="min-h-screen bg-gray-900 style={{ color: 'var(--text-primary)' }}">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
              <p className="text-xl style={{ color: 'var(--text-secondary)' }} mb-8">The requested help article could not be found.</p>
              <Link 
                to="/help-center" 
                className="bg-blue-600 hover:bg-blue-700 style={{ color: 'var(--text-primary)' }} px-6 py-3 rounded-lg transition-colors"
              >
                Return to Help Center
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{article.title} - boing.finance Help Center</title>
        <meta name="description" content={`${article.title} - Help article for boing.finance ${article.category.toLowerCase()}`} />
      </Helmet>
      
      <div className="min-h-screen bg-gray-900 style={{ color: 'var(--text-primary)' }}">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <nav className="mb-8">
              <div className="flex items-center space-x-2 text-sm style={{ color: 'var(--text-tertiary)' }}">
                <Link to="/" className="hover:style={{ color: 'var(--text-primary)' }} transition-colors">Home</Link>
                <span>›</span>
                <Link to="/help-center" className="hover:style={{ color: 'var(--text-primary)' }} transition-colors">Help Center</Link>
                <span>›</span>
                <span className="style={{ color: 'var(--text-primary)' }}">{article.category}</span>
                <span>›</span>
                <span className="style={{ color: 'var(--text-primary)' }}">{article.title}</span>
              </div>
            </nav>

            {/* Article Header */}
            <div className="mb-8">
              <div className="text-sm text-blue-400 mb-2">{article.category}</div>
              <h1 className="text-4xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">{article.title}</h1>
            </div>

            {/* Article Content */}
            <div className="rounded-lg p-8 border mb-8" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div 
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Link 
                to="/help-center" 
                className="bg-gray-700 hover:bg-gray-600 style={{ color: 'var(--text-primary)' }} px-6 py-3 rounded-lg transition-colors"
              >
                ← Back to Help Center
              </Link>
              <Link 
                to="/contact-us" 
                className="bg-blue-600 hover:bg-blue-700 style={{ color: 'var(--text-primary)' }} px-6 py-3 rounded-lg transition-colors"
              >
                Contact Support →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HelpArticle;
