/**
 * Created by Fabian on 31.12.2016.
 */


(function () {
    "use strict";

    angular.module('Chochbuech')
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
        .filter('isSaturday', [function() {
            return date => date.getDay() == 6;
        }])
        .filter('isSunday', [function() {
            return date => date.getDay() == 0;
        }])
        .filter('isToday', [function() {
            return date => !Math.round((date - new Date()) / (1000 * 60 * 60 * 24));
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