/* My Cart PWA: online-first, offline-capable. Does not touch localStorage. */
const CACHE_NAME = 'my-cart-pages-v5-total-text-20261016';
const CACHE_PREFIX = 'my-cart-';
const APP_SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
const OFFLINE_PAGE = new URL('./index.html', self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    // Never delete caches belonging to other GitHub Pages projects.
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;

  event.respondWith((async () => {
    try {
      // Always fetch a fresh copy when online, including HTML navigations.
      const response = await fetch(request, {cache: 'no-store'});
      if (response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      // A cached copy remains available if the phone is offline.
      const cached = await caches.match(request, {ignoreSearch: true});
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const fallback = await caches.match(OFFLINE_PAGE);
        if (fallback) return fallback;
      }
      return Response.error();
    }
  })());
});
