// Token Preview Component
// Shows a preview of how the token will look after deployment

import React from 'react';
import { getNetworkByChainId } from '../config/networks';

const TokenPreview = ({ 
  name, 
  symbol, 
  logoUrl, 
  description, 
  initialSupply, 
  decimals,
  network,
  socialLinks = {},
  securityFeatures = {}
}) => {
  const networkInfo = network ? getNetworkByChainId(network.chainId) : null;
  const formattedSupply = initialSupply 
    ? (parseFloat(initialSupply) / Math.pow(10, decimals || 18)).toLocaleString()
    : '0';

  return (
    <div className="rounded-xl border p-6" style={{
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--border-color)'
    }}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Token Preview
      </h3>
      
      <div className="space-y-4">
        {/* Token Header */}
        <div className="flex items-center space-x-4">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt={symbol} 
              className="w-16 h-16 rounded-full border-2"
              style={{ borderColor: 'var(--border-color)' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`w-16 h-16 rounded-full border-2 flex items-center justify-center text-2xl ${logoUrl ? 'hidden' : ''}`}
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
          >
            {symbol ? symbol.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <h4 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {name || 'Token Name'}
            </h4>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {symbol || 'SYMBOL'}
            </p>
          </div>
        </div>

        {/* Description */}
        {description && (
          <div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {description}
            </p>
          </div>
        )}

        {/* Token Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Initial Supply</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {formattedSupply} {symbol || 'TOKENS'}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Decimals</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {decimals || 18}
            </p>
          </div>
          {networkInfo && (
            <div className="col-span-2">
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Network</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {networkInfo.name}
              </p>
            </div>
          )}
        </div>

        {/* Social Links */}
        {(socialLinks.website || socialLinks.twitter || socialLinks.telegram) && (
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>Links</p>
            <div className="flex flex-wrap gap-2">
              {socialLinks.website && (
                <a 
                  href={socialLinks.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs px-2 py-1 rounded border transition-colors"
                  style={{ 
                    color: 'var(--text-secondary)',
                    borderColor: 'var(--border-color)'
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  🌐 Website
                </a>
              )}
              {socialLinks.twitter && (
                <a 
                  href={socialLinks.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs px-2 py-1 rounded border transition-colors"
                  style={{ 
                    color: 'var(--text-secondary)',
                    borderColor: 'var(--border-color)'
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  🐦 Twitter
                </a>
              )}
              {socialLinks.telegram && (
                <a 
                  href={socialLinks.telegram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs px-2 py-1 rounded border transition-colors"
                  style={{ 
                    color: 'var(--text-secondary)',
                    borderColor: 'var(--border-color)'
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  📱 Telegram
                </a>
              )}
            </div>
          </div>
        )}

        {/* Security Features */}
        {Object.keys(securityFeatures).length > 0 && (
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>Security Features</p>
            <div className="flex flex-wrap gap-2">
              {securityFeatures.renounceMint && (
                <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                  🔒 Mint Removed
                </span>
              )}
              {securityFeatures.antiBot && (
                <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  🤖 Anti-Bot
                </span>
              )}
              {securityFeatures.antiWhale && (
                <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  🐋 Anti-Whale
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenPreview;

