// Service Worker برای TNT MOD - PWA + Offline Support
const CACHE_NAME = 'tnt-mod-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // فقط GET request ها
  if (event.request.method !== 'GET') return;
  // برای API ها و GitHub، cache نکن
  const url = new URL(event.request.url);
  if (url.hostname.includes('github') || url.hostname.includes('api.') || url.hostname.includes('pollinations')) {
    return;
  }
  // سایر موارد: Network First با fallback به cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // کش کن
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
