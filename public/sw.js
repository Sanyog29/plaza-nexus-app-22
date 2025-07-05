const CACHE_NAME = 'ss-plaza-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install SW
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Listen for requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate SW
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
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