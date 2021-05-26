/**
 * Created by Fabian on 25.05.2021.
 */

"use strict";

angular.module('Editor', [])
    .controller('editor', function($scope) {
        $scope.recipe = { name: '', image: 'images/recipe1.jpg', ingredients: '', steps: '' };

        $scope.save = async function() {
            if (!$scope.recipe.image || !$scope.recipe.name || !$scope.recipe.ingredients ||
                !$scope.recipe.steps) { return; }

            const data = new FormData();
            data.append('name', $scope.recipe.name);
            data.append('ingredients', $scope.recipe.ingredients);
            data.append('steps', $scope.recipe.steps);
            const imageData = new Blob([new Uint8Array(await $scope.recipe.image.arrayBuffer())],
                { type: $scope.recipe.image.type });
            data.append('image', imageData, $scope.recipe.image.name)
            await fetch('/save', { method: 'POST', body: data });
        };
    })
    .directive("pictureInput", [function() {
        return {
            scope: { model: '=' },
            restrict: 'E',
            template: '<img src="">',
            replace: true,
            link: function ($scope, $elem) {
                const input =
                    angular.element('<input type="file" accept="image/*" capture="environment">');
                input.bind("change", function (event) {
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