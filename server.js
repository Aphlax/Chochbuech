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
let http = require('http').Server(app);
let mongo = require('mongodb').MongoClient;

app.use(express.static('public'));
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

http.listen(3001, "0.0.0.0", function() {
    console.log('listening on 3001');
});