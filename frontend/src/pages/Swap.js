import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
// import { motion } from 'framer-motion';
// import { ArrowDown, Settings, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../config.js';
import { useNetwork } from '../hooks/useNetwork';
import SettingsModal from '../components/SettingsModal';
import TokenManagementModal from '../components/TokenManagementModal';
import GasFeeEstimator from '../components/GasFeeEstimator';
import { InfoTooltip, WarningTooltip } from '../components/Tooltip';

// Add AnimatedBackground and MochiAstronaut imports (define in this file for now)
function AnimatedBackground() {
  return null; // Removed since it's now applied centrally
}
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

const Swap = () => {
  const { network } = useNetwork();
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [tokenIn, setTokenIn] = useState('ETH');
  const [tokenOut, setTokenOut] = useState('USDC');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [selectingToken, setSelectingToken] = useState(null); // 'from' or 'to'
  const [tokens, setTokens] = useState([]);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('swapSettings');
    return saved ? JSON.parse(saved) : { slippage: 0.5, deadline: 20, darkMode: false };
  });

  // Load tokens from API
  useEffect(() => {
    const loadTokens = async () => {
      try {
        const apiUrl = getApiUrl();
        const response = await axios.get(`${apiUrl}/tokens`);
        if (response.data.success && response.data.data.length > 0) {
          setTokens(response.data.data);
        } else {
          // Set empty array if no tokens available
          setTokens([]);
        }
      } catch (error) {
        console.error('Failed to load tokens:', error.message);
        setTokens([]);
      }
    };

    loadTokens();
  }, []);

  // Calculate output amount (dynamic based on token prices)
  useEffect(() => {
    if (tokenIn && tokenOut && amountIn && parseFloat(amountIn) > 0) {
      // Find token prices from API data
      const tokenInData = tokens.find(t => t.symbol === tokenIn);
      const tokenOutData = tokens.find(t => t.symbol === tokenOut);
      
      if (tokenInData && tokenOutData && tokenInData.price && tokenOutData.price) {
        const rate = tokenInData.price / tokenOutData.price;
        const calculated = parseFloat(amountIn) * rate;
        setAmountOut(calculated.toFixed(6));
      } else {
        // Fallback calculation if prices not available
        setAmountOut('0.0');
      }
    } else {
      setAmountOut('');
    }
  }, [tokenIn, tokenOut, amountIn, tokens]);

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('swapSettings', JSON.stringify(newSettings));
  };

  const handleTokenSelect = (token) => {
    if (selectingToken === 'from') {
      setTokenIn(token.symbol);
    } else if (selectingToken === 'to') {
      setTokenOut(token.symbol);
    }
  };

  const openTokenModal = (tokenType) => {
    setSelectingToken(tokenType);
    setTokenModalOpen(true);
  };

  const switchTokens = () => {
    const tempToken = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(tempToken);
  };

  const getTokenLogo = (symbol) => {
    const token = tokens.find(t => t.symbol === symbol);
    return token?.logo || '🔵';
  };

  const getTokenName = (symbol) => {
    const token = tokens.find(t => t.symbol === symbol);
    return token?.name || symbol;
  };

  return (
    <>
      <Helmet>
        <title>Swap Tokens - boing.finance</title>
        <meta name="description" content="Swap tokens instantly across multiple blockchains with boing.finance. Get the best rates with our advanced DEX aggregator." />
        <meta name="keywords" content="token swap, DEX, decentralized exchange, cryptocurrency trading, cross-chain swap" />
        <meta property="og:title" content="Swap Tokens - boing.finance" />
        <meta property="og:description" content="Swap tokens instantly across multiple blockchains with boing.finance." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/swap" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Swap Tokens - boing.finance" />
        <meta name="twitter:description" content="Swap tokens instantly across multiple blockchains." />
      </Helmet>
      <div className="relative min-h-screen">
        <AnimatedBackground />
        <MochiAstronaut position="top-right" />
        {/* Settings Button */}
        <button
          className="absolute top-6 right-6 z-30 bg-gray-800 hover:bg-gray-700 p-2 rounded-full shadow-lg"
          onClick={() => setSettingsOpen(true)}
          aria-label="Open settings"
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zm7.94-2.06a1 1 0 0 0 .26-1.09l-1.43-2.49a1 1 0 0 1 0-.9l1.43-2.49a1 1 0 0 0-.26-1.09l-2.12-2.12a1 1 0 0 0-1.09-.26l-2.49 1.43a1 1 0 0 1-.9 0l-2.49-1.43a1 1 0 0 0-1.09.26l-2.12 2.12a1 1 0 0 0-.26 1.09l1.43 2.49a1 1 0 0 1 0 .9l-1.43 2.49a1 1 0 0 0 .26 1.09l2.12 2.12a1 1 0 0 0 1.09.26l2.49-1.43a1 1 0 0 1 .9 0l2.49 1.43a1 1 0 0 0 1.09-.26l2.12-2.12z" />
          </svg>
        </button>
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onSave={handleSaveSettings}
          initialSettings={settings}
        />
        
        {/* Token Management Modal */}
        <TokenManagementModal
          isOpen={tokenModalOpen}
          onClose={() => setTokenModalOpen(false)}
          onTokenSelect={handleTokenSelect}
          currentNetwork={network?.chainId}
        />
        
        {/* Main Content Container */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 sm:mb-4">
              Swap Tokens
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
              Trade tokens instantly with the best rates across multiple networks
            </p>
          </div>

          {/* Swap Interface */}
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Swap Tokens</h2>

            {/* Token Selection */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => openTokenModal('from')}
                  className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center sm:justify-start"
                >
                  <span className="text-xl sm:text-2xl">{getTokenLogo(tokenIn)}</span>
                  <span className="text-white font-medium text-sm sm:text-base">{getTokenName(tokenIn)}</span>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              <button
                onClick={switchTokens}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                aria-label="Switch tokens"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
              
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => openTokenModal('to')}
                  className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center sm:justify-start"
                >
                  <span className="text-xl sm:text-2xl">{getTokenLogo(tokenOut)}</span>
                  <span className="text-white font-medium text-sm sm:text-base">{getTokenName(tokenOut)}</span>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Token Input Section */}
            <div className="space-y-4 sm:space-y-6">
              {/* Token In */}
              <div className="bg-gray-750 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">You Pay</span>
                  <span className="text-gray-400 text-xs">Balance: 0.0</span>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    value={amountIn}
                    onChange={(e) => setAmountIn(e.target.value)}
                    placeholder="0.0"
                    className="flex-1 bg-transparent text-xl sm:text-2xl font-bold text-white placeholder-gray-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Token Out */}
              <div className="bg-gray-750 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">You Receive</span>
                  <span className="text-gray-400 text-xs">Balance: 0.0</span>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    value={amountOut}
                    onChange={(e) => setAmountOut(e.target.value)}
                    placeholder="0.0"
                    className="flex-1 bg-transparent text-xl sm:text-2xl font-bold text-white placeholder-gray-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Swap Details with Gas Info */}
            <div className="mt-4 sm:mt-6 bg-gray-750 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm">Rate</span>
                  <InfoTooltip content="The exchange rate between the selected tokens. This rate may change due to market conditions." />
                </div>
                <span className="text-white text-sm sm:text-base">
                  1 {tokenIn} = {amountOut ? amountOut : '0.0'} {tokenOut}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm">Price Impact</span>
                  <WarningTooltip content="The percentage change in price caused by your trade. Higher impact means larger price movement." />
                </div>
                <span className={`font-medium text-sm sm:text-base ${
                  amountOut && parseFloat(amountOut) > 0 
                    ? (parseFloat(amountOut) * 0.995 > 5 ? 'text-red-400' : parseFloat(amountOut) * 0.995 > 2 ? 'text-yellow-400' : 'text-green-400')
                    : 'text-gray-400'
                }`}>
                  {amountOut && parseFloat(amountOut) > 0 ? (parseFloat(amountOut) * 0.995).toFixed(2) : '0.00'}%
                </span>
              </div>
              {/* Add more swap details here if needed */}
            </div>
            {/* Add swap button and other UI elements here if needed */}
          </div>

          {/* Gas Fee Estimator */}
          <div className="mb-4 sm:mb-6">
            <GasFeeEstimator
              network={network}
              showAdvanced={false}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Swap;