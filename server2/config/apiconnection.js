var request = require('request');
var path = require('path');
var nconf = require('nconf').file({
    file: path.join( __dirname, '..', 'config', 'global.json' )
});

module.exports = function() {

    var mod = {};

    mod.wphost = nconf.get("WPHost");

    mod.baseUrl = nconf.get("BaseUrl");

    mod.getAuthHeader = function(params) {
        return {'Authorization' : 'Basic '  +  new Buffer( params.username + ':' + params.password ).toString('base64')};
    }

    mod.getLogin = function(params, callback) {
        var wordpress = require( "wordpress" );
        var client = wordpress.createClient({
            url: mod.wphost,
            username: params.username, //"alexpalex",
            password: params.password //"dogpile2"
        });

        client.listMethods(function( error, posts ) {
            console.log("ERRROR", error, "Found ", posts);
        });

    } 

    mod.getMe = function(params, callback) {
        var options = {
          method: 'GET',
          url: mod.wphost + "/wp-json/wp/v2/users/me",
          headers: mod.getAuthHeader(params)
        };
        console.log(options);
        request(options, function(err, response, body) {
            //console.log("RESP", err, response, body);
            //console.log("BODY", body);
            if (err) {
                callback(err);
                return;
            }
            callback(JSON.parse(body));
        });
    }

    mod.getTickets = function(params, callback) {
        var options = {
            method:'GET',
          url: mod.wphost + "/wp-json/wp/v2/tickets",
          headers: mod.getAuthHeader(params)
        };
        request(options, function(err, response, body) {
            //console.log("RESP", err, response, body);
            //console.log("BODY", body);
            if (err) {
                callback(err);
                return;
            }
            callback(JSON.parse(body));
        });
    }

    return mod;
}
