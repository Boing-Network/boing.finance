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
  
  // Only store version on initial load - don't auto-reload
  // Auto-reload is disruptive to user experience
  // Version checking for updates is handled by the service worker registration
  window.addEventListener('load', () => {
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
          
          // Only store version if not set - don't auto-reload
          // Users can manually refresh if they want the latest version
          if (!storedVersion) {
            localStorage.setItem('appVersion', versionData.version);
          } else if (storedVersion !== versionData.version) {
            // Log that a new version is available but don't auto-reload
            console.log('[App] New version available:', versionData.version, '(current:', storedVersion, ')');
            // Optionally show a notification to user instead of auto-reloading
            // The service worker will handle cache updates in the background
          }
        }
      } catch (error) {
        console.log('[App] Version check failed:', error);
      }
    }, 1000); // Short delay just to not block initial render
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