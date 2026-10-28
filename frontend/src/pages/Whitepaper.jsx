import React from 'react';
import { Helmet } from 'react-helmet-async';

const Whitepaper = () => {
  return (
    <>
      <Helmet>
        <title>Whitepaper | Boing Finance — Architecture, Tokenomics & Status</title>
        <meta name="description" content="Boing Finance overview: cross-chain DEX architecture, bridge path, tokenomics pointers, and current status." />
        <meta name="keywords" content="whitepaper, tokenomics, cross-chain DEX, Boing Finance, Boing Network, EVM, Solana" />
        <meta property="og:title" content="Whitepaper | Boing Finance" />
        <meta property="og:description" content="Overview of Boing Finance: cross-chain DEX architecture, bridge path, and current status." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/whitepaper" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Whitepaper - Boing Finance" />
        <meta name="twitter:description" content="Overview of Boing Finance - cross-chain DEX architecture and status." />
      </Helmet>
      
      <div className="relative w-full min-w-0" style={{ color: 'var(--text-primary)' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Boing Finance Whitepaper
              </h1>
              <p className="text-xl mb-6" style={{ color: 'var(--text-secondary)' }}>
                Cross-chain DeFi interface
              </p>
              <div className="flex justify-center space-x-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                <span>Version 1.1</span>
                <span>•</span>
                <span>Last Updated: October 2026</span>
              </div>
            </div>

            {/* Table of Contents */}
            <div className="rounded-lg p-6 mb-8 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Table of Contents</h2>
              <ul className="space-y-2" style={{ color: 'var(--text-secondary)' }}>
                <li><a href="#executive-summary" className="hover:text-blue-400 transition-colors">1. Executive Summary</a></li>
                <li><a href="#introduction" className="hover:text-blue-400 transition-colors">2. Introduction</a></li>
                <li><a href="#technical-architecture" className="hover:text-blue-400 transition-colors">3. Technical Architecture</a></li>
                <li><a href="#cross-chain-bridge" className="hover:text-blue-400 transition-colors">4. Cross-Chain Bridge Protocol</a></li>
                <li><a href="#tokenomics" className="hover:text-blue-400 transition-colors">5. Tokenomics</a></li>
                <li><a href="#governance" className="hover:text-blue-400 transition-colors">6. Governance</a></li>
                <li><a href="#security" className="hover:text-blue-400 transition-colors">7. Security Considerations</a></li>
                <li><a href="#roadmap" className="hover:text-blue-400 transition-colors">8. Status & Direction</a></li>
                <li><a href="#conclusion" className="hover:text-blue-400 transition-colors">9. Conclusion</a></li>
              </ul>
            </div>

            {/* Executive Summary */}
            <section id="executive-summary" className="mb-12">
              <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>1. Executive Summary</h2>
              <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <p className="leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Boing Finance is a cross-chain DeFi interface for trading and liquidity on EVM networks and Solana, with native support for Boing Network L1. One interface for swaps, bridge routes, and token deployment.
                </p>
                <p className="leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                  AMM-based swaps, aggregator-powered bridge routes, and token deployment. Boing Network is on a public testnet; mainnet is not live and independent audits are not complete.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    <div className="text-2xl font-bold text-blue-400 mb-2">Multi-Chain</div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>EVM & Solana support</div>
                  </div>
                  <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    <div className="text-2xl font-bold text-green-400 mb-2">AMM</div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Automated market maker protocol</div>
                  </div>
                  <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    <div className="text-2xl font-bold text-purple-400 mb-2">Bridge</div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cross-chain asset transfer</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Introduction */}
            <section id="introduction" className="mb-12">
              <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>2. Introduction</h2>
              <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Problem Statement</h3>
                <p className="leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                  DeFi is fragmented across chains: different wallets, bridges, and UIs. Boing Finance unifies access on EVM and Solana.
                </p>
                <h3 className="text-xl font-semibold mb-4 mt-6" style={{ color: 'var(--text-primary)' }}>Solution Overview</h3>
                <p className="leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Boing Finance works toward this through:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4" style={{ color: 'var(--text-secondary)' }}>
                  <li>Unified trading on EVM and Solana</li>
                  <li>Automated market maker pools</li>
                  <li>Bridge routes through an external aggregator (LI.FI)</li>
                  <li>Analytics and portfolio tools</li>
                  <li>Token deployment and management</li>
                </ul>
              </div>
            </section>

            {/* Technical Architecture */}
            <section id="technical-architecture" className="mb-12">
              <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>3. Technical Architecture</h2>
              <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Core Components</h3>
                
                <div className="space-y-6">
                  <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>DEX Factory</h4>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      The factory contract responsible for creating and managing trading pairs. Each network where it is deployed has its own factory instance and pair registry. See the contract docs for which networks are enabled.
                    </p>
                  </div>
                  
                  <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>DEX Pair</h4>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Individual trading pair contracts that implement the constant product AMM formula (x * y = k). Each pair manages liquidity for two specific tokens and handles swap operations.
                    </p>
                  </div>
                  
                  <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>DEX Router</h4>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      The main interface for users to interact with the DEX. Handles swap routing, slippage protection, and ensures optimal trade execution across multiple pairs.
                    </p>
                  </div>
                  
                  <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Cross-Chain Bridge</h4>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Live product path is an external aggregator (LI.FI) with a 0.5% platform fee. A proprietary lock/mint bridge is not what the app runs today.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Cross-Chain Bridge */}
            <section id="cross-chain-bridge" className="mb-12">
              <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>4. Cross-Chain Bridge Protocol</h2>
              <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Bridge Architecture</h3>
                <p className="leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                  The live Bridge page on Boing Finance is aggregator-powered (LI.FI). Users sign a source-chain transaction; destination liquidity belongs to those third-party routes. Boing does not hold bridge inventory. A 0.5% integrator fee is included in the quote.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>What ships today</h4>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      In-app LI.FI quotes and execution for EVM↔EVM (plus a Jumper/LI.FI deep link). Solana↔EVM and Boing L1↔EVM are out of this UI.
                    </p>
                  </div>
                  
                  <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>What is not live</h4>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      A Boing-operated CrossChainBridge with validators, lock-and-release inventory, or a native L1 light-client bridge. Those remain optional / protocol work.
                    </p>
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold mb-4 mt-6" style={{ color: 'var(--text-primary)' }}>Trust model (live path)</h3>
                <ul className="list-disc list-inside space-y-2" style={{ color: 'var(--text-secondary)' }}>
                  <li>You trust LI.FI routing plus the underlying bridge/DEX the quote selects</li>
                  <li>Boing takes a 0.5% platform fee via LI.FI integrator fees (portal-configured wallet)</li>
                  <li>Users pay source-chain gas; no Boing relayer is required</li>
                </ul>
              </div>
            </section>

            {/* Tokenomics */}
            <section id="tokenomics" className="mb-12">
              <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>5. Tokenomics</h2>
              <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>BOING is the Boing Network L1 token</h3>
                <p className="leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                  BOING is the native token of Boing Network, the Layer 1. Its supply, emission and fee economics are defined by the protocol, not by Boing Finance. This app uses BOING on Boing L1; it does not issue it, sell it, or govern it.
                </p>
                <p className="leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                  This page does not publish a supply, allocation table, or sale terms. Read the protocol sources instead:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4" style={{ color: 'var(--text-secondary)' }}>
                  <li><a href="https://github.com/Boing-Network/boing.network/blob/main/docs/BOING-BLOCKCHAIN-DESIGN-PLAN.md#boing-tokenomics--sustainable-value-design" className="text-blue-400 hover:text-blue-300 transition-colors" target="_blank" rel="noopener noreferrer">BOING Tokenomics: Sustainable Value Design</a> (design narrative in the boing.network repo)</li>
                  <li><a href="https://github.com/Boing-Network/boing.network/tree/main/crates/boing-tokenomics" className="text-blue-400 hover:text-blue-300 transition-colors" target="_blank" rel="noopener noreferrer">crates/boing-tokenomics</a> (protocol constants)</li>
                  <li><a href="https://github.com/Boing-Network/boing.network/blob/main/docs/NATIVE-DENOMINATION.md" className="text-blue-400 hover:text-blue-300 transition-colors" target="_blank" rel="noopener noreferrer">Native denomination</a> (18-decimal base units, fees, emission)</li>
                  <li><a href="https://github.com/Boing-Network/boing.finance/blob/main/docs/boing-tokenomics.md" className="text-blue-400 hover:text-blue-300 transition-colors" target="_blank" rel="noopener noreferrer">Boing Finance tokenomics note</a></li>
                </ul>
                <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-200 text-sm">
                    <strong>Not the same token:</strong> an ERC-20 named "BOING" on an EVM chain may have been deployed through this app's token factory. Anyone can deploy a token with any name, so that is not the Boing Network L1 token.
                  </p>
                </div>
              </div>
            </section>

            {/* Governance */}
            <section id="governance" className="mb-12">
              <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>6. Governance</h2>
              <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Status</h3>
                <p className="leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Boing Finance has no deployed on-chain governance. The repository contains governance and staking contract sources (see <code>contracts/GOVERNANCE_CONTRACTS.md</code>), but they are not deployed and no voting or staking is live in the app.
                </p>
                <p className="leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Protocol-level decisions for Boing Network L1 belong to the network and are documented in the boing.network repository.
                </p>
              </div>
            </section>

            {/* Security */}
            <section id="security" className="mb-12">
              <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>7. Security Considerations</h2>
              <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-200 text-sm">
                    <strong>Audit status:</strong> the contracts have been reviewed internally only. Independent audits are not complete. Treat everything here as experimental and do not use funds you cannot afford to lose.
                  </p>
                </div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Smart contracts</h3>
                <ul className="list-disc list-inside space-y-2 mb-4" style={{ color: 'var(--text-secondary)' }}>
                  <li>Reentrancy guards and access control on the contract sources in this repository</li>
                  <li>Internal review notes in <code>contracts/CONTRACTS_AUDIT.md</code>; not a third-party audit</li>
                </ul>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Bridge</h3>
                <ul className="list-disc list-inside space-y-2 mb-4" style={{ color: 'var(--text-secondary)' }}>
                  <li>The live path is the LI.FI aggregator, so you also rely on LI.FI routing and the bridge or DEX each quote selects</li>
                  <li>Boing does not run validators or hold bridge inventory</li>
                  <li>Always check the route, amounts and fees in your wallet before signing</li>
                </ul>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Responsible disclosure</h3>
                <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Found a vulnerability? Please report it privately through the <a href="/bug-report" className="text-blue-400 hover:text-blue-300 transition-colors">bug report page</a> or by email to support@boing.finance instead of posting it publicly.
                </p>
              </div>
            </section>

            {/* Roadmap */}
            <section id="roadmap" className="mb-12">
              <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>8. Status & Direction</h2>
              <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-200 text-sm">
                    <strong>Current status:</strong> Boing Network is on a public testnet (chain ID 6913). Mainnet is not live. Independent audits are not complete. Boing Finance is under active development and this page gives no dates.
                  </p>
                </div>
                <div className="space-y-6">
                  <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>What the app does today</h4>
                    <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                      <li>• Swap, pools and token deployment on supported EVM networks (see the contract docs for which networks are enabled)</li>
                      <li>• Cross-chain routes through the LI.FI aggregator</li>
                      <li>• Native swap and liquidity on Boing L1 testnet through Boing Express</li>
                    </ul>
                  </div>
                  <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Direction</h4>
                    <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                      <li>• Follow the Boing L1 testnet and its DEX and discovery RPCs</li>
                      <li>• Independent security audits before any mainnet use</li>
                      <li>• Further analytics and portfolio tooling</li>
                    </ul>
                  </div>
                  <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Limitations</h4>
                    <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                      <li>• Small team, so feature velocity is limited</li>
                      <li>• No independent audit yet</li>
                      <li>• Some features are enabled only on testnets</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Conclusion */}
            <section id="conclusion" className="mb-12">
              <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>9. Conclusion</h2>
              <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <p className="leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Boing Finance aims to make cross-chain DeFi simpler: one interface for swaps, liquidity, bridging through an aggregator, and token deployment on EVM networks and Boing L1.
                </p>
                <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  We would rather be clear about what works today than overpromise. For the current state of contracts and networks, see the repository docs.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <div className="rounded-lg p-6 border text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Get Involved</h3>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                Questions, feedback or bug reports are welcome.
              </p>
              <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-200 text-sm">
                  <strong>Note:</strong> Support is by email and the contact form.
                </p>
              </div>
              <div className="flex justify-center space-x-4">
                <a href="mailto:support@boing.finance" className="text-blue-400 hover:text-blue-300 transition-colors">
                  📧 Email Support
                </a>
                <a href="mailto:invest@boing.finance" className="text-blue-400 hover:text-blue-300 transition-colors">
                  💼 Investment Inquiries
                </a>
                <a href="/contact-us" className="text-blue-400 hover:text-blue-300 transition-colors">
                  💬 Contact Form
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