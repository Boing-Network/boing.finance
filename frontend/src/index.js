// Solana wallet adapter styles first so its @import (Google Fonts) is at the top of the combined stylesheet
import '@solana/wallet-adapter-react-ui/styles.css';
// Polyfill Buffer for browser (required by Solana/Web3 deps in chunks)
import { Buffer } from 'buffer';
import React from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary';
import { registerServiceWorker } from './utils/serviceWorkerRegistration';
import './styles/globals.css';
import './styles/deep-trade-tokens.css';
import App from './App';

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

if (process.env.NODE_ENV === 'production') {
  // Register service worker - NO AUTO RELOAD
  // Service worker will update caches in background
  registerServiceWorker();
  
  // Store version on load - NO AUTO RELOAD
  // This is just for tracking, not for triggering reloads
  window.addEventListener('load', () => {
    // Use a longer delay to ensure page is fully loaded
    setTimeout(async () => {
      try {
        const response = await fetch('/version.json?v=' + Date.now(), {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        if (response.ok) {
          const versionData = await response.json();
          const storedVersion = localStorage.getItem('appVersion');
          
          // Store version if not set
          if (!storedVersion) {
            localStorage.setItem('appVersion', versionData.version);
          } else if (storedVersion !== versionData.version) {
            // Update stored version - NO AUTO RELOAD
            localStorage.setItem('appVersion', versionData.version);
            // Version updated
            // Service worker handles cache updates in background
          }
        }
      } catch (error) {
        // Version check failed
      }
    }, 2000); // 2 second delay to ensure page is stable
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
); 