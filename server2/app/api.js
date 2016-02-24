var path = require('path');
var request = require('request');
var fs = require('fs');

var apiconn = require('../config/apiconnection')();
var mysql = require('../config/mysql')();
var Guid = require('guid');
var moment = require('moment');
var mkdirp = require("mkdirp")
var loadMock = function(name){
    var p = path.join( __dirname,'..', 'mocks', name );
    var content = fs.readFileSync(p, 'utf8');
    return JSON.parse(content);
}


module.exports = function(models){

    var auth = function(req, res, callback) {
        var p = {username:'alexpalex', password:'dogpile'};
        //console.log("???", req);
        if (req.body.UserName) {
            p = {username:req.body.UserName, password:req.body.Password};
        }
        console.log("p=", p);
        apiconn.getMe(p , function(userData) {
            if (userData.code == "rest_not_logged_in") {
                res.send(401, {"message": 'wrong credentials'});
                return;
            }
            callback(userData);
        });
    }

    var generateImgUrl = function(data, isThumb) {
        var url = apiconn.baseUrl + "/api/postImage?guid=" + data.guid + "&thumb="+isThumb + "&user=" + data.user_id + "&code="+data.code + "&task=" + data.taskId;
        return url;
    }

    return {

        people: function(req,res,next) {
            mysql.query("select user_id from logs group by user_id", function(err, rows){
                res.json({"result":rows});
                //next();
            })
        },
        tasks: function(req,res,next) {
            var sql = "from logs where user_id = " + req.params.id + " and start_at > '" + req.query.from + "' and start_at < '" + req.query.to + "'";
            if (req.query.agg == "true"){
                sql = "select task_id, sum(duration) duration " + sql + " group by task_id";
            } else {
                sql = "select * " + sql;
            }
            console.log(sql);
            mysql.query(sql, function(err, rows){
                res.json({"result":rows});
                //next();
            })
        },
        shots: function(req,res,next) {
            mysql.query("select * from shots where session_id='"+req.params.session+"'", function(err, rows){
                rows.forEach(function(row){
                    row.path = row.path.replace(path.join(__dirname, ".."), "");
                    row.thumb_path = row.thumb_path.replace(path.join(__dirname, ".."), "");
                })
                res.json({"result":rows});
                //next();
            })
        },

        shot: function(req, res, next) {
            var p = req.query.path;
            var imgPath = path.join(__dirname, "..", p);
            console.log(imgPath);
            if (!fs.existsSync(imgPath)) {
                res.status(404).header('content-type', 'text/html').send("No such file");
                return;
            }
            fs.readFile(imgPath, function (err, content) {
                if (err) {
                    res.writeHead(400, {'Content-type':'text/html'})
                    console.log(err);
                    res.end("No such image");
                } else {
                    //specify the content type in the response will be an image
                    res.writeHead(200,{'Content-type':'image/jpg'});
                    res.end(content);
                }
            });
            //fs.createReadStream(imgPath).pipe(res);
            //res.sendFile(imgPath);

        },

        extLogin: function(req, res, next) {
            auth(req, res, function(userData){
                var result = {
                    userName: userData.name,
                    id: userData.id
                };
                var p = {username:'alexpalex', password:'dogpile'};
                //console.log("???", req);
                if (req.body.UserName) {
                    p = {username:req.body.UserName, password:req.body.Password};
                }
                result.guid = Guid.raw();
                apiconn.getTickets(p, function(tickets){
                    var ticketsAssigned = [];
                    tickets.forEach(function(tkt){
                        if (tkt.wpas_assignee && tkt.wpas_assignee.length > 0 && tkt.wpas_assignee.indexOf(""+userData.id) >=0) {
                            ticketsAssigned.push({
                                id: tkt.id,
                                link: tkt.link,
                                title: tkt.title.rendered
                            });
                        }
                    });
                    result.tasks = ticketsAssigned;
                    res.json(result);
                })
            });
            //var j = loadMock('login.json');
            //console.log(j);
            //j.ServerTimeUTC = new Date().toString();
            //res.json(j);



            //if (next) next();
        },

        extLogData: function(req, res, next) {
            auth(req, res, function(userData){
                var userId = userData.id;
                mysql.aggregatePrevious(req, userId, function(){
                    mysql.saveRequest(req, userId, function(data){
                        if (data.isScreenshot) {
                            data.code = moment(new Date()).format("YYYY-MM-DD-HH-mm-ss");
                            res.json(
                                {"sessionGuid":data.guid,
                                    "signedUrl":generateImgUrl(data, false),
                                    "signedUrlthumb":generateImgUrl(data, true)}
                            );
                        } else {
                            res.json(
                                {"sessionGuid":data.guid,
                                    "signedUrl":null,
                                    "signedUrlthumb":null}
                            );
                        }

                        //res.json(data);
                    })
                })
            });
        },

        extPostImage:  function(req, res, next) {
            var dt = new Date();
            var day =  moment(new Date()).format("YYYY-MM-DD");

            var data = {
                session_id : req.query.guid,
                user_id: parseInt(req.query.user),
                task_id: parseInt(req.query.task),
                code: req.query.code,
                thumb: req.query.thumb=="true"?true: false,
                day : day
            };
            if (req.query.id) {
                data.id = parseInt(req.query.id);
            }
            console.log("DATA", data);
            console.log("DIR", __dirname);
            var _path = path.join(__dirname, "..", "screenshots", ""+data.user_id, data.day)
            mkdirp(_path, 0755, function (er) {
                _path = path.join(_path, (data.task_id + "_" + data.code + (data.thumb?"_thumb":"") + ".jpg"));
                data.path = _path;
                mysql.saveImage(data, function () {
                    var img = req.body.image;
                    img = img.replace("data:image/jpeg;base64,", "");
                    var binaryData = new Buffer(img, 'base64').toString('binary');

                    require("fs").writeFile(data.path, binaryData, "binary", function (err) {
                        res.json({status:"OK"});
                        console.log(err); // writes out file without error, but it's not a valid image
                    });
                });
            });

            //res.json({status:"OK"});
        },

        extCheck: function(req, res, next) {
            mysql.aggregatePrevious(req, 0, function(dt){
                res.json({message:dt});
            });
        }



    }

}



