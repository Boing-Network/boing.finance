import React from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/globals.css';
import App from './App';

// Register service worker for offline support
import { registerServiceWorker } from './utils/serviceWorkerRegistration';

if (process.env.NODE_ENV === 'production') {
  // Register service worker (version check happens inside with proper timing)
  registerServiceWorker();
  
  // Check version on initial load (with delay to prevent race conditions)
  window.addEventListener('load', () => {
    // Wait a bit for localStorage to be ready and prevent immediate reload loops
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
          
          // Only reload if versions are actually different
          if (storedVersion && storedVersion !== versionData.version) {
            console.log('[App] New version detected, reloading...');
            // Store new version before reload to prevent loop
            localStorage.setItem('appVersion', versionData.version);
            await new Promise(resolve => setTimeout(resolve, 100));
            window.location.reload();
          } else if (!storedVersion) {
            // First time, just store version
            localStorage.setItem('appVersion', versionData.version);
          }
        }
      } catch (error) {
        console.log('[App] Version check failed:', error);
        // Don't reload on error
      }
    }, 1000); // 1 second delay to prevent immediate checks
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