// NUTRATEIN Service Worker v1.0
const CACHE_NAME = "nutratein-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/shop.html",
  "/css/style.css",
  "/css/responsive.css",
  "/js/app.js",
  "/js/i18n.js",
  "/offline.html"
];

// Install - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("SW: Some assets failed to cache:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch - cache-first for static, network-first for API
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never cache API calls or auth
  if (url.pathname.startsWith("/api/") || url.pathname.includes("auth") || url.pathname.includes("payment")) {
    return; // Let browser handle normally
  }

  // For HTML pages - network first, fall back to cache, then offline page
  if (event.request.headers.get("accept") && event.request.headers.get("accept").includes("text/html")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match("/offline.html");
        });
      })
    );
    return;
  }

  // For static assets - cache first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      }).catch(() => caches.match("/offline.html"));
    })
  );
});
