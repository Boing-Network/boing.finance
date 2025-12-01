// Service Worker Registration
// Handles service worker registration and updates with aggressive cache invalidation

// Check for version updates and force reload if needed
const checkVersionAndReload = async () => {
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
        console.log('[Version Check] New version detected:', versionData.version);
        console.log('[Version Check] Old version:', storedVersion);
        // Clear all caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        // Clear localStorage except essential items
        const essentialKeys = ['walletConnected', 'walletType', 'userDisconnected'];
        const keysToKeep = {};
        essentialKeys.forEach(key => {
          const value = localStorage.getItem(key);
          if (value) keysToKeep[key] = value;
        });
        localStorage.clear();
        Object.entries(keysToKeep).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
        // Store new version
        localStorage.setItem('appVersion', versionData.version);
        // Force reload
        window.location.reload();
        return true;
      } else if (!storedVersion) {
        // First time, store version
        localStorage.setItem('appVersion', versionData.version);
      }
    }
  } catch (error) {
    console.log('[Version Check] Error checking version:', error);
  }
  return false;
};

export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    // Check version first
    checkVersionAndReload();
    
    // Register immediately with cache-busting query parameter
    const serviceWorkerUrl = '/service-worker.js?v=' + Date.now();
    navigator.serviceWorker
      .register(serviceWorkerUrl, { 
        updateViaCache: 'none',
        scope: '/'
      })
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
          // Check version before reloading
          checkVersionAndReload().then((reloaded) => {
            if (!reloaded) {
              window.location.reload();
            }
          });
        });
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SW_ACTIVATED') {
            console.log('[Service Worker] New version activated:', event.data.version);
            // Check version and reload if needed
            checkVersionAndReload();
          }
        });
        
        // Periodic version check (every 60 seconds)
        setInterval(() => {
          checkVersionAndReload();
        }, 60000);
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

