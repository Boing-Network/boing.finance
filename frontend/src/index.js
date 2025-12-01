import React from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/globals.css';
import App from './App';

// Register service worker for offline support
import { registerServiceWorker } from './utils/serviceWorkerRegistration';

if (process.env.NODE_ENV === 'production') {
  // Register service worker and check for version updates
  registerServiceWorker();
  
  // Also check version on initial load
  window.addEventListener('load', async () => {
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
        if (storedVersion && storedVersion !== versionData.version) {
          console.log('[App] New version detected, reloading...');
          window.location.reload();
        } else if (!storedVersion) {
          localStorage.setItem('appVersion', versionData.version);
        }
      }
    } catch (error) {
      console.log('[App] Version check failed:', error);
    }
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