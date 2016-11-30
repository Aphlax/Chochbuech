/**
 * Created by Fabian on 28.11.2016.
 */

(function () {
    "use strict";

    const REQ = [
        'ngAnimate',
        'ngCookies',
        'PhotoCapture'
    ];

    angular.module('Chochbuech', REQ)
        .directive('photoSite', function() {
            return { restrict: 'E', replace: true, templateUrl: 'templates/photo-site.html' }
        })
        .controller('photo', ['$scope', '$http', '$element', function($scope, $http, $element) {
            let image = $element.find('img');

            $scope.images = [];
            $scope.mode = 0;
            $scope.error = '';
            navigator.mediaDevices.enumerateDevices()
                .then(function(devices) {
                    $scope.error = devices.filter(d => d.kind == 'videoinput').map(d => d.label).join(' & ');
                }).catch(e => $scope.error = e.message);

            refresh();

            $scope.$on('photo', function (e, img) {
                image.css({ width: img.width+'px', height: img.height+'px' });
                image.attr('src', img.photo);
                $http.post('/addImage', img.photo);
            });

            function refresh() {
                $http.get('/image-list').then(function (res) {
                    $scope.images = res.data;
                });
            }
        }])
})();

