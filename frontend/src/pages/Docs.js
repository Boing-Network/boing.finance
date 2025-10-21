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

// MochiAstronaut component
function MochiAstronaut({ position = "top-right" }) {
  const getPositionClasses = () => {
    switch (position) {
      case "top-right":
        return "absolute right-0 top-0 mt-4 mr-4 z-20";
      case "bottom-right":
        return "absolute right-0 bottom-0 mb-4 mr-4 z-20";
      case "top-left":
        return "absolute left-0 top-0 mt-4 ml-4 z-20";
      case "bottom-left":
        return "absolute left-0 bottom-0 mb-4 ml-4 z-20";
      default:
        return "absolute right-0 top-0 mt-4 mr-4 z-20";
    }
  };

  return (
    <svg width="60" height="60" viewBox="0 0 200 200" className={`animate-float ${getPositionClasses()}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <ellipse cx="100" cy="175" rx="28" ry="8" fill="#1e293b" opacity="0.13" />
        <ellipse cx="100" cy="85" rx="48" ry="44" fill="#fff" stroke="#bfc9d9" strokeWidth="3" />
        <ellipse cx="100" cy="85" rx="42" ry="38" fill="#00E0FF" fillOpacity="0.2" stroke="#7dd3fc" strokeWidth="3" />
        <ellipse cx="100" cy="90" rx="32" ry="30" fill="#f8fafc" stroke="#bfc9d9" strokeWidth="2" />
        <ellipse cx="88" cy="95" rx="5" ry="5" fill="#60a5fa" />
        <ellipse cx="112" cy="95" rx="5" ry="5" fill="#60a5fa" />
        <ellipse cx="88" cy="94" rx="1.2" ry="2" fill="#fff" opacity="0.7" />
        <ellipse cx="112" cy="94" rx="1.2" ry="2" fill="#fff" opacity="0.7" />
        <ellipse cx="85" cy="75" rx="12" ry="6" fill="#fff" opacity="0.18" />
        <ellipse cx="100" cy="140" rx="28" ry="24" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
        <ellipse cx="78" cy="135" rx="7" ry="13" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
        <ellipse cx="122" cy="135" rx="7" ry="13" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
        <ellipse cx="72" cy="147" rx="6" ry="6" fill="#f8fafc" stroke="#bfc9d9" strokeWidth="2" />
        <ellipse cx="128" cy="147" rx="6" ry="6" fill="#f8fafc" stroke="#bfc9d9" strokeWidth="2" />
        <ellipse cx="88" cy="165" rx="7" ry="12" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
        <ellipse cx="112" cy="165" rx="7" ry="12" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
        <ellipse cx="88" cy="180" rx="8" ry="4" fill="#a5b4fc" />
        <ellipse cx="112" cy="180" rx="8" ry="4" fill="#a5b4fc" />
        <ellipse cx="100" cy="150" rx="10" ry="8" fill="#bae6fd" stroke="#7dd3fc" strokeWidth="1.5" />
      </g>
      <animateTransform attributeName="transform" type="translate" values="0 0; 0 -12; 0 0" dur="4s" repeatCount="indefinite" />
    </svg>
  );
}

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
    { id: 'technical', title: 'Technical Specs', icon: '⚙️' },
    { id: 'api', title: 'API Reference', icon: '🔌' },
    { id: 'security', title: 'Security', icon: '🔒' },
    { id: 'faq', title: 'FAQ', icon: '❓' }
  ];

  return (
    <>
      <Helmet>
        <title>Documentation - boing.finance</title>
        <meta name="description" content="Learn how to use boing.finance with our comprehensive documentation. Guides for swapping, liquidity provision, bridging, and token deployment." />
        <meta name="keywords" content="boing.finance documentation, DeFi guides, DEX tutorial, liquidity pools guide, cross-chain bridge tutorial" />
        <meta property="og:title" content="Documentation - boing.finance" />
        <meta property="og:description" content="Learn how to use boing.finance with our comprehensive documentation." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/docs" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Documentation - boing.finance" />
        <meta name="twitter:description" content="Learn how to use boing.finance." />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
      </Helmet>
      <div className="relative min-h-screen">
        <AnimatedBackground />
        
        <div className="relative z-10 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12 mt-8 sm:mt-12">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>boing.finance Documentation</h1>
            <p className="text-lg sm:text-xl max-w-3xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Complete guide to the boing.finance decentralized exchange platform - your gateway to cross-chain trading
            </p>
          </div>

          {/* Navigation and Content */}
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 pb-8 sm:pb-12">
            {/* Sidebar Navigation */}
            <div className="lg:w-1/4">
              <div className="rounded-xl p-4 sm:p-6 border lg:sticky lg:top-8" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>Table of Contents</h3>
                <nav className="space-y-1 sm:space-y-2">
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
                {activeSection === 'technical' && <TechnicalSection />}
                {activeSection === 'api' && <APISection />}
                {activeSection === 'security' && <SecuritySection />}
                {activeSection === 'faq' && <FAQSection />}
              </div>
            </div>
          </div>
        </div>
        <MochiAstronaut position="top-right" />
      </div>
    </>
  );
};

// Animated Background Component
function AnimatedBackground() {
  return null; // Removed since it's now applied centrally
}

export default Docs; 