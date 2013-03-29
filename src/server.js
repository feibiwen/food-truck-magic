/*
 * Food trucks, brah.
 */
"use strict";

var SESSION_SECRET_KEY = 'ft_session';

var express = require('express');
var engine = require('ejs-locals');
var args = require('optimist').argv;

var db = require('./db.js').Database;
var config = require('./config.js').Config;
var routes = require('./routes.js');

var app = express();

var port = args.port ? args.port : 8080;

/* Configuration options for express */
app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({
        secret: SESSION_SECRET_KEY,
        store: new express.session.MemoryStore({reapInterval: 30000})
    }));

    app.engine('ejs', engine);      // use ejs-locals for ejs templates
    app.set('view engine', 'ejs');
    app.set('views', __dirname + '/views');
    app.use(express.static(__dirname +'/public'));
});


config.init(function() {
    db.init();

    app.listen(port, function() {
        routes.setupRoutes(app);
        console.log('- Server listening on port ' + port);
    });
});

