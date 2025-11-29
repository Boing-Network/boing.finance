// Service Worker Registration
// Handles service worker registration and updates

export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  if (window.confirm('A new version is available! Reload to update?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });

          // Periodic update check (every hour)
          setInterval(() => {
            registration.update();
          }, 3600000);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }
};

export const unregisterServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
};

