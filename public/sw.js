const CACHE_NAME = 'plaza-nexus-v2';
const STATIC_CACHE = 'plaza-nexus-static-v2';
const RUNTIME_CACHE = 'plaza-nexus-runtime-v2';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Runtime caching patterns
const RUNTIME_PATTERNS = [
  /^https:\/\/fonts\.googleapis\.com/,
  /^https:\/\/fonts\.gstatic\.com/,
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  /\.(?:js|css)$/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(STATIC_ASSETS);
      await self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => !name.includes('v2'))
          .map(name => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests and chrome-extension requests
  if (url.origin !== location.origin && !url.origin.includes('supabase')) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Try cache first for static assets
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
          // Return cached version and update in background for runtime cache
          if (isRuntimeCacheable(request)) {
            event.waitUntil(updateCache(request));
          }
          return cachedResponse;
        }

        // Fetch from network
        const networkResponse = await fetch(request);
        
        // Cache runtime assets
        if (isRuntimeCacheable(request) && networkResponse.ok) {
          event.waitUntil(
            caches.open(RUNTIME_CACHE).then(cache => 
              cache.put(request, networkResponse.clone())
            )
          );
        }

        return networkResponse;
      } catch (error) {
        console.log('Fetch failed:', error);
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/');
        }
        
        throw error;
      }
    })()
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-sync') {
    event.waitUntil(syncOfflineActions());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Plaza Nexus', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper functions
function isRuntimeCacheable(request) {
  return RUNTIME_PATTERNS.some(pattern => pattern.test(request.url));
}

async function updateCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response);
    }
  } catch (error) {
    console.log('Cache update failed:', error);
  }
}

async function syncOfflineActions() {
  try {
    console.log('Syncing offline actions...');
    // This would integrate with your offline sync logic
    // Send stored actions to server when back online
  } catch (error) {
    console.log('Offline sync failed:', error);
    throw error;
  }
}