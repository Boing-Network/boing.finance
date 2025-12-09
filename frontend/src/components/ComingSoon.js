import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const ComingSoon = ({ featureName }) => {
  const location = useLocation();
  const pageName = featureName || location.pathname.split('/').pop() || 'Feature';
  
  // Capitalize first letter and format
  const formattedName = pageName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <>
      <Helmet>
        <title>{formattedName} - Coming Soon | boing.finance</title>
        <meta name="description" content={`${formattedName} feature is coming soon. Check back later for updates.`} />
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-block p-6 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 mb-6">
              <svg 
                className="w-24 h-24 mx-auto text-cyan-400 animate-pulse" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent mb-4">
              {formattedName}
            </h1>
            <div className="inline-block px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-400/30 mb-6">
              <span className="text-sm font-semibold">Coming Soon</span>
            </div>
          </div>
          
          <div className="backdrop-blur-sm border border-cyan-400/20 rounded-xl p-8 mb-8" style={{
            background: 'linear-gradient(to bottom right, var(--bg-card), var(--bg-secondary))'
          }}>
            <p className="text-lg mb-4" style={{ color: 'var(--text-secondary)' }}>
              This feature is currently under development and will be available soon.
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
              We're working hard to bring you the best DeFi experience. Stay tuned for updates!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/deploy-token"
                className="px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30"
              >
                Deploy Token
              </a>
              <a
                href="/"
                className="px-6 py-3 rounded-lg font-medium transition-all duration-200 border border-cyan-400/30 hover:border-cyan-400/50 hover:bg-cyan-500/10"
                style={{ color: 'var(--text-secondary)' }}
              >
                Back to Home
              </a>
            </div>
          </div>

          <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            <p>Want to be notified when this feature launches?</p>
            <p className="mt-2">
              Follow us on{' '}
              <a 
                href="https://twitter.com/boing_finance" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                Twitter
              </a>
              {' '}or join our{' '}
              <a 
                href="https://discord.gg/7RDtQtQvBW" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                Discord
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ComingSoon;

