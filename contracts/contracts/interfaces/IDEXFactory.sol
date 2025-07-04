// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IDEXPair.sol";

/**
 * @title IDEXFactory
 * @dev Interface for DEX Factory contract with core functionality
 */
interface IDEXFactory {
    // ============ STRUCTS ============
    
    struct PoolSecurityConfig {
        bool emergencyStop;
    }
    
    // ============ EVENTS ============
    
    event PairCreated(
        address indexed token0, 
        address indexed token1, 
        address pair, 
        uint256 allPairsLength,
        uint256 timestamp,
        PoolSecurityConfig securityConfig
    );
    
    event LiquidityLocked(
        address indexed pair,
        address indexed owner,
        uint256 amount,
        uint256 unlockTime,
        string description,
        uint256 lockFee
    );
    
    event LiquidityUnlocked(
        address indexed pair,
        address indexed owner,
        uint256 amount,
        uint256 timestamp
    );
    
    event TradingFeeCollected(
        address indexed pair,
        uint256 amount,
        uint256 platformShare,
        uint256 timestamp
    );
    
    event LockFeeCollected(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    
    event FeeUpdated(uint256 oldFee, uint256 newFee, address indexed updater);
    event EmergencyStopUpdated(bool stopped, address indexed updater);
    event OperatorAuthorized(address indexed operator, bool authorized);
    event PlatformFeeShareUpdated(uint256 oldShare, uint256 newShare);
    event LockFeeUpdated(uint256 oldBasicFee, uint256 newBasicFee, uint256 oldPremiumFee, uint256 newPremiumFee);
    
    // ============ CORE FUNCTIONS ============
    
    /**
     * @dev Create a new trading pair with security configuration
     * @param tokenA First token address
     * @param tokenB Second token address
     * @param securityConfig Security configuration for the pair
     * @return pair Address of the created pair
     */
    function createPair(address tokenA, address tokenB, PoolSecurityConfig calldata securityConfig) 
        external 
        returns (address pair);
    
    /**
     * @dev Create a new trading pair with default security configuration
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return pair Address of the created pair
     */
    function createPair(address tokenA, address tokenB) 
        external 
        returns (address pair);
    
    /**
     * @dev Create pair, add initial liquidity, and optionally lock it in one transaction
     * @param tokenA First token address
     * @param tokenB Second token address
     * @param amountA Amount of tokenA for initial liquidity
     * @param amountB Amount of tokenB for initial liquidity
     * @param shouldLockLiquidity Whether to lock the initial liquidity
     * @param lockDuration Duration to lock liquidity (if locking)
     * @param lockDescription Description for the lock (if locking)
     * @return pair The created pair address
     * @return liquidity The amount of LP tokens minted
     */
    function createPairWithLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB,
        bool shouldLockLiquidity,
        uint256 lockDuration,
        string memory lockDescription
    ) external returns (address pair, uint256 liquidity);
    
    /**
     * @dev Lock liquidity for a specified duration
     * @param pair Address of the pair
     * @param amount Amount of LP tokens to lock
     * @param lockDuration Duration to lock liquidity (in seconds)
     * @param description Description of the lock
     */
    function lockLiquidity(
        address pair,
        uint256 amount,
        uint256 lockDuration,
        string memory description
    ) external payable;
    
    /**
     * @dev Unlock liquidity after lock period expires
     * @param pair Address of the pair
     * @param lockIndex Index of the lock to unlock
     */
    function unlockLiquidity(address pair, uint256 lockIndex) external;
    
    /**
     * @dev Collect trading fees from pairs (called by pair contracts)
     * @param pair Address of the pair
     * @param amount Total trading fee amount
     */
    function collectTradingFees(address pair, uint256 amount) external;
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get pair address for token pair
     */
    function getPair(address tokenA, address tokenB) external view returns (address pair);
    
    /**
     * @dev Get pair address (interface compliance)
     */
    function getPairAddress(address tokenA, address tokenB) external view returns (address);
    
    /**
     * @dev Get all pairs
     */
    function allPairs(uint256 index) external view returns (address pair);
    
    /**
     * @dev Get all pairs length
     */
    function allPairsLength() external view returns (uint256);
    
    /**
     * @dev Get fee denominator
     */
    function feeDenominator() external view returns (uint256);
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Update fee rate (owner only)
     */
    function updateFeeRate(uint256 newFeeRate) external;
    
    /**
     * @dev Set emergency stop (owner only)
     */
    function setEmergencyStop(bool stopped) external;
    
    /**
     * @dev Authorize/unauthorize operator (owner only)
     */
    function setAuthorizedOperator(address operator, bool authorized) external;
    
    /**
     * @dev Pause/unpause factory (owner only)
     */
    function pause() external;
    
    function unpause() external;
    
    /**
     * @dev Withdraw collected fees (owner only)
     */
    function withdrawFees() external;
} 