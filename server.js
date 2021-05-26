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
            if (!req.file || !req.file.mimetype) return res.sendStatus(400);
            await db.collection('images').updateOne(
                {_id: 1},
                {$set: {data: req.file.buffer, mimeType: req.file.mimetype}},
                {upsert: true});
            res.sendStatus(200);
        });
        app.get('/images/recipe:id.jpg', async function(req, res) {
            if (isNaN(req.params.id)) return res.sendStatus(400);
            const image = await db.collection('images').findOne({_id: Number(req.params.id)});
            if (!image) return res.sendStatus(404);
            res.type(image.mimeType).send(image.data.buffer);
        });

        const port = nconf.get(global.prod ? 'serverProdPort' : 'serverDevPort');
        new Server(app).listen(port);
    }).catch(console.error);
