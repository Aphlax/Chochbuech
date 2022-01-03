/**
 * Created by Fabian on 27.05.2021.
 */

(function () {
    "use strict";

    angular.module('Values', ['ngMaterial'])
        .value('C', {
            SITE: {
                Main: 'main', Editor: 'edit', New: 'new', All: 'all', View: 'view',
                Shopping: 'shop', Search: 'search',
            },
            CATEGORY: {Easy: 'easy', Hard: 'hard', Dessert: 'dessert', Starter: 'starter'},
            EVENTS: {
                SHOPPING_CART_CLICK: 'shop_add',
                SHOP_REMOVE_DONE: 'shop_done',
                SHOP_REMOVE_ALL: 'shop_empty',
            },
        })
        .value('NEW_RECIPE', { name: '', image: 'images/take-picture.png', ingredients: '', steps: '' })
        .factory('$recipe', ['$http', function($http) {
            function RecipeService() {
                this.cache = new Map();
                this.listCache = {};
            }

            RecipeService.prototype.list = async function(category) {
                if (!this.listCache[category]) {
                    this.listCache[category] = $http.get('/listRecipes', {params: {category}})
                        .then(response => {
                            if (response.status != 200 || response.data.offline) return [];
                            response.data.forEach(recipe =>
                                this.cache.set(recipe.id, Promise.resolve(recipe)));
                            return response.data.map(recipe => recipe.id);
                        });
                }
                return Promise.all((await this.listCache[category]).map(id => this.get(id)));
            }

            RecipeService.prototype.search = async function(search) {
                return $http.get('/look', {params: {for: search}})
                    .then(response => {
                        if (response.status != 200 || response.data.offline) return [];
                        response.data.forEach(recipe =>
                            this.cache.set(recipe.id, Promise.resolve(recipe)));
                        return response.data;
                    });
            }

            RecipeService.prototype.get = async function(id) {
                if (!this.cache.has(id)) {
                    this.cache.set(id, $http.get(`/recipe/recipe${id}`)
                        .then(({status, data}) => status == 200 && !data.offline ? data : null));
                }
                return this.cache.get(id);
            }

            RecipeService.prototype.invalidate = function() {
                this.listCache = {};
            }

            return new RecipeService();
        }])
        .value('recipeDisplay', function(recipe) {
            const prepText = 'Vorbereitung: ';
            const prepIndex = recipe.steps.startsWith(prepText) ? recipe.steps.indexOf('\n') : 0;
            let noteIndex = recipe.steps.indexOf('\n\n');
            if (noteIndex == -1) noteIndex = recipe.steps.length;
            return {
                ingredients: recipe.ingredients.split('\n').filter(i => i),
                preparation: prepIndex ? recipe.steps.substring(prepText.length, prepIndex) : '',
                steps: recipe.steps.substring(prepIndex, noteIndex).split('\n').filter(i => i),
                notes: recipe.steps.substring(noteIndex + 2),
            }
        })
        .factory('properties', ['$http', function($http) {
            const properties = { canEdit: false, client: '' };
            $http.get('/properties').then(({status, data}) => {
                if (status == 200) angular.copy(data, properties);
            });
            return properties;
        }])
        .factory('copyUrl', ['$mdToast', function($mdToast) {
            return function() {
                if (!('clipboard' in navigator)) return;
                navigator.clipboard.writeText(window.location);
                $mdToast.showSimple('Link kopiert!');
            }
        }]);
})();
