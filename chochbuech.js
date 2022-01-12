
"use strict";

const { unassign } = require('./utils');

module.exports = { listRecipes, searchRecipes, saveRecipe, validSaveRecipeRequest };

async function listRecipes(db, category) {
    if (category == 'all') {
        return await db.collection('recipes').aggregate([
            {$set: {id: "$_id"}}, {$sort: {id: 1}}, {$project: {_id: 0}},
        ]).toArray();
    }

    return await db.collection('recipes').aggregate([
        {$match: { category }},
        {$set: {order: {$rand: {}}, id: "$_id"}},
        {$sort: {order: 1}},
        {$limit: 10},
        {$project: {order: 0, _id: 0}},
    ]).toArray();
}

async function searchRecipes(db, query) {
    return await db.collection('recipes').aggregate([
        {
            $search: {
                index: 'autocomplete-de',
                autocomplete: { path: 'name', query: query, fuzzy: { maxEdits: 1, prefixLength: 2 } },
            }
        },
        {$set: {id: "$_id"}},
        {$project: {_id: 0}},
    ]).toArray();
}

const ALLOWED_MIME_TYPES_MAP = new Map([['image/jpeg', 'jpg'], ['image/png', 'png']]);
const RECIPE_FIELDS = ['id', 'name', 'ingredients', 'steps', 'category', 'tags'];
const ALLOWED_TAGS = ['Vegetarisch', 'Fisch', 'Fleisch', 'Pasta', 'Reis', 'Asiatisch'];
function validSaveRecipeRequest(body, file) {
    return body && Object.keys(body).every(key => RECIPE_FIELDS.includes(key)) &&
        (!body.id || !isNaN(body.id)) &&
        typeof body.name == 'string' && body.name.length && body.name.length < 100 &&
        typeof body.ingredients == 'string' && body.ingredients.length && body.ingredients.length < 1000 &&
        typeof body.steps == 'string' && body.steps.length && body.steps.length < 3000 &&
        ['easy', 'hard', 'dessert', 'starter'].includes(body.category) &&
        typeof body.tags == 'string' && (body.tags == '' ||
            body.tags.split(',').every(tag => ALLOWED_TAGS.includes(tag))) &&
        (!file || [...ALLOWED_MIME_TYPES_MAP.keys()].includes(file.mimetype)) &&
        !!(file || body.id);
}

async function saveRecipe(db, body, file) {
    if (body.id) { // Update existing recipe.
        body.id = Number(body.id);
        const result = await db.collection('recipes')
            .updateOne({_id: body.id}, {$set: unassign(sanitizeRecipe(body), 'id')});
        if (result.matchedCount == 0)
            return {status: 400, message: "Unable to find recipe to update."};
    } else { // Create new recipe.
        const recipeUID = (await db.collection('values').findOneAndUpdate(
            {_id: 'recipeUID'}, {$inc: {value: 1}}, {upsert: true})).value.value;
        await db.collection('recipes').insertOne(
            {_id: recipeUID, ...sanitizeRecipe(body),
                image: `images/recipe${recipeUID}.${ALLOWED_MIME_TYPES_MAP.get(file.mimetype)}`});
        body.id = recipeUID;
    }

    if (file) {
        await db.collection('images').updateOne(
            {_id: body.id},
            {$set: {data: file.buffer, mimeType: file.mimetype}},
            {upsert: true});
    }
    return {id: body.id, status: 200};
}

function sanitizeRecipe(recipe) {
    return {
        ...recipe,
        ingredients: addNewLine(recipe.ingredients),
        steps: addNewLine(recipe.steps),
        tags: typeof recipe.tags != 'string' || recipe.tags == '' ? [] : recipe.tags.split(','),
    };
}

function addNewLine(str) {
    if (str.length && !str.endsWith('\n'))
        return str + '\n';
    return str;
}
