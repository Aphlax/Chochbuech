"use strict";

const {unassign} = require('./utils');
const Jimp = require('jimp');

module.exports = {listRecipes, searchRecipes, saveRecipe, validSaveRecipeRequest};

async function listRecipes(db, category) {
    if (category == 'all') {
        return await db.collection('recipes').aggregate([
            {$set: {id: "$_id"}}, {$sort: {id: 1}}, {$project: {_id: 0}},
        ]).toArray();
    }

    return await db.collection('recipes').aggregate([
        {$match: {category}},
        {$set: {order: {$rand: {}}, id: "$_id"}},
        {$sort: {order: 1}},
        {$limit: 10},
        {$project: {order: 0, _id: 0}},
    ]).toArray();
}

const TAGS = [
    {value: 'Vegetarisch', synonyms: ['vegetarisch', 'vegi', 'vegan', 'vegetarian']},
    {value: 'Fisch', synonyms: ['fisch', 'fish']},
    {value: 'Fleisch', synonyms: ['fleisch', 'meat']},
    {value: 'Pasta', synonyms: ['pasta']},
    {value: 'Reis', synonyms: ['reis', 'rice']},
    {value: 'Asiatisch', synonyms: ['asiatisch', 'asian', 'asia', 'chinesisch']}
];

async function searchRecipes(db, query) {
    const lowerQuery = query.toLowerCase();
    if (['all', 'every', 'alle'].includes(lowerQuery)) {
        return await db.collection('recipes')
            .aggregate([{$set: {id: "$_id"}}, {$sort: {name: 1}}, {$project: {_id: 0}}]).toArray();
    }

    const tag = TAGS.find(t => t.synonyms.includes(lowerQuery));
    if (tag) {
        return await db.collection('recipes').aggregate([
            {$match: {tags: tag.value}},
            {$set: {order: {$rand: {}}, id: "$_id"}},
            {$sort: {order: 1}},
            {$limit: 10},
            {$project: {order: 0, _id: 0}},
        ]).toArray();
    }

    // See https://docs.atlas.mongodb.com/atlas-search/operators/.
    return await db.collection('recipes').aggregate([
        {
            $search: {
                index: 'autocomplete-de',
                autocomplete: {path: 'name', query: query, fuzzy: {maxEdits: 1, prefixLength: 2}},
            }
        },
        {$set: {id: "$_id"}},
        {$project: {_id: 0}},
    ]).toArray();
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];
const RECIPE_FIELDS = ['id', 'name', 'ingredients', 'steps', 'category', 'tags'];
function validSaveRecipeRequest(body, file) {
    return body && Object.keys(body).every(key => RECIPE_FIELDS.includes(key)) &&
        (!body.id || !isNaN(body.id)) &&
        typeof body.name == 'string' && body.name.length && body.name.length < 100 &&
        typeof body.ingredients == 'string' && body.ingredients.length && body.ingredients.length < 1000 &&
        typeof body.steps == 'string' && body.steps.length && body.steps.length < 3000 &&
        ['easy', 'hard', 'dessert', 'starter'].includes(body.category) &&
        typeof body.tags == 'string' && (body.tags == '' ||
            body.tags.split(',').every(tag => TAGS.some(t => t.value == tag))) &&
        (!file || ALLOWED_MIME_TYPES.includes(file.mimetype)) && !!(file || body.id);
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
            {_id: recipeUID, ...sanitizeRecipe(body), image: `images/recipe${recipeUID}.png`});
        body.id = recipeUID;
    }

    if (file) {
        const image = await Jimp.read(file.buffer);

        const size = Math.min(image.getHeight(), image.getWidth());
        await image.crop((image.getWidth() - size) / 2, (image.getHeight() - size) / 2, size, size);
        if (size > 600) {
            await image.resize(600, 600);
        }

        const buffer = await image.getBufferAsync('image/png');
        await db.collection('images').updateOne(
            {_id: body.id},
            {$set: {data: buffer, mimeType: 'image/png'}},
            {upsert: true});
    }
    return {id: body.id, status: 200};
}

function sanitizeRecipe(recipe) {
    return {
        ...recipe,
        ingredients: sanitizeStringItems(recipe.ingredients),
        steps: sanitizeStringItems(recipe.steps),
        tags: typeof recipe.tags != 'string' || recipe.tags == '' ? [] : recipe.tags.split(','),
    };
}

function sanitizeStringItems(str) {
    if (str.length && !str.endsWith('\n'))
        return str.replace(/\r\n/g, '\n') + '\n';
    return str.replace(/\r\n/g, '\n');
}
