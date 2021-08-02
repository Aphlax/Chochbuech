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
    .controller('main', controls('C', '$state', '$mdSidenav'))
    .directive('mainSite', [function() {
        return { replace: true, restrict: 'E', templateUrl: 'templates/main-site.html', };
    }])
    .config(['$stateProvider', '$locationProvider', '$urlRouterProvider', 'CProvider',
    function($stateProvider, $locationProvider, $urlRouterProvider, CProvider) {
        const C = CProvider.$get();
        $locationProvider.html5Mode({ enabled: true, rewriteLinks: false });

        $stateProvider
            .state(C.SITE.Main, {
                url: '/',
                params: { search: { type: 'string', value: '' }, category: null },
                templateUrl: 'templates/start-site.html',
                controller: controls('recipes'),
                resolve: {
                    recipes: ['$stateParams', '$recipe', function ($stateParams, $recipe) {
                        if ($stateParams.search) {
                            return $recipe.search($stateParams.search);
                        } else {
                            return $recipe.list($stateParams.category ?? C.CATEGORY.Easy);
                        }
                    }],
                }
            })
            .state(C.SITE.View, {
                url: '/r/:id',
                params: { id: { type: 'int' } },
                templateUrl: 'templates/view-site.html',
                controller: controls('recipe', 'shopRecipe'),
                resolve: {
                    recipe: ['$stateParams', '$recipe',
                        ($stateParams, $recipe) => $recipe.get(+$stateParams.id)],
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
                    recipe: ['NEW_RECIPE', NEW_RECIPE => NEW_RECIPE],
                },
            })
            .state(C.SITE.Shopping, {
                url: '/shopping-list',
                templateUrl: 'templates/shopping-site.html',
            });
        $urlRouterProvider.otherwise('/');
    }])
    .config(['$transitionsProvider', 'CProvider', function($transitionsProvider, CProvider) {
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
    .directive('ngEnter', function () {
        return function ($scope, $elem, $attr) {
            $elem.bind('keydown keypress', function (e) {
                if (e.key == 'Enter') {
                    e.preventDefault();
                    $scope.$apply(() => $scope.$eval($attr['ngEnter']));
                }
            });
        };
    });
