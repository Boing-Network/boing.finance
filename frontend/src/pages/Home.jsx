import React from 'react';
import { Helmet } from 'react-helmet-async';
import OnboardingChecklist from '../components/OnboardingChecklist';
import ForYouSection from '../components/ForYouSection';
import ProactiveTipsBanner from '../components/ProactiveTipsBanner';
import {
  brandLogoPngAbsolute,
  brandShareImageAbsolute,
  getBrandAssetVersionSuffix,
} from '../config/brandAssets';
import { navigation } from '../config/navigation';
import NavIcon from '../components/NavIcon';

function Home() {
  // Use useMemo to ensure stable reference
  const memoizedNav = React.useMemo(() => {
    return navigation;
  }, []); // Empty deps - navigation should never change
  
  return (
    <>
      <Helmet>
        <title>boing.finance | DeFi That Bounces Back — Swap, Deploy & Trade on EVM & Solana</title>
        <meta name="description" content="The DeFi that always bounces back. Swap tokens, add liquidity, bridge assets, and deploy your own token on EVM and Solana. One interface, no code." />
        <meta name="keywords" content="boing finance, DeFi, DEX, swap tokens, liquidity pool, deploy token, cross-chain bridge, EVM, Solana, decentralized exchange, create token, ERC20, token launch" />
        <meta property="og:title" content="boing.finance | DeFi That Bounces Back — Swap, Deploy & Trade" />
        <meta property="og:description" content="The DeFi that always bounces back. Swap, add liquidity, bridge, and deploy tokens on EVM and Solana. One interface." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance" />
        <meta property="og:site_name" content="boing.finance" />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="boing.finance | DeFi That Bounces Back" />
        <meta name="twitter:description" content="Swap, add liquidity, bridge, and deploy tokens on EVM and Solana. The DeFi that always bounces back." />
        <meta name="twitter:site" content="@boingfinance" />
        <meta property="og:image" content={brandShareImageAbsolute()} />
        <meta property="og:image:alt" content="Boing Finance — DeFi That Bounces Back; brand mark on stone-dark background" />
        <meta name="twitter:image" content={brandShareImageAbsolute()} />
        <meta name="twitter:image:alt" content="Boing Finance — DeFi That Bounces Back; brand preview with medallion mark" />
        <link rel="canonical" href="https://boing.finance" />
        <link rel="icon" type="image/png" href={`/favicon-32x32.png${getBrandAssetVersionSuffix()}`} sizes="32x32" />
        <link rel="icon" type="image/png" href={`/favicon-16x16.png${getBrandAssetVersionSuffix()}`} sizes="16x16" />
        <link rel="icon" type="image/png" href={`/favicon-96x96.png${getBrandAssetVersionSuffix()}`} sizes="96x96" />
        <link rel="icon" type="image/png" href={`/favicon.png${getBrandAssetVersionSuffix()}`} sizes="512x512" />
        
        {/* Structured Data for Homepage */}
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Boing Finance",
          "url": "https://boing.finance",
          "description": "The DeFi that always bounces back. Deploy tokens, create pools, and trade on EVM and Solana with boing.finance.",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://boing.finance/tokens?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })}
        </script>
        
        {/* Enhanced Structured Data for Organization */}
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "boing.finance",
          "url": "https://boing.finance",
          "logo": {
            "@type": "ImageObject",
            "url": brandLogoPngAbsolute()
          },
          "description": "The DeFi that always bounces back. Deploy tokens, create pools, and trade on EVM and Solana with boing.finance.",
          "sameAs": [
            "https://twitter.com/boingfinance"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "Customer Service",
            "url": "https://boing.finance/contact-us"
          }
        })}
        </script>
        
        {/* Structured Data for FinancialProduct */}
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FinancialProduct",
          "name": "boing.finance DeFi Platform",
          "description": "The DeFi that always bounces back. Swap, add liquidity, bridge, and deploy tokens on EVM and Solana.",
          "provider": {
            "@type": "Organization",
            "name": "boing.finance",
            "url": "https://boing.finance"
          },
          "category": "Cryptocurrency Exchange",
          "areaServed": "Worldwide"
        })}
        </script>
        
        {/* Structured Data for FAQ */}
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "How do I deploy a token on Boing Finance?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "To deploy a token on Boing Finance, connect your wallet, navigate to the Deploy Token page, fill in your token details (name, symbol, supply), configure security features, and click deploy. No coding required!"
              }
            },
            {
              "@type": "Question",
              "name": "What blockchains does Boing Finance support?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Boing Finance supports EVM chains and Solana for cross-chain token deployment and trading."
              }
            },
            {
              "@type": "Question",
              "name": "Is Boing Finance safe to use?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, Boing Finance implements advanced security features including mint authority removal, anti-bot protection, and comprehensive smart contract audits to ensure safe token deployment and trading."
              }
            },
            {
              "@type": "Question",
              "name": "How much does it cost to deploy a token?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Token deployment costs vary by network (e.g. ETH on Ethereum, BOING on Boing testnet). The app uses a $5 reference value per BOING for fee estimates on Boing. Check the Deploy Token page for current pricing on your connected chain."
              }
            }
          ]
        })}
        </script>
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 pt-[6rem] pb-10 md:pt-[7rem] md:pb-14">
        <div className="max-w-7xl mx-auto">
          {/* 1. Hero: Two-column layout — copy left, robot mascot right (Deep Trade + design system) */}
          <section className="relative z-10 mb-20 md:mb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-0">
              {/* Left: copy and CTAs */}
              <div className="text-center lg:text-left order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4" style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)', color: 'var(--finance-green)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-finance-green animate-pulse" style={{ background: 'var(--finance-green)', boxShadow: '0 0 0 0 rgba(0,255,136,0.4)' }} />
                  Live on EVM & Solana
                </div>
                <h1 className="hero-title text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-3 pb-2" style={{ fontFamily: 'var(--font-display)', background: 'linear-gradient(135deg, var(--finance-primary) 0%, var(--finance-green) 60%, #ffffff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 0 20px var(--glow-cyan))' }}>
                  DeFi That Bounces Back
                </h1>
                <p className="text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8" style={{ color: 'var(--text-secondary)' }}>
                  Swap, bridge, and launch tokens in one place — no code required.
                </p>
                {/* CTAs: one primary + one secondary */}
                <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4">
                  <a href="/swap" className="btn btn-green inline-flex items-center gap-2">
                    Start trading
                  </a>
                  <a
                    href="/deploy-token"
                    className="text-sm font-medium underline underline-offset-4 hover:opacity-80"
                    style={{ color: 'var(--finance-primary)' }}
                  >
                    Deploy a token
                  </a>
                </div>
              </div>
              {/* Right: Mascot only (transparent PNG from assets — no coral/hero composite) */}
              <div className="flex justify-center lg:justify-end order-1 lg:order-2">
                <div className="relative flex items-center justify-center w-full max-w-sm lg:max-w-md">
                  <img
                    src={`${process.env.PUBLIC_URL || ''}/assets/mascot-default.png`}
                    alt=""
                    width={220}
                    height={220}
                    className="block w-full h-auto max-h-[220px] object-contain boing-hero-float"
                    style={{
                      minHeight: 220,
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 0 12px var(--glow-cyan-soft))',
                    }}
                    onError={(e) => {
                      e.target.src = `${process.env.PUBLIC_URL || ''}/assets/mascot-winking.png`;
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 2. Getting started: Onboarding + For You (positioned before feature grid so new users see next steps first) */}
          <section className="flex flex-col lg:flex-row gap-8 mb-20 md:mb-24 fade-in delay-300">
            <div className="lg:max-w-sm shrink-0">
              <OnboardingChecklist />
            </div>
            <div className="flex-1 min-w-0">
              <ForYouSection />
            </div>
          </section>

          <section className="mb-16 md:mb-20 fade-in delay-320">
            <div className="flex flex-wrap justify-center gap-3">
              <Highlight icon={<SwapIcon />} text="Swaps" />
              <Highlight icon={<LiquidityIcon />} text="Liquidity" />
              <Highlight icon={<BridgeIcon />} text="Bridge" />
              <Highlight icon={<DeployTokenIcon />} text="Deploy" />
              <Highlight icon={<TokensIcon />} text="Tokens" />
            </div>
          </section>

          {/* Proactive Tips (when connected) - right after onboarding */}
          <section className="mb-20 md:mb-24 max-w-2xl mx-auto fade-in delay-350">
            <ProactiveTipsBanner />
          </section>

          {/* 3. Main product: Feature cards (Trade, Analytics, Deploy) */}
          <section className="space-y-10 mb-20 md:mb-24 fade-in delay-400">
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>What you can do</h2>
              <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                Trade first — or launch a collection and token together with Project pack.
              </p>
            </div>
            {/* First row - 6 cards in 3 columns - dynamically generated from navigation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...memoizedNav.trading, ...memoizedNav.deployment].map((item) => {
                const isComingSoon = Boolean(item.comingSoon);
                const isAvailable = Boolean(item.isAvailable);
                const shouldShowComingSoon = isComingSoon || !isAvailable;
                const CardContent = (
                  <TradeDeployEntryCard
                    title={item.name}
                    icon={<NavIcon icon={item.icon} size={22} />}
                    description={item.description || ''}
                    comingSoon={shouldShowComingSoon}
                  />
                );
                return shouldShowComingSoon ? (
                  <div key={item.name}>{CardContent}</div>
                ) : (
                  <a key={item.name} href={item.href} className="block h-full">{CardContent}</a>
                );
              })}
              {memoizedNav.analytics.map((item) => {
                const isComingSoon = Boolean(item.comingSoon);
                const isAvailable = Boolean(item.isAvailable);
                const shouldShowComingSoon = isComingSoon || !isAvailable;
                const getIcon = () => {
                  if (item.name === 'Analytics' || item.name === 'Intelligence') return <AnalyticsIcon />;
                  if (item.name === 'Portfolio') return <PortfolioIcon />;
                  if (item.name === 'Activity' || item.name === 'Wallet Flow') return <ActivityIcon />;
                  return <NavIcon icon={item.icon} size={22} />;
                };
                const CardContent = (
                  <FeatureCard title={item.name} icon={getIcon()} description={item.description || ''} comingSoon={shouldShowComingSoon} />
                );
                return shouldShowComingSoon ? (
                  <div key={item.name}>{CardContent}</div>
                ) : (
                  <a key={item.name} href={item.href} className="block">{CardContent}</a>
                );
              })}
            </div>

            {/* 4. Governance & BOING */}
            <section className="mt-20 md:mt-28">
              <h2 className="text-2xl font-bold text-center mb-8" style={{ color: 'var(--text-primary)' }}>Governance & Ecosystem</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Governance</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {memoizedNav.governance.slice(0, 4).map((item) => (
                    <a key={item.name} href={item.href} className="block">
                      <FeatureCard title={item.name} icon={<NavIcon icon={item.icon} size={22} />} description={item.description || ''} />
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>BOING Ecosystem</h3>
                <div className="space-y-4">
                  {memoizedNav.boing.map((item) => (
                    <a key={item.name} href={item.href} className="block">
                      <FeatureCard title={item.name} icon={<NavIcon icon={item.icon} size={22} />} description={item.description || ''} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
            </section>

            {/* 5. Tools & Resources */}
            <section className="mt-20 md:mt-28">
              <h2 className="text-2xl font-bold text-center mb-6" style={{ color: 'var(--text-primary)' }}>Tools & Resources</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
                <a href="/docs" className="block h-full">
                  <FeatureCard title="Documentation" icon={<span className="text-xl">📖</span>} description="Guides for swapping, liquidity, bridging, and deployment" />
                </a>
                <a href="/developer-tools" className="block h-full">
                  <FeatureCard title="Developer Tools" icon={<span className="text-xl">🔧</span>} description="Contract utilities and debugging tools" />
                </a>
                <a href="/watchlist" className="block h-full">
                  <FeatureCard title="Watchlist" icon={<span className="text-xl">⭐</span>} description="Track tokens and price alerts" />
                </a>
                <a href="/help-center" className="block h-full">
                  <FeatureCard title="Help Center" icon={<span className="text-xl">❓</span>} description="FAQs and support — use the AI button for help" />
                </a>
              </div>
            </section>
          </section>

          </div>

          {/* 6. Creator CTA — single primary path */}
          <div className="mt-24 md:mt-32 mb-10 flex justify-center fade-in delay-800">
            <div
              className="rounded-xl px-6 py-5 border max-w-2xl w-full"
              style={{
                background: 'linear-gradient(135deg, rgba(0,229,255,0.08), rgba(0,255,136,0.06))',
                borderColor: 'rgba(0,229,255,0.28)',
              }}
            >
              <div className="text-center">
                <div className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Launch a project
                </div>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Create an NFT collection and a token together, connect them, then add a pool when you&apos;re ready.
                </p>
                <a href="/project-pack" className="btn btn-primary inline-flex items-center gap-2">
                  Open Project pack
                </a>
                <p className="text-xs mt-3" style={{ color: 'var(--text-tertiary)' }}>
                  Or{' '}
                  <a href="/deploy-token" className="underline" style={{ color: 'var(--finance-primary)' }}>
                    deploy a token only
                  </a>
                </p>
              </div>
            </div>
          </div>
      </div>
    </>
  );
}


function Highlight({ icon, text }) {
  return (
    <div className="group relative flex items-center space-x-2 px-4 py-2 rounded-lg border border-border hover:border-border-hover transition-all duration-300 hover:scale-105 hover:shadow-lg" style={{ background: 'linear-gradient(to right, var(--secondary-bg), var(--accent-cyan-bg))', boxShadow: '0 0 16px var(--glow-cyan)' }}>
      <span className="text-xl transition-colors duration-300 animate-pulse group-hover:text-secondary" style={{ color: 'var(--accent-teal)' }}>{icon}</span>
      <span className="text-sm font-medium transition-colors duration-300" style={{ 
        color: 'var(--text-secondary)'
      }} onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>{text}</span>
      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(to right, var(--secondary-bg), var(--accent-cyan-bg))' }}></div>
    </div>
  );
}



// Animated SVG Feature Icons
function SwapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="drop-shadow-lg">
      <defs>
        <linearGradient id="swapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-teal)" />
          <stop offset="50%" stopColor="var(--accent-teal)" />
          <stop offset="100%" stopColor="var(--accent-cyan)" />
        </linearGradient>
      </defs>
      <path fill="url(#swapGradient)" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" stroke="url(#swapGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LiquidityIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="drop-shadow-lg">
      <defs>
        <linearGradient id="liquidityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-teal)" />
          <stop offset="50%" stopColor="var(--accent-teal)" />
          <stop offset="100%" stopColor="var(--accent-cyan)" />
        </linearGradient>
      </defs>
      <path fill="url(#liquidityGradient)" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" stroke="url(#liquidityGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="drop-shadow-lg">
      <defs>
        <linearGradient id="analyticsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-teal)" />
          <stop offset="50%" stopColor="var(--accent-teal)" />
          <stop offset="100%" stopColor="var(--accent-cyan)" />
        </linearGradient>
      </defs>
      <path fill="url(#analyticsGradient)" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="url(#analyticsGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PortfolioIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="drop-shadow-lg">
      <defs>
        <linearGradient id="portfolioGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-teal)" />
          <stop offset="50%" stopColor="var(--accent-teal)" />
          <stop offset="100%" stopColor="var(--accent-cyan)" />
        </linearGradient>
      </defs>
      <path fill="url(#portfolioGradient)" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" stroke="url(#portfolioGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="drop-shadow-lg">
      <defs>
        <linearGradient id="activityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-teal)" />
          <stop offset="50%" stopColor="var(--accent-teal)" />
          <stop offset="100%" stopColor="var(--accent-cyan)" />
        </linearGradient>
      </defs>
      <path fill="url(#activityGradient)" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" stroke="url(#activityGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BridgeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="drop-shadow-lg">
      <defs>
        <linearGradient id="bridgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-teal)" />
          <stop offset="50%" stopColor="var(--accent-teal)" />
          <stop offset="100%" stopColor="var(--accent-cyan)" />
        </linearGradient>
      </defs>
      <path fill="url(#bridgeGradient)" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" stroke="url(#bridgeGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TokensIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="drop-shadow-lg">
      <defs>
        <linearGradient id="tokensGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-teal)" />
          <stop offset="50%" stopColor="var(--accent-teal)" />
          <stop offset="100%" stopColor="var(--accent-cyan)" />
        </linearGradient>
      </defs>
      <path fill="url(#tokensGradient)" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" stroke="url(#tokensGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DeployTokenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="drop-shadow-lg">
      <defs>
        <linearGradient id="deployGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-teal)" />
          <stop offset="50%" stopColor="var(--accent-teal)" />
          <stop offset="100%" stopColor="var(--accent-cyan)" />
        </linearGradient>
      </defs>
      <path fill="url(#deployGradient)" d="M12 6v6m0 0v6m0-6h6m-6 0H6" stroke="url(#deployGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Trade & Deploy entry card — kit-aligned, no pulse/glow. */
function TradeDeployEntryCard({ title, icon, description, comingSoon }) {
  return (
    <div
      className={`td-entry-card ${comingSoon ? 'td-entry-card--disabled' : ''}`}
      title={comingSoon ? 'This feature will be available after mainnet launch.' : undefined}
    >
      <div className="td-entry-card__icon" aria-hidden="true">
        {icon}
      </div>
      <h3 className="td-entry-card__title">
        {title}
        {comingSoon ? <span className="td-entry-card__soon">Coming soon</span> : null}
      </h3>
      <p className="td-entry-card__desc">{description}</p>
    </div>
  );
}

// Feature Card Component (updated) — used for Analytics / Governance / tools
function FeatureCard({ title, icon, description, comingSoon }) {
  return (
    <div
      className={`group relative backdrop-blur-sm border border-border rounded-xl p-6 transition-all duration-300 overflow-hidden h-full flex flex-col ${comingSoon ? 'opacity-60 cursor-not-allowed' : 'hover:border-border-hover hover:shadow-xl'}`}
      style={{
        background: 'linear-gradient(to bottom right, var(--bg-card), var(--bg-secondary))',
      }}
      title={comingSoon ? 'This feature will be available after mainnet launch.' : ''}
    >
      <div className="relative z-10 text-center flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-center mb-4">
          <span className="text-2xl mr-3 transition-colors duration-300" style={{ color: 'var(--accent-teal)' }}>{icon}</span>
          <h3 className="text-lg font-semibold transition-colors duration-300 flex items-center" style={{ color: 'var(--text-primary)' }}>
            {title}
            {comingSoon && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold border" style={{ color: 'var(--text-secondary)', borderColor: 'color-mix(in srgb, var(--finance-amber, #e8b84a) 40%, transparent)', backgroundColor: 'color-mix(in srgb, var(--finance-amber, #e8b84a) 14%, transparent)' }}>Coming Soon</span>
            )}
          </h3>
        </div>
        <p className="text-sm leading-relaxed transition-colors duration-300 flex-1" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      </div>
    </div>
  );
}

export default Home;
