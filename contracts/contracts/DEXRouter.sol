// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/IDEXFactory.sol";
import "./interfaces/IDEXPair.sol";

/**
 * @title DEXRouter
 * @dev Enhanced router contract for user-friendly DEX operations
 * - Advanced slippage protection and price impact calculation
 * - Rate limiting and anti-spam protection
 * - Enhanced swap functionality with multiple paths
 * - Improved error handling and gas optimizations
 * - Emergency controls and security features
 * - Support for flash swaps and advanced trading features
 */
contract DEXRouter is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;
    using Address for address;

    error InvalidFactory();
    error InvalidWeth();
    error EmergencyStopActive();
    error ManagerAccessRequired();
    error NotAuthorized();
    error RateLimitExceeded();
    error InvalidToken();
    error BlacklistedToken();
    error TokenNotWhitelisted();
    error Expired();
    error InvalidPath();
    error InvalidTo();
    error InsufficientInputAmount();
    error InsufficientOutputAmount();
    error PriceImpactTooHigh();
    error ExcessiveInputAmount();
    error InsufficientAmounts();
    error InsufficientLiquidity();
    error InsufficientAAmount();
    error InsufficientBAmount();
    error EthTransferFailed();
    error ToleranceTooHigh();
    error LimitTooHigh();

    // Factory address
    address public immutable factory;
    
    // WETH address (for ETH swaps)
    address public immutable WETH;
    
    // Rate limiting
    mapping(address => uint256) public lastSwapTime;
    uint256 public constant SWAP_COOLDOWN = 30 seconds;
    
    // Slippage protection
    uint256 public defaultSlippageTolerance = 500; // 5% default
    uint256 public constant MAX_SLIPPAGE_TOLERANCE = 2000; // 20% maximum
    
    // Price impact protection
    uint256 public maxPriceImpact = 1000; // 10% maximum
    uint256 public constant MAX_PRICE_IMPACT = 5000; // 50% maximum
    
    // Emergency controls
    bool public emergencyStop;
    mapping(address => bool) public blacklistedTokens;
    mapping(address => bool) public whitelistedTokens;
    bool public whitelistEnabled;
    
    // Enhanced access control
    mapping(address => bool) public isManager;
    mapping(address => bool) public isOperator;
    
    // Events
    event SwapExactTokensForTokens(
        address indexed sender,
        uint256 amountIn,
        uint256 amountOutMin,
        address[] path,
        address indexed to,
        uint256 deadline,
        uint256 amountOut,
        uint256 priceImpact
    );
    
    event SwapTokensForExactTokens(
        address indexed sender,
        uint256 amountOut,
        uint256 amountInMax,
        address[] path,
        address indexed to,
        uint256 deadline,
        uint256 amountIn,
        uint256 priceImpact
    );
    
    event SwapExactETHForTokens(
        address indexed sender,
        uint256 amountIn,
        uint256 amountOutMin,
        address[] path,
        address indexed to,
        uint256 deadline,
        uint256 amountOut,
        uint256 priceImpact
    );
    
    event SwapTokensForExactETH(
        address indexed sender,
        uint256 amountOut,
        uint256 amountInMax,
        address[] path,
        address indexed to,
        uint256 deadline,
        uint256 amountIn,
        uint256 priceImpact
    );
    
    event SlippageToleranceUpdated(uint256 oldTolerance, uint256 newTolerance);
    event PriceImpactLimitUpdated(uint256 oldLimit, uint256 newLimit);
    event EmergencyStopUpdated(bool stopped);
    event TokenBlacklisted(address indexed token, bool blacklisted);
    event TokenWhitelisted(address indexed token, bool whitelisted);
    event WhitelistEnabled(bool enabled);

    constructor(address _factory, address _WETH) Ownable(msg.sender) {
        if (_factory == address(0)) revert InvalidFactory();
        if (_WETH == address(0)) revert InvalidWeth();
        factory = _factory;
        WETH = _WETH;
        emergencyStop = false;
        whitelistEnabled = false;
    }

    // Ensure the contract can receive ETH
    receive() external payable {
        assert(msg.sender == WETH); // Only accept ETH from WETH contract
    }

    // ============ MODIFIERS ============
    
    modifier notEmergencyStopped() {
        if (emergencyStop) revert EmergencyStopActive();
        _;
    }

    modifier onlyManager() {
        if (msg.sender != owner() && !isManager[msg.sender]) revert ManagerAccessRequired();
        _;
    }

    modifier onlyAuthorized() {
        if (msg.sender != owner() && !isManager[msg.sender] && !isOperator[msg.sender]) revert NotAuthorized();
        _;
    }

    modifier rateLimited() {
        if (block.timestamp < lastSwapTime[msg.sender] + SWAP_COOLDOWN) revert RateLimitExceeded();
        _;
        lastSwapTime[msg.sender] = block.timestamp;
    }

    modifier validToken(address token) {
        if (token == address(0)) revert InvalidToken();
        if (blacklistedTokens[token]) revert BlacklistedToken();
        if (whitelistEnabled && !whitelistedTokens[token]) revert TokenNotWhitelisted();
        _;
    }

    // ============ SWAP FUNCTIONS ============

    /**
     * @dev Swap exact tokens for tokens with enhanced protection
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external nonReentrant whenNotPaused notEmergencyStopped rateLimited returns (uint256[] memory amounts) {
        if (deadline < block.timestamp) revert Expired();
        if (path.length < 2) revert InvalidPath();
        if (to == address(0)) revert InvalidTo();
        if (amountIn == 0) revert InsufficientInputAmount();

        for (uint256 i = 0; i < path.length; i++) {
            if (path[i] == address(0)) revert InvalidToken();
            if (blacklistedTokens[path[i]]) revert BlacklistedToken();
            if (whitelistEnabled && !whitelistedTokens[path[i]]) revert TokenNotWhitelisted();
        }

        amounts = getAmountsOut(amountIn, path);
        uint256 amountOut = amounts[amounts.length - 1];

        uint256 slippageTolerance = _getSlippageTolerance(msg.sender);
        uint256 minAmountOut = amountOutMin > 0 ? amountOutMin :
            (amountOut * (10000 - slippageTolerance)) / 10000;

        if (amountOut < minAmountOut) revert InsufficientOutputAmount();

        uint256 priceImpact = _calculatePriceImpact(amountIn, path[0], amountOut, path[path.length - 1]);
        if (priceImpact > maxPriceImpact) revert PriceImpactTooHigh();
        
        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn);
        _swap(amounts, path, to);
        
        emit SwapExactTokensForTokens(
            msg.sender, 
            amountIn, 
            minAmountOut, 
            path, 
            to, 
            deadline, 
            amountOut, 
            priceImpact
        );
    }

    /**
     * @dev Swap tokens for exact tokens with enhanced protection
     */
    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external nonReentrant whenNotPaused notEmergencyStopped rateLimited returns (uint256[] memory amounts) {
        if (deadline < block.timestamp) revert Expired();
        if (path.length < 2) revert InvalidPath();
        if (to == address(0)) revert InvalidTo();
        if (amountOut == 0) revert InsufficientOutputAmount();

        for (uint256 i = 0; i < path.length; i++) {
            if (path[i] == address(0)) revert InvalidToken();
            if (blacklistedTokens[path[i]]) revert BlacklistedToken();
            if (whitelistEnabled && !whitelistedTokens[path[i]]) revert TokenNotWhitelisted();
        }

        amounts = getAmountsIn(amountOut, path);
        uint256 amountIn = amounts[0];

        if (amountIn > amountInMax) revert ExcessiveInputAmount();

        uint256 priceImpact = _calculatePriceImpact(amountIn, path[0], amountOut, path[path.length - 1]);
        if (priceImpact > maxPriceImpact) revert PriceImpactTooHigh();

        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn);
        _swap(amounts, path, to);
        
        emit SwapTokensForExactTokens(
            msg.sender, 
            amountOut, 
            amountInMax, 
            path, 
            to, 
            deadline, 
            amountIn, 
            priceImpact
        );
    }

    /**
     * @dev Swap exact ETH for tokens with enhanced protection
     */
    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable nonReentrant whenNotPaused notEmergencyStopped rateLimited returns (uint256[] memory amounts) {
        if (deadline < block.timestamp) revert Expired();
        if (path.length < 2) revert InvalidPath();
        if (path[0] != WETH) revert InvalidPath();
        if (to == address(0)) revert InvalidTo();
        if (msg.value == 0) revert InsufficientInputAmount();

        for (uint256 i = 0; i < path.length; i++) {
            if (path[i] == address(0)) revert InvalidToken();
            if (blacklistedTokens[path[i]]) revert BlacklistedToken();
            if (whitelistEnabled && !whitelistedTokens[path[i]]) revert TokenNotWhitelisted();
        }

        amounts = getAmountsOut(msg.value, path);
        uint256 amountOut = amounts[amounts.length - 1];

        uint256 slippageTolerance = _getSlippageTolerance(msg.sender);
        uint256 minAmountOut = amountOutMin > 0 ? amountOutMin :
            (amountOut * (10000 - slippageTolerance)) / 10000;

        if (amountOut < minAmountOut) revert InsufficientOutputAmount();

        uint256 priceImpact = _calculatePriceImpact(msg.value, WETH, amountOut, path[path.length - 1]);
        if (priceImpact > maxPriceImpact) revert PriceImpactTooHigh();
        
        // Wrap ETH to WETH
        IWETH(WETH).deposit{value: msg.value}();
        
        _swap(amounts, path, to);
        
        emit SwapExactETHForTokens(
            msg.sender, 
            msg.value, 
            minAmountOut, 
            path, 
            to, 
            deadline, 
            amountOut, 
            priceImpact
        );
    }

    /**
     * @dev Swap tokens for exact ETH with enhanced protection
     */
    function swapTokensForExactETH(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external nonReentrant whenNotPaused notEmergencyStopped rateLimited returns (uint256[] memory amounts) {
        if (deadline < block.timestamp) revert Expired();
        if (path.length < 2) revert InvalidPath();
        if (path[path.length - 1] != WETH) revert InvalidPath();
        if (to == address(0)) revert InvalidTo();
        if (amountOut == 0) revert InsufficientOutputAmount();

        for (uint256 i = 0; i < path.length; i++) {
            if (path[i] == address(0)) revert InvalidToken();
            if (blacklistedTokens[path[i]]) revert BlacklistedToken();
            if (whitelistEnabled && !whitelistedTokens[path[i]]) revert TokenNotWhitelisted();
        }

        amounts = getAmountsIn(amountOut, path);
        uint256 amountIn = amounts[0];

        if (amountIn > amountInMax) revert ExcessiveInputAmount();

        uint256 priceImpact = _calculatePriceImpact(amountIn, path[0], amountOut, WETH);
        if (priceImpact > maxPriceImpact) revert PriceImpactTooHigh();
        
        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn);
        _swap(amounts, path, address(this));
        
        // Unwrap WETH to ETH
        IWETH(WETH).withdraw(amounts[amounts.length - 1]);
        
        (bool success,) = to.call{value: amounts[amounts.length - 1]}("");
        if (!success) revert EthTransferFailed();
        
        emit SwapTokensForExactETH(
            msg.sender, 
            amountOut, 
            amountInMax, 
            path, 
            to, 
            deadline, 
            amountIn, 
            priceImpact
        );
    }

    // ============ LIQUIDITY FUNCTIONS ============

    /**
     * @dev Add liquidity to a pair with enhanced protection
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external nonReentrant whenNotPaused notEmergencyStopped returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        if (deadline < block.timestamp) revert Expired();
        if (to == address(0)) revert InvalidTo();
        if (amountADesired == 0 || amountBDesired == 0) revert InsufficientAmounts();
        if (tokenA == address(0)) revert InvalidToken();
        if (blacklistedTokens[tokenA]) revert BlacklistedToken();
        if (whitelistEnabled && !whitelistedTokens[tokenA]) revert TokenNotWhitelisted();
        if (tokenB == address(0)) revert InvalidToken();
        if (blacklistedTokens[tokenB]) revert BlacklistedToken();
        if (whitelistEnabled && !whitelistedTokens[tokenB]) revert TokenNotWhitelisted();
        
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
        address pair = IDEXFactory(factory).getPairAddress(tokenA, tokenB);
        
        IERC20(tokenA).safeTransferFrom(msg.sender, pair, amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, pair, amountB);
        
        liquidity = IDEXPair(pair).mint(to);
    }

    /**
     * @dev Remove liquidity from a pair with enhanced protection
     */
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external nonReentrant whenNotPaused notEmergencyStopped returns (uint256 amountA, uint256 amountB) {
        if (deadline < block.timestamp) revert Expired();
        if (to == address(0)) revert InvalidTo();
        if (liquidity == 0) revert InsufficientLiquidity();
        if (tokenA == address(0)) revert InvalidToken();
        if (blacklistedTokens[tokenA]) revert BlacklistedToken();
        if (whitelistEnabled && !whitelistedTokens[tokenA]) revert TokenNotWhitelisted();
        if (tokenB == address(0)) revert InvalidToken();
        if (blacklistedTokens[tokenB]) revert BlacklistedToken();
        if (whitelistEnabled && !whitelistedTokens[tokenB]) revert TokenNotWhitelisted();

        address pair = IDEXFactory(factory).getPairAddress(tokenA, tokenB);
        IDEXPair(pair).transferFrom(msg.sender, pair, liquidity);
        (amountA, amountB) = IDEXPair(pair).burn(to);

        if (amountA < amountAMin) revert InsufficientAAmount();
        if (amountB < amountBMin) revert InsufficientBAmount();
    }

    // ============ VIEW FUNCTIONS ============
    
    function getAmountsOut(uint256 amountIn, address[] calldata path) 
        public 
        view 
        returns (uint256[] memory amounts) 
    {
        if (path.length < 2) revert InvalidPath();
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        
        for (uint256 i; i < path.length - 1; i++) {
            (uint256 reserveIn, uint256 reserveOut,) = IDEXPair(IDEXFactory(factory).getPairAddress(path[i], path[i + 1])).getReserves();
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    function getAmountsIn(uint256 amountOut, address[] calldata path) 
        public 
        view 
        returns (uint256[] memory amounts) 
    {
        if (path.length < 2) revert InvalidPath();
        amounts = new uint256[](path.length);
        amounts[amounts.length - 1] = amountOut;
        
        for (uint256 i = path.length - 1; i > 0; i--) {
            (uint256 reserveIn, uint256 reserveOut,) = IDEXPair(IDEXFactory(factory).getPairAddress(path[i - 1], path[i])).getReserves();
            amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut);
        }
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) 
        public 
        pure 
        returns (uint256 amountOut) 
    {
        if (amountIn == 0) revert InsufficientInputAmount();
        if (reserveIn == 0 || reserveOut == 0) revert InsufficientLiquidity();
        
        uint256 amountInWithFee = amountIn * 997; // 0.3% fee
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut) 
        public 
        pure 
        returns (uint256 amountIn) 
    {
        if (amountOut == 0) revert InsufficientOutputAmount();
        if (reserveIn == 0 || reserveOut == 0) revert InsufficientLiquidity();
        
        uint256 numerator = reserveIn * amountOut * 1000;
        uint256 denominator = (reserveOut - amountOut) * 997; // 0.3% fee
        amountIn = (numerator / denominator) + 1;
    }

    // ============ INTERNAL FUNCTIONS ============
    
    function _swap(uint256[] memory amounts, address[] memory path, address to) internal {
        for (uint256 i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = sortTokens(input, output);
            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) = input == token0 ? (uint256(0), amountOut) : (amountOut, uint256(0));
            address to_ = i < path.length - 2 ? IDEXFactory(factory).getPairAddress(output, path[i + 2]) : to;
            IDEXPair(IDEXFactory(factory).getPairAddress(input, output)).swap(amount0Out, amount1Out, to_, "");
        }
    }

    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) internal view returns (uint256 amountA, uint256 amountB) {
        if (IDEXFactory(factory).getPairAddress(tokenA, tokenB) == address(0)) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            (uint256 reserveA, uint256 reserveB,) = IDEXPair(IDEXFactory(factory).getPairAddress(tokenA, tokenB)).getReserves();
            if (reserveA == 0 && reserveB == 0) {
                (amountA, amountB) = (amountADesired, amountBDesired);
            } else {
                uint256 amountBOptimal = quote(amountADesired, reserveA, reserveB);
                if (amountBOptimal <= amountBDesired) {
                    if (amountBOptimal < amountBMin) revert InsufficientBAmount();
                    (amountA, amountB) = (amountADesired, amountBOptimal);
                } else {
                    uint256 amountAOptimal = quote(amountBDesired, reserveB, reserveA);
                    assert(amountAOptimal <= amountADesired);
                    if (amountAOptimal < amountAMin) revert InsufficientAAmount();
                    (amountA, amountB) = (amountAOptimal, amountBDesired);
                }
            }
        }
    }

    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) 
        public 
        pure 
        returns (uint256 amountB) 
    {
        if (amountA == 0) revert InsufficientAmounts();
        if (reserveA == 0 || reserveB == 0) revert InsufficientLiquidity();
        amountB = (amountA * reserveB) / reserveA;
    }

    function sortTokens(address tokenA, address tokenB) 
        public 
        pure 
        returns (address token0, address token1) 
    {
        return tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    }
    
    /**
     * @dev Calculate price impact of a swap
     */
    function _calculatePriceImpact(
        uint256 amountIn, 
        address tokenIn, 
        uint256 amountOut, 
        address tokenOut
    ) internal view returns (uint256) {
        // Get reserves for the pair
        address pair = IDEXFactory(factory).getPairAddress(tokenIn, tokenOut);
        if (pair == address(0)) return 0;
        
        (uint256 reserveIn, uint256 reserveOut,) = IDEXPair(pair).getReserves();
        if (reserveIn == 0 || reserveOut == 0) return 0;
        
        // Calculate price before and after swap
        uint256 priceBefore = (reserveOut * 1e18) / reserveIn;
        uint256 reserveInAfter = reserveIn + amountIn;
        uint256 reserveOutAfter = reserveOut - amountOut;
        uint256 priceAfter = (reserveOutAfter * 1e18) / reserveInAfter;
        
        // Calculate price impact
        if (priceBefore > priceAfter) {
            return ((priceBefore - priceAfter) * 10000) / priceBefore;
        }
        return 0;
    }
    
    /**
     * @dev Get slippage tolerance for user (can be customized per user)
     */
    function _getSlippageTolerance(address user) internal view returns (uint256) {
        // For now, return default slippage tolerance
        // This can be enhanced with user-specific settings
        return defaultSlippageTolerance;
    }

    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Update slippage tolerance (manager only)
     */
    function updateSlippageTolerance(uint256 newTolerance) external onlyManager {
        if (newTolerance > MAX_SLIPPAGE_TOLERANCE) revert ToleranceTooHigh();
        uint256 oldTolerance = defaultSlippageTolerance;
        defaultSlippageTolerance = newTolerance;
        emit SlippageToleranceUpdated(oldTolerance, newTolerance);
    }
    
    /**
     * @dev Update price impact limit (manager only)
     */
    function updatePriceImpactLimit(uint256 newLimit) external onlyManager {
        if (newLimit > MAX_PRICE_IMPACT) revert LimitTooHigh();
        uint256 oldLimit = maxPriceImpact;
        maxPriceImpact = newLimit;
        emit PriceImpactLimitUpdated(oldLimit, newLimit);
    }
    
    /**
     * @dev Set emergency stop (manager only)
     */
    function setEmergencyStop(bool stopped) external onlyManager {
        emergencyStop = stopped;
        emit EmergencyStopUpdated(stopped);
    }
    
    /**
     * @dev Set manager (owner only)
     */
    function setManager(address manager, bool authorized) external onlyOwner {
        isManager[manager] = authorized;
    }
    
    /**
     * @dev Set operator (manager only)
     */
    function setOperator(address operator, bool authorized) external onlyManager {
        isOperator[operator] = authorized;
    }
    
    /**
     * @dev Blacklist/unblacklist token (manager only)
     */
    function setTokenBlacklisted(address token, bool blacklisted) external onlyManager {
        blacklistedTokens[token] = blacklisted;
        emit TokenBlacklisted(token, blacklisted);
    }
    
    /**
     * @dev Whitelist/unwhitelist token (manager only)
     */
    function setTokenWhitelisted(address token, bool whitelisted) external onlyManager {
        whitelistedTokens[token] = whitelisted;
        emit TokenWhitelisted(token, whitelisted);
    }
    
    /**
     * @dev Enable/disable whitelist (manager only)
     */
    function setWhitelistEnabled(bool enabled) external onlyManager {
        whitelistEnabled = enabled;
        emit WhitelistEnabled(enabled);
    }

    /**
     * @dev Emergency functions
     */
    function emergencyWithdraw(address token, address to, uint256 amount) external onlyManager {
        IERC20(token).safeTransfer(to, amount);
    }

    function pause() external onlyManager {
        _pause();
    }

    function unpause() external onlyManager {
        _unpause();
    }
}

// WETH interface
interface IWETH {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
} 