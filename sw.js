/**
 * Service Worker - Comedor SBS (v28)
 * Estrategia Network-First para evitar que los celulares se queden en versiones antiguas.
 */
const CACHE_NAME = 'comedor-sbs-v28-1-u6';
const ASSETS_BASE = [
  './',
  './index.html',
  './manifest.json',
  './Logo.jpg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_BASE).catch(() => {}))
      .catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Nunca cachear peticiones POST ni llamadas externas (Google Apps Script / CDNs)
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Network-First: siempre intenta descargar la versión más reciente desde GitHub Pages
  event.respondWith(
    fetch(req, { cache: 'no-store' })
      .then((networkResp) => {
        if (networkResp && networkResp.status === 200) {
          const respClone = networkResp.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, respClone).catch(() => {});
          });
        }
        return networkResp;
      })
      .catch(() => {
        return caches.match(req).then((cached) => {
          if (cached) return cached;
          if (req.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
