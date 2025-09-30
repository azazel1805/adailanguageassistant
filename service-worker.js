  // A unique cache name for this version of the app.
const CACHE_NAME = 'yds-ai-assistant-cache-v1';

// List of assets to cache on installation.
// This is the "app shell" - the minimal resources needed for the app to start.
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx', // Corrected from index.js
  '/index.css',
  '/manifest.json'
];

// Install event: cache the application shell.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Failed to cache app shell:', err);
      })
  );
});

// Activate event: clean up old caches.
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event: Intercept requests to fix MIME types and serve from cache.
self.addEventListener('fetch', (event) => {
  // We only want to handle GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);

  // Only handle requests for our own origin.
  if (requestUrl.origin !== self.location.origin) {
    return;
  }
  
  // This function handles TS/TSX file requests by correcting their MIME type.
  const handleTsxRequest = async (request) => {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // If we have a cached and corrected response, serve it.
    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      // Otherwise, fetch from the network.
      const networkResponse = await fetch(request);

      // If the fetch fails, return the error response for the browser to handle.
      if (!networkResponse.ok) {
        return networkResponse;
      }
      
      // Read the body of the response as text.
      const body = await networkResponse.text();
      
      // Create new headers, copying the old ones but setting the correct Content-Type.
      const newHeaders = new Headers(networkResponse.headers);
      newHeaders.set('Content-Type', 'application/javascript; charset=utf-8');
      
      // Create a new Response object with the original body and our corrected headers.
      const responseToServe = new Response(body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: newHeaders
      });
      
      // Cache this new, corrected response for future requests.
      // We use .clone() because a Response body can only be read once.
      await cache.put(request, responseToServe.clone());
      
      // Return the corrected response to the browser.
      return responseToServe;
    } catch (error) {
      console.error(`Fetch failed for ${request.url}:`, error);
      // Re-throw the error to be caught by the browser.
      throw error;
    }
  };
  
  // If the request is for a .ts or .tsx file, use our special handler.
  if (requestUrl.pathname.endsWith('.ts') || requestUrl.pathname.endsWith('.tsx')) {
    event.respondWith(handleTsxRequest(event.request));
  } else {
    // For all other files, use a standard cache-first strategy.
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Return the cached response if it exists.
        // Otherwise, fetch from the network.
        return cachedResponse || fetch(event.request).then((networkResponse) => {
          // If the network request is successful, cache it for offline use.
          if (networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
  }
});
