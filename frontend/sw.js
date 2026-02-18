const CACHE_NAME = "conversor-cache-v1";

// Archivos que queremos cachear para offline
const urlsToCache = [
  "./",
  "./index.html",
  "./app.js",
  "./style.css",
  "./manifest.json",
  "./img/web-app-manifest-192x192.png",
  "./img/web-app-manifest-512x512.png"
];

// Instalación del service worker y cacheo inicial
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Activación y limpieza de caches antiguas
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
});

// Interceptar requests y responder con cache si no hay conexión
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});