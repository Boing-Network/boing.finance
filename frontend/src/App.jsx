import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './i18n'; // Initialize i18n
import { WalletProvider } from './contexts/WalletContext';
import { SolanaWalletProvider } from './contexts/SolanaWalletContext';
import ChainTypeSelector from './components/ChainTypeSelector';
import { ThemeProvider } from './contexts/ThemeContext';
import { AchievementProvider } from './contexts/AchievementContext';
import AchievementOverlay from './components/AchievementOverlay';
import { useWalletConnection } from './hooks/useWalletConnection';
import BaseMiniAppWrapper from './components/BaseMiniAppWrapper';
import BaseNetworkOptimizer from './components/BaseNetworkOptimizer';
import WalletConnect from './components/WalletConnect';
import NetworkSelector from './components/NetworkSelector';
import TransactionHistoryModal from './components/TransactionHistoryModal';
import AIChatModal from './components/AIChatModal';
import ThemeToggle from './components/ThemeToggle';
import LanguageSelector from './components/LanguageSelector';
import Logo from './components/Logo';
import ShootingStars from './components/ShootingStars';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import OnboardingTour from './components/OnboardingTour';
import OnboardingChecklist from './components/OnboardingChecklist';
import ForYouSection from './components/ForYouSection';
import ProactiveTipsBanner from './components/ProactiveTipsBanner';
import DeFi101Modal from './components/DeFi101Modal';
import TickerBar from './components/TickerBar';
import BoingNativeTokenPanel from './components/BoingNativeTokenPanel';
import BoingAnimatedBackground, { getFinanceBackgroundVariant } from './components/BoingAnimatedBackground';
import CinematicIntro, { shouldShowCinematicIntro } from './components/CinematicIntro';
import { getPageVariant } from './utils/pageVariant';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion';
import { useCloseOnPointerOutside } from './hooks/useCloseOnPointerOutside';
import priceAlertService from './services/priceAlertService';

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

// Helper for coming soon
const comingSoon = {
  label: 'Coming Soon',
  tooltip: 'This feature is currently under development and will be available soon.'
};

// Navigation data with categories - explicit boolean flags for state management
// Trade & Deploy = merged Trading + Deployment for single-row navbar
const createNavigation = () => {
  const trading = Object.freeze([
    Object.freeze({ name: 'Swap', href: '/swap', icon: '🔄', description: 'Trade tokens instantly', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Bridge', href: '/bridge', icon: '🌉', description: 'Cross-chain transfers', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Pools', href: '/pools', icon: '🏊', description: 'Liquidity pools', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Tokens', href: '/tokens', icon: '🪙', description: 'Token management', isAvailable: true, comingSoon: false, testnetOnly: false })
  ]);
  const deployment = Object.freeze([
    Object.freeze({ name: 'Deploy Token', href: '/deploy-token', icon: '🚀', description: 'Create your own tokens', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Create NFT', href: '/create-nft', icon: '🖼️', description: 'Mint NFTs', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Create Pool', href: '/create-pool', icon: '🏊', description: 'Create liquidity pools', isAvailable: true, comingSoon: false, testnetOnly: false })
  ]);
  return Object.freeze({
  trading,
  deployment,
  tradeAndDeploy: Object.freeze([...trading, ...deployment]),
  analytics: Object.freeze([
    Object.freeze({ name: 'Analytics', href: '/analytics', icon: '📊', description: 'Market insights', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Portfolio', href: '/portfolio', icon: '💼', description: 'Your holdings', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Activity', href: '/activity', icon: '📋', description: 'Swaps, liquidity & bridge', isAvailable: true, comingSoon: false, testnetOnly: false })
  ]),
  governance: Object.freeze([
    Object.freeze({ name: 'Proposals', href: '/governance/proposals', icon: '📜', description: 'View and vote on proposals', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Vote', href: '/governance/vote', icon: '🗳️', description: 'Participate in governance', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Treasury', href: '/governance/treasury', icon: '🏦', description: 'DAO treasury overview', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Roadmap', href: '/governance/roadmap', icon: '🗺️', description: 'Governance roadmap', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Community', href: '/governance/community', icon: '👥', description: 'Forum & social links', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'How it works', href: '/governance/learn', icon: '📖', description: 'Governance guide', isAvailable: true, comingSoon: false, testnetOnly: false })
  ]),
  boing: Object.freeze([
    Object.freeze({ name: 'NFT Staking', href: '/boing/staking', icon: '🎴', description: 'Stake Boing NFTs for rewards', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Points', href: '/boing/points', icon: '⭐', description: 'Boing points & rewards', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Roadmap', href: '/boing/roadmap', icon: '🚀', description: 'Boing community roadmap', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Activities', href: '/boing/activities', icon: '🎯', description: 'Community activities & events', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Native VM (RPC)', href: '/boing/native-vm', icon: '⚙️', description: 'Boing JSON-RPC: account, QA, simulate & submit', isAvailable: true, comingSoon: false, testnetOnly: false })
  ])
  });
};

// Create navigation once and store in module scope to prevent recreation
const navigation = createNavigation();

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
  return (
    <div key={location.pathname} className="page-transition-enter flex-1 flex flex-col min-h-0">
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
  const { account } = useWalletConnection();

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
  const useAnimatedBg = !prefersReducedMotion;
  const pageVariant = getPageVariant(location.pathname);
  const pageBackgroundClass = isLandingPage
    ? `page-landing deep-trade-bg page-variant-${pageVariant}${useAnimatedBg ? ' animated-bg' : ''}`
    : `page-app page-variant-${pageVariant}${useAnimatedBg ? ' animated-bg' : ''}`;
  const bgVariant = getFinanceBackgroundVariant(location.pathname);

  return (
    <div className={`relative flex flex-col min-h-screen min-w-0 overflow-x-hidden ${pageBackgroundClass}`}>
      {useAnimatedBg && <BoingAnimatedBackground variant={bgVariant} />}
      <BaseNetworkOptimizer />
      
      {/* Header: nav + ticker (sticky so ticker sits in flow directly under nav) */}
      <header className="sticky top-0 z-30 flex flex-col flex-shrink-0 w-full min-w-0 bg-[var(--bg-primary)]">
        <nav className="relative flex-shrink-0 w-full min-w-0 border-b border-border shadow-lg" aria-label="Primary navigation">
          <ShootingStars dense />
          {/* Full-width row (no max-w-7xl/mx-auto — avoids centering inset on logo) */}
          <div className="flex w-full min-w-0 items-center justify-between gap-x-2 sm:gap-x-3 lg:gap-x-4 xl:gap-x-6 h-14 sm:h-16 min-[1150px]:flex-nowrap min-[1150px]:gap-x-2 min-[1150px]:max-xl:gap-x-1.5 xl:gap-x-4 2xl:gap-x-6 max-[1149px]:pl-2 max-[1149px]:pr-3 sm:max-[1149px]:pl-3 sm:max-[1149px]:pr-4 md:max-[1149px]:pl-4 md:max-[1149px]:pr-6 lg:max-[1149px]:pl-4 lg:max-[1149px]:pr-8 min-[1150px]:pl-[max(0px,env(safe-area-inset-left,0px))] min-[1150px]:pr-[max(0.75rem,env(safe-area-inset-right,0px))] xl:pr-[max(1.5rem,env(safe-area-inset-right,0px))] 2xl:pr-[max(2rem,env(safe-area-inset-right,0px))]">
            {/* Hamburger for nav items: 768px–1149px only (left side); hidden on mobile and desktop */}
            <div ref={mediumNavRef} className="hidden md:flex min-[1150px]:hidden items-center flex-shrink-0 relative">
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
            <div className="shrink-0 max-md:-ml-1 min-[1150px]:mr-1 min-[1150px]:max-xl:mr-0.5 xl:mr-2">
              <button
                type="button"
                onClick={() => { window.location.href = '/'; }}
                className="flex items-center gap-1.5 font-bold text-xl whitespace-nowrap text-left rounded-lg py-2 max-[1149px]:-ml-px max-[1149px]:pr-1 min-[1150px]:px-0 min-[1150px]:py-2"
                style={{ color: 'var(--text-primary)' }}
              >
                <Logo size={36} showText={true} showComic={false} className="shrink-0" style={{ filter: 'drop-shadow(0 0 8px var(--glow-cyan))' }} />
              </button>
            </div>

            {/* Desktop: single-row nav (starts after logo) + right rail — flex-1 so nav never wraps to a second row */}
            <div className="hidden min-[1150px]:flex min-[1150px]:flex-1 min-[1150px]:min-w-0 min-[1150px]:items-center min-[1150px]:justify-between min-[1150px]:gap-1 min-[1150px]:max-xl:gap-1 xl:gap-3 2xl:gap-4 overflow-visible">
              <div role="navigation" aria-label="Site sections" className="flex flex-nowrap items-center justify-start gap-x-0.5 min-[1150px]:max-xl:gap-x-0.5 xl:gap-x-2 2xl:gap-x-3 min-w-0 flex-1 overflow-visible pr-1 min-[1150px]:max-xl:pr-1 xl:pr-2">
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
              <div className="flex min-[1150px]:flex-nowrap min-[1150px]:items-center shrink-0 min-w-0 gap-1 min-[1150px]:max-xl:gap-1.5 xl:gap-2 2xl:gap-3 overflow-visible">
                <div className="flex-shrink-0 relative">
                  <ToolsDropdown
                    isOpen={toolsDropdownOpen}
                    onToggle={() => { const next = !toolsDropdownOpen; setTradeAndDeployDropdownOpen(false); setAnalyticsDropdownOpen(false); setGovernanceDropdownOpen(false); setBoingDropdownOpen(false); setToolsDropdownOpen(next); }}
                    onClose={() => setToolsDropdownOpen(false)}
                    onOpenHistory={() => { setHistoryModalOpen(true); setToolsDropdownOpen(false); }}
                    onOpenDefi101={() => { setDefi101Open(true); setToolsDropdownOpen(false); }}
                  />
                </div>
                <div className="flex items-center gap-1 min-[1150px]:max-xl:gap-1.5 xl:gap-2 2xl:gap-3 border-l pl-1.5 min-[1150px]:max-xl:pl-2 xl:pl-3 shrink-0 min-w-0" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex-shrink-0"><ChainTypeSelector /></div>
                  <div className="flex-shrink-0"><NetworkSelector /></div>
                  <div className="flex-shrink-0"><WalletConnect /></div>
                </div>
              </div>
            </div>

            {/* Tools + Network + Wallet: 768px–1149px (right side when hamburger is shown) */}
            <div className="hidden md:flex min-[1150px]:hidden items-center gap-2 pl-3 border-l flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
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
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-400/30">Testnet Only</span>
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
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-400/30">Testnet Only</span>
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
        {/* Page Content with Error Boundary and Suspense — scroll container so Pillars/Tokenomics etc. are reachable */}
        <ErrorBoundary>
          <div className="relative z-10 flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden">
            <BoingNativeTokenPanel />
            <Suspense fallback={<LoadingSpinner />}>
              <PageTransitionRoutes />
            </Suspense>
          </div>
        </ErrorBoundary>
      </main>
      
      {/* Onboarding Tour */}
      <OnboardingTour />
      
      {/* Transaction History Modal */}
      <TransactionHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        account={account}
      />

      {/* AI DeFi Assistant Modal */}
      <AIChatModal isOpen={aiChatOpen} onClose={() => setAiChatOpen(false)} />
      {/* Floating AI Assistant button - bottom right, visible on all pages */}
      <button
        type="button"
        onClick={() => setAiChatOpen(true)}
        className="fixed bottom-6 right-6 z-[40] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent"
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
      <DeFi101Modal isOpen={defi101Open} onClose={() => setDefi101Open(false)} />
      
      <footer className="w-full flex-shrink-0 mt-auto border-t border-border shadow-lg relative z-20" style={{
        backgroundColor: 'var(--bg-primary)'
      }}>
        <ShootingStars dense />
        <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
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
              <SolanaWalletProvider>
              <AchievementProvider>
                <AchievementOverlay />
              <BaseMiniAppWrapper>
                <Router>
                  <InitialAnimationGate>
                  <Helmet>
                    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
                    <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
                    <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
                    
                    {/* Farcaster Mini App Embed Meta Tags */}
                    <meta name="fc:miniapp" content='{"version":"1","imageUrl":"https://boing.finance/hero-image.png","button":{"title":"Open boing.finance","action":{"type":"launch_miniapp","url":"https://boing.finance"}}}' />
                    
                    {/* Open Graph Meta Tags for better sharing */}
                    <meta property="og:title" content="boing.finance - DeFi Platform" />
                    <meta property="og:description" content="Deploy tokens, create pools, and trade on EVM and Solana with ease." />
                    <meta property="og:image" content="https://boing.finance/hero-image.png" />
                    <meta property="og:url" content="https://boing.finance/" />
                    <meta property="og:type" content="website" />
                    
                    {/* Twitter Card Meta Tags */}
                    <meta name="twitter:card" content="summary_large_image" />
                    <meta name="twitter:title" content="boing.finance - DeFi Platform" />
                    <meta name="twitter:description" content="Deploy tokens, create pools, and trade on EVM and Solana with ease." />
                    <meta name="twitter:image" content="https://boing.finance/hero-image.png" />
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
              </SolanaWalletProvider>
            </WalletProvider>
          </ThemeProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Home component with all original features
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
        <link rel="canonical" href="https://boing.finance" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
        
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
            "url": "https://boing.finance/assets/icon-only-transparent.png"
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
                "text": "Token deployment costs vary by network. Basic deployment starts at 0.01 ETH on Ethereum, with different pricing for other networks. Check our Deploy Token page for current pricing."
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
                <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--finance-primary)', letterSpacing: '0.12em' }}>
                  Authentic. Decentralized. Optimal. Quality-Assured.
                </p>
                <p className="text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8" style={{ color: 'var(--text-secondary)' }}>
                  Swap, add liquidity, bridge assets, and deploy tokens on EVM and Solana—all in one place. No code required.
                </p>
                {/* Stats row */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-6 md:gap-8 mb-8" style={{ fontFamily: 'var(--font-display)' }}>
                  <div>
                    <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>$0 <span style={{ color: 'var(--finance-green)', fontSize: '0.6em' }}>fees</span></div>
                    <div className="text-xs uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Protocol Fee</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>~2s</div>
                    <div className="text-xs uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Block Time</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>2 <span style={{ color: 'var(--finance-green)', fontSize: '0.6em' }}>chains</span></div>
                    <div className="text-xs uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-tertiary)' }}>EVM + Solana</div>
                  </div>
                </div>
                {/* CTAs */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                  <a href="/swap" className="btn btn-green inline-flex items-center gap-2">
                    <span>⚡</span> Start Trading
                  </a>
                  <a href="/deploy-token" className="btn btn-primary inline-flex items-center gap-2">
                    + Deploy Token
                  </a>
                  <a href="/docs" className="btn btn-outline inline-flex items-center gap-2">
                    Get started →
                  </a>
                </div>
                {/* Feature highlights strip */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-10 fade-in delay-200">
                  <Highlight icon={<SwapIcon />} text="Lightning-fast swaps" />
                  <Highlight icon={<LiquidityIcon />} text="Earn with liquidity" />
                  <Highlight icon={<AnalyticsIcon />} text="Real-time analytics" />
                  <Highlight icon={<PortfolioIcon />} text="Unified portfolio" />
                  <Highlight icon={<BridgeIcon />} text="Cross-chain bridge" />
                  <Highlight icon={<TokensIcon />} text="All your tokens" />
                  <Highlight icon={<DeployTokenIcon />} text="Deploy tokens" />
                  <Highlight icon={<span className="text-xl">📜</span>} text="Governance" />
                  <Highlight icon={<span className="text-xl">🎯</span>} text="BOING Ecosystem" />
                  <Highlight icon={<span className="text-xl">🤖</span>} text="AI Assistant" />
                </div>
                <p className="text-lg text-center lg:text-left mt-6 max-w-xl mx-auto lg:mx-0" style={{ color: 'var(--text-secondary)' }}>Fast, secure DeFi. For everyone.</p>
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

          {/* Proactive Tips (when connected) - right after onboarding */}
          <section className="mb-20 md:mb-24 max-w-2xl mx-auto fade-in delay-350">
            <ProactiveTipsBanner />
          </section>

          {/* 3. Main product: Feature cards (Trade, Analytics, Deploy) */}
          <section className="space-y-10 mb-20 md:mb-24 fade-in delay-400">
            <h2 className="text-2xl font-bold text-center" style={{ color: 'var(--text-primary)' }}>What you can do</h2>
            {/* First row - 6 cards in 3 columns - dynamically generated from navigation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {memoizedNav.trading.map((item) => {
                // Explicit boolean checks with logging
                const isComingSoon = Boolean(item.comingSoon);
                const isAvailable = Boolean(item.isAvailable);
                const shouldShowComingSoon = isComingSoon || !isAvailable;
                
                const getIcon = () => {
                  if (item.name === 'Swap') return <SwapIcon />;
                  if (item.name === 'Pools') return <LiquidityIcon />;
                  if (item.name === 'Tokens') return <TokensIcon />;
                  if (item.name === 'Bridge') return <BridgeIcon />;
                  return null;
                };
                const CardContent = (
                  <FeatureCard 
                    title={item.name} 
                    icon={getIcon()}
                    description={item.description || ''} 
                    comingSoon={shouldShowComingSoon}
                  />
                );
                return shouldShowComingSoon ? (
                  <div key={item.name}>{CardContent}</div>
                ) : (
                  <a key={item.name} href={item.href} className="block">{CardContent}</a>
                );
              })}
              {memoizedNav.analytics.map((item) => {
                const isComingSoon = Boolean(item.comingSoon);
                const isAvailable = Boolean(item.isAvailable);
                const shouldShowComingSoon = isComingSoon || !isAvailable;
                const getIcon = () => {
                  if (item.name === 'Analytics') return <AnalyticsIcon />;
                  if (item.name === 'Portfolio') return <PortfolioIcon />;
                  if (item.name === 'Activity') return <ActivityIcon />;
                  return null;
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
              {memoizedNav.deployment.map((item) => {
                const getIcon = () => {
                  if (item.name === 'Deploy Token') return <DeployTokenIcon />;
                  if (item.name === 'Create NFT') return <span className="text-2xl">🖼️</span>;
                  if (item.name === 'Create Pool') return <LiquidityIcon />;
                  return <DeployTokenIcon />;
                };
                return (
                  <a key={item.name} href={item.href} className="block">
                    <FeatureCard title={item.name} icon={getIcon()} description={item.description || ''} />
                  </a>
                );
              })}
            </div>

            {/* The Pillars of the Boing Network — design system assets */}
            <section className="mt-20 md:mt-28 space-y-8">
              <h2 className="text-2xl md:text-3xl font-bold text-center" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display-serif)' }}>
                The Pillars of the Boing Network
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { id: 'security', name: 'Security', tagline: 'Safety and correctness first — always over speed.' },
                  { id: 'scalability', name: 'Scalability', tagline: 'High throughput without compromising the other pillars.' },
                  { id: 'decentralization', name: 'Decentralization', tagline: 'Anyone can participate. No one can shut the door.' },
                  { id: 'authenticity', name: 'Authenticity', tagline: 'One chain, one identity — authentic and independent.' },
                  { id: 'transparency', name: 'Transparency', tagline: '100% open — in design, governance, and operations. Trust through verification.' },
                  { id: 'quality', name: 'Quality Assurance', tagline: 'Legitimate purpose only — enforced by the network.' },
                ].map(({ id, name, tagline }) => (
                  <div
                    key={id}
                    className="card flex flex-col sm:flex-row items-center gap-4 p-5 text-center sm:text-left"
                  >
                    <img
                      src={`${process.env.PUBLIC_URL || ''}/assets/pillar-${id}.png`}
                      alt=""
                      className="w-20 h-20 object-contain flex-shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{name}</h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{tagline}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. Governance & BOING */}
            <section className="mt-20 md:mt-28">
              <h2 className="text-2xl font-bold text-center mb-8" style={{ color: 'var(--text-primary)' }}>Governance & Ecosystem</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Governance</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {memoizedNav.governance.slice(0, 4).map((item) => (
                    <a key={item.name} href={item.href} className="block">
                      <FeatureCard title={item.name} icon={<span className="text-xl">{item.icon}</span>} description={item.description || ''} />
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>BOING Ecosystem</h3>
                <div className="space-y-4">
                  {memoizedNav.boing.map((item) => (
                    <a key={item.name} href={item.href} className="block">
                      <FeatureCard title={item.name} icon={<span className="text-xl">{item.icon}</span>} description={item.description || ''} />
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

          {/* 6. Token creation CTA banner */}
          <div className="mt-24 md:mt-32 mb-10 flex justify-center fade-in delay-800">
            <div className="rounded-xl px-6 py-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 max-w-2xl">
              <div className="text-center">
                <div className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>🚀 Create Your Own Tokens & Trading Pairs!</div>
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Unlike centralized exchanges, boing allows anyone to deploy tokens and create trading pairs instantly. 
                  No permission required - just deploy, add liquidity, and start trading!
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <a href="/tokens" className="text-sm underline transition-colors hover:opacity-80" style={{ color: 'var(--primary-color)' }}>Browse Tokens</a>
                  <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                  <a href="/deploy-token" className="text-sm underline transition-colors hover:opacity-80" style={{ color: 'var(--primary-color)' }}>Deploy Token</a>
                  <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                  <a href="/create-pool" className="text-sm underline transition-colors hover:opacity-80" style={{ color: 'var(--primary-color)' }}>Create Pairs</a>
                  <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                  <a href="/swap" className="text-sm underline transition-colors hover:opacity-80" style={{ color: 'var(--primary-color)' }}>Start Trading</a>
                </div>
              </div>
            </div>
          </div>
      </div>
    </>
  );
}

// Floating Boing Astronaut Mascot (SVG, up-down animation) - kept for potential future use
function _BoingAstronaut() {
  return (
    <svg width="80" height="80" viewBox="0 0 200 200" className="animate-float" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <ellipse cx="100" cy="175" rx="28" ry="8" fill="currentColor" opacity="0.08" />
        <ellipse cx="100" cy="85" rx="48" ry="44" fill="var(--text-primary)" stroke="var(--border-color)" strokeWidth="3" />
        <ellipse cx="100" cy="85" rx="42" ry="38" fill="var(--accent-teal)" fillOpacity="0.2" stroke="var(--accent-cyan)" strokeWidth="3" />
        <ellipse cx="100" cy="90" rx="32" ry="30" fill="var(--text-primary)" stroke="var(--border-color)" strokeWidth="2" />
        <ellipse cx="88" cy="95" rx="5" ry="5" fill="var(--accent-cyan)" />
        <ellipse cx="112" cy="95" rx="5" ry="5" fill="var(--accent-cyan)" />
        <ellipse cx="88" cy="94" rx="1.2" ry="2" fill="var(--text-primary)" opacity="0.7" />
        <ellipse cx="112" cy="94" rx="1.2" ry="2" fill="var(--text-primary)" opacity="0.7" />
        <ellipse cx="85" cy="75" rx="12" ry="6" fill="var(--text-primary)" opacity="0.18" />
        <ellipse cx="100" cy="140" rx="28" ry="24" fill="var(--text-secondary)" stroke="var(--border-color)" strokeWidth="2" />
        <ellipse cx="78" cy="135" rx="7" ry="13" fill="var(--text-secondary)" stroke="var(--border-color)" strokeWidth="2" />
        <ellipse cx="122" cy="135" rx="7" ry="13" fill="var(--text-secondary)" stroke="var(--border-color)" strokeWidth="2" />
        <ellipse cx="72" cy="147" rx="6" ry="6" fill="var(--text-primary)" stroke="var(--border-color)" strokeWidth="2" />
        <ellipse cx="128" cy="147" rx="6" ry="6" fill="var(--text-primary)" stroke="var(--border-color)" strokeWidth="2" />
        <ellipse cx="88" cy="165" rx="7" ry="12" fill="var(--text-secondary)" stroke="var(--border-color)" strokeWidth="2" />
        <ellipse cx="112" cy="165" rx="7" ry="12" fill="var(--text-secondary)" stroke="var(--border-color)" strokeWidth="2" />
        <ellipse cx="88" cy="180" rx="8" ry="4" fill="var(--accent-purple)" />
        <ellipse cx="112" cy="180" rx="8" ry="4" fill="var(--accent-purple)" />
        <ellipse cx="100" cy="150" rx="10" ry="8" fill="var(--info-text)" stroke="var(--accent-cyan)" strokeWidth="1.5" />
      </g>
      <animateTransform attributeName="transform" type="translate" values="0 0; 0 -12; 0 0" dur="4s" repeatCount="indefinite" />
    </svg>
  );
}

// Feature Highlights Strip
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

// Feature Card Component (updated)
function FeatureCard({ title, icon, description, comingSoon }) {
  return (
    <div
      className={`group relative backdrop-blur-sm border border-border rounded-xl p-6 transition-all duration-500 overflow-hidden h-full flex flex-col ${comingSoon ? 'opacity-60 cursor-not-allowed' : 'hover:border-border-hover hover:scale-105 hover:shadow-xl'}`}
      style={{
        background: 'linear-gradient(to bottom right, var(--bg-card), var(--bg-secondary))',
        boxShadow: comingSoon ? undefined : '0 0 20px var(--glow-cyan)'
      }}
      title={comingSoon ? 'This feature will be available after mainnet launch.' : ''}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(to right, var(--secondary-bg), var(--accent-cyan-bg))' }}></div>
      <div className="relative z-10 text-center flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-center mb-4">
          <span className="text-2xl mr-3 transition-colors duration-300 animate-pulse group-hover:text-secondary" style={{ color: 'var(--accent-teal)' }}>{icon}</span>
          <h3 className="text-lg font-semibold transition-colors duration-300 flex items-center" style={{ color: 'var(--text-primary)' }}>
            {title}
            {comingSoon && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-400/30 animate-pulse">Coming Soon</span>
            )}
          </h3>
        </div>
        <p className="text-sm leading-relaxed transition-colors duration-300 flex-1" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      </div>
    </div>
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
        className="px-1.5 py-1.5 min-[1150px]:max-xl:px-1.5 xl:px-2.5 2xl:px-3 rounded-lg text-sm min-[1150px]:max-xl:text-xs xl:text-sm font-medium transition-all duration-200 flex items-center space-x-0.5 xl:space-x-1 group hover:bg-[var(--secondary-bg)] shrink-0"
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