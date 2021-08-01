/**
 * Created by Fabian on 27.05.2021.
 */

(function () {
    "use strict";

    angular.module('Values', [])
        .value('C', {
            SITE: {Main: 'main', Editor: 'edit', New: 'new', View: 'view', Shopping: 'shop'},
            CATEGORY: {Easy: 'easy', Hard: 'hard', Dessert: 'dessert'},
            EVENTS: {SHOPPING_CART_CLICK: 'shop'},
        })
        .value('NEW_RECIPE', { name: '', image: 'images/new.png', ingredients: '', steps: '' })
        .factory('$recipe', ['$http', function($http) {
            function RecipeService() {
                this.cache = new Map();
                this.listCache = {};
            }

            RecipeService.prototype.list = async function(category) {
                if (!this.listCache[category]) {
                    this.listCache[category] = $http.get('/listRecipes', {params: {category}})
                        .then(recipes => {
                            recipes.data.forEach(recipe =>
                                this.cache.set(recipe.id, Promise.resolve(recipe)));
                            return recipes.data.map(recipe => recipe.id);
                        });
                }
                return Promise.all((await this.listCache[category]).map(id => this.get(id)));
            }

            RecipeService.prototype.search = async function(search) {
                return $http.get('/searchRecipes', {params: {search}})
                    .then(recipes => {
                        recipes.data.forEach(recipe =>
                            this.cache.set(recipe.id, Promise.resolve(recipe)));
                        return recipes.data;
                    });
            }

            RecipeService.prototype.get = async function(id) {
                if (!this.cache.has(id)) {
                    this.cache.set(id, $http.get(`/recipe/recipe${id}`).then(({data}) => data));
                }
                return this.cache.get(id);
            }

            return new RecipeService();
        }]);
})();
