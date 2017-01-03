/**
 * Created by Fabian on 03.01.2017.
 */


(function () {
    "use strict";

    angular.module('Chochbuech')
        .controller('recipeInfoController', ['$scope', '$http', 'C', '$routeParams', function($scope, $http, C, $routeParams) {
            let id = $routeParams.id || 0;
            $scope.recipe = $scope.recipes.find(r => r.id == id) || { tags: [] };


        }])
})();