/**
 * Created by Fabian on 28.11.2016.
 *
 * Node server for Chochbuech.
 */

"use strict";

const express = require('express');
const { Server } = require('http');
const { MongoClient } = require('mongodb');
const multer = require('multer');
const nconf = require('nconf');

const { listRecipes, searchRecipes, saveRecipe, validSaveRecipeRequest } = require('./chochbuech');
const { unassign } = require('./utils');

nconf.argv().file('keys', 'keys.json').file('config', 'config.json').env();
global.prod = nconf.get('NODE_ENV') == 'production';

const mongoUser = nconf.get('mongoUser');
const mongoPass = nconf.get('mongoPass');
const mongoUrl = nconf.get('mongoUrl');
const mongoDb = nconf.get('mongoDb');
const adminKey = nconf.get('adminKey');
const mongoOptions = { useNewUrlParser: true, useUnifiedTopology: true };
MongoClient.connect(`mongodb+srv://${mongoUser}:${mongoPass}@${mongoUrl}`, mongoOptions)
    .then(client => {
        const db = client.db(mongoDb);

        const app = express().use(express.static('public'));
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

        app.get('/properties', function(req, res) {
            const canEdit = (req.headers.cookie || '').indexOf('adminKey=' + adminKey) != -1;
            res.json({ canEdit });
        })
        const upload = multer({storage: multer.memoryStorage()});
        app.post('/save', upload.single('image'), async function(req, res) {
            try {
                if ((req.headers.cookie || '').indexOf('adminKey=' + adminKey) == -1)
                    return res.sendStatus(403);
                if (!validSaveRecipeRequest(req.body, req.file)) return res.sendStatus(400);
                const result = await saveRecipe(db, req.body, req.file);
                return result.status == 200 ?
                    res.json({ id: result.id }) :
                    res.status(result.status).send(result.message || "Error.");
            } catch (e) {
                return res.status(500).send(e.name + ': ' +e.message || "Error.");
            }
        });
        app.get('/listRecipes', async function(req, res) {
            if (!['easy', 'hard', 'dessert', 'starter', 'all'].includes(req.query.category))
                return res.sendStatus(400);
            res.json(await listRecipes(db, req.query.category));
        });
        app.get('/look', async function(req, res) {
            if (typeof req.query.for != 'string' || !req.query.for.length)
                return res.sendStatus(400);
            res.json(await searchRecipes(db, req.query.for));
        });
        app.get('/recipe/recipe:id', async function(req, res) {
            if (isNaN(req.params.id)) return res.sendStatus(400);
            const recipe = await db.collection('recipes').findOne({_id: Number(req.params.id)});
            if (!recipe) return res.sendStatus(404);
            res.json(unassign({...recipe, id: recipe._id}, '_id'));
        });
        app.get('/images/recipe:id.(jpg|png)', async function(req, res) {
            if (isNaN(req.params.id)) return res.sendStatus(400);
            const image = await db.collection('images').findOne({_id: Number(req.params.id)});
            if (!image) return res.sendStatus(404);
            res.type(image.mimeType).send(image.data.buffer);
        });
        app.get(['/', '/r/*', '/search', '/edit/*', '/new', '/all', '/shopping-list'].join('|'),
            function(req, res) { res.sendFile(__dirname + '/public/index.html'); });

        const port = nconf.get(global.prod ? 'serverProdPort' : 'serverDevPort');
        new Server(app).listen(port);
    }).catch(console.error);
