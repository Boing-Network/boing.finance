import React from 'react';
import { Helmet } from 'react-helmet-async';

const ExecutiveSummary = () => {
  return (
    <>
      <Helmet>
        <title>Executive Summary | boing.finance — DeFi on EVM & Solana</title>
        <meta name="description" content="boing.finance executive summary: cross-chain DeFi, token deployment, liquidity, and bridge on EVM and Solana. The DeFi that bounces back." />
        <meta name="keywords" content="cross-chain DeFi, DEX, boing.finance, EVM, Solana, token deployment, liquidity" />
        <meta property="og:title" content="Executive Summary | boing.finance" />
        <meta property="og:description" content="Next-generation cross-chain DeFi platform with live deployment across 6 networks" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/executive-summary" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="boing.finance - Cross-Chain DeFi Infrastructure Platform" />
        <meta name="twitter:description" content="Next-generation cross-chain DeFi platform with live deployment across 6 networks" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
      </Helmet>
      
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                boing.finance
              </h1>
              <div className="text-xl mb-6" style={{ color: 'var(--text-secondary)' }}>
                Executive Summary for Investment Opportunity
              </div>
            </div>

            {/* Investment Overview */}
            <div className="rounded-lg p-8 border mb-8"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-2xl font-bold mb-6"
          style={{ color: 'var(--text-primary)' }}>Investment Opportunity Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Company:</span>
                    <span className="font-semibold"
          style={{ color: 'var(--text-primary)' }}>boing.finance LLC</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Industry:</span>
                    <span className="font-semibold"
          style={{ color: 'var(--text-primary)' }}>DeFi / Cross-Chain Infrastructure</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Funding Goal:</span>
                    <span className="font-semibold"
          style={{ color: 'var(--text-primary)' }}>$200,000 - $500,000</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Token Allocation:</span>
                    <span className="font-semibold"
          style={{ color: 'var(--text-primary)' }}>10-20% of Total Supply</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Token Price:</span>
                    <span className="font-semibold"
          style={{ color: 'var(--text-primary)' }}>$0.10 - $0.25 per token</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Investment Type:</span>
                    <span className="font-semibold"
          style={{ color: 'var(--text-primary)' }}>Token Sale / IDO</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Platform Demo */}
            <div className="rounded-lg p-6 mb-8 border"
          style={{ backgroundColor: 'var(--success-bg)', borderColor: 'var(--success-color)' }}>
              <h3 className="text-xl font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}>🚀 Live Platform Demo</h3>
              <div className="space-y-2">
                <p><strong>Frontend:</strong> <a href="https://boing.finance" target="_blank" rel="noopener noreferrer" className="underline"
          style={{ color: 'var(--success-color)' }}
          onMouseEnter={(e) => e.target.style.color = 'var(--success-hover)'}
          onMouseLeave={(e) => e.target.style.color = 'var(--success-color)'}>https://boing.finance</a></p>
                <p><strong>Backend API:</strong> <a href="https://api.boing.finance" target="_blank" rel="noopener noreferrer" className="underline"
          style={{ color: 'var(--success-color)' }}
          onMouseEnter={(e) => e.target.style.color = 'var(--success-hover)'}
          onMouseLeave={(e) => e.target.style.color = 'var(--success-color)'}>https://api.boing.finance</a></p>
                <p className="text-sm"
          style={{ color: 'var(--success-text)' }}><em>Fully functional cross-chain DeFi platform ready for testing</em></p>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="rounded-lg p-8 border mb-8"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-2xl font-bold mb-6"
          style={{ color: 'var(--text-primary)' }}>Executive Summary</h2>
              <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                boing.finance is a next-generation cross-chain decentralized exchange (DEX) and DeFi infrastructure platform that enables seamless trading, token deployment, and liquidity management across 6+ major blockchain networks. Our platform addresses critical interoperability challenges in the DeFi ecosystem by providing a unified interface for multi-network operations.
              </p>
              
              <div className="rounded-lg p-6 mb-6 border"
          style={{ backgroundColor: 'var(--info-bg)', borderColor: 'var(--info-color)' }}>
                <h3 className="text-lg font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}>Key Highlights</h3>
                <ul className="space-y-2" style={{ color: 'var(--info-text)' }}>
                  <li>✅ <strong>Live Platform</strong> - Fully deployed and functional across 6 networks</li>
                  <li>✅ <strong>Proven Technology</strong> - 17+ smart contracts deployed with zero exploits</li>
                  <li>✅ <strong>Massive Market</strong> - $100B+ DeFi market with 200%+ YoY growth</li>
                  <li>✅ <strong>Solo Founder Achievement</strong> - Built entire platform single-handedly</li>
                  <li>✅ <strong>Ready to Scale</strong> - Platform ready, seeking funding for user acquisition and feature development</li>
                </ul>
              </div>

              {/* Key Innovations */}
              <div className="rounded-lg p-6 mb-6 border"
          style={{ backgroundColor: 'var(--success-bg)', borderColor: 'var(--success-color)' }}>
                <h3 className="text-lg font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}>Key Innovations</h3>
                <ul className="space-y-2" style={{ color: 'var(--success-text)' }}>
                  <li>• <strong>EIP-1167 Minimal Proxy Pattern</strong> - Reduces gas costs by 95%</li>
                  <li>• <strong>Network-Aware Architecture</strong> - Optimized pricing and gas usage per blockchain</li>
                  <li>• <strong>Real-Time Liquidity Aggregation</strong> - Access to best prices across multiple DEXs</li>
                  <li>• <strong>Enterprise Security</strong> - Multi-signature, timelock, anti-bot protection</li>
                </ul>
              </div>
            </div>

            {/* Problem & Solution */}
            <div className="rounded-lg p-8 border mb-8"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-2xl font-bold mb-6"
          style={{ color: 'var(--text-primary)' }}>The Problem We Solve</h2>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                The DeFi ecosystem is highly fragmented, creating significant barriers for users:
              </p>
              <ul className="mb-6 space-y-2" style={{ color: 'var(--text-secondary)' }}>
                <li>• <strong>Fragmented Liquidity</strong> - Users juggle many DEXs across EVM and Solana</li>
                <li>• <strong>High Cross-Chain Fees</strong> - Bridge costs can exceed 5-10% of transaction value</li>
                <li>• <strong>Technical Complexity</strong> - Deploying tokens across networks requires deep technical knowledge</li>
                <li>• <strong>Slow Transactions</strong> - Cross-chain transfers can take hours with current solutions</li>
                <li>• <strong>Capital Inefficiency</strong> - Liquidity locked on individual networks reduces overall efficiency</li>
              </ul>
              
              <h3 className="text-xl font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}>Our Solution</h3>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                boing.finance provides a comprehensive cross-chain DeFi platform featuring:
              </p>
              <ul className="space-y-2" style={{ color: 'var(--text-secondary)' }}>
                <li>• <strong>Cross-Chain Trading</strong> - One interface for EVM and Solana</li>
                <li>• <strong>Token Factory</strong> - One-click token deployment with enterprise security</li>
                <li>• <strong>Liquidity Management</strong> - Advanced AMM pools with yield farming</li>
                <li>• <strong>Cross-Chain Bridge</strong> - Secure, fast, and cost-effective transfers</li>
                <li>• <strong>Analytics Dashboard</strong> - Real-time portfolio tracking on EVM and Solana</li>
              </ul>
            </div>

            {/* Market Opportunity */}
            <div className="rounded-lg p-8 border mb-8"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-2xl font-bold mb-6"
          style={{ color: 'var(--text-primary)' }}>Market Opportunity</h2>
              <div className="rounded-lg p-6 mb-6 border"
          style={{ backgroundColor: 'var(--warning-bg)', borderColor: 'var(--warning-color)' }}>
                <h3 className="text-lg font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}>Total Addressable Market (TAM):</h3>
                <ul className="space-y-2" style={{ color: 'var(--warning-text)' }}>
                  <li>• <strong>DeFi Market:</strong> $100B+ TVL growing 50%+ YoY</li>
                  <li>• <strong>Cross-Chain Volume:</strong> $50B+ annual bridge volume</li>
                  <li>• <strong>Token Deployment:</strong> $1B+ in deployment fees annually</li>
                  <li>• <strong>DEX Trading Volume:</strong> $500B+ monthly across all chains</li>
                </ul>
              </div>
            </div>

            {/* Business Model */}
            <div className="rounded-lg p-8 border mb-8"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-2xl font-bold mb-6"
          style={{ color: 'var(--text-primary)' }}>Business Model & Revenue</h2>
              <h3 className="text-xl font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}>Revenue Streams:</h3>
              <ol className="mb-6 space-y-2" style={{ color: 'var(--text-secondary)' }}>
                <li>1. <strong>Trading Fees</strong> - 0.3% default, 5% platform share</li>
                <li>2. <strong>Token Deployment</strong> - $20-$1,200 per deployment (network-dependent)</li>
                <li>3. <strong>Liquidity Locking</strong> - 1-5% of locked value</li>
                <li>4. <strong>Bridge Fees</strong> - 2-10% of bridged value</li>
                <li>5. <strong>Premium Services</strong> - Analytics, support, custom features</li>
              </ol>
              
              <div className="rounded-lg p-6 border"
          style={{ backgroundColor: 'var(--success-bg)', borderColor: 'var(--success-color)' }}>
                <h3 className="text-lg font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}>Financial Projections:</h3>
                <ul className="space-y-2" style={{ color: 'var(--warning-text)' }}>
                  <li>• <strong>Year 1:</strong> $200K ARR with 50K users</li>
                  <li>• <strong>Year 2:</strong> $2M ARR with 500K users</li>
                  <li>• <strong>Year 3:</strong> $10M ARR with 2M users</li>
                </ul>
              </div>
            </div>

            {/* Injective Integration Potential */}
            <div className="rounded-lg p-8 border mb-8"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-2xl font-bold mb-6"
          style={{ color: 'var(--text-primary)' }}>Injective Integration Potential</h2>
              <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                Our platform is perfectly positioned to integrate with Injective's high-performance blockchain:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg p-6 border"
          style={{ backgroundColor: 'var(--info-bg)', borderColor: 'var(--info-color)' }}>
                  <h3 className="text-lg font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}>Technical Synergy:</h3>
                  <ul className="space-y-2" style={{ color: 'var(--info-text)' }}>
                    <li>• <strong>EVM Compatibility</strong> - Seamless integration with Injective's EVM support</li>
                    <li>• <strong>Cross-Chain Liquidity</strong> - Injective users can access liquidity across all our supported networks</li>
                    <li>• <strong>Performance Benefits</strong> - Injective's fast, low-cost transactions enhance our trading experience</li>
                    <li>• <strong>DeFi Ecosystem</strong> - Our platform complements Injective's derivatives and perpetual markets</li>
                  </ul>
                </div>
                
                <div className="rounded-lg p-6 border"
          style={{ backgroundColor: 'var(--success-bg)', borderColor: 'var(--success-color)' }}>
                  <h3 className="text-lg font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}>Value Proposition for Injective:</h3>
                  <ul className="space-y-2" style={{ color: 'var(--success-text)' }}>
                    <li>• <strong>Unified Trading Experience</strong> - Single interface for cross-chain trading</li>
                    <li>• <strong>Liquidity Aggregation</strong> - Access to deeper liquidity pools across networks</li>
                    <li>• <strong>Token Deployment</strong> - Easy token creation for Injective ecosystem projects</li>
                    <li>• <strong>Cross-Chain Bridge</strong> - Seamless asset transfers to/from Injective</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Current Status */}
            <div className="rounded-lg p-8 border mb-8"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-2xl font-bold mb-6"
          style={{ color: 'var(--text-primary)' }}>Current Status & Development Achievements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg p-6 border"
          style={{ backgroundColor: 'var(--success-bg)', borderColor: 'var(--success-color)' }}>
                  <h3 className="text-lg font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}>Technical Achievements:</h3>
                  <ul className="space-y-2" style={{ color: 'var(--warning-text)' }}>
                    <li>✅ <strong>EVM & Solana</strong> - Deployed across supported EVM chains and Solana</li>
                    <li>✅ <strong>17+ Smart Contracts</strong> - All verified (no professional audits conducted)</li>
                    <li>✅ <strong>Live Platform</strong> - Fully functional on EVM and Solana</li>
                    <li>✅ <strong>Zero Exploits</strong> - No security incidents or vulnerabilities</li>
                  </ul>
                </div>
                
                <div className="rounded-lg p-6 border"
          style={{ backgroundColor: 'var(--error-bg)', borderColor: 'var(--error-color)' }}>
                  <h3 className="text-lg font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}>Current Limitations:</h3>
                  <ul className="space-y-2" style={{ color: 'var(--warning-text)' }}>
                    <li>• <strong>No Active User Base</strong> - Platform is live but lacks marketing and user acquisition</li>
                    <li>• <strong>Limited Features</strong> - Core functionality deployed, advanced features on hold due to funding</li>
                    <li>• <strong>Solo Development</strong> - All development done by single founder, limiting feature velocity</li>
                    <li>• <strong>No Marketing Budget</strong> - Unable to invest in user acquisition or community building</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Team */}
            <div className="rounded-lg p-8 border mb-8"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-2xl font-bold mb-6"
          style={{ color: 'var(--text-primary)' }}>Team & Expertise</h2>
              <div className="rounded-lg p-6 border"
          style={{ backgroundColor: 'var(--info-bg)', borderColor: 'var(--info-color)' }}>
                <h3 className="text-lg font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}>Founder & CEO:</h3>
                <ul className="space-y-2" style={{ color: 'var(--warning-text)' }}>
                  <li>• <strong>Full-Stack Developer</strong> - Experienced developer with strong technical background</li>
                  <li>• <strong>Solo Development Achievement</strong> - Built entire cross-chain platform single-handedly</li>
                  <li>• <strong>Technical Expertise</strong> - Smart contracts, frontend, backend, DevOps, and infrastructure</li>
                  <li>• <strong>Product Vision</strong> - Deep understanding of DeFi user needs and market opportunities</li>
                </ul>
                
                <h3 className="text-lg font-bold mb-4 mt-6" style={{ color: 'var(--text-primary)' }}>Technical Credentials:</h3>
                <ul className="space-y-2" style={{ color: 'var(--info-text)' }}>
                  <li>• 17+ smart contracts deployed across 6 networks</li>
                  <li>• Zero security incidents or exploits</li>
                  <li>• 99.9% uptime across all infrastructure</li>
                  <li>• Full-stack development expertise (React, Node.js, Solidity, Cloudflare Workers)</li>
                  <li>• Successfully deployed and maintained live production platform</li>
                  <li>• <strong>Note:</strong> No professional smart contract audits have been conducted</li>
                </ul>
              </div>
            </div>

            {/* Use of Funds */}
            <div className="rounded-lg p-8 border mb-8"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-2xl font-bold mb-6"
          style={{ color: 'var(--text-primary)' }}>Use of Funds (Token Sale Proceeds)</h2>
              <ul className="space-y-3" style={{ color: 'var(--text-secondary)' }}>
                <li>• <strong>Development Team (50% - $100K-250K)</strong> - Hire 1-2 specialized blockchain developers, mobile app development, advanced feature development</li>
                <li>• <strong>Marketing & Growth (30% - $60K-150K)</strong> - User acquisition campaigns, community building, strategic partnerships, token listing</li>
                <li>• <strong>Infrastructure & Security (15% - $30K-75K)</strong> - Professional security audits, infrastructure scaling, monitoring tools</li>
                <li>• <strong>Operations & Legal (5% - $10K-25K)</strong> - Business development, legal and regulatory compliance, token distribution</li>
              </ul>
            </div>

            {/* Risk Assessment */}
            <div className="rounded-lg p-8 border mb-8"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-2xl font-bold mb-6"
          style={{ color: 'var(--text-primary)' }}>Risk Assessment & Mitigation</h2>
              <div className="rounded-lg p-6 border"
          style={{ backgroundColor: 'var(--error-bg)', borderColor: 'var(--error-color)' }}>
                <h3 className="text-lg font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}>Key Risks:</h3>
                <ul className="space-y-2" style={{ color: 'var(--warning-text)' }}>
                  <li>• <strong>Technical Risks:</strong> Professional security audits planned (currently none conducted)</li>
                  <li>• <strong>Market Risks:</strong> Diversified revenue streams, conservative financial planning</li>
                  <li>• <strong>Operational Risks:</strong> Solo founder dependency, funding requirements</li>
                </ul>
              </div>
            </div>

            {/* Investment Terms */}
            <div className="rounded-lg p-8 border mb-8"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-2xl font-bold mb-6"
          style={{ color: 'var(--text-primary)' }}>Investment Terms</h2>
              <div className="rounded-lg p-6 border"
          style={{ backgroundColor: 'var(--secondary-bg)', borderColor: 'var(--secondary-color)' }}>
                <ul className="space-y-2" style={{ color: 'var(--warning-text)' }}>
                  <li>• <strong>Amount:</strong> $200K - $500K</li>
                  <li>• <strong>Token Allocation:</strong> 10-20% of Total Supply</li>
                  <li>• <strong>Token Price:</strong> $0.10 - $0.25 per token</li>
                  <li>• <strong>Investment Type:</strong> Token Sale / IDO (Initial Decentralized Offering)</li>
                </ul>
              </div>
            </div>

            {/* Why Injective Builder Catalyst */}
            <div className="rounded-lg p-8 border mb-8"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-2xl font-bold mb-6"
          style={{ color: 'var(--text-primary)' }}>Why Injective Builder Catalyst</h2>
              
              <div className="rounded-lg p-6 mb-6 border"
          style={{ backgroundColor: 'var(--info-bg)', borderColor: 'var(--info-color)' }}>
                <h3 className="text-lg font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}>Perfect Alignment:</h3>
                <ul className="space-y-2" style={{ color: 'var(--info-text)' }}>
                  <li>• <strong>EVM-Compatible DeFi Protocol</strong> - Exactly what the program targets</li>
                  <li>• <strong>Early Traction</strong> - Live platform with deployed contracts</li>
                  <li>• <strong>Cross-Chain Focus</strong> - Aligns with Injective's interoperability goals</li>
                  <li>• <strong>Technical Innovation</strong> - EIP-1167 proxy pattern and network-aware architecture</li>
                  <li>• <strong>Growth Potential</strong> - Ready to scale with proper funding and mentorship</li>
                </ul>
              </div>

              <div className="rounded-lg p-6 border"
          style={{ backgroundColor: 'var(--success-bg)', borderColor: 'var(--success-color)' }}>
                <h3 className="text-lg font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}>Program Benefits:</h3>
                <ul className="space-y-2" style={{ color: 'var(--success-text)' }}>
                  <li>• <strong>Technical Integration Support</strong> - Perfect for Injective blockchain integration</li>
                  <li>• <strong>Mentorship</strong> - Guidance on scaling cross-chain DeFi platform</li>
                  <li>• <strong>Ecosystem Access</strong> - Connect with Injective's growing DeFi community</li>
                  <li>• <strong>Investment</strong> - $200k funding to accelerate development</li>
                </ul>
              </div>
            </div>

            {/* Why Invest Now */}
            <div className="rounded-lg p-8 border mb-8"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-2xl font-bold mb-6"
          style={{ color: 'var(--text-primary)' }}>Why Invest Now</h2>
              <div className="rounded-lg p-6 border"
          style={{ backgroundColor: 'var(--success-bg)', borderColor: 'var(--success-color)' }}>
                <ul className="space-y-2" style={{ color: 'var(--warning-text)' }}>
                  <li>🚀 <strong>Early Stage Opportunity</strong> - Maximum growth potential in expanding market</li>
                  <li>💎 <strong>Proven Technology</strong> - Live platform with demonstrated functionality</li>
                  <li>🔥 <strong>Ready to Scale</strong> - Platform ready, seeking funding for user acquisition</li>
                  <li>🌐 <strong>Massive Market</strong> - $100B+ TAM with 200%+ YoY growth</li>
                  <li>🛡️ <strong>Risk Mitigation</strong> - Comprehensive risk management planned</li>
                </ul>
              </div>
            </div>

            {/* Contact Information */}
            <div className="rounded-lg p-8 border mb-8"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-2xl font-bold mb-6"
          style={{ color: 'var(--text-primary)' }}>Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Investment Contact:</span>
                    <span className="font-semibold"
          style={{ color: 'var(--text-primary)' }}>invest@boing.finance</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Live Platform:</span>
                    <span className="font-semibold"
          style={{ color: 'var(--text-primary)' }}>https://boing.finance</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>API Endpoint:</span>
                    <span className="font-semibold"
          style={{ color: 'var(--text-primary)' }}>https://api.boing.finance</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Legal Entity:</span>
                    <span className="font-semibold"
          style={{ color: 'var(--text-primary)' }}>boing.finance LLC (Florida, EIN acquired)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm"
          style={{ color: 'var(--text-tertiary)' }}>
              <p><em>This executive summary contains forward-looking statements and projections. Past performance does not guarantee future results. Investment involves risk of loss. Please review all documentation and conduct your own due diligence before investing.</em></p>
              <p className="mt-4"><strong>boing.finance LLC | Florida | EIN Acquired | Compliance in Progress</strong></p>
              <p className="mt-2 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                <em>Ready to build the future of cross-chain DeFi on Injective?</em>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExecutiveSummary;
