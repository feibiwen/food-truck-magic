/*
 * The route for the index page. 
 * TODO: these queries suck, NEED to move to some better api endpoint
 */

var db = require('../db.js').Database;
var fourOhFourRoute = require('./fourohfour.js').route;

/* SQL Queries */
var SQL_GET_TRUCKS = 'SELECT trucks.*, trucks.photoUploadid AS uploadid, uploads.ext FROM trucks ' +
                     'LEFT JOIN uploads ON uploads.id = trucks.photoUploadid';
var SQL_GET_FOLLOWED = 'SELECT trucks.* FROM follows INNER JOIN trucks on trucks.id = follows.truckid WHERE userid = $1';

exports.route = function(request, response, data) {
    data.followedTrucks = [];
    data.allTrucks = [];

    db.query(SQL_GET_TRUCKS, [], function(err, res) {
        if (err) {
            console.error(err);
            return fourOhFourRoute(request, response, data);
        }
        data.allTrucks = res.rows;

        /* if logged in, query for trucks user follows */
        if (data.user) {
            db.query(SQL_GET_FOLLOWED, [data.user.id], function(err, res) {
                if (err) {
                    console.error(err);
                    return fourOhFourRoute(request, response, data);
                }
                data.followedTrucks = res.rows;
                response.render('index', data);
            });
        } else {
            response.render('index', data);
        }
    });
};
