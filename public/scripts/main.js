/**
 * Created by Fabian on 28.11.2016.
 */

"use strict";

const REQ = [
    'ui.router',
    'ngMaterial',
    'Editor',
    'Shopping',
    'Values',
];

function controls(...names) {
    return ['$scope', ...names, function($scope, ...values) {
        names.forEach((name, i) => $scope[name] = values[i]);
    }];
}

angular.module('Chochbuech', REQ)
    .controller('main', controls('C', '$state', '$mdSidenav', 'properties', 'admin'))
    .directive('mainSite', [function() {
        return { replace: true, restrict: 'E', templateUrl: 'templates/main-site.html' };
    }])
    .config(['$stateProvider', '$locationProvider', '$urlRouterProvider', 'CProvider',
    function($stateProvider, $locationProvider, $urlRouterProvider, CProvider) {
        const C = CProvider.$get();
        $locationProvider.html5Mode({ enabled: true, rewriteLinks: false });
        const tabs = [
            {label: 'Alltag', category: C.CATEGORY.Easy},
            {label: 'Wochenende', category: C.CATEGORY.Hard},
            {label: 'Apéro', category: C.CATEGORY.Starter},
            {label: 'Dessert', category: C.CATEGORY.Dessert},
        ];

        $stateProvider
            .state(C.SITE.Main, {
                url: '/',
                templateUrl: 'templates/start-site.html',
                controller: controls('tabs', 'history'),
                resolve: {
                    tabs: ['$recipe', $recipe =>
                        Promise.all(tabs.map(tab => $recipe.list(tab.category)))
                            .then(recipess => recipess.map((recipes, i) => ({...tabs[i], recipes})))],
                    history: ['$cookies', function($cookies) {
                        const COOKIE_NAME = 'history', RETENTION_MS = 1000 * 60 * 60 * 24 * 14;
                        return JSON.parse($cookies.get(COOKIE_NAME) ?? '[]').filter(e =>
                            e.time > new Date().getTime() - RETENTION_MS);
                    }],
                }
            })
            .state(C.SITE.Search, {
                url: '/search?:term',
                params: { term: { type: 'string' } },
                templateUrl: 'templates/start-site.html',
                controller: controls('tabs', 'history'),
                resolve: {
                    tabs: ['$stateParams', '$recipe', ($stateParams, $recipe) =>
                        $recipe.search($stateParams.term).then(recipes => [{label: "Suche", recipes}])],
                    history: [() => []],
                },
            })
            .state(C.SITE.View, {
                url: '/r/:id',
                params: { id: { type: 'int' } },
                templateUrl: 'templates/view-site.html',
                controller: controls('recipe', 'display', 'shopRecipe'),
                resolve: {
                    recipe: ['$stateParams', '$recipe',
                        ($stateParams, $recipe) => $recipe.get(+$stateParams.id)],
                    display: ['recipe', 'recipeDisplay',
                        (recipe, recipeDisplay) => recipeDisplay(recipe)],
                    history: ['$cookies', 'recipe', function($cookies, recipe) {
                        const COOKIE_NAME = 'history', RETENTION_MS = 1000 * 60 * 60 * 24 * 14;
                        const COOKIE_OPTS =
                            {expires: (d => { d.setDate(d.getDate() + 30); return d; })(new Date())};
                        const history = JSON.parse($cookies.get(COOKIE_NAME) ?? '[]').filter(e =>
                            e.id != recipe.id && e.time > new Date().getTime() - RETENTION_MS);
                        const entry = { id: recipe.id, image: recipe.image, time: new Date().getTime() };
                        let newHistory = JSON.stringify([entry, ...history].slice(0, 12));
                        $cookies.put(COOKIE_NAME, newHistory, COOKIE_OPTS);
                    }]
                },
            })
            .state(C.SITE.Editor, {
                url: '/edit/:id',
                params: { id: { type: 'int' } },
                templateUrl: 'templates/editor-site.html',
                controller: controls('recipe'),
                resolve: {
                    recipe: ['$stateParams', '$recipe',
                        ($stateParams, $recipe) => $recipe.get(+$stateParams.id)],
                },
            })
            .state(C.SITE.New, {
                url: '/new',
                templateUrl: 'templates/editor-site.html',
                controller: controls('recipe'),
                resolve: {
                    recipe: ['NEW_RECIPE', NEW_RECIPE => angular.copy(NEW_RECIPE)],
                },
            })
            .state(C.SITE.All, {
                url: '/all',
                templateUrl: 'templates/list-site.html',
                controller: controls('recipes'),
                resolve: {
                    recipes: ['$recipe', $recipe => $recipe.list('all')],
                },
            })
            .state(C.SITE.Shopping, {
                url: '/shopping-list',
                templateUrl: 'templates/shopping-site.html',
            });
        $urlRouterProvider.otherwise('/');
    }])
    .config(['$transitionsProvider', 'CProvider', function($transitionsProvider, CProvider) {
        // Only works in https contexts.
        const C = CProvider.$get();
        let lock = null;

        const onVisibilityChange = () => {
            if (lock?.released && document.visibilityState == 'visible') {
                return keepScreenOn();
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        document.addEventListener('fullscreenchange', onVisibilityChange);

        async function keepScreenOn() {
            if (!('wakeLock' in navigator && 'request' in navigator.wakeLock)) {
                return;
            }
            try {
                lock = await navigator.wakeLock.request('screen');
            } catch (e) { }
        }

        $transitionsProvider.onSuccess({ to: C.SITE.View }, keepScreenOn);

        $transitionsProvider.onSuccess({ from: C.SITE.View }, async function () {
            if (lock) {
                await lock.release();
                lock = null;
            }
        });
    }])
    .config([function() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/chochbuech-app.js').then(() => {}, () => {});
            })
        }
    }])
    .factory('admin', ['$cookies', function($cookies) {
        const COOKIE_NAME = 'adminKey', COOKIE_OPTIONS =
            {expires: (d => { d.setFullYear(d.getFullYear() + 30); return d; })(new Date())};
        const input = angular.element(`<input type="text" value="${$cookies.get(COOKIE_NAME) ?? ''}"/>`);
        input[0].oninput = () => $cookies.put(COOKIE_NAME, input[0].value, COOKIE_OPTIONS);
        let counter = 0;
        return e => ++counter != 10 ? 0 : e.target.parentElement.append(input[0]);
    }])
    .directive('ngEnter', function () {
        return function ($scope, $elem, $attr) {
            $elem.bind('keydown keypress', function (e) {
                if (e.key == 'Enter') {
                    e.preventDefault();
                    $scope.$apply(() => $scope.$eval($attr['ngEnter']));
                }
            });
        };
    })
    .directive('scrollOnLoad', function() {
        return function($scope, $elem) {
            $elem[0].scroll(0, $elem[0].clientWidth * 0.8);
        };
    })
    .directive('giveFocus', ['$timeout', function($timeout) {
        return function($scope, $elem, $attr) {
            $scope.$watch($attr['giveFocus'], giveFocus => {
                if (giveFocus) $timeout(() =>$elem.focus());
            })
        }
    }]);
