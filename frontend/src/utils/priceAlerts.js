// Price Alerts Utility
// Manages price alerts for tokens

const ALERTS_KEY = 'boing_price_alerts';

/**
 * Get all price alerts
 */
export const getPriceAlerts = () => {
  try {
    const alerts = localStorage.getItem(ALERTS_KEY);
    return alerts ? JSON.parse(alerts) : [];
  } catch (error) {
    console.error('Error getting price alerts:', error);
    return [];
  }
};

/**
 * Add price alert
 */
export const addPriceAlert = (alert) => {
  try {
    const alerts = getPriceAlerts();
    const newAlert = {
      id: Date.now().toString(),
      tokenAddress: alert.tokenAddress,
      tokenSymbol: alert.tokenSymbol,
      tokenName: alert.tokenName,
      chainId: alert.chainId || 1,
      targetPrice: parseFloat(alert.targetPrice),
      condition: alert.condition || 'above', // 'above' or 'below'
      currentPrice: alert.currentPrice || 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      triggeredAt: null,
      notificationSent: false
    };
    
    alerts.push(newAlert);
    localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
    return newAlert;
  } catch (error) {
    console.error('Error adding price alert:', error);
    return null;
  }
};

/**
 * Remove price alert
 */
export const removePriceAlert = (alertId) => {
  try {
    const alerts = getPriceAlerts();
    const filtered = alerts.filter(a => a.id !== alertId);
    localStorage.setItem(ALERTS_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error removing price alert:', error);
    return false;
  }
};

/**
 * Update price alert
 */
export const updatePriceAlert = (alertId, updates) => {
  try {
    const alerts = getPriceAlerts();
    const updated = alerts.map(a => {
      if (a.id === alertId) {
        return { ...a, ...updates };
      }
      return a;
    });
    localStorage.setItem(ALERTS_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error updating price alert:', error);
    return false;
  }
};

/**
 * Check and trigger alerts
 */
export const checkPriceAlerts = (tokenAddress, chainId, currentPrice) => {
  try {
    const alerts = getPriceAlerts();
    const triggered = [];
    
    alerts.forEach(alert => {
      if (
        alert.isActive &&
        alert.tokenAddress?.toLowerCase() === tokenAddress?.toLowerCase() &&
        alert.chainId === chainId &&
        !alert.notificationSent
      ) {
        let shouldTrigger = false;
        
        if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
          shouldTrigger = true;
        } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
          shouldTrigger = true;
        }
        
        if (shouldTrigger) {
          updatePriceAlert(alert.id, {
            triggeredAt: new Date().toISOString(),
            notificationSent: true,
            isActive: false
          });
          triggered.push(alert);
        }
      }
    });
    
    return triggered;
  } catch (error) {
    console.error('Error checking price alerts:', error);
    return [];
  }
};

/**
 * Get active alerts for a token
 */
export const getActiveAlertsForToken = (tokenAddress, chainId) => {
  try {
    const alerts = getPriceAlerts();
    return alerts.filter(a => 
      a.isActive &&
      a.tokenAddress?.toLowerCase() === tokenAddress?.toLowerCase() &&
      a.chainId === chainId
    );
  } catch (error) {
    console.error('Error getting active alerts:', error);
    return [];
  }
};

/**
 * Clear all alerts
 */
export const clearAllAlerts = () => {
  try {
    localStorage.removeItem(ALERTS_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing alerts:', error);
    return false;
  }
};

const priceAlerts = {
  getPriceAlerts,
  addPriceAlert,
  removePriceAlert,
  updatePriceAlert,
  checkPriceAlerts,
  getActiveAlertsForToken,
  clearAllAlerts
};
export default priceAlerts;

