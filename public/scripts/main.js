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
                    templateUrl: 'templates/start-site.html',
                    controller: controls('recipes'),
                    resolve: {
                        recipes: ['recipeApi', recipeApi => recipeApi.list()],
                    }
                })
                .state(C.SITE.View, {
                    url: '/r/:id',
                    templateUrl: 'templates/view-site.html',
                    controller: controls('recipe'),
                    resolve: {
                        recipe: ['$stateParams', 'recipeApi',
                            ($stateParams, recipeApi) => recipeApi.get(+$stateParams.id)],
                    },
                })
                .state(C.SITE.Editor, {
                    url: '/edit/:id',
                    templateUrl: 'templates/editor-site.html',
                    controller: controls('recipe'),
                    resolve: {
                        recipe: ['$stateParams', 'recipeApi',
                            ($stateParams, recipeApi) => recipeApi.get(+$stateParams.id)],
                    },
                })
                .state(C.SITE.Create, {
                    url: '/new',
                    templateUrl: 'templates/editor-site.html',
                    controller: controls('recipe'),
                    resolve: {
                        recipe: ['NEW_RECIPE', NEW_RECIPE => NEW_RECIPE],
                    },
                });
            $urlRouterProvider.otherwise('/');
        }]);
})();

