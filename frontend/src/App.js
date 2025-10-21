import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from 'react-query';
import { WalletProvider } from './contexts/WalletContext';
import { useWalletConnection } from './hooks/useWalletConnection';
import EnhancedAnimatedBackground from './components/EnhancedAnimatedBackground';
import WalletConnect from './components/WalletConnect';
import NetworkSelector from './components/NetworkSelector';
import TransactionHistoryModal from './components/TransactionHistoryModal';
import Logo from './components/Logo';
import ShootingStars from './components/ShootingStars';
import Swap from './pages/Swap';
import Liquidity from './pages/Liquidity';
import Pools from './pages/Pools';
import Analytics from './pages/Analytics';
import Portfolio from './pages/Portfolio';
import Bridge from './pages/Bridge';
import DeployToken from './pages/DeployToken';
import CreatePool from './pages/CreatePool';
import Tokens from './pages/Tokens';
import Status from './pages/Status';
import Docs from './pages/Docs';
import HelpCenter from './pages/HelpCenter';
import HelpArticle from './pages/HelpArticle';
import ContactUs from './pages/ContactUs';
import BugReport from './pages/BugReport';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Whitepaper from './pages/Whitepaper';
import ExecutiveSummary from './pages/ExecutiveSummary';
import './styles/globals.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Helper for coming soon
const comingSoon = {
  label: 'Coming Soon',
  tooltip: 'This feature will be available after mainnet launch.'
};

// Navigation data with categories
const navigation = {
  home: { name: 'Home', href: '/', icon: '🏠' },
  trading: [
    { name: 'Swap', href: '/swap', icon: '🔄', description: 'Trade tokens instantly' },
    { name: 'Bridge', href: '/bridge', icon: '🌉', description: 'Cross-chain transfers', comingSoon: true },
    { name: 'Pools', href: '/pools', icon: '🏊', description: 'Liquidity pools' },
    { name: 'Tokens', href: '/tokens', icon: '🪙', description: 'Token management', comingSoon: true }
  ],
  analytics: [
    { name: 'Analytics', href: '/analytics', icon: '📊', description: 'Market insights', comingSoon: true },
    { name: 'Portfolio', href: '/portfolio', icon: '💼', description: 'Your holdings' }
  ],
  deployment: [
    { name: 'Deploy Token', href: '/deploy-token', icon: '🚀', description: 'Create your own tokens' },
    { name: 'Create Pool', href: '/create-pool', icon: '🏊', description: 'Create liquidity pools' }
  ]
};

function AppContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [tradingDropdownOpen, setTradingDropdownOpen] = useState(false);
  const [analyticsDropdownOpen, setAnalyticsDropdownOpen] = useState(false);
  const [deploymentDropdownOpen, setDeploymentDropdownOpen] = useState(false);
  const { account } = useWalletConnection();

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="relative min-h-screen bg-gray-900">
      <EnhancedAnimatedBackground />
      
      {/* Navigation */}
      <nav className="relative z-30 bg-gradient-to-r from-slate-800/95 via-slate-900/95 to-slate-800/95 backdrop-blur-sm border-b border-cyan-500/30 shadow-lg shadow-cyan-500/20">
        <ShootingStars />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center space-x-2 text-white font-bold text-xl"
              >
                <Logo size={40} showText={true} className="drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
              </button>
            </div>

            {/* Desktop Navigation - Show on large screens and above */}
            <div className="hidden lg:flex items-center justify-center flex-1">
              <nav className="flex items-center space-x-4 xl:space-x-6">
                {/* Home - Solo */}
                <button
                  onClick={() => window.location.href = navigation.home.href}
                  className="text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <span className="text-lg">{navigation.home.icon}</span>
                  <span>{navigation.home.name}</span>
                </button>

                {/* Trading Dropdown */}
                <DropdownMenu
                  label="Trading"
                  items={navigation.trading}
                  isOpen={tradingDropdownOpen}
                  onToggle={() => {
                    setTradingDropdownOpen(!tradingDropdownOpen);
                    setAnalyticsDropdownOpen(false);
                    setDeploymentDropdownOpen(false);
                  }}
                  onClose={() => setTradingDropdownOpen(false)}
                />

                {/* Analytics Dropdown */}
                <DropdownMenu
                  label="Analytics"
                  items={navigation.analytics}
                  isOpen={analyticsDropdownOpen}
                  onToggle={() => {
                    setAnalyticsDropdownOpen(!analyticsDropdownOpen);
                    setTradingDropdownOpen(false);
                    setDeploymentDropdownOpen(false);
                  }}
                  onClose={() => setAnalyticsDropdownOpen(false)}
                />

                {/* Deployment Dropdown */}
                <DropdownMenu
                  label="Deployment"
                  items={navigation.deployment}
                  isOpen={deploymentDropdownOpen}
                  onToggle={() => {
                    setDeploymentDropdownOpen(!deploymentDropdownOpen);
                    setTradingDropdownOpen(false);
                    setAnalyticsDropdownOpen(false);
                  }}
                  onClose={() => setDeploymentDropdownOpen(false)}
                />
              </nav>
            </div>

            {/* Desktop Wallet Controls - Show on large screens and above */}
            <div className="hidden lg:flex items-center space-x-3 xl:space-x-4 flex-shrink-0">
              {/* History Button */}
              <button
                onClick={() => setHistoryModalOpen(true)}
                className="text-gray-200 hover:text-white p-2 rounded-md transition-colors"
                aria-label="View transaction history"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <NetworkSelector />
              <WalletConnect />
            </div>

            {/* Medium Screen Navigation - Show on medium screens only (md to lg) */}
            <div className="hidden md:flex lg:hidden items-center space-x-2 flex-shrink-0">
              {/* Compact Navigation for Medium Screens */}
              <nav className="flex items-center space-x-2 mr-2">
                <button
                  onClick={() => window.location.href = navigation.home.href}
                  className="text-gray-300 hover:text-white px-2 py-2 rounded-md text-xs font-medium transition-colors"
                >
                  {navigation.home.icon}
                </button>
                <DropdownMenu
                  label="Trade"
                  items={navigation.trading}
                  isOpen={tradingDropdownOpen}
                  onToggle={() => {
                    setTradingDropdownOpen(!tradingDropdownOpen);
                    setAnalyticsDropdownOpen(false);
                    setDeploymentDropdownOpen(false);
                  }}
                  onClose={() => setTradingDropdownOpen(false)}
                />
                <DropdownMenu
                  label="Analytics"
                  items={navigation.analytics}
                  isOpen={analyticsDropdownOpen}
                  onToggle={() => {
                    setAnalyticsDropdownOpen(!analyticsDropdownOpen);
                    setTradingDropdownOpen(false);
                    setDeploymentDropdownOpen(false);
                  }}
                  onClose={() => setAnalyticsDropdownOpen(false)}
                />
                <DropdownMenu
                  label="Deployment"
                  items={navigation.deployment}
                  isOpen={deploymentDropdownOpen}
                  onToggle={() => {
                    setDeploymentDropdownOpen(!deploymentDropdownOpen);
                    setTradingDropdownOpen(false);
                    setAnalyticsDropdownOpen(false);
                  }}
                  onClose={() => setDeploymentDropdownOpen(false)}
                />
              </nav>
              {/* Compact Wallet Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setHistoryModalOpen(true)}
                  className="text-gray-300 hover:text-white p-1.5 rounded-md transition-colors"
                  aria-label="View transaction history"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <NetworkSelector />
                <WalletConnect />
              </div>
            </div>

            {/* Mobile menu button - Show on mobile and medium screens */}
            <div className="md:hidden flex-shrink-0">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-300 hover:text-white focus:outline-none focus:text-white p-2 rounded-md transition-colors"
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
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-cyan-500/30 bg-gradient-to-r from-slate-800/95 via-slate-900/95 to-slate-800/95 backdrop-blur-sm shadow-lg shadow-cyan-500/20">
            <div className="px-4 py-3 space-y-3">
              {/* Home */}
              <button
                onClick={() => {
                  window.location.href = navigation.home.href;
                  closeMenu();
                }}
                className="w-full text-left text-gray-200 hover:text-white px-3 py-3 rounded-lg text-base font-medium transition-colors flex items-center space-x-3 bg-gradient-to-r from-slate-700/80 via-slate-800/80 to-slate-700/80 border border-cyan-500/20"
              >
                <span className="text-xl">{navigation.home.icon}</span>
                <span>{navigation.home.name}</span>
              </button>

              {/* Trading Section */}
              <div className="bg-gradient-to-r from-slate-700/80 via-slate-800/80 to-slate-700/80 rounded-lg p-3 border border-cyan-500/20">
                <h3 className="text-gray-200 text-sm font-medium mb-2 px-1">Trading</h3>
                <div className="space-y-1">
                  {navigation.trading.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => {
                        if (!item.comingSoon) {
                          window.location.href = item.href;
                          closeMenu();
                        }
                      }}
                      className={`w-full text-left text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-3 ${item.comingSoon ? 'text-gray-400 cursor-not-allowed opacity-60' : ''}`}
                      disabled={item.comingSoon}
                      title={item.comingSoon ? comingSoon.tooltip : ''}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span>{item.name}</span>
                          {item.comingSoon && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-400/30 animate-pulse">{comingSoon.label}</span>
                          )}
                        </div>
                        {item.description && (
                          <div className="text-xs text-gray-400">{item.description}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Analytics Section */}
              <div className="bg-gradient-to-r from-slate-700/80 via-slate-800/80 to-slate-700/80 rounded-lg p-3 border border-cyan-500/20">
                <h3 className="text-gray-200 text-sm font-medium mb-2 px-1">Analytics</h3>
                <div className="space-y-1">
                  {navigation.analytics.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => {
                        if (!item.comingSoon) {
                          window.location.href = item.href;
                          closeMenu();
                        }
                      }}
                      className={`w-full text-left text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-3 ${item.comingSoon ? 'text-gray-400 cursor-not-allowed opacity-60' : ''}`}
                      disabled={item.comingSoon}
                      title={item.comingSoon ? comingSoon.tooltip : ''}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span>{item.name}</span>
                          {item.comingSoon && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-400/30 animate-pulse">{comingSoon.label}</span>
                          )}
                        </div>
                        {item.description && (
                          <div className="text-xs text-gray-400">{item.description}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Deployment Section */}
              <div className="bg-gradient-to-r from-slate-700/80 via-slate-800/80 to-slate-700/80 rounded-lg p-3 border border-cyan-500/20">
                <h3 className="text-gray-200 text-sm font-medium mb-2 px-1">Deployment</h3>
                <div className="space-y-1">
                  {navigation.deployment.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => {
                        if (!item.comingSoon) {
                          window.location.href = item.href;
                          closeMenu();
                        }
                      }}
                      className={`w-full text-left text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-3 ${item.comingSoon ? 'text-gray-400 cursor-not-allowed opacity-60' : ''}`}
                      disabled={item.comingSoon}
                      title={item.comingSoon ? comingSoon.tooltip : ''}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span>{item.name}</span>
                          {item.comingSoon && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-400/30 animate-pulse">{comingSoon.label}</span>
                          )}
                        </div>
                        {item.description && (
                          <div className="text-xs text-gray-400">{item.description}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Wallet Controls */}
              <div className="space-y-3 pt-3 border-t border-cyan-500/20">
                <button
                  onClick={() => {
                    setHistoryModalOpen(true);
                    closeMenu();
                  }}
                  className="w-full text-left text-gray-200 hover:text-white px-3 py-3 rounded-lg text-base font-medium transition-colors flex items-center space-x-3 bg-gradient-to-r from-slate-700/80 via-slate-800/80 to-slate-700/80 border border-cyan-500/20"
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Transaction History</span>
                </button>
                <div className="space-y-2">
                  <NetworkSelector />
                  <WalletConnect />
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
      
      <main className="flex-1 relative">
        {/* Page Content */}
        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/swap" element={<Swap />} />
            <Route path="/pools" element={<Pools />} />
            <Route path="/liquidity" element={<Liquidity />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/bridge" element={<Bridge />} />
            <Route path="/tokens" element={<Tokens />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/deploy-token" element={<DeployToken />} />
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
          </Routes>
        </div>
      </main>
      
      {/* Transaction History Modal */}
      <TransactionHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        account={account}
      />
      
      <footer className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 w-full border-t border-cyan-500/30 shadow-lg shadow-cyan-500/20 relative z-20">
        <ShootingStars />
        <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10">
            {/* Brand Section - Full width on mobile, spans 5 columns on larger screens */}
            <div className="lg:col-span-5">
              <div className="flex items-center mb-4 sm:mb-6">
                <Logo size={48} className="mr-3 sm:mr-4" showText={false} />
                <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">boing</h3>
              </div>
              <p className="text-gray-300 text-sm sm:text-base mb-4 leading-relaxed">
                The most advanced decentralized exchange with cross-chain capabilities, 
                providing seamless trading across multiple networks.
              </p>
              <div className="flex space-x-3 sm:space-x-4">
                <a href="https://twitter.com/boing_finance" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors p-1 sm:p-2">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="https://t.me/boing_finance" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors p-1 sm:p-2">
                  <span className="sr-only">Telegram</span>
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </a>
                <a href="https://discord.gg/7RDtQtQvBW" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors p-1 sm:p-2">
                  <span className="sr-only">Discord</span>
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Resources Links - spans 3 columns on larger screens */}
            <div className="lg:col-span-3">
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Resources</h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li><a href="/docs" className="text-gray-300 hover:text-white transition-colors block py-1">Documentation</a></li>
                <li><a href="/whitepaper" className="text-gray-300 hover:text-white transition-colors block py-1">Whitepaper</a></li>
                <li><a href="/terms" className="text-gray-300 hover:text-white transition-colors block py-1">Terms of Service</a></li>
                <li><a href="/privacy" className="text-gray-300 hover:text-white transition-colors block py-1">Privacy Policy</a></li>
              </ul>
            </div>
            
            {/* Support Links - spans 3 columns on larger screens */}
            <div className="lg:col-span-3">
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Support</h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li><a href="/help-center" className="text-gray-300 hover:text-white transition-colors block py-1">Help Center</a></li>
                <li><a href="/contact-us" className="text-gray-300 hover:text-white transition-colors block py-1">Contact Us</a></li>
                <li><a href="/status" className="text-gray-300 hover:text-white transition-colors block py-1">Status</a></li>
                <li><a href="/bug-report" className="text-gray-300 hover:text-white transition-colors block py-1">Bug Report</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-cyan-500/20">
            <p className="text-gray-300 text-xs sm:text-sm text-center">
              © 2025 boing. All rights reserved. Built with ❤️ for the DeFi community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <WalletProvider>
          <Router>
            <Helmet>
              <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
              <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
              <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
            </Helmet>
            <AppContent />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1f2937',
                  color: '#fff',
                },
              }}
            />
          </Router>
        </WalletProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

// Home component with all original features
function Home() {
  return (
    <>
      <Helmet>
        <title>Boing Finance - Deploy Tokens & Trade Crypto | Cross-Chain DEX</title>
        <meta name="description" content="Deploy your own tokens, create liquidity pools, and trade across multiple blockchains with Boing Finance. The most user-friendly decentralized exchange for token deployment and cross-chain trading." />
        <meta name="keywords" content="deploy token, crypto, blockchain, DEX, decentralized exchange, liquidity pool, cross-chain, token creation, cryptocurrency, DeFi, trading, swap, boing finance, token deployment, create token, ERC20, token launch" />
        <meta property="og:title" content="Boing Finance - Deploy Tokens & Trade Crypto | Cross-Chain DEX" />
        <meta property="og:description" content="Deploy your own tokens, create liquidity pools, and trade across multiple blockchains with Boing Finance. The most user-friendly decentralized exchange for token deployment and cross-chain trading." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance" />
        <meta property="og:site_name" content="Boing Finance" />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Boing Finance - Deploy Tokens & Trade Crypto" />
        <meta name="twitter:description" content="Deploy your own tokens, create liquidity pools, and trade across multiple blockchains. The most user-friendly DEX for token deployment." />
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
          "description": "Deploy tokens, create liquidity pools, and trade across multiple blockchains with Boing Finance - the most user-friendly decentralized exchange (DEX) for token deployment and cross-chain trading.",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://boing.finance/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })}
        </script>
        
        {/* Structured Data for Organization */}
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Boing Finance",
          "url": "https://boing.finance",
          "logo": "https://boing.finance/logo.svg",
          "description": "Deploy tokens, create liquidity pools, and trade across multiple blockchains with Boing Finance - the most user-friendly decentralized exchange (DEX) for token deployment and cross-chain trading.",
          "sameAs": [
            "https://twitter.com/boingfinance"
          ]
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
                "text": "Boing Finance supports multiple blockchains including Ethereum, Polygon, BSC, Arbitrum, Optimism, and Base for cross-chain token deployment and trading."
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
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center relative z-10">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent mb-6 leading-tight pb-2 drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              boing.finance
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed mb-12">
              The ultimate multi-network DeFi platform for cross-chain trading, token deployment, and comprehensive financial tools across Ethereum, Polygon, BSC, Arbitrum, Optimism, and Base networks.
            </p>
          </div>

          {/* Floating Boing Astronaut Mascot */}
          <div className="absolute top-20 right-10 hidden lg:block">
            <BoingAstronaut />
          </div>

          {/* Feature Highlights Strip */}
          <div className="flex flex-wrap justify-center gap-6 mb-12 fade-in delay-300">
            <Highlight icon={<SwapIcon />} text="Lightning-fast swaps" />
            <Highlight icon={<LiquidityIcon />} text="Earn with liquidity" />
            <Highlight icon={<AnalyticsIcon />} text="Real-time analytics" />
            <Highlight icon={<PortfolioIcon />} text="Unified portfolio" />
            <Highlight icon={<BridgeIcon />} text="Cross-chain bridge" />
            <Highlight icon={<TokensIcon />} text="All your tokens" />
            <Highlight icon={<DeployTokenIcon />} text="Deploy tokens" />
          </div>

          {/* Animated SVG Hero Section */}
          <div className="flex flex-col items-center justify-center mb-16 fade-in delay-400">
            <svg width="180" height="180" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin-slow mb-4">
              <circle cx="100" cy="100" r="90" stroke="#00E0FF" strokeWidth="4" fill="none" opacity="0.2" />
              <circle cx="100" cy="100" r="70" stroke="#7B61FF" strokeWidth="3" fill="none" opacity="0.15" />
              <circle cx="100" cy="100" r="50" stroke="#00FFB2" strokeWidth="2" fill="none" opacity="0.12" />
              <circle cx="100" cy="100" r="30" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.09" />
              <animateTransform attributeName="transform" from="0 100 100" to="360 100 100" dur="18s" repeatCount="indefinite" />
            </svg>
            <p className="text-xl text-center text-text-muted max-w-2xl mb-2">Fast, secure, and user-friendly DeFi for everyone.</p>
          </div>

          {/* Features Section */}
          <div className="mt-8 space-y-8 fade-in delay-500">
            {/* First row - 6 cards in 3 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard title="Swap" icon={<SwapIcon />} description="Instantly swap tokens across multiple blockchains with low fees and high speed." comingSoon />
              <FeatureCard title="Liquidity Pools" icon={<LiquidityIcon />} description="Provide liquidity, earn rewards, and help power decentralized trading." comingSoon />
              <FeatureCard title="Analytics" icon={<AnalyticsIcon />} description="Track your trading performance, pool stats, and market trends in real time." comingSoon />
              <FeatureCard title="Portfolio" icon={<PortfolioIcon />} description="Monitor your assets, balances, and earnings across all supported chains." comingSoon />
              <FeatureCard title="Bridge" icon={<BridgeIcon />} description="Seamlessly transfer tokens between different blockchains with our secure bridge." comingSoon />
              <FeatureCard title="Tokens" icon={<TokensIcon />} description="Explore supported tokens, view details, and manage your favorites." comingSoon />
            </div>
            
            {/* Second row - Deploy Token card centered */}
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <a href="/deploy-token" className="block">
                  <FeatureCard title="Deploy Token" icon={<DeployTokenIcon />} description="Create and deploy your own ERC20 tokens with just a few clicks." />
                </a>
              </div>
            </div>
          </div>



          {/* Token Creation Info Banner */}
          <div className="mt-8 mb-4 flex justify-center fade-in delay-800">
            <div className="rounded-xl px-6 py-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 max-w-2xl">
              <div className="text-center">
                <div className="text-lg font-semibold text-white mb-2">🚀 Create Your Own Tokens & Trading Pairs!</div>
                <p className="text-gray-300 text-sm mb-3">
                  Unlike centralized exchanges, boing allows anyone to deploy tokens and create trading pairs instantly. 
                  No permission required - just deploy, add liquidity, and start trading!
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="text-gray-500 text-sm cursor-not-allowed">Browse Tokens</span>
                  <span className="text-gray-500">•</span>
                  <a href="/deploy-token" className="text-blue-300 hover:text-blue-200 text-sm underline transition-colors">Deploy Token</a>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-500 text-sm cursor-not-allowed">Create Pairs</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-500 text-sm cursor-not-allowed">Start Trading</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Floating Boing Astronaut Mascot (SVG, up-down animation)
function BoingAstronaut() {
  return (
    <svg width="80" height="80" viewBox="0 0 200 200" className="animate-float" fill="none" xmlns="http://www.w3.org/2000/svg">
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

// Feature Highlights Strip
function Highlight({ icon, text }) {
  return (
    <div className="group relative flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20">
      <span className="text-xl text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300 animate-pulse">{icon}</span>
      <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors duration-300">{text}</span>
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
}



// Animated SVG Feature Icons
function SwapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="drop-shadow-lg">
      <defs>
        <linearGradient id="swapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E0FF" />
          <stop offset="50%" stopColor="#00FFB2" />
          <stop offset="100%" stopColor="#7B61FF" />
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
          <stop offset="0%" stopColor="#00E0FF" />
          <stop offset="50%" stopColor="#00FFB2" />
          <stop offset="100%" stopColor="#7B61FF" />
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
          <stop offset="0%" stopColor="#00E0FF" />
          <stop offset="50%" stopColor="#00FFB2" />
          <stop offset="100%" stopColor="#7B61FF" />
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
          <stop offset="0%" stopColor="#00E0FF" />
          <stop offset="50%" stopColor="#00FFB2" />
          <stop offset="100%" stopColor="#7B61FF" />
        </linearGradient>
      </defs>
      <path fill="url(#portfolioGradient)" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" stroke="url(#portfolioGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BridgeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="drop-shadow-lg">
      <defs>
        <linearGradient id="bridgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E0FF" />
          <stop offset="50%" stopColor="#00FFB2" />
          <stop offset="100%" stopColor="#7B61FF" />
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
          <stop offset="0%" stopColor="#00E0FF" />
          <stop offset="50%" stopColor="#00FFB2" />
          <stop offset="100%" stopColor="#7B61FF" />
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
          <stop offset="0%" stopColor="#00E0FF" />
          <stop offset="50%" stopColor="#00FFB2" />
          <stop offset="100%" stopColor="#7B61FF" />
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
      className={`group relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6 transition-all duration-500 overflow-hidden ${comingSoon ? 'opacity-60 cursor-not-allowed' : 'hover:border-cyan-400/40 hover:bg-gradient-to-br hover:from-gray-700/80 hover:to-gray-800/80 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20'}`}
      title={comingSoon ? 'This feature will be available after mainnet launch.' : ''}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative z-10">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300 animate-pulse">{icon}</span>
          <h3 className="text-lg font-semibold text-white group-hover:text-cyan-100 transition-colors duration-300 flex items-center">
            {title}
            {comingSoon && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-400/30 animate-pulse">Coming Soon</span>
            )}
          </h3>
        </div>
        <p className="text-gray-300 group-hover:text-gray-200 text-sm leading-relaxed transition-colors duration-300">{description}</p>
      </div>
    </div>
  );
}

// Modified DropdownMenu to support coming soon
function DropdownMenu({ label, items, isOpen, onToggle, onClose }) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        onBlur={() => setTimeout(onClose, 150)}
        className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 group"
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
        <div className="absolute top-full left-0 mt-1 w-48 bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="py-1">
            {items.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  if (!item.comingSoon) {
                    window.location.href = item.href;
                    onClose();
                  }
                }}
                className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-3 group transition-colors ${item.comingSoon ? 'text-gray-500 cursor-not-allowed opacity-60' : 'text-gray-300 hover:text-white hover:bg-gray-700/50'}`}
                disabled={item.comingSoon}
                title={item.comingSoon ? comingSoon.tooltip : ''}
              >
                <span className="text-lg">{item.icon}</span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span>{item.name}</span>
                    {item.comingSoon && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-400/30 animate-pulse">{comingSoon.label}</span>
                    )}
                  </div>
                  {item.description && (
                    <div className="text-xs text-gray-400">{item.description}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 