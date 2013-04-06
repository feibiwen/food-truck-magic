/*
 * A database abstraction on top of a database abstraction. We're getting
 * enterprise up in here.
 */
var anydb = require('any-db');
var Config = require('./config.js').Config;

var Database = {

    connPool: null,

    getDSN: function() {
        var dbinfo = Config.data.db;
        return 'postgres:' + 
               dbinfo.user + ':' +
               dbinfo.password + '@' +
               dbinfo.host + '/' +
               dbinfo.dbname;
    },

    init: function() {
        this.connPool = anydb.createPool(this.getDSN(), {});
    },

    get: function(callback) {
        this.connPool.acquire(callback);
    },

    /* Acquires a connection and begins a transaction. */
    begin: function(callback) {
        this.connPool.begin(callback);
    },

    release: function(conn) {
        this.connPool.release(conn);
    },

    /* Performs the given query with the given parameters. When all
     * results have been retrieved, the callback will be invoked. The
     * first argument to the callback is an error, if any occurred. The
     * second is an array of the resulting rows.
     */
    query: function(sql, params, callback) {
        this.connPool.query(sql, params, function(err, res) {
            if(err) { callback(err, null); }
            callback(null, res.rows);
        });
    }

};

exports.Database = Database;
