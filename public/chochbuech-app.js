// https://developers.google.com/web/fundamentals/primers/service-workers/

// Only works in https contexts.

const CACHE_NAME = 'chochbuech';
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

self.addEventListener('install', function(event) {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', event => event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
        const request = appRoutes.some(route => event.request.url.indexOf(route) != -1) ?
            new Request('/') : event.request;
        return await cache.match(request) ?? await fetch(event.request);
    } catch (e) {
        return new Response('{"offline":true}', {headers: [['Content-Type', 'application/json']]});
    }
})()));
