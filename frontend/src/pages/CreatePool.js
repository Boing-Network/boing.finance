import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useWallet } from '../contexts/WalletContext';
import { useChainType } from '../contexts/SolanaWalletContext';
import { CreatePoolSolanaContent } from '../components/SolanaFeaturePlaceholder';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import DEXFactoryABI from '../artifacts/DEXFactory.json';
import { getContractAddress, CONTRACTS } from '../config/contracts';
import { getNetworkByChainId } from '../config/networks';
import { DexFeatureBanner } from '../components/NetworkSupportBanner';
import { useAchievements } from '../contexts/AchievementContext';
import ShareCardModal from '../components/ShareCardModal';




// Toggle Button Component
function ToggleButton({ enabled, onToggle, disabled, size = "md" }) {
  const sizeClasses = {
    sm: "w-11 h-6",
    md: "w-14 h-7",
    lg: "w-16 h-8"
  };
  
  const dotSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6"
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`
        ${sizeClasses[size]} relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
        ${enabled 
          ? 'bg-blue-600 hover:bg-blue-700' 
          : 'bg-gray-600 hover:bg-gray-500'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          ${dotSizeClasses[size]} inline-block transform transition-transform duration-200 ease-in-out bg-white rounded-full shadow-lg
          ${enabled ? 'translate-x-7' : 'translate-x-1'}
        `}
      />
    </button>
  );
}



function CreatePool() {
  const { isSolana } = useChainType();
  const { isConnected, account, connectWallet } = useWalletConnection();
  const { chainId, switchNetwork } = useWallet();
  const { record: recordAchievement } = useAchievements() || {};
  
  // Add CSS for range slider
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .slider::-webkit-slider-thumb {
        appearance: none;
        height: 20px;
        width: 20px;
        border-radius: 50%;
        background: var(--accent-cyan);
        cursor: pointer;
        border: 2px solid var(--border-hover);
        box-shadow: 0 2px 4px var(--shadow);
      }
      
      .slider::-moz-range-thumb {
        height: 20px;
        width: 20px;
        border-radius: 50%;
        background: var(--accent-cyan);
        cursor: pointer;
        border: 2px solid var(--border-hover);
        box-shadow: 0 2px 4px var(--shadow);
      }
      
      .slider:focus {
        outline: none;
      }
      
      .slider:focus::-webkit-slider-thumb {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
      }
      
      .slider:focus::-moz-range-thumb {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Basic pool state
  const [token0, setToken0] = useState('');
  const [token1, setToken1] = useState('');
  const [token0Amount, setToken0Amount] = useState('');
  const [token1Amount, setToken1Amount] = useState('');
  const [token0Decimals, setToken0Decimals] = useState(18);
  const [token1Decimals, setToken1Decimals] = useState(18);
  const [isCreating, setIsCreating] = useState(false);
  const [token0Info, setToken0Info] = useState(null);
  const [token1Info, setToken1Info] = useState(null);

  // Transaction status state
  const [transactionHash, setTransactionHash] = useState('');
  const [transactionStatus, setTransactionStatus] = useState(''); // 'pending', 'success', 'error'
  const [transactionError, setTransactionError] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState(null);


  
  // Pool configuration state
  const [selectedFee, setSelectedFee] = useState('0.3');
  const [lockDuration, setLockDuration] = useState(7 * 24 * 60 * 60); // 7 days default
  const [lockDescription, setLockDescription] = useState('');
  const [enableLiquidityLock, setEnableLiquidityLock] = useState(false);

  
  // Token selector state
  const [userTokens, setUserTokens] = useState([]);
  const [_isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [token0DropdownOpen, setToken0DropdownOpen] = useState(false);
  const [token1DropdownOpen, setToken1DropdownOpen] = useState(false);
  const [customTokenAddress, setCustomTokenAddress] = useState('');
  const [showCustomTokenInput, setShowCustomTokenInput] = useState(false);
  const [customTokenInputFor, setCustomTokenInputFor] = useState(''); // 'token0' or 'token1'
  const [isAddingCustomToken, setIsAddingCustomToken] = useState(false);
  
  // Approval state
  const [token0Allowance, setToken0Allowance] = useState(0n);
  const [token1Allowance, setToken1Allowance] = useState(0n);
  const [isCheckingAllowances, setIsCheckingAllowances] = useState(false);

  const feeOptions = [
    { 
      value: '0.01', 
      label: '0.01% - Very Low',
      platformFee: '0.0005%' 
    },
    { 
      value: '0.05', 
      label: '0.05% - Low',
      platformFee: '0.0025%' 
    },
    { 
      value: '0.3', 
      label: '0.3% - Standard',
      platformFee: '0.015%' 
    },
    { 
      value: '1.0', 
      label: '1.0% - High',
      platformFee: '0.05%' 
    }
  ];

  // Custom dropdown state for fee selection
  const [feeDropdownOpen, setFeeDropdownOpen] = useState(false);

  // Custom dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.relative')) {
        setIsDropdownOpen(false);
      }
      if (token0DropdownOpen && !event.target.closest('.relative')) {
        setToken0DropdownOpen(false);
      }
      if (token1DropdownOpen && !event.target.closest('.relative')) {
        setToken1DropdownOpen(false);
      }
      if (feeDropdownOpen && !event.target.closest('.relative')) {
        setFeeDropdownOpen(false);
      }
      if (showCustomTokenInput && !event.target.closest('.custom-token-input')) {
        setShowCustomTokenInput(false);
        setCustomTokenInputFor('');
        setCustomTokenAddress('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, token0DropdownOpen, token1DropdownOpen, feeDropdownOpen, showCustomTokenInput]);

  // Check token allowances when tokens change
  useEffect(() => {
    if (token0 && token1 && account) {
      checkTokenAllowances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- checkTokenAllowances stable, deps are token/account
  }, [token0, token1, account]);

  // Check token allowances when amounts change (to update approval status)
  useEffect(() => {
    if (token0 && token1 && account && token0Amount && token1Amount) {
      // Debounce the allowance check to avoid too many calls
      const timeoutId = setTimeout(() => {
        checkTokenAllowances();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- checkTokenAllowances stable
  }, [token0Amount, token1Amount]);

  // Get DEXFactory contract instance
  const getDEXFactoryContract = async () => {
    if (!window.ethereum || !chainId) return null;
    // Check if we're on Sepolia (for testing)
    if (chainId !== 11155111) {
      toast.error('Please switch to Sepolia testnet to test pool creation');
      return null;
    }
    const factoryAddress = getContractAddress(chainId, 'dexFactory');
    if (!factoryAddress) {
      toast.error('DEXFactory not deployed on this network');
      return null;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(factoryAddress, DEXFactoryABI.abi, signer);
  };

  // Check token allowances for the factory
  const checkTokenAllowances = async () => {
    if (!token0 || !token1 || !account) return;
    
    setIsCheckingAllowances(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const factoryAddress = getContractAddress(chainId, 'dexFactory');
      
      // Get token contracts
      const token0Contract = new ethers.Contract(token0, [
        'function allowance(address owner, address spender) external view returns (uint256)'
      ], provider);
      
      const token1Contract = new ethers.Contract(token1, [
        'function allowance(address owner, address spender) external view returns (uint256)'
      ], provider);
      
      // Check allowances
      const [allowance0, allowance1] = await Promise.all([
        token0Contract.allowance(account, factoryAddress),
        token1Contract.allowance(account, factoryAddress)
      ]);
      
      setToken0Allowance(allowance0);
      setToken1Allowance(allowance1);
      
      console.log('Token allowances:', {
        token0: allowance0.toString(),
        token1: allowance1.toString()
      });
    } catch (error) {
      console.error('Error checking token allowances:', error);
    } finally {
      setIsCheckingAllowances(false);
    }
  };

  // Calculate required amounts and check if approval is needed
  const getRequiredAmounts = () => {
    if (!token0Amount || !token1Amount || !token0 || !token1) return { amount0: 0n, amount1: 0n };
    
    try {
      const amount0 = ethers.parseUnits(token0Amount, token0Decimals);
      const amount1 = ethers.parseUnits(token1Amount, token1Decimals);
      return { amount0, amount1 };
    } catch (error) {
      console.error('Error parsing amounts:', error);
      return { amount0: 0n, amount1: 0n };
    }
  };

  const needsApproval = () => {
    const { amount0, amount1 } = getRequiredAmounts();
    return {
      token0: amount0 > token0Allowance,
      token1: amount1 > token1Allowance
    };
  };

  // Mock function to get token info
  const getTokenInfo = async (address) => {
    try {
      if (!window.ethereum) return null;
      
      const provider = new ethers.BrowserProvider(window.ethereum);
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
      
      return { name, symbol, decimals, balance: balance.toString() };
    } catch (error) {
      console.error('Error getting token info:', error);
      return null;
    }
  };

  // Fetch user's tokens
  const fetchUserTokens = async () => {
    if (!isConnected || !account) return;
    
    setIsLoadingTokens(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Get all tokens from user's wallet by scanning transfer events
      const allTokens = await getAllUserTokens(provider, account);
      
      // Also check common tokens for better coverage
      const commonTokens = getCommonTokens(chainId);
      const allTokenAddresses = [...new Set([...allTokens, ...commonTokens])];
      
      const tokensWithBalance = [];
      
      for (const tokenAddress of allTokenAddresses) {
        try {
          const tokenInfo = await getTokenInfo(tokenAddress);
          if (tokenInfo && tokenInfo.balance && tokenInfo.balance !== '0') {
            tokensWithBalance.push({
              address: tokenAddress,
              ...tokenInfo,
              formattedBalance: ethers.formatUnits(tokenInfo.balance, tokenInfo.decimals)
            });
          }
        } catch (error) {
          // Skip tokens that fail to load
        }
      }
      
      // Sort by balance (highest first)
      tokensWithBalance.sort((a, b) => parseFloat(b.formattedBalance) - parseFloat(a.formattedBalance));
      
      setUserTokens(tokensWithBalance);
    } catch (error) {
      console.error('Error fetching user tokens:', error);
      toast.error('Failed to load your tokens');
    } finally {
      setIsLoadingTokens(false);
    }
  };

  // Scan for all tokens in user's wallet by checking transfer events
  const getAllUserTokens = async (provider, userAddress) => {
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
          logs = [...logs, ...earlyLogs];
        } catch (error) {
          // Failed to scan earlier blocks
        }
      }
      
      // Extract unique token addresses
      const tokenAddresses = [...new Set(logs.map(log => log.address))];
      
      // Also check for tokens where user has current balance (in case they were received before our scan range)
      const additionalTokens = await getTokensWithBalance(provider, userAddress);
      const allTokens = [...new Set([...tokenAddresses, ...additionalTokens])];
      
      return allTokens;
    } catch (error) {
      console.error('Error scanning for tokens:', error);
      // Fallback to common tokens only
      return getCommonTokens(chainId);
    }
  };

  // Get tokens by checking balance directly (for tokens that might be older than our scan range)
  const getTokensWithBalance = async (provider, userAddress) => {
    try {
      // Get a list of known token addresses for the network
      const knownTokens = getCommonTokens(chainId);
      const tokensWithBalance = [];
      
      // Check balance for each known token
      for (const tokenAddress of knownTokens) {
        try {
          const tokenContract = new ethers.Contract(tokenAddress, [
            'function balanceOf(address) view returns (uint256)',
            'function symbol() view returns (string)',
            'function name() view returns (string)',
            'function decimals() view returns (uint8)'
          ], provider);
          
          const balance = await tokenContract.balanceOf(userAddress);
          if (balance && balance !== '0') {
            tokensWithBalance.push(tokenAddress);
          }
        } catch (error) {
          // Skip tokens that fail
        }
      }
      
      return tokensWithBalance;
    } catch (error) {
      console.error('Error checking token balances:', error);
      return [];
    }
  };

  // Add custom token
  const addCustomToken = async (tokenAddress) => {
    if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
      toast.error('Please enter a valid token address');
      return;
    }
    
    setIsAddingCustomToken(true);
    
    try {
      const tokenInfo = await getTokenInfo(tokenAddress);
      if (!tokenInfo) {
        toast.error('Could not load token information');
        return;
      }
      
      // Check if token already exists in the list
      const existingToken = userTokens.find(token => token.address.toLowerCase() === tokenAddress.toLowerCase());
      if (existingToken) {
        toast.error('Token already in your list');
        return;
      }
      
      // Add to user tokens list
      const newToken = {
        address: tokenAddress,
        ...tokenInfo,
        formattedBalance: ethers.formatUnits(tokenInfo.balance, tokenInfo.decimals)
      };
      
      setUserTokens(prev => [newToken, ...prev]);
      toast.success(`Added ${tokenInfo.symbol} to your token list`);
      
      // Set the token as selected for the appropriate dropdown
      if (customTokenInputFor === 'token0') {
        setToken0(tokenAddress);
        setToken0Decimals(tokenInfo.decimals);
        setToken0DropdownOpen(false);
      } else if (customTokenInputFor === 'token1') {
        setToken1(tokenAddress);
        setToken1Decimals(tokenInfo.decimals);
        setToken1DropdownOpen(false);
      }
      
      // Reset custom token input
      setShowCustomTokenInput(false);
      setCustomTokenInputFor('');
      setCustomTokenAddress('');
      
    } catch (error) {
      console.error('Error adding custom token:', error);
      toast.error('Failed to add custom token');
    } finally {
      setIsAddingCustomToken(false);
    }
  };

  const handleAddCustomToken = (forToken) => {
    setCustomTokenInputFor(forToken);
    setShowCustomTokenInput(true);
    setCustomTokenAddress('');
  };

  const handleCustomTokenSubmit = (e) => {
    e.preventDefault();
    addCustomToken(customTokenAddress);
  };

  // Get common tokens for the current network
  const getCommonTokens = (networkId) => {
    const tokens = CONTRACTS[networkId]?.tokens;
    if (!tokens) return [];
    
    return Object.values(tokens).filter(address => address !== '0x0000000000000000000000000000000000000000');
  };

  useEffect(() => {
    if (token0) {
      getTokenInfo(token0).then(setToken0Info);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getTokenInfo from service
  }, [token0]);

  useEffect(() => {
    if (token1) {
      getTokenInfo(token1).then(setToken1Info);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getTokenInfo from service
  }, [token1]);

  // Fetch user tokens when wallet connects
  useEffect(() => {
    if (isConnected && account) {
      fetchUserTokens();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchUserTokens intentionally not in deps
  }, [isConnected, account, chainId]);

  const handleCreatePool = async () => {
    if (!isConnected || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!token0 || !token1) {
      toast.error('Please select both tokens');
      return;
    }

    if (!token0Amount || !token1Amount) {
      toast.error('Please enter amounts for both tokens');
      return;
    }

    if (token0 === token1) {
      toast.error('Cannot create pool with same token');
      return;
    }

    // Validate liquidity lock parameters
    if (enableLiquidityLock && lockDuration <= 0) {
      toast.error('Lock duration must be greater than 0 when liquidity locking is enabled');
      return;
    }

    // Early validation of amounts
    try {
      const token0Decimals = token0Info ? token0Info.decimals : 18;
      const token1Decimals = token1Info ? token1Info.decimals : 18;
      
      // Convert amounts to check if they're reasonable
      const token0AmountWei = ethers.parseUnits(token0Amount, token0Decimals);
      const token1AmountWei = ethers.parseUnits(token1Amount, token1Decimals);
      
      // Check for reasonable amounts (max 1 billion tokens)
      const maxReasonableAmount = ethers.parseUnits("1000000000", 18); // 1 billion with 18 decimals
      
      if (token0AmountWei > maxReasonableAmount || token1AmountWei > maxReasonableAmount) {
        toast.error('Token amounts are too large. Please use smaller amounts (max 1 billion tokens). For stablecoins like USDC/USDT, try amounts like 1000 or 10000.');
        return;
      }
      
      if (token0AmountWei === 0n || token1AmountWei === 0n) {
        toast.error('Token amounts must be greater than 0');
        return;
      }

      console.log('Amount validation passed:', {
        token0: { amount: token0Amount, decimals: token0Decimals, wei: token0AmountWei.toString() },
        token1: { amount: token1Amount, decimals: token1Decimals, wei: token1AmountWei.toString() }
      });
    } catch (error) {
      console.error('Amount validation error:', error);
      toast.error('Invalid token amounts. Please check the amounts and try again.');
      return;
    }

    // Reset transaction status for new transaction
    setTransactionHash('');
    setTransactionStatus('');
    setTransactionError('');

    setIsCreating(true);
    setTransactionStatus('pending');

    try {
      // Get provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Get DEXFactory contract
      const dexFactory = await getDEXFactoryContract();
      if (!dexFactory) {
        return;
      }

      // Get token decimals and convert amounts correctly
      const token0Decimals = token0Info ? token0Info.decimals : 18;
      const token1Decimals = token1Info ? token1Info.decimals : 18;
      
      // Convert amounts using correct decimals
      const token0AmountWei = ethers.parseUnits(token0Amount, token0Decimals);
      const token1AmountWei = ethers.parseUnits(token1Amount, token1Decimals);
      
      // Variables for permit signatures
      let usePermitSignatures = false;
      let permitData = null;
      
      // Validate amounts
      if (token0AmountWei === 0n || token1AmountWei === 0n) {
        throw new Error('Token amounts must be greater than 0');
      }
      
      // Check for reasonable amounts to prevent overflow
      const maxAmount = 2n ** 112n - 1n; // Max uint112 (reserve limit)
      if (token0AmountWei > maxAmount || token1AmountWei > maxAmount) {
        throw new Error('Token amounts are too large. Please use smaller amounts.');
      }
      
      // Log amounts for debugging
      console.log('Token amounts:', {
        token0: {
          symbol: getToken0Symbol(),
          decimals: token0Decimals,
          amount: token0Amount,
          amountWei: token0AmountWei.toString()
        },
        token1: {
          symbol: getToken1Symbol(),
          decimals: token1Decimals,
          amount: token1Amount,
          amountWei: token1AmountWei.toString()
        }
      });

      // Check if approval is needed - try permit signatures first, fallback to regular approvals
      const approvalNeeded = needsApproval();
      
      if (approvalNeeded.token0 || approvalNeeded.token1) {
        console.log('Approval needed - attempting permit signatures for gasless approval');
        
        // Try to use permit signatures for gasless approvals
        let usePermitSignatures = false;
        let permitData = null;
        
        try {
          console.log('Generating permit signatures for gasless approval...');
          permitData = await generatePermitSignatures(token0, token1, token0AmountWei, token1AmountWei, signer, account);
          
          // Check if we have valid permit signatures
          if (permitData.deadlineA > 0 || permitData.deadlineB > 0) {
            usePermitSignatures = true;
            console.log('Permit signatures generated successfully - will use gasless approval');
            toast('Using gasless approval with permit signatures!', {
              duration: 3000,
              icon: '⚡'
            });
          } else {
            console.log('Permit signatures not available - falling back to regular approvals');
          }
        } catch (error) {
          console.log('Permit signature generation failed - falling back to regular approvals:', error);
        }
        
        // If permit signatures failed or are not available, use regular approvals
        if (!usePermitSignatures) {
          console.log('Using regular approval transactions');
          
          const factoryAddress = getContractAddress(chainId, 'dexFactory');
          
          // Handle approvals for tokens that need them
          const token0Contract = new ethers.Contract(token0, [
            'function approve(address spender, uint256 amount) external returns (bool)'
          ], signer);
          
          const token1Contract = new ethers.Contract(token1, [
            'function approve(address spender, uint256 amount) external returns (bool)'
          ], signer);
          
          // Show approval notification
          toast('Token approvals required. Please approve both tokens in your wallet.', {
            duration: 5000,
            icon: 'ℹ️'
          });
          
          // Handle approvals sequentially to avoid confusion
          if (approvalNeeded.token0) {
            console.log('Approving token0 with maximum allowance');
            toast(`Approving ${getToken0Symbol()}... Please confirm in your wallet.`, {
              duration: 3000,
              icon: '⏳'
            });
            
            try {
              await token0Contract.approve(factoryAddress, ethers.MaxUint256);
              toast.success(`${getToken0Symbol()} approved successfully!`);
            } catch (error) {
              if (error.code === 'ACTION_REJECTED') {
                toast.error(`${getToken0Symbol()} approval was rejected. Please try again and approve the transaction.`);
                throw new Error(`${getToken0Symbol()} approval rejected by user`);
              } else {
                toast.error(`Failed to approve ${getToken0Symbol()}: ${error.message}`);
                throw error;
              }
            }
          }
          
          if (approvalNeeded.token1) {
            console.log('Approving token1 with maximum allowance');
            toast(`Approving ${getToken1Symbol()}... Please confirm in your wallet.`, {
              duration: 3000,
              icon: '⏳'
            });
            
            try {
              await token1Contract.approve(factoryAddress, ethers.MaxUint256);
              toast.success(`${getToken1Symbol()} approved successfully!`);
            } catch (error) {
              if (error.code === 'ACTION_REJECTED') {
                toast.error(`${getToken1Symbol()} approval was rejected. Please try again and approve the transaction.`);
                throw new Error(`${getToken1Symbol()} approval rejected by user`);
              } else {
                toast.error(`Failed to approve ${getToken1Symbol()}: ${error.message}`);
                throw error;
              }
            }
          }
          
          // Update allowances after approval
          await checkTokenAllowances();
          
          console.log('All approvals completed successfully');
          toast.success('All token approvals completed! Proceeding with pool creation...');
        }
      } else {
        console.log('No approval needed - sufficient allowances exist');
      }

      // If liquidity locking is enabled, we need to approve LP tokens for the factory
      if (enableLiquidityLock) {
        console.log('Liquidity locking enabled - will need LP token approval');
        // Note: LP token approval will be handled by the factory contract
        // The factory will mint LP tokens to the user and then transfer them for locking
      }

      toast.success('Pool creation initiated! Check your wallet for confirmation.');
      
      // Single transaction: Create pair, add liquidity, and optionally lock it
      console.log('Creating pair with liquidity in one transaction...');
      console.log('Parameters:', {
        token0,
        token1,
        token0AmountWei: token0AmountWei.toString(),
        token1AmountWei: token1AmountWei.toString(),
        enableLiquidityLock,
        lockDuration: lockDuration.toString(),
        description: `Initial liquidity lock for ${getToken0Symbol()}-${getToken1Symbol()} pool`
      });
      
      let createPairWithLiquidityTx;
      
      // Try to use the single transaction approach, with permit signatures if available
      console.log('Attempting single transaction approach for pool creation');
      
      try {
        // If we have permit signatures, use the permit-based function
        if (usePermitSignatures && permitData) {
          console.log('Using permit-based single transaction approach');
          createPairWithLiquidityTx = await dexFactory.createPairWithLiquidityPermit(
            token0,
            token1,
            token0AmountWei,
            token1AmountWei,
            enableLiquidityLock,
            lockDuration,
            `Initial liquidity lock for ${getToken0Symbol()}-${getToken1Symbol()} pool`,
            permitData.deadlineA,
            permitData.vA,
            permitData.rA,
            permitData.sA,
            permitData.deadlineB,
            permitData.vB,
            permitData.rB,
            permitData.sB,
            { gasLimit: 8000000 }
          );
        } else {
          // Use the regular single transaction approach
          console.log('Using regular single transaction approach');
          createPairWithLiquidityTx = await dexFactory.createPairWithLiquidity(
            token0,
            token1,
            token0AmountWei,
            token1AmountWei,
            enableLiquidityLock,
            lockDuration,
            `Initial liquidity lock for ${getToken0Symbol()}-${getToken1Symbol()} pool`,
            { gasLimit: 8000000 }
          );
        }
        console.log('Single transaction approach successful');
      } catch (error) {
        console.log('Single transaction approach failed, falling back to separate steps:', error.message);
        
        // Fallback: Create pair first, then add liquidity
        console.log('Creating pair first...');
        const createPairTx = await dexFactory.createPair(token0, token1, { gasLimit: 4000000 });
        await createPairTx.wait();
        
        // Get the created pair address
        const pairAddress = await dexFactory.getPair(token0, token1);
        console.log('Pair created at:', pairAddress);
        
        // Add liquidity to the pair
        console.log('Adding liquidity to pair...');
        const pairContract = new ethers.Contract(pairAddress, [
          'function mint(address to) external returns (uint256 liquidity)'
        ], signer);
        
        // Transfer tokens to pair contract
        const token0Contract = new ethers.Contract(token0, [
          'function transfer(address to, uint256 amount) external returns (bool)'
        ], signer);
        
        const token1Contract = new ethers.Contract(token1, [
          'function transfer(address to, uint256 amount) external returns (bool)'
        ], signer);
        
        await token0Contract.transfer(pairAddress, token0AmountWei);
        await token1Contract.transfer(pairAddress, token1AmountWei);
        
        // Mint liquidity
        const mintTx = await pairContract.mint(account, { gasLimit: 4000000 });
        await mintTx.wait();
        
        console.log('Fallback approach completed successfully');
        
        // Set transaction hash for UI
        setTransactionHash(createPairTx.hash);
        
        // Show success message
        toast.success('Pool created successfully using fallback method!');
        setTransactionStatus('success');
        const fallbackPair = `${getToken0Symbol()}/${getToken1Symbol()}`;
        const fallbackChainName = getNetworkByChainId(chainId)?.name;
        setShareData({ pair: fallbackPair, chainName: fallbackChainName });
        setShareModalOpen(true);

        // Reset form and return early
        setToken0('');
        setToken1('');
        setToken0Amount('');
        setToken1Amount('');
        setToken0Decimals(18);
        setToken1Decimals(18);
        setToken0Info(null);
        setToken1Info(null);
        
        return;
      }
      
      setTransactionHash(createPairWithLiquidityTx.hash);
      
      // Wait for transaction with timeout and better error handling
      let receipt;
      try {
        console.log('Waiting for transaction confirmation...');
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Transaction confirmation timeout (5 minutes)')), 5 * 60 * 1000);
        });
        
        receipt = await Promise.race([
          createPairWithLiquidityTx.wait(),
          timeoutPromise
        ]);
        
        console.log('Pair created with liquidity:', receipt.hash);
      } catch (waitError) {
        console.error('Error waiting for transaction:', waitError);
        
        // Check if transaction was actually sent
        if (createPairWithLiquidityTx.hash) {
          console.log('Transaction hash exists, checking status...');
          
          // Try to get transaction status directly
          try {
            const tx = await provider.getTransaction(createPairWithLiquidityTx.hash);
            if (tx && tx.blockNumber) {
              // Transaction was mined, try to get receipt again
              receipt = await provider.getTransactionReceipt(createPairWithLiquidityTx.hash);
              console.log('Retrieved transaction receipt:', receipt.hash);
            } else {
              throw new Error('Transaction not yet mined or failed');
            }
          } catch (statusError) {
            console.error('Could not get transaction status:', statusError);
            throw new Error(`Transaction may have failed. Hash: ${createPairWithLiquidityTx.hash}. Please check the transaction on Etherscan.`);
          }
        } else {
          throw new Error('Transaction failed to send');
        }
      }
      
      // Get the created pair address from the transaction receipt
      const pairAddress = await dexFactory.getPair(token0, token1);
      console.log('Pair address:', pairAddress);
      
      // If we couldn't get the receipt but have a transaction hash, check if pool was created
      if (!receipt && createPairWithLiquidityTx.hash) {
        console.log('No receipt available, checking if pool was created...');
        const pairCheck = await dexFactory.getPair(token0, token1);
        if (pairCheck !== "0x0000000000000000000000000000000000000000") {
          console.log('Pool was created successfully despite receipt issues');
          // Create a minimal receipt object
          receipt = {
            hash: createPairWithLiquidityTx.hash,
            blockNumber: null,
            gasUsed: null
          };
        }
      }
      
      // Get liquidity from the pair contract
      let liquidity = 0n;
      if (pairAddress !== "0x0000000000000000000000000000000000000000") {
        try {
          const pairContract = new ethers.Contract(pairAddress, [
            'function balanceOf(address) external view returns (uint256)'
          ], provider);
          liquidity = await pairContract.balanceOf(account);
        } catch (error) {
          console.log('Could not get liquidity balance:', error.message);
        }
      }
      console.log('Liquidity minted:', liquidity.toString());
      
      // Ensure we have a valid receipt before proceeding
      if (!receipt || !receipt.hash) {
        throw new Error('Transaction receipt not available. Please check the transaction hash on Etherscan.');
      }
      
      if (enableLiquidityLock) {
        toast.success(`Pool created and liquidity locked for ${Math.floor(lockDuration / (24 * 60 * 60))} days!`);
      } else {
        toast.success('Pool created successfully!');
      }
      
      // Update transaction status
      setTransactionStatus('success');

      const pair = `${getToken0Symbol()}/${getToken1Symbol()}`;
      const chainName = getNetworkByChainId(chainId)?.name;
      setShareData({ pair, chainName });
      setShareModalOpen(true);
      
      // Show detailed success message with transaction hash
      toast.success(`Pool created successfully! Transaction: ${receipt.hash}`, {
        duration: 10000
      });
      recordAchievement?.(account, 'pool_create', 'first_pool');
      
      // If we don't have full receipt details, show a note
      if (!receipt.blockNumber || !receipt.gasUsed) {
        toast('Transaction confirmed but some details unavailable. Check Etherscan for full details.', {
          duration: 8000,
          icon: 'ℹ️'
        });
      }
      
      // Also log to console for debugging
      console.log('🎉 Pool created successfully!');
      console.log('Create pair with liquidity transaction hash:', receipt.hash);
      console.log('Block number:', receipt.blockNumber);
      console.log('Gas used:', receipt.gasUsed.toString());
      console.log('Pair address:', pairAddress);
      console.log('Liquidity minted:', liquidity.toString());
      
      // Reset form
      setToken0('');
      setToken1('');
      setToken0Amount('');
      setToken1Amount('');
      setToken0Decimals(18);
      setToken1Decimals(18);
      setToken0Info(null);
      setToken1Info(null);
      
      console.log('Liquidity lock enabled:', enableLiquidityLock);
      console.log('Lock duration:', lockDuration);
      
    } catch (error) {
      console.error('Error creating pool:', error);
      
      // Update transaction status
      setTransactionStatus('error');
      setTransactionError(error.message);
      
      // Handle specific error types with user-friendly messages
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction was rejected. Please try again and approve the transaction in your wallet.', {
          duration: 8000
        });
        setTransactionError('Transaction rejected by user. Please approve the transaction in your wallet.');
      } else if (error.message.includes('approval rejected by user')) {
        toast.error('Token approval was rejected. Please try again and approve the token spending.', {
          duration: 8000
        });
        setTransactionError('Token approval rejected. Please approve token spending in your wallet.');
      } else if (error.message.includes('Failed to fetch') || error.message.includes('UNKNOWN_ERROR')) {
        toast.error('Network connection issue. Please check your internet connection and try again.');
        setTransactionError('Network connection error. Please check the transaction hash on Etherscan to see if it was successful.');
      } else if (error.message.includes('insufficient funds')) {
        toast.error('Insufficient funds for transaction. Please check your wallet balance.');
        setTransactionError('Insufficient funds for transaction.');
      } else if (error.message.includes('already exists')) {
        toast.error('Pool already exists for this token pair.');
        setTransactionError('Pool already exists for this token pair.');
      } else if (error.message.includes('ID')) {
        toast.error('Cannot create pool with identical tokens.');
        setTransactionError('Cannot create pool with identical tokens.');
      } else if (error.message.includes('ZA')) {
        toast.error('Invalid token address (zero address).');
        setTransactionError('Invalid token address.');
      } else if (error.message.includes('INV_AMOUNTS')) {
        toast.error('Invalid token amounts (must be greater than 0).');
        setTransactionError('Invalid token amounts.');
      } else if (error.message.includes('MINT_FAILED')) {
        toast.error('Failed to mint liquidity tokens. Please try again.');
        setTransactionError('Failed to mint liquidity tokens.');
      } else if (error.message.includes('TF_A_FAILED') || error.message.includes('TF_B_FAILED')) {
        toast.error('Token transfer failed. Please check your token balances and approvals.');
        setTransactionError('Token transfer failed - check balances and approvals.');
      } else if (error.message.includes('TF_LP_FAILED')) {
        toast.error('LP token transfer failed - liquidity locking issue.');
        setTransactionError('LP token transfer failed.');
      } else if (error.message.includes('LOCK_FAILED')) {
        toast.error('Liquidity locking failed. Please try again.');
        setTransactionError('Liquidity locking failed.');
      } else if (error.message.includes('INV_DURATION')) {
        toast.error('Invalid lock duration (must be greater than 0).');
        setTransactionError('Invalid lock duration.');
      } else if (error.message.includes('NO_LOCKER')) {
        toast.error('Liquidity locker not configured.');
        setTransactionError('Liquidity locker not configured.');
      } else if (error.message.includes('timeout')) {
        toast.error('Transaction confirmation timeout. Please check the transaction hash on Etherscan.');
        setTransactionError('Transaction confirmation timeout.');
      } else {
        toast.error(`Failed to create pool: ${error.message}`, {
          duration: 8000
        });
        setTransactionError(`Failed to create pool: ${error.message}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const _handleSwapTokens = () => {
    const tempToken = token0;
    const tempAmount = token0Amount;
    const tempInfo = token0Info;
    const tempDecimals = token0Decimals;
    
    setToken0(token1);
    setToken1(tempToken);
    setToken0Amount(token1Amount);
    setToken1Amount(tempAmount);
    setToken0Info(token1Info);
    setToken1Info(tempInfo);
    setToken0Decimals(token1Decimals);
    setToken1Decimals(tempDecimals);
  };

  const getSelectedFeeOption = () => {
    return feeOptions.find(option => option.value === selectedFee) || feeOptions[2]; // Default to 0.3%
  };

  // Helper functions to get selected token balances
  const getToken0Balance = () => {
    if (!token0) return null;
    const token = userTokens.find(t => t.address === token0);
    return token ? parseFloat(token.formattedBalance) : null;
  };

  const getToken1Balance = () => {
    if (!token1) return null;
    const token = userTokens.find(t => t.address === token1);
    return token ? parseFloat(token.formattedBalance) : null;
  };

  const getToken0Symbol = () => {
    if (!token0) return '';
    const token = userTokens.find(t => t.address === token0);
    return token ? token.symbol : '';
  };

  const getToken1Symbol = () => {
    if (!token1) return '';
    const token = userTokens.find(t => t.address === token1);
    return token ? token.symbol : '';
  };

  // Functions to set full balance amounts
  const setToken0FullBalance = () => {
    const balance = getToken0Balance();
    if (balance !== null) {
      setToken0Amount(balance.toString());
    }
  };

  const setToken1FullBalance = () => {
    const balance = getToken1Balance();
    if (balance !== null) {
      setToken1Amount(balance.toString());
    }
  };

  // Generate permit signatures for both tokens
  const generatePermitSignatures = async (token0Address, token1Address, amount0, amount1, signer, owner) => {
    const factoryAddress = getContractAddress(chainId, 'dexFactory');
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    
    const permitData = {
      deadlineA: 0,
      vA: 0,
      rA: ethers.ZeroHash,
      sA: ethers.ZeroHash,
      deadlineB: 0,
      vB: 0,
      rB: ethers.ZeroHash,
      sB: ethers.ZeroHash
    };
    
    try {
      // Try to generate permit for token0
      const token0Contract = new ethers.Contract(token0Address, [
        'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external',
        'function nonces(address owner) external view returns (uint256)',
        'function DOMAIN_SEPARATOR() external view returns (bytes32)'
      ], signer);
      
      const nonce0 = await token0Contract.nonces(owner);
      const domainSeparator0 = await token0Contract.DOMAIN_SEPARATOR();
      
      const permitHash0 = ethers.solidityPackedKeccak256(
        ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
        [domainSeparator0, owner, factoryAddress, amount0, nonce0, deadline]
      );
      
      const signature0 = await signer.signMessage(ethers.getBytes(permitHash0));
      const { v: v0, r: r0, s: s0 } = ethers.Signature.from(signature0);
      
      permitData.deadlineA = deadline;
      permitData.vA = v0;
      permitData.rA = r0;
      permitData.sA = s0;
      
      console.log('Permit signature generated for token0');
    } catch (error) {
      console.log('Permit not supported for token0, will use existing allowance');
    }
    
    try {
      // Try to generate permit for token1
      const token1Contract = new ethers.Contract(token1Address, [
        'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external',
        'function nonces(address owner) external view returns (uint256)',
        'function DOMAIN_SEPARATOR() external view returns (bytes32)'
      ], signer);
      
      const nonce1 = await token1Contract.nonces(owner);
      const domainSeparator1 = await token1Contract.DOMAIN_SEPARATOR();
      
      const permitHash1 = ethers.solidityPackedKeccak256(
        ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
        [domainSeparator1, owner, factoryAddress, amount1, nonce1, deadline]
      );
      
      const signature1 = await signer.signMessage(ethers.getBytes(permitHash1));
      const { v: v1, r: r1, s: s1 } = ethers.Signature.from(signature1);
      
      permitData.deadlineB = deadline;
      permitData.vB = v1;
      permitData.rB = r1;
      permitData.sB = s1;
      
      console.log('Permit signature generated for token1');
    } catch (error) {
      console.log('Permit not supported for token1, will use existing allowance');
    }
    
    return permitData;
  };

  if (isSolana) return <CreatePoolSolanaContent />;

  if (!isConnected) {
    return (
      <>
        <Helmet>
          <title>Create Pool | boing.finance — New Liquidity Pools on EVM & Solana</title>
          <meta name="description" content="Create new liquidity pools on EVM and Solana. Deploy trading pairs and earn fees with boing.finance." />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
        </Helmet>
        <div className="relative min-h-screen">
          <div className="relative z-10 container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-3xl font-bold text-white mb-4">Create Liquidity Pool</h1>
              <p className="text-gray-300 mb-8">Connect your wallet to create new pools and earn fees.</p>
              <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
                <div className="text-6xl mb-4">🔗</div>
                <h2 className="text-xl font-semibold text-white mb-2">Wallet Required</h2>
                <p className="text-gray-400 mb-6">Connect your wallet to create liquidity pools and start earning.</p>
                <button 
                  onClick={connectWallet}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Create Pool | boing.finance — New Liquidity Pools on EVM & Solana</title>
        <meta name="description" content="Create new liquidity pools on EVM and Solana. Deploy pairs, earn fees. One interface with boing.finance." />
        <meta name="keywords" content="liquidity pools, create pool, DeFi, AMM, trading pairs" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
      </Helmet>
      <div className="relative min-h-screen">
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <DexFeatureBanner featureLabel="Create Pool" currentChainId={chainId} onSwitchNetwork={switchNetwork} />
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">Create Liquidity Pool</h1>
              <p className="text-xl text-gray-300">
                Deploy new trading pairs and earn fees from every trade
              </p>
            </div>

            {/* Pool Configuration */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4 text-white">Pool Configuration</h3>
              
              {/* Token Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Tokens
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Token A Dropdown */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Token A</label>
                    <button
                      type="button"
                      onClick={() => {
                        setToken0DropdownOpen(!token0DropdownOpen);
                        setToken1DropdownOpen(false);
                        setFeeDropdownOpen(false);
                      }}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm sm:text-base flex items-center justify-between"
                    >
                      <span>
                        {token0 ? (
                          userTokens.find(t => t.address === token0) ? 
                            `${userTokens.find(t => t.address === token0).symbol} - ${userTokens.find(t => t.address === token0).name}` :
                            'Custom Token'
                        ) : 'Select Token A'}
                      </span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {token0DropdownOpen && (
                      <div className="absolute z-20 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {/* Custom Token Input */}
                        {showCustomTokenInput && customTokenInputFor === 'token0' && (
                          <div className="p-3 border-b border-gray-600 custom-token-input">
                            <form onSubmit={handleCustomTokenSubmit} className="space-y-2">
                              <label htmlFor="create-pool-custom-token0-address" className="sr-only">Token contract address</label>
                              <input
                                id="create-pool-custom-token0-address"
                                name="customTokenAddress"
                                type="text"
                                value={customTokenAddress}
                                onChange={(e) => setCustomTokenAddress(e.target.value)}
                                placeholder="Enter token contract address"
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm placeholder-gray-400"
                                autoFocus
                              />
                              <div className="flex space-x-2">
                                <button
                                  type="submit"
                                  disabled={isAddingCustomToken || !customTokenAddress}
                                  className="flex-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs rounded"
                                >
                                  {isAddingCustomToken ? 'Adding...' : 'Add Token'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowCustomTokenInput(false);
                                    setCustomTokenInputFor('');
                                    setCustomTokenAddress('');
                                  }}
                                  className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                        
                        {/* Add Custom Token Button */}
                        {!showCustomTokenInput && (
                          <button
                            type="button"
                            onClick={() => handleAddCustomToken('token0')}
                            className="w-full px-3 py-2 text-left text-cyan-400 text-sm hover:bg-gray-600 focus:bg-gray-600 focus:outline-none border-b border-gray-600"
                          >
                            + Add Custom Token
                          </button>
                        )}
                        
                        {/* Token List */}
                        {userTokens.map((token) => (
                          <button
                            key={token.address}
                            type="button"
                            onClick={() => {
                              setToken0(token.address);
                              setToken0Decimals(token.decimals);
                              setToken0DropdownOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left text-white text-sm hover:bg-gray-600 focus:bg-gray-600 focus:outline-none"
                          >
                            <div className="flex items-center justify-between">
                              <span>{token.symbol} - {token.name}</span>
                              <span className="text-xs text-gray-400">
                                {parseFloat(token.formattedBalance).toFixed(4)}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Token B Dropdown */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Token B</label>
                    <button
                      type="button"
                      onClick={() => {
                        setToken1DropdownOpen(!token1DropdownOpen);
                        setToken0DropdownOpen(false);
                        setFeeDropdownOpen(false);
                      }}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm sm:text-base flex items-center justify-between"
                    >
                      <span>
                        {token1 ? (
                          userTokens.find(t => t.address === token1) ? 
                            `${userTokens.find(t => t.address === token1).symbol} - ${userTokens.find(t => t.address === token1).name}` :
                            'Custom Token'
                        ) : 'Select Token B'}
                      </span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {token1DropdownOpen && (
                      <div className="absolute z-20 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {/* Custom Token Input */}
                        {showCustomTokenInput && customTokenInputFor === 'token1' && (
                          <div className="p-3 border-b border-gray-600 custom-token-input">
                            <form onSubmit={handleCustomTokenSubmit} className="space-y-2">
                              <label htmlFor="create-pool-custom-token1-address" className="sr-only">Token contract address</label>
                              <input
                                id="create-pool-custom-token1-address"
                                name="customTokenAddress"
                                type="text"
                                value={customTokenAddress}
                                onChange={(e) => setCustomTokenAddress(e.target.value)}
                                placeholder="Enter token contract address"
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm placeholder-gray-400"
                                autoFocus
                              />
                              <div className="flex space-x-2">
                                <button
                                  type="submit"
                                  disabled={isAddingCustomToken || !customTokenAddress}
                                  className="flex-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs rounded"
                                >
                                  {isAddingCustomToken ? 'Adding...' : 'Add Token'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowCustomTokenInput(false);
                                    setCustomTokenInputFor('');
                                    setCustomTokenAddress('');
                                  }}
                                  className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                        
                        {/* Add Custom Token Button */}
                        {!showCustomTokenInput && (
                          <button
                            type="button"
                            onClick={() => handleAddCustomToken('token1')}
                            className="w-full px-3 py-2 text-left text-cyan-400 text-sm hover:bg-gray-600 focus:bg-gray-600 focus:outline-none border-b border-gray-600"
                          >
                            + Add Custom Token
                          </button>
                        )}
                        
                        {/* Token List */}
                        {userTokens.map((token) => (
                          <button
                            key={token.address}
                            type="button"
                            onClick={() => {
                              setToken1(token.address);
                              setToken1Decimals(token.decimals);
                              setToken1DropdownOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left text-white text-sm hover:bg-gray-600 focus:bg-gray-600 focus:outline-none"
                          >
                            <div className="flex items-center justify-between">
                              <span>{token.symbol} - {token.name}</span>
                              <span className="text-xs text-gray-400">
                                {parseFloat(token.formattedBalance).toFixed(4)}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Initial Liquidity */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Initial Liquidity
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="create-pool-token0-amount" className="block text-sm font-medium text-gray-600">Token A Amount</label>
                      {getToken0Balance() !== null && (
                        <button
                          type="button"
                          onClick={setToken0FullBalance}
                          className="text-xs text-gray-400 hover:text-cyan-400 cursor-pointer transition-colors duration-200"
                          title="Click to use full balance"
                        >
                          Balance: {getToken0Balance().toFixed(4)} {getToken0Symbol()}
                        </button>
                      )}
                    </div>
                    <input
                      id="create-pool-token0-amount"
                      name="token0Amount"
                      type="number"
                      value={token0Amount}
                      onChange={(e) => setToken0Amount(e.target.value)}
                      placeholder="0.0"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="create-pool-token1-amount" className="block text-sm font-medium text-gray-600">Token B Amount</label>
                      {getToken1Balance() !== null && (
                        <button
                          type="button"
                          onClick={setToken1FullBalance}
                          className="text-xs text-gray-400 hover:text-cyan-400 cursor-pointer transition-colors duration-200"
                          title="Click to use full balance"
                        >
                          Balance: {getToken1Balance().toFixed(4)} {getToken1Symbol()}
                        </button>
                      )}
                    </div>
                    <input
                      id="create-pool-token1-amount"
                      name="token1Amount"
                      type="number"
                      value={token1Amount}
                      onChange={(e) => setToken1Amount(e.target.value)}
                      placeholder="0.0"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Fee Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Trading Fee
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setFeeDropdownOpen(!feeDropdownOpen)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm sm:text-base flex items-center justify-between"
                  >
                    <span>
                      {getSelectedFeeOption()?.label} 
                      <span className="text-cyan-400 ml-2">
                        ({getSelectedFeeOption()?.platformFee} platform fee)
                      </span>
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {feeDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
                      {feeOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSelectedFee(option.value);
                            setFeeDropdownOpen(false);
                          }}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left text-white text-sm sm:text-base hover:bg-gray-600 focus:bg-gray-600 focus:outline-none"
                        >
                          <div className="flex items-center justify-between">
                            <span>{option.label}</span>
                            <span className="text-cyan-400">
                              ({option.platformFee} platform fee)
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Platform earns a share of trading fees. Lower fees attract more volume.
                </div>
              </div>

              {/* Liquidity Locking Configuration */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-300">
                    Liquidity Locking (Optional)
                  </label>
                  <ToggleButton
                    enabled={enableLiquidityLock}
                    onToggle={() => setEnableLiquidityLock(!enableLiquidityLock)}
                    size="sm"
                  />
                </div>
                
                {enableLiquidityLock && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label htmlFor="create-pool-lock-duration" className="block text-sm font-medium text-gray-600">
                          Lock Duration: {Math.round(lockDuration / (24 * 60 * 60))} days
                        </label>
                        <span className="text-xs text-gray-500">
                          {Math.round(lockDuration / (24 * 60 * 60))} days
                        </span>
                      </div>
                      <input
                        id="create-pool-lock-duration"
                        name="lockDuration"
                        type="range"
                        min="1"
                        max="365"
                        value={Math.round(lockDuration / (24 * 60 * 60))}
                        onChange={(e) => setLockDuration(Number(e.target.value) * 24 * 60 * 60)}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(Math.round(lockDuration / (24 * 60 * 60)) - 1) / 364 * 100}%, #4b5563 ${(Math.round(lockDuration / (24 * 60 * 60)) - 1) / 364 * 100}%, #4b5563 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1 day</span>
                        <span>365 days</span>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="create-pool-lock-description" className="block text-sm font-medium text-gray-600 mb-1">Lock Description (optional)</label>
                      <input
                        id="create-pool-lock-description"
                        name="lockDescription"
                        type="text"
                        value={lockDescription}
                        onChange={(e) => setLockDescription(e.target.value)}
                        placeholder="e.g. Team lock, community lock, etc."
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-sm sm:text-base"
                      />
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-1">
                  {enableLiquidityLock 
                    ? "Locked liquidity cannot be withdrawn until the lock expires. This protects users from rug pulls."
                    : "Enable liquidity locking to protect users from rug pulls by preventing withdrawal until the lock expires."
                  }
                </div>
              </div>

              {/* Pool Preview & Tips */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2 text-white">Pool Preview & Tips</h4>
                <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                  <ul className="list-disc pl-5 text-sm text-gray-300">
                    <li>Trading fee: <span className="font-semibold">{selectedFee}%</span></li>
                    <li>Liquidity lock: <span className="font-semibold">
                      {enableLiquidityLock ? `${Math.round(lockDuration / (24 * 60 * 60))} days` : 'Disabled'}
                    </span></li>
                    <li>Tokens: <span className="font-semibold">{token0 || 'Token A'} / {token1 || 'Token B'}</span></li>
                    <li>Initial liquidity: <span className="font-semibold">{token0Amount || '0'} / {token1Amount || '0'}</span></li>
                    <li>Lock description: <span className="font-semibold">{enableLiquidityLock ? (lockDescription || 'None') : 'N/A'}</span></li>
                  </ul>
                </div>
              </div>

              {/* Approval Process Info */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2 text-white">⚠️ Important: Token Approvals</h4>
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-sm text-gray-300 mb-3">
                    When creating a pool, you'll need to approve token spending for both tokens. This allows the DEX to transfer your tokens to create the pool.
                  </p>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      You'll see separate approval requests for each token
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      Approve each transaction in your wallet when prompted
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      After approvals, the pool creation will proceed automatically
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      Approvals are one-time and can be revoked later if needed
                    </li>
                  </ul>
                  <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded text-xs text-yellow-200">
                    <strong>Note:</strong> If you reject any approval transaction, the pool creation will be cancelled. You can try again by clicking "Create Pool" again.
                  </div>
                </div>
              </div>
              
              <div className="mt-3 text-xs text-cyan-400">
                Tip: Locking liquidity and using a low trading fee can help attract more users and build trust.
              </div>


            </div>

            {/* Token Approval Notice */}
            {token0 && token1 && token0Amount && token1Amount && (
              (() => {
                if (isCheckingAllowances) {
                  return (
                    <div className="mb-6 bg-blue-900/20 border border-blue-600/50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-3"></div>
                        <span className="text-sm text-blue-300">Checking token approvals...</span>
                      </div>
                    </div>
                  );
                }
                
                const approvalNeeded = needsApproval();
                const needsAnyApproval = approvalNeeded.token0 || approvalNeeded.token1;
                
                if (!needsAnyApproval) {
                  // Show info about existing approvals
                  return (
                    <div className="mb-6 bg-green-900/20 border border-green-600/50 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-400">
                            Token Approvals Ready
                          </h3>
                          <div className="mt-2 text-sm text-green-300">
                            <p>Both tokens are already approved for pool creation. You can proceed without additional approvals.</p>
                            <p className="mt-1 text-xs text-green-200">
                              Current allowances: {getToken0Symbol()} ({ethers.formatUnits(token0Allowance, token0Decimals)}), {getToken1Symbol()} ({ethers.formatUnits(token1Allowance, token1Decimals)})
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div className="mb-6 bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-400">
                          Token Approval Required
                        </h3>
                        <div className="mt-2 text-sm text-yellow-300">
                          <p>You need to approve the following tokens before creating the pool:</p>
                          <ul className="mt-2 space-y-1">
                            {approvalNeeded.token0 && (
                              <li className="flex items-center">
                                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                                <span className="font-medium">{getToken0Symbol()}</span>
                                <span className="text-yellow-200 ml-1">
                                  (Current allowance: {ethers.formatUnits(token0Allowance, token0Decimals)})
                                </span>
                              </li>
                            )}
                            {approvalNeeded.token1 && (
                              <li className="flex items-center">
                                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                                <span className="font-medium">{getToken1Symbol()}</span>
                                <span className="text-yellow-200 ml-1">
                                  (Current allowance: {ethers.formatUnits(token1Allowance, token1Decimals)})
                                </span>
                              </li>
                            )}
                          </ul>
                          <p className="mt-2 text-xs text-yellow-200">
                            The pool creation will automatically handle token approvals with maximum allowance, but you'll need to confirm them in your wallet. This approval will cover future pool creations with the same tokens.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* Create Button */}
            <button
              onClick={handleCreatePool}
              disabled={isCreating || !token0 || !token1 || !token0Amount || !token1Amount}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition duration-200 flex items-center justify-center"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Creating Pool...
                </>
              ) : (
                'Create Pool'
              )}
            </button>

            {/* Transaction Status */}
            {(transactionStatus === 'pending' || transactionStatus === 'success' || transactionStatus === 'error') && (
              <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold mb-3 text-white">Transaction Status</h4>
                
                {transactionStatus === 'pending' && (
                  <div className="flex items-center text-yellow-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400 mr-3"></div>
                    <span>Transaction pending...</span>
                  </div>
                )}
                
                {transactionStatus === 'success' && (
                  <div className="space-y-3">
                    <div className="flex items-center text-green-400">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Pool created successfully!</span>
                      <button
                        type="button"
                        onClick={() => shareData && setShareModalOpen(true)}
                        className="ml-3 px-3 py-1 rounded text-sm font-medium border"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      >
                        Share
                      </button>
                    </div>
                    {transactionHash && (
                      <div className="bg-gray-700 rounded p-3">
                        <div className="text-sm text-gray-400 mb-1">Transaction Hash:</div>
                        <div className="flex items-center justify-between">
                          <code className="text-green-400 text-sm break-all">{transactionHash}</code>
                          <button
                            onClick={() => window.open(`https://sepolia.etherscan.io/tx/${transactionHash}`, '_blank')}
                            className="ml-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {transactionStatus === 'error' && (
                  <div className="space-y-3">
                    <div className="flex items-center text-red-400">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span>Transaction failed</span>
                    </div>
                    {transactionError && (
                      <div className="bg-gray-700 rounded p-3">
                        <div className="text-sm text-gray-400 mb-1">Error:</div>
                        <div className="text-red-400 text-sm">{transactionError}</div>
                        {(transactionError.includes('Failed to fetch') || transactionError.includes('UNKNOWN_ERROR')) && (
                          <div className="mt-2 text-xs text-yellow-300">
                            💡 Tip: If you have a transaction hash, check it on Etherscan to see if the transaction was actually successful.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <ShareCardModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        type="pool"
        data={shareData}
      />
    </>
  );
}

export default CreatePool; 