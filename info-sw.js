const CACHE_NAME = 'wm-info-cache-v1';

// Installation du Service Worker
self.addEventListener('install', (event) => {
    // Force l'activation immédiate
    self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Interception des requêtes réseau (Nécessaire pour le statut PWA)
// On fait une simple stratégie "Network First"
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
