const CACHE_NAME = 'ss-plaza-v2';
const OFFLINE_CACHE = 'ss-plaza-offline-v1';

const urlsToCache = [
  '/',
  '/manifest.json',
  '/auth',
  // Add core fonts and assets
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap'
];

const offlineUrls = [
  '/auth',
  '/'
];

// Install SW
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Opened main cache');
        return cache.addAll(urlsToCache);
      }),
      caches.open(OFFLINE_CACHE).then((cache) => {
        console.log('Opened offline cache');
        return cache.addAll(offlineUrls);
      })
    ])
  );
});

// Listen for requests
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }

        // Try to fetch from network
        return fetch(event.request.clone())
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cache successful responses
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/auth');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Activate SW
self.addEventListener('activate', (event) => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'maintenance-request') {
    event.waitUntil(
      // Handle offline requests when back online
      handleOfflineRequests()
    );
  }
});

async function handleOfflineRequests() {
  // Implement offline request handling logic
  console.log('Handling offline requests...');
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from SS Plaza',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'ss-plaza-notification',
    renotify: true,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/action-dismiss.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('SS Plaza', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});