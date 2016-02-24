var mysql      = require('mysql');
var Guid = require('guid');
var moment = require('moment');
var path = require('path');

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'logger'
});

module.exports = function() {

    var sqlDate = function(dt){
        return "'" + moment(dt).format("YYYY-MM-DD HH:mm:ss") + "'";
    }

    var mod = {};
    mod.query = function(sql, callback) {

        connection.query(sql, function(err, rows) {
            callback(err, rows);
        });
    }

    mod.saveLog = function(request, startAt, len, callback) {
        var post = {
            user_id: request.user_id,
            session_id: request.guid,
            status: "added",
            start_at: startAt,
            end_at: request.dt,
            task_id: request.taskId,
            duration: len / 1000
        }
        var query = connection.query('INSERT INTO logs SET ?', post, function(err, result) {
            //callback(post);
        });
    }

    mod.aggregatePrevious = function(req, user, callback) {
        var skipIds = "'0'";
        /*if (req.body.isStartLog != "true") {
            skipId = req.body.guid;
        }*/
        var startTime;
        var nowTime;
        var sumTime = 0;
        var i = 0;
        var lastGuid = "";
        connection.query("SELECT guid FROM requests WHERE date_add( now(), INTERVAL -1 MINUTE) < dt GROUP BY guid", function(skipsE, skipsRows) {

            skipsRows.forEach(function(row){
                skipIds += ",'" + row.guid + "'";
            })
//dt < " + sqlDate(moment(new Date()).add(-5, 'm')) + " and
            console.log("select * from requests where  guid not in (" + skipIds + ") and not exists (select id from logs where logs.session_id = requests.guid) order by id");
            connection.query("select * from requests where  guid not in (" + skipIds + ") and not exists (select id from logs where logs.session_id = requests.guid) order by id", function (err, result) {
                //console.log(result);

                if (result.length == 0) {
                    callback("0");
                    return;
                }
                var r;
                var res = [];
                for (var i = 0; i < result.length; i++) {
                    r = result[i];
                    if (lastGuid != r.guid) {
                        if (i != 0) {
                            res.push({"guid": r.guid, "start": startTime, "sum": sumTime});
                            mod.saveLog(r, startTime, sumTime);
                            console.log("LENGTH", lastGuid, sumTime);
                        }
                        sumTime = 0;
                        startTime = r.dt;
                        nowTime = r.dt;
                        lastGuid = r.guid;
                    }
                    sumTime += r.dt - nowTime;
                    nowTime = r.dt;
                    //if (i == (result.length - 1)) {
                    //    endTime = r.dt;
                    //}
                }
                res.push({"guid": r.guid, "start": startTime, "sum": sumTime});
                mod.saveLog(r, startTime, sumTime);
                console.log("LENGTH AT FINAL", lastGuid, sumTime);
                callback(res);
            });
        });

    }

    mod.saveImage = function(data, callback){
      /*`id` int(11) NOT NULL AUTO_INCREMENT,
      `session_id` varchar(45) DEFAULT NULL,
      `shot_at` datetime DEFAULT NULL,
      `user_id` varchar(45) DEFAULT NULL,
      `path` varchar(255) DEFAULT NULL,
      `thumb_path` varchar(255) DEFAULT NULL,
      `task_id` varchar(45) DEFAULT NULL,
      `code` varchar(45) DEFAULT NULL,*/

        var post = {session_id : data.session_id,
            shot_at: new Date(),
            user_id: "" + data.user_id,

            task_id: data.task_id,
            code: data.code
        };
        console.log("DATA", data);
        if (data.thumb) {
            post.thumb_path = data.path.replace(path.join(__dirname, ".."), "");
            //console.log('UPDATE shots SET thumb_path = :thumb_path WHERE code = :code');
            var query = connection.query("UPDATE shots SET thumb_path = '"+data.path+"' WHERE code = '"+data.code+"'", function(err, result) {
                callback(post);
            });
        } else {
            post.path = data.path.replace(path.join(__dirname, ".."), "");
            var query = connection.query('INSERT INTO shots SET ?', post, function(err, result) {
                callback(post);
            });
        }

    }

    mod.saveRequest = function(req, user, callback) {
        /*
        * `id` INT NOT NULL AUTO_INCREMENT,
         `user_id` VARCHAR(45) NULL,
         `session_id` VARCHAR(45) NULL,
         `status` VARCHAR(45) NULL,
         `start_at` DATETIME NULL,
         `end_at` DATETIME NULL,
         `data` TEXT NULL,
         `task_id` VARCHAR(45) NULL,*/
        var allBody = {}
        for (var k in req.body) {
            allBody[k] = req.body[k];
        }
        /*var post  = {user_id: '' + user,
                    session_id: req.body.guid,
                    task_id: req.body.taskId,
                    data : JSON.stringify(allBody)
                    };
        var query = connection.query('INSERT INTO logs SET ?', post, function(err, result) {
            // Neat!
        });*/
        var newGuid = req.body.guid;

        if (req.body.isStartLog == "true") {
            newGuid = Guid.raw();
        }

        var post  = {user_id: '' + user,
            guid: newGuid,
            taskId: req.body.taskId,
            isScreenshot: req.body.isScreenshot == "true" ? 1:0,
            forceWorkingStatus :  req.body.forceWorkingStatus == "true"? 1:0,
            isStartLog: req.body.isStartLog == "true"? 1:0,
            inactivityAlert: req.body.inactivityAlert == "true"? 1:0,
            stats : JSON.stringify(allBody),
            dt: new Date()
        };
        var query = connection.query('INSERT INTO requests SET ?', post, function(err, result) {
            callback(post);
        });

        /*guid:141a7945-2c57-4626-944e-906068444175
        taskId:78949
        isScreenshot:true
        forceWorkingStatus:false
        isStartLog:true
        inactivityAlert:false
        keyCount:0
        mouseCount:0
        windowTitle:chromeClient
        image:img
        auxData:chromeClient
        */

    }
    return mod;
}