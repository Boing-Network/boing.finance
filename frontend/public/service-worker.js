// Service Worker for boing.finance
// Provides offline support and caching
// IMPORTANT: Update CACHE_VERSION on each deployment to force cache invalidation
// This ensures users get the latest version after deployment

const CACHE_VERSION = 'v1764514921072'; // Update this version number on each deployment
const CACHE_NAME = 'boing-finance-' + CACHE_VERSION;
const RUNTIME_CACHE = 'boing-finance-runtime-' + CACHE_VERSION;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/favicon.ico',
  '/favicon.svg',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.warn('Failed to cache some assets:', error);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Delete all old caches that don't match current version
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete any cache that doesn't match current version
            return !cacheName.includes(CACHE_VERSION);
          })
          .map((cacheName) => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      // Force all clients to use the new service worker immediately
      return self.clients.claim();
    })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event - network-first strategy for HTML, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle HTML files with network-first strategy (always get fresh HTML)
  if (request.headers.get('accept')?.includes('text/html') || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          // Always use network response for HTML
          return response;
        })
        .catch(() => {
          // Network failed, try cache as fallback
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return index.html as last resort
            return caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          // Clone the response
          const responseToCache = response.clone();
          // Cache successful responses
          if (response.status === 200) {
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline page or error response
            return new Response(
              JSON.stringify({ error: 'Offline', message: 'Network request failed' }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }

  // Handle static assets (JS, CSS, images) with stale-while-revalidate strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Always fetch in background to update cache
      const fetchPromise = fetch(request, { cache: 'no-cache' }).then((response) => {
        // Don't cache non-GET requests or non-successful responses
        if (request.method !== 'GET' || !response || response.status !== 200) {
          return response;
        }
        // Clone the response
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        return response;
      }).catch(() => {
        // Network failed, return cached if available
        return cachedResponse;
      });

      // Return cached immediately if available, otherwise wait for network
      return cachedResponse || fetchPromise;
    })
  );
});

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-deployments') {
    event.waitUntil(syncDeployments());
  }
});

async function syncDeployments() {
  // Sync any pending deployments when back online
  const pendingDeployments = await getPendingDeployments();
  for (const deployment of pendingDeployments) {
    try {
      await retryDeployment(deployment);
    } catch (error) {
      console.error('Failed to sync deployment:', error);
    }
  }
}

async function getPendingDeployments() {
  // Get pending deployments from IndexedDB or localStorage
  return [];
}

async function retryDeployment(deployment) {
  // Retry deployment logic
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'boing.finance';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/favicon-96x96.png',
    badge: '/favicon-96x96.png',
    tag: data.tag || 'default',
    data: data.url || '/',
    ...data.options
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
