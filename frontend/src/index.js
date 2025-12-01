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
  
  // Only check version on initial page load, not on navigation
  // Use a flag to track if this is the initial load
  let isInitialLoad = true;
  const initialLoadKey = 'appInitialLoad';
  
  // Check if this is truly the first load (not a navigation)
  const wasInitialLoad = sessionStorage.getItem(initialLoadKey);
  if (wasInitialLoad) {
    isInitialLoad = false;
  } else {
    sessionStorage.setItem(initialLoadKey, 'true');
  }
  
  // Only check version on initial load, not on navigation or manual refresh
  if (isInitialLoad) {
    window.addEventListener('load', () => {
      // Wait longer to prevent unexpected reloads
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
            
            // Only reload if versions are actually different AND this is truly a new deployment
            // Don't reload on first visit or if versions match
            if (storedVersion && storedVersion !== versionData.version) {
              console.log('[App] New version detected, reloading...');
              // Store new version before reload to prevent loop
              localStorage.setItem('appVersion', versionData.version);
              await new Promise(resolve => setTimeout(resolve, 100));
              window.location.reload();
            } else if (!storedVersion) {
              // First time, just store version - don't reload
              localStorage.setItem('appVersion', versionData.version);
            }
          }
        } catch (error) {
          console.log('[App] Version check failed:', error);
          // Don't reload on error
        }
      }, 3000); // 3 second delay - only check on initial load after page is stable
    });
  }
  
  // Clear the initial load flag after a delay to allow for navigation
  setTimeout(() => {
    sessionStorage.removeItem(initialLoadKey);
  }, 5000);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
); 