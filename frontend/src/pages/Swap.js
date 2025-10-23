import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { getContractAddress, getContractAddresses } from '../config/contracts';
import SettingsModal from '../components/SettingsModal';
import toast from 'react-hot-toast';
import { InfoTooltip, WarningTooltip } from '../components/Tooltip';
import { transactionTrackingService } from '../services/transactionTrackingService.js';
import externalSwapService from '../services/externalSwapService';
import ExternalDEXQuotes from '../components/ExternalDEXQuotes';


const Swap = () => {
  const { isConnected, account } = useWalletConnection();
  const { chainId } = useWallet();
  
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

  // Swap transaction state
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapError, setSwapError] = useState('');
  const [swapSuccess, setSwapSuccess] = useState('');

  // External DEX state
  const [externalQuotes, setExternalQuotes] = useState([]);
  const [selectedExternalQuote, setSelectedExternalQuote] = useState(null);
  const [showExternalQuotes, setShowExternalQuotes] = useState(false);
  const [isExternalDEXAvailable, setIsExternalDEXAvailable] = useState(false);

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
      console.log(`Found ${tokenAddresses.length} unique tokens from transfer events`);
      
      return tokenAddresses;
    } catch (error) {
      console.error('Error scanning for user tokens:', error);
      return [];
    }
  }, [chainId]);

  // Get common tokens for the network
  const getCommonTokens = useCallback((networkId) => {
    // Common token addresses for different networks
    const commonTokens = {
      11155111: [ // Sepolia
        '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC
        '0x779877A7B0D9E8603169DdbD7836e478b4624789', // LINK
        '0x097D90c9d3E0B50Ca60e1ae45F6A81010f9FB534', // WETH
        '0x68194a729C2450ad26072b3D33ADaCbcef39D574', // DAI
        '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06'  // USDT
      ],
      1: [ // Ethereum Mainnet
        '0xA0b86a33E6441b8c4C8D8C8C8C8C8C8C8C8C8C8', // USDC
        '0x514910771AF9Ca656af840dff83E8264EcF986CA', // LINK
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'  // WETH
      ]
    };
    
    return commonTokens[networkId] || [];
  }, []);

  // Get token information
  const getTokenInfo = useCallback(async (address, provider) => {
    console.log(`🔍 Getting token info for address: ${address}`);
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

      console.log(`✅ Token info for ${address}:`, { name, symbol, decimals, balance: balance.toString() });

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
      const provider = new ethers.BrowserProvider(window.ethereum);
      const tokenInfo = await getTokenInfo(tokenAddress, provider);
      if (!tokenInfo) {
        toast.error('Invalid token address or token not found');
        return;
      }

      // Add to user tokens if not already present
      const existingToken = userTokens.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());
      if (!existingToken) {
        const newToken = {
          address: tokenAddress,
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

  // Handle token selection
  const handleTokenSelect = (token, forToken) => {
    console.log('🎯 Token selected:', { token: token.symbol, forToken });
    if (forToken === 'tokenIn') {
      setTokenIn(token.symbol);
      setTokenInDropdownOpen(false);
    } else {
      setTokenOut(token.symbol);
      setTokenOutDropdownOpen(false);
    }
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

  // Get token name
  const getTokenName = (symbol) => {
    const names = {
      'ETH': 'Ethereum',
      'WETH': 'Wrapped Ethereum',
      'USDC': 'USD Coin',
      'USDT': 'Tether USD',
      'LINK': 'Chainlink',
      'ENS': 'Ethereum Name Service',
      'BOING': 'Boing Token'
    };
    return names[symbol] || symbol;
  };

  // Helper functions to get selected token balances
  const getTokenInBalance = () => {
    if (!tokenIn || tokenIn === 'ETH') {
      // For ETH, we'd need to get native balance
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

  const setTokenOutFullBalance = () => {
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

  // Check if DEX swapping is supported on current network
  const isSwapSupported = () => {
    const routerAddress = getContractAddress(chainId, 'dexRouter');
    console.log('Checking swap support - chainId:', chainId, 'routerAddress:', routerAddress);
    return routerAddress && routerAddress !== '0x0000000000000000000000000000000000000000';
  };

  // Get network status message
  const getNetworkStatusMessage = () => {
    if (!isConnected) {
      return { type: 'warning', message: 'Please connect your wallet to start swapping' };
    }
    
    if (!isSwapSupported()) {
      return { 
        type: 'error', 
        message: 'DEX swapping is not yet available on this network. Currently only supported on Sepolia testnet.' 
      };
    }
    
    return { type: 'success', message: 'Swapping is supported on this network' };
  };

  // Handle swap transaction
  const handleSwap = async () => {
    console.log('=== HANDLE SWAP START ===');
    console.log('Raw input values:', {
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

    // Check if we have a selected external quote
    if (selectedExternalQuote) {
      await handleExternalSwap();
      return;
    }

    // Check if DEX is deployed on current network
    const swapRouterAddress = getContractAddress(chainId, 'dexRouter');
    console.log('handleSwap: Starting swap with params:', {
      chainId,
      routerAddress: swapRouterAddress,
      tokenIn,
      tokenOut,
      amountIn,
      account
    });
    
    if (!swapRouterAddress || swapRouterAddress === '0x0000000000000000000000000000000000000000') {
      toast.error(`DEX swapping is not yet available on this network. Currently only supported on Sepolia testnet.`);
      return;
    }

    setIsSwapping(true);
    setSwapError('');
    setSwapSuccess('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
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
      
      console.log('handleSwap: Starting amount calculation with:', {
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
        console.log('handleSwap: Warning - Amount may be too large for 18 decimal tokens', { 
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
      console.log('handleSwap: Parsed amount:', parsedAmount);
      
      // Validate that the input amount is reasonable (not too large)
      if (parsedAmount > 1000000) {
        throw new Error(`Input amount too large: ${amountIn}. Please enter a smaller amount.`);
      }
      
      // Get the correct decimals for the input token
      let amountInWei;
      if (tokenIn === 'ETH') {
        amountInWei = ethers.parseUnits(amountIn, 18); // ETH/WETH has 18 decimals
        console.log('handleSwap: ETH amount calculation:', {
          amountIn,
          decimals: 18,
          amountInWei: amountInWei.toString()
        });
      } else {
        const tokenInData = userTokens.find(t => t.symbol === tokenIn);
        console.log('handleSwap: Token data found:', {
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
        
        console.log('handleSwap: Token amount calculation:', {
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
        console.log('handleSwap: Calculated amountInWei:', amountInWei.toString());
        
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
      console.log('handleSwap: Amount validation:', {
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
      
      console.log('handleSwap: Amount calculations:', {
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
      console.log('handleSwap: WETH address for chainId', chainId, ':', wethAddress);
      
      if (!wethAddress || wethAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('WETH not configured for this network');
      }
      
      // Get path for the swap
      const path = [];
      if (tokenIn === 'ETH') {
        path.push(wethAddress); // Use correct WETH address for the network
        console.log('handleSwap: Added WETH to path for ETH input:', wethAddress);
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
        console.log('handleSwap: Added input token to path', { symbol: tokenIn, address: tokenInData.address });
      }

      if (tokenOut === 'ETH') {
        path.push(wethAddress); // Use correct WETH address for the network
        console.log('handleSwap: Added WETH to path for ETH output:', wethAddress);
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
        console.log('handleSwap: Added output token to path', { symbol: tokenOut, address: tokenOutData.address });
      }

      console.log('handleSwap: Final swap path:', path);

      // Validate path length
      if (path.length !== 2) {
        throw new Error('Invalid swap path. Path must contain exactly 2 tokens.');
      }

      // Get expected output amount
      console.log('handleSwap: Calling getAmountsOut to calculate expected output...');
      const amountsOut = await routerContract.getAmountsOut(amountInWei, path);
      console.log('handleSwap: getAmountsOut result:', amountsOut);
      
      const expectedAmountOut = amountsOut[1];
      // eslint-disable-next-line no-undef
      const minAmountOut = expectedAmountOut * BigInt(Math.floor((1 - slippageTolerance) * 1000)) / BigInt(1000);

      console.log('handleSwap: Output calculations:', {
        expectedAmountOut: expectedAmountOut.toString(),
        minAmountOut: minAmountOut.toString(),
        slippageTolerance
      });

      // Calculate deadline
      const deadline = Math.floor(Date.now() / 1000) + (settings.deadline * 60);
      console.log('handleSwap: Transaction deadline:', deadline, 'seconds from now');

      // Prepare transaction
      let tx;
      const gasPrice = ethers.parseUnits('20', 'gwei');
      const gasLimit = 300000;
      
      console.log('handleSwap: Transaction parameters:', {
        gasPrice: gasPrice.toString(),
        gasLimit,
        deadline
      });

      if (tokenIn === 'ETH') {
        // Swap ETH for tokens
        console.log('handleSwap: Executing swapExactETHForTokens...');
        tx = await routerContract.swapExactETHForTokens(
          minAmountOut,
          path,
          account,
          deadline,
          {
            value: amountInWei,
            gasLimit: gasLimit,
            gasPrice: gasPrice
          }
        );
      } else if (tokenOut === 'ETH') {
        // Swap tokens for ETH
        console.log('handleSwap: Executing swapExactTokensForETH...');
        tx = await routerContract.swapExactTokensForETH(
          amountInWei,
          minAmountOut,
          path,
          account,
          deadline,
          {
            gasLimit: gasLimit,
            gasPrice: gasPrice
          }
        );
      } else {
        // Swap tokens for tokens
        console.log('handleSwap: Executing swapExactTokensForTokens...');
        tx = await routerContract.swapExactTokensForTokens(
          amountInWei,
          minAmountOut,
          path,
          account,
          deadline,
          {
            gasLimit: gasLimit,
            gasPrice: gasPrice
          }
        );
      }

      console.log('handleSwap: Transaction sent:', tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('handleSwap: Transaction confirmed:', receipt);
      
      setSwapSuccess(`Swap successful! Transaction hash: ${receipt.hash}`);
      toast.success('Swap completed successfully!');
      
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
        console.log('Transaction tracked successfully');
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
    console.log('=== CALCULATE EXPECTED OUTPUT START ===');
    console.log('Function called with:', { inputAmount, inputToken, outputToken });
    
    // Simple validation first
    if (!inputAmount || !inputToken || !outputToken) {
      console.log('calculateExpectedOutput: Missing required parameters');
      setAmountOut('');
      return;
    }
    
    console.log('Raw input values:', {
      inputAmount: inputAmount,
      inputAmountType: typeof inputAmount,
      inputAmountLength: inputAmount ? inputAmount.length : 0,
      inputToken,
      outputToken
    });
    
    // VALIDATION: Check input amount immediately
    if (!inputAmount || isNaN(parseFloat(inputAmount)) || parseFloat(inputAmount) <= 0) {
      console.log('calculateExpectedOutput: Invalid input amount', { inputAmount });
      setAmountOut('');
      return;
    }
    
    const inputAmountNum = parseFloat(inputAmount);
    if (inputAmountNum > 1000000) {
      console.log('calculateExpectedOutput: Input amount too large', { inputAmount, inputAmountNum });
      setAmountOut('');
      return;
    }
    
    // VALIDATION: Check for 18 decimal tokens specifically
    if (inputAmountNum > 1000) {
      console.log('calculateExpectedOutput: Input amount may be too large for 18 decimal tokens', { 
        inputAmount, 
        inputAmountNum,
        warning: 'Amount > 1000 may cause issues with 18 decimal tokens'
      });
    }
    
    if (!inputToken || !outputToken || inputToken === outputToken) {
      console.log('calculateExpectedOutput: Invalid input parameters', { inputAmount, inputToken, outputToken });
      setAmountOut('');
      return;
    }

    // Check if DEX is deployed on current network
    const calcRouterAddress = getContractAddress(chainId, 'dexRouter');
    const wethAddress = getContractAddress(chainId, 'weth');
    console.log('calculateExpectedOutput: Router address for chainId', chainId, ':', calcRouterAddress);
    console.log('calculateExpectedOutput: WETH address for chainId', chainId, ':', wethAddress);
    
    if (!calcRouterAddress || calcRouterAddress === '0x0000000000000000000000000000000000000000') {
      console.log('calculateExpectedOutput: Router not deployed on this network');
      setAmountOut('');
      return;
    }

    if (!wethAddress || wethAddress === '0x0000000000000000000000000000000000000000') {
      console.log('calculateExpectedOutput: WETH not configured for this network');
      setAmountOut('');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Router contract ABI (minimal for getAmountsOut)
      const routerABI = [
        'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
      ];

      const routerContract = new ethers.Contract(calcRouterAddress, routerABI, provider);

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
        console.log('calculateExpectedOutput: Added WETH to path for ETH input:', wethAddress);
      } else {
        // Get token address from userTokens
        const tokenInData = userTokens.find(t => t.symbol === inputToken);
        if (!tokenInData) {
          console.log('calculateExpectedOutput: Token not found in userTokens', { inputToken, userTokens: userTokens.map(t => t.symbol) });
          setAmountOut('');
          return;
        }
        if (!tokenInData.address || tokenInData.address === '0x0000000000000000000000000000000000000000') {
          console.log('calculateExpectedOutput: Invalid token address for input token', { symbol: inputToken, address: tokenInData.address });
          setAmountOut('');
          return;
        }
        
        // Validate that this is not a contract address
        if (contractAddresses.has(tokenInData.address.toLowerCase())) {
          console.log('calculateExpectedOutput: Input token address is a contract address, not a token', { 
            symbol: inputToken, 
            address: tokenInData.address,
            contractAddresses: Array.from(contractAddresses)
          });
          toast.error(`${inputToken} address is a contract, not a token. Please select a different token.`);
          setAmountOut('');
          return;
        }
        
        path.push(tokenInData.address);
        console.log('calculateExpectedOutput: Added token to path', { symbol: inputToken, address: tokenInData.address });
      }

      if (outputToken === 'ETH') {
        path.push(wethAddress); // Use correct WETH address for the network
        console.log('calculateExpectedOutput: Added WETH to path for ETH output:', wethAddress);
      } else {
        // Get token address from userTokens
        const tokenOutData = userTokens.find(t => t.symbol === outputToken);
        if (!tokenOutData) {
          console.log('calculateExpectedOutput: Output token not found in userTokens', { outputToken, userTokens: userTokens.map(t => t.symbol) });
          setAmountOut('');
          return;
        }
        if (!tokenOutData.address || tokenOutData.address === '0x0000000000000000000000000000000000000000') {
          console.log('calculateExpectedOutput: Invalid token address for output token', { symbol: outputToken, address: tokenOutData.address });
          setAmountOut('');
          return;
        }
        
        // Validate that this is not a contract address
        if (contractAddresses.has(tokenOutData.address.toLowerCase())) {
          console.log('calculateExpectedOutput: Output token address is a contract address, not a token', { 
            symbol: outputToken, 
            address: tokenOutData.address,
            contractAddresses: Array.from(contractAddresses)
          });
          toast.error(`${outputToken} address is a contract, not a token. Please select a different token.`);
          setAmountOut('');
          return;
        }
        
        path.push(tokenOutData.address);
        console.log('calculateExpectedOutput: Added output token to path', { symbol: outputToken, address: tokenOutData.address });
      }

      // Validate path length
      if (path.length !== 2) {
        console.log('calculateExpectedOutput: Invalid path length:', path.length);
        setAmountOut('');
        return;
      }

      console.log('calculateExpectedOutput: Swap path details:', {
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
        console.log('calculateExpectedOutput: Invalid token address in path', { path });
        setAmountOut('');
        return;
      }

      // Check if tokens are the same
      if (path[0] === path[1]) {
        console.log('calculateExpectedOutput: Cannot swap same token', { path });
        setAmountOut('');
        return;
      }

      console.log('calculateExpectedOutput: About to call getAmountsOut with:', {
        path: path,
        inputAmount,
        inputToken,
        outputToken
      });

      // Try a small test amount first to check if the pair exists
      const testAmount = ethers.parseUnits('0.001', 18); // 0.001 tokens
      console.log('calculateExpectedOutput: Testing with small amount:', testAmount.toString());
      console.log('calculateExpectedOutput: Testing path:', path);
      console.log('calculateExpectedOutput: Router address:', calcRouterAddress);
      
      try {
        const testAmountsOut = await routerContract.getAmountsOut(testAmount, path);
        console.log('calculateExpectedOutput: Test getAmountsOut result:', testAmountsOut);
        
        if (!testAmountsOut || testAmountsOut.length < 2 || testAmountsOut[1] === 0n) {
          console.log('calculateExpectedOutput: No liquidity found for this trading pair', {
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
        console.log('calculateExpectedOutput: Error testing trading pair:', testError);
        console.log('calculateExpectedOutput: Error details:', {
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
      
      console.log('calculateExpectedOutput: Starting amount calculation with:', {
        inputAmount,
        inputToken,
        outputToken,
        userTokens: userTokens.map(t => ({ symbol: t.symbol, decimals: t.decimals, address: t.address }))
      });
      
      // VALIDATION: Check input amount before any calculation
      const inputAmountNum = parseFloat(inputAmount);
      if (inputAmountNum > 1000000) {
        console.log('calculateExpectedOutput: Input amount too large', { inputAmount, inputAmountNum });
        setAmountOut('');
        return;
      }
      
      // Check if input amount contains scientific notation or other problematic formats
      if (inputAmount.includes('e') || inputAmount.includes('E')) {
        console.log('calculateExpectedOutput: Input amount contains scientific notation', { inputAmount });
        setAmountOut('');
        return;
      }
      
      // Check if input amount contains only valid numeric characters
      const validNumericRegex = /^[0-9.]+$/;
      if (!validNumericRegex.test(inputAmount)) {
        console.log('calculateExpectedOutput: Input amount contains invalid characters', { inputAmount });
        setAmountOut('');
        return;
      }
      
      const parsedAmount = parseFloat(inputAmount);
      console.log('calculateExpectedOutput: Parsed amount:', parsedAmount);
      
      // Validate that the input amount is reasonable (not too large)
      if (parsedAmount > 1000000) {
        console.log('calculateExpectedOutput: Input amount too large', { inputAmount, parsedAmount });
        setAmountOut('');
        return;
      }
      
      // Get the correct decimals for the input token
      if (inputToken === 'ETH') {
        amountInWei = ethers.parseUnits(inputAmount, 18); // ETH/WETH has 18 decimals
        console.log('calculateExpectedOutput: ETH amount calculation:', {
          inputAmount,
          decimals: 18,
          amountInWei: amountInWei.toString()
        });
      } else {
        const tokenInData = userTokens.find(t => t.symbol === inputToken);
        console.log('calculateExpectedOutput: Token data found:', {
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
          console.log('calculateExpectedOutput: Cannot determine decimals for input token', { inputToken });
          setAmountOut('');
          return;
        }
        
        // Validate decimals are reasonable
        if (tokenInData.decimals < 0 || tokenInData.decimals > 18) {
          console.log('calculateExpectedOutput: Invalid decimals for token', { 
            inputToken, 
            decimals: tokenInData.decimals 
          });
          setAmountOut('');
          return;
        }
        
        // Additional check for tokens with 18 decimals
        if (tokenInData.decimals === 18 && parseFloat(inputAmount) > 1000) {
          console.log('calculateExpectedOutput: Amount too large for 18 decimal token', { inputAmount, tokenSymbol: tokenInData.symbol });
          setAmountOut('');
          return;
        }
        
        amountInWei = ethers.parseUnits(inputAmount, tokenInData.decimals);
        console.log('calculateExpectedOutput: Calculated amountInWei:', amountInWei.toString());
        
        // Check if amount exceeds token balance
        if (tokenInData.balance && amountInWei > tokenInData.balance) {
          console.log('calculateExpectedOutput: Amount exceeds token balance', {
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
          console.log('calculateExpectedOutput: Amount too large for token decimals', {
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
      console.log('calculateExpectedOutput: Amount validation:', {
        amountInWei: amountInWei.toString(),
        maxReasonableAmount: maxReasonableAmount.toString(),
        isTooLarge: amountInWei > maxReasonableAmount
      });
      
      if (amountInWei > maxReasonableAmount) {
        console.log('calculateExpectedOutput: Amount too large, likely invalid', { 
          amountInWei: amountInWei.toString(),
          maxReasonableAmount: maxReasonableAmount.toString()
        });
        setAmountOut('');
        return;
      }
      
      // Additional validation: check if amount is unreasonably large (more than 1 billion wei)
      const maxWeiAmount = ethers.parseUnits('1000000000', 18); // 1 billion wei
      if (amountInWei > maxWeiAmount) {
        console.log('calculateExpectedOutput: Amount unreasonably large, preventing contract call', { 
          amountInWei: amountInWei.toString(),
          maxWeiAmount: maxWeiAmount.toString()
        });
        setAmountOut('');
        return;
      }
      
      console.log('calculateExpectedOutput: Calling getAmountsOut with:', {
        amountInWei: amountInWei.toString(),
        path: path,
        inputAmount,
        inputToken,
        outputToken
      });
      
      // Final safety check - prevent any amount larger than 1 billion wei
      const safetyLimit = ethers.parseUnits('1000000000', 18);
      if (amountInWei > safetyLimit) {
        console.log('calculateExpectedOutput: FINAL SAFETY CHECK FAILED - Amount too large, preventing contract call', {
          amountInWei: amountInWei.toString(),
          safetyLimit: safetyLimit.toString()
        });
        setAmountOut('');
        return;
      }
      
      const amountsOut = await routerContract.getAmountsOut(amountInWei, path);
      console.log('calculateExpectedOutput: getAmountsOut result:', amountsOut);
      
      // Check if the result is valid
      if (!amountsOut || amountsOut.length < 2) {
        console.log('calculateExpectedOutput: Invalid result from getAmountsOut', { amountsOut });
        setAmountOut('');
        return;
      }
      
      // Check if the output amount is 0 or very small
      if (amountsOut[1] === 0n || amountsOut[1] < 1000n) {
        console.log('calculateExpectedOutput: Output amount is too small or zero', { 
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
          console.log('calculateExpectedOutput: Cannot determine decimals for output token', { outputToken });
          setAmountOut('');
          return;
        }
        expectedAmountOut = ethers.formatUnits(amountsOut[1], tokenOutData.decimals);
      }
      
      console.log('calculateExpectedOutput: Expected output amount:', expectedAmountOut);
      
      // Final validation - check if the output amount is reasonable
      const outputAmountNum = parseFloat(expectedAmountOut);
      if (outputAmountNum <= 0 || isNaN(outputAmountNum)) {
        console.log('calculateExpectedOutput: Invalid output amount calculated', { expectedAmountOut, outputAmountNum });
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
  }, [chainId, userTokens]);

  // Fetch user's tokens
  const fetchUserTokens = useCallback(async () => {
    if (!account) {
      console.log('No account available, skipping token fetch');
      return;
    }
    
    console.log('Starting token fetch for account:', account);
    setIsLoadingTokens(true);
    try {
      // Use the same provider initialization as CreatePool
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Get all tokens from user's wallet by scanning transfer events
      const allTokens = await getAllUserTokens(provider, account);
      console.log('User wallet tokens found:', allTokens.length, allTokens);
      
      // Also check common tokens for better coverage
      const commonTokens = getCommonTokens(chainId);
      console.log('Common tokens found:', commonTokens.length, commonTokens);
      
      const allTokenAddresses = [...new Set([...allTokens, ...commonTokens])];
      console.log('Total unique token addresses:', allTokenAddresses.length);
      
      // Debug: Log each address being processed
      console.log('Processing token addresses:', allTokenAddresses);
      
      const tokensWithBalance = [];
      
      // Get contract addresses to exclude
      const contracts = getContractAddresses(chainId);
      const contractAddresses = new Set();
      if (contracts) {
        // Add all contract addresses to exclude list
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
      
      console.log('Contract addresses to exclude:', Array.from(contractAddresses));
      
      for (const tokenAddress of allTokenAddresses) {
        // Skip if this is a known contract address
        if (contractAddresses.has(tokenAddress.toLowerCase())) {
          console.log(`🚫 Skipping contract address: ${tokenAddress}`);
          continue;
        }
        
        try {
          const tokenInfo = await getTokenInfo(tokenAddress, provider);
          console.log(`Token ${tokenAddress}:`, {
            hasInfo: !!tokenInfo,
            symbol: tokenInfo?.symbol,
            name: tokenInfo?.name,
            balance: tokenInfo?.balance,
            hasBalance: tokenInfo?.balance && tokenInfo.balance !== '0',
            decimals: tokenInfo?.decimals
          });
          
          if (tokenInfo && tokenInfo.balance && tokenInfo.balance !== '0' && 
              tokenInfo.symbol && tokenInfo.name && tokenInfo.decimals) {
            tokensWithBalance.push({
              address: tokenAddress,
              ...tokenInfo,
              formattedBalance: ethers.formatUnits(tokenInfo.balance, tokenInfo.decimals)
            });
            console.log(`✅ Added token: ${tokenInfo.symbol} (${tokenAddress})`);
          } else {
            console.log(`❌ Skipped token: ${tokenAddress} - Missing data or zero balance`);
          }
        } catch (error) {
          console.warn(`Failed to load token ${tokenAddress}:`, error.message);
          // Skip tokens that fail to load
        }
      }
      
      // Sort by balance (highest first)
      tokensWithBalance.sort((a, b) => parseFloat(b.formattedBalance) - parseFloat(a.formattedBalance));
      
      console.log('Final tokens to display:', tokensWithBalance.length, tokensWithBalance.map(t => `${t.symbol} (${t.address})`));
      setUserTokens(tokensWithBalance);
    } catch (error) {
      console.error('Error fetching user tokens:', error);
      toast.error('Failed to load your tokens');
    } finally {
      setIsLoadingTokens(false);
    }
  }, [account, chainId, getAllUserTokens, getTokenInfo, getCommonTokens]);

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
    
    console.log('getConfiguredPairs: Configured pairs:', configuredPairs);
    return configuredPairs;
  }, [chainId]);

  // Check available trading pairs
  const checkAvailablePairs = useCallback(async () => {
    if (!chainId) return [];
    
    const routerAddress = getContractAddress(chainId, 'dexRouter');
    if (!routerAddress || routerAddress === '0x0000000000000000000000000000000000000000') {
      console.log('checkAvailablePairs: Router not deployed on this network');
      return [];
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const routerABI = [
        'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
      ];
      const routerContract = new ethers.Contract(routerAddress, routerABI, provider);

      const availablePairs = [];
      const testAmount = ethers.parseUnits('0.001', 18);

      // Test common token pairs
      const commonTokens = userTokens.slice(0, 5); // Test first 5 tokens
      
      for (let i = 0; i < commonTokens.length; i++) {
        for (let j = i + 1; j < commonTokens.length; j++) {
          const tokenA = commonTokens[i];
          const tokenB = commonTokens[j];
          
          try {
            const path = [tokenA.address, tokenB.address];
            const amountsOut = await routerContract.getAmountsOut(testAmount, path);
            
            if (amountsOut && amountsOut.length >= 2 && amountsOut[1] > 0n) {
              availablePairs.push({
                tokenA: tokenA.symbol,
                tokenB: tokenB.symbol,
                addressA: tokenA.address,
                addressB: tokenB.address
              });
              console.log(`✅ Available pair: ${tokenA.symbol}/${tokenB.symbol}`);
            }
          } catch (error) {
            console.log(`❌ No pair: ${tokenA.symbol}/${tokenB.symbol}`);
          }
        }
      }
      
      console.log('checkAvailablePairs: Available trading pairs:', availablePairs);
      
      // Show available pairs to user if they're trying to swap unavailable tokens
      if (availablePairs.length > 0) {
        const availablePairStrings = availablePairs.map(p => `${p.tokenA}/${p.tokenB}`).join(', ');
        console.log('Available trading pairs:', availablePairStrings);
      }
      
      return availablePairs;
    } catch (error) {
      console.error('checkAvailablePairs: Error checking pairs:', error);
      return [];
    }
  }, [chainId, userTokens]);

  // Initialize external DEX service
  useEffect(() => {
    if (isConnected && chainId) {
      const initializeExternalDEX = async () => {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          await externalSwapService.initialize(provider);
          setIsExternalDEXAvailable(externalSwapService.isExternalDEXsAvailable(chainId));
        } catch (error) {
          console.error('Failed to initialize external DEX service:', error);
        }
      };
      
      initializeExternalDEX();
    }
  }, [isConnected, chainId]);

  // Fetch tokens on mount and when account changes
  useEffect(() => {
    console.log('useEffect triggered - isConnected:', isConnected, 'account:', account, 'chainId:', chainId);
    if (isConnected && account) {
      fetchUserTokens();
    }
  }, [isConnected, account, chainId, fetchUserTokens]);

  // Check available trading pairs when tokens are loaded
  useEffect(() => {
    if (userTokens.length > 0 && chainId) {
      console.log('Checking available trading pairs...');
      checkAvailablePairs();
    }
  }, [userTokens, chainId, checkAvailablePairs]);

  // Calculate expected output when input changes
  useEffect(() => {
    console.log('🔄 useEffect triggered for calculation:', {
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
      console.log('✅ Starting calculation with:', { amountIn, tokenIn, tokenOut });
      const timeoutId = setTimeout(() => {
        console.log('⏰ Debounced calculation starting...');
        calculateExpectedOutput(amountIn, tokenIn, tokenOut);
        
        // Also fetch external DEX quotes if available
        if (isExternalDEXAvailable && amountIn && tokenIn && tokenOut) {
          fetchExternalQuotes();
        }
      }, 500); // Debounce for 500ms
      
      return () => {
        console.log('🧹 Clearing timeout');
        clearTimeout(timeoutId);
      };
    } else {
      console.log('❌ Clearing amountOut due to invalid parameters');
      setAmountOut('');
      setExternalQuotes([]);
      setSelectedExternalQuote(null);
    }
  }, [amountIn, tokenIn, tokenOut, calculateExpectedOutput, isExternalDEXAvailable]);

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
        console.log('No external DEX quotes available - this is normal on Sepolia testnet');
        console.log('Your DEX will be used for swaps');
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
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

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
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
      </Helmet>
      <div className="relative min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* Settings Button */}
        <button
          className="absolute top-6 right-6 z-30 p-2 rounded-full shadow-lg"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--bg-card)'}
          onClick={() => setSettingsOpen(true)}
          aria-label="Open settings"
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zm7.94-2.06a1 1 0 0 0 .26-1.09l-1.43-2.49a1 1 0 0 1 0-.9l1.43-2.49a1 1 0 0 0-.26-1.09l-2.12-2.12a1 1 0 0 0-1.09-.26l-2.49 1.43a1 1 0 0 1 .9 0l-2.49-1.43a1 1 0 0 0-1.09.26l-2.12 2.12a1 1 0 0 0-.26 1.09l1.43 2.49a1 1 0 0 1 0 .9l-1.43 2.49a1 1 0 0 0 .26 1.09l2.12 2.12a1 1 0 0 0 1.09.26l2.49-1.43a1 1 0 0 1 .9 0l2.49 1.43a1 1 0 0 0 1.09-.26l2.12-2.12z" />
          </svg>
        </button>

        {/* Gas Priority Indicator */}
        <div className="absolute top-6 right-20 z-30 px-3 py-2 rounded-lg shadow-lg" style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)'
        }}>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              settings.gasPriority === 'high' ? 'bg-red-400' : 
              settings.gasPriority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
            }`}></div>
            <span className="text-white text-xs font-medium">
              {getGasPriorityLabel()}
            </span>
          </div>
        </div>
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onSave={handleSaveSettings}
          initialSettings={settings}
        />
        
        {/* Main Content Container */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-theme-primary mb-2 sm:mb-4">
              Swap Tokens
            </h1>
            <p className="text-lg sm:text-xl text-theme-secondary max-w-2xl mx-auto">
              Trade tokens instantly with the best rates across multiple networks
            </p>
          </div>

          {/* Swap Interface */}
          <div className="rounded-xl p-4 sm:p-6 shadow-lg mb-4 sm:mb-6" style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)'
          }}>
            {/* Network Status Indicator */}
            <div className="mb-4 p-3 rounded-lg border">
              {(() => {
                const status = getNetworkStatusMessage();
                const statusColors = {
                  success: 'bg-green-900/20 border-green-500/30 text-green-400',
                  warning: 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400',
                  error: 'bg-red-900/20 border-red-500/30 text-red-400'
                };
                
                return (
                  <div className={`${statusColors[status.type]} rounded-lg p-3 text-sm text-center`}>
                    <div className="flex items-center justify-center space-x-2">
                      {status.type === 'success' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {status.type === 'warning' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      )}
                      {status.type === 'error' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <span>{status.message}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Swap Tokens</h2>

            {/* Token Selection */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="relative flex items-center space-x-2 w-full sm:w-auto token-dropdown-container">
                <button
                  onClick={() => setTokenInDropdownOpen(!tokenInDropdownOpen)}
                  className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center sm:justify-start"
                >
                  <span className="text-xl sm:text-2xl">{getTokenLogo(tokenIn)}</span>
                  <span className="text-white font-medium text-sm sm:text-base">{getTokenName(tokenIn)}</span>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Token In Dropdown */}
                {tokenInDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-80 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto" style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div className="p-3 border-b border-gray-700">
                      <h3 className="text-white font-medium mb-2">Select Token</h3>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search tokens..."
                          className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                          onChange={(e) => {
                            // Add search functionality if needed
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="p-2">
                      {/* My Tokens Section */}
                      <div className="mb-3">
                        <h4 className="text-gray-400 text-xs font-medium mb-2 px-2">My Tokens</h4>
                        {isLoadingTokens ? (
                          <div className="text-gray-400 text-sm px-2 py-1">Loading...</div>
                        ) : userTokens.length > 0 ? (
                          userTokens.map((token) => {
                            // Add defensive checks for token data
                            if (!token || !token.symbol || !token.name || !token.formattedBalance) {
                              return null; // Skip invalid tokens
                            }
                            
                            return (
                              <button
                                key={token.address}
                                onClick={() => handleTokenSelect(token, 'tokenIn')}
                                className="w-full flex items-center justify-between p-2 hover:bg-gray-700 rounded-lg transition-colors"
                              >
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">{getTokenLogo(token.symbol)}</span>
                                  <div>
                                    <div className="text-white text-sm font-medium">{token.symbol}</div>
                                    <div className="text-gray-400 text-xs">{token.name}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-white text-sm">
                                    {token.formattedBalance || '0'}
                                  </div>
                                </div>
                              </button>
                            );
                          }).filter(Boolean) // Remove null entries
                        ) : (
                          <div className="text-gray-400 text-sm px-2 py-1">No tokens found</div>
                        )}
                      </div>

                      {/* Add Custom Token */}
                      <button
                        onClick={() => addCustomToken('')}
                        className="w-full flex items-center justify-center p-2 text-blue-400 hover:bg-gray-700 rounded-lg transition-colors text-sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Custom Token
                      </button>
                    </div>
                  </div>
                )}
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
              
              <div className="relative flex items-center space-x-2 w-full sm:w-auto token-dropdown-container">
                <button
                  onClick={() => setTokenOutDropdownOpen(!tokenOutDropdownOpen)}
                  className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center sm:justify-start"
                >
                  <span className="text-xl sm:text-2xl">{getTokenLogo(tokenOut)}</span>
                  <span className="text-white font-medium text-sm sm:text-base">{getTokenName(tokenOut)}</span>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Token Out Dropdown */}
                {tokenOutDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-80 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto" style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div className="p-3 border-b border-gray-700">
                      <h3 className="text-white font-medium mb-2">Select Token</h3>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search tokens..."
                          className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                          onChange={(e) => {
                            // Add search functionality if needed
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="p-2">
                      {/* My Tokens Section */}
                      <div className="mb-3">
                        <h4 className="text-gray-400 text-xs font-medium mb-2 px-2">My Tokens</h4>
                        {isLoadingTokens ? (
                          <div className="text-gray-400 text-sm px-2 py-1">Loading...</div>
                        ) : userTokens.length > 0 ? (
                          userTokens.map((token) => {
                            // Add defensive checks for token data
                            if (!token || !token.symbol || !token.name || !token.formattedBalance) {
                              return null; // Skip invalid tokens
                            }
                            
                            return (
                              <button
                                key={token.address}
                                onClick={() => handleTokenSelect(token, 'tokenOut')}
                                className="w-full flex items-center justify-between p-2 hover:bg-gray-700 rounded-lg transition-colors"
                              >
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">{getTokenLogo(token.symbol)}</span>
                                  <div>
                                    <div className="text-white text-sm font-medium">{token.symbol}</div>
                                    <div className="text-gray-400 text-xs">{token.name}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-white text-sm">
                                    {token.formattedBalance || '0'}
                                  </div>
                                </div>
                              </button>
                            );
                          }).filter(Boolean) // Remove null entries
                        ) : (
                          <div className="text-gray-400 text-sm px-2 py-1">No tokens found</div>
                        )}
                      </div>

                      {/* Add Custom Token */}
                      <button
                        onClick={() => addCustomToken('')}
                        className="w-full flex items-center justify-center p-2 text-blue-400 hover:bg-gray-700 rounded-lg transition-colors text-sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Custom Token
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Available Trading Pairs Info */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-blue-400 text-sm font-medium">Available Trading Pairs</span>
              </div>
              <div className="text-gray-300 text-xs">
                {(() => {
                  const configuredPairs = getConfiguredPairs();
                  if (configuredPairs.length > 0) {
                    const pairStrings = configuredPairs.map(p => `${p.tokenA}/${p.tokenB}`).join(', ');
                    return `Configured pairs: ${pairStrings}. Try swapping these tokens for best results.`;
                  } else {
                    return 'No pre-configured pairs available. You may need to create liquidity pools first.';
                  }
                })()}
              </div>
            </div>

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
                  <input
                    type="number"
                    value={amountIn}
                    onChange={(e) => {
                      console.log('📝 Input changed:', e.target.value);
                      setAmountIn(e.target.value);
                    }}
                    placeholder="0.0"
                    className="flex-1 bg-transparent text-xl sm:text-2xl font-bold text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="text-xl sm:text-2xl">{getTokenLogo(tokenIn)}</span>
                    <span className="text-white font-medium text-sm sm:text-base">{tokenIn}</span>
                  </div>
                </div>
              </div>

              {/* Swap Direction Indicator */}
              <div className="flex justify-center">
                <div className="bg-gray-700 rounded-full p-2">
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
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
                  <input
                    type="number"
                    value={amountOut}
                    readOnly
                    placeholder="0.0"
                    className="flex-1 bg-transparent text-xl sm:text-2xl font-bold text-white placeholder-gray-500 focus:outline-none cursor-not-allowed"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="text-xl sm:text-2xl">{getTokenLogo(tokenOut)}</span>
                    <span className="text-white font-medium text-sm sm:text-base">{tokenOut}</span>
                  </div>
                </div>
                {amountOut && parseFloat(amountOut) > 0 && (
                  <div className="mt-2 text-xs text-gray-400">
                    Rate: 1 {tokenIn} = {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} {tokenOut}
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

              {/* Gas Fee Estimation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm">Estimated Gas Fee</span>
                  <InfoTooltip content={`Estimated gas fee for this transaction. Current priority: ${getGasPriorityLabel()} (${getGasFeeMultiplier()}x multiplier)`} />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-white text-sm sm:text-base">
                    ~{getGasFeeMultiplier() * 0.005} ETH
                  </span>
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
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
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
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Swap;