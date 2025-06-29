// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title Enhanced CrossChainBridge
 * @dev Advanced cross-chain bridge for supporting smaller/newer blockchain networks
 * Features: Multi-signature validation, gas optimization, network-specific configurations
 */
contract CrossChainBridge is ReentrancyGuard, Pausable, Ownable, EIP712 {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // Bridge events
    event TokenLocked(
        address indexed token,
        address indexed sender,
        uint256 amount,
        uint256 targetChainId,
        address targetRecipient,
        bytes32 indexed transferId,
        uint256 timestamp
    );
    
    event TokenUnlocked(
        address indexed token,
        address indexed recipient,
        uint256 amount,
        uint256 sourceChainId,
        bytes32 indexed transferId,
        uint256 timestamp
    );

    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    event ChainSupported(uint256 indexed chainId, bool supported);
    event TokenSupported(address indexed token, bool supported);
    event FeeUpdated(uint256 indexed chainId, uint256 fee);
    event MinAmountUpdated(uint256 indexed chainId, uint256 minAmount);
    event MaxAmountUpdated(uint256 indexed chainId, uint256 maxAmount);

    // Bridge state
    mapping(bytes32 => bool) public processedTransfers;
    mapping(uint256 => ChainConfig) public chainConfigs;
    mapping(address => TokenConfig) public tokenConfigs;
    mapping(address => bool) public validators;
    mapping(address => uint256) public validatorNonces;
    
    // Multi-signature configuration
    uint256 public requiredSignatures;
    uint256 public validatorCount;
    
    // Gas optimization for smaller networks
    uint256 public constant GAS_LIMIT_BUFFER = 50000;
    uint256 public constant MAX_BATCH_SIZE = 10;
    
    // Structs for better organization
    struct ChainConfig {
        bool supported;
        uint256 fee; // Fee in basis points (1 = 0.01%)
        uint256 minAmount;
        uint256 maxAmount;
        uint256 gasLimit;
        uint256 blockTime;
        bool requiresMultipleSignatures;
        uint256 maxDailyVolume;
        uint256 dailyVolume;
        uint256 lastVolumeReset;
    }
    
    struct TokenConfig {
        bool supported;
        uint256 decimals;
        bool isNative;
        uint256 maxDailyVolume;
        uint256 dailyVolume;
        uint256 lastVolumeReset;
    }
    
    struct TransferRequest {
        address token;
        address sender;
        uint256 amount;
        uint256 targetChainId;
        address targetRecipient;
        uint256 timestamp;
        uint256 nonce;
    }

    // EIP-712 domain separator
    bytes32 public constant TRANSFER_TYPEHASH = keccak256(
        "TransferRequest(address token,address sender,uint256 amount,uint256 targetChainId,address targetRecipient,uint256 timestamp,uint256 nonce)"
    );

    /**
     * @dev Configure chain settings (internal)
     */
    function _configureChain(
        uint256 chainId,
        bool supported,
        uint256 fee,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 gasLimit,
        uint256 blockTime,
        bool requiresMultipleSignatures,
        uint256 maxDailyVolume
    ) internal {
        chainConfigs[chainId] = ChainConfig({
            supported: supported,
            fee: fee,
            minAmount: minAmount,
            maxAmount: maxAmount,
            gasLimit: gasLimit,
            blockTime: blockTime,
            requiresMultipleSignatures: requiresMultipleSignatures,
            maxDailyVolume: maxDailyVolume,
            dailyVolume: 0,
            lastVolumeReset: block.timestamp
        });
        
        emit ChainSupported(chainId, supported);
    }

    /**
     * @dev Configure chain settings (external admin function)
     */
    function configureChain(
        uint256 chainId,
        bool supported,
        uint256 fee,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 gasLimit,
        uint256 blockTime,
        bool requiresMultipleSignatures,
        uint256 maxDailyVolume
    ) external onlyOwner {
        _configureChain(chainId, supported, fee, minAmount, maxAmount, gasLimit, blockTime, requiresMultipleSignatures, maxDailyVolume);
    }

    /**
     * @dev Initialize default chain configurations
     */
    function _initializeDefaultChains() internal {
        // Configure popular networks with reasonable defaults
        _configureChain(1, true, 10, 1e16, 1000e18, 300000, 12, false, 1000000e18); // Ethereum
        _configureChain(137, true, 5, 1e16, 1000000e18, 300000, 2, false, 5000000e18); // Polygon
        _configureChain(56, true, 5, 1e16, 1000000e18, 300000, 3, false, 5000000e18); // BSC
        _configureChain(250, true, 3, 1e16, 1000000e18, 250000, 1, false, 3000000e18); // Fantom
        _configureChain(43114, true, 5, 1e16, 1000000e18, 800000, 2, false, 3000000e18); // Avalanche
        _configureChain(42161, true, 3, 1e16, 1000000e18, 1000000, 1, false, 5000000e18); // Arbitrum
        _configureChain(10, true, 3, 1e16, 1000000e18, 300000, 2, false, 5000000e18); // Optimism
        _configureChain(804, true, 3, 1e16, 1000000e18, 300000, 3, false, 5000000e18); // PulseChain
        _configureChain(100, true, 5, 1e16, 1000000e18, 300000, 5, false, 2000000e18); // Gnosis Chain
        _configureChain(8453, true, 5, 1e16, 1000000e18, 300000, 2, false, 2000000e18); // Base
        _configureChain(59144, true, 5, 1e16, 1000000e18, 300000, 12, false, 2000000e18); // Linea
        _configureChain(1101, true, 3, 1e16, 1000000e18, 300000, 1, false, 3000000e18); // Polygon zkEVM
        _configureChain(324, true, 3, 1e16, 1000000e18, 300000, 1, false, 3000000e18); // zkSync Era
        _configureChain(534352, true, 3, 1e16, 1000000e18, 300000, 2, false, 3000000e18); // Scroll
        _configureChain(1284, true, 5, 1e16, 1000000e18, 150000, 12, false, 1000000e18); // Moonbeam
        _configureChain(1285, true, 5, 1e16, 1000000e18, 150000, 12, false, 1000000e18); // Moonriver
    }

    constructor() EIP712("CrossChainBridge", "1.0") Ownable(msg.sender) {
        validators[msg.sender] = true;
        validatorCount = 1;
        requiredSignatures = 1;
        
        // Initialize default chain configurations
        _initializeDefaultChains();
    }

    /**
     * @dev Lock tokens for cross-chain transfer
     */
    function lockTokens(
        address token,
        uint256 amount,
        uint256 targetChainId,
        address targetRecipient
    ) external nonReentrant whenNotPaused {
        require(tokenConfigs[token].supported, "Bridge: Token not supported");
        require(chainConfigs[targetChainId].supported, "Bridge: Chain not supported");
        require(amount > 0, "Bridge: Amount must be greater than 0");
        require(targetRecipient != address(0), "Bridge: Invalid recipient");
        
        ChainConfig storage chainConfig = chainConfigs[targetChainId];
        TokenConfig storage tokenConfig = tokenConfigs[token];
        
        // Check amount limits
        require(amount >= chainConfig.minAmount, "Bridge: Amount below minimum");
        require(amount <= chainConfig.maxAmount, "Bridge: Amount above maximum");
        
        // Check daily volume limits
        _checkDailyVolumeLimits(chainConfig, tokenConfig, amount);
        
        // Calculate and collect fee
        uint256 fee = (amount * chainConfig.fee) / 10000;
        uint256 transferAmount = amount - fee;
        
        // Transfer tokens from user to bridge
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Transfer fee to owner (or fee collector)
        if (fee > 0) {
            IERC20(token).safeTransfer(owner(), fee);
        }

        // Generate transfer ID
        bytes32 transferId = _generateTransferId(
            token,
            msg.sender,
            transferAmount,
            targetChainId,
            targetRecipient
        );

        // Update daily volumes
        _updateDailyVolumes(chainConfig, tokenConfig, transferAmount);

        emit TokenLocked(
            token,
            msg.sender,
            transferAmount,
            targetChainId,
            targetRecipient,
            transferId,
            block.timestamp
        );
    }

    /**
     * @dev Unlock tokens from cross-chain transfer (validator only)
     */
    function unlockTokens(
        address token,
        address recipient,
        uint256 amount,
        uint256 sourceChainId,
        bytes32 transferId,
        bytes calldata signatures
    ) external nonReentrant whenNotPaused {
        require(validators[msg.sender], "Bridge: Only validators can unlock");
        require(!processedTransfers[transferId], "Bridge: Transfer already processed");
        require(tokenConfigs[token].supported, "Bridge: Token not supported");
        require(amount > 0, "Bridge: Amount must be greater than 0");
        require(recipient != address(0), "Bridge: Invalid recipient");

        // Verify signatures
        require(_verifySignatures(transferId, signatures), "Bridge: Invalid signatures");

        processedTransfers[transferId] = true;

        // Transfer tokens to recipient
        IERC20(token).safeTransfer(recipient, amount);

        emit TokenUnlocked(
            token,
            recipient,
            amount,
            sourceChainId,
            transferId,
            block.timestamp
        );
    }

    /**
     * @dev Batch unlock tokens for gas optimization on smaller networks
     */
    function batchUnlockTokens(
        address[] calldata tokens,
        address[] calldata recipients,
        uint256[] calldata amounts,
        uint256[] calldata sourceChainIds,
        bytes32[] calldata transferIds,
        bytes[] calldata signatures
    ) external nonReentrant whenNotPaused {
        require(validators[msg.sender], "Bridge: Only validators can unlock");
        require(tokens.length <= MAX_BATCH_SIZE, "Bridge: Batch too large");
        require(
            tokens.length == recipients.length &&
            tokens.length == amounts.length &&
            tokens.length == sourceChainIds.length &&
            tokens.length == transferIds.length &&
            tokens.length == signatures.length,
            "Bridge: Array length mismatch"
        );

        for (uint256 i = 0; i < tokens.length; i++) {
            require(!processedTransfers[transferIds[i]], "Bridge: Transfer already processed");
            require(tokenConfigs[tokens[i]].supported, "Bridge: Token not supported");
            require(amounts[i] > 0, "Bridge: Amount must be greater than 0");
            require(recipients[i] != address(0), "Bridge: Invalid recipient");

            // Verify signature
            require(_verifySignature(transferIds[i], signatures[i]), "Bridge: Invalid signature");

            processedTransfers[transferIds[i]] = true;
            IERC20(tokens[i]).safeTransfer(recipients[i], amounts[i]);

            emit TokenUnlocked(
                tokens[i],
                recipients[i],
                amounts[i],
                sourceChainIds[i],
                transferIds[i],
                block.timestamp
            );
        }
    }

    // Admin functions
    function addValidator(address validator) external onlyOwner {
        require(validator != address(0), "Bridge: Invalid validator address");
        require(!validators[validator], "Bridge: Validator already exists");
        
        validators[validator] = true;
        validatorCount++;
        
        emit ValidatorAdded(validator);
    }

    function removeValidator(address validator) external onlyOwner {
        require(validators[validator], "Bridge: Validator does not exist");
        require(validatorCount > requiredSignatures, "Bridge: Too few validators");
        
        validators[validator] = false;
        validatorCount--;
        
        emit ValidatorRemoved(validator);
    }

    function setRequiredSignatures(uint256 _requiredSignatures) external onlyOwner {
        require(_requiredSignatures <= validatorCount, "Bridge: Too many required signatures");
        require(_requiredSignatures > 0, "Bridge: At least one signature required");
        
        requiredSignatures = _requiredSignatures;
    }

    function configureToken(
        address token,
        bool supported,
        uint256 decimals,
        bool isNative,
        uint256 maxDailyVolume
    ) external onlyOwner {
        tokenConfigs[token] = TokenConfig({
            supported: supported,
            decimals: decimals,
            isNative: isNative,
            maxDailyVolume: maxDailyVolume,
            dailyVolume: 0,
            lastVolumeReset: block.timestamp
        });
        
        emit TokenSupported(token, supported);
    }

    // View functions
    function getChainConfig(uint256 chainId) external view returns (ChainConfig memory) {
        return chainConfigs[chainId];
    }

    function getTokenConfig(address token) external view returns (TokenConfig memory) {
        return tokenConfigs[token];
    }

    function isTransferProcessed(bytes32 transferId) external view returns (bool) {
        return processedTransfers[transferId];
    }

    function getBridgeBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    function estimateGasForUnlock(uint256 chainId) external view returns (uint256) {
        ChainConfig storage config = chainConfigs[chainId];
        return config.gasLimit + GAS_LIMIT_BUFFER;
    }

    // Internal functions
    function _generateTransferId(
        address token,
        address sender,
        uint256 amount,
        uint256 targetChainId,
        address targetRecipient
    ) internal returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                token,
                sender,
                amount,
                targetChainId,
                targetRecipient,
                block.chainid,
                block.timestamp,
                validatorNonces[sender]++
            )
        );
    }

    function _verifySignatures(bytes32 transferId, bytes calldata signatures) internal view returns (bool) {
        require(signatures.length >= requiredSignatures * 65, "Bridge: Insufficient signatures");
        
        bytes32 hash = _hashTypedDataV4(transferId);
        address[] memory signers = new address[](requiredSignatures);
        
        for (uint256 i = 0; i < requiredSignatures; i++) {
            bytes memory signature = signatures[i * 65:(i + 1) * 65];
            address signer = hash.recover(signature);
            
            if (!validators[signer]) {
                return false;
            }
            
            // Check for duplicate signatures
            for (uint256 j = 0; j < i; j++) {
                if (signers[j] == signer) {
                    return false;
                }
            }
            
            signers[i] = signer;
        }
        
        return true;
    }

    function _verifySignature(bytes32 transferId, bytes calldata signature) internal view returns (bool) {
        bytes32 hash = _hashTypedDataV4(transferId);
        address signer = hash.recover(signature);
        return validators[signer];
    }

    function _checkDailyVolumeLimits(
        ChainConfig storage chainConfig,
        TokenConfig storage tokenConfig,
        uint256 amount
    ) internal view {
        // Reset daily volumes if 24 hours have passed
        if (block.timestamp - chainConfig.lastVolumeReset >= 1 days) {
            // Volume will be reset in _updateDailyVolumes
        } else {
            require(
                chainConfig.dailyVolume + amount <= chainConfig.maxDailyVolume,
                "Bridge: Chain daily volume limit exceeded"
            );
            require(
                tokenConfig.dailyVolume + amount <= tokenConfig.maxDailyVolume,
                "Bridge: Token daily volume limit exceeded"
            );
        }
    }

    function _updateDailyVolumes(
        ChainConfig storage chainConfig,
        TokenConfig storage tokenConfig,
        uint256 amount
    ) internal {
        // Reset daily volumes if 24 hours have passed
        if (block.timestamp - chainConfig.lastVolumeReset >= 1 days) {
            chainConfig.dailyVolume = 0;
            chainConfig.lastVolumeReset = block.timestamp;
        }
        
        if (block.timestamp - tokenConfig.lastVolumeReset >= 1 days) {
            tokenConfig.dailyVolume = 0;
            tokenConfig.lastVolumeReset = block.timestamp;
        }
        
        chainConfig.dailyVolume += amount;
        tokenConfig.dailyVolume += amount;
    }

    // Emergency functions
    function emergencyWithdraw(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
} 