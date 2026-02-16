// Notification System
// Provides browser push notifications and enhanced toast notifications

class NotificationService {
  constructor() {
    this.permission = null;
    this.checkPermission();
  }

  async checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    }

    return false;
  }

  async showNotification(title, options = {}) {
    if (!('Notification' in window)) {
      return false;
    }

    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        return false;
      }
    }

    const defaultOptions = {
      icon: '/favicon-96x96.png',
      badge: '/favicon-96x96.png',
      tag: 'boing-finance',
      requireInteraction: false,
      ...options
    };

    try {
      const notification = new Notification(title, defaultOptions);
      
      // Auto-close after 5 seconds unless requireInteraction is true
      if (!defaultOptions.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      // Handle click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        if (defaultOptions.onClick) {
          defaultOptions.onClick();
        }
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  // Convenience methods for common notification types
  async notifyDeploymentSuccess(tokenName, tokenAddress) {
    return this.showNotification('Token Deployed Successfully! 🎉', {
      body: `${tokenName} has been deployed at ${tokenAddress.substring(0, 6)}...${tokenAddress.substring(tokenAddress.length - 4)}`,
      icon: '/favicon-96x96.png',
      badge: '/favicon-96x96.png',
      tag: `deployment-${Date.now()}`,
      onClick: () => {
        window.location.href = `/tokens?address=${tokenAddress}`;
      }
    });
  }

  async notifyTransactionConfirmed(txHash, network) {
    return this.showNotification('Transaction Confirmed ✅', {
      body: `Your transaction has been confirmed on ${network}`,
      icon: '/favicon-96x96.png',
      tag: `tx-${txHash}`,
      onClick: () => {
        // Open transaction in explorer
        const explorerUrl = this.getExplorerUrl(network, txHash);
        if (explorerUrl) {
          window.open(explorerUrl, '_blank');
        }
      }
    });
  }

  async notifyPriceAlert(tokenSymbol, targetPrice, currentPrice, direction) {
    const message = direction === 'above'
      ? `${tokenSymbol} price is now above $${targetPrice}!`
      : `${tokenSymbol} price is now below $${targetPrice}!`;
    
    return this.showNotification(`Price Alert: ${tokenSymbol}`, {
      body: message,
      icon: '/favicon-96x96.png',
      tag: `price-alert-${tokenSymbol}`,
      requireInteraction: true
    });
  }

  async notifyPortfolioUpdate(totalValue, change24h) {
    const changeText = change24h >= 0
      ? `+${change24h.toFixed(2)}%`
      : `${change24h.toFixed(2)}%`;
    
    return this.showNotification('Portfolio Update', {
      body: `Total Value: $${totalValue.toLocaleString()} (${changeText})`,
      icon: '/favicon-96x96.png',
      tag: 'portfolio-update',
      badge: '/favicon-96x96.png'
    });
  }

  getExplorerUrl(network, hash) {
    const explorers = {
      'Ethereum': `https://etherscan.io/tx/${hash}`,
      'Sepolia': `https://sepolia.etherscan.io/tx/${hash}`,
      'Polygon': `https://polygonscan.com/tx/${hash}`,
      'BSC': `https://bscscan.com/tx/${hash}`,
      'Arbitrum': `https://arbiscan.io/tx/${hash}`,
      'Optimism': `https://optimistic.etherscan.io/tx/${hash}`,
      'Base': `https://basescan.org/tx/${hash}`
    };
    return explorers[network] || null;
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Enhanced toast wrapper
export const showEnhancedToast = (message, type = 'info', options = {}) => {
  const toast = require('react-hot-toast');
  
  const defaultOptions = {
    duration: type === 'error' ? 6000 : 4000,
    position: 'top-right',
    ...options
  };

  switch (type) {
    case 'success':
      return toast.success(message, defaultOptions);
    case 'error':
      return toast.error(message, defaultOptions);
    case 'loading':
      return toast.loading(message, defaultOptions);
    case 'info':
    default:
      return toast(message, defaultOptions);
  }
};

// Toast with notification
export const showToastWithNotification = async (message, type = 'info', notificationOptions = null) => {
  const _toast = require('react-hot-toast');
  
  // Show toast
  const toastId = showEnhancedToast(message, type);
  
  // Show browser notification if enabled and notificationOptions provided
  if (notificationOptions && notificationService.permission === 'granted') {
    await notificationService.showNotification(
      notificationOptions.title || message,
      notificationOptions
    );
  }
  
  return toastId;
};

