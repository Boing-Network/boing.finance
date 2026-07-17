import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';

const OverviewSection = lazy(() => import('../components/docs/OverviewSection'));
const FeaturesSection = lazy(() => import('../components/docs/FeaturesSection'));
const NetworksSection = lazy(() => import('../components/docs/NetworksSection'));
const TradingSection = lazy(() => import('../components/docs/TradingSection'));
const LiquiditySection = lazy(() => import('../components/docs/LiquiditySection'));
const BridgeSection = lazy(() => import('../components/docs/BridgeSection'));
const TokensSection = lazy(() => import('../components/docs/TokensSection'));
const AnalyticsSection = lazy(() => import('../components/docs/AnalyticsSection'));
const PortfolioSection = lazy(() => import('../components/docs/PortfolioSection'));
const SmartContractsSection = lazy(() => import('../components/docs/SmartContractsSection'));
const TechnicalSection = lazy(() => import('../components/docs/TechnicalSection'));
const APISection = lazy(() => import('../components/docs/APISection'));
const SecuritySection = lazy(() => import('../components/docs/SecuritySection'));
const FAQSection = lazy(() => import('../components/docs/FAQSection'));
const GovernanceSection = lazy(() => import('../components/docs/GovernanceSection'));
const BoingSection = lazy(() => import('../components/docs/BoingSection'));
const BoingNativeL1Section = lazy(() => import('../components/docs/BoingNativeL1Section'));

const DOC_NAV = [
  { id: 'overview', title: 'Overview', icon: '📖' },
  { id: 'features', title: 'Features', icon: '🚀' },
  { id: 'networks', title: 'Supported Networks', icon: '🌐' },
  { id: 'boing-l1', title: 'Boing L1 & Express', icon: '⚡' },
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
  { id: 'faq', title: 'FAQ', icon: '❓' },
];

const SECTION_MAP = {
  overview: OverviewSection,
  features: FeaturesSection,
  networks: NetworksSection,
  'boing-l1': BoingNativeL1Section,
  contracts: SmartContractsSection,
  trading: TradingSection,
  liquidity: LiquiditySection,
  bridge: BridgeSection,
  tokens: TokensSection,
  analytics: AnalyticsSection,
  portfolio: PortfolioSection,
  governance: GovernanceSection,
  boing: BoingSection,
  technical: TechnicalSection,
  api: APISection,
  security: SecuritySection,
  faq: FAQSection,
};

function DocsSectionFallback() {
  return (
    <div className="animate-pulse space-y-4 py-8" aria-busy="true" aria-label="Loading documentation section">
      <div className="h-8 rounded w-1/3" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
      <div className="h-4 rounded w-full" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
      <div className="h-4 rounded w-5/6" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
      <div className="h-4 rounded w-4/6" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
    </div>
  );
}

const Docs = () => {
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState(() => {
    try {
      const raw = new URLSearchParams(window.location.search).get('section');
      return DOC_NAV.some((s) => s.id === raw) ? raw : 'overview';
    } catch {
      return 'overview';
    }
  });

  useEffect(() => {
    const raw = searchParams.get('section');
    if (raw && DOC_NAV.some((s) => s.id === raw)) {
      setActiveSection(raw);
    }
  }, [searchParams]);

  const ActiveSection = SECTION_MAP[activeSection] || OverviewSection;

  return (
    <>
      <Helmet>
        <title>Documentation | boing.finance — Guides for Swap, Liquidity, Bridge & Deploy</title>
        <meta name="description" content="Learn how to use boing.finance. Docs for swap, liquidity, bridge, token and NFT deployment (EVM, Solana, Boing L1), and APIs." />
        <meta name="keywords" content="boing.finance documentation, DeFi guides, DEX tutorial, liquidity, bridge, deploy token" />
        <meta property="og:title" content="Documentation | boing.finance" />
        <meta property="og:description" content="Learn how to use boing.finance with our comprehensive documentation." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/docs" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Documentation - boing.finance" />
        <meta name="twitter:description" content="Learn how to use boing.finance." />
      </Helmet>
      <div className="relative w-full min-w-0">
        <div className="relative z-10 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 mt-8 sm:mt-12">
            <h1 className="text-3xl sm:text-4xl font-normal mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>
              boing.finance Documentation
            </h1>
            <p className="text-lg sm:text-xl max-w-3xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Complete guide to the boing.finance decentralized exchange platform - your gateway to cross-chain trading
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 pb-8 sm:pb-12">
            <div className="lg:w-1/4 lg:flex-shrink-0">
              <div
                className="rounded-xl p-4 sm:p-6 border lg:sticky lg:top-24 max-h-[calc(100vh-8rem)] lg:flex lg:flex-col"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
              >
                <h3
                  className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex-shrink-0"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Table of Contents
                </h3>
                <nav className="space-y-1 sm:space-y-2 overflow-y-auto min-h-0 flex-1 pr-1" aria-label="Documentation sections">
                  {DOC_NAV.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      aria-current={activeSection === section.id ? 'page' : undefined}
                      className={`w-full text-left px-2 sm:px-3 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                        activeSection === section.id ? 'bg-blue-600' : 'hover:bg-opacity-10'
                      }`}
                      style={{
                        color:
                          activeSection === section.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}
                    >
                      <span className="mr-2" aria-hidden>
                        {section.icon}
                      </span>
                      {section.title}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            <div className="lg:w-3/4">
              <div
                className="rounded-xl p-4 sm:p-6 lg:p-8 border"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
              >
                <Suspense fallback={<DocsSectionFallback />}>
                  <ActiveSection />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Docs;
