// HubScale Service Worker — PWA offline support
const CACHE_NAME = 'hubscale-v1';
const PRECACHE_URLS = ['/', '/index.html', '/favicon.svg'];

// Install — precache critical app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate — purge outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Helpers
function isApiCall(url) {
  return url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('sentry');
}

function isStaticAsset(url) {
  return /\.(js|css|woff2?|ttf|eot|png|jpe?g|gif|svg|webp|ico|avif)$/.test(url.pathname) ||
    url.pathname.includes('/assets/');
}

// Stale-while-revalidate: return cache immediately, update in background
function staleWhileRevalidate(request) {
  return caches.open(CACHE_NAME).then((cache) =>
    cache.match(request).then((cached) => {
      const fetched = fetch(request).then((response) => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
}

// Cache-first: serve from cache, fall back to network and cache the result
function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return response;
    });
  });
}

// Network-first: try network, fall back to cache, ultimate fallback to cached index.html
function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      return response;
    })
    .catch(() =>
      caches.match(request).then((cached) => cached || caches.match('/index.html'))
    );
}

// Fetch — route requests to the right strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // HTML navigation — network-first with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // API calls — stale-while-revalidate for speed
  if (isApiCall(url)) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // Static assets (images, fonts, vendor chunks) — cache-first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Everything else — network-first
  event.respondWith(networkFirst(event.request));
});
