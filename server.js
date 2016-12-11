/**
 * Created by Fabian on 28.11.2016.
 *
 * Node server for Chochbuech
 * Needs --harmony_array_includes option activated
 *
 */

"use strict";

if (!Array.prototype.includes)
    throw console.error('Node option --harmony_array_includes not activated!');

let express = require('express');
let app = express();
let http = require('http');
let https = require('https');
let multer = require('multer');
let mongo = require('mongodb').MongoClient;
let fs = require('fs');
let readline = require('readline');

let sec = { key: fs.readFileSync('key.pem'), cert: fs.readFileSync('cert.pem') };

app.use(express.static('public'));

app.get('/', function(req, res) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.sendFile(__dirname + '/public/index.html');
});

let db = null;
mongo.connect('mongodb://localhost:27017/ChochbuechDB', function(err, database) {
    if(err) console.error(err);
    db = database;
});



app.get('/image-list', function(req, res) {
    db.collection('images').find({}, { _id: 1 }).toArray(function(e, data) {
        res.json(data.map(img => { return { id: img._id }; })).end();
    });
});
app.get('/images/:id', function(req, res) {
    db.collection('images').find({ _id: req.params.id }).toArray(function(e, data) {
        if (data.length)
            res.json(data[0].data).end();
        else
            res.status(404).end();
    });
});
app.post('/addImage', multer().single('file'), function(req, res) {



    db.collection('images').insertMany([])
        .then(() => res.status(200).end());
});


let httpServer = http.createServer(app);
let httpsServer = https.createServer(sec, app);
httpServer.listen(3001);
httpsServer.listen(3002);












