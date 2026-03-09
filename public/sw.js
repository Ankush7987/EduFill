const CACHE_NAME = "edufill-cache-v1";
const urlsToCache = ["/", "/index.html"];

// Install Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch Data (Keep real-time data fresh)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Agar cache me hai to wo do, nahi to internet se lao
      return response || fetch(event.request);
    })
  );
});