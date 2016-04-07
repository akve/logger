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
            console.log("BODY", body);
            if (err) {
                callback(err);
                return;
            }
            callback(JSON.parse(body));
        });
    }

    mod.postBill = function(paramsInit, callback) {
        // https://codingninjas.co/wp-json/wp/v2/billings/?access_token=6l3a6xdf4flpszwcclspneqjuqjhpt7cntjlz5ds&wpas_hours=10.5&wpas_client=45&wpas_assignee=3&status=charge&wpas_task=5792&title=Autocharge%2010.5%20hours
        /*if (!paramsInit.client_id) {
            mod.getTickets(paramsInit, function (tickets){
               tickets.forEach(function(tkt){
                   if (tkt.id == paramsInit.ticket_id) {
                       paramsInit.client_id = tkt.client_id;
                   }
               })
            })
        }*/
        var params = paramsInit;
        params.username = "volodarik@gmail.com";
        params.password = "dogpile";
        var process = function () {

            var url = mod.wphost + "/wp-json/wp/v2/billings/?wpas_hours=" + params.hours +
                "&wpas_client=1" +
                "&wpas_assignee=" + params.user_id +
                "&status=charge"+
                "&wpas_task="+params.task_id +
                "&title=" + params.title;
            console.log(url);
            var options = {
                method: 'POST',
                url: url,
                headers: mod.getAuthHeader(params)
            };
            request(options, function (err, response, body) {
                //console.log("RESP", err, response, body);
                console.log("BODY", body);
                if (err) {
                    callback(false);
                    return;
                }
                callback("OK");
            });
        }

        process();

    }

    return mod;
}
