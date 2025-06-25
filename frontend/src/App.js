import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import Logo from './components/Logo';
import WalletConnect from './components/WalletConnect';
import NetworkSelector from './components/NetworkSelector';
import { WalletProvider } from './contexts/WalletContext';

// Pages
import Swap from './pages/Swap';
import Liquidity from './pages/Liquidity';
import Analytics from './pages/Analytics';
import Pools from './pages/Pools';
import Portfolio from './pages/Portfolio';
import Bridge from './pages/Bridge';
import Tokens from './pages/Tokens';
import Docs from './pages/Docs';

// Styles
import './styles/globals.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Swap', href: '/swap' },
    { name: 'Liquidity', href: '/liquidity' },
    { name: 'Pools', href: '/pools' },
    { name: 'Analytics', href: '/analytics' },
    { name: 'Portfolio', href: '/portfolio' },
    { name: 'Bridge', href: '/bridge' },
    { name: 'Tokens', href: '/tokens' },
  ];

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <Router>
          <div className="App min-h-screen flex flex-col">
            <header className="bg-gray-800 shadow-lg">
              <div className="flex items-center py-6">
                {/* Logo Section - Positioned at the very left edge of viewport */}
                <div className="flex-shrink-0 pl-4 sm:pl-6 lg:pl-8">
                  <a href="/" className="flex items-center hover:opacity-80 transition-opacity">
                    <Logo size={32} className="mr-3" showText={false} />
                    <h1 className="text-2xl font-bold text-white">mochi</h1>
                  </a>
                </div>
                
                {/* Navigation - Centered container */}
                <div className="flex-1 flex justify-center">
                  <div className="max-w-2xl mx-auto flex items-center justify-center w-full px-4 sm:px-6 lg:px-8">
                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-6">
                      {navigation.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                          onClick={closeMenu}
                        >
                          {item.name}
                        </a>
                      ))}
                    </nav>
                  </div>
                </div>

                {/* Wallet and Network Controls - Positioned at the very right edge of viewport */}
                <div className="hidden md:flex items-center space-x-4 flex-shrink-0 pr-4 sm:pr-6 lg:pr-8">
                  <NetworkSelector />
                  <WalletConnect />
                </div>

                {/* Mobile menu button - Positioned at the right edge */}
                <div className="md:hidden flex-shrink-0 pr-4 sm:pr-6 lg:pr-8">
                  <button
                    onClick={toggleMenu}
                    className="text-gray-300 hover:text-white focus:outline-none focus:text-white"
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
                <div className="md:hidden px-4 sm:px-6 lg:px-8 pb-4">
                  <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-700 rounded-lg mb-4">
                    {navigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
                        onClick={closeMenu}
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>
                  
                  {/* Mobile Wallet Controls */}
                  <div className="px-2 pb-3 space-y-2">
                    <NetworkSelector />
                    <WalletConnect />
                  </div>
                </div>
              )}
            </header>
            
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/swap" element={<Swap />} />
                <Route path="/liquidity" element={<Liquidity />} />
                <Route path="/pools" element={<Pools />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/bridge" element={<Bridge />} />
                <Route path="/tokens" element={<Tokens />} />
                <Route path="/docs" element={<Docs />} />
              </Routes>
            </main>
            
            <footer className="bg-gray-800 w-full border-t border-gray-700">
              <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="mb-4 md:mb-0 text-center md:text-left">
                  <span className="text-white font-bold text-lg">mochi</span>
                  <p className="text-gray-400 text-sm mt-2 max-w-xs">
                    The next-generation cross-chain DEX. Trade, earn, and bridge assets across 15+ blockchain networks with ease.
                  </p>
                </div>
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex flex-col gap-2 text-center md:text-left">
                    <span className="text-gray-300 font-semibold mb-1">Community</span>
                    <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm">Twitter</a>
                    <a href="https://discord.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm">Discord</a>
                    <a href="mailto:support@mochi.exchange" className="text-gray-400 hover:text-white text-sm">Contact</a>
                    <a href="/docs" className="text-blue-400 hover:text-blue-200 text-sm font-semibold mt-2">Docs</a>
                  </div>
                </div>
                <div className="mt-6 md:mt-0 text-center md:text-right">
                  <p className="text-gray-400 text-xs">&copy; 2025 mochi. All rights reserved.</p>
                  <p className="text-gray-600 text-xs mt-1">Built with ❤️ for the DeFi community.</p>
                </div>
              </div>
            </footer>
            
            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1f2937',
                  color: '#fff',
                  border: '1px solid #374151',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </WalletProvider>
    </QueryClientProvider>
  );
}

// Simple Home component
function Home() {
  return (
    <div className="relative max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      {/* Animated floating orbs/stars background */}
      <AnimatedBackground />

      <div className="text-center relative z-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6 sm:mb-8 fade-in">
          Welcome to mochi
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 px-4 fade-in delay-100">
          A decentralized exchange for cross-chain trading
        </p>
        <div className="space-y-4 fade-in delay-200">
          <a
            href="/swap"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 text-sm sm:text-base shadow-lg animate-pulse"
          >
            Start Trading
          </a>
        </div>
      </div>

      {/* Floating Mochi Astronaut Mascot */}
      <div className="flex justify-center mt-10 mb-8 relative z-10">
        <MochiAstronaut />
      </div>

      {/* Feature Highlights Strip */}
      <div className="flex flex-wrap justify-center gap-6 mb-12 fade-in delay-300">
        <Highlight icon={<SwapIcon />} text="Lightning-fast swaps" />
        <Highlight icon={<LiquidityIcon />} text="Earn with liquidity" />
        <Highlight icon={<AnalyticsIcon />} text="Real-time analytics" />
        <Highlight icon={<PortfolioIcon />} text="Unified portfolio" />
        <Highlight icon={<BridgeIcon />} text="Cross-chain bridge" />
        <Highlight icon={<TokensIcon />} text="All your tokens" />
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
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 fade-in delay-500">
        <FeatureCard title="Swap" icon={<SwapIcon />} description="Instantly swap tokens across multiple blockchains with low fees and high speed." />
        <FeatureCard title="Liquidity Pools" icon={<LiquidityIcon />} description="Provide liquidity, earn rewards, and help power decentralized trading." />
        <FeatureCard title="Analytics" icon={<AnalyticsIcon />} description="Track your trading performance, pool stats, and market trends in real time." />
        <FeatureCard title="Portfolio" icon={<PortfolioIcon />} description="Monitor your assets, balances, and earnings across all supported chains." />
        <FeatureCard title="Bridge" icon={<BridgeIcon />} description="Seamlessly transfer tokens between different blockchains with our secure bridge." />
        <FeatureCard title="Tokens" icon={<TokensIcon />} description="Explore supported tokens, view details, and manage your favorites." />
      </div>

      {/* Testimonials/Community Section */}
      <div className="mt-16 mb-12 fade-in delay-600">
        <h2 className="text-2xl font-bold text-white text-center mb-6">What our users say</h2>
        <div className="flex flex-wrap justify-center gap-6">
          <TestimonialCard name="Alex" text="Mochi is the smoothest DEX I've ever used!" />
          <TestimonialCard name="Priya" text="Cross-chain swaps are so easy now. Love the design!" />
          <TestimonialCard name="Samir" text="The analytics dashboard is a game changer for my trading." />
        </div>
      </div>

      {/* Token Creation Info Banner */}
      <div className="mt-8 mb-4 flex justify-center fade-in delay-800">
        <div className="rounded-xl px-6 py-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 max-w-2xl">
          <div className="text-center">
            <div className="text-lg font-semibold text-white mb-2">🚀 Create Your Own Tokens & Trading Pairs!</div>
            <p className="text-gray-300 text-sm mb-3">
              Unlike centralized exchanges, mochi allows anyone to deploy tokens and create trading pairs instantly. 
              No permission required - just deploy, add liquidity, and start trading!
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <a href="/tokens" className="text-purple-300 hover:text-purple-200 text-sm underline">Browse Tokens</a>
              <span className="text-gray-500">•</span>
              <a href="/liquidity" className="text-blue-300 hover:text-blue-200 text-sm underline">Create Pairs</a>
              <span className="text-gray-500">•</span>
              <a href="/swap" className="text-green-300 hover:text-green-200 text-sm underline">Start Trading</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Animated floating orbs/stars background
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
        <circle cx="400" cy="700" r="30" fill="#fff" opacity="0.07">
          <animate attributeName="cy" values="700;720;700" dur="5s" repeatCount="indefinite" />
        </circle>
        
        {/* Additional floating elements */}
        <circle cx="1000" cy="150" r="25" fill="#FF6B6B" opacity="0.09">
          <animate attributeName="cx" values="1000;1020;1000" dur="9s" repeatCount="indefinite" />
        </circle>
        <circle cx="300" cy="500" r="35" fill="#4ECDC4" opacity="0.11">
          <animate attributeName="cy" values="500;480;500" dur="10s" repeatCount="indefinite" />
        </circle>
        <circle cx="1100" cy="650" r="20" fill="#45B7D1" opacity="0.08">
          <animate attributeName="cx" values="1100;1080;1100" dur="11s" repeatCount="indefinite" />
        </circle>
        
        {/* Rotating geometric shapes */}
        <rect x="150" y="100" width="40" height="40" fill="#FFD93D" opacity="0.06" rx="8">
          <animateTransform attributeName="transform" type="rotate" values="0 170 120;360 170 120" dur="15s" repeatCount="indefinite" />
        </rect>
        <polygon points="1300,200 1320,180 1340,200 1320,220" fill="#FF8A80" opacity="0.07">
          <animateTransform attributeName="transform" type="rotate" values="0 1320 200;360 1320 200" dur="12s" repeatCount="indefinite" />
        </polygon>
        <ellipse cx="600" cy="300" rx="30" ry="15" fill="#81C784" opacity="0.08">
          <animateTransform attributeName="transform" type="rotate" values="0 600 300;360 600 300" dur="18s" repeatCount="indefinite" />
        </ellipse>
        
        {/* Twinkling stars */}
        <circle cx="300" cy="100" r="2" fill="#fff">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="900" cy="200" r="1.5" fill="#00E0FF">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="1300" cy="500" r="2" fill="#7B61FF">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="500" cy="150" r="1.8" fill="#FF6B6B">
          <animate attributeName="opacity" values="0.1;0.8;0.1" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="800" cy="400" r="1.2" fill="#4ECDC4">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="1200" cy="100" r="1.6" fill="#FFD93D">
          <animate attributeName="opacity" values="0.3;0.9;0.3" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="200" cy="600" r="1.4" fill="#FF8A80">
          <animate attributeName="opacity" values="0.1;0.7;0.1" dur="3.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="1000" cy="700" r="1.7" fill="#81C784">
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2.9s" repeatCount="indefinite" />
        </circle>
        
        {/* Floating particles */}
        <circle cx="400" cy="300" r="3" fill="#00E0FF" opacity="0.4">
          <animate attributeName="cy" values="300;280;300" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="800" cy="500" r="2" fill="#7B61FF" opacity="0.3">
          <animate attributeName="cx" values="800;820;800" dur="5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.05;0.3" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="600" cy="700" r="2.5" fill="#00FFB2" opacity="0.35">
          <animate attributeName="cy" values="700;680;700" dur="6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0.08;0.35" dur="6s" repeatCount="indefinite" />
        </circle>
        
        {/* Pulsing elements */}
        <circle cx="1000" cy="400" r="15" fill="#FF6B6B" opacity="0.05">
          <animate attributeName="r" values="15;25;15" dur="8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.05;0.15;0.05" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="200" cy="400" r="12" fill="#4ECDC4" opacity="0.06">
          <animate attributeName="r" values="12;20;12" dur="10s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.06;0.12;0.06" dur="10s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

// Floating Mochi Astronaut Mascot (SVG, up-down animation)
function MochiAstronaut() {
  return (
    <svg width="100" height="100" viewBox="0 0 200 200" className="animate-float" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    <div className="flex flex-col items-center px-4">
      <div className="mb-1">{icon}</div>
      <span className="text-sm text-text-muted animate-fade-in-up">{text}</span>
    </div>
  );
}

// Testimonials/Community Section
function TestimonialCard({ name, text }) {
  return (
    <div className="card p-4 w-64 animate-fade-in-up">
      <div className="flex items-center mb-2">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="mr-2">
          <circle cx="16" cy="16" r="16" fill="#00E0FF" opacity="0.2" />
          <text x="16" y="22" textAnchor="middle" fontSize="18" fill="#7B61FF" fontFamily="monospace">{name[0]}</text>
        </svg>
        <span className="font-semibold text-white">{name}</span>
      </div>
      <p className="text-text-muted text-sm">{text}</p>
    </div>
  );
}

// Animated SVG Feature Icons
function SwapIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto animate-bounce">
      <circle cx="20" cy="20" r="18" stroke="#00E0FF" strokeWidth="2" fill="#0A0A23" />
      <path d="M12 20h16m0 0l-4-4m4 4l-4 4" stroke="#7B61FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function LiquidityIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto animate-pulse">
      <ellipse cx="20" cy="28" rx="12" ry="6" fill="#00FFB2" opacity="0.3" />
      <ellipse cx="20" cy="28" rx="8" ry="3.5" fill="#00E0FF" opacity="0.5" />
      <circle cx="20" cy="16" r="8" fill="#7B61FF" opacity="0.7" />
    </svg>
  );
}
function AnalyticsIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto animate-pulse">
      <rect x="8" y="24" width="4" height="8" rx="2" fill="#00E0FF" />
      <rect x="18" y="16" width="4" height="16" rx="2" fill="#7B61FF" />
      <rect x="28" y="10" width="4" height="22" rx="2" fill="#00FFB2" />
    </svg>
  );
}
function PortfolioIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto animate-spin-slow">
      <circle cx="20" cy="20" r="16" stroke="#00FFB2" strokeWidth="2" fill="#0A0A23" />
      <circle cx="20" cy="20" r="8" fill="#00E0FF" opacity="0.5" />
      <circle cx="20" cy="20" r="4" fill="#7B61FF" />
    </svg>
  );
}
function BridgeIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto animate-bounce">
      <rect x="8" y="18" width="24" height="4" rx="2" fill="#00E0FF" />
      <rect x="12" y="14" width="4" height="12" rx="2" fill="#7B61FF" />
      <rect x="24" y="14" width="4" height="12" rx="2" fill="#00FFB2" />
    </svg>
  );
}
function TokensIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto animate-pulse">
      <circle cx="20" cy="20" r="14" fill="#7B61FF" opacity="0.5" />
      <circle cx="20" cy="20" r="8" fill="#00E0FF" opacity="0.7" />
      <circle cx="20" cy="20" r="4" fill="#00FFB2" />
    </svg>
  );
}

// Feature Card Component
function FeatureCard({ title, icon, description }) {
  return (
    <div className="card flex flex-col items-center text-center p-6 shadow-lg hover:shadow-xl transition-all duration-200">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-text-muted text-sm">{description}</p>
    </div>
  );
}

export default App; 