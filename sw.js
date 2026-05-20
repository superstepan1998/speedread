// SpeedRead service worker — basic offline cache
const CACHE = 'speedread-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS).catch(() => {})) // ignore failed cross-origin
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Don't cache the bundled sample epub (too large, optional)
  if (req.url.includes('pride-and-prejudice.epub')) return;

  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        // Cache successful same-origin and known CDN responses
        if (res && res.status === 200 && (req.url.startsWith(self.location.origin) || req.url.includes('cdnjs.cloudflare.com') || req.url.includes('fonts.googleapis.com') || req.url.includes('fonts.gstatic.com'))) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => hit);
    })
  );
});
