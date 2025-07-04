// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title WETH
 * @dev Enhanced Wrapped ETH token for DEX trading
 * - Advanced security features and access control
 * - Rate limiting and anti-spam protection
 * - Enhanced deposit/withdraw functionality
 * - Emergency controls and recovery mechanisms
 * - Gas optimizations and best practices
 * - Support for batch operations and advanced features
 */
contract WETH is ERC20, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using Address for address;
    
    // Rate limiting
    mapping(address => uint256) public lastDepositTime;
    mapping(address => uint256) public lastWithdrawTime;
    uint256 public constant DEPOSIT_COOLDOWN = 10 seconds;
    uint256 public constant WITHDRAW_COOLDOWN = 10 seconds;
    
    // Daily limits
    mapping(address => uint256) public dailyDeposits;
    mapping(address => uint256) public dailyWithdrawals;
    mapping(address => uint256) public lastResetTime;
    uint256 public constant DAILY_DEPOSIT_LIMIT = 1000 ether;
    uint256 public constant DAILY_WITHDRAW_LIMIT = 1000 ether;
    
    // Emergency controls
    bool public emergencyStop;
    mapping(address => bool) public blacklistedAddresses;
    mapping(address => bool) public whitelistedAddresses;
    bool public whitelistEnabled;
    
    // Enhanced access control
    mapping(address => bool) public isManager;
    mapping(address => bool) public isOperator;
    
    // Statistics
    uint256 public totalDeposits;
    uint256 public totalWithdrawals;
    uint256 public totalFeesCollected;
    
    // Fee configuration
    uint256 public depositFee = 0; // 0% default
    uint256 public withdrawFee = 0; // 0% default
    uint256 public constant MAX_FEE = 100; // 1% maximum
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    // Events
    event Deposit(address indexed dst, uint256 wad, uint256 fee);
    event Withdrawal(address indexed src, uint256 wad, uint256 fee);
    event EmergencyStopUpdated(bool stopped);
    event AddressBlacklisted(address indexed account, bool blacklisted);
    event AddressWhitelisted(address indexed account, bool whitelisted);
    event WhitelistEnabled(bool enabled);
    event FeesUpdated(uint256 depositFee, uint256 withdrawFee);
    event DailyLimitUpdated(uint256 depositLimit, uint256 withdrawLimit);
    
    // Modifiers
    modifier notEmergencyStopped() {
        require(!emergencyStop, "WETH: Emergency stop active");
        _;
    }
    
    modifier onlyManager() {
        require(
            msg.sender == owner() || isManager[msg.sender],
            "WETH: Manager access required"
        );
        _;
    }
    
    modifier onlyAuthorized() {
        require(
            msg.sender == owner() || 
            isManager[msg.sender] || 
            isOperator[msg.sender],
            "WETH: Not authorized"
        );
        _;
    }
    
    modifier rateLimited() {
        require(
            block.timestamp >= lastDepositTime[msg.sender] + DEPOSIT_COOLDOWN,
            "WETH: Rate limit exceeded"
        );
        _;
        lastDepositTime[msg.sender] = block.timestamp;
    }
    
    modifier withdrawRateLimited() {
        require(
            block.timestamp >= lastWithdrawTime[msg.sender] + WITHDRAW_COOLDOWN,
            "WETH: Rate limit exceeded"
        );
        _;
        lastWithdrawTime[msg.sender] = block.timestamp;
    }
    
    modifier notBlacklisted(address account) {
        require(!blacklistedAddresses[account], "WETH: Address is blacklisted");
        _;
    }
    
    modifier validAddress(address account) {
        require(account != address(0), "WETH: Invalid address");
        require(!blacklistedAddresses[account], "WETH: Address is blacklisted");
        if (whitelistEnabled) {
            require(whitelistedAddresses[account], "WETH: Address not whitelisted");
        }
        _;
    }

    constructor() ERC20("Wrapped Ether", "WETH") Ownable(msg.sender) {
        emergencyStop = false;
        whitelistEnabled = false;
    }

    /**
     * @dev Deposit ETH and mint WETH with enhanced protection
     */
    function deposit() 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        notEmergencyStopped 
        rateLimited 
        validAddress(msg.sender)
    {
        require(msg.value > 0, "WETH: INSUFFICIENT_AMOUNT");
        
        // Check daily limit
        _resetDailyLimits(msg.sender);
        require(
            dailyDeposits[msg.sender] + msg.value <= DAILY_DEPOSIT_LIMIT,
            "WETH: Daily deposit limit exceeded"
        );
        
        // Calculate fee
        uint256 fee = (msg.value * depositFee) / FEE_DENOMINATOR;
        uint256 mintAmount = msg.value - fee;
        
        // Update statistics
        dailyDeposits[msg.sender] += msg.value;
        totalDeposits += msg.value;
        if (fee > 0) {
            totalFeesCollected += fee;
        }
        
        // Mint WETH
        _mint(msg.sender, mintAmount);
        
        emit Deposit(msg.sender, mintAmount, fee);
    }
    
    /**
     * @dev Deposit ETH for another address
     */
    function depositFor(address recipient) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        notEmergencyStopped 
        rateLimited 
        validAddress(msg.sender)
        validAddress(recipient)
    {
        require(msg.value > 0, "WETH: INSUFFICIENT_AMOUNT");
        
        // Check daily limit for recipient
        _resetDailyLimits(recipient);
        require(
            dailyDeposits[recipient] + msg.value <= DAILY_DEPOSIT_LIMIT,
            "WETH: Daily deposit limit exceeded"
        );
        
        // Calculate fee
        uint256 fee = (msg.value * depositFee) / FEE_DENOMINATOR;
        uint256 mintAmount = msg.value - fee;
        
        // Update statistics
        dailyDeposits[recipient] += msg.value;
        totalDeposits += msg.value;
        if (fee > 0) {
            totalFeesCollected += fee;
        }
        
        // Mint WETH
        _mint(recipient, mintAmount);
        
        emit Deposit(recipient, mintAmount, fee);
    }

    /**
     * @dev Withdraw ETH by burning WETH with enhanced protection
     */
    function withdraw(uint256 wad) 
        external 
        nonReentrant 
        whenNotPaused 
        notEmergencyStopped 
        withdrawRateLimited 
        validAddress(msg.sender)
    {
        require(wad > 0, "WETH: INSUFFICIENT_AMOUNT");
        require(balanceOf(msg.sender) >= wad, "WETH: INSUFFICIENT_BALANCE");
        
        // Check daily limit
        _resetDailyLimits(msg.sender);
        require(
            dailyWithdrawals[msg.sender] + wad <= DAILY_WITHDRAW_LIMIT,
            "WETH: Daily withdrawal limit exceeded"
        );
        
        // Calculate fee
        uint256 fee = (wad * withdrawFee) / FEE_DENOMINATOR;
        uint256 withdrawAmount = wad - fee;
        
        // Update statistics
        dailyWithdrawals[msg.sender] += wad;
        totalWithdrawals += wad;
        if (fee > 0) {
            totalFeesCollected += fee;
        }
        
        // Burn WETH
        _burn(msg.sender, wad);
        
        // Transfer ETH
        (bool success,) = msg.sender.call{value: withdrawAmount}("");
        require(success, "WETH: ETH_TRANSFER_FAILED");
        
        emit Withdrawal(msg.sender, withdrawAmount, fee);
    }
    
    /**
     * @dev Batch deposit for multiple recipients
     */
    function batchDeposit(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        notEmergencyStopped 
        validAddress(msg.sender)
    {
        require(recipients.length == amounts.length, "WETH: Array length mismatch");
        require(recipients.length > 0, "WETH: Empty arrays");
        require(recipients.length <= 100, "WETH: Too many recipients");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        require(msg.value == totalAmount, "WETH: Incorrect ETH amount");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "WETH: Invalid recipient");
            require(amounts[i] > 0, "WETH: Invalid amount");
            
            // Calculate fee
            uint256 fee = (amounts[i] * depositFee) / FEE_DENOMINATOR;
            uint256 mintAmount = amounts[i] - fee;
            
            // Update statistics
            totalDeposits += amounts[i];
            if (fee > 0) {
                totalFeesCollected += fee;
            }
            
            // Mint WETH
            _mint(recipients[i], mintAmount);
            
            emit Deposit(recipients[i], mintAmount, fee);
        }
    }

    /**
     * @dev Get ETH balance of this contract
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Get daily limits for an address
     */
    function getDailyLimits(address account) external view returns (
        uint256 deposits,
        uint256 withdrawals,
        uint256 depositLimit,
        uint256 withdrawLimit
    ) {
        deposits = dailyDeposits[account];
        withdrawals = dailyWithdrawals[account];
        depositLimit = DAILY_DEPOSIT_LIMIT;
        withdrawLimit = DAILY_WITHDRAW_LIMIT;
    }
    
    /**
     * @dev Reset daily limits for an address
     */
    function _resetDailyLimits(address account) internal {
        uint256 today = block.timestamp - (block.timestamp % 86400);
        if (lastResetTime[account] < today) {
            dailyDeposits[account] = 0;
            dailyWithdrawals[account] = 0;
            lastResetTime[account] = today;
        }
    }

    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Set emergency stop (manager only)
     */
    function setEmergencyStop(bool stopped) external onlyManager {
        emergencyStop = stopped;
        emit EmergencyStopUpdated(stopped);
    }
    
    /**
     * @dev Set manager (owner only)
     */
    function setManager(address manager, bool authorized) external onlyOwner {
        isManager[manager] = authorized;
    }
    
    /**
     * @dev Set operator (manager only)
     */
    function setOperator(address operator, bool authorized) external onlyManager {
        isOperator[operator] = authorized;
    }
    
    /**
     * @dev Blacklist/unblacklist address (manager only)
     */
    function setAddressBlacklisted(address account, bool blacklisted) external onlyManager {
        blacklistedAddresses[account] = blacklisted;
        emit AddressBlacklisted(account, blacklisted);
    }
    
    /**
     * @dev Whitelist/unwhitelist address (manager only)
     */
    function setAddressWhitelisted(address account, bool whitelisted) external onlyManager {
        whitelistedAddresses[account] = whitelisted;
        emit AddressWhitelisted(account, whitelisted);
    }
    
    /**
     * @dev Enable/disable whitelist (manager only)
     */
    function setWhitelistEnabled(bool enabled) external onlyManager {
        whitelistEnabled = enabled;
        emit WhitelistEnabled(enabled);
    }
    
    /**
     * @dev Update fees (manager only)
     */
    function updateFees(uint256 newDepositFee, uint256 newWithdrawFee) external onlyManager {
        require(newDepositFee <= MAX_FEE, "WETH: Deposit fee too high");
        require(newWithdrawFee <= MAX_FEE, "WETH: Withdraw fee too high");
        
        depositFee = newDepositFee;
        withdrawFee = newWithdrawFee;
        
        emit FeesUpdated(newDepositFee, newWithdrawFee);
    }
    
    /**
     * @dev Pause/unpause contract (manager only)
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
        require(balance > 0, "WETH: No fees to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "WETH: Fee withdrawal failed");
    }

    /**
     * @dev Emergency function to recover stuck tokens (owner only)
     */
    function emergencyRecover(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "WETH: Invalid recipient");
        
        if (token == address(0)) {
            // Withdraw ETH
            require(amount <= address(this).balance, "WETH: Insufficient ETH balance");
            (bool success,) = to.call{value: amount}("");
            require(success, "WETH: ETH_TRANSFER_FAILED");
        } else {
            // Withdraw ERC20 tokens
            IERC20(token).safeTransfer(to, amount);
        }
    }
    
    /**
     * @dev Emergency function to recover stuck WETH (owner only)
     */
    function emergencyRecoverWETH(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "WETH: Invalid recipient");
        require(amount <= balanceOf(address(this)), "WETH: Insufficient WETH balance");
        
        _transfer(address(this), to, amount);
    }
} 