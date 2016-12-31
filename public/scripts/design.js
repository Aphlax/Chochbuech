/**
 * Created by Fabian on 31.12.2016.
 */


(function () {
    "use strict";

    angular.module('Chochbuech')
        .filter('datify', ['dateFilter', function(dateFilter) {
            return function(date) {
                date = new Date(date);
                let now = new Date();
                now.setHours(0, 0, 0, 0);
                let diff = Math.round((date - now) / (1000 * 60 * 60 * 24));
                switch (diff) {
                    case -1: return 'Yesterday';
                    case 0: return 'Today';
                    case 1: return 'Tomorrow';
                }
                if (date.getFullYear() == now.getFullYear())
                    return dateFilter(date, "d. MMM");
                else
                    return dateFilter(date, "d. MMM yyyy");
            }
        }])
        .filter('isSaturday', [function() {
            return date => new Date(date).getDay() == 6;
        }])
        .filter('isSunday', [function() {
            return date => new Date(date).getDay() == 0;
        }])
        .filter('isToday', [function() {
            return date => {
                let now = new Date();
                now.setHours(0, 0, 0, 0);
                return !Math.round((new Date(date) - now) / (1000 * 60 * 60 * 24));
            };
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