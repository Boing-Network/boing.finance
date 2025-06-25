// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IDEXFactory.sol";
import "./interfaces/IDEXPair.sol";
import "./interfaces/IDEXRouter.sol";
import "./DEXPair.sol";

/**
 * @title DEXFactory
 * @dev Factory contract for creating and managing DEX pairs
 * Supports cross-chain trading pairs and liquidity pools
 */
contract DEXFactory is IDEXFactory, Ownable, ReentrancyGuard, Pausable {
    // Mapping from token pair to pair address
    mapping(address => mapping(address => address)) public override getPair;
    
    // Array of all pairs
    address[] public override allPairs;
    
    // Fee configuration
    uint256 public override feeRate = 30; // 0.3% (30 basis points)
    uint256 public override feeDenominator = 10000;
    
    // Cross-chain bridge addresses
    mapping(uint256 => address) public bridgeAddresses; // chainId => bridge address
    
    // Events
    event PairCreated(address indexed token0, address indexed token1, address pair, uint256 allPairsLength);
    event FeeUpdated(uint256 newFeeRate);
    event BridgeAddressUpdated(uint256 chainId, address bridgeAddress);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Create a new trading pair
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return pair Address of the created pair
     */
    function createPair(address tokenA, address tokenB) 
        external 
        override 
        whenNotPaused 
        returns (address pair) 
    {
        require(tokenA != tokenB, "DEXFactory: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "DEXFactory: ZERO_ADDRESS");
        require(getPair[token0][token1] == address(0), "DEXFactory: PAIR_EXISTS");
        
        // Create the pair contract
        bytes memory bytecode = type(DEXPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        
        IDEXPair(pair).initialize(token0, token1);
        
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);
        
        emit PairCreated(token0, token1, pair, allPairs.length);
    }
    
    /**
     * @dev Get all pairs count
     */
    function allPairsLength() external view override returns (uint256) {
        return allPairs.length;
    }
    
    /**
     * @dev Update fee rate (owner only)
     */
    function setFeeRate(uint256 _feeRate) external override onlyOwner {
        require(_feeRate <= 1000, "DEXFactory: FEE_TOO_HIGH"); // Max 10%
        feeRate = _feeRate;
        emit FeeUpdated(_feeRate);
    }
    
    /**
     * @dev Set bridge address for cross-chain operations
     */
    function setBridgeAddress(uint256 chainId, address bridgeAddress) external override onlyOwner {
        bridgeAddresses[chainId] = bridgeAddress;
        emit BridgeAddressUpdated(chainId, bridgeAddress);
    }
    
    /**
     * @dev Pause factory operations
     */
    function pause() external override onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause factory operations
     */
    function unpause() external override onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get pair address for two tokens
     */
    function getPairAddress(address tokenA, address tokenB) 
        external 
        view 
        override 
        returns (address) 
    {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        return getPair[token0][token1];
    }
    
    /**
     * @dev Check if pair exists
     */
    function pairExists(address tokenA, address tokenB) 
        external 
        view 
        override 
        returns (bool) 
    {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        return getPair[token0][token1] != address(0);
    }
} 