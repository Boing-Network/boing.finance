import React from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/globals.css';
import App from './App';

// Register service worker for offline support
import { registerServiceWorker } from './utils/serviceWorkerRegistration';

if (process.env.NODE_ENV === 'production') {
  registerServiceWorker();
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
); 