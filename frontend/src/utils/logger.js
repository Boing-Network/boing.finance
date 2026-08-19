/**
 * Logger utility for boing.finance
 * 
 * Provides structured logging that:
 * - Only logs in development mode
 * - Sends errors to error tracking in production
 * - Provides consistent logging interface
 */

const isDev = process.env.NODE_ENV === 'development';

const errorTrackingService = {
  captureException: (error, context = {}) => {
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, { extra: context });
      return;
    }
    if (isDev) {
      console.error('[Error Tracking]', error, context);
    }
  },
  captureMessage: (message, level = 'info', context = {}) => {
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureMessage(message, { level, extra: context });
      return;
    }
    if (isDev) {
      console.log('[Error Tracking]', message, level, context);
    }
  }
};

/**
 * Logger class with different log levels
 */
export const logger = {
  /**
   * Log informational messages (only in development)
   */
  log: (...args) => {
    if (isDev) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (...args) => {
    if (isDev) {
      console.debug('[DEBUG]', ...args);
    }
  },

  /**
   * Log warning messages
   */
  warn: (...args) => {
    if (isDev) {
      console.warn('[WARN]', ...args);
    } else {
      // In production, send warnings to error tracking
      errorTrackingService.captureMessage(
        args.join(' '),
        'warning',
        { source: 'logger.warn' }
      );
    }
  },

  /**
   * Log error messages
   * In production, sends to error tracking service
   */
  error: (error, context = {}) => {
    if (isDev) {
      console.error('[ERROR]', error, context);
    } else {
      // In production, send to error tracking
      const errorObj = error instanceof Error 
        ? error 
        : new Error(typeof error === 'string' ? error : JSON.stringify(error));
      
      errorTrackingService.captureException(errorObj, context);
    }
  },

  /**
   * Log transaction-related messages
   */
  transaction: (message, data = {}) => {
    if (isDev) {
      console.log('[TX]', message, data);
    }
    // In production, could send to analytics
  },

  /**
   * Log API-related messages
   */
  api: (message, data = {}) => {
    if (isDev) {
      console.log('[API]', message, data);
    }
  },

  /**
   * Log wallet-related messages
   */
  wallet: (message, data = {}) => {
    if (isDev) {
      console.log('[WALLET]', message, data);
    }
  },

  /**
   * Log performance metrics
   */
  performance: (label, duration, metadata = {}) => {
    if (isDev) {
      console.log(`[PERF] ${label}: ${duration}ms`, metadata);
    }
    // In production, could send to analytics
  }
};

// Export default logger
export default logger;

