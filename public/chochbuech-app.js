// https://developers.google.com/web/fundamentals/primers/service-workers/
// https://web.dev/offline-cookbook/
// https://developers.google.com/web/tools/workbox/guides/get-started

// Only works in https contexts.

const CACHE_NAME = 'chochbuech';
const APP_MINOR_VERSION = 1;
const urlsToCache = [
    '/',
    '/manifest.json',
    '/scripts/editor.js',
    '/scripts/main.js',
    '/scripts/shopping.js',
    '/scripts/values.js',
    '/styles/editor-site.css',
    '/styles/list-site.css',
    '/styles/main-site.css',
    '/styles/shopping-site.css',
    '/styles/start-site.css',
    '/styles/view-site.css',
    '/templates/editor-site.html',
    '/templates/list-site.html',
    '/templates/main-site.html',
    '/templates/shopping-site.html',
    '/templates/start-site.html',
    '/templates/view-site.html',
    '/images/icon.png',
    '/images/take-picture.png',
    '/node-modules/angular.js',
    '/node-modules/angular-animate.js',
    '/node-modules/angular-aria.js',
    '/node-modules/angular-cookies.js',
    '/node-modules/angular-material.js',
    '/node-modules/angular-ui-router.js',
    '/node-modules/angular-material.css',
    '/fonts/Gotham Medium.ttf',
    'fonts.googleapis.com/icon?family=Material+Icons',
];
const appRoutes = [
    '/r/',
    '/search',
    '/edit/',
    '/new',
    '/all',
    '/shopping-list',
];
const apiRoutes = [
    '/properties',
    '/save',
    '/listRecipes',
    '/look',
    '/recipe/recipe',
    '/images/recipe',
];

self.addEventListener('install', function(event) {
    self.skipWaiting();
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('activate', () => {
    clients.claim();
});

self.addEventListener('fetch', event => {
    if (apiRoutes.some(route => event.request.url.indexOf(route) != -1)) {
        return;
    }

    if (new URL(event.request.url).origin == location.origin) {
        event.respondWith(async function() {
            const cache = await caches.open(CACHE_NAME);
            const request = appRoutes.some(route => event.request.url.indexOf(route) != -1) ?
                new Request('/') : event.request;
            const cachedResponse = await cache.match(request);
            if (cachedResponse) {
                return cachedResponse;
            }
            try {
                const networkResponse = await fetch(event.request);
                await cache.put(event.request, networkResponse.clone());
                return networkResponse;
            } catch (e) {
                return new Response('{"offline":true}', {headers: [['Content-Type', 'application/json']]});
            }
        }());
        return;
    }

    event.respondWith(async function() {
        const cachedResponse = await caches.match(event.request);
        return cachedResponse || fetch(event.request);
    }());
});
