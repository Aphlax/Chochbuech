/**
 * Created by Fabian on 25.05.2021.
 */

"use strict";

angular.module('Editor', [])
    .controller('editor', function($scope) {
        $scope.image = null;
        $scope.imagePreview = null;
        $scope.debug = "";

        $scope.$watch('image', function() {
            $scope.imagePreview = $scope.image ? URL.createObjectURL($scope.image) : '';
        });

        $scope.save = async function() {
            if (!$scope.image) {
                return;
            }

            const data = new FormData();

            const imageData = new Blob([new Uint8Array(await $scope.image.arrayBuffer())],
                { type: $scope.image.type });
            data.append('image', imageData, $scope.image.name)
            await fetch('/save', { method: 'POST', body: data });
        };



    })
    .directive("fileModel", [function () {
        return {
            scope: {
                fileModel: "="
            },
            link: function (scope, element) {
                element.bind("change", function (event) {
                    scope.$apply(function () {
                        scope.fileModel = event.target.files[0];
                    });
                });
            }
        }
    }]);