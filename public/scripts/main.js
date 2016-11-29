/**
 * Created by Fabian on 28.11.2016.
 */

(function () {
    "use strict";

    const REQ = [
        'ngAnimate',
        'ngCookies'
    ];

    angular.module('Chochbuech', REQ)
        .directive('main-site', function() {
            return {restrict: 'E', replace: true, templateUrl: 'templates/main-site.html'}
        })
        .controller('main', ['$scope', '$http', function($scope, $http) {

            $scope.images = [];

            $http.get('/image-list', function(res, data) {
                $scope.images = data;
            });









            navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: "environment" } })
                .then(function(stream) {

                }).catch(e => console.log(e));
        }])
})();

