/**
 * Created by Fabian on 27.05.2021.
 */

(function () {
    "use strict";

    angular.module('Values', [])
        .value('C', {
            SITE: {Main: 'main', Editor: 'edit', New: 'new', View: 'view'},
        })
        .value('NEW_RECIPE', { name: '', image: 'images/new.png', ingredients: '', steps: '' })
        .factory('recipeApi', ['$http', function($http) {
            function RecipeApi() {
                this.cache = new Map();
                this.listCache = null;
            }

            RecipeApi.prototype.list = async function() {
                if (!this.listCache) {
                    this.listCache = $http.get('/listRecipes').then(recipes => {
                        recipes.data.forEach(recipe =>
                            this.cache.set(recipe.id, Promise.resolve(recipe)));
                        return recipes.data.map(recipe => recipe.id);
                    });
                }
                return Promise.all((await this.listCache).map(id => this.get(id)));
            }

            RecipeApi.prototype.get = async function(id) {
                if (!this.cache.has(id)) {
                    this.cache.set(id, $http.get(`/recipe/recipe${id}`).then(({data}) => data));
                }
                return this.cache.get(id);
            }

            return new RecipeApi();
        }]);
})();
