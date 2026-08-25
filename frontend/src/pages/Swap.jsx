import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useChainType } from '../contexts/SolanaWalletContext';
import { SwapSolanaContent } from '../components/SolanaFeaturePlaceholder';
import { useAchievements } from '../contexts/AchievementContext';
import { getContractAddress, getContractAddresses, getEvmDexHubTokenAddresses, getEvmDexProtocolAddresses } from '../config/contracts';
import { getNetworkByChainId, BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import SettingsModal from '../components/SettingsModal';
import toast from 'react-hot-toast';
import { InfoTooltip, WarningTooltip } from '../components/Tooltip';
import { transactionTrackingService } from '../services/transactionTrackingService.js';
import externalSwapService from '../services/externalSwapService';
import ExternalDEXQuotes from '../components/ExternalDEXQuotes';
import ShareCardModal from '../components/ShareCardModal';
import ProactiveTipsBanner from '../components/ProactiveTipsBanner';
import NativeBoingTradeHub from '../components/NativeBoingTradeHub';
import SwapTokenSelect from '../components/SwapTokenSelect';
import SwapMarketsBoard from '../components/SwapMarketsBoard';
import SwapSpotTicker from '../components/SwapSpotTicker';
import { ChartSkeleton } from '../components/SkeletonLoader';
import { useTokenMarket } from '../hooks/useTokenMarket';
import { useDexMarkets } from '../hooks/useDexMarkets';
import { formatUsdCompact } from '../services/tokenChartService';
import getFeatureSupport from '../config/featureSupport';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import { fetchTradeableEvmTokenAddressesFromDexFactory } from '../services/evmDexTradeableTokens';
import { tryAccruePoints } from '../utils/tryAccruePoints';
import { getEvmAggregatorQuote, sendAggregatorSwap, isNativeSwapSymbol } from '../services/aggregatorSwapService';
import { quoteExactIn } from '../services/evmAmmPairActions';

const SwapTokenPriceChart = lazy(() => import('../components/SwapTokenPriceChart'));

const devLog = (...args) => {
  if (import.meta.env.DEV) console.log(...args);
};

const Swap = () => {
  const { isSolana } = useChainType();
  const { isConnected, account } = useWalletConnection();
  const { chainId, provider: walletProvider, signer: walletSigner } = useWallet();
  const { effectivePoolHex } = useBoingNativeDexIntegration();
  const featureSupport = useMemo(
    () =>
      getFeatureSupport(Number(chainId) || 0, {
        nativeConstantProductPoolHex:
          Number(chainId) === BOING_NATIVE_L1_CHAIN_ID ? effectivePoolHex : undefined,
      }),
    [chainId, effectivePoolHex]
  );
  const { record: recordAchievement } = useAchievements() || {};

  useEffect(() => {
    const sym = getNetworkByChainId(chainId)?.nativeCurrency?.symbol;
    if (sym) setTokenIn(sym);
  }, [chainId]);
  
  // Swap state
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [tokenIn, setTokenIn] = useState('ETH');
  const [tokenOut, setTokenOut] = useState('USDC');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('swapSettings');
    return saved ? JSON.parse(saved) : { slippage: 0.5, deadline: 20, darkMode: false, gasPriority: 'medium' };
  });

  // Token selection state
  const [userTokens, setUserTokens] = useState([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [tokenInDropdownOpen, setTokenInDropdownOpen] = useState(false);
  const [tokenOutDropdownOpen, setTokenOutDropdownOpen] = useState(false);
  const [customImportOpenFor, setCustomImportOpenFor] = useState(/** @type {null | 'tokenIn' | 'tokenOut'} */ (null));
  const [customImportAddress, setCustomImportAddress] = useState('');
  const [focusOutAddress, setFocusOutAddress] = useState('');

  // Swap transaction state
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapError, setSwapError] = useState('');
  const [swapSuccess, setSwapSuccess] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState(null);

  // External DEX state
  const [_externalQuotes, setExternalQuotes] = useState([]);
  const [selectedExternalQuote, setSelectedExternalQuote] = useState(null);
  const [showExternalQuotes, setShowExternalQuotes] = useState(false);
  const [isExternalDEXAvailable, setIsExternalDEXAvailable] = useState(false);
  const [aggregatorQuote, setAggregatorQuote] = useState(null);
  const [routeSource, setRouteSource] = useState(/** @type {null | 'boing' | 'aggregator'} */ (null));

  // EIP-1559 gas estimate for display (no signer required)
  const [estimatedGasCost, setEstimatedGasCost] = useState(null);
  const [estimatedGasCostLoading, setEstimatedGasCostLoading] = useState(false);

  // Scan for all tokens in user's wallet by checking transfer events
  const getAllUserTokens = useCallback(async (provider, userAddress) => {
    try {
      // ERC20 Transfer event signature
      const transferEventSignature = 'Transfer(address,address,uint256)';
      const transferEventTopic = ethers.keccak256(ethers.toUtf8Bytes(transferEventSignature));
      
      // Get current block
      const currentBlock = await provider.getBlockNumber();
      
      // For Sepolia, scan much further back (last 50,000 blocks)
      // For mainnet, scan last 10,000 blocks for efficiency
      const blockRange = chainId === 11155111 ? 50000 : 10000;
      let fromBlock = Math.max(0, currentBlock - blockRange);
      
      // Get all Transfer events where user is the recipient
      let logs = await provider.getLogs({
        fromBlock: fromBlock,
        toBlock: currentBlock,
        topics: [
          transferEventTopic,
          null, // from address (any)
          ethers.zeroPadValue(userAddress, 32) // to address (user)
        ]
      });
      
      // If we're on Sepolia and found very few tokens, try scanning from the beginning
      if (chainId === 11155111 && logs.length < 10) {
        try {
          const earlyLogs = await provider.getLogs({
            fromBlock: 0,
            toBlock: fromBlock - 1,
            topics: [
              transferEventTopic,
              null, // from address (any)
              ethers.zeroPadValue(userAddress, 32) // to address (user)
            ]
          });
          logs = [...earlyLogs, ...logs];
        } catch (error) {
          console.warn('Failed to scan early blocks:', error.message);
        }
      }
      
      // Extract unique token addresses from the logs
      const tokenAddresses = [...new Set(logs.map(log => log.address))];
      devLog(`Found ${tokenAddresses.length} unique tokens from transfer events`);
      
      return tokenAddresses;
    } catch (error) {
      console.error('Error scanning for user tokens:', error);
      return [];
    }
  }, [chainId]);

  // Get hub tokens (wrapped native + configured stables) for the network
  const getCommonTokens = useCallback((networkId) => {
    return getEvmDexHubTokenAddresses(networkId);
  }, []);

  // Get token information
  const getTokenInfo = useCallback(async (address, provider) => {
    devLog(`🔍 Getting token info for address: ${address}`);
    try {
      const tokenContract = new ethers.Contract(address, [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
        'function balanceOf(address) view returns (uint256)'
      ], provider);

      const [name, symbol, decimals, balance] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.balanceOf(account)
      ]);

      devLog(`✅ Token info for ${address}:`, { name, symbol, decimals, balance: balance.toString() });

      // Format balance with appropriate decimal places based on token value
      const formattedBalance = formatTokenBalance(balance, decimals);

      return { 
        name, 
        symbol, 
        decimals, 
        balance: balance.toString(),
        formattedBalance 
      };
    } catch (error) {
      console.warn(`❌ Failed to get token info for ${address}:`, error.message);
      return null;
    }
  }, [account]);

  // Format token balance with appropriate decimal places
  const formatTokenBalance = (balance, decimals) => {
    try {
      const balanceNum = parseFloat(ethers.formatUnits(balance, decimals));
      
      if (balanceNum === 0) return '0';
      
      // For very large numbers, use abbreviations
      if (balanceNum >= 1e12) {
        return (balanceNum / 1e12).toFixed(2) + 'T';
      } else if (balanceNum >= 1e9) {
        return (balanceNum / 1e9).toFixed(2) + 'B';
      } else if (balanceNum >= 1e6) {
        return (balanceNum / 1e6).toFixed(2) + 'M';
      } else if (balanceNum >= 1e3) {
        return (balanceNum / 1e3).toFixed(2) + 'K';
      } else if (balanceNum >= 1) {
        return balanceNum.toFixed(4);
      } else {
        // For very small numbers, show more decimal places
        return balanceNum.toFixed(6);
      }
    } catch (error) {
      return '0';
    }
  };

  // Add custom token
  const addCustomToken = async (tokenAddress) => {
    try {
      if (!walletProvider) {
        toast.error('Connect a wallet first');
        return;
      }
      const raw = (tokenAddress || '').trim();
      if (!raw || !ethers.isAddress(raw)) {
        toast.error('Enter a valid 0x token contract address');
        return;
      }
      const checksummed = ethers.getAddress(raw);
      const tokenInfo = await getTokenInfo(checksummed, walletProvider);
      if (!tokenInfo) {
        toast.error('Invalid token address or token not found');
        return;
      }

      // Add to user tokens if not already present
      const existingToken = userTokens.find(t => t.address.toLowerCase() === checksummed.toLowerCase());
      if (!existingToken) {
        const newToken = {
          address: checksummed,
          ...tokenInfo,
          formattedBalance: ethers.formatUnits(tokenInfo.balance, tokenInfo.decimals)
        };
        setUserTokens(prev => [...prev, newToken]);
        toast.success(`Added ${tokenInfo.symbol} to your tokens`);
      } else {
        toast.info(`${tokenInfo.symbol} is already in your tokens`);
      }
    } catch (error) {
      console.error('Error adding custom token:', error);
      toast.error('Failed to add custom token');
    }
  };

  const submitCustomTokenImport = async () => {
    await addCustomToken(customImportAddress);
    setCustomImportAddress('');
    setCustomImportOpenFor(null);
  };

  // Handle settings save
  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('swapSettings', JSON.stringify(newSettings));
    setSettingsOpen(false);
    toast.success('Settings saved successfully');
  };

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.token-dropdown-container')) {
        setTokenInDropdownOpen(false);
        setTokenOutDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!tokenInDropdownOpen) {
      setCustomImportOpenFor((v) => (v === 'tokenIn' ? null : v));
    }
  }, [tokenInDropdownOpen]);

  useEffect(() => {
    if (!tokenOutDropdownOpen) {
      setCustomImportOpenFor((v) => (v === 'tokenOut' ? null : v));
    }
  }, [tokenOutDropdownOpen]);

  // Handle token selection
  const handleTokenSelect = (token, forToken) => {
    devLog('🎯 Token selected:', { token: token.symbol, forToken });
    if (forToken === 'tokenIn') {
      setTokenIn(token.symbol);
      setTokenInDropdownOpen(false);
    } else {
      setTokenOut(token.symbol);
      setFocusOutAddress(token.address || '');
      setTokenOutDropdownOpen(false);
    }
  };

  const selectDiscoveryMarket = (market) => {
    if (!market?.address || !market?.symbol) return;
    const nativeSym = getNetworkByChainId(chainId)?.nativeCurrency?.symbol || 'ETH';
    setUserTokens((prev) => {
      if (prev.some((t) => (t.address || '').toLowerCase() === market.address.toLowerCase())) return prev;
      return [
        ...prev,
        {
          address: market.address,
          symbol: market.symbol,
          name: market.name,
          decimals: market.decimals || 18,
          balance: '0',
          formattedBalance: '0',
          fromDiscovery: true,
          logo: market.logo,
        },
      ];
    });
    setFocusOutAddress(market.address);
    setTokenOut(market.symbol);
    if (tokenIn === market.symbol) setTokenIn(nativeSym);
  };

  // Switch tokens
  const switchTokens = () => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
  };

  // Get token logo
  const getTokenLogo = (symbol) => {
    const logos = {
      'ETH': '🔵',
      'WETH': '🔵',
      'USDC': '💙',
      'USDT': '💚',
      'LINK': '🔗',
      'ENS': '🌐',
      'BOING': '🚀',
      'DEFAULT': '🪙'
    };
    return logos[symbol] || logos['DEFAULT'];
  };

  const chartTokenIn = useMemo(() => {
    const t = userTokens.find((x) => x.symbol === tokenIn);
    return {
      symbol: tokenIn,
      address: t?.address || '',
      isNative: Boolean(t?.isNative || isNativeSwapSymbol(tokenIn, chainId)),
    };
  }, [userTokens, tokenIn, chainId]);

  const chartTokenOut = useMemo(() => {
    const byAddr = focusOutAddress
      ? userTokens.find((x) => (x.address || '').toLowerCase() === focusOutAddress.toLowerCase())
      : null;
    const t = byAddr || userTokens.find((x) => x.symbol === tokenOut);
    return {
      symbol: t?.symbol || tokenOut,
      address: t?.address || focusOutAddress || '',
      isNative: Boolean(t?.isNative || isNativeSwapSymbol(t?.symbol || tokenOut, chainId)),
    };
  }, [userTokens, tokenOut, chainId, focusOutAddress]);

  const showEvmSwapDesk = featureSupport.swap !== 'native_amm';
  const dexMarkets = useDexMarkets({
    chainId: Number(chainId),
    enabled: showEvmSwapDesk && !isSolana,
  });
  const selectedMarket = useMemo(() => {
    const list = dexMarkets.data || [];
    if (focusOutAddress) {
      return list.find((m) => m.address.toLowerCase() === focusOutAddress.toLowerCase()) || null;
    }
    return list.find((m) => m.symbol === tokenOut) || list[0] || null;
  }, [dexMarkets.data, focusOutAddress, tokenOut]);
  const tokenInMarket = useTokenMarket({
    chain: 'evm',
    chainId: Number(chainId),
    address: chartTokenIn.address,
    isNative: chartTokenIn.isNative,
    symbol: chartTokenIn.symbol,
    days: 7,
    enabled: showEvmSwapDesk && !isSolana,
  });
  const tokenOutMarket = useTokenMarket({
    chain: 'evm',
    chainId: Number(chainId),
    address: chartTokenOut.address,
    isNative: chartTokenOut.isNative,
    symbol: chartTokenOut.symbol,
    days: 7,
    enabled: showEvmSwapDesk && !isSolana,
  });
  const amountInUsd =
    amountIn && tokenInMarket.data?.price
      ? formatUsdCompact(parseFloat(amountIn) * tokenInMarket.data.price)
      : '';
  const amountOutUsd =
    amountOut && tokenOutMarket.data?.price
      ? formatUsdCompact(parseFloat(amountOut) * tokenOutMarket.data.price)
      : '';

  useEffect(() => {
    setFocusOutAddress('');
  }, [chainId]);

  useEffect(() => {
    if (!showEvmSwapDesk || isSolana || focusOutAddress) return;
    const first = dexMarkets.data?.[0];
    if (first) selectDiscoveryMarket(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- select on first trending load per chain
  }, [showEvmSwapDesk, isSolana, dexMarkets.data, focusOutAddress, chainId]);

  // Helper functions to get selected token balances
  const getTokenInBalance = () => {
    if (!tokenIn || isNativeSwapSymbol(tokenIn, chainId) || tokenIn === 'ETH') {
      const native = userTokens.find((t) => t.isNative || t.symbol === tokenIn);
      if (native?.balance) {
        try {
          return parseFloat(ethers.formatUnits(native.balance, native.decimals || 18));
        } catch {
          return null;
        }
      }
      return null;
    }
    const token = userTokens.find(t => t.symbol === tokenIn);
    if (!token) return null;
    
    // Use the raw balance instead of formatted balance
    try {
      return parseFloat(ethers.formatUnits(token.balance, token.decimals));
    } catch (error) {
      console.error('Error parsing token balance:', error);
      return null;
    }
  };

  const getTokenOutBalance = () => {
    if (!tokenOut || tokenOut === 'ETH') {
      // For ETH, we'd need to get native balance
      return null;
    }
    const token = userTokens.find(t => t.symbol === tokenOut);
    if (!token) return null;
    
    // Use the raw balance instead of formatted balance
    try {
      return parseFloat(ethers.formatUnits(token.balance, token.decimals));
    } catch (error) {
      console.error('Error parsing token balance:', error);
      return null;
    }
  };

  // Functions to set full balance amounts
  const setTokenInFullBalance = () => {
    const balance = getTokenInBalance();
    if (balance !== null) {
      setAmountIn(balance.toString());
      toast.success(`Set ${tokenIn} amount to full balance: ${balance.toFixed(4)}`);
    } else {
      toast.error('No balance available for this token');
    }
  };

  const _setTokenOutFullBalance = () => {
    const balance = getTokenOutBalance();
    if (balance !== null) {
      setAmountOut(balance.toString());
      toast.success(`Set ${tokenOut} amount to full balance: ${balance.toFixed(4)}`);
    } else {
      toast.error('No balance available for this token');
    }
  };

  // Get gas fee multiplier based on priority setting
  const getGasFeeMultiplier = () => {
    const multipliers = {
      'high': 1.5,
      'medium': 1.0,
      'low': 0.7
    };
    return multipliers[settings.gasPriority] || 1.0;
  };

  // Get gas priority label
  const getGasPriorityLabel = () => {
    const labels = {
      'high': 'High Priority',
      'medium': 'Medium Priority',
      'low': 'Low Priority'
    };
    return labels[settings.gasPriority] || 'Medium Priority';
  };

  // Check if DEX or native AMM swap is supported on current network
  const isSwapSupported = () =>
    featureSupport.swap === 'boing' ||
    featureSupport.swap === 'native_amm' ||
    featureSupport.swap === 'aggregator';

  // Get network status message
  const getNetworkStatusMessage = () => {
    if (!isConnected) {
      return { type: 'warning', message: 'Please connect your wallet to start swapping' };
    }
    
    if (!isSwapSupported()) {
      return {
        type: 'error',
        message:
          chainId === BOING_NATIVE_L1_CHAIN_ID
            ? 'On Boing testnet: use the native pool panel below (Boing Express) when available, open Native VM tools, or switch to Sepolia for the classic EVM swap.'
            : 'Swap is not available on this network.',
      };
    }

    if (featureSupport.swap === 'native_amm') {
      return {
        type: 'success',
        message: 'Native pool swap — confirm amounts below, then approve in Boing Express.',
      };
    }

    if (routeSource === 'aggregator' && aggregatorQuote?.venue) {
      return {
        type: 'success',
        message: `Routing via ${aggregatorQuote.venue} (aggregator). Liquidity is on that venue, not a Boing pool.`,
      };
    }

    if (featureSupport.swap === 'aggregator') {
      return {
        type: 'success',
        message: 'Swaps route through public DEX aggregators when a market exists.',
      };
    }

    return { type: 'success', message: 'Swapping is supported on this network' };
  };

  // Handle swap transaction
  const handleSwap = async () => {
    devLog('=== HANDLE SWAP START ===');
    devLog('Raw input values:', {
      amountIn: amountIn,
      amountInType: typeof amountIn,
      amountInLength: amountIn ? amountIn.length : 0,
      tokenIn,
      tokenOut
    });
    
    if (!isConnected || !account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!amountIn || parseFloat(amountIn) <= 0) {
      toast.error('Please enter a valid amount to swap');
      return;
    }

    if (!tokenIn || !tokenOut) {
      toast.error('Please select both input and output tokens');
      return;
    }

    if (tokenIn === tokenOut) {
      toast.error('Cannot swap the same token');
      return;
    }

    if (aggregatorQuote?.transactionRequest && routeSource === 'aggregator') {
      setIsSwapping(true);
      setSwapError('');
      setSwapSuccess('');
      try {
        if (!walletProvider) throw new Error('Connect a wallet first');
        const signer = walletSigner ?? (await walletProvider.getSigner());
        const fresh = await getEvmAggregatorQuote({
          chainId: Number(chainId),
          fromSymbol: tokenIn,
          toSymbol: tokenOut,
          amountHuman: amountIn,
          fromAddress: account,
          userTokens,
          slippagePercent: settings.slippage,
        });
        const toUse = fresh?.transactionRequest ? fresh : aggregatorQuote;
        toast(`Routing via ${toUse.venue}…`, { duration: 2500 });
        const result = await sendAggregatorSwap(toUse, signer);
        toast.success(`Swap sent via ${toUse.venue}`);
        setSwapSuccess(`Swap successful via ${toUse.venue}. Transaction: ${result.txHash}`);
        recordAchievement?.(account, 'swap', 'first_swap');
        tryAccruePoints({
          address: account,
          action: 'swap',
          txHash: result.txHash,
          chainId,
          metadata: { tokenIn, tokenOut, amountIn, dex: toUse.venue, provider: 'lifi' },
        });
        setShareData({ tokenIn, tokenOut, amountIn, amountOut });
        setShareModalOpen(true);
        setAmountIn('');
        setAmountOut('');
        setAggregatorQuote(null);
        setRouteSource(null);
        await fetchUserTokens();
      } catch (error) {
        const msg = error?.shortMessage || error?.message || 'Aggregator swap failed';
        setSwapError(msg);
        toast.error(msg);
      } finally {
        setIsSwapping(false);
      }
      return;
    }

    // Check if we have a selected external quote
    if (selectedExternalQuote) {
      await handleExternalSwap();
      return;
    }

    if (featureSupport.swap === 'native_amm') {
      toast.error('On Boing testnet, use the Native constant-product pool section above (Boing Express), or choose an external quote.');
      return;
    }

    // Check if DEX is deployed on current network
    const swapRouterAddress = getContractAddress(chainId, 'dexRouter');
    devLog('handleSwap: Starting swap with params:', {
      chainId,
      routerAddress: swapRouterAddress,
      tokenIn,
      tokenOut,
      amountIn,
      account
    });
    
    if (!swapRouterAddress || swapRouterAddress === '0x0000000000000000000000000000000000000000') {
      toast.error(
        chainId === BOING_NATIVE_L1_CHAIN_ID
          ? 'On Boing testnet, use the native pool panel or Native VM with Boing Express. This swap box targets EVM routers on other configured networks only.'
          : 'No aggregator route for this pair. Public DEXs need existing liquidity — try USDC, wrapped native, or a token that already trades.'
      );
      return;
    }

    setIsSwapping(true);
    setSwapError('');
    setSwapSuccess('');

    try {
      if (!walletProvider) {
        throw new Error('Connect a wallet first');
      }
      const signer = walletSigner ?? (await walletProvider.getSigner());
      
      // Router contract ABI (minimal for swap)
      const routerABI = [
        'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
        'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
        'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
        'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
      ];

      const routerContract = new ethers.Contract(swapRouterAddress, routerABI, signer);

      // Calculate minimum amount out (with slippage tolerance)
      const slippageTolerance = settings.slippage / 100;
      
      devLog('handleSwap: Starting amount calculation with:', {
        amountIn,
        tokenIn,
        tokenOut,
        userTokens: userTokens.map(t => ({ symbol: t.symbol, decimals: t.decimals, address: t.address }))
      });
      
      // VALIDATION: Check input amount immediately
      if (!amountIn || isNaN(parseFloat(amountIn)) || parseFloat(amountIn) <= 0) {
        throw new Error(`Invalid amount: ${amountIn}. Please enter a valid positive number.`);
      }
      
      const inputAmountNum = parseFloat(amountIn);
      if (inputAmountNum > 1000000) {
        throw new Error(`Input amount too large: ${amountIn}. Please enter a smaller amount.`);
      }
      
      // VALIDATION: Check for 18 decimal tokens specifically
      if (inputAmountNum > 1000) {
        devLog('handleSwap: Warning - Amount may be too large for 18 decimal tokens', { 
          amountIn, 
          inputAmountNum,
          warning: 'Amount > 1000 may cause issues with 18 decimal tokens'
        });
      }
      
      // Check if input amount contains scientific notation or other problematic formats
      if (amountIn.includes('e') || amountIn.includes('E')) {
        throw new Error(`Invalid amount format: ${amountIn}. Please enter a regular number without scientific notation.`);
      }
      
      // Check if input amount contains only valid numeric characters
      const validNumericRegex = /^[0-9.]+$/;
      if (!validNumericRegex.test(amountIn)) {
        throw new Error(`Invalid amount format: ${amountIn}. Please enter only numbers and decimal points.`);
      }
      
      const parsedAmount = parseFloat(amountIn);
      devLog('handleSwap: Parsed amount:', parsedAmount);
      
      // Validate that the input amount is reasonable (not too large)
      if (parsedAmount > 1000000) {
        throw new Error(`Input amount too large: ${amountIn}. Please enter a smaller amount.`);
      }
      
      // Get the correct decimals for the input token
      let amountInWei;
      if (tokenIn === 'ETH') {
        amountInWei = ethers.parseUnits(amountIn, 18); // ETH/WETH has 18 decimals
        devLog('handleSwap: ETH amount calculation:', {
          amountIn,
          decimals: 18,
          amountInWei: amountInWei.toString()
        });
      } else {
        const tokenInData = userTokens.find(t => t.symbol === tokenIn);
        devLog('handleSwap: Token data found:', {
          tokenIn,
          tokenInData: tokenInData ? {
            symbol: tokenInData.symbol,
            decimals: tokenInData.decimals,
            address: tokenInData.address,
            balance: tokenInData.balance,
            formattedBalance: tokenInData.formattedBalance
          } : null
        });
        
        if (!tokenInData || !tokenInData.decimals) {
          throw new Error(`Cannot determine decimals for input token: ${tokenIn}`);
        }
        
        // Validate decimals are reasonable
        if (tokenInData.decimals < 0 || tokenInData.decimals > 18) {
          throw new Error(`Invalid decimals for token ${tokenIn}: ${tokenInData.decimals}. Expected 0-18.`);
        }
        
        devLog('handleSwap: Token amount calculation:', {
          amountIn,
          decimals: tokenInData.decimals,
          tokenSymbol: tokenInData.symbol,
          balance: tokenInData.balance ? tokenInData.balance.toString() : 'N/A',
          formattedBalance: tokenInData.formattedBalance
        });
        
        // Check if the amount is reasonable before parsing
        const maxReasonableInput = 1000000; // 1 million tokens max
        if (parseFloat(amountIn) > maxReasonableInput) {
          throw new Error(`Input amount too large: ${amountIn}. Please enter a smaller amount.`);
        }
        
        // Additional check for tokens with 18 decimals
        if (tokenInData.decimals === 18 && parseFloat(amountIn) > 1000) {
          throw new Error(`Amount too large for ${tokenIn} with 18 decimals. Please enter a smaller amount (max 1000).`);
        }
        
        amountInWei = ethers.parseUnits(amountIn, tokenInData.decimals);
        devLog('handleSwap: Calculated amountInWei:', amountInWei.toString());
        
        // Check if amount exceeds token balance
        if (tokenInData.balance && amountInWei > tokenInData.balance) {
          throw new Error(`Amount exceeds your ${tokenIn} balance. You have ${ethers.formatUnits(tokenInData.balance, tokenInData.decimals)} ${tokenIn}.`);
        }
        
        // Check if amount is unreasonably large for this token's decimals
        const maxReasonableForDecimals = ethers.parseUnits('1000000', tokenInData.decimals); // 1 million tokens
        if (amountInWei > maxReasonableForDecimals) {
          throw new Error(`Amount too large for ${tokenIn}. Please enter a smaller amount.`);
        }
      }
      
      // Validate that the amount is reasonable (not too large)
      const maxReasonableAmount = ethers.parseUnits('1000000', 18); // 1 million tokens max
      devLog('handleSwap: Amount validation:', {
        amountInWei: amountInWei.toString(),
        maxReasonableAmount: maxReasonableAmount.toString(),
        isTooLarge: amountInWei > maxReasonableAmount
      });
      
      if (amountInWei > maxReasonableAmount) {
        throw new Error(`Amount too large: ${amountIn} ${tokenIn}. Please enter a smaller amount.`);
      }
      
      // Additional validation: check if amount is unreasonably large (more than 1 billion wei)
      const maxWeiAmount = ethers.parseUnits('1000000000', 18); // 1 billion wei
      if (amountInWei > maxWeiAmount) {
        throw new Error(`Amount unreasonably large: ${amountInWei.toString()} wei. This suggests an error in amount calculation.`);
      }
      
      devLog('handleSwap: Amount calculations:', {
        amountIn,
        amountInWei: amountInWei.toString(),
        decimals: tokenIn === 'ETH' ? 18 : userTokens.find(t => t.symbol === tokenIn)?.decimals,
        slippageTolerance,
        slippagePercentage: settings.slippage
      });
      
      // Final safety check - prevent any amount larger than 1 billion wei
      const safetyLimit = ethers.parseUnits('1000000000', 18);
      if (amountInWei > safetyLimit) {
        throw new Error(`FINAL SAFETY CHECK FAILED - Amount too large: ${amountInWei.toString()} wei. This suggests a calculation error.`);
      }
      
      // Get WETH address for the network
      const wethAddress = getContractAddress(chainId, 'weth');
      devLog('handleSwap: WETH address for chainId', chainId, ':', wethAddress);
      
      if (!wethAddress || wethAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('WETH not configured for this network');
      }
      
      // Get path for the swap
      const path = [];
      if (tokenIn === 'ETH') {
        path.push(wethAddress); // Use correct WETH address for the network
        devLog('handleSwap: Added WETH to path for ETH input:', wethAddress);
      } else {
        // Get token address from userTokens
        const tokenInData = userTokens.find(t => t.symbol === tokenIn);
        if (!tokenInData) {
          throw new Error(`Token ${tokenIn} not found in your wallet`);
        }
        if (!tokenInData.address || tokenInData.address === '0x0000000000000000000000000000000000000000') {
          throw new Error(`Invalid token address for input token: ${tokenInData.address}`);
        }
        path.push(tokenInData.address);
        devLog('handleSwap: Added input token to path', { symbol: tokenIn, address: tokenInData.address });
      }

      if (tokenOut === 'ETH') {
        path.push(wethAddress); // Use correct WETH address for the network
        devLog('handleSwap: Added WETH to path for ETH output:', wethAddress);
      } else {
        // Get token address from userTokens
        const tokenOutData = userTokens.find(t => t.symbol === tokenOut);
        if (!tokenOutData) {
          throw new Error(`Token ${tokenOut} not found in your wallet`);
        }
        if (!tokenOutData.address || tokenOutData.address === '0x0000000000000000000000000000000000000000') {
          throw new Error(`Invalid token address for output token: ${tokenOutData.address}`);
        }
        path.push(tokenOutData.address);
        devLog('handleSwap: Added output token to path', { symbol: tokenOut, address: tokenOutData.address });
      }

      devLog('handleSwap: Final swap path:', path);

      // Validate path length
      if (path.length !== 2) {
        throw new Error('Invalid swap path. Path must contain exactly 2 tokens.');
      }

      // Get expected output amount
      devLog('handleSwap: Calling getAmountsOut to calculate expected output...');
      let expectedAmountOut;
      try {
        const quoted = await quoteExactIn(chainId, walletProvider, path[0], path[1], amountInWei);
        expectedAmountOut = quoted.amountOut;
        devLog('handleSwap: pair-oriented quote:', expectedAmountOut.toString());
      } catch (quoteErr) {
        const amountsOut = await routerContract.getAmountsOut(amountInWei, path);
        expectedAmountOut = amountsOut[1];
        devLog('handleSwap: router getAmountsOut fallback:', amountsOut);
      }
      // eslint-disable-next-line no-undef
      const minAmountOut = expectedAmountOut * BigInt(Math.floor((1 - slippageTolerance) * 1000)) / BigInt(1000);

      devLog('handleSwap: Output calculations:', {
        expectedAmountOut: expectedAmountOut.toString(),
        minAmountOut: minAmountOut.toString(),
        slippageTolerance
      });

      // Calculate deadline
      const deadline = Math.floor(Date.now() / 1000) + (settings.deadline * 60);
      devLog('handleSwap: Transaction deadline:', deadline, 'seconds from now');

      // EIP-1559 gas: get fee data and apply priority multiplier
      const feeData = await walletProvider.getFeeData();
      const mult = getGasFeeMultiplier();
      const applyMult = (v) => (v && v > 0n ? (v * BigInt(Math.round(mult * 100)) / 100n) : v);
      const maxFeePerGas = applyMult(feeData.maxFeePerGas);
      const maxPriorityFeePerGas = applyMult(feeData.maxPriorityFeePerGas);
      const gasPriceLegacy = applyMult(feeData.gasPrice);

      // Estimate gas (with 15% buffer); fallback to 300000 if estimation fails
      let gasLimit = 300000n;
      try {
        if (tokenIn === 'ETH') {
          gasLimit = await routerContract.swapExactETHForTokens.estimateGas(
            minAmountOut, path, account, deadline, { value: amountInWei }
          );
        } else if (tokenOut === 'ETH') {
          gasLimit = await routerContract.swapExactTokensForETH.estimateGas(
            amountInWei, minAmountOut, path, account, deadline
          );
        } else {
          gasLimit = await routerContract.swapExactTokensForTokens.estimateGas(
            amountInWei, minAmountOut, path, account, deadline
          );
        }
        gasLimit = (gasLimit * 115n) / 100n;
      } catch (estErr) {
        console.warn('handleSwap: Gas estimation failed, using default:', estErr?.message);
      }

      const txOverrides = {
        gasLimit,
        ...(maxFeePerGas && maxPriorityFeePerGas
          ? { maxFeePerGas, maxPriorityFeePerGas }
          : { gasPrice: gasPriceLegacy || ethers.parseUnits('20', 'gwei') })
      };

      // Simulate transaction before sending (catch reverts early)
      try {
        if (tokenIn === 'ETH') {
          await routerContract.swapExactETHForTokens.staticCall(
            minAmountOut, path, account, deadline, { value: amountInWei, ...txOverrides }
          );
        } else if (tokenOut === 'ETH') {
          await routerContract.swapExactTokensForETH.staticCall(
            amountInWei, minAmountOut, path, account, deadline, txOverrides
          );
        } else {
          await routerContract.swapExactTokensForTokens.staticCall(
            amountInWei, minAmountOut, path, account, deadline, txOverrides
          );
        }
      } catch (simErr) {
        const msg = simErr?.reason || simErr?.shortMessage || simErr?.message || 'Transaction would fail';
        setSwapError(msg);
        toast.error(msg);
        return;
      }

      let tx;
      if (tokenIn === 'ETH') {
        devLog('handleSwap: Executing swapExactETHForTokens...');
        tx = await routerContract.swapExactETHForTokens(
          minAmountOut,
          path,
          account,
          deadline,
          { value: amountInWei, ...txOverrides }
        );
      } else if (tokenOut === 'ETH') {
        devLog('handleSwap: Executing swapExactTokensForETH...');
        tx = await routerContract.swapExactTokensForETH(
          amountInWei,
          minAmountOut,
          path,
          account,
          deadline,
          txOverrides
        );
      } else {
        devLog('handleSwap: Executing swapExactTokensForTokens...');
        tx = await routerContract.swapExactTokensForTokens(
          amountInWei,
          minAmountOut,
          path,
          account,
          deadline,
          txOverrides
        );
      }

      devLog('handleSwap: Transaction sent:', tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      devLog('handleSwap: Transaction confirmed:', receipt);
      
      setSwapSuccess(`Swap successful! Transaction hash: ${receipt.hash}`);
      toast.success('Swap completed successfully!');
      recordAchievement?.(account, 'swap', 'first_swap');
      tryAccruePoints({
        address: account,
        action: 'swap',
        txHash: receipt.hash,
        chainId,
        metadata: { tokenIn, tokenOut, amountIn },
      });
      setShareData({ tokenIn, tokenOut, amountIn, amountOut });
      setShareModalOpen(true);

      // Track the transaction in history
      try {
        await transactionTrackingService.trackSwapTransaction(
          receipt.hash,
          receipt,
          {
            chainId: chainId,
            account: account,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            amountOut: amountOut,
            pairAddress: '' // Will be determined from the transaction
          }
        );
        devLog('Transaction tracked successfully');
      } catch (error) {
        console.error('Failed to track transaction:', error);
      }
      
      // Clear input amounts
      setAmountIn('');
      setAmountOut('');
      
      // Refresh user tokens
      await fetchUserTokens();

    } catch (error) {
      console.error('handleSwap: Swap error:', error);
      console.error('handleSwap: Error details:', {
        message: error.message,
        code: error.code,
        data: error.data,
        transaction: error.transaction,
        reason: error.reason
      });
      setSwapError(error.message || 'Swap failed. Please try again.');
      toast.error(error.message || 'Swap failed. Please try again.');
    } finally {
      setIsSwapping(false);
    }
  };

  // Calculate expected output amount
  const calculateExpectedOutput = useCallback(async (inputAmount, inputToken, outputToken) => {
    devLog('=== CALCULATE EXPECTED OUTPUT START ===');
    devLog('Function called with:', { inputAmount, inputToken, outputToken });
    
    // Simple validation first
    if (!inputAmount || !inputToken || !outputToken) {
      devLog('calculateExpectedOutput: Missing required parameters');
      setAmountOut('');
      return;
    }
    
    devLog('Raw input values:', {
      inputAmount: inputAmount,
      inputAmountType: typeof inputAmount,
      inputAmountLength: inputAmount ? inputAmount.length : 0,
      inputToken,
      outputToken
    });
    
    // VALIDATION: Check input amount immediately
    if (!inputAmount || isNaN(parseFloat(inputAmount)) || parseFloat(inputAmount) <= 0) {
      devLog('calculateExpectedOutput: Invalid input amount', { inputAmount });
      setAmountOut('');
      return;
    }
    
    const inputAmountNum = parseFloat(inputAmount);
    if (inputAmountNum > 1000000) {
      devLog('calculateExpectedOutput: Input amount too large', { inputAmount, inputAmountNum });
      setAmountOut('');
      return;
    }
    
    // VALIDATION: Check for 18 decimal tokens specifically
    if (inputAmountNum > 1000) {
      devLog('calculateExpectedOutput: Input amount may be too large for 18 decimal tokens', { 
        inputAmount, 
        inputAmountNum,
        warning: 'Amount > 1000 may cause issues with 18 decimal tokens'
      });
    }
    
    if (!inputToken || !outputToken || inputToken === outputToken) {
      devLog('calculateExpectedOutput: Invalid input parameters', { inputAmount, inputToken, outputToken });
      setAmountOut('');
      return;
    }

    // Check if DEX is deployed on current network
    const calcRouterAddress = getContractAddress(chainId, 'dexRouter');
    const wethAddress = getContractAddress(chainId, 'weth');
    devLog('calculateExpectedOutput: Router address for chainId', chainId, ':', calcRouterAddress);
    devLog('calculateExpectedOutput: WETH address for chainId', chainId, ':', wethAddress);
    
    if (!calcRouterAddress || calcRouterAddress === '0x0000000000000000000000000000000000000000') {
      devLog('calculateExpectedOutput: Router not deployed on this network');
      setAmountOut('');
      return;
    }

    if (!wethAddress || wethAddress === '0x0000000000000000000000000000000000000000') {
      devLog('calculateExpectedOutput: WETH not configured for this network');
      setAmountOut('');
      return;
    }

    if (!walletProvider) {
      devLog('calculateExpectedOutput: No wallet provider');
      setAmountOut('');
      return;
    }

    try {
      // Router contract ABI (minimal for getAmountsOut)
      const routerABI = [
        'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
      ];

      const routerContract = new ethers.Contract(calcRouterAddress, routerABI, walletProvider);

      // Get contract addresses for validation (moved to higher scope)
      const contracts = getContractAddresses(chainId);
      const contractAddresses = new Set();
      if (contracts) {
        Object.values(contracts).forEach(value => {
          if (typeof value === 'string' && value.startsWith('0x')) {
            contractAddresses.add(value.toLowerCase());
          } else if (typeof value === 'object') {
            Object.values(value).forEach(v => {
              if (typeof v === 'string' && v.startsWith('0x')) {
                contractAddresses.add(v.toLowerCase());
              }
            });
          }
        });
      }

      // Get path for the swap
      const path = [];
      if (inputToken === 'ETH') {
        path.push(wethAddress); // Use correct WETH address for the network
        devLog('calculateExpectedOutput: Added WETH to path for ETH input:', wethAddress);
      } else {
        // Get token address from userTokens
        const tokenInData = userTokens.find(t => t.symbol === inputToken);
        if (!tokenInData) {
          devLog('calculateExpectedOutput: Token not found in userTokens', { inputToken, userTokens: userTokens.map(t => t.symbol) });
          setAmountOut('');
          return;
        }
        if (!tokenInData.address || tokenInData.address === '0x0000000000000000000000000000000000000000') {
          devLog('calculateExpectedOutput: Invalid token address for input token', { symbol: inputToken, address: tokenInData.address });
          setAmountOut('');
          return;
        }
        
        // Validate that this is not a contract address
        if (contractAddresses.has(tokenInData.address.toLowerCase())) {
          devLog('calculateExpectedOutput: Input token address is a contract address, not a token', { 
            symbol: inputToken, 
            address: tokenInData.address,
            contractAddresses: Array.from(contractAddresses)
          });
          toast.error(`${inputToken} address is a contract, not a token. Please select a different token.`);
          setAmountOut('');
          return;
        }
        
        path.push(tokenInData.address);
        devLog('calculateExpectedOutput: Added token to path', { symbol: inputToken, address: tokenInData.address });
      }

      if (outputToken === 'ETH') {
        path.push(wethAddress); // Use correct WETH address for the network
        devLog('calculateExpectedOutput: Added WETH to path for ETH output:', wethAddress);
      } else {
        // Get token address from userTokens
        const tokenOutData = userTokens.find(t => t.symbol === outputToken);
        if (!tokenOutData) {
          devLog('calculateExpectedOutput: Output token not found in userTokens', { outputToken, userTokens: userTokens.map(t => t.symbol) });
          setAmountOut('');
          return;
        }
        if (!tokenOutData.address || tokenOutData.address === '0x0000000000000000000000000000000000000000') {
          devLog('calculateExpectedOutput: Invalid token address for output token', { symbol: outputToken, address: tokenOutData.address });
          setAmountOut('');
          return;
        }
        
        // Validate that this is not a contract address
        if (contractAddresses.has(tokenOutData.address.toLowerCase())) {
          devLog('calculateExpectedOutput: Output token address is a contract address, not a token', { 
            symbol: outputToken, 
            address: tokenOutData.address,
            contractAddresses: Array.from(contractAddresses)
          });
          toast.error(`${outputToken} address is a contract, not a token. Please select a different token.`);
          setAmountOut('');
          return;
        }
        
        path.push(tokenOutData.address);
        devLog('calculateExpectedOutput: Added output token to path', { symbol: outputToken, address: tokenOutData.address });
      }

      // Validate path length
      if (path.length !== 2) {
        devLog('calculateExpectedOutput: Invalid path length:', path.length);
        setAmountOut('');
        return;
      }

      devLog('calculateExpectedOutput: Swap path details:', {
        path: path,
        inputToken: inputToken,
        outputToken: outputToken,
        inputTokenAddress: path[0],
        outputTokenAddress: path[1],
        routerAddress: calcRouterAddress,
        userTokens: userTokens.map(t => ({
          symbol: t.symbol,
          address: t.address,
          decimals: t.decimals,
          balance: t.balance ? t.balance.toString() : 'N/A'
        }))
      });

      // Validate token addresses
      if (path[0] === '0x0000000000000000000000000000000000000000' || 
          path[1] === '0x0000000000000000000000000000000000000000') {
        devLog('calculateExpectedOutput: Invalid token address in path', { path });
        setAmountOut('');
        return;
      }

      // Check if tokens are the same
      if (path[0] === path[1]) {
        devLog('calculateExpectedOutput: Cannot swap same token', { path });
        setAmountOut('');
        return;
      }

      devLog('calculateExpectedOutput: About to call getAmountsOut with:', {
        path: path,
        inputAmount,
        inputToken,
        outputToken
      });

      // Try a small test amount first to check if the pair exists
      const testAmount = ethers.parseUnits('0.001', 18); // 0.001 tokens
      devLog('calculateExpectedOutput: Testing with small amount:', testAmount.toString());
      devLog('calculateExpectedOutput: Testing path:', path);
      devLog('calculateExpectedOutput: Router address:', calcRouterAddress);
      
      try {
        const testAmountsOut = await routerContract.getAmountsOut(testAmount, path);
        devLog('calculateExpectedOutput: Test getAmountsOut result:', testAmountsOut);
        
        if (!testAmountsOut || testAmountsOut.length < 2 || testAmountsOut[1] === 0n) {
          devLog('calculateExpectedOutput: No liquidity found for this trading pair', {
            inputToken,
            outputToken,
            testAmount: testAmount.toString(),
            testResult: testAmountsOut
          });
          
          // Show user-friendly error
          toast.error(`No trading pair found for ${inputToken}/${outputToken}. Try a different token combination.`);
          setAmountOut('');
          return;
        }
      } catch (testError) {
        devLog('calculateExpectedOutput: Error testing trading pair:', testError);
        devLog('calculateExpectedOutput: Error details:', {
          message: testError.message,
          code: testError.code,
          data: testError.data,
          transaction: testError.transaction
        });
        
        // Show more specific error message
        if (testError.message.includes('missing revert data')) {
          // Get both configured and available pairs
          const configuredPairs = getConfiguredPairs();
          const availablePairs = await checkAvailablePairs();
          
          let suggestionMessage = `No liquidity pool exists for ${inputToken}/${outputToken}.`;
          
          if (configuredPairs.length > 0) {
            const configuredPairStrings = configuredPairs.map(p => `${p.tokenA}/${p.tokenB}`).join(', ');
            suggestionMessage += ` Configured pairs: ${configuredPairStrings}.`;
          }
          
          if (availablePairs.length > 0) {
            const availablePairStrings = availablePairs.map(p => `${p.tokenA}/${p.tokenB}`).join(', ');
            suggestionMessage += ` Available pairs: ${availablePairStrings}.`;
          }
          
          if (configuredPairs.length === 0 && availablePairs.length === 0) {
            suggestionMessage += ' You may need to create this trading pair first.';
          }
          
          toast.error(suggestionMessage);
        } else {
          toast.error(`Error checking trading pair: ${testError.message}`);
        }
        setAmountOut('');
        return;
      }

      // Get expected output amount
      let amountInWei;
      
      devLog('calculateExpectedOutput: Starting amount calculation with:', {
        inputAmount,
        inputToken,
        outputToken,
        userTokens: userTokens.map(t => ({ symbol: t.symbol, decimals: t.decimals, address: t.address }))
      });
      
      // VALIDATION: Check input amount before any calculation
      const inputAmountNum = parseFloat(inputAmount);
      if (inputAmountNum > 1000000) {
        devLog('calculateExpectedOutput: Input amount too large', { inputAmount, inputAmountNum });
        setAmountOut('');
        return;
      }
      
      // Check if input amount contains scientific notation or other problematic formats
      if (inputAmount.includes('e') || inputAmount.includes('E')) {
        devLog('calculateExpectedOutput: Input amount contains scientific notation', { inputAmount });
        setAmountOut('');
        return;
      }
      
      // Check if input amount contains only valid numeric characters
      const validNumericRegex = /^[0-9.]+$/;
      if (!validNumericRegex.test(inputAmount)) {
        devLog('calculateExpectedOutput: Input amount contains invalid characters', { inputAmount });
        setAmountOut('');
        return;
      }
      
      const parsedAmount = parseFloat(inputAmount);
      devLog('calculateExpectedOutput: Parsed amount:', parsedAmount);
      
      // Validate that the input amount is reasonable (not too large)
      if (parsedAmount > 1000000) {
        devLog('calculateExpectedOutput: Input amount too large', { inputAmount, parsedAmount });
        setAmountOut('');
        return;
      }
      
      // Get the correct decimals for the input token
      if (inputToken === 'ETH') {
        amountInWei = ethers.parseUnits(inputAmount, 18); // ETH/WETH has 18 decimals
        devLog('calculateExpectedOutput: ETH amount calculation:', {
          inputAmount,
          decimals: 18,
          amountInWei: amountInWei.toString()
        });
      } else {
        const tokenInData = userTokens.find(t => t.symbol === inputToken);
        devLog('calculateExpectedOutput: Token data found:', {
          inputToken,
          tokenInData: tokenInData ? {
            symbol: tokenInData.symbol,
            decimals: tokenInData.decimals,
            address: tokenInData.address,
            balance: tokenInData.balance ? tokenInData.balance.toString() : 'N/A',
            formattedBalance: tokenInData.formattedBalance
          } : null
        });
        
        if (!tokenInData || !tokenInData.decimals) {
          devLog('calculateExpectedOutput: Cannot determine decimals for input token', { inputToken });
          setAmountOut('');
          return;
        }
        
        // Validate decimals are reasonable
        if (tokenInData.decimals < 0 || tokenInData.decimals > 18) {
          devLog('calculateExpectedOutput: Invalid decimals for token', { 
            inputToken, 
            decimals: tokenInData.decimals 
          });
          setAmountOut('');
          return;
        }
        
        // Additional check for tokens with 18 decimals
        if (tokenInData.decimals === 18 && parseFloat(inputAmount) > 1000) {
          devLog('calculateExpectedOutput: Amount too large for 18 decimal token', { inputAmount, tokenSymbol: tokenInData.symbol });
          setAmountOut('');
          return;
        }
        
        amountInWei = ethers.parseUnits(inputAmount, tokenInData.decimals);
        devLog('calculateExpectedOutput: Calculated amountInWei:', amountInWei.toString());
        
        // Check if amount exceeds token balance
        if (tokenInData.balance && amountInWei > tokenInData.balance) {
          devLog('calculateExpectedOutput: Amount exceeds token balance', {
            amountInWei: amountInWei.toString(),
            balance: tokenInData.balance.toString(),
            formattedBalance: ethers.formatUnits(tokenInData.balance, tokenInData.decimals)
          });
          setAmountOut('');
          return;
        }
        
        // Check if amount is unreasonably large for this token's decimals
        const maxReasonableForDecimals = ethers.parseUnits('1000000', tokenInData.decimals); // 1 million tokens
        if (amountInWei > maxReasonableForDecimals) {
          devLog('calculateExpectedOutput: Amount too large for token decimals', {
            amountInWei: amountInWei.toString(),
            maxReasonableForDecimals: maxReasonableForDecimals.toString(),
            decimals: tokenInData.decimals
          });
          setAmountOut('');
          return;
        }
      }
      
      // Validate that the amount is reasonable (not too large)
      const maxReasonableAmount = ethers.parseUnits('1000000', 18); // 1 million tokens max
      devLog('calculateExpectedOutput: Amount validation:', {
        amountInWei: amountInWei.toString(),
        maxReasonableAmount: maxReasonableAmount.toString(),
        isTooLarge: amountInWei > maxReasonableAmount
      });
      
      if (amountInWei > maxReasonableAmount) {
        devLog('calculateExpectedOutput: Amount too large, likely invalid', { 
          amountInWei: amountInWei.toString(),
          maxReasonableAmount: maxReasonableAmount.toString()
        });
        setAmountOut('');
        return;
      }
      
      // Additional validation: check if amount is unreasonably large (more than 1 billion wei)
      const maxWeiAmount = ethers.parseUnits('1000000000', 18); // 1 billion wei
      if (amountInWei > maxWeiAmount) {
        devLog('calculateExpectedOutput: Amount unreasonably large, preventing contract call', { 
          amountInWei: amountInWei.toString(),
          maxWeiAmount: maxWeiAmount.toString()
        });
        setAmountOut('');
        return;
      }
      
      devLog('calculateExpectedOutput: Calling getAmountsOut with:', {
        amountInWei: amountInWei.toString(),
        path: path,
        inputAmount,
        inputToken,
        outputToken
      });
      
      // Final safety check - prevent any amount larger than 1 billion wei
      const safetyLimit = ethers.parseUnits('1000000000', 18);
      if (amountInWei > safetyLimit) {
        devLog('calculateExpectedOutput: FINAL SAFETY CHECK FAILED - Amount too large, preventing contract call', {
          amountInWei: amountInWei.toString(),
          safetyLimit: safetyLimit.toString()
        });
        setAmountOut('');
        return;
      }
      
      let amountsOut;
      try {
        const quoted = await quoteExactIn(chainId, walletProvider, path[0], path[1], amountInWei);
        amountsOut = [amountInWei, quoted.amountOut];
        devLog('calculateExpectedOutput: pair-oriented quote', quoted.amountOut.toString());
      } catch (quoteErr) {
        amountsOut = await routerContract.getAmountsOut(amountInWei, path);
        devLog('calculateExpectedOutput: router getAmountsOut fallback', amountsOut);
      }
      
      // Check if the result is valid
      if (!amountsOut || amountsOut.length < 2) {
        devLog('calculateExpectedOutput: Invalid result from getAmountsOut', { amountsOut });
        setAmountOut('');
        return;
      }
      
      // Check if the output amount is 0 or very small
      if (amountsOut[1] === 0n || amountsOut[1] < 1000n) {
        devLog('calculateExpectedOutput: Output amount is too small or zero', { 
          amountsOut: amountsOut.map(a => a.toString()),
          inputAmount,
          inputToken,
          outputToken
        });
        setAmountOut('');
        return;
      }
      
      // Format the output amount using the correct decimals for the output token
      let expectedAmountOut;
      if (outputToken === 'ETH') {
        expectedAmountOut = ethers.formatUnits(amountsOut[1], 18); // ETH/WETH has 18 decimals
      } else {
        const tokenOutData = userTokens.find(t => t.symbol === outputToken);
        if (!tokenOutData || !tokenOutData.decimals) {
          devLog('calculateExpectedOutput: Cannot determine decimals for output token', { outputToken });
          setAmountOut('');
          return;
        }
        expectedAmountOut = ethers.formatUnits(amountsOut[1], tokenOutData.decimals);
      }
      
      devLog('calculateExpectedOutput: Expected output amount:', expectedAmountOut);
      
      // Final validation - check if the output amount is reasonable
      const outputAmountNum = parseFloat(expectedAmountOut);
      if (outputAmountNum <= 0 || isNaN(outputAmountNum)) {
        devLog('calculateExpectedOutput: Invalid output amount calculated', { expectedAmountOut, outputAmountNum });
        setAmountOut('');
        return;
      }
      
      setAmountOut(expectedAmountOut);

    } catch (error) {
      console.error('calculateExpectedOutput: Error calculating expected output:', error);
      console.error('calculateExpectedOutput: Error details:', {
        message: error.message,
        code: error.code,
        data: error.data,
        transaction: error.transaction
      });
      setAmountOut('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- checkAvailablePairs, getConfiguredPairs intentionally omitted to avoid loops
  }, [chainId, userTokens, walletProvider]);

  // Fetch user's tokens
  const fetchUserTokens = useCallback(async () => {
    if (!account) {
      devLog('No account available, skipping token fetch');
      return;
    }
    
    devLog('Starting token fetch for account:', account);
    setIsLoadingTokens(true);
    try {
      if (!walletProvider) {
        devLog('No wallet provider, skipping token fetch');
        return;
      }

      // Get all tokens from user's wallet by scanning transfer events
      const allTokens = await getAllUserTokens(walletProvider, account);
      devLog('User wallet tokens found:', allTokens.length, allTokens);
      
      // Also check common tokens for better coverage
      const commonTokens = getCommonTokens(chainId);
      devLog('Common tokens found:', commonTokens.length, commonTokens);
      
      let factoryTokenAddrs = [];
      try {
        factoryTokenAddrs = await fetchTradeableEvmTokenAddressesFromDexFactory(walletProvider, Number(chainId));
      } catch (e) {
        console.warn('DEX factory token scan skipped:', e?.message || e);
      }
      const factorySet = new Set(factoryTokenAddrs.map((a) => a.toLowerCase()));

      const allTokenAddresses = [...new Set([...allTokens, ...commonTokens, ...factoryTokenAddrs])];
      devLog('Total unique token addresses:', allTokenAddresses.length);
      
      // Debug: Log each address being processed
      devLog('Processing token addresses:', allTokenAddresses);
      
      const protocolAddresses = getEvmDexProtocolAddresses(chainId);
      const hubSet = new Set(commonTokens.map((a) => a.toLowerCase()));

      const candidates = allTokenAddresses.filter(
        (tokenAddress) => !protocolAddresses.has(tokenAddress.toLowerCase())
      );

      const tokenResults = await Promise.all(
        candidates.map(async (tokenAddress) => {
          try {
            const tokenInfo = await getTokenInfo(tokenAddress, walletProvider);
            const inFactory = factorySet.has(tokenAddress.toLowerCase());
            const isHub = hubSet.has(tokenAddress.toLowerCase());
            const hasBal = tokenInfo?.balance && tokenInfo.balance !== '0';
            if (
              tokenInfo &&
              tokenInfo.symbol &&
              tokenInfo.name &&
              tokenInfo.decimals != null &&
              (hasBal || inFactory || isHub)
            ) {
              return {
                address: tokenAddress,
                ...tokenInfo,
                formattedBalance: ethers.formatUnits(tokenInfo.balance, tokenInfo.decimals),
                fromDexFactory: inFactory && !hasBal,
              };
            }
          } catch (error) {
            if (import.meta.env.DEV) {
              console.warn(`Failed to load token ${tokenAddress}:`, error.message);
            }
          }
          return null;
        })
      );
      const tokensWithBalance = tokenResults.filter(Boolean);
      
      // Wallet balances first; factory-only (zero balance) still listed for routing into pools.
      tokensWithBalance.sort((a, b) => {
        const az = a.fromDexFactory ? 1 : 0;
        const bz = b.fromDexFactory ? 1 : 0;
        if (az !== bz) return az - bz;
        return parseFloat(b.formattedBalance) - parseFloat(a.formattedBalance);
      });
      
      devLog('Final tokens to display:', tokensWithBalance.length, tokensWithBalance.map(t => `${t.symbol} (${t.address})`));
      const net = getNetworkByChainId(chainId);
      const nativeSym = net?.nativeCurrency?.symbol || 'ETH';
      if (!tokensWithBalance.some((t) => t.symbol === nativeSym || t.isNative)) {
        try {
          const wei = await walletProvider.getBalance(account);
          tokensWithBalance.unshift({
            address: ethers.ZeroAddress,
            symbol: nativeSym,
            name: net?.nativeCurrency?.name || nativeSym,
            decimals: 18,
            balance: wei.toString(),
            formattedBalance: ethers.formatEther(wei),
            isNative: true,
          });
        } catch {
          tokensWithBalance.unshift({
            address: ethers.ZeroAddress,
            symbol: nativeSym,
            name: nativeSym,
            decimals: 18,
            balance: '0',
            formattedBalance: '0',
            isNative: true,
          });
        }
      }
      setUserTokens((prev) => {
        const discovered = prev.filter((t) => t.fromDiscovery);
        const next = [...tokensWithBalance];
        for (const d of discovered) {
          if (!next.some((t) => (t.address || '').toLowerCase() === (d.address || '').toLowerCase())) {
            next.push(d);
          }
        }
        return next;
      });
    } catch (error) {
      console.error('Error fetching user tokens:', error);
      toast.error('Failed to load your tokens');
    } finally {
      setIsLoadingTokens(false);
    }
  }, [account, chainId, getAllUserTokens, getTokenInfo, getCommonTokens, walletProvider]);

  // Get configured trading pairs from contract config
  const getConfiguredPairs = useCallback(() => {
    const contracts = getContractAddresses(chainId);
    if (!contracts || !contracts.pairs) return [];
    
    const configuredPairs = [];
    for (const [pairName, pairAddress] of Object.entries(contracts.pairs)) {
      if (pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000') {
        // Extract token names from pair name (e.g., "usdcEth" -> "USDC/ETH")
        const tokens = pairName.replace(/([A-Z])/g, ' $1').trim().split(' ');
        if (tokens.length >= 2) {
          configuredPairs.push({
            name: pairName,
            address: pairAddress,
            tokenA: tokens[0].toUpperCase(),
            tokenB: tokens[1].toUpperCase()
          });
        }
      }
    }
    
    devLog('getConfiguredPairs: Configured pairs:', configuredPairs);
    return configuredPairs;
  }, [chainId]);

  // Check available trading pairs
  const checkAvailablePairs = useCallback(async () => {
    if (!chainId) return [];
    
    const routerAddress = getContractAddress(chainId, 'dexRouter');
    if (!routerAddress || routerAddress === '0x0000000000000000000000000000000000000000') {
      devLog('checkAvailablePairs: Router not deployed on this network');
      return [];
    }

    if (!walletProvider) {
      return [];
    }

    try {
      const routerABI = [
        'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
      ];
      const routerContract = new ethers.Contract(routerAddress, routerABI, walletProvider);

      const testAmount = ethers.parseUnits('0.001', 18);
      const commonTokens = userTokens.slice(0, 5); // Test first 5 tokens
      const pairJobs = [];
      for (let i = 0; i < commonTokens.length; i++) {
        for (let j = i + 1; j < commonTokens.length; j++) {
          pairJobs.push([commonTokens[i], commonTokens[j]]);
        }
      }

      const settled = await Promise.allSettled(
        pairJobs.map(async ([tokenA, tokenB]) => {
          const path = [tokenA.address, tokenB.address];
          const amountsOut = await routerContract.getAmountsOut(testAmount, path);
          if (amountsOut && amountsOut.length >= 2 && amountsOut[1] > 0n) {
            return {
              tokenA: tokenA.symbol,
              tokenB: tokenB.symbol,
              addressA: tokenA.address,
              addressB: tokenB.address,
            };
          }
          return null;
        })
      );

      const availablePairs = settled
        .filter((r) => r.status === 'fulfilled' && r.value)
        .map((r) => r.value);

      if (import.meta.env.DEV) {
        console.log('checkAvailablePairs: Available trading pairs:', availablePairs);
      }

      return availablePairs;
    } catch (error) {
      console.error('checkAvailablePairs: Error checking pairs:', error);
      return [];
    }
  }, [chainId, userTokens, walletProvider]);

  // EIP-1559 gas cost estimate for display (fee data only, no signer)
  const DEFAULT_SWAP_GAS_LIMIT = 250000n;
  useEffect(() => {
    if (!chainId || !walletProvider) {
      setEstimatedGasCost(null);
      return;
    }
    let cancelled = false;
    setEstimatedGasCostLoading(true);
    const run = async () => {
      try {
        const feeData = await walletProvider.getFeeData();
        const mult = getGasFeeMultiplier();
        const gasLimit = DEFAULT_SWAP_GAS_LIMIT;
        let costWei;
        if (feeData.maxFeePerGas && feeData.maxFeePerGas > 0n) {
          costWei = (gasLimit * feeData.maxFeePerGas * BigInt(Math.round(mult * 100))) / 100n;
        } else if (feeData.gasPrice && feeData.gasPrice > 0n) {
          costWei = (gasLimit * feeData.gasPrice * BigInt(Math.round(mult * 100))) / 100n;
        } else {
          setEstimatedGasCost(null);
          return;
        }
        if (cancelled) return;
        const network = getNetworkByChainId(chainId);
        const symbol = network?.nativeCurrency?.symbol || 'ETH';
        setEstimatedGasCost(`${ethers.formatEther(costWei)} ${symbol}`);
      } catch (e) {
        if (!cancelled) setEstimatedGasCost(null);
      } finally {
        if (!cancelled) setEstimatedGasCostLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- DEFAULT_SWAP_GAS_LIMIT, getGasFeeMultiplier are constants
  }, [chainId, settings.gasPriority, walletProvider]);

  // Initialize external DEX service
  useEffect(() => {
    if (isConnected && chainId && walletProvider) {
      const initializeExternalDEX = async () => {
        try {
          await externalSwapService.initialize(walletProvider);
          setIsExternalDEXAvailable(externalSwapService.isExternalDEXsAvailable(chainId));
        } catch (error) {
          console.error('Failed to initialize external DEX service:', error);
        }
      };
      
      initializeExternalDEX();
    }
  }, [isConnected, chainId, walletProvider]);

  // Fetch tokens on mount and when account changes
  useEffect(() => {
    devLog('useEffect triggered - isConnected:', isConnected, 'account:', account, 'chainId:', chainId);
    if (isConnected && account) {
      fetchUserTokens();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchUserTokens intentionally not in deps
  }, [isConnected, account, chainId, fetchUserTokens]);

  // Check available trading pairs when tokens are loaded
  useEffect(() => {
    if (userTokens.length > 0 && chainId) {
      devLog('Checking available trading pairs...');
      checkAvailablePairs();
    }
  }, [userTokens, chainId, checkAvailablePairs]);

  // Calculate expected output when input changes
  useEffect(() => {
    devLog('🔄 useEffect triggered for calculation:', {
      amountIn,
      tokenIn,
      tokenOut,
      hasAmountIn: !!amountIn,
      hasTokenIn: !!tokenIn,
      hasTokenOut: !!tokenOut,
      tokensDifferent: tokenIn !== tokenOut,
      amountInValue: amountIn,
      tokenInValue: tokenIn,
      tokenOutValue: tokenOut
    });
    
    if (amountIn && tokenIn && tokenOut && tokenIn !== tokenOut) {
      devLog('✅ Starting calculation with:', { amountIn, tokenIn, tokenOut });
      const timeoutId = setTimeout(() => {
        void (async () => {
          setAggregatorQuote(null);
          setRouteSource(null);
          let agg = null;
          if (Number(chainId) !== BOING_NATIVE_L1_CHAIN_ID && account) {
            try {
              agg = await getEvmAggregatorQuote({
                chainId: Number(chainId),
                fromSymbol: tokenIn,
                toSymbol: tokenOut,
                amountHuman: amountIn,
                fromAddress: account,
                userTokens,
                slippagePercent: settings.slippage,
              });
            } catch (e) {
              devLog('Aggregator quote skipped:', e?.message || e);
            }
          }
          if (agg?.amountOutHuman) {
            setAggregatorQuote(agg);
            setAmountOut(agg.amountOutHuman);
            setRouteSource('aggregator');
            setSelectedExternalQuote(null);
            return;
          }
          calculateExpectedOutput(amountIn, tokenIn, tokenOut);
          if (featureSupport.swap === 'boing') setRouteSource('boing');
          if (isExternalDEXAvailable) {
            fetchExternalQuotes();
          }
        })();
      }, 500);
      
      return () => {
        devLog('🧹 Clearing timeout');
        clearTimeout(timeoutId);
      };
    } else {
      devLog('❌ Clearing amountOut due to invalid parameters');
      setAmountOut('');
      setExternalQuotes([]);
      setSelectedExternalQuote(null);
      setAggregatorQuote(null);
      setRouteSource(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchExternalQuotes intentionally not in deps
  }, [amountIn, tokenIn, tokenOut, calculateExpectedOutput, isExternalDEXAvailable, account, chainId, userTokens, settings.slippage, featureSupport.swap]);

  // Fetch external DEX quotes
  const fetchExternalQuotes = async () => {
    if (!isExternalDEXAvailable || !amountIn || !tokenIn || !tokenOut) {
      return;
    }

    try {
      // Get token addresses
      const tokenInData = userTokens.find(t => t.symbol === tokenIn);
      const tokenOutData = userTokens.find(t => t.symbol === tokenOut);
      
      if (!tokenInData || !tokenOutData) {
        return;
      }

      const amountInWei = ethers.parseUnits(amountIn, tokenInData.decimals);
      
      const quotes = await externalSwapService.getSwapQuotes(
        tokenInData.address,
        tokenOutData.address,
        amountInWei,
        chainId
      );

      setExternalQuotes(quotes);
      setShowExternalQuotes(quotes.length > 0);
      
      // Auto-select the best quote
      if (quotes.length > 0) {
        setSelectedExternalQuote(quotes[0]);
      } else {
        // If no external quotes, show a helpful message
        devLog('No external DEX quotes available - this is normal on Sepolia testnet');
        devLog('Your DEX will be used for swaps');
      }
    } catch (error) {
      console.error('Error fetching external quotes:', error);
      // Don't show error to user - external DEXs not being available is expected on testnets
    }
  };

  // Handle external quote selection
  const handleExternalQuoteSelect = (quote) => {
    setSelectedExternalQuote(quote);
    // Update the output amount with the external quote
    setAmountOut(quote.amountOut);
  };

  // Handle external DEX swap
  const handleExternalSwap = async () => {
    if (!selectedExternalQuote) {
      toast.error('No external quote selected');
      return;
    }

    setIsSwapping(true);
    setSwapError('');
    setSwapSuccess('');

    try {
      if (!walletProvider) {
        throw new Error('Connect a wallet first');
      }
      const signer = walletSigner ?? (await walletProvider.getSigner());

      // Check if approval is needed
      const tokenInData = userTokens.find(t => t.symbol === tokenIn);
      if (tokenInData && tokenInData.address !== '0x0000000000000000000000000000000000000000') {
        const isApproved = await externalSwapService.checkApproval(
          tokenInData.address,
          selectedExternalQuote.router,
          selectedExternalQuote.amountInWei,
          signer
        );

        if (!isApproved) {
          toast('Approving token for external DEX...', { duration: 3000 });
          const approvalTx = await externalSwapService.approveToken(
            tokenInData.address,
            selectedExternalQuote.router,
            signer
          );
          await approvalTx.wait();
          toast.success('Token approved successfully!');
        }
      }

      // Execute the swap
      toast(`Executing swap on ${selectedExternalQuote.dexName}...`, { duration: 3000 });
      
      const result = await externalSwapService.executeSwap(
        selectedExternalQuote,
        signer,
        settings.slippage
      );

      toast.success(`Swap executed on ${selectedExternalQuote.dexName}!`);
      setSwapSuccess(`Swap successful on ${selectedExternalQuote.dexName}! Transaction: ${result.txHash}`);
      recordAchievement?.(account, 'swap', 'first_swap');
      tryAccruePoints({
        address: account,
        action: 'swap',
        txHash: result.txHash,
        chainId,
        metadata: { tokenIn, tokenOut, amountIn, dex: selectedExternalQuote.dexName },
      });
      setShareData({ tokenIn, tokenOut, amountIn, amountOut });
      setShareModalOpen(true);

      // Clear form
      setAmountIn('');
      setAmountOut('');
      setSelectedExternalQuote(null);
      setExternalQuotes([]);
      setShowExternalQuotes(false);

      // Refresh user tokens
      await fetchUserTokens();

    } catch (error) {
      console.error('External swap error:', error);
      setSwapError(`External swap failed: ${error.message}`);
      toast.error(`External swap failed: ${error.message}`);
    } finally {
      setIsSwapping(false);
    }
  };

  if (isSolana) return <SwapSolanaContent />;

  return (
    <>
      <Helmet>
        <title>Swap Tokens | boing.finance — Trade on EVM & Solana</title>
        <meta name="description" content="Swap tokens instantly on EVM and Solana. Get the best rates with boing.finance—the DeFi that always bounces back." />
        <meta name="keywords" content="swap tokens, DEX, boing finance, EVM, Solana, token swap, decentralized exchange" />
        <meta property="og:title" content="Swap Tokens | boing.finance" />
        <meta property="og:description" content="Swap tokens on EVM and Solana. Best rates, one interface." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/swap" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Swap Tokens | boing.finance" />
        <meta name="twitter:description" content="Swap tokens on EVM and Solana. Best rates." />
      </Helmet>
      <div className="relative w-full min-w-0">
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onSave={handleSaveSettings}
          initialSettings={settings}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Spot
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Discover trending tokens on this chain and swap on-chain
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ProactiveTipsBanner />
              <div
                className="px-3 py-2 rounded-lg"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    settings.gasPriority === 'high' ? 'bg-red-400' :
                    settings.gasPriority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                  }`} />
                  <span className="text-white text-xs font-medium">{getGasPriorityLabel()}</span>
                </div>
              </div>
              <button
                type="button"
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                onClick={() => setSettingsOpen(true)}
                aria-label="Open settings"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zm7.94-2.06a1 1 0 0 0 .26-1.09l-1.43-2.49a1 1 0 0 1 0-.9l1.43-2.49a1 1 0 0 0-.26-1.09l-2.12-2.12a1 1 0 0 0-1.09-.26l-2.49 1.43a1 1 0 0 1 .9 0l-2.49-1.43a1 1 0 0 0-1.09.26l-2.12 2.12a1 1 0 0 0-.26 1.09l1.43 2.49a1 1 0 0 1 0 .9l-1.43 2.49a1 1 0 0 0 .26 1.09l2.12 2.12a1 1 0 0 0 1.09.26l2.49-1.43a1 1 0 0 1 .9 0l2.49 1.43a1 1 0 0 0 1.09-.26l2.12-2.12z" />
                </svg>
              </button>
            </div>
          </div>

          {featureSupport.swap === 'native_amm' && (
            <NativeBoingTradeHub slippagePercent={settings.slippage} />
          )}

          {showEvmSwapDesk && (
          <>
          <SwapSpotTicker
            market={selectedMarket}
            networkName={getNetworkByChainId(chainId)?.name || 'Network'}
            fallbackPair={`${tokenOut}/${tokenIn}`}
          />
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          <div className="xl:col-span-3 order-3 xl:order-1 xl:sticky xl:top-20">
            <SwapMarketsBoard
              networkName={getNetworkByChainId(chainId)?.name || 'Chain'}
              tab={dexMarkets.tab}
              onTab={dexMarkets.setTab}
              queryText={dexMarkets.queryText}
              onQueryText={dexMarkets.setQueryText}
              rows={dexMarkets.rows}
              isLoading={dexMarkets.isLoading}
              selectedAddress={focusOutAddress || selectedMarket?.address}
              onSelect={selectDiscoveryMarket}
            />
          </div>
          <div className="xl:col-span-9 order-1 xl:order-2 flex flex-col gap-4 min-w-0">
            <Suspense fallback={<ChartSkeleton height="280px" />}>
              <SwapTokenPriceChart
                chain="evm"
                chainId={Number(chainId)}
                tokenIn={chartTokenIn}
                tokenOut={chartTokenOut}
              />
            </Suspense>
          <div
            className="rounded-2xl p-4 sm:p-5 shadow-xl mb-4 sm:mb-6"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 24px var(--shadow)',
            }}
          >
            <p className="text-sm font-bold mb-3 tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {selectedMarket?.pair || `${tokenOut} / ${tokenIn}`}
            </p>
            <div className="flex justify-end mb-4">
              {(() => {
                const s = getNetworkStatusMessage();
                const map = { success: 'bg-green-500/15 text-green-400', warning: 'bg-yellow-500/15 text-yellow-400', error: 'bg-red-500/15 text-red-400' };
                return (
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${map[s.type] || 'bg-gray-500/15 text-gray-400'}`}>
                    {s.type === 'success' && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                    {s.type === 'warning' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
                    {s.type === 'error' && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                    <span>{s.message}</span>
                  </div>
                );
              })()}
            </div>

            <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
              {(() => {
                const configuredPairs = getConfiguredPairs();
                if (configuredPairs.length > 0) {
                  return `Boing pairs: ${configuredPairs.map((p) => `${p.tokenA}/${p.tokenB}`).join(', ')}`;
                }
                if (routeSource === 'aggregator' && aggregatorQuote?.venue) {
                  return `Route: ${aggregatorQuote.venue}`;
                }
                return 'Public DEX route when a market exists.';
              })()}
            </p>

            {/* Token Input Section */}
            <div className="space-y-4 sm:space-y-6">
              {/* Token In */}
              <div className="bg-gray-750 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">You Pay</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-xs">
                      Balance: {getTokenInBalance() !== null ? getTokenInBalance().toFixed(4) : '0.0000'}
                    </span>
                    <button
                      onClick={setTokenInFullBalance}
                      className="text-blue-400 text-xs hover:text-blue-300 transition-colors cursor-pointer px-2 py-1 rounded hover:bg-gray-600 border border-blue-400 hover:border-blue-300"
                      title="Click to set maximum balance"
                    >
                      Max
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <label htmlFor="swap-amount-in" className="sr-only">Amount to swap</label>
                  <input
                    id="swap-amount-in"
                    name="amountIn"
                    type="number"
                    value={amountIn}
                    onChange={(e) => {
                      devLog('📝 Input changed:', e.target.value);
                      setAmountIn(e.target.value);
                    }}
                    placeholder="0.0"
                    className="flex-1 bg-transparent text-xl sm:text-2xl font-bold text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
                  />
                  <SwapTokenSelect
                    idPrefix="swap-token-in"
                    open={tokenInDropdownOpen}
                    onToggle={() => {
                      setTokenOutDropdownOpen(false);
                      setTokenInDropdownOpen((v) => !v);
                    }}
                    selectedSymbol={tokenIn}
                    logo={getTokenLogo(tokenIn)}
                    tokens={userTokens}
                    loading={isLoadingTokens}
                    onSelect={(token) => handleTokenSelect(token, 'tokenIn')}
                    getTokenLogo={getTokenLogo}
                    customOpen={customImportOpenFor === 'tokenIn'}
                    onToggleCustom={() =>
                      setCustomImportOpenFor((prev) => (prev === 'tokenIn' ? null : 'tokenIn'))
                    }
                    customAddress={customImportAddress}
                    onCustomAddress={setCustomImportAddress}
                    onImport={submitCustomTokenImport}
                    onCancelCustom={() => {
                      setCustomImportOpenFor(null);
                      setCustomImportAddress('');
                    }}
                  />
                </div>
                {amountInUsd ? (
                  <div className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>≈ {amountInUsd}</div>
                ) : null}
              </div>

              <div className="flex justify-center -my-1">
                <button
                  type="button"
                  onClick={switchTokens}
                  className="bg-gray-700 hover:bg-gray-600 rounded-full p-2 transition-colors"
                  aria-label="Switch tokens"
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-gray-300">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
              </div>

              {/* Token Out */}
              <div className="bg-gray-750 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">You Receive</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-xs">
                      Balance: {getTokenOutBalance() !== null ? getTokenOutBalance().toFixed(4) : '0.0000'}
                    </span>
                    {/* Remove the Max button for output - it should be calculated automatically */}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <label htmlFor="swap-amount-out" className="sr-only">Amount you receive</label>
                  <input
                    id="swap-amount-out"
                    name="amountOut"
                    type="number"
                    value={amountOut}
                    readOnly
                    placeholder="0.0"
                    className="flex-1 bg-transparent text-xl sm:text-2xl font-bold text-white placeholder-gray-500 focus:outline-none cursor-not-allowed"
                  />
                  <SwapTokenSelect
                    idPrefix="swap-token-out"
                    open={tokenOutDropdownOpen}
                    onToggle={() => {
                      setTokenInDropdownOpen(false);
                      setTokenOutDropdownOpen((v) => !v);
                    }}
                    selectedSymbol={tokenOut}
                    logo={getTokenLogo(tokenOut)}
                    tokens={userTokens}
                    loading={isLoadingTokens}
                    onSelect={(token) => handleTokenSelect(token, 'tokenOut')}
                    getTokenLogo={getTokenLogo}
                    customOpen={customImportOpenFor === 'tokenOut'}
                    onToggleCustom={() =>
                      setCustomImportOpenFor((prev) => (prev === 'tokenOut' ? null : 'tokenOut'))
                    }
                    customAddress={customImportAddress}
                    onCustomAddress={setCustomImportAddress}
                    onImport={submitCustomTokenImport}
                    onCancelCustom={() => {
                      setCustomImportOpenFor(null);
                      setCustomImportAddress('');
                    }}
                  />
                </div>
                {amountOutUsd ? (
                  <div className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>≈ {amountOutUsd}</div>
                ) : null}
                {amountOut && parseFloat(amountOut) > 0 && (
                  <div className="mt-2 text-xs text-gray-400">
                    Rate: 1 {tokenIn} = {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} {tokenOut}
                    {routeSource === 'aggregator' && aggregatorQuote?.venue
                      ? ` · via ${aggregatorQuote.venue}`
                      : routeSource === 'boing'
                        ? ' · Boing DEX'
                        : ''}
                  </div>
                )}
              </div>
            </div>

            {/* Swap Details with Gas Info */}
            <div className="mt-4 sm:mt-6 bg-gray-750 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm">Exchange Rate</span>
                  <InfoTooltip content="The current exchange rate between the selected tokens. This rate is calculated from the DEX liquidity pools." />
                </div>
                <span className="text-white text-sm sm:text-base">
                  {amountIn && amountOut && parseFloat(amountIn) > 0 && parseFloat(amountOut) > 0 
                    ? `1 ${tokenIn} = ${(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} ${tokenOut}`
                    : 'Enter amount to see rate'
                  }
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

              {/* Gas Fee Estimation (EIP-1559 when supported) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm">Estimated Gas Fee</span>
                  <InfoTooltip content={`Estimated gas fee for this transaction. Current priority: ${getGasPriorityLabel()} (${getGasFeeMultiplier()}x). Simulated before sending.`} />
                </div>
                <div className="flex items-center space-x-2">
                  {estimatedGasCostLoading ? (
                    <span className="text-gray-400 text-sm">...</span>
                  ) : (
                    <span className="text-white text-sm sm:text-base">
                      ~{estimatedGasCost ?? '—'}
                    </span>
                  )}
                  <div className={`w-2 h-2 rounded-full ${
                    settings.gasPriority === 'high' ? 'bg-red-400' : 
                    settings.gasPriority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                  }`}></div>
                </div>
              </div>
            </div>

            {/* External DEX Quotes */}
            {isExternalDEXAvailable && showExternalQuotes && (
              <ExternalDEXQuotes
                tokenIn={tokenIn}
                tokenOut={tokenOut}
                amountIn={amountIn}
                chainId={chainId}
                onQuoteSelect={handleExternalQuoteSelect}
                isVisible={showExternalQuotes}
              />
            )}

            {/* Swap Button */}
            <div className="mt-6 sm:mt-8">
              <button
                onClick={handleSwap}
                disabled={isSwapping || !isConnected || !account || !amountIn || parseFloat(amountIn) <= 0 || !tokenIn || !tokenOut || tokenIn === tokenOut}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-8 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isSwapping ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Swapping...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    <span>Swap Now</span>
                  </div>
                )}
              </button>
              
              {swapError && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
                  {swapError}
                </div>
              )}
              
              {swapSuccess && (
                <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg text-green-400 text-sm text-center">
                  {swapSuccess}
                  <button
                    type="button"
                    onClick={() => shareData && setShareModalOpen(true)}
                    className="block mt-2 mx-auto px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    Share
                  </button>
                </div>
              )}
            </div>
          </div>
          </div>
          </div>
          </>
          )}
        </div>
      </div>
      <ShareCardModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        type="swap"
        data={shareData}
      />
    </>
  );
};

export default Swap;