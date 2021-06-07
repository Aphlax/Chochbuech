/**
 * Created by Fabian on 25.05.2021.
 */

"use strict";

angular.module('Editor', ['Values'])
    .controller('editor', ['$scope', '$http', '$state', 'C', function($scope, $http, $state, C) {
        $scope.saveEnabled = function(recipe) {
            return (!recipe.id || !isNaN(recipe.id)) &&
                recipe.image && recipe.name &&
                recipe.ingredients && recipe.steps &&
                (recipe.id || recipe.image instanceof File);
        }

        $scope.save = async function(recipe) {
            const data = new FormData();
            if (recipe.id) {
                data.append('id', recipe.id);
            }
            data.append('name', recipe.name);
            data.append('ingredients', recipe.ingredients);
            data.append('steps', recipe.steps);
            if (recipe.image instanceof File) {
                const imageData = new Blob([new Uint8Array(await recipe.image.arrayBuffer())],
                    {type: recipe.image.type});
                data.append('image', imageData, recipe.image.name)
            }
            const { data: result } =
                await $http.post('/save', data, { headers: { 'Content-Type': undefined } });
            $state.go(C.SITE.View, result);
        };
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
                        $scope.model = event.target.files[0];
                        $elem[0].src = $scope.model ? URL.createObjectURL($scope.model) : '';
                    });
                });

                $elem[0].src = $scope.model;
                $elem.bind('click', function() { input[0].click(); });
            },
        };
    }]);