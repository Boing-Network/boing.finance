// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IDEXPair.sol";
import "./DEXPair.sol";

contract DEXFactoryMinimal is Ownable {
    mapping(address => mapping(address => address)) public _getPair;
    address[] public allPairs;
    uint256 public totalPairsCreated;
    
    // Liquidity locker integration
    address public liquidityLocker;
    
    // Fixed fee rate (0.3% = 30 basis points)
    uint256 public constant FEE_RATE = 30; // 0.3%
    uint256 public constant FEE_DENOMINATOR = 10000;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint256);
    event LiquidityLockerUpdated(address indexed oldLocker, address indexed newLocker);

    constructor(address _liquidityLocker) Ownable(msg.sender) {
        require(_liquidityLocker != address(0), "INV_LOCKER");
        liquidityLocker = _liquidityLocker;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, "ID"); // Identical addresses
        require(tokenA != address(0) && tokenB != address(0), "ZA"); // Zero address
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(_getPair[token0][token1] == address(0), "PC"); // Pair exists
        bytes memory bytecode = type(DEXPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        require(pair != address(0), "C2F"); // CREATE2 failed
        IDEXPair(pair).initialize(token0, token1);
        _getPair[token0][token1] = pair;
        _getPair[token1][token0] = pair;
        allPairs.push(pair);
        totalPairsCreated++;
        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function getPair(address tokenA, address tokenB) external view returns (address pair) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        pair = _getPair[token0][token1];
    }

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }
    
    // Liquidity locking functions
    function lockLiquidity(
        address pair,
        address user,
        uint256 amount,
        uint256 lockDuration,
        string memory description,
        uint256 lockFee
    ) external {
        require(liquidityLocker != address(0), "NO_LOCKER");
        // Delegate to liquidity locker
        (bool success, ) = liquidityLocker.call(
            abi.encodeWithSignature(
                "lockLiquidity(address,address,uint256,uint256,string,uint256)",
                pair, user, amount, lockDuration, description, lockFee
            )
        );
        require(success, "LOCK_FAILED");
    }
    
    function unlockLiquidity(address pair, uint256 lockIndex, address user) external {
        require(liquidityLocker != address(0), "NO_LOCKER");
        // Delegate to liquidity locker
        (bool success, ) = liquidityLocker.call(
            abi.encodeWithSignature(
                "unlockLiquidity(address,uint256,address)",
                pair, lockIndex, user
            )
        );
        require(success, "UNLOCK_FAILED");
    }
    
    // Admin function to update liquidity locker
    function setLiquidityLocker(address _liquidityLocker) external onlyOwner {
        require(_liquidityLocker != address(0), "INV_LOCKER");
        address oldLocker = liquidityLocker;
        liquidityLocker = _liquidityLocker;
        emit LiquidityLockerUpdated(oldLocker, _liquidityLocker);
    }
} 