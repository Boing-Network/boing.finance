// Service Worker Registration
// Handles service worker registration and updates with aggressive cache invalidation

// Flag to prevent multiple simultaneous reloads
let _isReloading = false;
let lastVersionCheck = 0;
const VERSION_CHECK_COOLDOWN = 2000; // 2 seconds cooldown between checks

// Check for version updates - NO AUTO RELOAD
// Only logs when new version is available - user can manually refresh
const checkVersion = async (forceCheck = false) => {
  // Prevent multiple simultaneous checks
  const now = Date.now();
  if (!forceCheck && (now - lastVersionCheck < VERSION_CHECK_COOLDOWN)) {
    return false;
  }
  lastVersionCheck = now;

  try {
    const response = await fetch('/version.json?v=' + Date.now(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      return false;
    }

    const versionData = await response.json();
    const storedVersion = localStorage.getItem('appVersion');
    
    // If no stored version, just store it (first time)
    if (!storedVersion) {
      localStorage.setItem('appVersion', versionData.version);
      return false;
    }
    
    // If versions differ, just log it - NO AUTO RELOAD
    if (storedVersion !== versionData.version) {
      console.log('[Version Check] New version available:', versionData.version, '(current:', storedVersion, ')');
      console.log('[Version Check] User can manually refresh to get the latest version');
      // Update stored version so we don't keep logging
      localStorage.setItem('appVersion', versionData.version);
      // Service worker will handle cache updates in background
      return true;
    }
  } catch (error) {
    console.log('[Version Check] Error checking version:', error);
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

        // Listen for controller change (service worker updated) - NO AUTO RELOAD
        let controllerChangeHandled = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (controllerChangeHandled) {
            return;
          }
          
          console.log('[Service Worker] Controller changed - new service worker active');
          controllerChangeHandled = true;
          
          // Just log - don't reload
          // Service worker updates happen in background, no need to reload
          setTimeout(() => {
            controllerChangeHandled = false;
          }, 1000);
        });
        
        // Listen for messages from service worker - NO AUTO RELOAD
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SW_ACTIVATED') {
            console.log('[Service Worker] New version activated:', event.data.version);
            // Just check version (logs only) - no reload
            setTimeout(() => {
              checkVersion();
            }, 2000); // 2 second delay
          }
        });
        
        // Periodic version check (every 60 seconds) - NO AUTO RELOAD
        // Only logs when new version is available
        setTimeout(() => {
          setInterval(() => {
            checkVersion();
          }, 60000);
        }, 10000); // Wait 10 seconds before starting periodic checks
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

