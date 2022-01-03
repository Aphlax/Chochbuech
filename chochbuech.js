
"use strict";

const { unassign } = require('./utils');

module.exports = { listRecipes, searchRecipes, saveRecipe, validSaveRecipeRequest };

async function listRecipes(db, category) {
    return await db.collection('recipes').aggregate([
        {$match: category == 'all' ? {} : { category }},
        {$set: {order: {$rand: {}}, id: "$_id"}},
        {$sort: category == 'all' ? {id: 1} : {order: 1}},
        {$limit: category == 'all' ? 1000 : 10},
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
function validSaveRecipeRequest(body, file) {
    const KEYS = ['id', 'name', 'ingredients', 'steps', 'category'];
    return body && Object.keys(body).every(key => KEYS.includes(key)) &&
        (!body.id || !isNaN(body.id)) && typeof body.name == 'string' && body.name.length &&
        typeof body.ingredients == 'string' && body.ingredients.length &&
        typeof body.steps == 'string' && body.steps.length &&
        ['easy', 'hard', 'dessert', 'starter'].includes(body.category) &&
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
    return { ...recipe, ingredients: addNewLine(recipe.ingredients), steps: addNewLine(recipe.steps) };
}

function addNewLine(str) {
    if (str.length && !str.endsWith('\n'))
        return str + '\n';
    return str;
}
