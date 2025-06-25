import React, { useState } from 'react';

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

const Docs = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Overview', icon: '📖' },
    { id: 'features', title: 'Features', icon: '🚀' },
    { id: 'networks', title: 'Supported Networks', icon: '🌐' },
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
    <div className="relative max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">mochi Documentation</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Complete guide to the mochi decentralized exchange platform - your gateway to cross-chain trading
          </p>
        </div>

        {/* Navigation and Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-1/4">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 sticky top-8">
              <h3 className="text-lg font-semibold text-white mb-4">Table of Contents</h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
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
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
              {activeSection === 'overview' && <OverviewSection />}
              {activeSection === 'features' && <FeaturesSection />}
              {activeSection === 'networks' && <NetworksSection />}
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
    </div>
  );
};

// Animated Background Component
function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      <svg width="100%" height="100%" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
        {/* Floating orbs */}
        <circle cx="200" cy="200" r="60" fill="#00E0FF" opacity="0.12">
          <animate attributeName="cy" values="200;220;200" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle cx="1200" cy="300" r="40" fill="#7B61FF" opacity="0.10">
          <animate attributeName="cy" values="300;320;300" dur="7s" repeatCount="indefinite" />
        </circle>
        <circle cx="700" cy="600" r="80" fill="#00FFB2" opacity="0.08">
          <animate attributeName="cy" values="600;620;600" dur="8s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

// Placeholder components for sections not yet implemented
const TechnicalSection = () => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold text-white mb-6">Technical Specifications</h2>
    <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
      <p className="text-gray-300 text-lg">
        Technical documentation and specifications will be available soon. This section will include:
      </p>
      <ul className="text-gray-300 mt-4 space-y-2">
        <li>• Smart contract architecture</li>
        <li>• Protocol specifications</li>
        <li>• Gas optimization details</li>
        <li>• Security audit reports</li>
        <li>• Network integration guides</li>
      </ul>
    </div>
  </div>
);

const APISection = () => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold text-white mb-6">API Reference</h2>
    <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
      <p className="text-gray-300 text-lg">
        API documentation and integration guides will be available soon. This section will include:
      </p>
      <ul className="text-gray-300 mt-4 space-y-2">
        <li>• REST API endpoints</li>
        <li>• WebSocket connections</li>
        <li>• SDK documentation</li>
        <li>• Rate limiting information</li>
        <li>• Authentication methods</li>
      </ul>
    </div>
  </div>
);

const SecuritySection = () => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold text-white mb-6">Security</h2>
    <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
      <p className="text-gray-300 text-lg">
        Security documentation and best practices will be available soon. This section will include:
      </p>
      <ul className="text-gray-300 mt-4 space-y-2">
        <li>• Security audit reports</li>
        <li>• Bug bounty program</li>
        <li>• Best practices for users</li>
        <li>• Risk management guidelines</li>
        <li>• Incident response procedures</li>
      </ul>
    </div>
  </div>
);

const FAQSection = () => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold text-white mb-6">Frequently Asked Questions</h2>
    <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
      <p className="text-gray-300 text-lg">
        FAQ section will be available soon. This section will include answers to common questions about:
      </p>
      <ul className="text-gray-300 mt-4 space-y-2">
        <li>• Platform usage</li>
        <li>• Supported networks</li>
        <li>• Trading fees</li>
        <li>• Troubleshooting</li>
        <li>• Community support</li>
      </ul>
    </div>
  </div>
);

export default Docs; 