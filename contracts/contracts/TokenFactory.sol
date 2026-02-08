// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./TokenStructs.sol";

/**
 * @title TokenFactory
 * @dev Professional token factory using EIP-1167 minimal proxy pattern
 * Supports custom security configurations with all available security features
 * Industry standard implementation following OpenZeppelin best practices
 */
contract TokenFactory is Ownable, ReentrancyGuard, Pausable {
    using Clones for address;
    using SafeERC20 for IERC20;
    
    // Plan enumeration (for service fee calculation)
    enum Plan { Basic, Professional, Enterprise }
    
    // Network-aware service fee mapping
    mapping(uint256 => mapping(Plan => uint256)) public networkServiceFees;
    
    // Platform wallet that receives service fees
    address public immutable platformWallet;
    
    // ERC20 implementation/template address
    address public implementation;
    
    // Deployed tokens tracking
    mapping(address => bool) public deployedTokens;
    address[] public allDeployedTokens;
    
    // Token metadata tracking
    using TokenStructs for *;
    mapping(address => TokenStructs.TokenMetadata) public tokenMetadata;
    
    // Token ownership tracking
    mapping(address => address) public tokenOwners;
    
    // Factory statistics
    uint256 public totalTokensDeployed;
    uint256 public totalServiceFeesCollected;
    
    // Events
    event TokenDeployed(
        address indexed tokenAddress,
        address indexed owner,
        string name,
        string symbol,
        Plan plan,
        uint256 serviceFee,
        uint256 chainId,
        uint256 timestamp
    );
    
    event ServiceFeeUpdated(
        uint256 indexed chainId,
        Plan plan,
        uint256 oldFee,
        uint256 newFee,
        address indexed updater
    );
    
    event ImplementationUpdated(
        address indexed oldImplementation,
        address indexed newImplementation,
        address indexed updater
    );
    
    event PlatformWalletUpdated(
        address indexed oldWallet,
        address indexed newWallet,
        address indexed updater
    );
    
    event FactoryPaused(address indexed pauser);
    event FactoryUnpaused(address indexed unpauser);
    
    /**
     * @dev Constructor sets up the factory with network-specific service fees
     * @param _platformWallet Address that receives service fees
     * @param _implementation Address of the ERC20 implementation/template contract
     */
    constructor(address _platformWallet, address _implementation) Ownable(msg.sender) {
        require(_platformWallet != address(0), "TokenFactory: Invalid platform wallet");
        require(_implementation != address(0), "TokenFactory: Invalid implementation address");
        
        platformWallet = _platformWallet;
        implementation = _implementation;
        
        _initializeServiceFees();
    }
    
    /**
     * @dev Initialize service fees for all supported networks
     * Competitive pricing based on network gas costs and market rates
     */
    function _initializeServiceFees() internal {
        // Ethereum Mainnet
        networkServiceFees[1][Plan.Basic] = 0.05 ether;        // ~$100-150
        networkServiceFees[1][Plan.Professional] = 0.15 ether;  // ~$300-450
        networkServiceFees[1][Plan.Enterprise] = 0.3 ether;     // ~$600-900
        
        // Polygon
        networkServiceFees[137][Plan.Basic] = 25 * 10**18;      // 25 MATIC (~$20-30)
        networkServiceFees[137][Plan.Professional] = 75 * 10**18; // 75 MATIC (~$60-90)
        networkServiceFees[137][Plan.Enterprise] = 150 * 10**18;  // 150 MATIC (~$120-180)
        
        // BSC
        networkServiceFees[56][Plan.Basic] = 0.05 * 10**18;     // 0.05 BNB (~$15-25)
        networkServiceFees[56][Plan.Professional] = 0.15 * 10**18; // 0.15 BNB (~$45-75)
        networkServiceFees[56][Plan.Enterprise] = 0.3 * 10**18;    // 0.3 BNB (~$90-150)
        
        // Arbitrum
        networkServiceFees[42161][Plan.Basic] = 0.01 ether;     // ~$20-30
        networkServiceFees[42161][Plan.Professional] = 0.03 ether; // ~$60-90
        networkServiceFees[42161][Plan.Enterprise] = 0.06 ether;   // ~$120-180
        
        // Optimism
        networkServiceFees[10][Plan.Basic] = 0.015 ether;       // ~$30-45
        networkServiceFees[10][Plan.Professional] = 0.045 ether; // ~$90-135
        networkServiceFees[10][Plan.Enterprise] = 0.09 ether;    // ~$180-270
        
        // Base
        networkServiceFees[8453][Plan.Basic] = 0.01 ether;      // ~$20-30
        networkServiceFees[8453][Plan.Professional] = 0.03 ether; // ~$60-90
        networkServiceFees[8453][Plan.Enterprise] = 0.06 ether;   // ~$120-180
        
        // Testnets (reduced fees for testing)
        networkServiceFees[11155111][Plan.Basic] = 0.001 ether;     // Sepolia
        networkServiceFees[11155111][Plan.Professional] = 0.003 ether;
        networkServiceFees[11155111][Plan.Enterprise] = 0.006 ether;
        
        networkServiceFees[80001][Plan.Basic] = 2 * 10**18;         // Mumbai
        networkServiceFees[80001][Plan.Professional] = 6 * 10**18;
        networkServiceFees[80001][Plan.Enterprise] = 12 * 10**18;
        
        networkServiceFees[97][Plan.Basic] = 0.005 * 10**18;        // BSC Testnet
        networkServiceFees[97][Plan.Professional] = 0.015 * 10**18;
        networkServiceFees[97][Plan.Enterprise] = 0.03 * 10**18;
    }
    
    /**
     * @dev Determine plan based on security features selected
     * @param config The token configuration with security features
     * @return plan The determined plan (Basic, Professional, Enterprise)
     */
    function determinePlan(TokenStructs.TokenConfig memory config) public pure returns (Plan plan) {
        // Enterprise features
        if (config.enableAntiWhale || config.enablePause || config.enableTimelock || config.maxWalletAmount > 0) {
            return Plan.Enterprise;
        }
        // Professional features
        else if (config.enableBlacklist || config.maxTxAmount > 0 || config.enableAntiBot || config.cooldownPeriod > 0) {
            return Plan.Professional;
        }
        // Basic features only
        else {
            return Plan.Basic;
        }
    }
    
    /**
     * @dev Get service fee for a specific network and plan
     * @param chainId The network chain ID
     * @param plan The selected plan
     * @return The service fee in wei
     */
    function getServiceFee(uint256 chainId, Plan plan) public view returns (uint256) {
        uint256 fee = networkServiceFees[chainId][plan];
        if (fee == 0) {
            // Fallback to Ethereum mainnet fees for unsupported networks
            fee = networkServiceFees[1][plan];
        }
        return fee;
    }
    
    /**
     * @dev Deploy a new token with custom security configuration using minimal proxy
     * @param name Token name
     * @param symbol Token symbol
     * @param decimals Token decimals
     * @param initialSupply Initial token supply
     * @param meta Token metadata
     * @param config Custom security configuration
     * @param renounceMint Whether to renounce mint authority
     * @param freezingAuthority Address with freezing authority (if enabled)
     */
    function deployToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 initialSupply,
        TokenStructs.TokenMetadata memory meta,
        TokenStructs.TokenConfig memory config,
        bool renounceMint,
        address freezingAuthority
    ) public payable nonReentrant whenNotPaused {
        require(bytes(name).length > 0, "TokenFactory: Name cannot be empty");
        require(bytes(symbol).length > 0, "TokenFactory: Symbol cannot be empty");
        require(decimals <= 18, "TokenFactory: Decimals cannot exceed 18");
        require(initialSupply > 0, "TokenFactory: Initial supply must be greater than 0");
        
        // Validate security configuration
        require(config.maxTxAmount <= initialSupply, "TokenFactory: Max transaction amount cannot exceed total supply");
        require(config.maxWalletAmount <= initialSupply, "TokenFactory: Max wallet amount cannot exceed total supply");
        require(config.cooldownPeriod <= 3600, "TokenFactory: Cooldown period cannot exceed 1 hour");
        require(config.timelockDelay <= 604800, "TokenFactory: Timelock delay cannot exceed 7 days");
        
        uint256 chainId = block.chainid;
        Plan plan = determinePlan(config);
        uint256 requiredFee = getServiceFee(chainId, plan);
        
        require(msg.value == requiredFee, "TokenFactory: Service fee must be exact amount");
        
        // Forward service fee to platform wallet
        (bool success, ) = platformWallet.call{value: msg.value}("");
        require(success, "TokenFactory: Failed to forward service fee");
        
        // Deploy minimal proxy
        address clone = implementation.clone();
        
        // Call initialize on the new proxy with custom configuration
        (bool ok, ) = clone.call(
            abi.encodeWithSignature(
                "initialize(string,string,uint8,uint256,address,(string,string,string,string,string,string,string,string,string),bool,(bool,bool,bool,bool,bool,uint256,uint256,uint256,uint256),address,uint256,uint256,address)",
                name,
                symbol,
                decimals,
                initialSupply,
                freezingAuthority != address(0) ? freezingAuthority : msg.sender, // freezingAuthority
                meta,
                renounceMint,
                config,
                platformWallet,
                requiredFee,
                chainId,
                msg.sender  // initialOwner (the token creator)
            )
        );
        require(ok, "TokenFactory: Initialization failed");
        
        // Track deployed token
        deployedTokens[clone] = true;
        allDeployedTokens.push(clone);
        
        // Store token metadata with owner
        tokenMetadata[clone] = meta;
        tokenOwners[clone] = msg.sender;
        
        // Update statistics
        totalTokensDeployed++;
        totalServiceFeesCollected += requiredFee;
        
        // Emit deployment event
        emit TokenDeployed(
            clone,
            msg.sender,
            name,
            symbol,
            plan,
            requiredFee,
            chainId,
            block.timestamp
        );
    }
    
    /**
     * @dev Deploy a new token with plan selection (legacy function for backward compatibility)
     * @param name Token name
     * @param symbol Token symbol
     * @param decimals Token decimals
     * @param initialSupply Initial token supply
     * @param meta Token metadata
     * @param plan Selected plan (Basic, Professional, Enterprise)
     * @param renounceMint Whether to renounce mint authority
     */
    function deployTokenWithPlan(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 initialSupply,
        TokenStructs.TokenMetadata memory meta,
        Plan plan,
        bool renounceMint
    ) external payable nonReentrant whenNotPaused {
        require(bytes(name).length > 0, "TokenFactory: Name cannot be empty");
        require(bytes(symbol).length > 0, "TokenFactory: Symbol cannot be empty");
        require(decimals <= 18, "TokenFactory: Decimals cannot exceed 18");
        require(initialSupply > 0, "TokenFactory: Initial supply must be greater than 0");
        require(plan <= Plan.Enterprise, "TokenFactory: Invalid plan");
        
        // Create configuration based on plan
        TokenStructs.TokenConfig memory config;
        
        if (plan == Plan.Basic) {
            config = TokenStructs.TokenConfig({
                enableBlacklist: false,
                enableAntiBot: false,
                enableAntiWhale: false,
                enablePause: false,
                enableTimelock: false,
                maxTxAmount: 0,
                maxWalletAmount: 0,
                cooldownPeriod: 0,
                timelockDelay: 0
            });
        } else if (plan == Plan.Professional) {
            config = TokenStructs.TokenConfig({
                enableBlacklist: true,
                enableAntiBot: true,
                enableAntiWhale: false,
                enablePause: false,
                enableTimelock: false,
                maxTxAmount: 10000 * 10**18, // 10k max tx
                maxWalletAmount: 0,
                cooldownPeriod: 30, // 30 seconds
                timelockDelay: 0
            });
        } else if (plan == Plan.Enterprise) {
            config = TokenStructs.TokenConfig({
                enableBlacklist: true,
                enableAntiBot: true,
                enableAntiWhale: true,
                enablePause: true,
                enableTimelock: true,
                maxTxAmount: 5000 * 10**18, // 5k max tx
                maxWalletAmount: 50000 * 10**18, // 50k max wallet
                cooldownPeriod: 60, // 60 seconds
                timelockDelay: 86400 // 24 hours
            });
        }
        
        // Deploy using the custom configuration function
        deployToken(
            name,
            symbol,
            decimals,
            initialSupply,
            meta,
            config,
            renounceMint,
            msg.sender
        );
    }
    
    /**
     * @dev Get all deployed tokens
     * @return Array of all deployed token addresses
     */
    function getAllDeployedTokens() external view returns (address[] memory) {
        return allDeployedTokens;
    }
    
    /**
     * @dev Get deployed tokens count
     * @return Number of deployed tokens
     */
    function getDeployedTokensCount() external view returns (uint256) {
        return allDeployedTokens.length;
    }
    
    /**
     * @dev Check if an address is a deployed token
     * @param tokenAddress Address to check
     * @return True if the address is a deployed token
     */
    function isDeployedToken(address tokenAddress) external view returns (bool) {
        return deployedTokens[tokenAddress];
    }
    
    /**
     * @dev Get token metadata
     * @param tokenAddress Address of the token
     * @return metadata The token metadata
     */
    function getTokenMetadata(address tokenAddress) external view returns (TokenStructs.TokenMetadata memory) {
        require(deployedTokens[tokenAddress], "TokenFactory: Token not found");
        return tokenMetadata[tokenAddress];
    }
    
    /**
     * @dev Get tokens deployed by a specific owner
     * @param owner Address of the token owner
     * @return Array of token addresses deployed by the owner
     */
    function getTokensByOwner(address owner) external view returns (address[] memory) {
        address[] memory ownerTokens = new address[](allDeployedTokens.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < allDeployedTokens.length; i++) {
            if (tokenOwners[allDeployedTokens[i]] == owner) {
                ownerTokens[count] = allDeployedTokens[i];
                count++;
            }
        }
        
        // Resize array to actual count
        assembly {
            mstore(ownerTokens, count)
        }
        
        return ownerTokens;
    }
    
    /**
     * @dev Get factory statistics
     * @return _totalTokensDeployed Total number of tokens deployed
     * @return _totalServiceFeesCollected Total service fees collected
     * @return _deployedTokensCount Current number of deployed tokens
     * @return _chainId Current chain ID
     * @return _platformWallet Platform wallet address
     * @return _implementation Implementation contract address
     */
    function getFactoryStats() external view returns (
        uint256 _totalTokensDeployed,
        uint256 _totalServiceFeesCollected,
        uint256 _deployedTokensCount,
        uint256 _chainId,
        address _platformWallet,
        address _implementation
    ) {
        return (
            totalTokensDeployed,
            totalServiceFeesCollected,
            allDeployedTokens.length,
            block.chainid,
            platformWallet,
            implementation
        );
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Update service fee for a specific network and plan (owner only)
     * @param chainId The network chain ID
     * @param plan The plan to update
     * @param newFee The new service fee
     */
    function updateServiceFee(uint256 chainId, Plan plan, uint256 newFee) external onlyOwner {
        require(plan <= Plan.Enterprise, "TokenFactory: Invalid plan");
        require(newFee > 0, "TokenFactory: Fee must be greater than 0");
        
        uint256 oldFee = networkServiceFees[chainId][plan];
        networkServiceFees[chainId][plan] = newFee;
        
        emit ServiceFeeUpdated(chainId, plan, oldFee, newFee, msg.sender);
    }
    
    /**
     * @dev Update implementation address (owner only)
     * @param newImplementation New implementation address
     */
    function updateImplementation(address newImplementation) external onlyOwner {
        require(newImplementation != address(0), "TokenFactory: Invalid implementation address");
        
        address oldImplementation = implementation;
        implementation = newImplementation;
        
        emit ImplementationUpdated(oldImplementation, newImplementation, msg.sender);
    }
    
    /**
     * @dev Pause factory (owner only)
     */
    function pause() external onlyOwner {
        _pause();
        emit FactoryPaused(msg.sender);
    }
    
    /**
     * @dev Unpause factory (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
        emit FactoryUnpaused(msg.sender);
    }
    
    /**
     * @dev Emergency function to recover stuck tokens (owner only)
     * @param tokenAddress Address of the token to recover
     * @param to Address to send tokens to
     * @param amount Amount to recover
     */
    function emergencyRecover(address tokenAddress, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "TokenFactory: Invalid recipient address");
        require(amount > 0, "TokenFactory: Amount must be greater than 0");
        require(tokenAddress != address(0), "TokenFactory: Use emergencyRecoverETH for ETH");
        
        IERC20(tokenAddress).safeTransfer(to, amount);
    }
    
    /**
     * @dev Emergency function to recover stuck ETH (owner only)
     * @param to Address to send ETH to
     * @param amount Amount to recover
     */
    function emergencyRecoverETH(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "TokenFactory: Invalid recipient address");
        require(amount > 0, "TokenFactory: Amount must be greater than 0");
        require(amount <= address(this).balance, "TokenFactory: Insufficient balance");
        
        (bool success, ) = to.call{value: amount}("");
        require(success, "TokenFactory: ETH transfer failed");
    }
} 