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
    error NoPriceFeedAvailable();
    error InvalidPrice();
    error StaleRound();
    error StalePrice();
    error InvalidPriceFeedAddress();
    error UpdateTooFrequent();

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
        if (priceFeeds[token] == address(0) && fallbackPrices[token] == 0) revert NoPriceFeedAvailable();
        
        if (priceFeeds[token] != address(0)) {
            return getChainlinkPrice(token);
        } else {
            return fallbackPrices[token];
        }
    }
    
    // Maximum allowed staleness for Chainlink price (default 1 hour)
    uint256 public constant MAX_PRICE_AGE = 1 hours;

    /**
     * @dev Get price from Chainlink feed with staleness and validity checks (industry standard)
     */
    function getChainlinkPrice(address token) public view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeeds[token]);
        
        (
            uint80 roundId,
            int256 price,
            ,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        
        if (price <= 0) revert InvalidPrice();
        if (answeredInRound < roundId) revert StaleRound();
        if (block.timestamp - updatedAt > MAX_PRICE_AGE) revert StalePrice();
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
        if (priceFeed == address(0)) revert InvalidPriceFeedAddress();
        priceFeeds[token] = priceFeed;
        emit PriceFeedUpdated(token, priceFeed);
    }
    
    /**
     * @dev Set fallback price for a token
     */
    function setFallbackPrice(address token, uint256 price) external onlyOwner {
        if (price == 0) revert InvalidPrice();
        fallbackPrices[token] = price;
        lastUpdateTime[token] = block.timestamp;
        emit FallbackPriceUpdated(token, price);
        emit PriceUpdated(token, price, block.timestamp);
    }
    
    /**
     * @dev Update fallback price (with time check)
     */
    function updateFallbackPrice(address token, uint256 price) external onlyOwner {
        if (price == 0) revert InvalidPrice();
        if (block.timestamp < lastUpdateTime[token] + MIN_UPDATE_INTERVAL) revert UpdateTooFrequent();
        
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