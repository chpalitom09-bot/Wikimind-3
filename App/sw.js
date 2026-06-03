// ============================================================
// WikiMind 3.0 — Service Worker
// v3.3.0 — GitHub Pages (/Wikimind-3/) compatible
// ============================================================

const CACHE_NAME = 'wikimind-v3.3.0';
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
    console.log('[WikiMind SW] Install v3.3.0');
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
    console.log('[WikiMind SW] Activate v3.3.0');
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

// ============================================================
// WIDGETS PWA (Chrome for Android 14+ / Samsung Internet)
// ============================================================

// Noms des tags widgets déclarés dans manifest.json
const WIDGET_TAGS = {
    AI:    'wikimind-ai-widget',
    STUDY: 'wikimind-study-widget',
    FLASH: 'wikimind-flash-widget',
};

// Helper: récupère un widget par son tag
async function getWidget(tag) {
    if (!self.widgets) return null;
    return await self.widgets.getByTag(tag);
}

// ---- WIDGET INSTALL ----
self.addEventListener('widgetinstall', async (event) => {
    const { widget } = event;
    event.waitUntil(updateWidget(widget));
});

// ---- WIDGET UNINSTALL ----
self.addEventListener('widgetuninstall', async (event) => {
    // Nettoyage si besoin (notifications, alarms, etc.)
    console.log('[WikiMind Widget] Désinstallé:', event.widget?.definition?.tag);
});

// ---- WIDGET RESUME (retour en premier plan) ----
self.addEventListener('widgetresume', async (event) => {
    const { widget } = event;
    event.waitUntil(updateWidget(widget));
});

// ---- WIDGET CLICK (quand l'utilisateur tape sur le widget) ----
self.addEventListener('widgetclick', async (event) => {
    const { widget, action } = event;
    const tag = widget?.definition?.tag;

    if (action === 'open-app') {
        const urlMap = {
            [WIDGET_TAGS.AI]:    `${BASE}/Wikimind_AI.html`,
            [WIDGET_TAGS.STUDY]: `${BASE}/Wikimind_study1.html`,
            [WIDGET_TAGS.FLASH]: `${BASE}/Wikimind_flash.html`,
        };
        const url = urlMap[tag] || `${BASE}/index.html`;
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(clientList => {
                for (const client of clientList) {
                    if (client.url.includes('/Wikimind-3/') && 'focus' in client) {
                        client.navigate(url);
                        return client.focus();
                    }
                }
                return clients.openWindow(url);
            })
        );
    }

    event.waitUntil(updateWidget(widget));
});

// Génère le payload JSON pour chaque widget
async function buildWidgetPayload(tag) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    if (tag === WIDGET_TAGS.AI) {
        return {
            title: 'WikiMind AI',
            subtitle: 'Assistant IA',
            body: 'Touchez pour poser une question',
            action: 'open-app',
            cta: 'Ouvrir WikiMind AI',
            time: timeStr,
            icon: `${BASE}/1.png`
        };
    }
    if (tag === WIDGET_TAGS.STUDY) {
        return {
            title: 'WikiMind Study',
            subtitle: 'Pomodoro & Tâches',
            body: 'Démarrez une session de travail',
            action: 'open-app',
            cta: 'Lancer le minuteur',
            time: timeStr,
            icon: `${BASE}/1.png`
        };
    }
    if (tag === WIDGET_TAGS.FLASH) {
        return {
            title: 'WikiMind Flash',
            subtitle: 'Révision rapide',
            body: 'Continuez vos révisions',
            action: 'open-app',
            cta: 'Ouvrir Flash Cards',
            time: timeStr,
            icon: `${BASE}/1.png`
        };
    }
    return { title: 'WikiMind', action: 'open-app', cta: 'Ouvrir', time: timeStr };
}

async function updateWidget(widget) {
    if (!widget || !self.widgets) return;
    const tag = widget.definition?.tag;
    const payload = await buildWidgetPayload(tag);
    try {
        await self.widgets.updateByTag(tag, { data: JSON.stringify(payload) });
    } catch(e) {
        console.warn('[WikiMind Widget] updateByTag failed:', e);
    }
}

// Rafraîchir tous les widgets au démarrage du SW
self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            if (!self.widgets) return;
            for (const tag of Object.values(WIDGET_TAGS)) {
                const widget = await self.widgets.getByTag(tag);
                if (widget) await updateWidget(widget);
            }
        })()
    );
});
