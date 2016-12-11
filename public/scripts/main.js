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

            refresh();

            $scope.$on('photo', function (e, img) {
                image.css({ width: img.width+'px', height: img.height+'px' });
                image.attr('src', img.photo);
                $scope.error = img.photo.length;

                try{
                    let data = new FormData();
                    data.append('file', img.photo.substring('data:image/png;base64,'.length));
                    $http.post('/addImage', data, {
                        transformRequest: angular.identity,
                        header:{'Content-Type': undefined},
                        enctype:'multipart/form-data'
                    });
                } catch(e) {$scope.error = e.message;}

                // $http.post('/addImage', { data: img.photo});
            });

            function refresh() {
                $http.get('/image-list').then(function (res) {
                    $scope.images = res.data;
                });
            }
        }])
})();

