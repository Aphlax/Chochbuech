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
                const shoppingList = ($cookies.get(COOKIE_NAME) ?? '') +
                    recipe.ingredients.split('\n').filter(i => i)
                        .map(i => `${i} (${recipe.name})\n`).join('');
                $cookies.put(COOKIE_NAME, shoppingList, COOKIE_OPTIONS);
                $state.go(C.SITE.Shopping);
            };
        };
    }])
    .controller('shopping', ['$scope', '$element', '$cookies', '$timeout', 'C', function($scope, $element, $cookies, $timeout, C) {
        const COOKIE_NAME = 'shopping-list';
        const COOKIE_OPTIONS = {expires: (d => { d.setDate(d.getDate() + 30); return d; })(new Date())};
        const ITEM_REGEX = /(.+)\((.+)\)/;

        $scope.list = ($cookies.get(COOKIE_NAME) ?? '').split('\n').filter(i => i).map(createItem);

        $scope.onOrderChanged = function(order) {
            if (order.length != $scope.list.length) return;
            const orderedList = order.map(i => $scope.list[i].proto + '\n');
            $cookies.put(COOKIE_NAME, orderedList.join(''), COOKIE_OPTIONS);
        };

        $scope.showNewItem = false;
        $scope.newItemLabel = '';
        $scope.openNewItem = function() {
            $scope.showNewItem = true;
            $timeout(() => $element.find('input').focus());
        };
        $scope.addNewItem = function() {
            if (!$scope.newItemLabel) return;
            $scope.list.push(createItem($scope.newItemLabel));
            $scope.newItemLabel = '';
        };

        $scope.$on(C.EVENTS.SHOP_REMOVE_ALL, () => $scope.list = []);
        $scope.$on(C.EVENTS.SHOP_REMOVE_DONE,
            () => $scope.list = $scope.list.filter(i => !i.selected));

        function createItem(proto) {
            const match = proto.match(ITEM_REGEX);
            if (match) {
                return { label: match[1], origin: match[2], selected: false, proto };
            } else {
                return { label: proto, origin: '', selected: false, proto };
            }
        }
    }])
    .directive('sortableList', function() {
        const HEIGHT = 48;
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
                    item.$on('$destroy', () => this.unregister(item));
                    item.index = item.initialIndex = $scope.items.length;
                    item.offset = $scope.items.length * HEIGHT;
                    $scope.items.push(item);
                    $element.css('height', ($scope.items.length * HEIGHT + 1) + 'px');
                    if ($scope.orderChanged)
                        $scope.orderChanged({order: $scope.items.map(item => item.initialIndex)});
                    return $scope;
                };

                this.unregister = function(item) {
                    for (let i = item.index; i < $scope.items.length - 1; i++) {
                        $scope.items[i] = $scope.items[i + 1];
                        $scope.items[i].index = i;
                        $scope.items[i].offset = i * HEIGHT;
                    }
                    $scope.items.pop();
                    $element.css('height', ($scope.items.length * HEIGHT + 1) + 'px');
                    for (const other of $scope.items) {
                        if (other.initialIndex > item.initialIndex) {
                            other.initialIndex--;
                        }
                    }
                    if ($scope.orderChanged)
                        $scope.orderChanged({order: $scope.items.map(item => item.initialIndex)});
                }

                /** First is currently being dragged to the position of second. */
                this.swap = function(first, second) {
                    const secondItem = $scope.items[second];
                    $scope.items[second] = $scope.items[first];
                    $scope.items[first] = secondItem;
                    secondItem.index = first;
                    secondItem.offset = first * HEIGHT;
                    if ($scope.orderChanged)
                        $scope.orderChanged({order: $scope.items.map(item => item.initialIndex)});
                };
            }],
            template: '<div class="sortable-list" ng-transclude></div>',
        };
    })
    .directive('sortableListItem', ['$document', function($document) {
        const HEIGHT = 48;
        return {
            require: '^^sortableList',
            restrict: 'E',
            replace: true,
            transclude: true,
            scope: {},
            link: function($scope, $elem, $attr, sortableList) {
                const list = sortableList.register($scope);
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
                        const maxOffset = (list.items.length - 1) * HEIGHT;
                        $scope.offset = Math.max(Math.min(getPageY(e) - startY, maxOffset), 0);
                        $scope.index = Math.round($scope.offset / HEIGHT);
                    });
                }

                function mouseup() {
                    $scope.$apply(() => $scope.offset = HEIGHT * $scope.index);
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