// ============================================================
// WikiMind 3.0 — Service Worker (App/sw.js)
// Stratégie : Cache-First pour les assets, Network-First pour les pages
// ============================================================

const CACHE_NAME = 'wikimind-v3.0.4';
const STATIC_ASSETS = [
    '/index.html',
    '/App/manifest.json',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Space+Grotesk:wght@300;500;700&display=swap'
];

// ---- INSTALL : mise en cache des assets statiques ----
self.addEventListener('install', (event) => {
    console.log('[WikiMind SW] Installation...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[WikiMind SW] Mise en cache des assets statiques');
            // On utilise addAll avec gestion d'erreur souple
            return Promise.allSettled(
                STATIC_ASSETS.map(url => cache.add(url).catch(err => console.warn('[WikiMind SW] Cache partiel pour', url, err)))
            );
        }).then(() => self.skipWaiting())
    );
});

// ---- ACTIVATE : nettoyage des anciens caches ----
self.addEventListener('activate', (event) => {
    console.log('[WikiMind SW] Activation...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => {
                        console.log('[WikiMind SW] Suppression ancien cache :', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// ---- FETCH : stratégie hybride ----
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorer les requêtes non-GET et les requêtes Firebase/Mistral (toujours réseau)
    if (request.method !== 'GET') return;
    if (
        url.hostname.includes('firebaseio.com') ||
        url.hostname.includes('firebaseapp.com') ||
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('mistral.ai') ||
        url.hostname.includes('googletagmanager.com')
    ) return;

    // Stratégie Network-First pour les pages HTML (toujours à jour)
    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(request).then(cached => cached || caches.match('/index.html')))
        );
        return;
    }

    // Stratégie Cache-First pour les assets statiques (CSS, JS, fonts, images)
    event.respondWith(
        caches.match(request).then(cached => {
            if (cached) return cached;
            return fetch(request).then(response => {
                if (!response || response.status !== 200 || response.type === 'opaque') {
                    return response;
                }
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                return response;
            }).catch(() => {
                // Fallback silencieux pour les assets non critiques
                console.warn('[WikiMind SW] Ressource indisponible hors-ligne :', request.url);
            });
        })
    );
});

// ---- PUSH NOTIFICATIONS (optionnel, pour le futur) ----
self.addEventListener('push', (event) => {
    const data = event.data?.json() ?? { title: 'WikiMind', body: 'Nouvelle notification !' };
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
