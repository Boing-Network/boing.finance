// Price Alert Monitoring Service
// Checks and triggers price alerts periodically

import { getPriceAlerts, checkPriceAlerts, updatePriceAlert } from '../utils/priceAlerts';
import coingeckoService from './coingeckoService';

class PriceAlertService {
  constructor() {
    this.intervalId = null;
    this.checkInterval = 60000; // Check every minute
    this.isRunning = false;
  }

  /**
   * Start monitoring price alerts
   */
  start() {
    if (this.isRunning) {
      console.warn('Price alert service is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting price alert monitoring service');

    // Check immediately
    this.checkAllAlerts();

    // Then check periodically
    this.intervalId = setInterval(() => {
      this.checkAllAlerts();
    }, this.checkInterval);
  }

  /**
   * Stop monitoring price alerts
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Stopped price alert monitoring service');
  }

  /**
   * Check all active alerts
   */
  async checkAllAlerts() {
    try {
      const alerts = getPriceAlerts();
      const activeAlerts = alerts.filter(a => a.isActive && !a.notificationSent);

      if (activeAlerts.length === 0) {
        return;
      }

      console.log(`Checking ${activeAlerts.length} active price alerts`);

      // Group alerts by token address and chainId to minimize API calls
      const tokenMap = new Map();
      activeAlerts.forEach(alert => {
        const key = `${alert.tokenAddress}-${alert.chainId}`;
        if (!tokenMap.has(key)) {
          tokenMap.set(key, []);
        }
        tokenMap.get(key).push(alert);
      });

      // Check each unique token
      for (const [key, _tokenAlerts] of tokenMap.entries()) {
        const [address, chainId] = key.split('-');
        
        try {
          // Get current price
          const networkMap = {
            1: 'ethereum',
            137: 'polygon',
            56: 'binance-smart-chain',
            42161: 'arbitrum',
            10: 'optimistic-ethereum',
            8453: 'base',
            11155111: 'ethereum'
          };
          const network = networkMap[parseInt(chainId)] || 'ethereum';
          
          const priceData = await coingeckoService.getTokenPrice(address, network);
          const currentPrice = priceData?.usd != null ? parseFloat(priceData.usd) : null;

          if (currentPrice != null && !isNaN(currentPrice)) {
            const triggered = checkPriceAlerts(address, parseInt(chainId), currentPrice);
            triggered.forEach(triggeredAlert => {
              this.triggerAlert(triggeredAlert, currentPrice);
            });
          }
        } catch (error) {
          console.error(`Error checking price for ${key}:`, error);
        }
      }
    } catch (error) {
      console.error('Error checking price alerts:', error);
    }
  }

  /**
   * Trigger an alert notification
   */
  triggerAlert(alert, currentPrice) {
    console.log('Price alert triggered:', alert);
    
    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Price Alert: ${alert.tokenSymbol}`, {
        body: `Price is now $${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} (${alert.condition === 'above' ? 'above' : 'below'} target of $${alert.targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })})`,
        icon: '/favicon.png',
        tag: `price-alert-${alert.id}`
      });
    }

    // Update alert status
    updatePriceAlert(alert.id, {
      triggeredAt: new Date().toISOString(),
      notificationSent: true,
      isActive: false
    });
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
}

const priceAlertServiceInstance = new PriceAlertService();
export default priceAlertServiceInstance;

