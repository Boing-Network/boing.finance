// Price Alert Monitoring Service
// Checks and triggers price alerts periodically

import { getPriceAlerts, checkPriceAlerts, updatePriceAlert } from '../utils/priceAlerts';
import { brandLogoMarkPathWithCacheBust } from '../config/brandAssets';
import coingeckoService from './coingeckoService';

const COINGECKO_PLATFORM_BY_CHAIN = {
  1: 'ethereum',
  137: 'polygon-pos',
  56: 'binance-smart-chain',
  42161: 'arbitrum-one',
  10: 'optimistic-ethereum',
  8453: 'base',
  11155111: 'ethereum',
};

class PriceAlertService {
  constructor() {
    this.intervalId = null;
    this.checkInterval = 60000;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.warn('Price alert service is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting price alert monitoring service');
    this.checkAllAlerts();
    this.intervalId = setInterval(() => {
      this.checkAllAlerts();
    }, this.checkInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Stopped price alert monitoring service');
  }

  async checkAllAlerts() {
    try {
      const alerts = getPriceAlerts();
      const activeAlerts = alerts.filter((a) => a.isActive && !a.notificationSent);

      if (activeAlerts.length === 0) {
        return;
      }

      console.log(`Checking ${activeAlerts.length} active price alerts`);

      // Group by CoinGecko platform for batched fetches
      const byPlatform = new Map();
      activeAlerts.forEach((alert) => {
        const platform =
          COINGECKO_PLATFORM_BY_CHAIN[parseInt(alert.chainId, 10)] || 'ethereum';
        if (!byPlatform.has(platform)) byPlatform.set(platform, []);
        byPlatform.get(platform).push(alert);
      });

      await Promise.allSettled(
        [...byPlatform.entries()].map(async ([platform, platformAlerts]) => {
          const uniqueAddresses = [
            ...new Set(platformAlerts.map((a) => a.tokenAddress).filter(Boolean)),
          ];
          if (!uniqueAddresses.length) return;

          const batch = await coingeckoService.getTokenPrices(uniqueAddresses, platform);

          for (const alert of platformAlerts) {
            const addr = (alert.tokenAddress || '').toLowerCase();
            const priceData = batch?.[addr] || batch?.[alert.tokenAddress];
            const currentPrice = priceData?.usd != null ? parseFloat(priceData.usd) : null;
            if (currentPrice == null || Number.isNaN(currentPrice)) continue;

            const triggered = checkPriceAlerts(
              alert.tokenAddress,
              parseInt(alert.chainId, 10),
              currentPrice
            );
            triggered.forEach((triggeredAlert) => {
              this.triggerAlert(triggeredAlert, currentPrice);
            });
          }
        })
      );
    } catch (error) {
      console.error('Error checking price alerts:', error);
    }
  }

  triggerAlert(alert, currentPrice) {
    console.log('Price alert triggered:', alert);

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Price Alert: ${alert.tokenSymbol}`, {
        body: `Price is now $${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} (${alert.condition === 'above' ? 'above' : 'below'} target of $${alert.targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })})`,
        icon: brandLogoMarkPathWithCacheBust(),
        tag: `price-alert-${alert.id}`,
      });
    }

    updatePriceAlert(alert.id, {
      triggeredAt: new Date().toISOString(),
      notificationSent: true,
      isActive: false,
    });
  }

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
