// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title PriceOracle
 * @dev Price oracle for mochi that aggregates price feeds from multiple sources
 * @author Your Name
 * @notice Provides price data for tokens across multiple chains
 * @custom:security-contact security@mochi.com
 */
contract PriceOracle is Ownable, Pausable {
    // Price feed mapping: token => price feed address
    mapping(address => address) public priceFeeds;
    
    // Fallback prices for tokens without Chainlink feeds
    mapping(address => uint256) public fallbackPrices;
    
    // Price update events
    event PriceFeedUpdated(address indexed token, address indexed priceFeed);
    event FallbackPriceUpdated(address indexed token, uint256 price);
    event PriceUpdated(address indexed token, uint256 price, uint256 timestamp);
    
    // Minimum price update interval
    uint256 public constant MIN_UPDATE_INTERVAL = 1 hours;
    
    // Last update timestamps
    mapping(address => uint256) public lastUpdateTime;
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Get the latest price for a token
     */
    function getPrice(address token) external view returns (uint256) {
        require(priceFeeds[token] != address(0) || fallbackPrices[token] > 0, "Oracle: No price feed available");
        
        if (priceFeeds[token] != address(0)) {
            return getChainlinkPrice(token);
        } else {
            return fallbackPrices[token];
        }
    }
    
    /**
     * @dev Get price from Chainlink feed
     */
    function getChainlinkPrice(address token) public view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeeds[token]);
        
        (
            /* uint80 roundID */,
            int256 price,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();
        
        require(price > 0, "Oracle: Invalid price");
        return uint256(price);
    }
    
    /**
     * @dev Get price with decimals
     */
    function getPriceWithDecimals(address token) external view returns (uint256 price, uint8 decimals) {
        if (priceFeeds[token] != address(0)) {
            AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeeds[token]);
            decimals = priceFeed.decimals();
            price = getChainlinkPrice(token);
        } else {
            decimals = 8; // Default to 8 decimals
            price = fallbackPrices[token];
        }
    }
    
    /**
     * @dev Set Chainlink price feed for a token
     */
    function setPriceFeed(address token, address priceFeed) external onlyOwner {
        require(priceFeed != address(0), "Oracle: Invalid price feed address");
        priceFeeds[token] = priceFeed;
        emit PriceFeedUpdated(token, priceFeed);
    }
    
    /**
     * @dev Set fallback price for a token
     */
    function setFallbackPrice(address token, uint256 price) external onlyOwner {
        require(price > 0, "Oracle: Invalid price");
        fallbackPrices[token] = price;
        lastUpdateTime[token] = block.timestamp;
        emit FallbackPriceUpdated(token, price);
        emit PriceUpdated(token, price, block.timestamp);
    }
    
    /**
     * @dev Update fallback price (with time check)
     */
    function updateFallbackPrice(address token, uint256 price) external onlyOwner {
        require(price > 0, "Oracle: Invalid price");
        require(
            block.timestamp >= lastUpdateTime[token] + MIN_UPDATE_INTERVAL,
            "Oracle: Update too frequent"
        );
        
        fallbackPrices[token] = price;
        lastUpdateTime[token] = block.timestamp;
        emit FallbackPriceUpdated(token, price);
        emit PriceUpdated(token, price, block.timestamp);
    }
    
    /**
     * @dev Remove price feed for a token
     */
    function removePriceFeed(address token) external onlyOwner {
        priceFeeds[token] = address(0);
        emit PriceFeedUpdated(token, address(0));
    }
    
    /**
     * @dev Check if price feed exists for token
     */
    function hasPriceFeed(address token) external view returns (bool) {
        return priceFeeds[token] != address(0) || fallbackPrices[token] > 0;
    }
    
    /**
     * @dev Get price feed address for token
     */
    function getPriceFeedAddress(address token) external view returns (address) {
        return priceFeeds[token];
    }
    
    /**
     * @dev Pause oracle operations
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause oracle operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get multiple prices at once
     */
    function getMultiplePrices(address[] calldata tokens) external view returns (uint256[] memory prices) {
        prices = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            prices[i] = this.getPrice(tokens[i]);
        }
    }
    
    /**
     * @dev Calculate price impact for a swap
     */
    function calculatePriceImpact(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    ) external view returns (uint256 impact) {
        uint256 priceIn = this.getPrice(tokenIn);
        uint256 priceOut = this.getPrice(tokenOut);
        
        uint256 expectedOut = (amountIn * priceIn) / priceOut;
        if (expectedOut > amountOut) {
            impact = ((expectedOut - amountOut) * 10000) / expectedOut; // Basis points
        }
    }
} 