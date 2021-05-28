/**
 * Created by Fabian on 28.11.2016.
 *
 * Node server for Chochbuech
 * Needs --harmony_array_includes option activated
 *
 */

"use strict";

const express = require('express');
const { Server } = require('http');
const { MongoClient } = require('mongodb');
const multer = require('multer');
const nconf = require('nconf');

nconf.argv().file('keys', 'keys.json').file('config', 'config.json').env();
global.prod = nconf.get('NODE_ENV') == 'production';

const mongoUser = nconf.get('mongoUser');
const mongoPass = nconf.get('mongoPass');
const mongoUrl = nconf.get('mongoUrl');
const mongoDb = nconf.get('mongoDb');
const mongoOptions = { useNewUrlParser: true, useUnifiedTopology: true };
MongoClient.connect(`mongodb+srv://${mongoUser}:${mongoPass}@${mongoUrl}`, mongoOptions)
    .then(client => {
        const db = client.db(mongoDb);

        const app = express().use(express.static('public'));
        app.get('/', function(req, res) {
            res.sendFile(__dirname + '/public/index.html');
        });
        const modules = new Map([...['angular', 'angular-animate', 'angular-aria', 'angular-cookies',
                'angular-material'].map(name => ({ name: name, path: name + '/' + name })),
                { name: 'angular-ui-router', path: '@uirouter/angularjs/release/angular-ui-router' },
            ].map(module => [module.name, module]));
        app.get(`/node-modules/:module`, function (req, res, module) {
            const i = req.params.module.indexOf('.');
            const [name, ext] = [req.params.module.substring(0, i), req.params.module.substring(i)];
            if ((module = modules.get(name))) {
                const extension = global.prod && !ext.startsWith('.min') ? `.min${ext}` : ext;
                res.sendFile(`${__dirname}/node_modules/${module.path}${extension}`);
            } else res.status(404).send('unknown module ' + req.params.module);
        });
        const upload = multer({storage: multer.memoryStorage()});
        app.post('/save', upload.single('image'), async function(req, res) {
            if (!validSaveRequest(req.body, req.file)) return res.sendStatus(400);

            try {
                const mimeTypeMap = new Map([['image/jpeg', 'jpg'], ['image/png', 'png']]);
                if (req.body.id) { // Update existing recipe.
                    req.body.id = Number(req.body.id);
                    const result = await db.collection('recipes')
                        .updateOne({_id: req.body.id}, {$set: unassign(req.body, 'id')});
                    if (result.matchedCount == 0) return res.sendStatus(400);
                } else { // Create new recipe.
                    const recipeUID = (await db.collection('values').findOneAndUpdate(
                        {_id: 'recipeUID'}, {$inc: {value: 1}}, {upsert: true})).value.value;
                    await db.collection('recipes').insertOne(
                        {_id: recipeUID, ...req.body, image:
                                `images/recipe${recipeUID}.${mimeTypeMap.get(req.file.mimetype)}`});
                    req.body.id = recipeUID;
                }

                if (req.file) {
                    await db.collection('images').updateOne(
                        {_id: req.body.id},
                        {$set: {data: req.file.buffer, mimeType: req.file.mimetype}},
                        {upsert: true});
                }
                return res.sendStatus(200);
            } catch (e) {
                return res.sendStatus(500);
            }
        });
        app.get('/images/recipe:id.(jpg|png)', async function(req, res) {
            if (isNaN(req.params.id)) return res.sendStatus(400);
            const image = await db.collection('images').findOne({_id: Number(req.params.id)});
            if (!image) return res.sendStatus(404);
            res.type(image.mimeType).send(image.data.buffer);
        });

        const port = nconf.get(global.prod ? 'serverProdPort' : 'serverDevPort');
        new Server(app).listen(port);
    }).catch(console.error);

function validSaveRequest(body, file) {
    const KEYS = ['id', 'name', 'ingredients', 'steps'];
    return Object.keys(body).every(key => KEYS.includes(key)) &&
        (!body.id || !isNaN(body.id)) && typeof body.name == 'string' &&
        typeof body.ingredients == 'string' && typeof body.steps == 'string' &&
        (!file || ['image/jpeg', 'image/png'].includes(file.mimetype)) &&
        !!(file || body.id);
}

function unassign(obj, ...names) {
    const  copy = {...obj};
    names.forEach(name => delete copy[name]);
    return copy;
}
