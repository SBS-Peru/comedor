/**
 * ============================================================================
 * SERVICE WORKER - COMEDOR SBS (Estrategia Network-First para Actualización Instantánea)
 * ============================================================================
 */

const CACHE_NAME = 'sbs-comedor-v18';
const ASSETS = [
  './',
  './index.html',
  './Logo.jpg',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Las peticiones POST hacia Google Apps Script siempre van directo a la red
  if (req.method !== 'GET' || req.url.includes('script.google.com') || req.url.includes('googleusercontent.com')) {
    return;
  }

  // Estrategia Network-First: siempre intenta traer el archivo más reciente de GitHub
  event.respondWith(
    fetch(req, { cache: 'no-store' })
      .then((networkResp) => {
        if (networkResp && networkResp.status === 200 && networkResp.type === 'basic') {
          const respClone = networkResp.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, respClone);
          });
        }
        return networkResp;
      })
      .catch(() => {
        return caches.match(req).then((cachedResp) => {
          return cachedResp || caches.match('./index.html');
        });
      })
  );
});
