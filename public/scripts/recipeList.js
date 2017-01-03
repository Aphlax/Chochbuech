/**
 * Created by Fabian on 03.01.2017.
 */


(function () {
    "use strict";

    angular.module('Chochbuech')
        .controller('recipeListController', ['$scope', '$http', 'C', '$routeParams', function($scope, $http, C, $routeParams) {

            $scope.onRecipeClick = function(recipe) {
                if ($routeParams.mode == C.RecipeList.MODE.select) {
                    $http.get('/plan', { date: 0, recipe: recipe }).then(function(res) {
                    });
                    $scope.navigate(C.SITE.Calendar);
                } else {
                    $scope.navigate(C.SITE.RecipeInfo, recipe.info);
                }
            }
        }])
})();
