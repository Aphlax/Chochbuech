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
        .value('NEW_RECIPE',
            { name: '', image: 'images/take-picture.png', ingredients: '', steps: '', tags: [] })
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
        .factory('recipeDisplay', ['parseConnectedString', function(parseConnectedString) {
            return function (recipe) {
                const ingredientGroups = recipe.ingredients.split('-- ').map((g, i) => g ? ({
                    name: i ? g.substring(0, g.indexOf('\n')) : '',
                    items: g.split('\n').filter((item, j) => item && (!i || j)),
                }) : undefined).filter(g => g);

                const prepText = 'Vorbereitung: ';
                const prepIndex = recipe.steps.startsWith(prepText) ? recipe.steps.indexOf('\n') : 0;
                let noteIndex = recipe.steps.indexOf('\n\n');
                if (noteIndex == -1) noteIndex = recipe.steps.length;
                return {
                    ingredientGroups,
                    preparation: prepIndex ? recipe.steps.substring(prepText.length, prepIndex) : '',
                    steps: recipe.steps.substring(prepIndex, noteIndex).split('\n').filter(i => i),
                    notes: parseConnectedString(recipe.steps.substring(noteIndex + 2)),
                }
            };
        }])
        .value('parseConnectedString', function(value) {
            let regex = /([^[]+)(?:\[([^\]]+)]\(([^)]*)\))?/g, match, result = [];
            while (match = regex.exec(value)) {
                result.push({type: 0, value: match[1]});
                if (match[2]) result.push({type: 1, value: match[2], href: match[3]});
            }
            return result;
        })
        .directive('connectedString', [function() {
            return {
                restrict: 'E',
                replace: false,
                scope: { value: '=' },
                template:
                    '<span ng-repeat-start="it in value" ng-if="it.type == 0">{{it.value}}</span>' +
                    '<a ng-repeat-end ng-if="it.type == 1" href="{{it.href}}">{{it.value}}</a>',
            };
        }])
        .factory('properties', ['$http', function($http) {
            const properties = { canEdit: false };
            $http.get('/properties').then(({status, data}) => {
                if (status == 200) angular.copy(data, properties);
            });
            return properties;
        }])
        .factory('shareRecipeUrl', ['$mdToast', function($mdToast) {
            return async function(recipe) {
                if ('share' in navigator) {
                    await navigator.share({ title: 'Chochbuech', text: recipe?.name, url: window.location });
                } else if ('clipboard' in navigator) {
                    await navigator.clipboard.writeText(
                        `${window.location}#${recipe?.name?.replaceAll(' ', '-')}`);
                    $mdToast.showSimple('Link kopiert!');
                }
            }
        }]);
})();
