const CACHE_NAME = "edufill-cache-v2"; // Version change kiya taaki purana cache delete ho jaye

self.addEventListener("install", (event) => {
  self.skipWaiting(); // Naya update aate hi turant activate ho jaye
});

self.addEventListener("activate", (event) => {
  // Purane saare kachre (cache) ko delete karne ka code
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  // NETWORK-FIRST: Hamesha pehle naya code server se layega
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});