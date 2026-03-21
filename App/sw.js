// ============================================================
// WikiMind 3.0 — Service Worker
// v3.2.0 — GitHub Pages (/Wikimind-3/) compatible
// ============================================================

const CACHE_NAME = 'wikimind-v3.2.0';
const BASE = '/Wikimind-3';

const STATIC_ASSETS = [
    `${BASE}/index.html`,
    `${BASE}/App/manifest.json`,
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;500;700&display=swap'
];

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
    console.log('[WikiMind SW] Install v3.2.0');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            Promise.allSettled(
                STATIC_ASSETS.map(url =>
                    cache.add(url).catch(err =>
                        console.warn('[WikiMind SW] Cache skip:', url, err)
                    )
                )
            )
        ).then(() => self.skipWaiting())
    );
});

// ---- ACTIVATE ----
self.addEventListener('activate', (event) => {
    console.log('[WikiMind SW] Activate v3.2.0');
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => {
                    console.log('[WikiMind SW] Delete old cache:', k);
                    return caches.delete(k);
                })
            ))
            .then(() => self.clients.claim())
    );
});

// ---- FETCH ----
self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Toujours réseau pour les APIs externes
    if (NETWORK_ONLY_HOSTS.some(h => url.hostname.includes(h))) return;

    // Network-First pour HTML
    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then(res => {
                    if (res && res.status === 200) {
                        caches.open(CACHE_NAME).then(c => c.put(request, res.clone()));
                    }
                    return res;
                })
                .catch(() =>
                    caches.match(request)
                        .then(cached => cached || caches.match(`${BASE}/index.html`))
                )
        );
        return;
    }

    // Cache-First pour les assets
    event.respondWith(
        caches.match(request).then(cached => {
            if (cached) return cached;
            return fetch(request).then(res => {
                if (res && res.status === 200) {
                    caches.open(CACHE_NAME).then(c => c.put(request, res.clone()));
                }
                return res;
            }).catch(() => {
                console.warn('[WikiMind SW] Offline, resource unavailable:', request.url);
            });
        })
    );
});

// ---- PUSH ----
self.addEventListener('push', (event) => {
    const data = event.data?.json() ?? { title: 'WikiMind', body: 'Nouvelle notification !', url: `${BASE}/index.html` };
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: `${BASE}/App/icon-192.png`,
            badge: `${BASE}/App/icon-192.png`,
            vibrate: [100, 50, 100],
            data: { url: data.url || `${BASE}/index.html` }
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data?.url || `${BASE}/index.html`));
});
