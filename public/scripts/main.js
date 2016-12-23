/**
 * Created by Fabian on 28.11.2016.
 */

(function () {
    "use strict";

    const REQ = [
        'ngAnimate',
        'ngCookies',
        'ngMaterial',
        'PhotoCapture'
    ];

    angular.module('Chochbuech', REQ)
        .directive('photoSite', function() {
            return { restrict: 'E', replace: true, templateUrl: 'templates/photo-site.html' }
        })
        .directive('app', function() {
            return { restrict: 'E', replace: true, templateUrl: 'templates/app.html' }
        })
        .value('C', {
            SITES: { RecipeList: 'recipe-list', RecipeInfo: 'recipe-info', Calendar: 'calendar' }
        })
        .controller('main', ['$scope', '$http', 'C', function($scope, $http, C) {
            $scope.C = C;
            $scope.site = C.SITES.Calendar;

            $scope.calendar = [{
                date: new Date(),
                recipe: { name: 'Spaghetti', tags: [], imageURL: '' }
            }];

            $scope.recipe = { name: 'Spaghetti', tags: [], imageURL: '', last: new Date() };

            //ngRoute

        }])
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
        .filter('datify', ['dateFilter', function(dateFilter) {
            return function(date) {
                let diff = Math.round((date - new Date()) / (1000 * 60 * 60 * 24));
                switch (diff) {
                    case -1: return 'Yesterday';
                    case 0: return 'Today';
                    case 1: return 'Tomorrow';
                    default: return dateFilter(date, "d.M.yy");
                }
            }
        }])
        .directive('backImg', function(){
            return function(scope, element, attrs){
                attrs.$observe('backImg', function(value) {
                    element.css({
                        'background-image': 'url(' + value +')',
                        'background-size' : 'cover'
                    });
                });
            };
        });
})();

