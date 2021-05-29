
"use strict";

const { unassign } = require('utils');

module.export = { saveRecipe, validSaveRecipeRequest };


const allowedMimeTypesMap = new Map([['image/jpeg', 'jpg'], ['image/png', 'png']]);

function validSaveRecipeRequest(body, file) {
    const KEYS = ['id', 'name', 'ingredients', 'steps'];
    return Object.keys(body).every(key => KEYS.includes(key)) &&
        (!body.id || !isNaN(body.id)) && typeof body.name == 'string' &&
        typeof body.ingredients == 'string' && typeof body.steps == 'string' &&
        (!file || allowedMimeTypesMap.keys().includes(file.mimetype)) &&
        !!(file || body.id);
}

async function saveRecipe(db, body, file) {
    if (body.id) { // Update existing recipe.
        body.id = Number(body.id);
        const result = await db.collection('recipes')
            .updateOne({_id: body.id}, {$set: unassign(body, 'id')});
        if (result.matchedCount == 0) return 400;
    } else { // Create new recipe.
        const recipeUID = (await db.collection('values').findOneAndUpdate(
            {_id: 'recipeUID'}, {$inc: {value: 1}}, {upsert: true})).value.value;
        await db.collection('recipes').insertOne(
            {_id: recipeUID, ...body, image:
                    `images/recipe${recipeUID}.${allowedMimeTypesMap.get(file.mimetype)}`});
        body.id = recipeUID;
    }

    if (file) {
        await db.collection('images').updateOne(
            {_id: body.id},
            {$set: {data: file.buffer, mimeType: file.mimetype}},
            {upsert: true});
    }
    return 200;
}
