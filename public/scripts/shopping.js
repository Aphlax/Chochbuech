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

        $scope.onOrderChanged = function(order) {
            let orderedList = order.map(i => $scope.list[i]);
            $cookies.put(COOKIE_NAME, orderedList.join('\n') + '\n', COOKIE_OPTIONS);
        }
    }])
    .directive('sortableList', function() {
        const HEIGHT = 36;
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            scope: {
                orderChanged: '&?'
            },
            controller: ['$scope', '$element', function SortableListController($scope, $element) {
                $scope.items = [];

                this.register = function(item) {
                    item.index = item.initialIndex = $scope.items.length;
                    item.offset = $scope.items.length * HEIGHT;
                    $scope.items.push(item);
                    $element.css('height', ($scope.items.length * HEIGHT + 1) + 'px');
                    return $scope;
                }

                /** First is currently being dragged to the position of second. */
                this.swap = function(first, second) {
                    let secondItem = $scope.items[second];
                    $scope.items[second] = $scope.items[first];
                    $scope.items[first] = secondItem;
                    secondItem.index = first;
                    secondItem.offset = first * HEIGHT;
                    if ($scope.orderChanged)
                        $scope.orderChanged({order: $scope.items.map(item => item.initialIndex)});
                }
            }],
            template: '<div class="sortable-list" ng-transclude></div>',
        };
    })
    .directive('sortableListItem', ['$document', function($document) {
        const HEIGHT = 36;
        return {
            require: '^^sortableList',
            restrict: 'E',
            replace: true,
            transclude: true,
            scope: {},
            link: function($scope, $elem, $attr, sortableList) {
                let list = sortableList.register($scope);
                let startY = 0;
                $scope.$watch('offset', offset => $elem.css('top', (offset ?? 0) + 'px'));
                $scope.$watch('index', (newIndex, oldIndex) => {
                    if ($elem.hasClass('dragging')) sortableList.swap(oldIndex, newIndex);
                });

                $scope.startDrag = function(e) {
                    e.preventDefault();
                    startY = getPageY(e) - $scope.offset;
                    $elem.addClass('dragging');
                    $document.on('touchmove mousemove', mousemove);
                    $document.on('touchend touchcancel mouseup', mouseup);
                };

                function mousemove(e) {
                    $scope.$apply(() => {
                        let maxOffset = (list.items.length - 1) * HEIGHT;
                        $scope.offset = Math.max(Math.min(getPageY(e) - startY, maxOffset), 0);
                        $scope.index = Math.round($scope.offset / HEIGHT);
                    });
                }

                function mouseup() {
                    $scope.$apply(() =>
                        $scope.offset = HEIGHT * Math.round($scope.offset / HEIGHT));
                    $elem.removeClass('dragging');
                    $document.off('touchmove mousemove', mousemove);
                    $document.off('touchend touchcancel mouseup', mouseup);
                }

                function getPageY(e) {
                    return e instanceof TouchEvent ? e.touches[0].pageY : e.pageY;
                }
            },
            template: '<div class="sortable-list-item" layout="row">' +
                '   <div class="material-icons drag-icon" ng-on-touchstart="startDrag($event)"' +
                '        ng-mousedown="startDrag($event)">' +
                '       drag_indicator' +
                '   </div>' +
                '   <ng-transclude flex layout="row"></ng-transclude>' +
                '</div>',
        };
    }]);