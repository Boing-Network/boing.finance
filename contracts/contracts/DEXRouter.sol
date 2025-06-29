// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IDEXFactory.sol";
import "./interfaces/IDEXPair.sol";

/**
 * @title DEXRouter
 * @dev Router contract for user-friendly DEX operations
 * Provides exact token swaps, slippage protection, and multi-hop functionality
 */
contract DEXRouter is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    // Factory address
    address public immutable factory;
    
    // WETH address (for ETH swaps)
    address public immutable WETH;
    
    // Events
    event SwapExactTokensForTokens(
        address indexed sender,
        uint256 amountIn,
        uint256 amountOutMin,
        address[] path,
        address indexed to,
        uint256 deadline
    );
    
    event SwapTokensForExactTokens(
        address indexed sender,
        uint256 amountOut,
        uint256 amountInMax,
        address[] path,
        address indexed to,
        uint256 deadline
    );
    
    event SwapExactETHForTokens(
        address indexed sender,
        uint256 amountIn,
        uint256 amountOutMin,
        address[] path,
        address indexed to,
        uint256 deadline
    );
    
    event SwapTokensForExactETH(
        address indexed sender,
        uint256 amountOut,
        uint256 amountInMax,
        address[] path,
        address indexed to,
        uint256 deadline
    );

    constructor(address _factory, address _WETH) Ownable(msg.sender) {
        factory = _factory;
        WETH = _WETH;
    }

    // Ensure the contract can receive ETH
    receive() external payable {
        assert(msg.sender == WETH); // Only accept ETH from WETH contract
    }

    /**
     * @dev Swap exact tokens for tokens
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external nonReentrant whenNotPaused returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "Router: EXPIRED");
        require(path.length >= 2, "Router: INVALID_PATH");
        require(to != address(0), "Router: INVALID_TO");
        
        amounts = getAmountsOut(amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "Router: INSUFFICIENT_OUTPUT_AMOUNT");
        
        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn);
        _swap(amounts, path, to);
        
        emit SwapExactTokensForTokens(msg.sender, amountIn, amountOutMin, path, to, deadline);
    }

    /**
     * @dev Swap tokens for exact tokens
     */
    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external nonReentrant whenNotPaused returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "Router: EXPIRED");
        require(path.length >= 2, "Router: INVALID_PATH");
        require(to != address(0), "Router: INVALID_TO");
        
        amounts = getAmountsIn(amountOut, path);
        require(amounts[0] <= amountInMax, "Router: EXCESSIVE_INPUT_AMOUNT");
        
        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amounts[0]);
        _swap(amounts, path, to);
        
        emit SwapTokensForExactTokens(msg.sender, amountOut, amountInMax, path, to, deadline);
    }

    /**
     * @dev Swap exact ETH for tokens
     */
    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable nonReentrant whenNotPaused returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "Router: EXPIRED");
        require(path.length >= 2, "Router: INVALID_PATH");
        require(path[0] == WETH, "Router: INVALID_PATH");
        require(to != address(0), "Router: INVALID_TO");
        
        amounts = getAmountsOut(msg.value, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "Router: INSUFFICIENT_OUTPUT_AMOUNT");
        
        // Wrap ETH to WETH
        IWETH(WETH).deposit{value: msg.value}();
        
        _swap(amounts, path, to);
        
        emit SwapExactETHForTokens(msg.sender, msg.value, amountOutMin, path, to, deadline);
    }

    /**
     * @dev Swap tokens for exact ETH
     */
    function swapTokensForExactETH(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external nonReentrant whenNotPaused returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "Router: EXPIRED");
        require(path.length >= 2, "Router: INVALID_PATH");
        require(path[path.length - 1] == WETH, "Router: INVALID_PATH");
        require(to != address(0), "Router: INVALID_TO");
        
        amounts = getAmountsIn(amountOut, path);
        require(amounts[0] <= amountInMax, "Router: EXCESSIVE_INPUT_AMOUNT");
        
        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amounts[0]);
        _swap(amounts, path, address(this));
        
        // Unwrap WETH to ETH
        IWETH(WETH).withdraw(amounts[amounts.length - 1]);
        
        // Transfer ETH to recipient
        (bool success,) = to.call{value: amounts[amounts.length - 1]}("");
        require(success, "Router: ETH_TRANSFER_FAILED");
        
        emit SwapTokensForExactETH(msg.sender, amountOut, amountInMax, path, to, deadline);
    }

    /**
     * @dev Add liquidity to a pair
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
    ) external nonReentrant whenNotPaused returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        require(deadline >= block.timestamp, "Router: EXPIRED");
        require(to != address(0), "Router: INVALID_TO");
        
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
        address pair = IDEXFactory(factory).getPairAddress(tokenA, tokenB);
        
        IERC20(tokenA).safeTransferFrom(msg.sender, pair, amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, pair, amountB);
        
        liquidity = IDEXPair(pair).mint(to);
    }

    /**
     * @dev Remove liquidity from a pair
     */
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external nonReentrant whenNotPaused returns (uint256 amountA, uint256 amountB) {
        require(deadline >= block.timestamp, "Router: EXPIRED");
        require(to != address(0), "Router: INVALID_TO");
        
        address pair = IDEXFactory(factory).getPairAddress(tokenA, tokenB);
        IDEXPair(pair).transferFrom(msg.sender, pair, liquidity);
        (amountA, amountB) = IDEXPair(pair).burn(to);
        
        require(amountA >= amountAMin, "Router: INSUFFICIENT_A_AMOUNT");
        require(amountB >= amountBMin, "Router: INSUFFICIENT_B_AMOUNT");
    }

    // View functions
    function getAmountsOut(uint256 amountIn, address[] calldata path) 
        public 
        view 
        returns (uint256[] memory amounts) 
    {
        require(path.length >= 2, "Router: INVALID_PATH");
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
        require(path.length >= 2, "Router: INVALID_PATH");
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
        require(amountIn > 0, "Router: INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "Router: INSUFFICIENT_LIQUIDITY");
        
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
        require(amountOut > 0, "Router: INSUFFICIENT_OUTPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "Router: INSUFFICIENT_LIQUIDITY");
        
        uint256 numerator = reserveIn * amountOut * 1000;
        uint256 denominator = (reserveOut - amountOut) * 997; // 0.3% fee
        amountIn = (numerator / denominator) + 1;
    }

    // Internal functions
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
                    require(amountBOptimal >= amountBMin, "Router: INSUFFICIENT_B_AMOUNT");
                    (amountA, amountB) = (amountADesired, amountBOptimal);
                } else {
                    uint256 amountAOptimal = quote(amountBDesired, reserveB, reserveA);
                    assert(amountAOptimal <= amountADesired);
                    require(amountAOptimal >= amountAMin, "Router: INSUFFICIENT_A_AMOUNT");
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
        require(amountA > 0, "Router: INSUFFICIENT_AMOUNT");
        require(reserveA > 0 && reserveB > 0, "Router: INSUFFICIENT_LIQUIDITY");
        amountB = (amountA * reserveB) / reserveA;
    }

    function sortTokens(address tokenA, address tokenB) 
        public 
        pure 
        returns (address token0, address token1) 
    {
        return tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
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

// WETH interface
interface IWETH {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
} 