// Share Portfolio Modal Component
// Allows users to share their portfolio (anonymized)

import React, { useState } from 'react';
import { exportPortfolioPDF } from '../utils/exportData';
import toast from 'react-hot-toast';

export default function SharePortfolioModal({ isOpen, onClose, portfolioData }) {
  const [_shareType, _setShareType] = useState('link'); // 'link' or 'image' (reserved for future use)
  const [anonymize, setAnonymize] = useState(true);

  if (!isOpen || !portfolioData) return null;

  const handleShareLink = () => {
    // Create a shareable link (in a real app, this would generate a unique shareable URL)
    const shareData = anonymize ? {
      totalValue: portfolioData.totalValue,
      totalTokens: portfolioData.totalTokens,
      totalPools: portfolioData.totalPools,
      // Don't include actual token addresses or balances
    } : portfolioData;

    const shareUrl = `${window.location.origin}/portfolio/share?data=${encodeURIComponent(JSON.stringify(shareData))}`;
    
    navigator.clipboard.writeText(shareUrl);
    toast.success('Portfolio link copied to clipboard!');
  };

  const handleShareImage = () => {
    // Export as PDF which can be shared as image
    exportPortfolioPDF(portfolioData);
    toast.success('Portfolio exported! You can share the PDF.');
  };

  const handleShareTwitter = () => {
    const text = `Check out my portfolio on boing.finance! 💼\nTotal Value: $${portfolioData.totalValue || '0'}\nTokens: ${portfolioData.totalTokens || '0'}\n\n`;
    const url = `${window.location.origin}/portfolio`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
  };

  const handleShareFacebook = () => {
    const url = `${window.location.origin}/portfolio`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Share Portfolio</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Anonymize Option */}
        <div className="mb-6">
          <label htmlFor="share-portfolio-anonymize" className="flex items-center space-x-2 cursor-pointer">
            <input
              id="share-portfolio-anonymize"
              name="anonymize"
              type="checkbox"
              checked={anonymize}
              onChange={(e) => setAnonymize(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-gray-300">Anonymize (hide token addresses and balances)</span>
          </label>
        </div>

        {/* Share Options */}
        <div className="space-y-3">
          <button
            onClick={handleShareLink}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Copy Shareable Link</span>
          </button>

          <button
            onClick={handleShareImage}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Export as PDF</span>
          </button>

          <div className="flex space-x-2">
            <button
              onClick={handleShareTwitter}
              className="flex-1 px-4 py-3 bg-blue-400 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
              </svg>
              <span>Twitter</span>
            </button>

            <button
              onClick={handleShareFacebook}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
              </svg>
              <span>Facebook</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          {anonymize ? 'Your portfolio will be shared without revealing token addresses or balances.' : 'All portfolio details will be visible.'}
        </p>
      </div>
    </div>
  );
}

