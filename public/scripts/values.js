/**
 * Created by Fabian on 27.05.2021.
 */

(function () {
    "use strict";

    angular.module('Values', [])
        .value('C', {
            SITE: {Main: 'main', Editor: 'edit', Create: 'new'},
        })
        .value('NEW_RECIPE', { name: '', image: 'images/new.png', ingredients: '', steps: '' })
        .factory('recipeCache', ['$http', function($http) {
            function RecipeCache() {
                this.cache = new Map();
            }

            RecipeCache.prototype.get = async function(id) {
                if (!this.cache.has(id)) {
                    this.cache.set(id, $http.get(`/recipe/${id}`));
                }
                return this.cache.get(id);
            }

            return new RecipeCache();
        }]);
})();
