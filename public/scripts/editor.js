/**
 * Created by Fabian on 25.05.2021.
 */

"use strict";

angular.module('Editor', ['Values'])
    .controller('editor', ['$scope', '$http', '$state', '$mdToast', '$recipe', 'C', function($scope, $http, $state, $mdToast, $recipe, C) {
        $scope.saveEnabled = function(recipe) {
            return (!recipe.id || !isNaN(recipe.id)) &&
                recipe.image && recipe.name &&
                recipe.ingredients && recipe.steps && recipe.category &&
                (recipe.id || recipe.image instanceof File);
        }

        $scope.save = async function(recipe) {
            const data = new FormData();
            if (recipe.id) {
                data.append('id', recipe.id);
            }
            data.append('name', recipe.name);
            data.append('ingredients', recipe.ingredients = recipe.ingredients.replaceAll('\r\n', '\n'));
            data.append('steps', recipe.steps = recipe.steps.replaceAll('\r\n', '\n'));
            data.append('category', recipe.category);
            data.append('tags', recipe.tags.join(','));
            data.append('archived', `${!!recipe.archived}`);
            if (recipe.image instanceof File) {
                const imageData = new Blob([new Uint8Array(await recipe.image.arrayBuffer())],
                    {type: recipe.image.type});
                data.append('image', imageData, recipe.image.name)
            }
            try {
                const {data: result} =
                    await $http.post('/save', data, {headers: {'Content-Type': undefined}});
                if (!result.offline) {
                    $recipe.invalidate();
                    $state.go(C.SITE.View, result);
                }
            } catch (e) {
                $mdToast.showSimple(e.status == 403 ? 'Zugriff verweigert.' :
                    e.status == 500 ? 'Serverfehler.' : 'Etwas ging schief.');
            }
        };

        $scope.TAGS = ['Vegetarisch', 'Fisch', 'Fleisch', 'Pasta', 'Reis', 'Asiatisch'];
        $scope.searchTags = function(query) {
            query = query.toLowerCase();
            return $scope.TAGS.filter(tag => tag.toLowerCase().startsWith(query));
        }
    }])
    .directive("pictureInput", [function() {
        return {
            scope: { model: '=' },
            restrict: 'E',
            template: '<img src="">',
            replace: true,
            link: function ($scope, $elem) {
                const input =
                    angular.element('<input type="file" accept="image/*" capture="environment">');
                input.bind('change', function (event) {
                    $scope.$apply(function () {
                        if (($scope.model = event.target.files[0]))
                            $elem[0].src = URL.createObjectURL($scope.model);
                    });
                });

                $elem[0].src = $scope.model;
                $elem.bind('click', function() { input[0].click(); });
            },
        };
    }])
    .directive('autoHeight', ['$timeout', function($timeout) {
        return function ($scope, $elem) {
            $timeout(() =>
                $elem.css('height', $elem[0].scrollHeight + 'px').css('overflow-y', 'hidden'));
            $elem[0].oninput = () =>
                $elem.css('height', 'auto').css('height', $elem[0].scrollHeight + 'px');
        }
    }]);
