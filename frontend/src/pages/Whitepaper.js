import React from 'react';
import { Helmet } from 'react-helmet-async';

const Whitepaper = () => {
  return (
    <>
      <Helmet>
        <title>Whitepaper - boing.finance</title>
        <meta name="description" content="Technical whitepaper for boing.finance - Cross-chain decentralized exchange architecture, tokenomics, and roadmap." />
        <meta name="keywords" content="whitepaper, technical documentation, tokenomics, roadmap, cross-chain DEX, boing.finance" />
        <meta property="og:title" content="Whitepaper - boing.finance" />
        <meta property="og:description" content="Technical whitepaper for boing.finance - Cross-chain decentralized exchange architecture, tokenomics, and roadmap." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/whitepaper" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Whitepaper - boing.finance" />
        <meta name="twitter:description" content="Technical whitepaper for boing.finance - Cross-chain DEX architecture and tokenomics." />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                boing.finance Whitepaper
              </h1>
              <p className="text-xl text-gray-300 mb-6">
                Cross-Chain Decentralized Exchange Protocol
              </p>
              <div className="flex justify-center space-x-4 text-sm text-gray-400">
                <span>Version 1.0</span>
                <span>•</span>
                <span>Last Updated: January 2025</span>
              </div>
            </div>

            {/* Table of Contents */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">Table of Contents</h2>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#executive-summary" className="hover:text-blue-400 transition-colors">1. Executive Summary</a></li>
                <li><a href="#introduction" className="hover:text-blue-400 transition-colors">2. Introduction</a></li>
                <li><a href="#technical-architecture" className="hover:text-blue-400 transition-colors">3. Technical Architecture</a></li>
                <li><a href="#cross-chain-bridge" className="hover:text-blue-400 transition-colors">4. Cross-Chain Bridge Protocol</a></li>
                <li><a href="#tokenomics" className="hover:text-blue-400 transition-colors">5. Tokenomics</a></li>
                <li><a href="#governance" className="hover:text-blue-400 transition-colors">6. Governance</a></li>
                <li><a href="#security" className="hover:text-blue-400 transition-colors">7. Security Considerations</a></li>
                <li><a href="#roadmap" className="hover:text-blue-400 transition-colors">8. Development Roadmap</a></li>
                <li><a href="#conclusion" className="hover:text-blue-400 transition-colors">9. Conclusion</a></li>
              </ul>
            </div>

            {/* Executive Summary */}
            <section id="executive-summary" className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-6">1. Executive Summary</h2>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-300 leading-relaxed mb-4">
                  boing.finance is a next-generation decentralized exchange (DEX) protocol designed to facilitate seamless cross-chain trading and liquidity provision across multiple blockchain networks. Our platform addresses the critical need for interoperability in the DeFi ecosystem by providing a unified interface for trading assets across different blockchains.
                </p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  The protocol leverages advanced smart contract technology, automated market maker (AMM) mechanisms, and cross-chain bridge infrastructure to enable users to trade tokens across Ethereum, Polygon, Arbitrum, and other supported networks without the need for centralized intermediaries.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-2">Multi-Chain</div>
                    <div className="text-sm text-gray-300">Support for multiple blockchain networks</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-400 mb-2">AMM</div>
                    <div className="text-sm text-gray-300">Automated market maker protocol</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400 mb-2">Bridge</div>
                    <div className="text-sm text-gray-300">Cross-chain asset transfer</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Introduction */}
            <section id="introduction" className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-6">2. Introduction</h2>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4">Problem Statement</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  The current DeFi landscape is fragmented across multiple blockchain networks, each with its own ecosystem of tokens, liquidity pools, and trading protocols. This fragmentation creates significant barriers for users who want to access assets across different chains, requiring multiple wallets, complex bridging processes, and exposure to various risks.
                </p>
                <h3 className="text-xl font-semibold text-white mb-4 mt-6">Solution Overview</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  boing.finance provides a comprehensive solution through:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                  <li>Unified trading interface across multiple blockchains</li>
                  <li>Automated market maker pools with cross-chain liquidity</li>
                  <li>Secure bridge protocol for asset transfers</li>
                  <li>Advanced analytics and portfolio management tools</li>
                  <li>Token deployment and management capabilities</li>
                </ul>
              </div>
            </section>

            {/* Technical Architecture */}
            <section id="technical-architecture" className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-6">3. Technical Architecture</h2>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4">Core Components</h3>
                
                <div className="space-y-6">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-2">DEX Factory</h4>
                    <p className="text-gray-300 text-sm">
                      The factory contract responsible for creating and managing trading pairs across different networks. Each network has its own factory instance that maintains the registry of all trading pairs.
                    </p>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-2">DEX Pair</h4>
                    <p className="text-gray-300 text-sm">
                      Individual trading pair contracts that implement the constant product AMM formula (x * y = k). Each pair manages liquidity for two specific tokens and handles swap operations.
                    </p>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-2">DEX Router</h4>
                    <p className="text-gray-300 text-sm">
                      The main interface for users to interact with the DEX. Handles swap routing, slippage protection, and ensures optimal trade execution across multiple pairs.
                    </p>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-2">Cross-Chain Bridge</h4>
                    <p className="text-gray-300 text-sm">
                      Smart contracts that facilitate the transfer of assets between different blockchain networks. Implements security measures including multi-signature validation and time locks.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Cross-Chain Bridge */}
            <section id="cross-chain-bridge" className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-6">4. Cross-Chain Bridge Protocol</h2>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4">Bridge Architecture</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  The cross-chain bridge enables seamless asset transfers between supported networks through a combination of smart contracts and validator nodes.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-2">Lock & Mint</h4>
                    <p className="text-gray-300 text-sm">
                      Assets are locked on the source chain and equivalent tokens are minted on the destination chain, maintaining the total supply across networks.
                    </p>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-2">Burn & Release</h4>
                    <p className="text-gray-300 text-sm">
                      When bridging back, tokens are burned on the destination chain and the original assets are released on the source chain.
                    </p>
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-4 mt-6">Security Features</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Multi-signature validator consensus</li>
                  <li>Time-locked bridge operations</li>
                  <li>Emergency pause functionality</li>
                  <li>Cross-chain transaction verification</li>
                  <li>Bridge state monitoring and alerts</li>
                </ul>
              </div>
            </section>

            {/* Tokenomics */}
            <section id="tokenomics" className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-6">5. Tokenomics</h2>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4">BOING Token</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  The BOING token serves as the governance and utility token for the boing.finance ecosystem.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-2">Token Details</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Name: BOING</li>
                      <li>• Symbol: BOING</li>
                      <li>• Total Supply: 100,000,000</li>
                      <li>• Decimals: 18</li>
                      <li>• Network: Multi-chain</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-2">Distribution</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Community Rewards: 40%</li>
                      <li>• Development Fund: 25%</li>
                      <li>• Team & Advisors: 15%</li>
                      <li>• Marketing: 10%</li>
                      <li>• Reserve: 10%</li>
                    </ul>
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-4">Utility</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Governance voting on protocol upgrades</li>
                  <li>Staking rewards for liquidity providers</li>
                  <li>Fee discounts on trading and bridging</li>
                  <li>Access to premium features and analytics</li>
                  <li>Participation in ecosystem governance</li>
                </ul>
              </div>
            </section>

            {/* Governance */}
            <section id="governance" className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-6">6. Governance</h2>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4">DAO Structure</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  boing.finance operates as a decentralized autonomous organization (DAO) where token holders participate in governance decisions.
                </p>
                
                <div className="space-y-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-2">Proposal Types</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Protocol parameter changes</li>
                      <li>• New network integrations</li>
                      <li>• Treasury fund allocation</li>
                      <li>• Security upgrades</li>
                      <li>• Community initiatives</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-2">Voting Mechanism</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• One token, one vote</li>
                      <li>• Minimum quorum requirements</li>
                      <li>• Time-locked execution</li>
                      <li>• Emergency governance procedures</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Security */}
            <section id="security" className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-6">7. Security Considerations</h2>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4">Smart Contract Security</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
                  <li>Reentrancy protection on all external calls</li>
                  <li>Integer overflow/underflow protection</li>
                  <li>Access control mechanisms</li>
                  <li>Emergency pause functionality</li>
                  <li>Comprehensive test coverage</li>
                </ul>
                
                <h3 className="text-xl font-semibold text-white mb-4">Cross-Chain Security</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
                  <li>Multi-signature validator consensus</li>
                  <li>Time-locked bridge operations</li>
                  <li>Cross-chain transaction verification</li>
                  <li>Bridge state monitoring</li>
                  <li>Emergency bridge pause capability</li>
                </ul>
                
                <h3 className="text-xl font-semibold text-white mb-4">Risk Mitigation</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Gradual rollout of new features</li>
                  <li>Bug bounty programs</li>
                  <li>Regular security audits</li>
                  <li>Insurance fund for user protection</li>
                  <li>Community-driven security monitoring</li>
                </ul>
              </div>
            </section>

            {/* Roadmap */}
            <section id="roadmap" className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-6">8. Development Roadmap</h2>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="space-y-6">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-2">Phase 1: Foundation (Q1 2025)</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Core DEX functionality on Ethereum</li>
                      <li>• Basic AMM pools</li>
                      <li>• Token swap interface</li>
                      <li>• Initial liquidity provision</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-2">Phase 2: Expansion (Q2 2025)</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Cross-chain bridge implementation</li>
                      <li>• Polygon and Arbitrum integration</li>
                      <li>• Advanced analytics dashboard</li>
                      <li>• Mobile app development</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-2">Phase 3: Governance (Q3 2025)</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• DAO governance implementation</li>
                      <li>• Token staking and rewards</li>
                      <li>• Additional network integrations</li>
                      <li>• Advanced trading features</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-2">Phase 4: Ecosystem (Q4 2025)</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• DeFi protocol integrations</li>
                      <li>• Institutional features</li>
                      <li>• Advanced cross-chain DeFi tools</li>
                      <li>• Global expansion and partnerships</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Conclusion */}
            <section id="conclusion" className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-6">9. Conclusion</h2>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-300 leading-relaxed mb-4">
                  boing.finance represents a significant step forward in the evolution of decentralized finance by addressing the critical need for cross-chain interoperability. Our comprehensive approach combines advanced smart contract technology with user-friendly interfaces to create a seamless trading experience across multiple blockchain networks.
                </p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Through our commitment to security, transparency, and community governance, we aim to build a robust and sustainable DeFi ecosystem that serves the needs of both retail and institutional users. The protocol's modular architecture ensures scalability and adaptability to future developments in the blockchain space.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  As we continue to develop and expand the boing.finance ecosystem, we invite the broader DeFi community to participate in our journey toward a more interconnected and accessible financial future.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
              <h3 className="text-xl font-semibold text-white mb-4">Get Involved</h3>
              <p className="text-gray-300 mb-4">
                Join the boing.finance community and help shape the future of cross-chain DeFi.
              </p>
              <div className="flex justify-center space-x-4">
                <a href="https://discord.gg/7RDtQtQvBW" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
                  Discord
                </a>
                <a href="https://t.me/boing_finance" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
                  Telegram
                </a>
                <a href="https://twitter.com/boing_finance" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
                  Twitter
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Whitepaper; 