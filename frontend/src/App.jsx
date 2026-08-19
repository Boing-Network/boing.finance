import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './i18n'; // Initialize i18n
import { WalletProvider } from './contexts/WalletContext';
import { BoingNativeDexIntegrationProvider } from './contexts/BoingNativeDexIntegrationContext';
import { ChainRealtimeProvider } from './contexts/ChainRealtimeContext';
import { SolanaWalletProvider } from './contexts/SolanaWalletContext';
import ChainTypeSelector from './components/ChainTypeSelector';
import { ThemeProvider } from './contexts/ThemeContext';
import { AchievementProvider } from './contexts/AchievementContext';
import AchievementOverlay from './components/AchievementOverlay';
import BaseMiniAppWrapper from './components/BaseMiniAppWrapper';
import BaseNetworkOptimizer from './components/BaseNetworkOptimizer';
import WalletConnect from './components/WalletConnect';
import NetworkSelector from './components/NetworkSelector';
import ThemeToggle from './components/ThemeToggle';
import LanguageSelector from './components/LanguageSelector';
import Logo from './components/Logo';
import ShootingStars from './components/ShootingStars';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import TickerBar from './components/TickerBar';
import DevnetCurrencyDisclaimer from './components/DevnetCurrencyDisclaimer';
import AppShellVisualLayer from './components/AppShellVisualLayer';
import CinematicIntro, { shouldShowCinematicIntro } from './components/CinematicIntro';
import { getPageVariant } from './utils/pageVariant';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion';
import { useBreakpoint } from './hooks/useMediaQuery';
import { useCloseOnPointerOutside } from './hooks/useCloseOnPointerOutside';
import priceAlertService from './services/priceAlertService';
import {
  brandShareImageAbsolute,
  getBrandAssetVersionSuffix,
} from './config/brandAssets';
import { comingSoon, navigation } from './config/navigation';

// Lazy load all page components for code splitting
const Swap = lazy(() => import('./pages/Swap'));
const Liquidity = lazy(() => import('./pages/Liquidity'));
const Pools = lazy(() => import('./pages/Pools'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Activity = lazy(() => import('./pages/Activity'));
const Bridge = lazy(() => import('./pages/Bridge'));
const DeployToken = lazy(() => import('./pages/DeployToken'));
const CreateNFT = lazy(() => import('./pages/CreateNFT'));
const CreatePool = lazy(() => import('./pages/CreatePool'));
const Tokens = lazy(() => import('./pages/Tokens'));
const Watchlist = lazy(() => import('./pages/Watchlist'));
const Status = lazy(() => import('./pages/Status'));
const Docs = lazy(() => import('./pages/Docs'));
const DeveloperTools = lazy(() => import('./pages/DeveloperTools'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const HelpArticle = lazy(() => import('./pages/HelpArticle'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const BugReport = lazy(() => import('./pages/BugReport'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Whitepaper = lazy(() => import('./pages/Whitepaper'));
const ExecutiveSummary = lazy(() => import('./pages/ExecutiveSummary'));
const Blog = lazy(() => import('./pages/Blog'));
const GovernanceProposals = lazy(() => import('./pages/governance/GovernanceProposals'));
const GovernanceVote = lazy(() => import('./pages/governance/GovernanceVote'));
const GovernanceTreasury = lazy(() => import('./pages/governance/GovernanceTreasury'));
const GovernanceRoadmap = lazy(() => import('./pages/governance/GovernanceRoadmap'));
const GovernanceCommunity = lazy(() => import('./pages/governance/GovernanceCommunity'));
const GovernanceLearn = lazy(() => import('./pages/governance/GovernanceLearn'));
const BoingStaking = lazy(() => import('./pages/boing/BoingStaking'));
const BoingPoints = lazy(() => import('./pages/boing/BoingPoints'));
const BoingRoadmap = lazy(() => import('./pages/boing/BoingRoadmap'));
const BoingActivities = lazy(() => import('./pages/boing/BoingActivities'));
const BoingNativeVm = lazy(() => import('./pages/boing/BoingNativeVm'));
const Home = lazy(() => import('./pages/Home'));
const TransactionHistoryModal = lazy(() => import('./components/TransactionHistoryModal'));
const AIChatModal = lazy(() => import('./components/AIChatModal'));
const DeFi101Modal = lazy(() => import('./components/DeFi101Modal'));
const OnboardingTour = lazy(() => import('./components/OnboardingTour'));

// QueryClient singleton at module top to avoid "Cannot access before initialization"
// (production bundle evaluation order can cause TDZ if this is declared after App)
let queryClientInstance = null;
function getQueryClient() {
  if (!queryClientInstance) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[App] Creating QueryClient instance at:', new Date().toISOString());
    }
    try {
      queryClientInstance = new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000,
            throwOnError: false,
            onError: () => {}
          },
        },
      });
    } catch (error) {
      queryClientInstance = new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            throwOnError: false,
          },
        },
      });
    }
  }
  return queryClientInstance;
}

/** Renders "The Trade" cinematic intro only when loading the landing page (/), once per app load. Use ?noIntro=1 to skip, ?splash=1 to force-show. */
function InitialAnimationGate({ children }) {
  const location = useLocation();
  const introShownRef = useRef(false);
  const [showSplash, setShowSplash] = useState(() => {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    if (params.get('splash') === '1' || params.get('showSplash') === '1') return true;
    return shouldShowCinematicIntro();
  });

  const isLanding = location.pathname === '/';
  const shouldShowIntro = showSplash && isLanding && !introShownRef.current;

  const handleIntroComplete = () => {
    introShownRef.current = true;
    setShowSplash(false);
  };

  return (
    <>
      {shouldShowIntro && typeof document !== 'undefined' && document.body
        ? createPortal(
            <CinematicIntro onComplete={handleIntroComplete} />,
            document.body
          )
        : null}
      {children}
    </>
  );
}

function PageTransitionRoutes() {
  const location = useLocation();
  const transitionRef = useRef(null);

  useEffect(() => {
    const el = transitionRef.current;
    if (!el) return;
    el.classList.remove('page-transition-enter');
    // Force reflow so the enter animation restarts without remounting the route tree
    void el.offsetWidth;
    el.classList.add('page-transition-enter');
  }, [location.pathname]);

  return (
    <div ref={transitionRef} className="page-transition-enter flex-1 flex flex-col min-h-0">
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/swap" element={<Swap />} />
        <Route path="/pools" element={<Pools />} />
        <Route path="/liquidity" element={<Liquidity />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/bridge" element={<Bridge />} />
        <Route path="/tokens" element={<Tokens />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/developer-tools" element={<DeveloperTools />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/deploy-token" element={<DeployToken />} />
        <Route path="/create-nft" element={<CreateNFT />} />
        <Route path="/create-pool" element={<CreatePool />} />
        <Route path="/whitepaper" element={<Whitepaper />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/help-center" element={<HelpCenter />} />
        <Route path="/help-center/article/:articleId" element={<HelpArticle />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/status" element={<Status />} />
        <Route path="/bug-report" element={<BugReport />} />
        <Route path="/executive-summary" element={<ExecutiveSummary />} />
        {/* Governance */}
        <Route path="/governance/proposals" element={<GovernanceProposals />} />
        <Route path="/governance/vote" element={<GovernanceVote />} />
        <Route path="/governance/treasury" element={<GovernanceTreasury />} />
        <Route path="/governance/roadmap" element={<GovernanceRoadmap />} />
        <Route path="/governance/community" element={<GovernanceCommunity />} />
        <Route path="/governance/learn" element={<GovernanceLearn />} />
        {/* BOING */}
        <Route path="/boing/staking" element={<BoingStaking />} />
        <Route path="/boing/points" element={<BoingPoints />} />
        <Route path="/boing/roadmap" element={<BoingRoadmap />} />
        <Route path="/boing/activities" element={<BoingActivities />} />
        <Route path="/boing/native-vm" element={<BoingNativeVm />} />
      </Routes>
    </div>
  );
}

function AppContent() {
  const _location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [defi101Open, setDefi101Open] = useState(false);
  const [tradeAndDeployDropdownOpen, setTradeAndDeployDropdownOpen] = useState(false);
  const [analyticsDropdownOpen, setAnalyticsDropdownOpen] = useState(false);
  const [governanceDropdownOpen, setGovernanceDropdownOpen] = useState(false);
  const [boingDropdownOpen, setBoingDropdownOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [isMediumNavOpen, setIsMediumNavOpen] = useState(false);
  const mediumNavRef = useRef(null);
  const { isDesktopNav, isMobileNav } = useBreakpoint();

  useCloseOnPointerOutside(
    isMediumNavOpen,
    (node) => Boolean(mediumNavRef.current?.contains(node)),
    () => setIsMediumNavOpen(false)
  );

  const closeAllDropdowns = () => {
    setTradeAndDeployDropdownOpen(false);
    setAnalyticsDropdownOpen(false);
    setGovernanceDropdownOpen(false);
    setBoingDropdownOpen(false);
    setToolsDropdownOpen(false);
    setIsMediumNavOpen(false);
  };

  useEffect(() => {
    if (isDesktopNav) setIsMediumNavOpen(false);
  }, [isDesktopNav]);

  useEffect(() => {
    if (!isMobileNav) return;
    setIsMenuOpen(false);
    setTradeAndDeployDropdownOpen(false);
    setAnalyticsDropdownOpen(false);
    setGovernanceDropdownOpen(false);
    setBoingDropdownOpen(false);
    setToolsDropdownOpen(false);
    setIsMediumNavOpen(false);
  }, [isMobileNav]);
  
  // Navigation is already frozen and immutable, no need to memoize
  // Using navigation directly ensures consistency
  const memoizedNavigation = navigation;
  
  // Start price alert service
  React.useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Start price alert monitoring
    priceAlertService.start();
    
    return () => {
      priceAlertService.stop();
    };
  }, []);

  // Navigation state check (console.log removed for production)

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Keyboard shortcuts: Esc closes modals and dropdowns
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsMediumNavOpen(false);
        setHistoryModalOpen(false);
        setAiChatOpen(false);
        setDefi101Open(false);
        closeAllDropdowns();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const location = useLocation();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isLandingPage = location.pathname === '/';
  const pageVariant = getPageVariant(location.pathname);
  const pageBackgroundClass = isLandingPage
    ? `page-landing deep-trade-bg page-variant-${pageVariant}`
    : `page-app deep-trade-bg page-variant-${pageVariant}`;

  return (
    <div className={`relative flex flex-col min-h-screen min-w-0 overflow-x-hidden ${pageBackgroundClass}`}>
      <AppShellVisualLayer reducedMotion={prefersReducedMotion} />
      <BaseNetworkOptimizer />
      
      {/* Header: nav + ticker (sticky so ticker sits in flow directly under nav) */}
      <header className="site-header sticky top-0 z-30 flex flex-col flex-shrink-0 w-full min-w-0">
        <nav className="site-nav-bar relative flex-shrink-0 w-full min-w-0" aria-label="Primary navigation">
          <ShootingStars dense />
          {/* Full-width row (no max-w-7xl/mx-auto — avoids centering inset on logo) */}
          <div className="flex w-full min-w-0 items-center justify-between gap-x-2 sm:gap-x-3 lg:gap-x-4 xl:gap-x-6 h-14 sm:h-16 nav:flex-nowrap nav:gap-x-2 nav:max-xl:gap-x-1.5 xl:gap-x-4 2xl:gap-x-6 max-nav:pl-2 max-nav:pr-3 sm:max-nav:pl-3 sm:max-nav:pr-4 md:max-nav:pl-4 md:max-nav:pr-6 lg:max-nav:pl-4 lg:max-nav:pr-8 nav:pl-[max(0px,env(safe-area-inset-left,0px))] nav:pr-[max(0.75rem,env(safe-area-inset-right,0px))] xl:pr-[max(1.5rem,env(safe-area-inset-right,0px))] 2xl:pr-[max(2rem,env(safe-area-inset-right,0px))]">
            {/* Hamburger for nav items: md–nav tier only (left side); hidden on mobile and desktop */}
            <div ref={mediumNavRef} className="hidden md:flex nav:hidden items-center flex-shrink-0 relative">
              <button
                onClick={() => setIsMediumNavOpen(!isMediumNavOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
                style={{
                  color: isMediumNavOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: isMediumNavOpen ? 'var(--bg-tertiary)' : 'transparent'
                }}
                aria-label="Toggle navigation menu"
                aria-expanded={isMediumNavOpen}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMediumNavOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              {isMediumNavOpen && (
                  <div className="dropdown-menu-glass-gradient-v absolute left-0 top-full mt-1 z-50 w-72 max-h-[80vh] overflow-y-auto rounded-lg">
                    <MediumNavPanel navigation={memoizedNavigation} onNavigate={() => setIsMediumNavOpen(false)} comingSoon={comingSoon} />
                  </div>
              )}
            </div>

            {/* Logo + wordmark — first in row; shell has no mx-auto / max-w cap */}
            <div className="shrink-0 pl-3 sm:pl-4 md:pl-5 nav:pl-5 xl:pl-6 nav:mr-1 nav:max-xl:mr-0.5 xl:mr-2">
              <button
                type="button"
                onClick={() => { window.location.href = '/'; }}
                className="flex items-center gap-1.5 font-bold text-xl whitespace-nowrap text-left rounded-lg py-2 max-nav:pr-1 nav:px-0 nav:py-2"
                style={{ color: 'var(--text-primary)' }}
              >
                <Logo size={36} showText={true} showComic={false} className="shrink-0" />
              </button>
            </div>

            {/* Desktop: single-row nav (starts after logo) + right rail — flex-1 so nav never wraps to a second row */}
            <div className="hidden nav:flex nav:flex-1 nav:min-w-0 nav:items-center nav:justify-between nav:gap-1 nav:max-xl:gap-1 xl:gap-3 2xl:gap-4 overflow-visible">
              <div role="navigation" aria-label="Site sections" className="flex flex-nowrap items-center justify-start gap-x-0.5 nav:max-xl:gap-x-0.5 xl:gap-x-2 2xl:gap-x-3 min-w-0 flex-1 overflow-visible pr-1 nav:max-xl:pr-1 xl:pr-2">
                <DropdownMenu label="Trade & Deploy" items={memoizedNavigation.tradeAndDeploy} isOpen={tradeAndDeployDropdownOpen}
                  onToggle={() => { const next = !tradeAndDeployDropdownOpen; setAnalyticsDropdownOpen(false); setGovernanceDropdownOpen(false); setBoingDropdownOpen(false); setToolsDropdownOpen(false); setTradeAndDeployDropdownOpen(next); }}
                  onClose={() => setTradeAndDeployDropdownOpen(false)}
                />
                <DropdownMenu label="Analytics" items={memoizedNavigation.analytics} isOpen={analyticsDropdownOpen}
                  onToggle={() => { const next = !analyticsDropdownOpen; setTradeAndDeployDropdownOpen(false); setGovernanceDropdownOpen(false); setBoingDropdownOpen(false); setToolsDropdownOpen(false); setAnalyticsDropdownOpen(next); }}
                  onClose={() => setAnalyticsDropdownOpen(false)}
                />
                <DropdownMenu label="Governance" items={memoizedNavigation.governance} isOpen={governanceDropdownOpen}
                  onToggle={() => { const next = !governanceDropdownOpen; setTradeAndDeployDropdownOpen(false); setAnalyticsDropdownOpen(false); setBoingDropdownOpen(false); setToolsDropdownOpen(false); setGovernanceDropdownOpen(next); }}
                  onClose={() => setGovernanceDropdownOpen(false)}
                />
                <DropdownMenu label="BOING" items={memoizedNavigation.boing} isOpen={boingDropdownOpen}
                  onToggle={() => { const next = !boingDropdownOpen; setTradeAndDeployDropdownOpen(false); setAnalyticsDropdownOpen(false); setGovernanceDropdownOpen(false); setToolsDropdownOpen(false); setBoingDropdownOpen(next); }}
                  onClose={() => setBoingDropdownOpen(false)}
                />
              </div>
              <div className="flex nav:flex-nowrap nav:items-center shrink-0 min-w-0 gap-1 nav:max-xl:gap-1.5 xl:gap-2 2xl:gap-3 overflow-visible">
                <div className="flex-shrink-0 relative">
                  <ToolsDropdown
                    isOpen={toolsDropdownOpen}
                    onToggle={() => { const next = !toolsDropdownOpen; setTradeAndDeployDropdownOpen(false); setAnalyticsDropdownOpen(false); setGovernanceDropdownOpen(false); setBoingDropdownOpen(false); setToolsDropdownOpen(next); }}
                    onClose={() => setToolsDropdownOpen(false)}
                    onOpenHistory={() => { setHistoryModalOpen(true); setToolsDropdownOpen(false); }}
                    onOpenDefi101={() => { setDefi101Open(true); setToolsDropdownOpen(false); }}
                  />
                </div>
                <div className="flex items-center gap-1 nav:max-xl:gap-1.5 xl:gap-2 2xl:gap-3 border-l pl-1.5 nav:max-xl:pl-2 xl:pl-3 shrink-0 min-w-0" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex-shrink-0"><ChainTypeSelector /></div>
                  <div className="flex-shrink-0"><NetworkSelector /></div>
                  <div className="flex-shrink-0"><WalletConnect /></div>
                </div>
              </div>
            </div>

            {/* Tools + Network + Wallet: md–nav tier (right side when hamburger is shown) */}
            <div className="hidden md:flex nav:hidden items-center gap-2 pl-3 border-l flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex-shrink-0"><ToolsDropdown isOpen={toolsDropdownOpen} onToggle={() => { const next = !toolsDropdownOpen; setIsMediumNavOpen(false); setToolsDropdownOpen(next); }} onClose={() => setToolsDropdownOpen(false)}
                  onOpenHistory={() => { setHistoryModalOpen(true); setToolsDropdownOpen(false); }}
                  onOpenDefi101={() => { setDefi101Open(true); setToolsDropdownOpen(false); }}
                /></div>
                <div className="flex-shrink-0"><NetworkSelector /></div>
                <div className="flex-shrink-0"><WalletConnect /></div>
            </div>

            {/* Mobile menu button - Show below 768px */}
            <div className="md:hidden flex-shrink-0">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-theme-secondary hover:text-theme-primary focus:outline-none p-2 rounded-md transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="dropdown-menu-glass-gradient-h md:hidden border-t border-border shadow-lg">
            <div className="px-4 py-3 space-y-3">
              {/* Trade & Deploy Section (merged Trading + Deployment) */}
              <div className="dropdown-menu-glass-gradient-strip rounded-lg p-3 border border-border">
                <h3 className="text-sm font-medium mb-2 px-1" style={{ color: 'var(--text-secondary)' }}>Trade & Deploy</h3>
                <div className="space-y-1">
                  {memoizedNavigation.tradeAndDeploy.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => {
                        if (item.isAvailable && !item.comingSoon) {
                          window.location.href = item.href;
                          closeMenu();
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-3 ${(item.comingSoon || !item.isAvailable) ? 'cursor-not-allowed opacity-60' : ''}`}
                      style={{
                        color: (item.comingSoon || !item.isAvailable) ? 'var(--text-tertiary)' : 'var(--text-secondary)'
                      }}
                      onMouseEnter={(e) => {
                        if (item.isAvailable && !item.comingSoon) {
                          e.target.style.color = 'var(--text-primary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (item.isAvailable && !item.comingSoon) {
                          e.target.style.color = 'var(--text-secondary)';
                        }
                      }}
                      disabled={item.comingSoon || !item.isAvailable}
                      title={item.comingSoon ? comingSoon.tooltip : (item.testnetOnly ? 'Available on Sepolia testnet only' : '')}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span>{item.name}</span>
                          {(item.comingSoon || !item.isAvailable) && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-400/30 animate-pulse">{comingSoon.label}</span>
                          )}
                          {item.testnetOnly && item.isAvailable && !item.comingSoon && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-400/35">Testnet Only</span>
                          )}
                        </div>
                        {item.description && (
                          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.description}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Analytics Section */}
              <div className="dropdown-menu-glass-gradient-strip rounded-lg p-3 border border-border">
                <h3 className="text-sm font-medium mb-2 px-1" style={{ color: 'var(--text-secondary)' }}>Analytics</h3>
                <div className="space-y-1">
                  {memoizedNavigation.analytics.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => {
                        if (item.isAvailable && !item.comingSoon) {
                          window.location.href = item.href;
                          closeMenu();
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-3 ${(item.comingSoon || !item.isAvailable) ? 'cursor-not-allowed opacity-60' : ''}`}
                      style={{
                        color: (item.comingSoon || !item.isAvailable) ? 'var(--text-tertiary)' : 'var(--text-secondary)'
                      }}
                      onMouseEnter={(e) => {
                        if (item.isAvailable && !item.comingSoon) {
                          e.target.style.color = 'var(--text-primary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (item.isAvailable && !item.comingSoon) {
                          e.target.style.color = 'var(--text-secondary)';
                        }
                      }}
                      disabled={item.comingSoon || !item.isAvailable}
                      title={item.comingSoon ? comingSoon.tooltip : (item.testnetOnly ? 'Available on Sepolia testnet only' : '')}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span>{item.name}</span>
                          {(item.comingSoon || !item.isAvailable) && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-400/30 animate-pulse">{comingSoon.label}</span>
                          )}
                          {item.testnetOnly && item.isAvailable && !item.comingSoon && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-400/35">Testnet Only</span>
                          )}
                        </div>
                        {item.description && (
                          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.description}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Governance Section */}
              <div className="dropdown-menu-glass-gradient-strip rounded-lg p-3 border border-border">
                <h3 className="text-sm font-medium mb-2 px-1" style={{ color: 'var(--text-secondary)' }}>Governance</h3>
                <div className="space-y-1">
                  {memoizedNavigation.governance.map((item) => (
                    <button key={item.name} onClick={() => { if (item.isAvailable && !item.comingSoon) { window.location.href = item.href; closeMenu(); } }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-3 ${(item.comingSoon || !item.isAvailable) ? 'cursor-not-allowed opacity-60' : ''}`}
                      style={{ color: (item.comingSoon || !item.isAvailable) ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}
                      disabled={item.comingSoon || !item.isAvailable} title={item.comingSoon ? comingSoon.tooltip : ''}>
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span>{item.name}</span>
                          {(item.comingSoon || !item.isAvailable) && <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-400/30 animate-pulse">{comingSoon.label}</span>}
                        </div>
                        {item.description && <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.description}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* BOING Section */}
              <div className="dropdown-menu-glass-gradient-strip rounded-lg p-3 border border-border">
                <h3 className="text-sm font-medium mb-2 px-1" style={{ color: 'var(--text-secondary)' }}>BOING</h3>
                <div className="space-y-1">
                  {memoizedNavigation.boing.map((item) => (
                    <button key={item.name} onClick={() => { if (item.isAvailable && !item.comingSoon) { window.location.href = item.href; closeMenu(); } }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-3 ${(item.comingSoon || !item.isAvailable) ? 'cursor-not-allowed opacity-60' : ''}`}
                      style={{ color: (item.comingSoon || !item.isAvailable) ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}
                      disabled={item.comingSoon || !item.isAvailable} title={item.comingSoon ? comingSoon.tooltip : ''}>
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span>{item.name}</span>
                          {(item.comingSoon || !item.isAvailable) && <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-400/30 animate-pulse">{comingSoon.label}</span>}
                        </div>
                        {item.description && <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.description}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Wallet Controls */}
              <div className="space-y-3 pt-3 border-t border-border">
                <button
                  onClick={() => {
                    setAiChatOpen(true);
                    closeMenu();
                  }}
                  className="dropdown-menu-glass-gradient-strip w-full text-left px-3 py-3 rounded-lg text-base font-medium transition-colors flex items-center space-x-3 border border-border"
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
                  onMouseEnter={(e) => { e.target.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.target.style.color = 'var(--text-secondary)'; }}
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span>AI DeFi Assistant</span>
                </button>
                <button
                  onClick={() => {
                    setHistoryModalOpen(true);
                    closeMenu();
                  }}
                  className="dropdown-menu-glass-gradient-strip w-full text-left px-3 py-3 rounded-lg text-base font-medium transition-colors flex items-center space-x-3 border border-border"
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
                  onMouseEnter={(e) => { e.target.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.target.style.color = 'var(--text-secondary)'; }}
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Transaction History</span>
                </button>
                <div
                  className="dropdown-menu-glass-gradient-strip w-full text-left px-3 py-3 rounded-lg text-base font-medium flex items-center space-x-3 border border-border"
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
                >
                  <span>Language</span>
                  <div className="ml-auto">
                    <LanguageSelector />
                  </div>
                </div>
                <div
                  className="dropdown-menu-glass-gradient-strip w-full text-left px-3 py-3 rounded-lg text-base font-medium flex items-center space-x-3 border border-border"
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
                >
                  <span>Theme</span>
                  <div className="ml-auto">
                    <ThemeToggle />
                  </div>
                </div>
                <div className="space-y-2">
                  <ChainTypeSelector />
                  <NetworkSelector />
                  <WalletConnect />
                </div>
              </div>
            </div>
          </div>
        )}
        </nav>
        {/* Deep Trade: scrolling ticker on landing only — in flow directly under nav */}
        {isLandingPage && <TickerBar />}
      </header>

      <main className="flex-1 flex flex-col relative min-h-0">
        {/* Page Content with Error Boundary and Suspense — scroll container for long home content */}
        <ErrorBoundary>
          <div className="relative z-10 flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden pb-6 sm:pb-8">
            <DevnetCurrencyDisclaimer />
            <Suspense fallback={<LoadingSpinner />}>
              <PageTransitionRoutes />
            </Suspense>
          </div>
        </ErrorBoundary>
      </main>
      
      <Suspense fallback={null}>
        <OnboardingTour />
        {historyModalOpen && (
          <TransactionHistoryModal
            isOpen={historyModalOpen}
            onClose={() => setHistoryModalOpen(false)}
          />
        )}
        {aiChatOpen && (
          <AIChatModal isOpen={aiChatOpen} onClose={() => setAiChatOpen(false)} />
        )}
        {defi101Open && (
          <DeFi101Modal isOpen={defi101Open} onClose={() => setDefi101Open(false)} />
        )}
      </Suspense>
      {/* Floating AI Assistant button - bottom right, visible on all pages */}
      <button
        type="button"
        onClick={() => setAiChatOpen(true)}
        className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] right-[max(1.5rem,env(safe-area-inset-right,0px))] z-[40] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent"
        style={{
          background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-cyan))',
          border: '1px solid var(--border-hover)',
          boxShadow: '0 4px 20px var(--glow-cyan)'
        }}
        aria-label="Open AI DeFi Assistant"
        title="AI Assistant"
      >
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      <footer className="site-footer w-full flex-shrink-0 mt-auto relative z-20">
        <ShootingStars dense />
        <div className="max-w-7xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 nav:pl-[max(1rem,env(safe-area-inset-left,0px))] nav:pr-[max(1rem,env(safe-area-inset-right,0px))]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10">
            {/* Brand Section - Full width on mobile, spans 5 columns on larger screens */}
            <div className="lg:col-span-5 relative">
              <div className="flex items-center mb-4 sm:mb-6">
                <Logo size={48} className="mr-3 sm:mr-4" showText={true} showComic={false} />
              </div>
              {/* Official Boing Bot mascot - design system asset */}
              <img
                src={`${process.env.PUBLIC_URL || ''}/assets/mascot-default.png`}
                alt=""
                className="boing-hero-float absolute -right-2 bottom-0 w-24 h-auto opacity-30 pointer-events-none hidden sm:block"
                style={{ maxHeight: '100px', objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <p className="text-sm sm:text-base font-medium mb-1 bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--accent-teal), var(--accent-cyan))', WebkitBackgroundClip: 'text' }}>
                Authentic. Decentralized. Optimal. Quality-Assured.
              </p>
              <p className="text-xs sm:text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Swap, bridge, and deploy on EVM and Solana—one interface.
              </p>
              <div className="flex space-x-3 sm:space-x-4">
                <a href="https://twitter.com/boing_finance" target="_blank" rel="noopener noreferrer" className="transition-colors p-1 sm:p-2" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>
                  <span className="sr-only">Twitter</span>
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="https://t.me/boing_finance" target="_blank" rel="noopener noreferrer" className="transition-colors p-1 sm:p-2" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>
                  <span className="sr-only">Telegram</span>
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </a>
                <a href="https://discord.gg/7RDtQtQvBW" target="_blank" rel="noopener noreferrer" className="transition-colors p-1 sm:p-2" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>
                  <span className="sr-only">Discord</span>
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Resources Links - spans 3 columns on larger screens */}
            <div className="lg:col-span-3">
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>Resources</h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li><a href="/docs" className="transition-colors block py-1" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Documentation</a></li>
                <li><a href="/whitepaper" className="transition-colors block py-1" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Whitepaper</a></li>
                <li><a href="/terms" className="transition-colors block py-1" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Terms of Service</a></li>
                <li><a href="/privacy" className="transition-colors block py-1" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Privacy Policy</a></li>
              </ul>
            </div>
            
            {/* Support Links - spans 3 columns on larger screens */}
            <div className="lg:col-span-3">
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>Support</h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li><a href="/help-center" className="transition-colors block py-1" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Help Center</a></li>
                <li><a href="/contact-us" className="transition-colors block py-1" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Contact Us</a></li>
                <li><a href="/status" className="transition-colors block py-1" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Status</a></li>
                <li><a href="/bug-report" className="transition-colors block py-1" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Bug Report</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border">
            <p className="text-xs sm:text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
              © 2026 boing.finance. All rights reserved. Built with ❤️ for the DeFi community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  const queryClient = React.useMemo(() => getQueryClient(), []);

  // Add global error handler for React Query errors
  React.useEffect(() => {
    const handleError = (event) => {
      // Check if this is a React Query related error
      if (event.error && (
        event.error.message?.includes('defaultQueryOptions') ||
        event.error.message?.includes('QueryClient') ||
        event.error.stack?.includes('react-query') ||
        event.error.stack?.includes('tanstack')
      )) {
        console.error('[App] React Query error caught:', event.error);
        // Prevent the error from crashing the app
        event.preventDefault();
        // Optionally reset the QueryClient
        try {
          queryClient.clear();
        } catch (e) {
          // Error clearing QueryClient
        }
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && (
        event.reason.message?.includes('defaultQueryOptions') ||
        event.reason.message?.includes('QueryClient')
      )) {
        // React Query promise rejection caught
        event.preventDefault();
      }
    });

    return () => {
      window.removeEventListener('error', handleError);
    };
  }, [queryClient]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <ThemeProvider>
            <WalletProvider>
              <BoingNativeDexIntegrationProvider>
              <SolanaWalletProvider>
              <ChainRealtimeProvider>
              <AchievementProvider>
                <AchievementOverlay />
              <BaseMiniAppWrapper>
                <Router>
                  <InitialAnimationGate>
                  <Helmet>
                    <link rel="icon" type="image/png" href={`/favicon-32x32.png${getBrandAssetVersionSuffix()}`} sizes="32x32" />
                    <link rel="icon" type="image/png" href={`/favicon-16x16.png${getBrandAssetVersionSuffix()}`} sizes="16x16" />
                    <link rel="icon" type="image/png" href={`/favicon-96x96.png${getBrandAssetVersionSuffix()}`} sizes="96x96" />
                    <link rel="icon" type="image/png" href={`/favicon.png${getBrandAssetVersionSuffix()}`} sizes="512x512" />
                    
                    {/* Farcaster Mini App Embed Meta Tags */}
                    <meta name="fc:miniapp" content={JSON.stringify({
                      version: '1',
                      imageUrl: brandShareImageAbsolute(),
                      button: {
                        title: 'Open boing.finance',
                        action: { type: 'launch_miniapp', url: 'https://boing.finance' },
                      },
                    })} />
                    
                    {/* Open Graph Meta Tags for better sharing */}
                    <meta property="og:title" content="Boing Finance — DeFi That Bounces Back" />
                    <meta property="og:description" content="Deploy tokens, create pools, and trade on EVM and Solana. Swap, bridge, and launch with Boing Finance." />
                    <meta property="og:image" content={brandShareImageAbsolute()} />
                    <meta property="og:image:alt" content="Boing Finance — DeFi That Bounces Back; brand mark on stone-dark background" />
                    <meta property="og:url" content="https://boing.finance/" />
                    <meta property="og:type" content="website" />
                    
                    {/* Twitter Card Meta Tags */}
                    <meta name="twitter:card" content="summary_large_image" />
                    <meta name="twitter:title" content="Boing Finance — DeFi That Bounces Back" />
                    <meta name="twitter:description" content="Deploy tokens, create pools, and trade on EVM and Solana with ease." />
                    <meta name="twitter:image" content={brandShareImageAbsolute()} />
                    <meta name="twitter:image:alt" content="Boing Finance — DeFi That Bounces Back; brand preview with medallion mark" />
                  </Helmet>
                  <AppContent />
                  </InitialAnimationGate>
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                      },
                    }}
                  />
                </Router>
              </BaseMiniAppWrapper>
              </AchievementProvider>
              </ChainRealtimeProvider>
              </SolanaWalletProvider>
              </BoingNativeDexIntegrationProvider>
            </WalletProvider>
          </ThemeProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Tools dropdown: Language, Theme, Transaction History, DeFi 101 (AI Assistant is in floating FAB)
// Renders panel via portal so it is not clipped by overflow-x-hidden on the app wrapper.
function ToolsDropdown({ isOpen, onToggle, onClose, onOpenHistory, onOpenDefi101 }) {
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({ top: rect.bottom + 8, right: Math.max(8, window.innerWidth - rect.right) });
  }, [isOpen]);

  useCloseOnPointerOutside(
    isOpen,
    (node) =>
      Boolean(buttonRef.current?.contains(node) || panelRef.current?.contains(node)),
    onClose
  );

  const dropdownContent = isOpen && (
      <div
        ref={panelRef}
        className="dropdown-menu-glass-solid-nav fixed w-52 rounded-xl z-[120]"
        style={{
          top: position.top,
          right: position.right,
        }}
      >
        <div className="py-2 px-2">
          <div className="flex items-center justify-between px-3 py-2 border-b mb-2" style={{ borderColor: 'var(--border-color)' }}>
            <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Language</span>
            <LanguageSelector />
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-b mb-2" style={{ borderColor: 'var(--border-color)' }}>
            <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Theme</span>
            <ThemeToggle />
          </div>
          <button onClick={onOpenHistory} className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 rounded-lg transition-colors hover:bg-[var(--secondary-bg)]" style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Transaction History
          </button>
          <button onClick={onOpenDefi101} className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 rounded-lg transition-colors hover:bg-[var(--secondary-bg)]" style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            DeFi 101
          </button>
        </div>
      </div>
  );

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        className="p-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center hover:bg-[var(--secondary-bg)]"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={(e) => { e.target.style.color = 'var(--text-primary)'; }}
        onMouseLeave={(e) => { e.target.style.color = 'var(--text-secondary)'; }}
        aria-label="Tools and preferences"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Tools"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <svg className={`w-4 h-4 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {dropdownContent && typeof document !== 'undefined' && document.body
        ? createPortal(dropdownContent, document.body)
        : null}
    </div>
  );
}

// Medium viewport nav panel (hamburger dropdown)
function MediumNavPanel({ navigation, onNavigate, comingSoon }) {
  const NavSection = ({ title, items }) => (
    <div className="p-2 border-b last:border-b-0" style={{ borderColor: 'var(--border-color)' }}>
      <h3 className="text-xs font-medium mb-1.5 px-2 uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{title}</h3>
      <div className="space-y-0.5">
        {items.map((item) => (
          <button
            key={item.name}
            onClick={() => {
              if (item.isAvailable && !item.comingSoon) {
                window.location.href = item.href;
                onNavigate();
              }
            }}
            className={`w-full text-left px-2 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${(item.comingSoon || !item.isAvailable) ? 'cursor-not-allowed opacity-60' : ''}`}
            style={{ color: (item.comingSoon || !item.isAvailable) ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}
            onMouseEnter={(e) => { if (item.isAvailable && !item.comingSoon) e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { if (item.isAvailable && !item.comingSoon) e.currentTarget.style.color = 'var(--text-secondary)'; }}
            disabled={item.comingSoon || !item.isAvailable}
            title={item.comingSoon ? comingSoon.tooltip : ''}
          >
            <span className="text-base">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span>{item.name}</span>
                {(item.comingSoon || !item.isAvailable) && (
                  <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-400/30 animate-pulse">{comingSoon.label}</span>
                )}
                {item.testnetOnly && item.isAvailable && !item.comingSoon && (
                  <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-400/30">Testnet</span>
                )}
              </div>
              {item.description && (
                <div className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{item.description}</div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div className="py-2">
      <NavSection title="Trade & Deploy" items={navigation.tradeAndDeploy} />
      <NavSection title="Analytics" items={navigation.analytics} />
      <NavSection title="Governance" items={navigation.governance} />
      <NavSection title="BOING" items={navigation.boing} />
    </div>
  );
}

// Modified DropdownMenu to support coming soon
function DropdownMenu({ label, items, isOpen, onToggle, onClose }) {
  const rootRef = useRef(null);
  useCloseOnPointerOutside(
    isOpen,
    (node) => Boolean(rootRef.current?.contains(node)),
    onClose
  );

  return (
    <div ref={rootRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={onToggle}
        className="px-1.5 py-1.5 nav:max-xl:px-1.5 xl:px-2.5 2xl:px-3 rounded-lg text-sm nav:max-xl:text-xs xl:text-sm font-medium transition-all duration-200 flex items-center space-x-0.5 xl:space-x-1 group hover:bg-[var(--secondary-bg)] shrink-0"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
        onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>{label}</span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
          <div className="dropdown-menu-glass-solid-nav absolute top-full left-0 mt-2 w-52 rounded-xl z-[120]">
          <div className="py-1.5">
            {items.map((item) => {
              // Explicit boolean checks with logging
              const isComingSoon = Boolean(item.comingSoon);
              const isAvailable = Boolean(item.isAvailable);
              const shouldDisable = isComingSoon || !isAvailable;
              
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    if (!shouldDisable) {
                      // Navigating to item
                      window.location.href = item.href;
                      onClose();
                    } else {
                      // Item is disabled
                    }
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center space-x-3 group transition-all duration-200 rounded-lg mx-1 ${shouldDisable ? 'cursor-not-allowed opacity-60' : 'hover:bg-[var(--secondary-bg)]'}`}
                  style={{
                    color: shouldDisable ? 'var(--text-tertiary)' : 'var(--text-secondary)'
                  }}
                  onMouseEnter={(e) => {
                    if (isAvailable && !isComingSoon) {
                      e.target.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isAvailable && !isComingSoon) {
                      e.target.style.color = 'var(--text-secondary)';
                    }
                  }}
                  disabled={shouldDisable}
                  title={shouldDisable ? comingSoon.tooltip : (item.testnetOnly ? 'Available on Sepolia testnet only' : '')}
                >
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span>{item.name}</span>
                      {shouldDisable && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-400/30 animate-pulse">{comingSoon.label}</span>
                      )}
                      {item.testnetOnly && isAvailable && !isComingSoon && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-400/30">Testnet Only</span>
                      )}
                    </div>
                    {item.description && (
                      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.description}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 