import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  brandLogoPngAbsolute,
  brandShareImageAbsolute,
  getBrandAssetVersionSuffix,
} from '../config/brandAssets';
import { navigation } from '../config/navigation';
import NavIcon from '../components/NavIcon';

const TITLE = 'Boing Finance — The DEX for Boing Network';
const DESCRIPTION =
  'Swap and provide liquidity on native Boing pools with Boing Express, track your Boing portfolio, and bridge to other chains. Boing runs on public testnet; mainnet is not live.';

function Home() {
  const suffix = getBrandAssetVersionSuffix();
  return (
    <>
      <Helmet>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta name="keywords" content="Boing Finance, Boing Network, DEX, swap, liquidity pools, Boing Express, bridge" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance" />
        <meta property="og:site_name" content="boing.finance" />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:site" content="@boingfinance" />
        <meta property="og:image" content={brandShareImageAbsolute()} />
        <meta property="og:image:alt" content="Boing Finance brand mark on a dark navy background" />
        <meta name="twitter:image" content={brandShareImageAbsolute()} />
        <meta name="twitter:image:alt" content="Boing Finance brand mark on a dark navy background" />
        <link rel="canonical" href="https://boing.finance" />
        <link rel="icon" type="image/png" href={`/favicon-32x32.png${suffix}`} sizes="32x32" />
        <link rel="icon" type="image/png" href={`/favicon-16x16.png${suffix}`} sizes="16x16" />
        <link rel="icon" type="image/png" href={`/favicon-96x96.png${suffix}`} sizes="96x96" />
        <link rel="icon" type="image/png" href={`/favicon.png${suffix}`} sizes="512x512" />
        <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'boing.finance',
          url: 'https://boing.finance',
          logo: { '@type': 'ImageObject', url: brandLogoPngAbsolute() },
          description: DESCRIPTION,
          sameAs: ['https://twitter.com/boingfinance', 'https://discord.gg/K3w9nbUw4N'],
        })}
        </script>
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 pt-[6rem] pb-10 md:pt-[7rem] md:pb-14">
        <div className="max-w-7xl mx-auto">
          <section className="relative z-10 mb-20 md:mb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-0">
              <div className="text-center lg:text-left order-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', color: '#FBBF24' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#FBBF24' }} />
                  Boing: public testnet · mainnet not live
                </div>
                <h1 className="hero-title text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-3 pb-2" style={{ fontFamily: 'var(--font-display)', background: 'linear-gradient(135deg, #8DB8FF 0%, #3B8CFF 55%, #F0F4F8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  The DEX for Boing Network
                </h1>
                <p className="text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Swap and provide liquidity on native Boing pools, signed with Boing Express.
                </p>
                <p className="text-sm leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8" style={{ color: 'var(--text-tertiary)' }}>
                  Quote details such as minimum received are shown before you confirm. DeFi carries risk, including smart-contract risk, and the Boing Finance contracts have not had a professional third-party audit.
                </p>
                <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4">
                  <a href="/swap" className="btn btn-green inline-flex items-center gap-2">
                    Start trading
                  </a>
                  <a href="/pools" className="text-sm font-medium underline underline-offset-4 hover:opacity-80" style={{ color: 'var(--finance-primary)' }}>
                    Browse pools
                  </a>
                </div>
              </div>
              <div className="flex justify-center lg:justify-end order-2">
                <div className="w-full max-w-md rounded-2xl p-5 text-left" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-tertiary)' }}>
                    What works today
                  </p>
                  <ul className="space-y-4">
                    <li>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Swap and liquidity · native Boing pools</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Native-VM pools and swaps on the Boing public testnet, signed with Boing Express.</p>
                    </li>
                    <li>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Portfolio · Boing balances</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Balances, LP positions and values priced from Boing pools.</p>
                    </li>
                    <li>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Bridge · other chains</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Move tokens between EVM chains and Solana via LI.FI today. A native Boing ↔ Base bridge is planned.</p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-10 mb-20 md:mb-24 fade-in delay-400">
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>What you can do</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {navigation.trading.map((item) => (
                <a key={item.name} href={item.href} className="block h-full">
                  <TradeDeployEntryCard
                    title={item.name}
                    icon={<NavIcon icon={item.icon} size={22} />}
                    description={item.description || ''}
                    comingSoon={!item.isAvailable || item.comingSoon}
                  />
                </a>
              ))}
            </div>
          </section>

          <section className="mt-20 md:mt-28">
            <h2 className="text-2xl font-bold text-center mb-6" style={{ color: 'var(--text-primary)' }}>Resources</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
              <a href="/docs" className="block h-full">
                <FeatureCard title="Documentation" description="Guides for swap, pools, liquidity and bridge" />
              </a>
              <a href="/help-center" className="block h-full">
                <FeatureCard title="Help Center" description="Answers to common questions" />
              </a>
              <a href="/status" className="block h-full">
                <FeatureCard title="Status" description="Boing testnet and API health" />
              </a>
            </div>
          </section>
        </div>
      </div>
    </>
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
          {icon ? (
            <span className="text-2xl mr-3 transition-colors duration-300" style={{ color: 'var(--accent-teal)' }}>{icon}</span>
          ) : null}
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
