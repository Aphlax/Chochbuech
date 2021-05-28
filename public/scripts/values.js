/**
 * Created by Fabian on 27.05.2021.
 */

(function () {
    "use strict";

    angular.module('Values', [])
        .value('C', {
            SITE: {Main: 'main', Editor: 'edit'},
        })
        .value('Recipe', {
            isValid: function (recipe) {
                return (!recipe.id || !isNaN(recipe.id)) && recipe.image && recipe.name &&
                    recipe.ingredients && recipe.steps;
            }
        });
})();