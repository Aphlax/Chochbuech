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
        }])(['C', 'Recipe']))
        .config(['$stateProvider', '$locationProvider', 'CProvider', function($stateProvider, $locationProvider, CProvider) {
            const C = CProvider.$get();
            $locationProvider.html5Mode({ enabled: true, rewriteLinks: false });

            $stateProvider
                .state(C.SITE.Main, {
                    url: '/',
                    templateUrl: 'templates/editor-site.html',
                    controller: 'editor'
                });
        }]);
})();

