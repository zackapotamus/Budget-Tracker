const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/styles.css",
  "/dist/index.bundle.js",
  // "/dist/db.bundle.js",
  "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css",
  "https://cdn.jsdelivr.net/npm/chart.js@2.8.0",
  "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/fonts/fontawesome-webfont.woff2?v=4.7.0",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/dist/icon_72x72.png",
  "/dist/icon_96x96.png",
  "/dist/icon_128x128.png",
  "/dist/icon_144x144.png",
  "/dist/icon_152x152.png",
  "/dist/icon_192x192.png",
  "/dist/icon_384x384.png",
  "/dist/icon_512x512.png",
  "/dist/manifest.json",
  "/service-worker.js",
  "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/fonts/fontawesome-webfont.woff?v=4.7.0",
  "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/fonts/fontawesome-webfont.ttf?v=4.7.0",
];

const STATIC_CACHE = "static-cache-v1";
const RUNTIME_CACHE = "runtime-cache";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener("activate", (event) => {
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        // return array of cache names that are old to delete
        return cacheNames.filter(
          (cacheName) => !currentCaches.includes(cacheName)
        );
      })
      .then((cachesToDelete) => {
        return Promise.all(
          cachesToDelete.map((cacheToDelete) => {
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // non GET requests are not cached and requests to other origins are not cached
  if (
    event.request.method !== "GET" ||
    !event.request.url.startsWith(self.location.origin)
  ) {
    event.respondWith(fetch(event.request));
    return;
  }
  if (event.request.url.includes("/api/")) {
    console.log("api request intercepted", event.request.url);
    event.respondWith(
      caches
        .open(RUNTIME_CACHE)
        .then((cache) => {
          return fetch(event.request)
            .then((response) => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                cache.put(event.request.url, response.clone());
              }

              return response;
            })
            .catch((err) => {
              // Network request failed, try to get it from the cache.
              console.log("fetch failed in service-worker", err);
              return cache.match(event.request);
            });
        })
        .catch((err) => {
          console.log("error opening runtime_cache", err);
        })
    );

    return;
  }

  // use cache first for all other requests for performance
  console.log("inside fetch event listener:", event.request);
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log(" cached response found");
        return cachedResponse;
      }

      // request is not in cache. make network request and cache the response
      console.log("no cached response for request:", event.request);
      return caches.open(RUNTIME_CACHE).then((cache) => {
        console.log("do the fetch");
        return fetch(event.request).then((response) => {
          console.log("cache the response:", response);
          if (response.satatus === 200) {
            return cache.put(event.request, response.clone()).then(() => {
              return response;
            });
          }
          return response;
        });
      });
    })
  );
});
