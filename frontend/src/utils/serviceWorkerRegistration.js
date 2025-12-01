// Service Worker Registration
// Handles service worker registration and updates with aggressive cache invalidation

// Flag to prevent multiple simultaneous reloads
let isReloading = false;
let lastVersionCheck = 0;
const VERSION_CHECK_COOLDOWN = 2000; // 2 seconds cooldown between checks

// Check for version updates and force reload if needed
const checkVersionAndReload = async (forceCheck = false) => {
  // Prevent multiple simultaneous checks
  const now = Date.now();
  if (!forceCheck && (now - lastVersionCheck < VERSION_CHECK_COOLDOWN)) {
    return false;
  }
  lastVersionCheck = now;

  // Prevent reload if already reloading
  if (isReloading) {
    return false;
  }

  try {
    const response = await fetch('/version.json?v=' + Date.now(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      // If version.json doesn't exist or fails, don't reload
      return false;
    }

    const versionData = await response.json();
    const storedVersion = localStorage.getItem('appVersion');
    
    // If no stored version, just store it and return (first time)
    if (!storedVersion) {
      localStorage.setItem('appVersion', versionData.version);
      return false;
    }
    
    // Only reload if versions are actually different
    if (storedVersion !== versionData.version) {
      console.log('[Version Check] New version detected:', versionData.version);
      console.log('[Version Check] Old version:', storedVersion);
      
      // Set reloading flag to prevent multiple reloads
      isReloading = true;
      
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
      
      // Store new version BEFORE reload
      localStorage.setItem('appVersion', versionData.version);
      
      // Small delay to ensure localStorage is written
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force reload
      window.location.reload();
      return true;
    }
  } catch (error) {
    console.log('[Version Check] Error checking version:', error);
    // Don't reload on error
  }
  return false;
};

export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    // Don't check version immediately - wait for page to fully load
    // This prevents race conditions with localStorage
    
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

        // Handle service worker updates - with reload prevention
        let isUpdating = false;
        registration.addEventListener('updatefound', () => {
          if (isUpdating) {
            console.log('[Service Worker] Update already in progress, skipping...');
            return;
          }
          
          const newWorker = registration.installing;
          if (newWorker) {
            isUpdating = true;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New service worker available - but don't reload immediately
                  // Let the version check handle it to prevent loops
                  console.log('[Service Worker] New service worker installed, waiting for version check...');
                  // Don't reload here - let version check handle it
                  isUpdating = false;
                } else {
                  // First time installation
                  console.log('[Service Worker] Installed for the first time');
                  // Activate immediately
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  isUpdating = false;
                }
              } else if (newWorker.state === 'activated') {
                isUpdating = false;
              }
            });
          }
        });

        // Listen for controller change (service worker updated) - with reload prevention
        let controllerChangeHandled = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (controllerChangeHandled || isReloading) {
            return;
          }
          
          console.log('[Service Worker] Controller changed');
          controllerChangeHandled = true;
          
          // Wait a bit before checking version to prevent immediate loops
          setTimeout(() => {
            checkVersionAndReload().then((reloaded) => {
              if (!reloaded) {
                // Only reload if version check didn't already trigger a reload
                // and we haven't reloaded recently
                const lastReload = sessionStorage.getItem('lastReload');
                const now = Date.now();
                if (!lastReload || (now - parseInt(lastReload)) > 5000) {
                  sessionStorage.setItem('lastReload', now.toString());
                  window.location.reload();
                }
              }
              controllerChangeHandled = false;
            });
          }, 2000); // 2 second delay
        });
        
        // Listen for messages from service worker - with reload prevention
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SW_ACTIVATED') {
            console.log('[Service Worker] New version activated:', event.data.version);
            // Don't immediately check version - wait longer to prevent loops
            // The periodic check will handle it
            setTimeout(() => {
              if (!isReloading) {
                checkVersionAndReload();
              }
            }, 5000); // 5 second delay
          }
        });
        
        // Periodic version check (every 60 seconds) - only after page is fully loaded
        setTimeout(() => {
          setInterval(() => {
            checkVersionAndReload();
          }, 60000);
        }, 5000); // Wait 5 seconds before starting periodic checks
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

