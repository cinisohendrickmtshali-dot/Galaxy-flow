const CACHE_NAME = 'galaxy-flow-v1';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './game.js',
    './manifest.json'
];

// Install the service worker and cache the files
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Serve the cached files when offline
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});
