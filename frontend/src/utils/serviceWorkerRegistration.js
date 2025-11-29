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
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New service worker available, prompt user to reload
                    if (window.confirm('A new version is available! Reload to update?')) {
                      window.location.reload(true); // Force reload from server
                    }
                  } else {
                    // First time installation, no need to reload
                    console.log('Service Worker installed for the first time');
                  }
                }
              });
            }
          });

          // Check for updates on page load
          registration.update();

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

