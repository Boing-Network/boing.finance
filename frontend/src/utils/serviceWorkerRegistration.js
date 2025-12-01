// Service Worker Registration
// Handles service worker registration and updates with aggressive cache invalidation

export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    // Register immediately, don't wait for load event
    navigator.serviceWorker
      .register('/service-worker.js', { updateViaCache: 'none' })
      .then((registration) => {
        console.log('Service Worker registered:', registration.scope);

        // Aggressively check for updates
        const checkForUpdates = () => {
          registration.update().catch((error) => {
            console.log('Update check failed:', error);
          });
        };

        // Check for updates immediately
        checkForUpdates();

        // Check for updates on page load
        window.addEventListener('load', () => {
          checkForUpdates();
        });

        // Check for updates when page becomes visible (user switches tabs back)
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            checkForUpdates();
          }
        });

        // Check for updates on focus (user switches back to window)
        window.addEventListener('focus', () => {
          checkForUpdates();
        });

        // Check for updates periodically (every 30 seconds)
        setInterval(() => {
          checkForUpdates();
        }, 30000);

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New service worker available - force reload immediately
                  console.log('New service worker installed, reloading...');
                  // Unregister old service worker and reload
                  navigator.serviceWorker.getRegistrations().then((registrations) => {
                    registrations.forEach((reg) => {
                      if (reg !== registration) {
                        reg.unregister();
                      }
                    });
                    // Force reload with cache bypass
                    window.location.reload();
                  });
                } else {
                  // First time installation
                  console.log('Service Worker installed for the first time');
                  // Activate immediately
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              }
            });
          }
        });

        // Listen for controller change (service worker updated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('Service worker controller changed, reloading...');
          window.location.reload();
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
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

