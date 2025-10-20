// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "./interfaces/IDEXPair.sol";
import "./DEXPair.sol";

contract DEXFactoryV2 is IDEXFactory, Ownable {
    mapping(address => mapping(address => address)) public _getPair;
    address[] public allPairs;
    uint256 public totalPairsCreated;
    
    // Liquidity locker integration
    address public liquidityLocker;
    
    // Configurable fee system
    uint256 public feeRate = 30; // 0.3% default (30 basis points)
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant MAX_FEE_RATE = 1000; // 10% max

    event PairCreated(address indexed token0, address indexed token1, address pair, uint256);
    event LiquidityLockerUpdated(address indexed oldLocker, address indexed newLocker);
    event FeeRateUpdated(uint256 oldFee, uint256 newFee);
    event InitialLiquidityLocked(address indexed pair, address indexed user, uint256 amount, uint256 lockDuration);

    constructor(address _liquidityLocker) Ownable(msg.sender) {
        require(_liquidityLocker != address(0), "INV_LOCKER");
        liquidityLocker = _liquidityLocker;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        return _createPair(tokenA, tokenB);
    }
    
    function _createPair(address tokenA, address tokenB) internal returns (address pair) {
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

    /**
     * @dev Create pair, add initial liquidity, and optionally lock it in one transaction
     * @param tokenA First token address
     * @param tokenB Second token address
     * @param amountA Amount of tokenA for initial liquidity
     * @param amountB Amount of tokenB for initial liquidity
     * @param shouldLockLiquidity Whether to lock the initial liquidity
     * @param lockDuration Duration to lock liquidity (if locking)
     * @param lockDescription Description for the lock (if locking)
     * @return pair The created pair address
     * @return liquidity The amount of LP tokens minted
     */
    function createPairWithLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB,
        bool shouldLockLiquidity,
        uint256 lockDuration,
        string memory lockDescription
    ) external returns (address pair, uint256 liquidity) {
        require(tokenA != tokenB, "ID"); // Identical addresses
        require(tokenA != address(0) && tokenB != address(0), "ZA"); // Zero address
        require(amountA > 0 && amountB > 0, "INV_AMOUNTS"); // Valid amounts
        
        // Create the pair
        pair = _createPair(tokenA, tokenB);
        
        // Transfer tokens from user to pair contract
        require(IERC20(tokenA).transferFrom(msg.sender, pair, amountA), "TF_A_FAILED");
        require(IERC20(tokenB).transferFrom(msg.sender, pair, amountB), "TF_B_FAILED");
        
        if (shouldLockLiquidity) {
            require(liquidityLocker != address(0), "NO_LOCKER");
            require(lockDuration > 0, "INV_DURATION");
            
            // Mint initial liquidity directly to the factory for locking
            liquidity = IDEXPair(pair).mint(address(this));
            require(liquidity > 0, "MINT_FAILED");
            
            // Calculate lock fee (0.1% of LP tokens)
            uint256 lockFee = (liquidity * 10) / 10000; // 0.1%
            uint256 lockAmount = liquidity - lockFee;
            
            // Lock the liquidity directly (factory already owns the LP tokens)
            (bool success, ) = liquidityLocker.call(
                abi.encodeWithSignature(
                    "lockLiquidity(address,address,uint256,uint256,string,uint256)",
                    pair, msg.sender, lockAmount, lockDuration, lockDescription, lockFee
                )
            );
            require(success, "LOCK_FAILED");
            
            emit InitialLiquidityLocked(pair, msg.sender, lockAmount, lockDuration);
        } else {
            // Mint initial liquidity to the user
            liquidity = IDEXPair(pair).mint(msg.sender);
            require(liquidity > 0, "MINT_FAILED");
        }
    }

    /**
     * @dev Create pair with liquidity using permit signatures (single transaction)
     * @param tokenA First token address
     * @param tokenB Second token address
     * @param amountA Amount of tokenA for initial liquidity
     * @param amountB Amount of tokenB for initial liquidity
     * @param shouldLockLiquidity Whether to lock the initial liquidity
     * @param lockDuration Duration to lock liquidity (if locking)
     * @param lockDescription Description for the lock (if locking)
     * @param permitA Permit data for tokenA (deadline, v, r, s)
     * @param permitB Permit data for tokenB (deadline, v, r, s)
     * @return pair The created pair address
     * @return liquidity The amount of LP tokens minted
     */
    function createPairWithLiquidityPermit(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB,
        bool shouldLockLiquidity,
        uint256 lockDuration,
        string memory lockDescription,
        uint256 deadlineA,
        uint8 vA,
        bytes32 rA,
        bytes32 sA,
        uint256 deadlineB,
        uint8 vB,
        bytes32 rB,
        bytes32 sB
    ) external returns (address pair, uint256 liquidity) {
        require(tokenA != tokenB, "ID"); // Identical addresses
        require(tokenA != address(0) && tokenB != address(0), "ZA"); // Zero address
        require(amountA > 0 && amountB > 0, "INV_AMOUNTS"); // Valid amounts
        
        // Create the pair
        pair = _createPair(tokenA, tokenB);
        
        // Use permit to approve tokens (gasless approval)
        if (deadlineA > 0) {
            try IERC20Permit(tokenA).permit(msg.sender, address(this), amountA, deadlineA, vA, rA, sA) {
                // Permit successful
            } catch {
                // Permit failed, try to use existing allowance
                require(IERC20(tokenA).allowance(msg.sender, address(this)) >= amountA, "INSUFFICIENT_ALLOWANCE_A");
            }
        }
        
        if (deadlineB > 0) {
            try IERC20Permit(tokenB).permit(msg.sender, address(this), amountB, deadlineB, vB, rB, sB) {
                // Permit successful
            } catch {
                // Permit failed, try to use existing allowance
                require(IERC20(tokenB).allowance(msg.sender, address(this)) >= amountB, "INSUFFICIENT_ALLOWANCE_B");
            }
        }
        
        // Transfer tokens from user to pair contract
        require(IERC20(tokenA).transferFrom(msg.sender, pair, amountA), "TF_A_FAILED");
        require(IERC20(tokenB).transferFrom(msg.sender, pair, amountB), "TF_B_FAILED");
        
        if (shouldLockLiquidity) {
            require(liquidityLocker != address(0), "NO_LOCKER");
            require(lockDuration > 0, "INV_DURATION");
            
            // Mint initial liquidity directly to the factory for locking
            liquidity = IDEXPair(pair).mint(address(this));
            require(liquidity > 0, "MINT_FAILED");
            
            // Calculate lock fee (0.1% of LP tokens)
            uint256 lockFee = (liquidity * 10) / 10000; // 0.1%
            uint256 lockAmount = liquidity - lockFee;
            
            // Lock the liquidity directly (factory already owns the LP tokens)
            (bool success, ) = liquidityLocker.call(
                abi.encodeWithSignature(
                    "lockLiquidity(address,address,uint256,uint256,string,uint256)",
                    pair, msg.sender, lockAmount, lockDuration, lockDescription, lockFee
                )
            );
            require(success, "LOCK_FAILED");
            
            emit InitialLiquidityLocked(pair, msg.sender, lockAmount, lockDuration);
        } else {
            // Mint initial liquidity to the user
            liquidity = IDEXPair(pair).mint(msg.sender);
            require(liquidity > 0, "MINT_FAILED");
        }
    }

    function getPair(address tokenA, address tokenB) external view returns (address pair) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        pair = _getPair[token0][token1];
    }
    
    function getPairAddress(address tokenA, address tokenB) external view returns (address) {
        return _getPair[tokenA][tokenB];
    }

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }
    
    // Enhanced liquidity locking with automatic initial liquidity lock
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
    
    // Special function for locking initial liquidity automatically
    function lockInitialLiquidity(
        address pair,
        address user,
        uint256 lockDuration,
        string memory description
    ) external {
        require(liquidityLocker != address(0), "NO_LOCKER");
        require(pair != address(0), "INV_PAIR");
        
        // Get the user's LP token balance
        uint256 lpBalance = IERC20(pair).balanceOf(user);
        require(lpBalance > 0, "NO_LP");
        
        // Calculate lock fee (0.1% of LP tokens)
        uint256 lockFee = (lpBalance * 10) / 10000; // 0.1%
        uint256 lockAmount = lpBalance - lockFee;
        
        // Transfer LP tokens from user to factory (user must approve first)
        require(IERC20(pair).transferFrom(user, address(this), lpBalance), "TF_FAILED");
        
        // Lock the liquidity
        (bool success, ) = liquidityLocker.call(
            abi.encodeWithSignature(
                "lockLiquidity(address,address,uint256,uint256,string,uint256)",
                pair, user, lockAmount, lockDuration, description, lockFee
            )
        );
        require(success, "LOCK_FAILED");
        
        emit InitialLiquidityLocked(pair, user, lockAmount, lockDuration);
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
    
    // Admin functions
    function setLiquidityLocker(address _liquidityLocker) external onlyOwner {
        require(_liquidityLocker != address(0), "INV_LOCKER");
        address oldLocker = liquidityLocker;
        liquidityLocker = _liquidityLocker;
        emit LiquidityLockerUpdated(oldLocker, _liquidityLocker);
    }
    
    function setFeeRate(uint256 newFeeRate) public onlyOwner {
        require(newFeeRate <= MAX_FEE_RATE, "FEE_TOO_HIGH");
        uint256 oldFee = feeRate;
        feeRate = newFeeRate;
        emit FeeRateUpdated(oldFee, newFeeRate);
    }
    
    // View functions
    function getFeeRate() external view returns (uint256) {
        return feeRate;
    }
    
    function getFeeDenominator() external pure returns (uint256) {
        return FEE_DENOMINATOR;
    }
    
    function feeDenominator() external pure returns (uint256) {
        return FEE_DENOMINATOR;
    }
    
    function updateFeeRate(uint256 newFeeRate) external onlyOwner {
        setFeeRate(newFeeRate);
    }
    
    function setEmergencyStop(bool stopped) external onlyOwner {
        // This would be implemented if we add emergency stop functionality
        revert("NOT_IMPLEMENTED");
    }
    
    function setAuthorizedOperator(address operator, bool authorized) external onlyOwner {
        // This would be implemented if we add operator functionality
        revert("NOT_IMPLEMENTED");
    }
    
    function pause() external onlyOwner {
        // This would be implemented if we add pausable functionality
        revert("NOT_IMPLEMENTED");
    }
    
    function unpause() external onlyOwner {
        // This would be implemented if we add pausable functionality
        revert("NOT_IMPLEMENTED");
    }
    
    function withdrawFees() external onlyOwner {
        // This would be implemented if we add fee collection functionality
        revert("NOT_IMPLEMENTED");
    }
    
    function collectTradingFees(address pair, uint256 amount) external {
        // This would be implemented if we add fee collection functionality
        revert("NOT_IMPLEMENTED");
    }

    // Interface compliance: stub for createPair with security config
    function createPair(address tokenA, address tokenB, PoolSecurityConfig calldata securityConfig) external override returns (address pair) {
        // For now, just call the default createPair
        return this.createPair(tokenA, tokenB);
    }

    // Interface compliance: stub for lockLiquidity (old signature)
    function lockLiquidity(address pair, uint256 amount, uint256 lockDuration, string memory description) external override payable {
        revert("Use new lockLiquidity signature");
    }

    // Interface compliance: stub for unlockLiquidity (old signature)
    function unlockLiquidity(address pair, uint256 lockIndex) external override {
        revert("Use new unlockLiquidity signature");
    }
} 