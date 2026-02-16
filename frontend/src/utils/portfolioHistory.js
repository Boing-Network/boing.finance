// Portfolio History Utility
// Manages historical portfolio data for charts

const HISTORY_KEY = 'boing_portfolio_history';
const MAX_HISTORY_DAYS = 30; // Keep 30 days of history

/**
 * Save portfolio snapshot
 */
export const savePortfolioSnapshot = (portfolioValue, timestamp = null) => {
  try {
    const history = getPortfolioHistory();
    const snapshot = {
      value: parseFloat(portfolioValue) || 0,
      timestamp: timestamp || new Date().toISOString()
    };
    
    history.push(snapshot);
    
    // Keep only last MAX_HISTORY_DAYS
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_HISTORY_DAYS);
    
    const filtered = history.filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= cutoffDate;
    });
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error saving portfolio snapshot:', error);
    return false;
  }
};

/**
 * Get portfolio history
 */
export const getPortfolioHistory = () => {
  try {
    const history = localStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error getting portfolio history:', error);
    return [];
  }
};

/**
 * Get portfolio history for chart (formatted for Recharts)
 */
export const getPortfolioHistoryForChart = (days = 7) => {
  const history = getPortfolioHistory();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const filtered = history
    .filter(item => new Date(item.timestamp) >= cutoffDate)
    .map(item => ({
      date: new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: item.value,
      timestamp: item.timestamp
    }))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  // Fill in missing days with last known value
  const result = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    const existing = filtered.find(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate.toDateString() === date.toDateString();
    });
    
    if (existing) {
      result.push(existing);
    } else {
      // Use last known value or 0
      const lastValue = result.length > 0 ? result[result.length - 1].value : 0;
      result.push({
        date: dateStr,
        value: lastValue,
        timestamp: date.toISOString()
      });
    }
  }
  
  return result;
};

/**
 * Clear portfolio history
 */
export const clearPortfolioHistory = () => {
  try {
    localStorage.removeItem(HISTORY_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing portfolio history:', error);
    return false;
  }
};

const portfolioHistory = {
  savePortfolioSnapshot,
  getPortfolioHistory,
  getPortfolioHistoryForChart,
  clearPortfolioHistory
};
export default portfolioHistory;

