
const CACHE_NAME = 'reviews-pwa-v1';
const urlsToCache = [
  '/',
  '/acervo',
  '/comunidade',
  '/perfil',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache failed:', error);
      })
  );
});

// Fetch event - serve cached content when offline with proper error handling
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Clone the request because it's a stream
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response because it's a stream
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Return fallback page for navigation requests when offline
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
        // For other requests, return a basic response to avoid console errors
        return new Response('Network error', {
          status: 408,
          statusText: 'Network error'
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle background sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  console.log('Background sync triggered');
  return Promise.resolve();
}

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nova atualização disponível!',
    icon: '/lovable-uploads/9162a45a-bbb2-4b4c-90ad-2fc80a1b7b12.png',
    badge: '/lovable-uploads/9162a45a-bbb2-4b4c-90ad-2fc80a1b7b12.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver agora',
        icon: '/lovable-uploads/9162a45a-bbb2-4b4c-90ad-2fc80a1b7b12.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/lovable-uploads/9162a45a-bbb2-4b4c-90ad-2fc80a1b7b12.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Reviews - Plataforma Médica', options)
  );
});
