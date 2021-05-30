/**
 * Created by Fabian on 28.11.2016.
 */

(function () {
    "use strict";

    const REQ = [
        'ui.router',
        'ngMaterial',
        'Editor',
        'Values',
    ];

    angular.module('Chochbuech', REQ)
        .controller('main', (names => ['$scope', ...names, function ($scope, ...values) {
            names.forEach((name, i) => $scope[name] = values[i]);
        }])(['C']))
        .config(['$stateProvider', '$locationProvider', '$urlRouterProvider', 'CProvider',
        function($stateProvider, $locationProvider, $urlRouterProvider, CProvider) {
            const C = CProvider.$get();
            $locationProvider.html5Mode({ enabled: true, rewriteLinks: false });

            $stateProvider
                .state(C.SITE.Main, {
                    url: '/',
                    templateUrl: 'templates/start-site.html',
                })
                .state(C.SITE.Editor, {
                    url: '/edit/:id',
                    templateUrl: 'templates/editor-site.html',
                    controller: 'editor',
                    resolve: {
                        recipe: ['$stateParams', 'recipeCache',
                            ($stateParams, recipeCache) => recipeCache.get(+$stateParams.id)],
                    },
                })
                .state(C.SITE.Create, {
                    url: '/new',
                    templateUrl: 'templates/editor-site.html',
                    controller: 'editor',
                    resolve: {
                        recipe: ['NEW_RECIPE', NEW_RECIPE => NEW_RECIPE],
                    },
                });
            $urlRouterProvider.otherwise('/');
        }]);
})();

