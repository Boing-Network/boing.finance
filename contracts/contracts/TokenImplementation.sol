// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./TokenStructs.sol";

/**
 * @title TokenImplementation
 * @dev Implementation contract for ERC20 tokens with comprehensive security features
 * This contract is designed to be used with TokenFactory using EIP-1167 minimal proxy pattern
 * All initialization is done through the initialize function instead of constructor
 */
contract TokenImplementation is ERC20, Ownable, Pausable, ReentrancyGuard {
    uint8 private _decimals;
    string private _logo;
    string private _website;
    string private _description;
    string private _twitter;
    string private _telegram;
    string private _discord;
    string private _github;
    string private _medium;
    string private _reddit;
    uint256 private _maxTxAmount;
    uint256 private _maxWalletAmount;
    uint256 private _cooldownPeriod;
    uint256 private _timelockDelay;
    
    // Plan-based feature flags
    bool public isProfessionalPlan;
    bool public isEnterprisePlan;
    bool public isInitialized;
    
    address public freezingAuthority;
    address public blacklistAuthority;
    
    bool public mintAuthorityRemoved;
    bool public antiBotEnabled;
    bool public antiWhaleEnabled;
    bool public timelockEnabled;
    bool public maxWalletEnabled;
    
    // Service fee configuration
    address public platformWallet;
    uint256 public serviceFee;
    uint256 public chainId;
    
    // Network-specific service fee mapping
    mapping(uint256 => uint256) private _networkServiceFees;
    
    // Security mappings
    mapping(address => bool) private _frozen;
    mapping(address => bool) private _blacklisted;
    mapping(address => uint256) private _lastTransactionTime;
    mapping(address => bool) private _isExcludedFromLimits;
    
    // Timelock for administrative functions
    mapping(bytes32 => uint256) private _pendingActions;
    
    event Freeze(address indexed account, bool frozen);
    event Blacklist(address indexed account, bool blacklisted);
    event PlanUpgraded(string plan);
    event ServiceFeePaid(address indexed payer, uint256 amount, uint256 chainId);
    event CooldownUpdated(uint256 newCooldown);
    event MaxWalletUpdated(uint256 newMaxWallet);
    event TimelockActionScheduled(bytes32 indexed actionId, uint256 executeTime);
    event TimelockActionExecuted(bytes32 indexed actionId);
    event TokenInitialized(
        address indexed owner,
        string name,
        string symbol,
        uint8 decimals,
        uint256 initialSupply
    );
    
    // Network service fee configuration
    // These are the expected service fees for each network (in wei)
    // Updated to be competitive with market rates while maintaining profitability
    uint256 private constant ETHEREUM_BASIC_FEE = 0.05 ether; // ~$100-150
    uint256 private constant ETHEREUM_PROFESSIONAL_FEE = 0.15 ether; // ~$300-450
    uint256 private constant ETHEREUM_ENTERPRISE_FEE = 0.3 ether; // ~$600-900
    
    uint256 private constant POLYGON_BASIC_FEE = 25 * 10**18; // 25 MATIC (~$20-30)
    uint256 private constant POLYGON_PROFESSIONAL_FEE = 75 * 10**18; // 75 MATIC (~$60-90)
    uint256 private constant POLYGON_ENTERPRISE_FEE = 150 * 10**18; // 150 MATIC (~$120-180)
    
    uint256 private constant BSC_BASIC_FEE = 0.05 * 10**18; // 0.05 BNB (~$15-25)
    uint256 private constant BSC_PROFESSIONAL_FEE = 0.15 * 10**18; // 0.15 BNB (~$45-75)
    uint256 private constant BSC_ENTERPRISE_FEE = 0.3 * 10**18; // 0.3 BNB (~$90-150)
    
    uint256 private constant ARBITRUM_BASIC_FEE = 0.01 ether; // ~$20-30
    uint256 private constant ARBITRUM_PROFESSIONAL_FEE = 0.03 ether; // ~$60-90
    uint256 private constant ARBITRUM_ENTERPRISE_FEE = 0.06 ether; // ~$120-180
    
    uint256 private constant OPTIMISM_BASIC_FEE = 0.015 ether; // ~$30-45
    uint256 private constant OPTIMISM_PROFESSIONAL_FEE = 0.045 ether; // ~$90-135
    uint256 private constant OPTIMISM_ENTERPRISE_FEE = 0.09 ether; // ~$180-270
    
    uint256 private constant BASE_BASIC_FEE = 0.01 ether; // ~$20-30
    uint256 private constant BASE_PROFESSIONAL_FEE = 0.03 ether; // ~$60-90
    uint256 private constant BASE_ENTERPRISE_FEE = 0.06 ether; // ~$120-180
    
    // Testnet fees (reduced for testing)
    uint256 private constant SEPOLIA_BASIC_FEE = 0.001 ether; // ~$2-3
    uint256 private constant SEPOLIA_PROFESSIONAL_FEE = 0.003 ether; // ~$6-9
    uint256 private constant SEPOLIA_ENTERPRISE_FEE = 0.006 ether; // ~$12-18
    
    uint256 private constant MUMBAI_BASIC_FEE = 2 * 10**18; // 2 MATIC (~$1.60-2.40)
    uint256 private constant MUMBAI_PROFESSIONAL_FEE = 6 * 10**18; // 6 MATIC (~$4.80-7.20)
    uint256 private constant MUMBAI_ENTERPRISE_FEE = 12 * 10**18; // 12 MATIC (~$9.60-14.40)
    
    uint256 private constant BSC_TESTNET_BASIC_FEE = 0.005 * 10**18; // 0.005 tBNB (~$1.50-2.50)
    uint256 private constant BSC_TESTNET_PROFESSIONAL_FEE = 0.015 * 10**18; // 0.015 tBNB (~$4.50-7.50)
    uint256 private constant BSC_TESTNET_ENTERPRISE_FEE = 0.03 * 10**18; // 0.03 tBNB (~$9-15)
    
    // Token metadata struct to reduce stack depth
    using TokenStructs for *;
    constructor() ERC20("", "") Ownable(msg.sender) {}
    
    function initialize(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply,
        address freezingAuthority_,
        TokenStructs.TokenMetadata memory meta,
        bool renounceMint,
        TokenStructs.TokenConfig memory config,
        address platformWallet_,
        uint256 serviceFee_,
        uint256 chainId_,
        address initialOwner
    ) external {
        require(!isInitialized, "TokenImplementation: Already initialized");
        
        // Set owner if not already set (first initialization)
        if (owner() == address(0)) {
            _transferOwnership(initialOwner);
        } else {
            require(msg.sender == owner(), "TokenImplementation: Only owner can initialize");
        }
        
        isInitialized = true;
        _decimals = decimals_;
        _logo = meta.logo;
        _website = meta.website;
        _description = meta.description;
        _twitter = meta.twitter;
        _telegram = meta.telegram;
        _discord = meta.discord;
        _github = meta.github;
        _medium = meta.medium;
        _reddit = meta.reddit;
        _maxTxAmount = config.maxTxAmount;
        _maxWalletAmount = config.maxWalletAmount;
        _cooldownPeriod = config.cooldownPeriod;
        _timelockDelay = config.timelockDelay;
        platformWallet = platformWallet_;
        serviceFee = serviceFee_;
        chainId = chainId_;
        if (config.enableBlacklist || config.maxTxAmount > 0 || config.enableAntiBot || config.cooldownPeriod > 0) {
            isProfessionalPlan = true;
        }
        if (config.enableAntiWhale || config.enablePause || config.enableTimelock || config.maxWalletAmount > 0) {
            isEnterprisePlan = true;
            isProfessionalPlan = true;
        }
        uint256 expectedFee = getExpectedServiceFee(chainId_, isProfessionalPlan, isEnterprisePlan);
        require(serviceFee_ >= expectedFee, "TokenImplementation: Insufficient service fee for this network and plan");
        if (isProfessionalPlan || isEnterprisePlan) {
            freezingAuthority = freezingAuthority_;
            blacklistAuthority = config.enableBlacklist ? initialOwner : address(0);
        }
        antiBotEnabled = config.enableAntiBot;
        antiWhaleEnabled = config.enableAntiWhale;
        maxWalletEnabled = config.maxWalletAmount > 0;
        timelockEnabled = config.enableTimelock;
        _isExcludedFromLimits[initialOwner] = true;
        if (initialSupply > 0) {
            _mint(initialOwner, initialSupply);
        }
        if (renounceMint) {
            mintAuthorityRemoved = true;
        }
        emit TokenInitialized(initialOwner, name, symbol, decimals_, initialSupply);
    }
    
    /**
     * @dev Get the expected service fee for a given network and plan
     * @param networkChainId The chain ID of the network
     * @param isProfessional Whether this is a professional plan
     * @param isEnterprise Whether this is an enterprise plan
     * @return The expected service fee in wei
     */
    function getExpectedServiceFee(uint256 networkChainId, bool isProfessional, bool isEnterprise) public pure returns (uint256) {
        if (isEnterprise) {
            if (networkChainId == 1) return ETHEREUM_ENTERPRISE_FEE;
            if (networkChainId == 137) return POLYGON_ENTERPRISE_FEE;
            if (networkChainId == 56) return BSC_ENTERPRISE_FEE;
            if (networkChainId == 42161) return ARBITRUM_ENTERPRISE_FEE;
            if (networkChainId == 10) return OPTIMISM_ENTERPRISE_FEE;
            if (networkChainId == 8453) return BASE_ENTERPRISE_FEE;
            if (networkChainId == 11155111) return SEPOLIA_ENTERPRISE_FEE;
            if (networkChainId == 80001) return MUMBAI_ENTERPRISE_FEE;
            if (networkChainId == 97) return BSC_TESTNET_ENTERPRISE_FEE;
        } else if (isProfessional) {
            if (networkChainId == 1) return ETHEREUM_PROFESSIONAL_FEE;
            if (networkChainId == 137) return POLYGON_PROFESSIONAL_FEE;
            if (networkChainId == 56) return BSC_PROFESSIONAL_FEE;
            if (networkChainId == 42161) return ARBITRUM_PROFESSIONAL_FEE;
            if (networkChainId == 10) return OPTIMISM_PROFESSIONAL_FEE;
            if (networkChainId == 8453) return BASE_PROFESSIONAL_FEE;
            if (networkChainId == 11155111) return SEPOLIA_PROFESSIONAL_FEE;
            if (networkChainId == 80001) return MUMBAI_PROFESSIONAL_FEE;
            if (networkChainId == 97) return BSC_TESTNET_PROFESSIONAL_FEE;
        } else {
            if (networkChainId == 1) return ETHEREUM_BASIC_FEE;
            if (networkChainId == 137) return POLYGON_BASIC_FEE;
            if (networkChainId == 56) return BSC_BASIC_FEE;
            if (networkChainId == 42161) return ARBITRUM_BASIC_FEE;
            if (networkChainId == 10) return OPTIMISM_BASIC_FEE;
            if (networkChainId == 8453) return BASE_BASIC_FEE;
            if (networkChainId == 11155111) return SEPOLIA_BASIC_FEE;
            if (networkChainId == 80001) return MUMBAI_BASIC_FEE;
            if (networkChainId == 97) return BSC_TESTNET_BASIC_FEE;
        }
        
        // Fallback to Ethereum basic fee for unsupported networks
        return ETHEREUM_BASIC_FEE;
    }
    
    // Modifiers
    modifier onlyFreezingAuthority() {
        require(isProfessionalPlan || isEnterprisePlan, "Freezing not available in basic plan");
        require(msg.sender == freezingAuthority, "Not freezing authority");
        _;
    }
    
    modifier onlyBlacklistAuthority() {
        require(isProfessionalPlan || isEnterprisePlan, "Blacklist not available in basic plan");
        require(msg.sender == blacklistAuthority, "Not blacklist authority");
        _;
    }
    
    modifier notFrozen(address account) {
        if (isProfessionalPlan || isEnterprisePlan) {
            require(!_frozen[account], "Account is frozen");
        }
        _;
    }
    
    modifier notBlacklisted(address account) {
        if (isProfessionalPlan || isEnterprisePlan) {
            require(!_blacklisted[account], "Account is blacklisted");
        }
        _;
    }
    
    modifier onlyEnterprisePlan() {
        require(isEnterprisePlan, "Enterprise plan required");
        _;
    }
    
    modifier checkCooldown() {
        if (antiBotEnabled && (isProfessionalPlan || isEnterprisePlan)) {
            require(
                block.timestamp >= _lastTransactionTime[msg.sender] + _cooldownPeriod,
                "Cooldown period not elapsed"
            );
            _lastTransactionTime[msg.sender] = block.timestamp;
        }
        _;
    }
    
    modifier onlyTimelock() {
        if (timelockEnabled && isEnterprisePlan) {
            require(msg.sender == address(this), "Only timelock can execute");
        }
        _;
    }
    
    // Override transfer functions to include security checks
    function _update(address from, address to, uint256 value) internal virtual override {
        require(!paused(), "Token is paused");
        require(from != address(0) || to != address(0), "Invalid transfer");
        
        // Apply security checks based on plan
        if (from != address(0) && to != address(0)) {
            // Regular transfer
            require(!_frozen[from] && !_frozen[to], "Account is frozen");
            require(!_blacklisted[from] && !_blacklisted[to], "Account is blacklisted");
            
            // Check transaction limits
            if (_maxTxAmount > 0 && !_isExcludedFromLimits[from] && !_isExcludedFromLimits[to]) {
                require(value <= _maxTxAmount, "Transfer amount exceeds max transaction amount");
            }
            
            // Check wallet limits
            if (_maxWalletAmount > 0 && !_isExcludedFromLimits[to]) {
                require(balanceOf(to) + value <= _maxWalletAmount, "Transfer would exceed max wallet amount");
            }
        }
        
        super._update(from, to, value);
    }
    
    // Public view functions
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    function logo() public view returns (string memory) {
        return _logo;
    }
    
    function website() public view returns (string memory) {
        return _website;
    }
    
    function description() public view returns (string memory) {
        return _description;
    }
    
    function twitter() public view returns (string memory) {
        return _twitter;
    }
    
    function telegram() public view returns (string memory) {
        return _telegram;
    }
    
    function discord() public view returns (string memory) {
        return _discord;
    }
    
    function github() public view returns (string memory) {
        return _github;
    }
    
    function medium() public view returns (string memory) {
        return _medium;
    }
    
    function reddit() public view returns (string memory) {
        return _reddit;
    }
    
    function maxTxAmount() public view returns (uint256) {
        return _maxTxAmount;
    }
    
    function maxWalletAmount() public view returns (uint256) {
        return _maxWalletAmount;
    }
    
    function cooldownPeriod() public view returns (uint256) {
        return _cooldownPeriod;
    }
    
    function timelockDelay() public view returns (uint256) {
        return _timelockDelay;
    }
    
    // Admin functions
    function mint(address to, uint256 amount) public onlyOwner {
        require(!mintAuthorityRemoved, "Mint authority removed");
        _mint(to, amount);
    }
    
    function removeMintAuthority() public onlyOwner {
        require(!mintAuthorityRemoved, "Mint authority already removed");
        mintAuthorityRemoved = true;
    }
    
    function freeze(address account, bool freezeAccount) public onlyFreezingAuthority returns (bool) {
        require(account != address(0), "Cannot freeze zero address");
        _frozen[account] = freezeAccount;
        emit Freeze(account, freezeAccount);
        return true;
    }
    
    function isFrozen(address account) public view returns (bool) {
        return _frozen[account];
    }
    
    function setFreezingAuthority(address newAuthority) public onlyOwner {
        require(isProfessionalPlan || isEnterprisePlan, "Plan upgrade required");
        freezingAuthority = newAuthority;
    }
    
    function blacklist(address account, bool blacklistAccount) public onlyBlacklistAuthority returns (bool) {
        require(account != address(0), "Cannot blacklist zero address");
        _blacklisted[account] = blacklistAccount;
        emit Blacklist(account, blacklistAccount);
        return true;
    }
    
    function isBlacklisted(address account) public view returns (bool) {
        return _blacklisted[account];
    }
    
    function setBlacklistAuthority(address newAuthority) public onlyOwner {
        require(isProfessionalPlan || isEnterprisePlan, "Plan upgrade required");
        blacklistAuthority = newAuthority;
    }
    
    function setMaxTxAmount(uint256 newMaxTxAmount) public onlyOwner {
        require(isProfessionalPlan || isEnterprisePlan, "Plan upgrade required");
        _maxTxAmount = newMaxTxAmount;
    }
    
    function setMaxWalletAmount(uint256 newMaxWalletAmount) public onlyOwner onlyEnterprisePlan {
        _maxWalletAmount = newMaxWalletAmount;
        maxWalletEnabled = newMaxWalletAmount > 0;
        emit MaxWalletUpdated(newMaxWalletAmount);
    }
    
    function setCooldownPeriod(uint256 newCooldownPeriod) public onlyOwner {
        require(isProfessionalPlan || isEnterprisePlan, "Plan upgrade required");
        _cooldownPeriod = newCooldownPeriod;
        emit CooldownUpdated(newCooldownPeriod);
    }
    
    function excludeFromLimits(address account, bool excluded) public onlyOwner {
        _isExcludedFromLimits[account] = excluded;
    }
    
    function isExcludedFromLimits(address account) public view returns (bool) {
        return _isExcludedFromLimits[account];
    }
    
    // Pause functionality (Enterprise plan only)
    function pause() public onlyOwner onlyEnterprisePlan {
        _pause();
    }
    
    function unpause() public onlyOwner onlyEnterprisePlan {
        _unpause();
    }
    
    // Timelock functionality (Enterprise plan only)
    function scheduleAction(bytes32 actionId, uint256 delay) public onlyOwner onlyEnterprisePlan {
        require(delay >= _timelockDelay, "Delay too short");
        require(_pendingActions[actionId] == 0, "Action already scheduled");
        
        _pendingActions[actionId] = block.timestamp + delay;
        emit TimelockActionScheduled(actionId, block.timestamp + delay);
    }
    
    function executeAction(bytes32 actionId) public onlyOwner onlyEnterprisePlan {
        require(_pendingActions[actionId] > 0, "Action not scheduled");
        require(block.timestamp >= _pendingActions[actionId], "Delay not elapsed");
        
        delete _pendingActions[actionId];
        emit TimelockActionExecuted(actionId);
    }
    
    function getPendingAction(bytes32 actionId) public view returns (uint256) {
        return _pendingActions[actionId];
    }
    
    // Emergency functions
    function emergencyTransfer(address from, address to, uint256 amount) public onlyOwner {
        require(from != address(0) && to != address(0), "Invalid addresses");
        _transfer(from, to, amount);
    }
    
    function emergencyMint(address to, uint256 amount) public onlyOwner {
        require(!mintAuthorityRemoved, "Mint authority removed");
        _mint(to, amount);
    }
    
    // View functions for plan information
    function getPlanInfo() public view returns (
        bool _isProfessionalPlan,
        bool _isEnterprisePlan,
        bool _antiBotEnabled,
        bool _antiWhaleEnabled,
        bool _timelockEnabled,
        bool _maxWalletEnabled,
        uint256 maxTxAmountValue,
        uint256 maxWalletAmountValue,
        uint256 cooldownPeriodValue,
        uint256 timelockDelayValue
    ) {
        return (
            isProfessionalPlan,
            isEnterprisePlan,
            antiBotEnabled,
            antiWhaleEnabled,
            timelockEnabled,
            maxWalletEnabled,
            _maxTxAmount,
            _maxWalletAmount,
            _cooldownPeriod,
            _timelockDelay
        );
    }
} 