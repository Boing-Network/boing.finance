// Share Token Modal Component
// Allows users to share token information on social media

import React, { useState, useEffect } from 'react';
import { 
  shareOnTwitter, 
  shareOnTelegram, 
  shareViaEmail, 
  copyTokenInfo, 
  generateShareableLink,
  shareViaNative,
  generateQRCode
} from '../utils/socialSharing';
import toast from 'react-hot-toast';

const ShareTokenModal = ({ token, isOpen, onClose }) => {
  const [customMessage, setCustomMessage] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [shareableLink, setShareableLink] = useState('');

  useEffect(() => {
    if (token && isOpen) {
      const link = generateShareableLink(token);
      setShareableLink(link);
      
      // Generate QR code
      generateQRCode(link).then(url => {
        setQrCodeUrl(url);
      });
    }
  }, [token, isOpen]);

  if (!isOpen || !token) return null;

  const handleShare = async (platform) => {
    const message = customMessage || null;
    
    try {
      switch (platform) {
        case 'twitter':
          shareOnTwitter(token, message);
          toast.success('Opening Twitter...');
          break;
        case 'telegram':
          shareOnTelegram(token, message);
          toast.success('Opening Telegram...');
          break;
        case 'email':
          shareViaEmail(token, message);
          toast.success('Opening email client...');
          break;
        case 'native':
          const success = await shareViaNative(token, message);
          if (success) {
            toast.success('Shared successfully!');
          } else {
            toast.error('Native sharing not available');
          }
          break;
        case 'copy':
          const copied = await copyTokenInfo(token);
          if (copied) {
            toast.success('Token information copied to clipboard!');
          } else {
            toast.error('Failed to copy to clipboard');
          }
          break;
        case 'copy-link':
          await navigator.clipboard.writeText(shareableLink);
          toast.success('Link copied to clipboard!');
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share. Please try again.');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-token-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
    >
      <div 
        className="bg-gray-800 rounded-2xl p-8 max-w-md mx-4 border border-cyan-500 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="share-token-title" className="text-2xl font-bold text-white">
            Share {token.symbol}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close share modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Token Info */}
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">{token.symbol?.charAt(0) || 'T'}</span>
            </div>
            <div>
              <h3 className="text-white font-semibold">{token.name}</h3>
              <p className="text-sm text-gray-400">{token.symbol}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 break-all">{token.address}</p>
        </div>

        {/* Custom Message */}
        <div className="mb-6">
          <label htmlFor="share-token-custom-message" className="block text-sm font-medium text-gray-300 mb-2">
            Custom Message (Optional)
          </label>
          <textarea
            id="share-token-custom-message"
            name="customMessage"
            autoComplete="off"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Add a custom message to your share..."
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            rows="3"
            maxLength={280}
          />
          <p className="text-xs text-gray-400 mt-1">{customMessage.length}/280</p>
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => handleShare('twitter')}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            aria-label="Share on Twitter"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
            </svg>
            <span>Twitter</span>
          </button>

          <button
            onClick={() => handleShare('telegram')}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-400 hover:bg-blue-500 text-white rounded-lg transition-colors"
            aria-label="Share on Telegram"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            <span>Telegram</span>
          </button>

          <button
            onClick={() => handleShare('email')}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            aria-label="Share via Email"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Email</span>
          </button>

          {navigator.share && (
            <button
              onClick={() => handleShare('native')}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              aria-label="Share via native sharing"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Share</span>
            </button>
          )}

          <button
            onClick={() => handleShare('copy')}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            aria-label="Copy token information"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Copy Info</span>
          </button>

          <button
            onClick={() => handleShare('copy-link')}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            aria-label="Copy shareable link"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span>Copy Link</span>
          </button>
        </div>

        {/* QR Code */}
        {qrCodeUrl && (
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-400 mb-2">Scan to view token</p>
            <img src={qrCodeUrl} alt="QR Code" className="mx-auto border-2 border-gray-600 rounded-lg" />
          </div>
        )}

        {/* Shareable Link */}
        <div className="mb-4">
          <label htmlFor="share-token-link" className="block text-sm font-medium text-gray-300 mb-2">
            Shareable Link
          </label>
          <div className="flex items-center space-x-2">
            <input
              id="share-token-link"
              name="shareableLink"
              type="text"
              value={shareableLink}
              readOnly
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm"
            />
            <button
              onClick={() => handleShare('copy-link')}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
              aria-label="Copy link"
            >
              Copy
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ShareTokenModal;

