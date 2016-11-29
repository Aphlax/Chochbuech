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
        .directive('photoSite', function() {
            return { restrict: 'E', replace: true, templateUrl: 'templates/photo-site.html' }
        })
        .controller('photo', ['$scope', '$http', '$element', function($scope, $http, $element) {

            let video = $element.find('video')[0];
            let canvas = $element.find('canvas')[0];
            let image = $element.find('img')[0];

            $scope.images = [];
            $scope.mode = 0;

            refresh();


            $scope.take = function () {
                let context = canvas.getContext('2d');
                context.drawImage(video, 0, 0, 200, 200);
                let data = canvas.toDataURL('image/png');
                image.setAttribute('src', data);

                try {
                    $http.post('/addImage', data);
                } catch (e) {$scope.error = e.message;}
            };

            function refresh() {
                $http.get('/image-list').then(function (res) {
                    $scope.images = res.data;
                });
            }


            let options = { audio: false, video: { facingMode: { exact: "environment" } } };

            navigator.mediaDevices.getUserMedia(options)
                .then(function(stream) {
                    video.src = window.URL.createObjectURL(stream);
                    video.play();
                }).catch(e => $scope.error = e.message);
        }])
})();

