
"use strict";

const { unassign } = require('./utils');

module.exports = { saveRecipe, validSaveRecipeRequest };


const ALLOWED_MIME_TYPES_MAP = new Map([['image/jpeg', 'jpg'], ['image/png', 'png']]);

function validSaveRecipeRequest(body, file) {
    const KEYS = ['id', 'name', 'ingredients', 'steps', 'category'];
    return body && Object.keys(body).every(key => KEYS.includes(key)) &&
        (!body.id || !isNaN(body.id)) && typeof body.name == 'string' && body.name.length &&
        typeof body.ingredients == 'string' && body.ingredients.length &&
        typeof body.steps == 'string' && body.steps.length &&
        ['easy', 'hard', 'dessert'].includes(body.category) &&
        (!file || [...ALLOWED_MIME_TYPES_MAP.keys()].includes(file.mimetype)) &&
        !!(file || body.id);
}

async function saveRecipe(db, body, file) {
    if (body.id) { // Update existing recipe.
        body.id = Number(body.id);
        const result = await db.collection('recipes')
            .updateOne({_id: body.id}, {$set: unassign(sanitizeRecipe(body), 'id')});
        if (result.matchedCount == 0) return {status: 400};
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
