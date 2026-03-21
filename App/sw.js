// ============================================================
// WikiMind 3.0 — Service Worker (App/sw.js)
// v3.1.0 — Stratégie : Cache-First assets / Network-First pages
// ============================================================

const CACHE_NAME = 'wikimind-v3.1.0';

const STATIC_ASSETS = [
    '/index.html',
    '/App/manifest.json',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;500;700&display=swap'
];

// Domaines à toujours servir depuis le réseau (jamais caché)
const NETWORK_ONLY_HOSTS = [
    'firebaseio.com',
    'firebaseapp.com',
    'googleapis.com',
    'mistral.ai',
    'googletagmanager.com',
    'gstatic.com'
];

// ---- INSTALL ----
self.addEventListener('install', (event) => {
    console.log('[WikiMind SW] Installation v3.1.0');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.allSettled(
                STATIC_ASSETS.map(url =>
                    cache.add(url).catch(err =>
                        console.warn('[WikiMind SW] Cache partiel pour', url, err)
                    )
                )
            );
        }).then(() => self.skipWaiting())
    );
});

// ---- ACTIVATE : purge anciens caches ----
self.addEventListener('activate', (event) => {
    console.log('[WikiMind SW] Activation v3.1.0');
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => {
                        console.log('[WikiMind SW] Suppression ancien cache :', name);
                        return caches.delete(name);
                    })
            )
        ).then(() => self.clients.claim())
    );
});

// ---- FETCH : stratégie hybride ----
self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Network-only pour les APIs et services externes critiques
    const isNetworkOnly = NETWORK_ONLY_HOSTS.some(host => url.hostname.includes(host));
    if (isNetworkOnly) return;

    // Network-First pour les pages HTML (toujours fraîches)
    const isHTML = request.headers.get('accept')?.includes('text/html');
    if (isHTML) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() =>
                    caches.match(request).then(cached => cached || caches.match('/index.html'))
                )
        );
        return;
    }

    // Cache-First pour les assets statiques (fonts, CSS, JS, images)
    event.respondWith(
        caches.match(request).then(cached => {
            if (cached) return cached;

            return fetch(request).then(response => {
                // Ne cache que les réponses valides et non-opaques quand possible
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                }
                return response;
            }).catch(() => {
                console.warn('[WikiMind SW] Ressource indisponible hors-ligne :', request.url);
            });
        })
    );
});

// ---- PUSH NOTIFICATIONS ----
self.addEventListener('push', (event) => {
    const data = event.data?.json() ?? {
        title: 'WikiMind',
        body: 'Nouvelle notification !',
        url: '/index.html'
    };
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/App/icon-192.png',
            badge: '/App/icon-192.png',
            vibrate: [100, 50, 100],
            data: { url: data.url || '/index.html' }
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data?.url || '/index.html')
    );
});
