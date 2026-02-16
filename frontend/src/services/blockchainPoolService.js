import { ethers } from 'ethers';
import { getContractAddress } from '../config/contracts';
import apyCalculationService from './apyCalculationService';
import externalPoolService from './externalPoolService';
import simplePoolDataService from './simplePoolDataService';

// DEXFactory ABI for pool-related functions (Enhanced for DEXFactoryV2)
const DEX_FACTORY_ABI = [
  'function allPairs(uint256) external view returns (address)',
  'function allPairsLength() external view returns (uint256)',
  'function getPair(address, address) external view returns (address)',
  'function createPair(address, address) external returns (address)',
  'function createPairWithLiquidity(address, address, uint256, uint256, uint256, address) external returns (address)',
  'function createPairWithLiquidityPermit(address, address, uint256, uint256, uint256, address, uint256, uint8, bytes32, bytes32) external returns (address)',
  'function feeTo() external view returns (address)',
  'function feeToSetter() external view returns (address)',
  'function liquidityLocker() external view returns (address)'
];

// DEXPair ABI for pool information
const DEX_PAIR_ABI = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function balanceOf(address) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function getReserves() external view returns (uint112, uint112, uint32)',
  'function kLast() external view returns (uint256)',
  'function price0CumulativeLast() external view returns (uint256)',
  'function price1CumulativeLast() external view returns (uint256)',
  'function blockTimestampLast() external view returns (uint32)'
];

// ERC20 ABI for token information
const ERC20_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address) external view returns (uint256)',
  'function allowance(address, address) external view returns (uint256)'
];

// LiquidityLocker ABI (Corrected for actual contract)
const LIQUIDITY_LOCKER_ABI = [
  'function getLocks(address) external view returns (tuple(address owner, uint256 amount, uint256 unlockTime, bool isLocked)[])',
  'function getTotalLocked(address) external view returns (uint256)',
  'function totalLiquidityLocked() external view returns (uint256)',
  'function liquidityLocks(address, uint256) external view returns (address owner, uint256 amount, uint256 unlockTime, bool isLocked)'
];

class BlockchainPoolService {
  constructor() {
    this.provider = null;
    this.chainId = null;
    this.dexFactory = null;
    this.liquidityLocker = null;
    this.debug = true; // Enable debugging to see what's happening
  }

  // Utility function to convert BigInt values to strings for JSON serialization
  convertBigIntsToStrings(obj) {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj === 'bigint') {
      return obj.toString();
    }
    
    if (typeof obj === 'number' && (obj > Number.MAX_SAFE_INTEGER || obj < Number.MIN_SAFE_INTEGER)) {
      return obj.toString();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertBigIntsToStrings(item));
    }
    
    if (typeof obj === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        try {
          result[key] = this.convertBigIntsToStrings(value);
        } catch (error) {
          // If conversion fails, convert to string
          result[key] = String(value);
        }
      }
      return result;
    }
    
    return obj;
  }

  /**
   * Format large numbers with industry-standard abbreviations
   */
  formatLargeNumber(num, decimals = 2, includeDollarSign = true) {
    if (num === 0) return includeDollarSign ? '$0' : '0';
    if (num < 0.0001 && num > 0) return includeDollarSign ? `$${num.toExponential(4)}` : num.toExponential(4);
    
    const absNum = Math.abs(num);
    let formatted;
    
    if (absNum >= 1e12) {
      formatted = (num / 1e12).toFixed(decimals) + 'T';
    } else if (absNum >= 1e9) {
      formatted = (num / 1e9).toFixed(decimals) + 'B';
    } else if (absNum >= 1e6) {
      formatted = (num / 1e6).toFixed(decimals) + 'M';
    } else if (absNum >= 1e3) {
      formatted = (num / 1e3).toFixed(decimals) + 'K';
    } else {
      formatted = num.toFixed(decimals);
    }
    
    return includeDollarSign ? `$${formatted}` : formatted;
  }

  /**
   * Safe format units with proper BigInt handling
   */
  safeFormatUnits(value, decimals) {
    try {
      // Ensure value is a string to handle BigInt properly
      const valueStr = value.toString();
      
      // Use ethers.formatUnits to convert from smallest unit to human readable
      const formatted = ethers.formatUnits(valueStr, decimals);
      
      // Parse the formatted number to handle display
      const num = parseFloat(formatted);
      
      // Handle very small numbers (less than 0.0001)
      if (num < 0.0001 && num > 0) {
        return num.toExponential(4);
      }
      
      // For large numbers, use our custom formatter (no dollar sign for token amounts)
      if (num >= 1e3) {
        return this.formatLargeNumber(num, 4, false);
      }
      
      // For normal numbers, show up to 4 decimal places
      return num.toFixed(4).replace(/\.?0+$/, ''); // Remove trailing zeros
    } catch (error) {
      if (this.debug) {
        console.log(`Error formatting units for value ${value} with decimals ${decimals}:`, error);
      }
      return value.toString();
    }
  }

  /**
   * Format token reserves without abbreviations (for detailed display)
   */
  formatTokenReserve(value, decimals) {
    try {
      // Ensure value is a string to handle BigInt properly
      const valueStr = value.toString();
      
      // Use ethers.formatUnits to convert from smallest unit to human readable
      const formatted = ethers.formatUnits(valueStr, decimals);
      
      // Parse the formatted number
      const num = parseFloat(formatted);
      
      // Handle very small numbers (less than 0.0001)
      if (num < 0.0001 && num > 0) {
        return num.toExponential(4);
      }
      
      // For large numbers, use abbreviations (K, M, B, T)
      if (num >= 1e12) {
        return (num / 1e12).toFixed(2) + 'T';
      } else if (num >= 1e9) {
        return (num / 1e9).toFixed(2) + 'B';
      } else if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + 'M';
      } else if (num >= 1e3) {
        return (num / 1e3).toFixed(2) + 'K';
      } else {
        // For smaller numbers, show up to 4 decimal places
        return num.toFixed(4).replace(/\.?0+$/, ''); // Remove trailing zeros
      }
    } catch (error) {
      if (this.debug) {
        console.log(`Error formatting token reserve for value ${value} with decimals ${decimals}:`, error);
      }
      return value.toString();
    }
  }

  // Initialize the service with provider and chain ID
  // Returns true if initialized successfully, false if contracts not available (graceful degradation)
  async initialize(provider, chainId) {
    this.provider = provider;
    this.chainId = chainId;
    
    const factoryAddress = getContractAddress(chainId, 'dexFactory');
    const lockerAddress = getContractAddress(chainId, 'liquidityLocker');
    
    if (this.debug) {
      console.log('🔧 Initializing BlockchainPoolService:', {
        chainId,
        factoryAddress,
        lockerAddress
      });
    }
    
    // Check if DEXFactory is deployed (not zero address)
    if (!factoryAddress || factoryAddress === '0x0000000000000000000000000000000000000000') {
      if (this.debug) {
        console.log('⚠️ DEXFactory not deployed on this network. Service will work in API-only mode.');
      }
      // Don't throw error - allow service to work in API-only mode
      this.dexFactory = null;
      this.liquidityLocker = null;
      return false; // Return false to indicate contracts not available
    }
    
    try {
      this.dexFactory = new ethers.Contract(factoryAddress, DEX_FACTORY_ABI, provider);
      
      if (lockerAddress && lockerAddress !== '0x0000000000000000000000000000000000000000') {
        this.liquidityLocker = new ethers.Contract(lockerAddress, LIQUIDITY_LOCKER_ABI, provider);
      }

      // Test factory connection with timeout
      try {
        const totalPairs = await Promise.race([
          this.dexFactory.allPairsLength(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        if (this.debug) {
          console.log('✅ DEXFactory connected successfully. Total pairs:', totalPairs.toString());
          console.log('🏭 Using DEXFactoryV2 at:', factoryAddress);
        }
        return true; // Successfully initialized
      } catch (error) {
        console.warn('⚠️ Failed to connect to DEXFactory (contract may not be deployed):', error.message);
        // Don't throw - allow graceful degradation
        this.dexFactory = null;
        this.liquidityLocker = null;
        return false; // Contracts not available
      }
    } catch (error) {
      console.warn('⚠️ Error setting up contracts:', error.message);
      this.dexFactory = null;
      this.liquidityLocker = null;
      return false; // Contracts not available
    }
  }

  // Get all pools from blockchain (your DEXFactory only)
  async getAllPools(limit = 50) {
    if (!this.dexFactory) {
      throw new Error('Service not initialized');
    }

    try {
      const totalPairs = await this.dexFactory.allPairsLength();
      if (this.debug) {
        console.log('📊 Total pairs in factory:', totalPairs.toString());
      }
      
      const pools = [];
      
      // Get the most recent pairs (last 'limit' pairs)
      const startIndex = Math.max(0, Number(totalPairs) - limit);
      
      if (this.debug) {
        console.log(`🔍 Scanning pairs from index ${startIndex} to ${Number(totalPairs) - 1}`);
      }
      
      for (let i = startIndex; i < Number(totalPairs); i++) {
        try {
          const pairAddress = await this.dexFactory.allPairs(i);
          if (this.debug) {
            console.log(`📍 Pair ${i}: ${pairAddress}`);
          }
          
          const poolInfo = await this.getPoolInfo(pairAddress);
          if (poolInfo) {
            pools.push(poolInfo);
          }
        } catch (error) {
          console.warn(`Failed to load pair at index ${i}:`, error);
        }
      }
      
      if (this.debug) {
        console.log(`✅ Found ${pools.length} pools`);
      }
      
      return this.convertBigIntsToStrings(pools);
    } catch (error) {
      console.error('Failed to get all pools:', error);
      return [];
    }
  }

  // Get all pools from Sepolia network (including external DEXs)
  async getAllSepoliaPools(limit = 500) {
    if (!this.provider) {
      throw new Error('Service not initialized');
    }

    try {
      if (this.debug) {
        console.log('🌐 Fetching all pools from Sepolia network...');
      }

      // Get pools from your DEXFactory
      const yourPools = await this.getAllPools(limit);
      
      // Get pools from external sources (Uniswap, SushiSwap, etc.)
      let externalPools = [];
      try {
        if (this.debug) {
          console.log('🌐 Fetching external pools...');
        }
        const externalPoolsData = await externalPoolService.getAllSepoliaPools(this.provider, limit);
        externalPools = externalPoolsData.pools || [];
        if (this.debug) {
          console.log(`🌐 External pools fetched: ${externalPools.length} pools`);
          console.log('🌐 External pools sources:', externalPoolsData.sources);
        }
      } catch (error) {
        console.error('❌ Failed to fetch external pools:', error);
        if (this.debug) {
          console.log('🌐 External pools fetch failed, continuing with your pools only');
        }
      }

      // Process external pools with realistic data
      const processedExternalPools = await simplePoolDataService.processPoolsWithRealisticData(
        externalPools, 
        this.provider
      );

      // Combine and mark your pools
      const allPools = [
        ...yourPools.map(pool => ({ ...pool, source: 'Your DEX', isYourPool: true })),
        ...processedExternalPools.map(pool => ({ ...pool, isYourPool: false }))
      ];

      // Sort by 24h volume and limit results
      const sortedPools = allPools
        .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
        .slice(0, limit);

      if (this.debug) {
        console.log(`🌐 Total Sepolia pools found: ${allPools.length}`);
        console.log(`🌐 Your pools: ${yourPools.length}, External pools: ${externalPools.length}`);
        console.log(`🌐 Returning top ${sortedPools.length} pools by 24h volume`);
      }

      return this.convertBigIntsToStrings(sortedPools);
    } catch (error) {
      console.error('Failed to get all Sepolia pools:', error);
      
      // Fallback to just your pools if external fetch fails
      return await this.getAllPools(limit);
    }
  }

  // Get detailed pool information
  async getPoolInfo(pairAddress) {
    if (!this.provider) {
      throw new Error('Service not initialized');
    }

    try {
      const pairContract = new ethers.Contract(pairAddress, DEX_PAIR_ABI, this.provider);
      
      // Get basic pool data
      const [token0, token1, totalSupply, reserves] = await Promise.all([
        pairContract.token0(),
        pairContract.token1(),
        pairContract.totalSupply(),
        pairContract.getReserves()
      ]);

      // Get fee from factory (default 0.3%)
      let fee = 30; // Default fee in basis points
      if (this.dexFactory) {
        try {
          fee = await this.dexFactory.getFeeRate();
        } catch (error) {
          // Use default fee if factory call fails
        }
      }

      if (this.debug) {
        console.log(`🏊 Pool ${pairAddress}:`, {
          token0,
          token1,
          totalSupply: totalSupply.toString(),
          reserves: [reserves[0].toString(), reserves[1].toString()],
          fee: fee.toString()
        });
      }

      // Get token information
      const [token0Info, token1Info] = await Promise.all([
        this.getTokenInfo(token0),
        this.getTokenInfo(token1)
      ]);

      if (this.debug) {
        console.log(`🔍 Token info for ${pairAddress}:`, {
          token0: {
            address: token0,
            name: token0Info?.name,
            symbol: token0Info?.symbol,
            decimals: token0Info?.decimals
          },
          token1: {
            address: token1,
            name: token1Info?.name,
            symbol: token1Info?.symbol,
            decimals: token1Info?.decimals
          },
          pairAddress: pairAddress,
          pairName: `${token0Info?.symbol || 'Unknown'}/${token1Info?.symbol || 'Unknown'}`
        });
      }

      // Calculate pool metrics
      const reserve0 = Number(reserves[0]);
      const reserve1 = Number(reserves[1]);
      const totalSupplyNum = Number(totalSupply);
      
      // Convert reserves to human-readable amounts for TVL calculation
      const reserve0Human = parseFloat(ethers.formatUnits(reserves[0], token0Info.decimals));
      const reserve1Human = parseFloat(ethers.formatUnits(reserves[1], token1Info.decimals));
      
      // For now, use a simplified TVL calculation (in a real implementation, you'd get token prices)
      // This is just the sum of the human-readable amounts, not actual USD value
      const tvl = reserve0Human + reserve1Human;
      
      if (this.debug) {
        console.log(`💰 TVL calculation for ${pairAddress}:`, {
          reserve0Raw: reserves[0].toString(),
          reserve1Raw: reserves[1].toString(),
          token0Decimals: token0Info.decimals,
          token1Decimals: token1Info.decimals,
          reserve0Human: reserve0Human,
          reserve1Human: reserve1Human,
          tvl: tvl,
          formattedTvl: this.formatLargeNumber(tvl, 4, true)
        });
      }
      
      // Calculate fee percentage
      const feePercentage = Number(fee) / 10000; // Convert from basis points

      // Calculate real APY
      let apyData = { apy: 0, volume24h: 0, volume7d: 0, feeRate: feePercentage };
      try {
        const factoryAddress = getContractAddress(this.chainId, 'dexFactory');
        apyData = await apyCalculationService.calculatePoolAPY(
          pairAddress, 
          this.provider, 
          factoryAddress, 
          24 // 24 hours
        );
      } catch (error) {
        if (this.debug) {
          console.log(`📊 APY calculation failed for ${pairAddress}:`, error.message);
        }
      }

      const poolInfo = {
        address: pairAddress,
        token0: {
          address: token0,
          ...token0Info,
          reserve: reserve0,
          formattedReserve: this.formatTokenReserve(reserve0, token0Info.decimals)
        },
        token1: {
          address: token1,
          ...token1Info,
          reserve: reserve1,
          formattedReserve: this.formatTokenReserve(reserve1, token1Info.decimals)
        },
        totalSupply: totalSupplyNum,
        formattedTotalSupply: this.safeFormatUnits(totalSupply, 18),
        fee: feePercentage,
        tvl: tvl,
        apy: apyData.apy,
        volume24h: apyData.volume24h,
        volume7d: apyData.volume7d,
        swapCount: apyData.swapCount,
        chainId: this.chainId,
        createdAt: Date.now(), // We don't have creation time from contract
        formattedTvl: this.formatLargeNumber(tvl, 4, true)
      };
      
      return this.convertBigIntsToStrings(poolInfo);
    } catch (error) {
      console.error(`Failed to get pool info for ${pairAddress}:`, error);
      return null;
    }
  }

  // Get user's liquidity positions (Enhanced with debugging)
  async getUserPositions(userAddress) {
    if (!this.dexFactory || !userAddress) {
      return [];
    }

    if (this.debug) {
      console.log(`🔍 Searching for positions for user: ${userAddress}`);
    }

    try {
      const totalPairs = await this.dexFactory.allPairsLength();
      const userPositions = [];
      
      // Scan through ALL pairs (not just recent ones) to ensure we find user's positions
      const startIndex = 0;
      const endIndex = Number(totalPairs);
      
      if (this.debug) {
        console.log(`🔍 Scanning ALL pairs from index ${startIndex} to ${endIndex - 1}`);
      }
      
      for (let i = startIndex; i < endIndex; i++) {
        try {
          const pairAddress = await this.dexFactory.allPairs(i);
          
          if (this.debug) {
            console.log(`📍 Checking pair ${i}: ${pairAddress}`);
          }
          
          const position = await this.getUserPositionInPool(userAddress, pairAddress);
          if (position && Number(position.lpBalance) > 0) {
            if (this.debug) {
              console.log(`✅ Found position in pair ${i}:`, {
                pairAddress,
                lpBalance: position.lpBalance,
                userShare: position.userShare
              });
            }
            userPositions.push(position);
          } else {
            if (this.debug) {
              console.log(`❌ No position found in pair ${i}: ${pairAddress}`);
            }
          }
        } catch (error) {
          console.warn(`Failed to check user position in pair ${i}:`, error);
          if (this.debug) {
            console.log(`💥 Error checking pair ${i}:`, error.message);
          }
        }
      }
      
      if (this.debug) {
        console.log(`🎯 Total positions found: ${userPositions.length}`);
        if (userPositions.length > 0) {
          console.log('📊 Found positions:', userPositions.map(pos => ({
            pair: pos.address,
            lpBalance: pos.lpBalance,
            userShare: `${(pos.userShare * 100).toFixed(2)}%`,
            lockInfo: pos.lockInfo ? `Locked until ${new Date(Number(pos.lockInfo.unlockTime) * 1000).toLocaleDateString()}` : 'Direct'
          })));
        }
      }
      
      return this.convertBigIntsToStrings(userPositions);
    } catch (error) {
      console.error('Failed to get user positions:', error);
      return [];
    }
  }

  // Get user's position in a specific pool (Enhanced)
  async getUserPositionInPool(userAddress, pairAddress) {
    if (!this.provider || !userAddress || !pairAddress) {
      return null;
    }

    try {
      const pairContract = new ethers.Contract(pairAddress, DEX_PAIR_ABI, this.provider);
      
      // Get user's LP token balance
      const userBalance = await pairContract.balanceOf(userAddress);
      
      if (this.debug) {
        console.log(`💰 User ${userAddress} LP balance in ${pairAddress}: ${userBalance.toString()}`);
      }
      
      let totalBalance = userBalance;
      let lockInfo = null;
      
      // If user has no direct balance, check if they have locked liquidity
      if (userBalance === 0n && this.liquidityLocker) {
        try {
          // Get all locks for this pair
          const locks = await this.liquidityLocker.getLocks(pairAddress);
          if (this.debug) {
            console.log(`🔒 Found ${locks.length} locks for pair ${pairAddress}`);
          }
          
          // Find locks owned by this user
          let totalLockedBalance = 0n;
          let lockInfo = null;
          
          for (let i = 0; i < locks.length; i++) {
            const lock = locks[i];
            if (lock.owner.toLowerCase() === userAddress.toLowerCase() && lock.isLocked) {
              totalLockedBalance += lock.amount;
              if (!lockInfo) {
                lockInfo = {
                  lockedAmount: lock.amount,
                  unlockTime: lock.unlockTime,
                  description: `Lock ${i + 1}`
                };
              }
              if (this.debug) {
                console.log(`🔒 Found user lock ${i}: ${lock.amount.toString()} LP tokens, unlock: ${new Date(Number(lock.unlockTime) * 1000).toLocaleString()}`);
              }
            }
          }
          
          if (totalLockedBalance > 0n) {
            // User has locked liquidity, treat this as their position
            totalBalance = totalLockedBalance;
            if (this.debug) {
              console.log(`✅ Found locked position: ${totalBalance.toString()} LP tokens`);
            }
          } else {
            if (this.debug) {
              console.log(`🔒 No locked liquidity found for user in ${pairAddress}`);
            }
            return null; // No direct or locked balance
          }
        } catch (error) {
          if (this.debug) {
            console.log(`🔓 Could not check locked liquidity:`, error.message);
          }
          return null; // No direct balance and can't check locked
        }
      } else if (userBalance === 0n) {
        if (this.debug) {
          console.log(`💰 No direct balance found for user in ${pairAddress}`);
        }
        return null; // No direct balance and no liquidity locker
      }

      // Get pool information
      const [token0, token1, totalSupply, reserves] = await Promise.all([
        pairContract.token0(),
        pairContract.token1(),
        pairContract.totalSupply(),
        pairContract.getReserves()
      ]);

      // Get fee from factory (default 0.3%)
      let fee = 30; // Default fee in basis points
      if (this.dexFactory) {
        try {
          fee = await this.dexFactory.getFeeRate();
        } catch (error) {
          // Use default fee if factory call fails
        }
      }

      // Get token information
      const [token0Info, token1Info] = await Promise.all([
        this.getTokenInfo(token0),
        this.getTokenInfo(token1)
      ]);

      // Calculate user's share
      const userShare = Number(totalBalance) / Number(totalSupply);
      
      // Calculate user's token amounts based on their LP balance
      const userToken0Amount = (Number(reserves[0]) * Number(totalBalance)) / Number(totalSupply);
      const userToken1Amount = (Number(reserves[1]) * Number(totalBalance)) / Number(totalSupply);

      // Calculate total pool TVL (sum of token amounts)
      const reserve0Human = parseFloat(ethers.formatUnits(reserves[0], token0Info.decimals));
      const reserve1Human = parseFloat(ethers.formatUnits(reserves[1], token1Info.decimals));
      const tvl = reserve0Human + reserve1Human;

      if (this.debug) {
        console.log(`📊 Position calculation for ${pairAddress}:`, {
          userLpBalance: totalBalance.toString(),
          totalSupply: totalSupply.toString(),
          userShare: `${(userShare * 100).toFixed(4)}%`,
          reserve0: reserves[0].toString(),
          reserve1: reserves[1].toString(),
          userToken0Amount: userToken0Amount.toString(),
          userToken1Amount: userToken1Amount.toString(),
          calculation: `(${reserves[0]} * ${totalBalance}) / ${totalSupply} = ${userToken0Amount}`,
          // Add more context
          userLpBalanceFormatted: this.safeFormatUnits(totalBalance, 18),
          totalSupplyFormatted: this.safeFormatUnits(totalSupply, 18),
          reserve0Formatted: this.safeFormatUnits(reserves[0], token0Info.decimals),
          reserve1Formatted: this.safeFormatUnits(reserves[1], token1Info.decimals),
          tvl: tvl,
          formattedTvl: this.formatLargeNumber(tvl, 4, true)
        });
      }

      // Calculate APY for this position
      let apyData = { apy: 0, volume24h: 0, volume7d: 0, feeRate: Number(fee) / 10000 };
      try {
        const factoryAddress = getContractAddress(this.chainId, 'dexFactory');
        apyData = await apyCalculationService.calculatePoolAPY(
          pairAddress, 
          this.provider, 
          factoryAddress, 
          24 // 24 hours
        );
      } catch (error) {
        if (this.debug) {
          console.log(`📊 APY calculation failed for position ${pairAddress}:`, error.message);
        }
      }

      // Lock info is already set above if we found locked liquidity

      const position = {
        address: pairAddress,
        lpBalance: totalBalance.toString(),
        formattedLpBalance: this.safeFormatUnits(totalBalance, 18),
        userShare: userShare,
        token0: {
          address: token0,
          ...token0Info,
          amount: userToken0Amount,
          formattedAmount: this.safeFormatUnits(userToken0Amount, token0Info.decimals)
        },
        token1: {
          address: token1,
          ...token1Info,
          amount: userToken1Amount,
          formattedAmount: this.safeFormatUnits(userToken1Amount, token1Info.decimals)
        },
        fee: Number(fee) / 10000,
        tvl: tvl,
        formattedTvl: this.formatLargeNumber(tvl, 4, true),
        apy: apyData.apy,
        volume24h: apyData.volume24h,
        volume7d: apyData.volume7d,
        swapCount: apyData.swapCount,
        lockInfo: lockInfo,
        chainId: this.chainId
      };
      
      return this.convertBigIntsToStrings(position);
    } catch (error) {
      console.error(`Failed to get user position in pool ${pairAddress}:`, error);
      if (this.debug) {
        console.log(`💥 getUserPositionInPool failed for ${pairAddress}:`, error.message);
      }
      return null;
    }
  }

  // Get user's created pools (Enhanced)
  async getUserCreatedPools(userAddress) {
    if (!this.dexFactory || !userAddress) {
      return [];
    }

    if (this.debug) {
      console.log(`🏭 Searching for pools created by user: ${userAddress}`);
    }

    try {
      const totalPairs = await this.dexFactory.allPairsLength();
      const createdPools = [];
      
      // Scan through ALL pairs
      const startIndex = 0;
      const endIndex = Number(totalPairs);
      
      for (let i = startIndex; i < endIndex; i++) {
        try {
          const pairAddress = await this.dexFactory.allPairs(i);
          const poolInfo = await this.getPoolInfo(pairAddress);
          
          if (poolInfo) {
            // Check if user has significant liquidity in this pool (could indicate creation)
            const userPosition = await this.getUserPositionInPool(userAddress, pairAddress);
            if (userPosition && userPosition.userShare > 0.1) { // More than 10% share
              if (this.debug) {
                console.log(`🏭 Found created pool: ${pairAddress} with ${(userPosition.userShare * 100).toFixed(2)}% share`);
              }
              createdPools.push({
                ...poolInfo,
                userShare: userPosition.userShare,
                isCreator: true
              });
            }
          }
        } catch (error) {
          console.warn(`Failed to check created pool ${i}:`, error);
        }
      }
      
      if (this.debug) {
        console.log(`🏭 Total created pools found: ${createdPools.length}`);
      }
      
      return this.convertBigIntsToStrings(createdPools);
    } catch (error) {
      console.error('Failed to get user created pools:', error);
      return [];
    }
  }

  // Get pool analytics (volume, fees, etc.)
  async getPoolAnalytics(pairAddress, _timeRange = '24h') {
    if (!this.provider || !pairAddress) {
      return null;
    }

    try {
      const pairContract = new ethers.Contract(pairAddress, DEX_PAIR_ABI, this.provider);
      
      // Get current reserves and price data
      const [reserves, kLast, price0CumulativeLast, price1CumulativeLast, blockTimestampLast] = await Promise.all([
        pairContract.getReserves(),
        pairContract.kLast(),
        pairContract.price0CumulativeLast(),
        pairContract.price1CumulativeLast(),
        pairContract.blockTimestampLast()
      ]);

      // Calculate basic metrics
      const reserve0 = Number(reserves[0]);
      const reserve1 = Number(reserves[1]);
      const totalLiquidity = reserve0 + reserve1;
      
      // Calculate price impact (simplified)
      const priceImpact = this.calculatePriceImpact(reserve0, reserve1);

      const analytics = {
        pairAddress,
        totalLiquidity: totalLiquidity.toString(),
        volume24h: '0', // Would need to track events for real volume
        priceImpact: priceImpact,
        kLast: kLast.toString(),
        price0CumulativeLast: price0CumulativeLast.toString(),
        price1CumulativeLast: price1CumulativeLast.toString(),
        blockTimestampLast: blockTimestampLast.toString()
      };
      
      return this.convertBigIntsToStrings(analytics);
    } catch (error) {
      console.error(`Failed to get pool analytics for ${pairAddress}:`, error);
      return null;
    }
  }

  // Get token information
  async getTokenInfo(tokenAddress) {
    if (!this.provider || !tokenAddress) {
      return null;
    }

    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.totalSupply()
      ]);

      const tokenInfo = {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: totalSupply.toString(),
        formattedTotalSupply: this.safeFormatUnits(totalSupply, Number(decimals))
      };
      
      return this.convertBigIntsToStrings(tokenInfo);
    } catch (error) {
      console.error(`Failed to get token info for ${tokenAddress}:`, error);
      return {
        name: 'Unknown Token',
        symbol: 'UNKNOWN',
        decimals: 18,
        totalSupply: '0',
        formattedTotalSupply: '0'
      };
    }
  }

  // Calculate price impact (simplified)
  calculatePriceImpact(reserve0, reserve1) {
    if (reserve0 === 0 || reserve1 === 0) return 0;
    return Math.abs((reserve0 - reserve1) / (reserve0 + reserve1)) * 100;
  }

  // Get all user locks from LiquidityLocker
  async getUserLocks(userAddress) {
    if (!this.liquidityLocker || !userAddress) {
      return [];
    }

    try {
      if (this.debug) {
        console.log(`🔒 Getting all locks for user: ${userAddress}`);
      }

      // Get all pools first
      const allPools = await this.getAllPools(100); // Get more pools to ensure we find user's locks
      const userLocks = [];

      for (const pool of allPools) {
        try {
          const locks = await this.liquidityLocker.getLocks(pool.address);
          
          for (let i = 0; i < locks.length; i++) {
            const lock = locks[i];
            if (lock.owner.toLowerCase() === userAddress.toLowerCase() && lock.isLocked) {
              userLocks.push({
                pairAddress: pool.address,
                lockIndex: i,
                amount: lock.amount,
                unlockTime: lock.unlockTime,
                isLocked: lock.isLocked,
                token0: pool.token0,
                token1: pool.token1
              });
            }
          }
        } catch (error) {
          if (this.debug) {
            console.log(`🔓 Could not get locks for pool ${pool.address}:`, error.message);
          }
        }
      }

      if (this.debug) {
        console.log(`🔒 Found ${userLocks.length} locks for user:`, userLocks);
      }

      return this.convertBigIntsToStrings(userLocks);
    } catch (error) {
      console.error('Failed to get user locks:', error);
      return [];
    }
  }

  // Get user's total portfolio value across all pools
  async getUserPortfolioValue(userAddress) {
    if (!userAddress) {
      const emptyPortfolio = {
        totalValue: 0,
        totalPools: 0,
        totalLiquidity: 0,
        averageAPY: 0
      };
      return this.convertBigIntsToStrings(emptyPortfolio);
    }

    try {
      const positions = await this.getUserPositions(userAddress);
      
      let totalValue = 0;
      let totalLiquidity = 0;
      
      for (const position of positions) {
        // Simplified value calculation (in a real implementation, you'd get token prices)
        const positionValue = position.token0.amount + position.token1.amount;
        totalValue += positionValue;
        totalLiquidity += Number(position.lpBalance);
      }

      // Calculate weighted average APY across all positions
      let totalWeightedAPY = 0;
      let totalWeight = 0;
      
      for (const position of positions) {
        const positionValue = position.token0.amount + position.token1.amount;
        if (positionValue > 0) {
          totalWeightedAPY += (position.apy || 0) * positionValue;
          totalWeight += positionValue;
        }
      }
      
      const averageAPY = totalWeight > 0 ? totalWeightedAPY / totalWeight : 0;

      const portfolio = {
        totalValue,
        totalPools: positions.length,
        totalLiquidity,
        averageAPY: averageAPY,
        positions
      };
      
      return this.convertBigIntsToStrings(portfolio);
    } catch (error) {
      console.error('Failed to get user portfolio value:', error);
      const errorPortfolio = {
        totalValue: 0,
        totalPools: 0,
        totalLiquidity: 0,
        averageAPY: 0
      };
      return this.convertBigIntsToStrings(errorPortfolio);
    }
  }
}

// Create and export a singleton instance
const blockchainPoolService = new BlockchainPoolService();
export default blockchainPoolService; 