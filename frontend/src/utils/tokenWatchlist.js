// Token Watchlist Utility
// Manages user's token watchlist and alerts

const WATCHLIST_STORAGE_KEY = 'tokenWatchlist';
const ALERTS_STORAGE_KEY = 'tokenAlerts';

/**
 * Get all tokens in watchlist
 */
export const getWatchlist = () => {
  try {
    const watchlist = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    return watchlist ? JSON.parse(watchlist) : [];
  } catch (error) {
    console.error('Error reading watchlist from localStorage:', error);
    return [];
  }
};

/**
 * Add token to watchlist
 */
export const addToWatchlist = (token) => {
  try {
    const watchlist = getWatchlist();
    const exists = watchlist.some(
      item => item.address === token.address && item.chainId === token.chainId
    );
    
    if (!exists) {
      watchlist.push({
        ...token,
        addedAt: new Date().toISOString()
      });
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
    }
    return watchlist;
  } catch (error) {
    console.error('Error adding token to watchlist:', error);
    return getWatchlist();
  }
};

/**
 * Remove token from watchlist
 */
export const removeFromWatchlist = (address, chainId) => {
  try {
    let watchlist = getWatchlist();
    watchlist = watchlist.filter(
      item => !(item.address === address && item.chainId === chainId)
    );
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
    
    // Also remove any alerts for this token
    removeAlertsForToken(address, chainId);
    
    return watchlist;
  } catch (error) {
    console.error('Error removing token from watchlist:', error);
    return getWatchlist();
  }
};

/**
 * Check if token is in watchlist
 */
export const isInWatchlist = (address, chainId) => {
  const watchlist = getWatchlist();
  return watchlist.some(
    item => item.address === address && item.chainId === chainId
  );
};

/**
 * Get all alerts
 */
export const getAlerts = () => {
  try {
    const alerts = localStorage.getItem(ALERTS_STORAGE_KEY);
    return alerts ? JSON.parse(alerts) : [];
  } catch (error) {
    console.error('Error reading alerts from localStorage:', error);
    return [];
  }
};

/**
 * Add alert for a token
 */
export const addAlert = (alert) => {
  try {
    const alerts = getAlerts();
    const alertId = `${alert.address}-${alert.chainId}-${alert.type}-${Date.now()}`;
    const newAlert = {
      ...alert,
      id: alertId,
      createdAt: new Date().toISOString(),
      triggered: false
    };
    alerts.push(newAlert);
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    return alerts;
  } catch (error) {
    console.error('Error adding alert:', error);
    return getAlerts();
  }
};

/**
 * Remove alert
 */
export const removeAlert = (alertId) => {
  try {
    let alerts = getAlerts();
    alerts = alerts.filter(alert => alert.id !== alertId);
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    return alerts;
  } catch (error) {
    console.error('Error removing alert:', error);
    return getAlerts();
  }
};

/**
 * Remove all alerts for a token
 */
export const removeAlertsForToken = (address, chainId) => {
  try {
    let alerts = getAlerts();
    alerts = alerts.filter(
      alert => !(alert.address === address && alert.chainId === chainId)
    );
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    return alerts;
  } catch (error) {
    console.error('Error removing alerts for token:', error);
    return getAlerts();
  }
};

/**
 * Get alerts for a specific token
 */
export const getAlertsForToken = (address, chainId) => {
  const alerts = getAlerts();
  return alerts.filter(
    alert => alert.address === address && alert.chainId === chainId
  );
};

/**
 * Mark alert as triggered
 */
export const markAlertTriggered = (alertId) => {
  try {
    const alerts = getAlerts();
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
      alert.triggered = true;
      alert.triggeredAt = new Date().toISOString();
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    }
    return alerts;
  } catch (error) {
    console.error('Error marking alert as triggered:', error);
    return getAlerts();
  }
};

/**
 * Clear all triggered alerts
 */
export const clearTriggeredAlerts = () => {
  try {
    let alerts = getAlerts();
    alerts = alerts.filter(alert => !alert.triggered);
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    return alerts;
  } catch (error) {
    console.error('Error clearing triggered alerts:', error);
    return getAlerts();
  }
};

