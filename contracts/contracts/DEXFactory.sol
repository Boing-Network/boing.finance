// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IDEXFactory.sol";
import "./interfaces/IDEXPair.sol";
import "./DEXPair.sol";

/**
 * @title DEXFactory
 * @dev Factory contract for creating and managing DEX pairs
 * Supports cross-chain trading pairs and liquidity pools
 */
contract DEXFactory is IDEXFactory, Ownable, ReentrancyGuard, Pausable {
    // Mapping from token pair to pair address
    mapping(address => mapping(address => address)) private _getPair;
    
    // Array of all pairs
    address[] public allPairs;
    
    // Fee configuration
    uint256 public feeRate = 30; // 0.3% (30 basis points)
    uint256 public feeDenominator = 10000;
    
    // Cross-chain bridge addresses
    mapping(uint256 => address) public bridgeAddresses; // chainId => bridge address
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Create a new trading pair
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return pair Address of the created pair
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
        
        // Create the pair contract
        bytes memory bytecode = type(DEXPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        
        IDEXPair(pair).initialize(token0, token1);
        
        _getPair[token0][token1] = pair;
        _getPair[token1][token0] = pair;
        allPairs.push(pair);
    }
    
    /**
     * @dev Get all pairs count
     */
    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }
    
    /**
     * @dev Update fee rate (owner only)
     */
    function setFeeRate(uint256 _feeRate) external onlyOwner {
        require(_feeRate <= 1000, "DEXFactory: FEE_TOO_HIGH"); // Max 10%
        feeRate = _feeRate;
    }
    
    /**
     * @dev Set bridge address for cross-chain operations
     */
    function setBridgeAddress(uint256 chainId, address bridgeAddress) external onlyOwner {
        bridgeAddresses[chainId] = bridgeAddress;
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
    
    function getPairAddress(address tokenA, address tokenB) external view override returns (address) {
        return getPair(tokenA, tokenB);
    }
} 