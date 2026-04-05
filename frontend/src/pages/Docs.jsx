import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';

// Import all section components
import OverviewSection from '../components/docs/OverviewSection';
import FeaturesSection from '../components/docs/FeaturesSection';
import NetworksSection from '../components/docs/NetworksSection';
import TradingSection from '../components/docs/TradingSection';
import LiquiditySection from '../components/docs/LiquiditySection';
import BridgeSection from '../components/docs/BridgeSection';
import TokensSection from '../components/docs/TokensSection';
import AnalyticsSection from '../components/docs/AnalyticsSection';
import PortfolioSection from '../components/docs/PortfolioSection';
import SmartContractsSection from '../components/docs/SmartContractsSection';
import TechnicalSection from '../components/docs/TechnicalSection';
import APISection from '../components/docs/APISection';
import SecuritySection from '../components/docs/SecuritySection';
import FAQSection from '../components/docs/FAQSection';
import GovernanceSection from '../components/docs/GovernanceSection';
import BoingSection from '../components/docs/BoingSection';


const Docs = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Overview', icon: '📖' },
    { id: 'features', title: 'Features', icon: '🚀' },
    { id: 'networks', title: 'Supported Networks', icon: '🌐' },
    { id: 'contracts', title: 'Smart Contracts', icon: '📜' },
    { id: 'trading', title: 'Trading Guide', icon: '💱' },
    { id: 'liquidity', title: 'Liquidity Provision', icon: '💧' },
    { id: 'bridge', title: 'Cross-Chain Bridge', icon: '🌉' },
    { id: 'tokens', title: 'Token Management', icon: '🪙' },
    { id: 'analytics', title: 'Analytics & Data', icon: '📊' },
    { id: 'portfolio', title: 'Portfolio Management', icon: '💼' },
    { id: 'governance', title: 'Governance', icon: '📜' },
    { id: 'boing', title: 'BOING Ecosystem', icon: '🎯' },
    { id: 'technical', title: 'Technical Specs', icon: '⚙️' },
    { id: 'api', title: 'API Reference', icon: '🔌' },
    { id: 'security', title: 'Security', icon: '🔒' },
    { id: 'faq', title: 'FAQ', icon: '❓' }
  ];

  return (
    <>
      <Helmet>
        <title>Documentation | boing.finance — Guides for Swap, Liquidity, Bridge & Deploy</title>
        <meta name="description" content="Learn how to use boing.finance. Docs for swap, liquidity, bridge, token deployment, and APIs on EVM and Solana." />
        <meta name="keywords" content="boing.finance documentation, DeFi guides, DEX tutorial, liquidity, bridge, deploy token" />
        <meta property="og:title" content="Documentation | boing.finance" />
        <meta property="og:description" content="Learn how to use boing.finance with our comprehensive documentation." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/docs" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Documentation - boing.finance" />
        <meta name="twitter:description" content="Learn how to use boing.finance." />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
      </Helmet>
      <div className="relative w-full min-w-0">
        
        <div className="relative z-10 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12 mt-8 sm:mt-12">
            <h1 className="text-3xl sm:text-4xl font-normal mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>boing.finance Documentation</h1>
            <p className="text-lg sm:text-xl max-w-3xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Complete guide to the boing.finance decentralized exchange platform - your gateway to cross-chain trading
            </p>
          </div>

          {/* Navigation and Content */}
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 pb-8 sm:pb-12">
            {/* Sidebar Navigation — sticky so TOC stays visible as user scrolls */}
            <div className="lg:w-1/4 lg:flex-shrink-0">
              <div
                className="rounded-xl p-4 sm:p-6 border lg:sticky lg:top-24 max-h-[calc(100vh-8rem)] lg:flex lg:flex-col"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
              >
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex-shrink-0" style={{ color: 'var(--text-primary)' }}>Table of Contents</h3>
                <nav className="space-y-1 sm:space-y-2 overflow-y-auto min-h-0 flex-1 pr-1">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-2 sm:px-3 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                        activeSection === section.id
                          ? 'bg-blue-600'
                          : 'hover:bg-opacity-10'
                      }`}
                      style={{
                        color: activeSection === section.id ? 'var(--text-primary)' : 'var(--text-secondary)'
                      }}
                      onMouseEnter={(e) => {
                        if (activeSection !== section.id) {
                          e.target.style.color = 'var(--text-primary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeSection !== section.id) {
                          e.target.style.color = 'var(--text-secondary)';
                        }
                      }}
                    >
                      <span className="mr-2">{section.icon}</span>
                      {section.title}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:w-3/4">
              <div className="rounded-xl p-4 sm:p-6 lg:p-8 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                {activeSection === 'overview' && <OverviewSection />}
                {activeSection === 'features' && <FeaturesSection />}
                {activeSection === 'networks' && <NetworksSection />}
                {activeSection === 'contracts' && <SmartContractsSection />}
                {activeSection === 'trading' && <TradingSection />}
                {activeSection === 'liquidity' && <LiquiditySection />}
                {activeSection === 'bridge' && <BridgeSection />}
                {activeSection === 'tokens' && <TokensSection />}
                {activeSection === 'analytics' && <AnalyticsSection />}
                {activeSection === 'portfolio' && <PortfolioSection />}
                {activeSection === 'governance' && <GovernanceSection />}
                {activeSection === 'boing' && <BoingSection />}
                {activeSection === 'technical' && <TechnicalSection />}
                {activeSection === 'api' && <APISection />}
                {activeSection === 'security' && <SecuritySection />}
                {activeSection === 'faq' && <FAQSection />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};


export default Docs; 