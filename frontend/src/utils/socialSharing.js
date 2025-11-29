// Social Sharing Utilities
// Provides functions for sharing tokens and content on social media

/**
 * Shares token information on Twitter
 */
export const shareOnTwitter = (tokenData, customMessage = null) => {
  const message = customMessage || 
    `Check out ${tokenData.symbol} (${tokenData.name}) on boing.finance! 🚀\n\n` +
    `Address: ${tokenData.address}\n` +
    `Network: ${tokenData.network || 'Ethereum'}\n\n` +
    `View on boing.finance: https://boing.finance/tokens?address=${tokenData.address}`;
  
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'width=550,height=420');
};

/**
 * Shares token information on Telegram
 */
export const shareOnTelegram = (tokenData, customMessage = null) => {
  const message = customMessage || 
    `Check out ${tokenData.symbol} (${tokenData.name}) on boing.finance! 🚀\n\n` +
    `Address: ${tokenData.address}\n` +
    `Network: ${tokenData.network || 'Ethereum'}\n\n` +
    `View: https://boing.finance/tokens?address=${tokenData.address}`;
  
  const url = `https://t.me/share/url?url=${encodeURIComponent(`https://boing.finance/tokens?address=${tokenData.address}`)}&text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'width=550,height=420');
};

/**
 * Shares token information via email
 */
export const shareViaEmail = (tokenData, customMessage = null) => {
  const subject = `Check out ${tokenData.symbol} (${tokenData.name}) on boing.finance`;
  const body = customMessage || 
    `I found this interesting token on boing.finance:\n\n` +
    `Token: ${tokenData.name} (${tokenData.symbol})\n` +
    `Address: ${tokenData.address}\n` +
    `Network: ${tokenData.network || 'Ethereum'}\n\n` +
    `View it here: https://boing.finance/tokens?address=${tokenData.address}`;
  
  const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = url;
};

/**
 * Copies token information to clipboard
 */
export const copyTokenInfo = async (tokenData) => {
  const text = 
    `${tokenData.name} (${tokenData.symbol})\n` +
    `Address: ${tokenData.address}\n` +
    `Network: ${tokenData.network || 'Ethereum'}\n` +
    `View: https://boing.finance/tokens?address=${tokenData.address}`;
  
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

/**
 * Generates a shareable link for a token
 */
export const generateShareableLink = (tokenData) => {
  return `https://boing.finance/tokens?address=${tokenData.address}&network=${tokenData.chainId || ''}`;
};

/**
 * Shares via Web Share API (native sharing on mobile)
 */
export const shareViaNative = async (tokenData, customMessage = null) => {
  if (!navigator.share) {
    return false; // Web Share API not supported
  }

  const message = customMessage || 
    `Check out ${tokenData.symbol} (${tokenData.name}) on boing.finance! 🚀`;
  
  const url = generateShareableLink(tokenData);

  try {
    await navigator.share({
      title: `${tokenData.symbol} on boing.finance`,
      text: message,
      url: url
    });
    return true;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error sharing:', error);
    }
    return false;
  }
};

/**
 * Generates QR code data URL for token address
 */
export const generateQRCode = async (text) => {
  // Simple QR code generation using a library or API
  // For now, return a URL to a QR code service
  const qrServiceUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
  return qrServiceUrl;
};

