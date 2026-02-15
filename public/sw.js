const CACHE = 'scalecorp-v3';

// Network-first strategy: always try network, fallback to cache
self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Delete ALL old caches
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network-first: always fetch fresh, cache as fallback
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok && e.request.method === 'GET' && e.request.url.startsWith(self.location.origin)) {
        const c = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, c));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
