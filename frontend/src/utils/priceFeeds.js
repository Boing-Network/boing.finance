import { ethers } from 'ethers';

// Chainlink Price Feed ABI
const PRICE_FEED_ABI = [
  'function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
  'function decimals() view returns (uint8)'
];

// Known Chainlink Price Feed addresses for different networks
const PRICE_FEEDS = {
  // Sepolia Testnet
  '11155111': {
    ETH: '0x694AA1769357215DE4FAC081bf1f309aDC325306', // ETH/USD
    USDC: '0x1cDc4F51831F4eE8A1B2Aa6FD79A84821E5577DF', // USDC/USD
    USDT: '0xa82fF9aFd8f496c3d6ac40e2a0F282E47488CFc9'  // USDT/USD
  },
  // Ethereum Mainnet
  '1': {
    ETH: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', // ETH/USD
    USDC: '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6', // USDC/USD
    USDT: '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D'  // USDT/USD
  },
  // Polygon
  '137': {
    ETH: '0xF9680D99D6C9589e2a93a78A04A279e509205945', // ETH/USD
    USDC: '0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7', // USDC/USD
    USDT: '0x0A6513e40db6eb1b165753AD52E80663aeA50545'  // USDT/USD
  }
};

// Get provider for a specific chain
const getProvider = (chainId) => {
  const networks = {
    '1': 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
    '137': 'https://polygon-rpc.com',
    '11155111': 'https://sepolia.infura.io/v3/your-api-key'
  };
  
  const rpcUrl = networks[chainId];
  if (!rpcUrl) return null;
  
  return new ethers.JsonRpcProvider(rpcUrl);
};

// Get price from Chainlink price feed
export const getPriceFromFeed = async (feedAddress, chainId) => {
  try {
    const provider = getProvider(chainId);
    if (!provider) return null;

    const priceFeed = new ethers.Contract(feedAddress, PRICE_FEED_ABI, provider);
    
    const [roundData, decimals] = await Promise.all([
      priceFeed.latestRoundData(),
      priceFeed.decimals()
    ]);

    const { answer } = roundData;
    const price = parseFloat(ethers.formatUnits(answer, decimals));
    
    return price;
  } catch (error) {
    console.error('Error fetching price from feed:', error);
    return null;
  }
};

// Get ETH price for a specific chain
export const getETHPrice = async (chainId) => {
  const feeds = PRICE_FEEDS[chainId];
  if (!feeds || !feeds.ETH) return null;
  
  return await getPriceFromFeed(feeds.ETH, chainId);
};

// Get USDC price for a specific chain
export const getUSDCPrice = async (chainId) => {
  const feeds = PRICE_FEEDS[chainId];
  if (!feeds || !feeds.USDC) return null;
  
  return await getPriceFromFeed(feeds.USDC, chainId);
};

// Calculate token price based on ETH pair (if available)
export const calculateTokenPrice = async (tokenAddress, chainId, ethPrice = null) => {
  try {
    // For now, return a placeholder price
    // In a full implementation, this would:
    // 1. Check if token has a direct USD price feed
    // 2. Check if token has an ETH pair and calculate price from ETH price
    // 3. Check if token has a USDC pair and calculate price from USDC price
    
    if (!ethPrice) {
      ethPrice = await getETHPrice(chainId) || 2000; // Fallback to $2000
    }
    
    // Placeholder calculation - in reality this would come from DEX pairs
    const basePrice = 0.001; // Base price in ETH
    const priceInUSD = basePrice * ethPrice;
    
    return priceInUSD;
  } catch (error) {
    console.error('Error calculating token price:', error);
    return 0;
  }
};

// Calculate market cap
export const calculateMarketCap = (totalSupply, decimals, priceUSD) => {
  try {
    const supply = parseFloat(ethers.formatUnits(totalSupply, decimals));
    return supply * priceUSD;
  } catch (error) {
    console.error('Error calculating market cap:', error);
    return 0;
  }
};

// Calculate 24h volume (placeholder - would come from DEX data)
export const calculateVolume24h = (marketCap) => {
  // Placeholder: 5% of market cap as volume
  return marketCap * 0.05;
};

// Calculate 24h price change (placeholder - would come from historical data)
export const calculatePriceChange24h = () => {
  // Placeholder: random change between -10% and +10%
  return (Math.random() - 0.5) * 20;
}; 