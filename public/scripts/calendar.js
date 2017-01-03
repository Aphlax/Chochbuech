/**
 * Created by Fabian on 02.01.2017.
 */


(function () {
    "use strict";

    angular.module('Chochbuech')
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

            $scope.onItemClick = function(item) {
                if (item.recipe) {
                    $scope.navigate(C.SITE.RecipeInfo, item.recipe.id);
                } else {
                    $scope.navigate(C.SITE.RecipeList, C.RecipeList.MODE.select);
                }
            };

            $http.get('/calendar', { params: { "start": $scope.calendarStart, "end": $scope.calendarEnd } })
                .then(function(res) {
                    $scope.setupCalendar(res.data);
                });

        }])
})();
