/*
 * Routes homey.
 */

exports.setupRoutes = function(app) {
    app.get('/', function(request, response) {
        response.render('index', {test : 'yolo'});
    });

    app.get('/truck/:truckidentifier', require('./routes/truck.js').route);
    app.get('*', require('./routes/fourohfour.js').route);
    app.post('*', require('./routes/fourohfour.js').route);
};
