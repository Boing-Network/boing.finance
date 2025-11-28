/**
 * Error Message Utility
 * 
 * Maps technical errors to user-friendly messages
 * Provides actionable error recovery suggestions
 */

/**
 * Get user-friendly error message from error object
 */
export const getErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const errorMessage = error.message || error.toString() || '';
  const lowerMessage = errorMessage.toLowerCase();

  // Wallet/Connection Errors
  if (lowerMessage.includes('user rejected') || lowerMessage.includes('user denied')) {
    return {
      message: 'Transaction was cancelled',
      description: 'You cancelled the transaction in your wallet. Please try again when ready.',
      action: 'Try the transaction again',
      severity: 'info'
    };
  }

  if (lowerMessage.includes('insufficient funds') || lowerMessage.includes('insufficient balance')) {
    return {
      message: 'Insufficient funds',
      description: 'You don\'t have enough funds to complete this transaction. Please check your wallet balance.',
      action: 'Check your wallet balance and add funds if needed',
      severity: 'warning'
    };
  }

  if (lowerMessage.includes('network') && lowerMessage.includes('error')) {
    return {
      message: 'Network connection issue',
      description: 'There was a problem connecting to the network. Please check your internet connection.',
      action: 'Check your internet connection and try again',
      severity: 'error'
    };
  }

  // Transaction Errors
  if (lowerMessage.includes('transaction failed') || lowerMessage.includes('execution reverted')) {
    return {
      message: 'Transaction failed',
      description: 'The transaction could not be completed. This might be due to slippage, insufficient liquidity, or other factors.',
      action: 'Try adjusting slippage tolerance or check if the pool has enough liquidity',
      severity: 'error'
    };
  }

  if (lowerMessage.includes('slippage')) {
    return {
      message: 'Slippage tolerance exceeded',
      description: 'The price moved too much during the transaction. Try increasing your slippage tolerance.',
      action: 'Increase slippage tolerance in settings and try again',
      severity: 'warning'
    };
  }

  if (lowerMessage.includes('approval') && lowerMessage.includes('rejected')) {
    return {
      message: 'Token approval was rejected',
      description: 'You need to approve token spending in your wallet before you can proceed.',
      action: 'Approve token spending in your wallet and try again',
      severity: 'warning'
    };
  }

  // Network Errors
  if (lowerMessage.includes('network') && (lowerMessage.includes('not supported') || lowerMessage.includes('unsupported'))) {
    return {
      message: 'Network not supported',
      description: 'The current network is not supported. Please switch to a supported network.',
      action: 'Switch to a supported network using the network selector',
      severity: 'error'
    };
  }

  if (lowerMessage.includes('wrong network') || lowerMessage.includes('chain id')) {
    return {
      message: 'Wrong network',
      description: 'You\'re connected to the wrong network. Please switch to the correct network.',
      action: 'Switch networks using the network selector',
      severity: 'warning'
    };
  }

  // Rate Limiting
  if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
    return {
      message: 'Too many requests',
      description: 'You\'re making requests too quickly. Please wait a moment and try again.',
      action: 'Wait a few seconds and try again',
      severity: 'warning'
    };
  }

  // Timeout Errors
  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return {
      message: 'Request timed out',
      description: 'The request took too long to complete. The network might be congested.',
      action: 'Wait a moment and try again',
      severity: 'warning'
    };
  }

  // Generic Errors
  if (lowerMessage.includes('failed to fetch') || lowerMessage.includes('network error')) {
    return {
      message: 'Connection error',
      description: 'Unable to connect to the server. Please check your internet connection.',
      action: 'Check your internet connection and try again',
      severity: 'error'
    };
  }

  // Default fallback
  return {
    message: 'An error occurred',
    description: errorMessage || 'Something went wrong. Please try again.',
    action: 'Try again or contact support if the problem persists',
    severity: 'error'
  };
};

/**
 * Get error recovery action
 */
export const getErrorRecovery = (error) => {
  const errorInfo = getErrorMessage(error);
  return errorInfo.action;
};

/**
 * Check if error is recoverable
 */
export const isRecoverableError = (error) => {
  if (!error) return false;
  
  const errorMessage = (error.message || error.toString() || '').toLowerCase();
  const recoverablePatterns = [
    'network',
    'timeout',
    'rate limit',
    'insufficient funds',
    'slippage',
    'approval'
  ];

  return recoverablePatterns.some(pattern => errorMessage.includes(pattern));
};

/**
 * Format error for display
 */
export const formatError = (error) => {
  const errorInfo = getErrorMessage(error);
  
  return {
    title: errorInfo.message,
    description: errorInfo.description,
    action: errorInfo.action,
    severity: errorInfo.severity,
    recoverable: isRecoverableError(error)
  };
};

export default {
  getErrorMessage,
  getErrorRecovery,
  isRecoverableError,
  formatError
};

