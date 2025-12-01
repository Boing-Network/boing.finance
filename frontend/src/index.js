import React from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/globals.css';
import App from './App';

// Register service worker for offline support
import { registerServiceWorker } from './utils/serviceWorkerRegistration';

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
            console.log('[App] Version updated in localStorage:', versionData.version);
            // Service worker handles cache updates in background
          }
        }
      } catch (error) {
        console.log('[App] Version check failed:', error);
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