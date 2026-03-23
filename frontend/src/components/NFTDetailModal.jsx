// NFT Detail Modal
// Shows NFT image, traits, floor price, and links to OpenSea/Explorer

import React, { useEffect } from 'react';

const OPENSEA_CHAINS = {
  1: 'ethereum',
  137: 'polygon',
  42161: 'arbitrum',
  10: 'optimism',
  8453: 'base',
  11155111: 'sepolia',
};

export default function NFTDetailModal({ nft, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!nft) return null;

  const img = nft?.media?.[0]?.gateway || nft?.media?.[0]?.raw || nft?.image?.cachedUrl || nft?.image?.originalUrl || nft?.contract?.openSea?.imageUrl;
  const name = nft?.title || nft?.contract?.name || `#${nft?.tokenId}`;
  const collection = nft?.contract?.name || 'Unknown';
  const description = nft?.description || nft?.metadata?.description || '';
  const traits = nft?.metadata?.attributes || nft?.raw?.metadata?.attributes || [];
  const chainId = nft?.chainId || 1;
  const explorer = nft?.explorer || `https://etherscan.io`;
  const tokenUrl = `${explorer}/token/${nft?.contract?.address}?a=${nft?.tokenId}`;
  const chainSlug = OPENSEA_CHAINS[chainId] || 'ethereum';
  const openSeaUrl = `https://opensea.io/assets/${chainSlug}/${nft?.contract?.address}/${nft?.tokenId}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="nft-modal-title"
    >
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-600">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 id="nft-modal-title" className="text-xl font-bold text-white truncate pr-2">{name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="aspect-square rounded-xl overflow-hidden bg-gray-700 mb-4">
            {img ? (
              <img
                src={img}
                alt={name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23374151" width="100" height="100"/><text x="50" y="55" font-size="12" fill="%239ca3af" text-anchor="middle">NFT</text></svg>';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">🖼️</div>
            )}
          </div>

          <p className="text-gray-400 text-sm mb-4">{collection}</p>
          {description && <p className="text-gray-300 text-sm mb-4 line-clamp-3">{description}</p>}

          {traits.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white mb-2">Attributes</h3>
              <div className="flex flex-wrap gap-2">
                {traits.map((t, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-gray-700 rounded-lg text-xs text-gray-200 border border-gray-600"
                  >
                    <span className="text-gray-500">{t.trait_type || t.traitType}:</span>{' '}
                    {t.value}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <a
              href={tokenUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[120px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center text-sm font-medium transition-colors"
            >
              View on Explorer
            </a>
            <a
              href={openSeaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[120px] px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-center text-sm font-medium transition-colors"
            >
              View on OpenSea
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
