// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract LiquidityLocker is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    error InvalidFactory();
    error OnlyFactory();
    error InvalidPair();
    error InvalidAmount();
    error InvalidDuration();
    error DurationTooLong();
    error InvalidIndex();
    error NotOwner();
    error AlreadyUnlocked();
    error NotExpired();

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
        if (msg.sender != factory) revert OnlyFactory();
        _;
    }

    constructor(address _factory) Ownable(msg.sender) {
        if (_factory == address(0)) revert InvalidFactory();
        factory = _factory;
    }

    function setFactory(address _factory) external onlyOwner {
        if (_factory == address(0)) revert InvalidFactory();
        factory = _factory;
    }

    function lockLiquidity(
        address pair,
        address user,
        uint256 amount,
        uint256 lockDuration,
        string memory description,
        uint256 lockFee
    ) external onlyFactory nonReentrant {
        if (pair == address(0)) revert InvalidPair();
        if (amount == 0) revert InvalidAmount();
        if (lockDuration == 0) revert InvalidDuration();
        if (lockDuration > 365 days) revert DurationTooLong();

        // Pull LP tokens from factory (factory must approve before calling)
        IERC20(pair).safeTransferFrom(msg.sender, address(this), amount);

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

    function unlockLiquidity(address pair, uint256 lockIndex, address user) external onlyFactory nonReentrant {
        if (pair == address(0)) revert InvalidPair();
        if (lockIndex >= liquidityLocks[pair].length) revert InvalidIndex();
        LiquidityLock storage lock = liquidityLocks[pair][lockIndex];
        if (lock.owner != user) revert NotOwner();
        if (!lock.isLocked) revert AlreadyUnlocked();
        if (block.timestamp < lock.unlockTime) revert NotExpired();

        uint256 amount = lock.amount;
        lock.isLocked = false;
        lock.amount = 0; // Prevent reentrancy
        totalLockedLiquidity[pair] -= amount;
        totalLiquidityLocked -= amount;

        IERC20(pair).safeTransfer(user, amount);
        emit LiquidityUnlocked(pair, user, amount, block.timestamp);
    }

    // View functions for DEXFactory or UI
    function getLocks(address pair) external view returns (LiquidityLock[] memory) {
        return liquidityLocks[pair];
    }
    function getTotalLocked(address pair) external view returns (uint256) {
        return totalLockedLiquidity[pair];
    }
} 