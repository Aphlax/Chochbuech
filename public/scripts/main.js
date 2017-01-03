/**
 * Created by Fabian on 28.11.2016.
 */

(function () {
    "use strict";

    const REQ = [
        'ngRoute',
        'ngAnimate',
        'ngCookies',
        'ngMaterial',
        'PhotoCapture'
    ];

    angular.module('Chochbuech', REQ)
        .value('C', {
            SITE: { RecipeList: 'recipe-list', RecipeInfo: 'recipe-info', Calendar: 'calendar' },
            RecipeList: { MODE: { none: undefined, select: 'select' } }
        })
        .directive('photoSite', function() {
            return { restrict: 'E', replace: true, templateUrl: 'templates/photo-site.html' }
        })
        .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
            $routeProvider
                //.when('/calendar', {
                .otherwise({
                    templateUrl: 'templates/calendar.html',
                    controller: 'calendarController'
                })
                .when('/recipe-list/:mode?', {
                    templateUrl: 'templates/recipe-list.html',
                    controller: 'recipeListController'
                })
                .when('/recipe-info/:id?', {
                    templateUrl: 'templates/recipe-info.html',
                    controller: 'recipeInfoController'
                });
            $locationProvider.html5Mode(true);
        }])
        .controller('main', ['$scope', '$http', 'C', '$location', function($scope, $http, C, $location) {
            $scope.C = C;

            $scope.navigate = function(target, param) {
                $location.url(target + (param !== undefined ? '/' + param : ''));
            };

            $scope.recipes = [{ name: 'Spaghetti', tags: [], imageId: 'A', last: new Date() }];

            $http.get('/recipes').then(function(res) {
                $scope.recipes = res.data;
            });
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
        }]);
})();

