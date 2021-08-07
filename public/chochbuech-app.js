// https://developers.google.com/web/fundamentals/primers/service-workers/

const CACHE_NAME = 'chochbuech';
const urlsToCache = [
    '/',
    '/manifest.json',
    '/scripts/editor.js',
    '/scripts/main.js',
    '/scripts/shopping.js',
    '/scripts/values.js',
    '/styles/editor-site.css',
    '/styles/main-site.css',
    '/styles/shopping-site.css',
    '/styles/start-site.css',
    '/styles/view-site.css',
    '/templates/editor-site.html',
    '/templates/main-site.html',
    '/templates/shopping-site.html',
    '/templates/start-site.html',
    '/templates/view-site.html',
    '/images/icon.png',
    '/images/new.png',
    '/fonts/Gotham Medium.ttf',
    '/node-modules/angular-material.css',
    '/node-modules/angular.js',
    '/node-modules/angular-animate.js',
    '/node-modules/angular-aria.js',
    '/node-modules/angular-cookies.js',
    '/node-modules/angular-material.js',
    '/node-modules/angular-ui-router.js',
    'fonts.googleapis.com/icon?family=Material+Icons',
];

self.addEventListener('install', function(event) {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', function(event) {
    event.respondWith(caches.match(event.request)
        .then(cached => cached ?? fetch(event.request)));
});
