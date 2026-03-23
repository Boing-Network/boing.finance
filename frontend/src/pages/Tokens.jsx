import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { NETWORKS } from '../config/networks';
import TokenScanner from '../services/tokenScanner';
import alchemyService from '../services/alchemyService';
import theGraphService from '../services/theGraphService';
import coingeckoService from '../services/coingeckoService';
import { Helmet } from 'react-helmet-async';
import TokenDetailsModal from '../components/TokenDetailsModal';
import TokenFilters from '../components/TokenFilters';
import PriceAlertModal from '../components/PriceAlertModal';
import { tokenFavorites } from '../utils/tokenFavorites';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '../utils/tokenWatchlist';
import toast from 'react-hot-toast';

// Initialize token scanner
const tokenScanner = new TokenScanner();

const COINGECKO_TO_CHAIN = {
  ethereum: 1, 'polygon-pos': 137, 'binance-smart-chain': 56,
  arbitrum: 42161, 'optimistic-ethereum': 10, base: 8453
};

const Tokens = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { chainId, switchNetwork } = useWallet();
  const coinIdProcessed = useRef(false);
  const [selectedChain, setSelectedChain] = useState(chainId || 11155111); // Default to Sepolia
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastScanTime, setLastScanTime] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, message: '' });
  const [searchAddress, setSearchAddress] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchedToken, setSearchedToken] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);
  const [showTokenDetails, setShowTokenDetails] = useState(false);
  const [showPriceAlert, setShowPriceAlert] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    network: 'all',
    sortBy: 'trending',
    favoritesOnly: false
  });

  // Sync selectedChain with wallet chainId
  useEffect(() => {
    if (chainId) {
      setSelectedChain(chainId);
    }
  }, [chainId]);

  // Handle coinId from URL (from GlobalSearch CoinGecko results)
  useEffect(() => {
    const coinId = searchParams.get('coinId');
    if (!coinId || coinIdProcessed.current) return;
    coinIdProcessed.current = true;

    const fetchCoinAndSearch = async () => {
      setSearching(true);
      setError(null);
      try {
        const coin = await coingeckoService.getCoinById(coinId);
        if (!coin?.platforms) {
          setError('Coin not found or has no contract addresses');
          return;
        }
        const platforms = coin.platforms;
        const preferredOrder = ['ethereum', 'base', 'arbitrum', 'polygon-pos', 'optimistic-ethereum', 'binance-smart-chain'];
        let contractAddress = null;
        let platformKey = null;
        for (const p of preferredOrder) {
          if (platforms[p] && platforms[p].trim()) {
            contractAddress = platforms[p].trim();
            platformKey = p;
            break;
          }
        }
        if (!contractAddress && Object.keys(platforms).length > 0) {
          platformKey = Object.keys(platforms)[0];
          contractAddress = platforms[platformKey]?.trim();
        }
        if (!contractAddress) {
          setError(`${coin.name} is a native asset - view on Analytics for market data`);
          return;
        }
        const targetChain = COINGECKO_TO_CHAIN[platformKey] || 1;
        setSelectedChain(targetChain);
        setSearchAddress(contractAddress);
        if (targetChain !== chainId) {
          await switchNetwork(targetChain);
        }
        // Trigger search after state updates
        setTimeout(() => {
          const address = contractAddress;
          const searchTokenByAddress = async () => {
            try {
              let token = null;
              try {
                const metadata = await alchemyService.getTokenMetadata(targetChain, address);
                if (metadata) {
                  const balanceInfo = await tokenScanner.searchToken(address, targetChain);
                  token = { address, name: metadata.name || coin.name, symbol: metadata.symbol || coin.symbol?.toUpperCase(), decimals: metadata.decimals || 18, ...balanceInfo };
                }
              } catch (_) {}
              if (!token) token = await tokenScanner.searchToken(address, targetChain);
              if (token) {
                try {
                  const networkMap = { 1: 'ethereum', 137: 'polygon', 56: 'binance-smart-chain', 42161: 'arbitrum', 10: 'optimism', 8453: 'base', 11155111: 'ethereum' };
                  const poolData = await theGraphService.getTokenPrice(address, networkMap[targetChain] || 'ethereum');
                  if (poolData?.token) token.poolData = poolData.token;
                } catch (_) {}
                setSearchedToken(token);
                setSearchParams({}); // Clear coinId from URL
              }
            } catch (err) {
              setError(err.message || 'Failed to load token');
            } finally {
              setSearching(false);
            }
          };
          searchTokenByAddress();
        }, 100);
      } catch (err) {
        setError(err.message || 'Failed to load coin');
        setSearching(false);
      }
    };
    fetchCoinAndSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setSearchParams is stable
  }, [searchParams, chainId, switchNetwork]);

  const handleNetworkChange = async (newChainId) => {
    try {
      setSelectedChain(newChainId);
      setTokens([]);
      setError(null);
      setLastScanTime(null);
      setScanProgress({ current: 0, total: 0, message: '' });
      setSearchedToken(null);
      
      // Switch network in wallet if different
      if (newChainId !== chainId) {
        await switchNetwork(newChainId);
      }
    } catch (error) {
      console.error('Error switching network:', error);
      setError('Failed to switch network');
    }
  };

  const scanTokens = async () => {
    if (isScanning) return;
    
    try {
      setIsScanning(true);
      setLoading(true);
      setError(null);
      setScanProgress({ current: 0, total: 0, message: 'Initializing scan...' });
      setSearchedToken(null);
      
      console.log(`Starting token scan for chain ${selectedChain}`);
      const network = NETWORKS[selectedChain];
      
      if (!network) {
        setError('Network not supported');
        return;
      }

      setScanProgress({ current: 0, total: 0, message: 'Scanning recent blocks (this may take 5-10 seconds)...' });
      const scannedTokens = await tokenScanner.scanRecentBlocks(selectedChain, 5); // Reduced to 5 blocks
      
      if (scannedTokens && scannedTokens.length > 0) {
        setTokens(scannedTokens);
        setLastScanTime(new Date());
        setScanProgress({ current: scannedTokens.length, total: scannedTokens.length, message: 'Scan complete!' });
        console.log(`Found ${scannedTokens.length} tokens`);
      } else {
        setTokens([]);
        setLastScanTime(new Date());
        setScanProgress({ current: 0, total: 0, message: 'No tokens found' });
        console.log('No tokens found in recent blocks');
      }
    } catch (error) {
      console.error('Error scanning tokens:', error);
      setError('Failed to scan tokens. Please try again later.');
      setScanProgress({ current: 0, total: 0, message: 'Scan failed' });
    } finally {
      setLoading(false);
      setIsScanning(false);
    }
  };

  const searchToken = async () => {
    if (!searchAddress.trim() || searching) return;
    
    try {
      setSearching(true);
      setError(null);
      setSearchedToken(null);
      
      const address = searchAddress.trim();
      console.log(`Searching for token: ${address}`);
      
      // Try Alchemy API first for better metadata
      let token = null;
      try {
        const metadata = await alchemyService.getTokenMetadata(selectedChain, address);
        if (metadata) {
          // Get balance info from standard scanner
          const balanceInfo = await tokenScanner.searchToken(address, selectedChain);
          token = {
            address,
            name: metadata.name || 'Unknown Token',
            symbol: metadata.symbol || 'UNKNOWN',
            decimals: metadata.decimals || 18,
            ...balanceInfo
          };
        }
      } catch (alchemyError) {
        console.warn('Alchemy metadata failed, using standard scanner:', alchemyError);
      }
      
      // Fallback to standard scanner if Alchemy fails
      if (!token) {
        token = await tokenScanner.searchToken(address, selectedChain);
      }
      
      if (token) {
        // Try to get pool data from The Graph if available
        try {
          const networkMap = {
            1: 'ethereum',
            137: 'polygon',
            56: 'binance-smart-chain',
            42161: 'arbitrum',
            10: 'optimism',
            8453: 'base',
            11155111: 'ethereum'
          };
          const network = networkMap[selectedChain] || 'ethereum';
          const poolData = await theGraphService.getTokenPrice(address, network);
          if (poolData && poolData.token) {
            token.poolData = poolData.token;
          }
        } catch (graphError) {
          console.warn('The Graph pool data failed:', graphError);
        }
        
        setSearchedToken(token);
        console.log('Token found:', token.name);
      } else {
        setError('Token not found or invalid address');
      }
    } catch (error) {
      console.error('Error searching token:', error);
      setError(error.message || 'Failed to search token');
    } finally {
      setSearching(false);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchToken();
    }
  };

  const clearSearch = () => {
    setSearchAddress('');
    setSearchedToken(null);
    setError(null);
  };

  const syncWithWallet = () => {
    if (chainId && chainId !== selectedChain) {
      setSelectedChain(chainId);
      setTokens([]);
      setError(null);
      setLastScanTime(null);
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatNumber = (num) => {
    if (num === 0) return '0';
    if (num < 0.01) return '< 0.01';
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const getNetworkName = (chainId) => {
    return NETWORKS[chainId]?.name || `Chain ${chainId}`;
  };

  // Filter and sort tokens
  const filteredTokens = React.useMemo(() => {
    let filtered = [...tokens];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(token =>
        token.name?.toLowerCase().includes(searchLower) ||
        token.symbol?.toLowerCase().includes(searchLower) ||
        token.address?.toLowerCase().includes(searchLower)
      );
    }

    // Apply network filter
    if (filters.network !== 'all') {
      filtered = filtered.filter(token => 
        (token.chainId || selectedChain) === parseInt(filters.network)
      );
    }

    // Apply favorites filter
    if (filters.favoritesOnly) {
      filtered = filtered.filter(token =>
        tokenFavorites.isFavorite(token.chainId || selectedChain, token.address)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'supply':
          return parseFloat(ethers.formatUnits(b.totalSupply || '0', b.decimals || 18)) -
                 parseFloat(ethers.formatUnits(a.totalSupply || '0', a.decimals || 18));
        case 'recent':
          return (b.timestamp || 0) - (a.timestamp || 0);
        case 'trending':
        default:
          return (b.trendingScore || 0) - (a.trendingScore || 0);
      }
    });

    return filtered;
  }, [tokens, filters, selectedChain]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      network: 'all',
      sortBy: 'trending',
      favoritesOnly: false
    });
  };

  const openTokenDetails = (token) => {
    setSelectedToken(token);
    setShowTokenDetails(true);
  };

  return (
    <>
      <Helmet>
        <title>Token Directory | boing.finance — Explore Tokens on EVM & Solana</title>
        <meta name="description" content="Explore and manage tokens on EVM and Solana. Search, watchlist, and view details with boing.finance." />
        <meta name="keywords" content="token directory, DeFi tokens, boing finance, EVM, Solana, token list" />
        <meta property="og:title" content="Token Directory | boing.finance" />
        <meta property="og:description" content="Explore and manage tokens on boing.finance." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/tokens" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Token Directory - boing.finance" />
        <meta name="twitter:description" content="Explore and manage tokens." />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
      </Helmet>
      <div className="relative min-h-screen">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0"></div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Trending Tokens
            </h1>
            <p className="text-gray-300 text-base sm:text-lg">
              Discover recently deployed tokens across different networks
            </p>
          </div>

          {/* Network Selection and Controls */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-700">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4 mb-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-gray-300 text-sm sm:text-base">Network:</span>
                <select
                  value={selectedChain}
                  onChange={(e) => handleNetworkChange(parseInt(e.target.value))}
                  className="flex-1 sm:flex-none bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                >
                  {Object.entries(NETWORKS).map(([id, network]) => (
                    <option key={id} value={id}>
                      {network.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={syncWithWallet}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
                >
                  Sync with Wallet
                </button>
                
                <button
                  onClick={scanTokens}
                  disabled={isScanning}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {isScanning ? (
                    <>
                      <div className="w-3 sm:w-4 h-3 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Scanning...
                    </>
                  ) : (
                    'Scan Tokens'
                  )}
                </button>
              </div>
            </div>

            {lastScanTime && (
              <p className="text-xs sm:text-sm text-gray-400">
                Last scanned: {lastScanTime.toLocaleString()}
              </p>
            )}
          </div>

          {/* Search and Filters Section */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-white">Search & Filters</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-1 rounded-lg transition-colors text-sm"
                style={{
                  backgroundColor: showFilters ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                  color: 'var(--text-primary)'
                }}
              >
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
            </div>

            {/* Quick Search */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4 mb-4">
              <div className="flex-1 min-w-0 w-full sm:w-auto">
                <label htmlFor="tokens-search" className="sr-only">Search by name, symbol, or address</label>
                <input
                  id="tokens-search"
                  name="tokenSearch"
                  type="text"
                  autoComplete="off"
                  value={filters.search || searchAddress}
                  onChange={(e) => {
                    setSearchAddress(e.target.value);
                    handleFilterChange('search', e.target.value);
                  }}
                  onKeyPress={handleSearchKeyPress}
                  placeholder="Search by name, symbol, or address..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                />
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={searchToken}
                  disabled={searching || !searchAddress.trim()}
                  className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {searching ? (
                    <>
                      <div className="w-3 sm:w-4 h-3 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Searching...
                    </>
                  ) : (
                    'Search Address'
                  )}
                </button>
                
                {searchedToken && (
                  <button
                    onClick={clearSearch}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4">
                <TokenFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={clearFilters}
                />
              </div>
            )}

            {/* Search Results */}
            {searchedToken && (
              <div className="mt-4 sm:mt-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 text-white">Search Result</h3>
                <div className="bg-gray-700/50 rounded-xl p-4 sm:p-6 border border-gray-600">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-2 sm:space-y-0">
                    <div>
                      <h4 className="text-lg sm:text-xl font-semibold text-white mb-1">{searchedToken.name}</h4>
                      <p className="text-green-400 font-mono text-sm sm:text-base">{searchedToken.symbol}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="inline-block bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                        Found
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <span className="text-gray-400 text-xs sm:text-sm">Address:</span>
                        <span className="font-mono text-gray-300 text-xs sm:text-sm break-all">{formatAddress(searchedToken.address)}</span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <span className="text-gray-400 text-xs sm:text-sm">Network:</span>
                        <span className="text-gray-300 text-xs sm:text-sm">{getNetworkName(searchedToken.chainId)}</span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <span className="text-gray-400 text-xs sm:text-sm">Decimals:</span>
                        <span className="text-gray-300 text-xs sm:text-sm">{searchedToken.decimals}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <span className="text-gray-400 text-xs sm:text-sm">Total Supply:</span>
                        <span className="text-gray-300 text-xs sm:text-sm">
                          {formatNumber(parseFloat(ethers.formatUnits(searchedToken.totalSupply, searchedToken.decimals)))}
                        </span>
                      </div>
                      
                      {searchedToken.owner && (
                        <div className="flex flex-col sm:flex-row sm:justify-between">
                          <span className="text-gray-400 text-xs sm:text-sm">Owner:</span>
                          <span className="font-mono text-gray-300 text-xs sm:text-sm break-all">{formatAddress(searchedToken.owner)}</span>
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <span className="text-gray-400 text-xs sm:text-sm">Trending Score:</span>
                        <span className="text-green-400 text-xs sm:text-sm">{searchedToken.trendingScore}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <button
                      onClick={() => window.open(`https://sepolia.etherscan.io/address/${searchedToken.address}`, '_blank')}
                      className="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg transition-colors text-sm"
                    >
                      View on Explorer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <p className="text-red-200 text-sm sm:text-base">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8 sm:py-12">
              <div className="w-6 sm:w-8 h-6 sm:h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
              <p className="text-gray-300 mb-2 text-sm sm:text-base">{scanProgress.message}</p>
              {scanProgress.total > 0 && (
                <div className="w-full max-w-md mx-auto">
                  <div className="bg-gray-700 rounded-full h-2 mb-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400">
                    {scanProgress.current} of {scanProgress.total} tokens processed
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tokens Grid */}
          {!loading && filteredTokens.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-400">
                Showing {filteredTokens.length} of {tokens.length} tokens
              </p>
            </div>
          )}
          {!loading && filteredTokens.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredTokens.map((token, index) => {
                const isFavorite = tokenFavorites.isFavorite(token.chainId || selectedChain, token.address);
                const isWatched = isInWatchlist(token.address, token.chainId || selectedChain);
                
                const handleWatchlistToggle = (e) => {
                  e.stopPropagation();
                  if (isWatched) {
                    removeFromWatchlist(token.address, token.chainId || selectedChain);
                    toast.success(`${token.symbol} removed from watchlist`);
                  } else {
                    addToWatchlist({
                      address: token.address,
                      symbol: token.symbol,
                      name: token.name,
                      chainId: token.chainId || selectedChain,
                      logo: token.logo,
                      price: token.price
                    });
                    toast.success(`${token.symbol} added to watchlist`);
                  }
                };
                
                return (
                <div
                  key={index}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700 hover:border-purple-500 transition-all duration-200 cursor-pointer group relative"
                  onClick={() => openTokenDetails(token)}
                >
                  {/* Favorite & Watchlist Badges */}
                  <div className="absolute top-2 right-2 flex space-x-2">
                    {isFavorite && (
                      <div className="p-1">
                        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                    )}
                    <button
                      onClick={handleWatchlistToggle}
                      className={`p-1 rounded transition-colors ${isWatched ? 'bg-blue-500/20' : 'hover:bg-gray-700'}`}
                      title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
                    >
                      <svg className={`w-5 h-5 ${isWatched ? 'text-blue-400 fill-current' : 'text-gray-400'}`} fill={isWatched ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                        {token.symbol?.charAt(0) || 'T'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-white font-semibold text-sm sm:text-base truncate">{token.name}</h3>
                        <p className="text-purple-400 font-mono text-xs sm:text-sm">{token.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                        {token.trendingScore}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Address:</span>
                      <span className="font-mono text-gray-300 truncate ml-2">{formatAddress(token.address)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Network:</span>
                      <span className="text-gray-300">{getNetworkName(token.chainId)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Supply:</span>
                      <span className="text-gray-300">
                        {formatNumber(parseFloat(ethers.formatUnits(token.totalSupply, token.decimals)))}
                      </span>
                    </div>
                    
                    {token.owner && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Owner:</span>
                        <span className="font-mono text-gray-300 truncate ml-2">{formatAddress(token.owner)}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-600">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-400">Deployed</span>
                      <span className="text-xs sm:text-sm text-gray-300">
                        {token.timestamp ? new Date(token.timestamp).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {/* No Tokens State */}
          {!loading && filteredTokens.length === 0 && tokens.length === 0 && !error && (
            <div className="text-center py-8 sm:py-12">
              <div className="text-4xl sm:text-6xl mb-4">🔍</div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">No Tokens Found</h3>
              <p className="text-gray-300 text-sm sm:text-base mb-4">
                Try scanning for tokens or searching for a specific token address.
              </p>
              <button
                onClick={scanTokens}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors text-sm sm:text-base"
              >
                Scan for Tokens
              </button>
            </div>
          )}

          {/* No Results After Filtering */}
          {!loading && filteredTokens.length === 0 && tokens.length > 0 && (
            <div className="text-center py-8 sm:py-12">
              <div className="text-4xl sm:text-6xl mb-4">🔍</div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">No Tokens Match Filters</h3>
              <p className="text-gray-300 text-sm sm:text-base mb-4">
                Try adjusting your filters or clearing them to see all tokens.
              </p>
              <button
                onClick={clearFilters}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors text-sm sm:text-base"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div></div>

        {/* Token Details Modal */}
        {selectedToken && (
          <TokenDetailsModal
            token={selectedToken}
            isOpen={showTokenDetails}
            onClose={() => {
              setShowTokenDetails(false);
              setSelectedToken(null);
            }}
            onSetPriceAlert={(tokenWithPrice) => {
              setSelectedToken(tokenWithPrice || selectedToken);
              setShowTokenDetails(false);
              setShowPriceAlert(true);
            }}
            network={NETWORKS[selectedToken.chainId || selectedChain]}
          />
        )}

        {/* Price Alert Modal */}
        <PriceAlertModal
          isOpen={showPriceAlert}
          onClose={() => setShowPriceAlert(false)}
          token={selectedToken || searchedToken}
        />
    </>
  );
};

export default Tokens;
