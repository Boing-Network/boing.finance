// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract LiquidityLocker is Ownable {
    using SafeERC20 for IERC20;

    struct LiquidityLock {
        address owner;
        uint256 amount;
        uint256 unlockTime;
        bool isLocked;
    }

    // pair => locks
    mapping(address => LiquidityLock[]) public liquidityLocks;
    mapping(address => uint256) public totalLockedLiquidity;
    uint256 public totalLiquidityLocked;

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
    event LockFeeCollected(address indexed user, uint256 amount, uint256 timestamp);

    address public factory;

    modifier onlyFactory() {
        require(msg.sender == factory, "ONLY_FACTORY");
        _;
    }

    constructor(address _factory) Ownable(msg.sender) {
        require(_factory != address(0), "INV_FACTORY");
        factory = _factory;
    }

    function setFactory(address _factory) external onlyOwner {
        require(_factory != address(0), "INV_FACTORY");
        factory = _factory;
    }

    function lockLiquidity(
        address pair,
        address user,
        uint256 amount,
        uint256 lockDuration,
        string memory description,
        uint256 lockFee
    ) external onlyFactory {
        require(pair != address(0), "INV_PAIR");
        require(amount > 0, "INV_AMT");
        require(lockDuration > 0, "INV_DUR");
        require(lockDuration <= 365 days, "LONG");

        // Create lock
        LiquidityLock memory newLock = LiquidityLock({
            owner: user,
            amount: amount,
            unlockTime: block.timestamp + lockDuration,
            isLocked: true
        });
        liquidityLocks[pair].push(newLock);
        totalLockedLiquidity[pair] += amount;
        totalLiquidityLocked += amount;

        emit LiquidityLocked(pair, user, amount, newLock.unlockTime, description, lockFee);
        emit LockFeeCollected(user, lockFee, block.timestamp);
    }

    function unlockLiquidity(address pair, uint256 lockIndex, address user) external onlyFactory {
        require(pair != address(0), "INV_PAIR");
        require(lockIndex < liquidityLocks[pair].length, "INV_IDX");
        LiquidityLock storage lock = liquidityLocks[pair][lockIndex];
        require(lock.owner == user, "NOT_OWNER");
        require(lock.isLocked, "UNLOCKED");
        require(block.timestamp >= lock.unlockTime, "NOT_EXPIRED");

        lock.isLocked = false;
        totalLockedLiquidity[pair] -= lock.amount;
        totalLiquidityLocked -= lock.amount;

        emit LiquidityUnlocked(pair, user, lock.amount, block.timestamp);
    }

    // View functions for DEXFactory or UI
    function getLocks(address pair) external view returns (LiquidityLock[] memory) {
        return liquidityLocks[pair];
    }
    function getTotalLocked(address pair) external view returns (uint256) {
        return totalLockedLiquidity[pair];
    }
} 