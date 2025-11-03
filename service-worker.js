const CACHE_NAME = 'gardening-assistant-cache-v1';
// A list of all the local files that make up the application's shell.
// With the consolidated single-file structure, we only need to cache index.html and its direct dependencies.
const urlsToCache = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/@babel/standalone/babel.min.js',
];

// Install event: open a cache and add the application shell files to it.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Use no-cache to ensure we get the latest versions from the CDN during installation.
        const requests = urlsToCache.map(url => new Request(url, { cache: 'no-cache' }));
        return cache.addAll(requests);
      })
      .catch(error => {
        console.error('Failed to cache during install:', error);
      })
  );
});

// Fetch event: serves assets from cache first, falls back to network.
// If a resource is fetched from the network, it's cached for future offline use.
self.addEventListener('fetch', event => {
  // We only handle GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If the resource is in the cache, return it.
        if (response) {
          return response;
        }

        // Otherwise, fetch the resource from the network.
        return fetch(event.request).then(
          networkResponse => {
            // We don't cache responses from the Gemini API or other dynamic content.
            // Only cache requests that are part of our initial cache list.
            if (urlsToCache.includes(event.request.url) || event.request.url.endsWith('.js') || event.request.url.endsWith('.css')) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
            }
            // Return the network response.
            return networkResponse;
          }
        ).catch(error => {
          console.error("Fetching failed:", error);
          throw error;
        });
      })
  );
});

// Activate event: clean up old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // If the cache name is not in our whitelist, delete it.
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
