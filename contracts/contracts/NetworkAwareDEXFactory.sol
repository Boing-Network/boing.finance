// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IDEXFactory.sol";
import "./interfaces/IDEXPair.sol";
import "./DEXPair.sol";

/**
 * @title NetworkAwareDEXFactory
 * @dev Factory contract optimized for smaller/newer blockchain networks
 * Features: Network-specific configurations, gas optimization, adaptive fees
 */
contract NetworkAwareDEXFactory is IDEXFactory, Ownable, ReentrancyGuard, Pausable {
    // Mapping from token pair to pair address
    mapping(address => mapping(address => address)) private _getPair;
    
    // Array of all pairs
    address[] public allPairs;
    
    // Network-specific configurations
    mapping(uint256 => NetworkConfig) public networkConfigs;
    
    // Cross-chain bridge addresses
    mapping(uint256 => address) public bridgeAddresses; // chainId => bridge address
    
    // Events
    event NetworkConfigured(uint256 indexed chainId, NetworkConfig config);
    event FeeUpdated(uint256 indexed chainId, uint256 newFeeRate);
    event GasOptimizationEnabled(uint256 indexed chainId, bool enabled);
    
    // Structs
    struct NetworkConfig {
        bool supported;
        uint256 feeRate; // Fee in basis points (30 = 0.3%)
        uint256 feeDenominator;
        uint256 gasLimit;
        uint256 blockTime;
        bool gasOptimizationEnabled;
        uint256 maxPairsPerToken;
        uint256 minLiquidity;
        bool adaptiveFees;
        uint256 volumeThreshold;
        uint256 highVolumeFee;
        uint256 lowVolumeFee;
    }
    
    constructor() Ownable(msg.sender) {
        // Initialize default network configurations
        _initializeDefaultNetworks();
    }
    
    /**
     * @dev Create a new trading pair with network-specific optimizations
     */
    function createPair(address tokenA, address tokenB) 
        external 
        whenNotPaused 
        returns (address pair) 
    {
        require(tokenA != tokenB, "DEXFactory: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "DEXFactory: ZERO_ADDRESS");
        require(_getPair[token0][token1] == address(0), "DEXFactory: PAIR_EXISTS");
        
        // Check network configuration
        uint256 chainId = block.chainid;
        NetworkConfig storage config = networkConfigs[chainId];
        require(config.supported, "DEXFactory: Network not supported");
        
        // Check pair limits for this network
        _checkPairLimits(token0, token1, config);
        
        // Create the pair contract with network-specific parameters
        bytes memory bytecode = type(DEXPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1, chainId));
        
        assembly {
            pair := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        
        // Initialize pair with network-specific configuration
        IDEXPair(pair).initialize(token0, token1);
        
        // Set network-specific parameters
        _configurePairForNetwork(pair, config);
        
        _getPair[token0][token1] = pair;
        _getPair[token1][token0] = pair;
        allPairs.push(pair);
    }
    
    /**
     * @dev Configure network-specific settings (internal version)
     */
    function _configureNetwork(
        uint256 chainId,
        bool supported,
        uint256 _feeRate,
        uint256 gasLimit,
        uint256 blockTime,
        bool gasOptimizationEnabled,
        uint256 maxPairsPerToken,
        uint256 minLiquidity,
        bool adaptiveFees,
        uint256 volumeThreshold,
        uint256 highVolumeFee,
        uint256 lowVolumeFee
    ) internal {
        networkConfigs[chainId] = NetworkConfig({
            supported: supported,
            feeRate: _feeRate,
            feeDenominator: 10000,
            gasLimit: gasLimit,
            blockTime: blockTime,
            gasOptimizationEnabled: gasOptimizationEnabled,
            maxPairsPerToken: maxPairsPerToken,
            minLiquidity: minLiquidity,
            adaptiveFees: adaptiveFees,
            volumeThreshold: volumeThreshold,
            highVolumeFee: highVolumeFee,
            lowVolumeFee: lowVolumeFee
        });
        
        emit NetworkConfigured(chainId, networkConfigs[chainId]);
    }
    
    /**
     * @dev Configure network-specific settings (external version)
     */
    function configureNetwork(
        uint256 chainId,
        bool supported,
        uint256 _feeRate,
        uint256 gasLimit,
        uint256 blockTime,
        bool gasOptimizationEnabled,
        uint256 maxPairsPerToken,
        uint256 minLiquidity,
        bool adaptiveFees,
        uint256 volumeThreshold,
        uint256 highVolumeFee,
        uint256 lowVolumeFee
    ) external onlyOwner {
        _configureNetwork(chainId, supported, _feeRate, gasLimit, blockTime, gasOptimizationEnabled, maxPairsPerToken, minLiquidity, adaptiveFees, volumeThreshold, highVolumeFee, lowVolumeFee);
    }
    
    /**
     * @dev Get adaptive fee based on volume for smaller networks
     */
    function getAdaptiveFee(address token0, address token1) external view returns (uint256) {
        uint256 chainId = block.chainid;
        NetworkConfig storage config = networkConfigs[chainId];
        
        if (!config.adaptiveFees) {
            return config.feeRate;
        }
        
        // Get pair address
        (address t0, address t1) = token0 < token1 ? (token0, token1) : (token1, token0);
        address pairAddress = _getPair[t0][t1];
        
        if (pairAddress == address(0)) {
            return config.lowVolumeFee; // New pairs start with low fee
        }
        
        // Get volume from pair (this would need to be implemented in DEXPair)
        // For now, return default fee
        return config.feeRate;
    }
    
    /**
     * @dev Get network configuration
     */
    function getNetworkConfig(uint256 chainId) external view returns (NetworkConfig memory) {
        return networkConfigs[chainId];
    }
    
    /**
     * @dev Get current network configuration
     */
    function getCurrentNetworkConfig() external view returns (NetworkConfig memory) {
        return networkConfigs[block.chainid];
    }
    
    /**
     * @dev Estimate gas for pair creation on specific network
     */
    function estimateGasForPairCreation(uint256 chainId) external view returns (uint256) {
        NetworkConfig storage config = networkConfigs[chainId];
        if (!config.supported) return 0;
        
        uint256 baseGas = 500000; // Base gas for pair creation
        uint256 networkGas = config.gasLimit;
        
        if (config.gasOptimizationEnabled) {
            return baseGas + (networkGas / 2); // Optimized for smaller networks
        }
        
        return baseGas + networkGas;
    }
    
    /**
     * @dev Get all pairs count
     */
    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }
    
    /**
     * @dev Update fee rate for specific network
     */
    function setNetworkFeeRate(uint256 chainId, uint256 _feeRate) external onlyOwner {
        require(networkConfigs[chainId].supported, "DEXFactory: Network not supported");
        require(_feeRate <= 1000, "DEXFactory: FEE_TOO_HIGH"); // Max 10%
        networkConfigs[chainId].feeRate = _feeRate;
        emit FeeUpdated(chainId, _feeRate);
    }
    
    /**
     * @dev Set bridge address for cross-chain operations
     */
    function setBridgeAddress(uint256 chainId, address bridgeAddress) external onlyOwner {
        bridgeAddresses[chainId] = bridgeAddress;
        emit BridgeAddressUpdated(chainId, bridgeAddress);
    }
    
    /**
     * @dev Enable/disable gas optimization for network
     */
    function setGasOptimization(uint256 chainId, bool enabled) external onlyOwner {
        require(networkConfigs[chainId].supported, "DEXFactory: Network not supported");
        networkConfigs[chainId].gasOptimizationEnabled = enabled;
        emit GasOptimizationEnabled(chainId, enabled);
    }
    
    /**
     * @dev Pause factory operations
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause factory operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get pair address for two tokens
     */
    function getPair(address tokenA, address tokenB) public view returns (address pair) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        return _getPair[token0][token1];
    }
    
    /**
     * @dev Check if pair exists
     */
    function pairExists(address tokenA, address tokenB) 
        external 
        view 
        returns (bool) 
    {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        return _getPair[token0][token1] != address(0);
    }
    
    /**
     * @dev Get fee rate for current network
     */
    function feeRate() external view returns (uint256) {
        return networkConfigs[block.chainid].feeRate;
    }
    
    /**
     * @dev Get fee denominator for current network
     */
    function feeDenominator() external view returns (uint256) {
        return networkConfigs[block.chainid].feeDenominator;
    }
    
    function setFeeRate(uint256 _feeRate) external onlyOwner {
        require(_feeRate <= 1000, "DEXFactory: FEE_TOO_HIGH"); // Max 10%
        networkConfigs[block.chainid].feeRate = _feeRate;
        emit FeeUpdated(_feeRate);
    }
    
    function getPairAddress(address tokenA, address tokenB) external view override returns (address) {
        return getPair(tokenA, tokenB);
    }
    
    // Internal functions
    function _checkPairLimits(address token0, address token1, NetworkConfig storage config) internal view {
        // Count existing pairs for token0
        uint256 token0Pairs = 0;
        uint256 token1Pairs = 0;
        
        for (uint256 i = 0; i < allPairs.length; i++) {
            address pair = allPairs[i];
            // This would need to be implemented to check pair tokens
            // For now, we'll skip this check
        }
        
        require(
            token0Pairs < config.maxPairsPerToken && token1Pairs < config.maxPairsPerToken,
            "DEXFactory: Too many pairs for token"
        );
    }
    
    function _configurePairForNetwork(address pair, NetworkConfig storage config) internal {
        // Set network-specific parameters on the pair
        // This would require extending the DEXPair interface
        // For now, we'll use the default configuration
    }
    
    function _initializeDefaultNetworks() internal {
        // Configure networks with optimized settings for smaller chains
        
        // Ethereum Mainnet
        _configureNetwork(1, true, 30, 300000, 12, false, 100, 1e18, true, 1000000e18, 25, 35);
        
        // Polygon (optimized for speed)
        _configureNetwork(137, true, 25, 300000, 2, true, 50, 1e18, true, 5000000e18, 20, 30);
        
        // BSC (optimized for cost)
        _configureNetwork(56, true, 25, 300000, 3, true, 50, 1e18, true, 5000000e18, 20, 30);
        
        // Fantom (ultra-fast, low fees)
        _configureNetwork(250, true, 20, 250000, 1, true, 30, 1e18, true, 3000000e18, 15, 25);
        
        // Avalanche (high throughput)
        _configureNetwork(43114, true, 25, 800000, 2, true, 40, 1e18, true, 3000000e18, 20, 30);
        
        // Arbitrum (rollup optimization)
        _configureNetwork(42161, true, 20, 1000000, 1, true, 60, 1e18, true, 5000000e18, 15, 25);
        
        // Optimism (rollup optimization)
        _configureNetwork(10, true, 20, 300000, 2, true, 60, 1e18, true, 5000000e18, 15, 25);
        
        // Base (Coinbase backed)
        _configureNetwork(8453, true, 25, 300000, 2, true, 40, 1e18, true, 2000000e18, 20, 30);
        
        // Linea (Consensys backed)
        _configureNetwork(59144, true, 25, 300000, 12, true, 40, 1e18, true, 2000000e18, 20, 30);
        
        // Polygon zkEVM (zero-knowledge optimization)
        _configureNetwork(1101, true, 20, 300000, 1, true, 50, 1e18, true, 3000000e18, 15, 25);
        
        // zkSync Era (zero-knowledge optimization)
        _configureNetwork(324, true, 20, 300000, 1, true, 50, 1e18, true, 3000000e18, 15, 25);
        
        // Scroll (zero-knowledge optimization)
        _configureNetwork(534352, true, 20, 300000, 2, true, 50, 1e18, true, 3000000e18, 15, 25);
        
        // Moonbeam (parachain optimization)
        _configureNetwork(1284, true, 25, 150000, 12, true, 30, 1e18, true, 1000000e18, 20, 30);
        
        // Moonriver (parachain optimization)
        _configureNetwork(1285, true, 25, 150000, 12, true, 30, 1e18, true, 1000000e18, 20, 30);
        
        // PulseChain (Ethereum fork optimization)
        _configureNetwork(804, true, 25, 300000, 3, true, 50, 1e18, true, 5000000e18, 20, 30);
        
        // Gnosis Chain (sidechain optimization)
        _configureNetwork(100, true, 25, 300000, 5, true, 40, 1e18, true, 2000000e18, 20, 30);
        
        // Testnets
        _configureNetwork(11155111, true, 30, 300000, 12, false, 100, 1e18, true, 1000000e18, 25, 35);
        _configureNetwork(80001, true, 25, 300000, 2, true, 50, 1e18, true, 5000000e18, 20, 30);
        _configureNetwork(97, true, 25, 300000, 3, true, 50, 1e18, true, 5000000e18, 20, 30);
        _configureNetwork(11155420, true, 20, 300000, 2, true, 60, 1e18, true, 5000000e18, 15, 25);
        _configureNetwork(421614, true, 20, 1000000, 1, true, 60, 1e18, true, 5000000e18, 15, 25);
        _configureNetwork(84532, true, 25, 300000, 2, true, 40, 1e18, true, 2000000e18, 20, 30);
        _configureNetwork(369, true, 25, 300000, 3, true, 50, 1e18, true, 5000000e18, 20, 30);
        _configureNetwork(10200, true, 25, 300000, 5, true, 40, 1e18, true, 2000000e18, 20, 30);
    }
} 