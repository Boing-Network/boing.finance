// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "./interfaces/IDEXPair.sol";
import "./interfaces/ILiquidityLocker.sol";
import "./DEXPair.sol";

contract DEXFactoryV2 is IDEXFactory, Ownable {
    error IdenticalTokens();
    error ZeroAddress();
    error PairExists();
    error Create2Failed();
    error InvalidAmounts();
    error NoLocker();
    error InvalidDuration();
    error MintFailed();
    error ApproveFailed();
    error LockFailed();
    error TransferFailed();
    error FeeTooHigh();
    error InvalidLocker();
    error InvalidPair();
    error NoLpBalance();
    error UnlockFailed();
    struct PermitData {
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

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
        if (_liquidityLocker == address(0)) revert InvalidLocker();
        liquidityLocker = _liquidityLocker;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        return _createPair(tokenA, tokenB);
    }
    
    function _createPair(address tokenA, address tokenB) internal returns (address pair) {
        if (tokenA == tokenB) revert IdenticalTokens();
        if (tokenA == address(0) || tokenB == address(0)) revert ZeroAddress();
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        if (_getPair[token0][token1] != address(0)) revert PairExists();
        bytes memory bytecode = type(DEXPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        if (pair == address(0)) revert Create2Failed();
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
        if (tokenA == tokenB) revert IdenticalTokens();
        if (tokenA == address(0) || tokenB == address(0)) revert ZeroAddress();
        if (amountA == 0 || amountB == 0) revert InvalidAmounts();
        
        pair = _createPair(tokenA, tokenB);
        if (!IERC20(tokenA).transferFrom(msg.sender, pair, amountA)) revert TransferFailed();
        if (!IERC20(tokenB).transferFrom(msg.sender, pair, amountB)) revert TransferFailed();
        
        liquidity = shouldLockLiquidity
            ? _mintAndLock(pair, msg.sender, lockDuration, lockDescription)
            : _mintToUser(pair, msg.sender);
    }

    function _mintToUser(address pair, address to) internal returns (uint256 liquidity) {
        liquidity = IDEXPair(pair).mint(to);
        if (liquidity == 0) revert MintFailed();
    }

    function _mintAndLock(
        address pair,
        address user,
        uint256 lockDuration,
        string memory lockDescription
    ) internal returns (uint256 liquidity) {
        if (liquidityLocker == address(0)) revert NoLocker();
        if (lockDuration == 0) revert InvalidDuration();

        liquidity = IDEXPair(pair).mint(address(this));
        if (liquidity == 0) revert MintFailed();

        uint256 lockFee = (liquidity * 10) / 10000;
        uint256 lockAmount = liquidity - lockFee;

        if (!IERC20(pair).approve(liquidityLocker, lockAmount)) revert ApproveFailed();
        ILiquidityLocker(liquidityLocker).lockLiquidity(
            pair, user, lockAmount, lockDuration, lockDescription, lockFee
        );

        emit InitialLiquidityLocked(pair, user, lockAmount, lockDuration);
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
     * @param deadlineA Permit deadline for tokenA
     * @param vA,rA,sA Permit signature for tokenA
     * @param deadlineB Permit deadline for tokenB
     * @param vB,rB,sB Permit signature for tokenB
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
        return _createPairWithLiquidityPermit(
            tokenA, tokenB, amountA, amountB,
            shouldLockLiquidity, lockDuration, lockDescription,
            PermitData(deadlineA, vA, rA, sA),
            PermitData(deadlineB, vB, rB, sB)
        );
    }

    function _createPairWithLiquidityPermit(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB,
        bool shouldLockLiquidity,
        uint256 lockDuration,
        string memory lockDescription,
        PermitData memory permitA,
        PermitData memory permitB
    ) internal returns (address pair, uint256 liquidity) {
        if (tokenA == tokenB) revert IdenticalTokens();
        if (tokenA == address(0) || tokenB == address(0)) revert ZeroAddress();
        if (amountA == 0 || amountB == 0) revert InvalidAmounts();

        pair = _createPair(tokenA, tokenB);

        if (permitA.deadline > 0) {
            try IERC20Permit(tokenA).permit(msg.sender, address(this), amountA, permitA.deadline, permitA.v, permitA.r, permitA.s) {}
            catch {
                if (IERC20(tokenA).allowance(msg.sender, address(this)) < amountA) revert TransferFailed();
            }
        }
        if (permitB.deadline > 0) {
            try IERC20Permit(tokenB).permit(msg.sender, address(this), amountB, permitB.deadline, permitB.v, permitB.r, permitB.s) {}
            catch {
                if (IERC20(tokenB).allowance(msg.sender, address(this)) < amountB) revert TransferFailed();
            }
        }

        if (!IERC20(tokenA).transferFrom(msg.sender, pair, amountA)) revert TransferFailed();
        if (!IERC20(tokenB).transferFrom(msg.sender, pair, amountB)) revert TransferFailed();

        liquidity = shouldLockLiquidity
            ? _mintAndLock(pair, msg.sender, lockDuration, lockDescription)
            : _mintToUser(pair, msg.sender);
    }

    function getPair(address tokenA, address tokenB) external view returns (address pair) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        pair = _getPair[token0][token1];
    }
    
    function getPairAddress(address tokenA, address tokenB) external view returns (address) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        return _getPair[token0][token1];
    }

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }
    
    function lockLiquidity(
        address pair,
        address user,
        uint256 amount,
        uint256 lockDuration,
        string memory description,
        uint256 lockFee
    ) external {
        if (liquidityLocker == address(0)) revert NoLocker();
        if (!IERC20(pair).transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        if (!IERC20(pair).approve(liquidityLocker, amount)) revert ApproveFailed();
        ILiquidityLocker(liquidityLocker).lockLiquidity(pair, user, amount, lockDuration, description, lockFee);
    }
    
    function lockInitialLiquidity(
        address pair,
        address user,
        uint256 lockDuration,
        string memory description
    ) external {
        if (liquidityLocker == address(0)) revert NoLocker();
        if (pair == address(0)) revert InvalidPair();

        uint256 lpBalance = IERC20(pair).balanceOf(user);
        if (lpBalance == 0) revert NoLpBalance();

        uint256 lockFee = (lpBalance * 10) / 10000;
        uint256 lockAmount = lpBalance - lockFee;

        if (!IERC20(pair).transferFrom(user, address(this), lpBalance)) revert TransferFailed();
        if (!IERC20(pair).approve(liquidityLocker, lockAmount)) revert ApproveFailed();
        ILiquidityLocker(liquidityLocker).lockLiquidity(
            pair, user, lockAmount, lockDuration, description, lockFee
        );

        emit InitialLiquidityLocked(pair, user, lockAmount, lockDuration);
    }
    
    function unlockLiquidity(address pair, uint256 lockIndex, address user) external {
        if (liquidityLocker == address(0)) revert NoLocker();
        ILiquidityLocker(liquidityLocker).unlockLiquidity(pair, lockIndex, user);
    }
    
    function setLiquidityLocker(address _liquidityLocker) external onlyOwner {
        if (_liquidityLocker == address(0)) revert InvalidLocker();
        address oldLocker = liquidityLocker;
        liquidityLocker = _liquidityLocker;
        emit LiquidityLockerUpdated(oldLocker, _liquidityLocker);
    }

    function setFeeRate(uint256 newFeeRate) public onlyOwner {
        if (newFeeRate > MAX_FEE_RATE) revert FeeTooHigh();
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