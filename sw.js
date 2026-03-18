const CACHE = 'family-finance-v3';
const ASSETS = ['./index.html', './manifest.json'];

// Install — cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate — delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — serve from cache first, update cache in background
self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then(cached => {
        const networkFetch = fetch('./index.html').then(response => {
          if (response.ok) {
            caches.open(CACHE).then(c => c.put('./index.html', response.clone()));
          }
          return response;
        }).catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }
  e.respondWith(
    fetch(e.request).then(response => {
      if (response.ok && e.request.method === 'GET') {
        caches.open(CACHE).then(c => c.put(e.request, response.clone()));
      }
      return response;
    }).catch(() => caches.match(e.request))
  );
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
