/**
 * Created by Fabian on 31.07.2021.
 */

"use strict";

angular.module('Shopping', ['Values', 'ngCookies'])
    .factory('shopRecipe', ['$cookies', '$state', 'C', function($cookies, $state, C) {
        const COOKIE_NAME = 'shopping-list';
        const COOKIE_OPTIONS = {expires: (d => { d.setDate(d.getDate() + 30); return d; })(new Date())};

        return function shopRecipe(recipe) {
            return () => {
                const shoppingList = ($cookies.get(COOKIE_NAME) ?? '') + recipe.ingredients;
                $cookies.put(COOKIE_NAME, shoppingList, COOKIE_OPTIONS);
                $state.go(C.SITE.Shopping);
            };
        };
    }])
    .controller('shopping', ['$scope', '$cookies', function($scope, $cookies) {
        const COOKIE_NAME = 'shopping-list';
        const COOKIE_OPTIONS = {expires: (d => { d.setDate(d.getDate() + 30); return d; })(new Date())};

        $scope.list = ($cookies.get(COOKIE_NAME) ?? '').split('\n').filter(i => i);
    }])
    .directive('sortableList', function() {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            scope: {},
            controller: ['$scope', '$element', function SortableListController($scope, $element) {
                this.items = [];

                this.register = function(item) {
                    this.items.push(item);
                }
            }],
            template: '<div class="sortable-list" layout="column" ng-transclude></div>',
        };
    })
    .directive('sortableListItem', function() {
        return {
            requires: '^^sortableList',
            restrict: 'E',
            replace: true,
            transclude: true,
            scope: {},
            link: function($scope, $elem, $attr, sortableList) {
                //sortableList.register($scope);
            },
            template: '<div class="sortable-list-item" layout="row">' +
                '   <div class="material-icons drag-icon">drag_indicator</div>' +
                '   <ng-transclude flex layout="row"></ng-transclude>' +
                '</div>',
        };
    });