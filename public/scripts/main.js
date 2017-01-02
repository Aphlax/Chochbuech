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
            SITES: { RecipeList: 'recipe-list', RecipeInfo: 'recipe-info', Calendar: 'calendar' }
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
                .when('/recipe-list', {
                    templateUrl: 'templates/recipe-list.html',
                    controller: 'recipeListController'
                })
                .when('/recipe-info/:recipeId', {
                    templateUrl: 'templates/recipe-info.html',
                    controller: 'recipeInfoController'
                });
            $locationProvider.html5Mode(false);
        }])
        .controller('main', ['$scope', '$http', 'C', function($scope, $http, C) {
            $scope.C = C;

            $scope.recipes = [{ name: 'Spaghetti', tags: [], imageId: '99A9', last: new Date() }];
        }])
        .controller('calendarController', ['$scope', '$http', 'C', '$timeout', function($scope, $http, C, $timeout) {
            $scope.calendarStart = -6;
            $scope.calendarEnd = 14;
            $scope.calendar = [];
            $scope.setup = true;

            $scope.setupCalendar = function(data) {
                $scope.calendar = [];

                function date(day) {
                    let date = new Date();
                    date.setDate(date.getDate() + (day || 0));
                    date.setHours(0, 0, 0, 0);
                    return date;
                }

                for(let i = $scope.calendarStart; i <= $scope.calendarEnd; i++) {
                    let day = { date: date(i) };
                    let dataDay = data.find(item => new Date(item.date).valueOf() == day.date.valueOf());
                    if (dataDay)
                        $scope.calendar.push(dataDay);
                    else
                        $scope.calendar.push(day);
                }

                if ($scope.setup)
                    $timeout(function() {
                        let site = $('.calendar-site .site');
                        let item = site.find('.item.today');
                        site.scrollTop(item.offset().top - site.offset().top + site.scrollTop());
                    }, 0, false);
                $scope.setup = false;
            };

            $http.get('/calendar', { params: { "start": $scope.calendarStart, "end": $scope.calendarEnd } })
                .then(function(res) {
                    $scope.setupCalendar(res.data);
                });

        }])
        .controller('recipeListController', ['$scope', '$http', 'C', function($scope, $http, C) { }])
        .controller('recipeInfoController', ['$scope', '$http', 'C', function($scope, $http, C) {
            $scope.recipe = { name: 'Spaghetti', tags: [], imageURL: 'e', last: new Date() };
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

