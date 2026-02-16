// Predictive Analytics Utility
// Provides basic price predictions and trend analysis

/**
 * Calculate simple moving average
 */
export const calculateSMA = (prices, period = 7) => {
  if (prices.length < period) return null;
  const recent = prices.slice(-period);
  return recent.reduce((sum, price) => sum + price, 0) / period;
};

/**
 * Calculate exponential moving average
 */
export const calculateEMA = (prices, period = 7) => {
  if (prices.length < period) return null;
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
};

/**
 * Calculate price trend (simple linear regression)
 */
export const calculateTrend = (prices) => {
  if (prices.length < 2) return { direction: 'neutral', strength: 0 };
  
  const n = prices.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = prices;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R-squared for strength
  const yMean = sumY / n;
  const ssRes = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const rSquared = 1 - (ssRes / ssTot);
  
  return {
    direction: slope > 0 ? 'up' : slope < 0 ? 'down' : 'neutral',
    strength: Math.abs(rSquared),
    slope,
    intercept
  };
};

/**
 * Predict next price using simple trend extrapolation
 */
export const predictNextPrice = (prices, days = 1) => {
  const trend = calculateTrend(prices);
  if (!trend || trend.slope === 0) {
    return prices[prices.length - 1]; // Return last known price
  }
  
  const _lastPrice = prices[prices.length - 1];
  const predicted = trend.slope * (prices.length + days - 1) + trend.intercept;
  
  // Don't predict negative prices
  return Math.max(0, predicted);
};

/**
 * Calculate volatility (standard deviation of returns)
 */
export const calculateVolatility = (prices) => {
  if (prices.length < 2) return 0;
  
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
  }
  
  if (returns.length === 0) return 0;
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance) * 100; // Return as percentage
};

/**
 * Get price prediction with confidence
 */
export const getPricePrediction = (historicalPrices, daysAhead = 7) => {
  if (!historicalPrices || historicalPrices.length < 7) {
    return {
      predictedPrice: null,
      confidence: 0,
      trend: 'neutral',
      volatility: 0,
      message: 'Insufficient data for prediction'
    };
  }
  
  const prices = historicalPrices.map(p => parseFloat(p) || 0).filter(p => p > 0);
  
  if (prices.length < 7) {
    return {
      predictedPrice: null,
      confidence: 0,
      trend: 'neutral',
      volatility: 0,
      message: 'Insufficient data for prediction'
    };
  }
  
  const sma = calculateSMA(prices, 7);
  const ema = calculateEMA(prices, 7);
  const trend = calculateTrend(prices);
  const volatility = calculateVolatility(prices);
  const predictedPrice = predictNextPrice(prices, daysAhead);
  
  // Calculate confidence based on data quality and trend strength
  const dataQuality = Math.min(prices.length / 30, 1); // More data = higher confidence
  const trendStrength = trend.strength;
  const confidence = (dataQuality * 0.5 + trendStrength * 0.5) * 100;
  
  return {
    predictedPrice,
    confidence: Math.round(confidence),
    trend: trend.direction,
    trendStrength: trend.strength,
    volatility: Math.round(volatility * 100) / 100,
    sma,
    ema,
    currentPrice: prices[prices.length - 1],
    message: confidence > 50 ? 'Moderate confidence prediction' : 'Low confidence prediction - use with caution'
  };
};

const predictiveAnalytics = {
  calculateSMA,
  calculateEMA,
  calculateTrend,
  predictNextPrice,
  calculateVolatility,
  getPricePrediction
};
export default predictiveAnalytics;

