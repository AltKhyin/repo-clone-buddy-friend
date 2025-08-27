
// Use build hash for cache version - automatically unique per build
const CACHE_NAME = `reviews-pwa-v${self.location.pathname.split('/').pop() || Date.now()}`;
const CACHE_VERSION = '1.0.0';

const urlsToCache = [
  '/',
  '/acervo',
  '/comunidade',
  '/perfil',
  '/manifest.json'
];

// Delete old caches when version changes
const deleteOldCaches = async () => {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    name.startsWith('reviews-pwa-v') && name !== CACHE_NAME
  );
  
  return Promise.all(
    oldCaches.map(name => {
      console.log('Deleting old cache:', name);
      return caches.delete(name);
    })
  );
};

// Install event - cache resources and delete old caches
self.addEventListener('install', (event) => {
  console.log('Installing new service worker:', CACHE_NAME);
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('Opened cache:', CACHE_NAME);
          return cache.addAll(urlsToCache);
        }),
      deleteOldCaches()
    ]).catch((error) => {
      console.log('Cache installation failed:', error);
    })
  );
  
  // Don't skip waiting - let the client decide when to activate
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

// Activate event - clean up old caches and take control immediately
self.addEventListener('activate', (event) => {
  console.log('Activating new service worker:', CACHE_NAME);
  event.waitUntil(
    Promise.all([
      deleteOldCaches(),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

// Handle messages from client (for manual activation)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Received SKIP_WAITING message, activating new service worker');
    self.skipWaiting();
  }
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
