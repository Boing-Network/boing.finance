// Token Watchlist Utility
// Manages user's favorite/watched tokens

const WATCHLIST_KEY = 'boing_token_watchlist';

/**
 * Get all watched tokens
 */
export const getWatchlist = () => {
  try {
    const watchlist = localStorage.getItem(WATCHLIST_KEY);
    return watchlist ? JSON.parse(watchlist) : [];
  } catch (error) {
    console.error('Error getting watchlist:', error);
    return [];
  }
};

/**
 * Add token to watchlist
 */
export const addToWatchlist = (token) => {
  try {
    const watchlist = getWatchlist();
    const exists = watchlist.some(t => 
      t.address?.toLowerCase() === token.address?.toLowerCase() && 
      t.chainId === token.chainId
    );
    
    if (!exists) {
      const newToken = {
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        chainId: token.chainId || 1,
        addedAt: new Date().toISOString(),
        logo: token.logo,
        price: token.price || 0
      };
      watchlist.push(newToken);
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return false;
  }
};

/**
 * Remove token from watchlist
 */
export const removeFromWatchlist = (address, chainId) => {
  try {
    const watchlist = getWatchlist();
    const filtered = watchlist.filter(t => 
      !(t.address?.toLowerCase() === address?.toLowerCase() && t.chainId === chainId)
    );
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return false;
  }
};

/**
 * Check if token is in watchlist
 */
export const isInWatchlist = (address, chainId) => {
  try {
    const watchlist = getWatchlist();
    return watchlist.some(t => 
      t.address?.toLowerCase() === address?.toLowerCase() && 
      t.chainId === chainId
    );
  } catch (error) {
    console.error('Error checking watchlist:', error);
    return false;
  }
};

/**
 * Update token price in watchlist
 */
export const updateWatchlistPrice = (address, chainId, price) => {
  try {
    const watchlist = getWatchlist();
    const updated = watchlist.map(t => {
      if (t.address?.toLowerCase() === address?.toLowerCase() && t.chainId === chainId) {
        return { ...t, price, lastUpdated: new Date().toISOString() };
      }
      return t;
    });
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error updating watchlist price:', error);
    return false;
  }
};

/**
 * Clear entire watchlist
 */
export const clearWatchlist = () => {
  try {
    localStorage.removeItem(WATCHLIST_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing watchlist:', error);
    return false;
  }
};

/**
 * Get watchlist count
 */
export const getWatchlistCount = () => {
  return getWatchlist().length;
};

const tokenWatchlist = {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
  updateWatchlistPrice,
  clearWatchlist,
  getWatchlistCount
};
export default tokenWatchlist;
