/* BrandTrace AI — Enterprise Governance Progressive Web App Service Worker
   Safe Caching Architecture:
   1. Static UI shell & icons are precached for fast loading.
   2. All API calls (/api/*) are strictly NETWORK ONLY — zero caching of confidential facts, tokens, or releases.
   3. Non-GET mutations (POST, PUT, DELETE) are never cached or replayed offline.
   4. Offline fallback page is served on network disconnection.
*/

const CACHE_NAME = 'brandtrace-static-v1';
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.webmanifest'
];

// Install: Precache static app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up obsolete caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Enforce safe zero-trust routing policy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Non-GET requests (Mutations, Approvals, Submissions, Reseed) -> NETWORK ONLY
  if (request.method !== 'GET') {
    return; // Pass through directly to browser network layer
  }

  // 2. Private API Endpoints (/api/*) -> NETWORK ONLY (Never cache sensitive brand facts or tokens)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            status: 'offline',
            error: 'NetworkUnavailable',
            detail: 'BrandTrace AI server is unreachable. Live brand governance requires an active connection.'
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // 3. Page Navigation (HTML) -> Network First with Offline Page Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline.html').then((offlineResponse) => {
          return offlineResponse || new Response('BrandTrace AI is offline.', { status: 503 });
        });
      })
    );
    return;
  }

  // 4. Static UI Assets (JS, CSS, SVGs, Fonts) -> Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
