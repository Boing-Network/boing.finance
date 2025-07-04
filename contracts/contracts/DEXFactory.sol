// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/IDEXFactory.sol";
import "./interfaces/IDEXPair.sol";
import "./DEXPair.sol";
import "./LiquidityLocker.sol";

/**
 * @title DEXFactory
 * @dev Optimized DEX factory contract with core security features
 * - Basic liquidity locking functionality
 * - Advanced fee management and revenue tracking
 * - Emergency controls and security features
 * - Gas optimizations and best practices
 */
contract DEXFactory is IDEXFactory, Ownable, ReentrancyGuard, Pausable {
    using Address for address;
    using SafeERC20 for IERC20;
    
    // ============ STATE VARIABLES ============
    
    // Mapping from token pair to pair address
    mapping(address => mapping(address => address)) private _getPair;
    
    // Array of all pairs
    address[] public allPairs;
    
    // Fee configuration
    uint256 public feeRate = 30; // 0.3% (30 basis points)
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant MAX_FEE_RATE = 1000; // 10% maximum
    
    // Factory statistics
    uint256 public totalPairsCreated;
    
    // Emergency controls
    bool public emergencyStop;
    mapping(address => bool) public authorizedOperators;
    mapping(address => bool) public blacklistedAddresses;
    
    // Security configuration
    mapping(address => IDEXFactory.PoolSecurityConfig) public poolSecurityConfigs;
    
    // Enhanced access control (simplified)
    mapping(address => bool) public isManager;
    
    // Reference to LiquidityLocker
    LiquidityLocker public liquidityLocker;
    
    // ============ EVENTS ============
    
    event ManagerUpdated(address indexed manager, bool authorized);
    event BlacklistUpdated(address indexed account, bool blacklisted);
    
    // ============ MODIFIERS ============
    
    modifier notEmergencyStopped() {
        require(!emergencyStop, "DEX: EMERGENCY_STOP");
        _;
    }
    
    modifier onlyAuthorized() {
        require(
            msg.sender == owner() || 
            authorizedOperators[msg.sender] || 
            isManager[msg.sender],
            "DEX: NOT_AUTHORIZED"
        );
        _;
    }
    
    modifier onlyManager() {
        require(
            msg.sender == owner() || isManager[msg.sender],
            "DEX: MANAGER_ONLY"
        );
        _;
    }
    
    modifier notBlacklisted(address account) {
        require(!blacklistedAddresses[account], "DEX: BLACKLISTED");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    constructor(address locker) Ownable(msg.sender) {
        require(locker != address(0), "INV_LOCKER");
        emergencyStop = false;
        liquidityLocker = LiquidityLocker(locker);
    }
    
    // ============ PAIR CREATION FUNCTIONS ============
    
    /**
     * @dev Create a new trading pair with security configuration
     */
    function createPair(
        address tokenA, 
        address tokenB, 
        PoolSecurityConfig calldata securityConfig
    ) 
        external 
        override
        whenNotPaused 
        notEmergencyStopped
        notBlacklisted(msg.sender)
        returns (address pair) 
    {
        require(tokenA != tokenB, "DEX: IDENTICAL_ADDRESSES");
        require(tokenA != address(0) && tokenB != address(0), "DEX: ZERO_ADDRESS");
        require(tokenA.code.length > 0 && tokenB.code.length > 0, "DEX: NOT_CONTRACT");
        
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(_getPair[token0][token1] == address(0), "DEX: PAIR_EXISTS");
        
        // Create the pair contract using CREATE2 for deterministic addresses
        bytes memory bytecode = type(DEXPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        
        assembly {
            pair := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        
        require(pair != address(0), "DEX: CREATE2_FAILED");
        
        // Initialize the pair with security configuration
        IDEXPair(pair).initialize(token0, token1, securityConfig);
        
        // Store security configuration
        poolSecurityConfigs[pair] = securityConfig;
        
        // Update state
        _getPair[token0][token1] = pair;
        _getPair[token1][token0] = pair;
        allPairs.push(pair);
        totalPairsCreated++;
        
        emit PairCreated(token0, token1, pair, allPairs.length, block.timestamp, securityConfig);
    }
    
    /**
     * @dev Create a new trading pair with default security configuration
     */
    function createPair(address tokenA, address tokenB) 
        external 
        override
        whenNotPaused 
        notEmergencyStopped
        notBlacklisted(msg.sender)
        returns (address pair) 
    {
        IDEXFactory.PoolSecurityConfig memory defaultConfig = IDEXFactory.PoolSecurityConfig({
            emergencyStop: true
        });
        
        return this.createPair(tokenA, tokenB, defaultConfig);
    }
    
    // ============ SIMPLIFIED LIQUIDITY LOCKING FUNCTIONS ============
    
    /**
     * @dev Lock liquidity for a specified duration (delegated to LiquidityLocker)
     */
    function lockLiquidity(
        address pair,
        uint256 amount,
        uint256 lockDuration,
        string memory description
    ) external payable override {
        require(pair != address(0), "INV_PAIR");
        require(amount > 0, "INV_AMT");
        require(lockDuration > 0, "INV_DUR");
        require(lockDuration <= 365 days, "LONG");
        require(_getPair[IDEXPair(pair).token0()][IDEXPair(pair).token1()] == pair, "NFND");
        
        // Calculate lock fee
        uint256 lockFeeRate = feeRate;
        uint256 lockFee = (amount * lockFeeRate) / FEE_DENOMINATOR;
        
        // Handle fee payment
        if (msg.value > 0) {
            require(msg.value >= lockFee, "FEE");
            // Refund excess ETH
            if (msg.value > lockFee) {
                (bool success, ) = msg.sender.call{value: msg.value - lockFee}("");
                require(success, "REFND");
            }
        } else {
            // For basic locks, transfer LP tokens as fee
            require(
                IERC20(pair).transferFrom(msg.sender, address(this), lockFee),
                "FEE_TF"
            );
        }
        
        // Transfer remaining LP tokens to this contract
        uint256 remainingAmount = amount - lockFee;
        require(
            IERC20(pair).transferFrom(msg.sender, address(this), remainingAmount),
            "TF"
        );
        
        // Delegate to LiquidityLocker
        liquidityLocker.lockLiquidity(pair, msg.sender, remainingAmount, lockDuration, description, lockFee);
    }
    
    /**
     * @dev Unlock liquidity after lock period expires (delegated to LiquidityLocker)
     */
    function unlockLiquidity(address pair, uint256 lockIndex) external override {
        liquidityLocker.unlockLiquidity(pair, lockIndex, msg.sender);
    }
    
    // ============ TRADING FEE COLLECTION ============
    
    /**
     * @dev Collect trading fees from pairs (called by pair contracts)
     */
    function collectTradingFees(address pair, uint256 amount) 
        external 
        nonReentrant 
    {
        require(_getPair[IDEXPair(pair).token0()][IDEXPair(pair).token1()] == pair, "INV_PAIR");
        
        emit TradingFeeCollected(pair, amount, 0, block.timestamp);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get pair address for token pair
     */
    function getPair(address tokenA, address tokenB) external view override returns (address pair) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        pair = _getPair[token0][token1];
    }
    
    /**
     * @dev Get pair address (interface compliance)
     */
    function getPairAddress(address tokenA, address tokenB) external view returns (address) {
        return this.getPair(tokenA, tokenB);
    }
    
    /**
     * @dev Get all pairs length
     */
    function allPairsLength() external view override returns (uint256) {
        return allPairs.length;
    }
    
    /**
     * @dev Get fee denominator
     */
    function feeDenominator() external pure override returns (uint256) {
        return FEE_DENOMINATOR;
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Update fee rate (manager only)
     */
    function updateFeeRate(uint256 newFeeRate) external onlyManager {
        require(newFeeRate <= MAX_FEE_RATE, "DEX: FEE_TOO_HIGH");
        uint256 oldFee = feeRate;
        feeRate = newFeeRate;
        emit FeeUpdated(oldFee, newFeeRate, msg.sender);
    }
    
    /**
     * @dev Set emergency stop (manager only)
     */
    function setEmergencyStop(bool stopped) external onlyManager {
        emergencyStop = stopped;
        emit EmergencyStopUpdated(stopped, msg.sender);
    }
    
    /**
     * @dev Authorize/unauthorize operator (manager only)
     */
    function setAuthorizedOperator(address operator, bool authorized) external onlyManager {
        authorizedOperators[operator] = authorized;
        emit OperatorAuthorized(operator, authorized);
    }
    
    /**
     * @dev Set manager (owner only)
     */
    function setManager(address manager, bool authorized) external onlyOwner {
        isManager[manager] = authorized;
        emit ManagerUpdated(manager, authorized);
    }
    
    /**
     * @dev Blacklist/unblacklist address (manager only)
     */
    function setBlacklisted(address account, bool blacklisted) external onlyManager {
        blacklistedAddresses[account] = blacklisted;
        emit BlacklistUpdated(account, blacklisted);
    }
    
    /**
     * @dev Pause/unpause factory (manager only)
     */
    function pause() external onlyManager {
        _pause();
    }
    
    function unpause() external onlyManager {
        _unpause();
    }
    
    /**
     * @dev Withdraw collected fees (manager only)
     */
    function withdrawFees() external onlyManager {
        uint256 balance = address(this).balance;
        require(balance > 0, "DEX: NO_FEES");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "DEX: WITHDRAWAL_FAILED");
    }
    
    /**
     * @dev Emergency function to recover stuck tokens (owner only)
     */
    function emergencyRecover(address token, address to, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            (bool success, ) = to.call{value: amount}("");
            require(success, "DEX: ETH_TRANSFER_FAILED");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    function createPairWithLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB,
        bool shouldLockLiquidity,
        uint256 lockDuration,
        string memory lockDescription
    ) external pure returns (address, uint256) {
        revert("NOT_IMPLEMENTED");
    }
} 