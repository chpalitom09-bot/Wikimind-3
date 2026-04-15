// ============================================================
// WikiMind Excel — Service Worker v1.0
// Cache indépendant du SW principal WikiMind
// ============================================================

const CACHE_NAME = 'wikimind-xls-v1';
const ASSETS_TO_CACHE = [
  './Wikimind_xls.html',
  './formules.json',
  './xls.png',
  './manifest_xls.json'
];

// ── Installation : mise en cache des assets essentiels ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[WM Excel SW] Mise en cache des assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// ── Activation : nettoyage des vieux caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[WM Excel SW] Suppression ancien cache :', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch : Cache First pour les assets, Network First pour le reste ──
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Assets locaux (html, json, png) → Cache First
  if (ASSETS_TO_CACHE.some(asset => url.pathname.endsWith(asset.replace('./', '')))) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        });
      })
    );
    return;
  }

  // API Mistral / Firebase → Network only (pas de cache pour les données live)
  if (url.hostname.includes('mistral.ai') || url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
    return; // laisse passer normalement
  }

  // Ressources CDN (Tailwind, FA, Fonts) → Cache First avec fallback réseau
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached || new Response('Hors-ligne', { status: 503 }));
    })
  );
});
