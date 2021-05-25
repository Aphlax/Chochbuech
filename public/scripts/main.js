/**
 * Created by Fabian on 28.11.2016.
 */

(function () {
    "use strict";

    const REQ = [
        'ui.router',
        'ngAnimate',
        'ngMaterial',
        'Editor',
        'PhotoCapture',
    ];

    angular.module('Chochbuech', REQ)
        .value('C', {
            SITE: { Main: 'main', Editor: 'edit' },
        })
        .config(['$stateProvider', '$locationProvider', 'CProvider', function($stateProvider, $locationProvider, CProvider) {
            const C = CProvider.$get();
            $locationProvider.html5Mode({ enabled: true, rewriteLinks: false });

            $stateProvider
                .state(C.SITE.Main, {
                    url: '/',
                    templateUrl: 'templates/editor-site.html',
                    controller: 'editor'
                });
        }])
        .directive('backImg', function(){
            return function(scope, element, attrs){
                attrs.$observe('backImg', function(value) {
                    element.css({
                        'background-image': 'url(' + value +')'
                    });
                });
            };
        });
})();

