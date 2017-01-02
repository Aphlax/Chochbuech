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
let sassMiddleware = require('node-sass-middleware');
let mongo = require('mongodb').MongoClient;
let fs = require('fs');
let readline = require('readline');

let sec = { key: fs.readFileSync('key.pem'), cert: fs.readFileSync('cert.pem') };

app.use(express.static('public'));
app.use('/styles', sassMiddleware({
    src: __dirname + '/public/styles/sass',
    dest: __dirname + '/public/styles/gen',
    force: true,
    outputStyle: 'expanded'
}));

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

function date(day) {
    let date = new Date();
    date.setDate(date.getDate() + day);
    date.setHours(0, 0, 0, 0);
    return date;
}

app.get('/calendar', function(req, res) {
    let start = Number(req.query.start) || 0;
    let end = Math.min(Math.max(start, Number(req.query.end)), start + 371) || 0;

    let mockdata = [];
    for (let i = start; i <= end; i++){
        mockdata.push({ date: date(i), recipe: null });
    }
    mockdata[9] = { date: mockdata[9].date, recipe: { name: 'Spaghetti', tags: ['Pasta', 'Easy'], last: 0, image: 'CYX' }};
    res.json(mockdata).end();
});
app.post('/addImage', multer().single('file'), function(req, res) {
    let a = req.file;
});


let httpServer = http.createServer(app);
let httpsServer = https.createServer(sec, app);
httpServer.listen(3001);
httpsServer.listen(3002);












