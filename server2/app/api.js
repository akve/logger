var path = require('path');
var fs = require('fs');

var apiconn = require('../config/apiconnection')();

var loadMock = function(name){
    var p = path.join( __dirname,'..', 'mocks', name );
    var content = fs.readFileSync(p, 'utf8');
    return JSON.parse(content);
}


module.exports = function(models){

    var User = models.user;
    var Person = models.person;
    var Thing = models.thing;

    return {

        signup: function (req,res)
        {

            var body = req.body;

            User.findOne({ username: body.username
            },function(err, user) {
                if (err)
                    res.send(500, {'message': err});
                // check to see if theres already a user with that email
                if (user) {
                    res.send(403, {'message': 'User already exist!'});
                }else {
                    var newUser = new User({ username: body.username,email: body.email, password:body.password})
                    newUser.save(function (err, user) {
                        if (err){
                            res.send(500, {'message': err});
                        }
                        res.json({ 'message': 'User was successfully registered!'});
                    });
                }
            });
        },

        login:function(req,res)
        {
            res.json({ auth_token: req.user.token.auth_token});
        },

        logout: function(req,res)
        {
            req.user.auth_token = null;
            req.user.save(function(err,user){
                if (err){
                    res.send(500, {'message': err});
                }
                res.json({ message: 'See you!'});
            });
        },
        createPerson: function(req,res)
        {
            var person = req.body.person;

            if (typeof person.name != "string") {
                res.send(400, {'message': "Name must be a string!"});
            }
            if (typeof person.age != "number") {
                res.send(400, {'message': "Age must be a number!"});
            }

            var newPerson = new Person({ name: person.name, age: person.age})
            newPerson.save(function (err, user) {
                if (err){
                    res.send(500, {'message': err});
                }
                res.json({ 'message': 'Person was successfully added!'});
            });

        },
        updatePerson: function(req,res)
        {
            var _id = req.params.id;
            var person = req.body.person;

            var query = { _id: _id };
            Person.update(query, {name:person.name,age:person.age}, null, function (err, thing) {
                if (err){
                    res.send(500, {'message': err});
                }
                res.json({ 'message': 'Person was successfully updated!'});
            })

        },
        removePerson: function(req,res)
        {
            var _id = req.params.id;

            Person.remove({ _id:_id}, function (err, user) {
                if (err){
                    res.send(500, {'message': err});
                }
                res.json({ 'message': 'Person was successfully removed!'});
            })


        },
        getPeople: function(req,res)
        {

            Person.find(function(err,people){
                res.json({people: people });
            })


        },
        createThing: function(req,res)
        {

            console.log(req.body);
            var thing = req.body.thing;

            if (typeof thing.name != "string") {
                res.send(400, {'message': "Name must be a string!"});
            }
            if (typeof thing.size != "number") {
                res.send(400, {'message': "Size must be a number!"});
            }

            var newThing = new Thing({ name: thing.name, size: thing.size})
            newThing.save(function (err, thing) {
                if (err){
                    res.send(500, {'message': err});
                }
                res.json({ 'message': 'Thing was successfully created!'});
            });

        },
        updateThing: function(req,res)
        {
            var _id = req.params.id;
            console.log(req.body);
            console.log(_id);

            var thing = req.body.thing;

            var query = { _id: _id };
            Thing.update(query, {name:thing.name,size:thing.size}, null, function (err, thing) {
                if (err){
                    res.send(500, {'message': err});
                }
                res.json({ 'message': 'Thing was successfully updated!'});
            })

        },
        removeThing: function(req,res)
        {
            var _id = req.params.id;

            Thing.remove({ _id:_id}, function (err, user) {
                if (err){
                    res.send(500, {'message': err});
                }
                res.json({ 'message': 'Thing was successfully removed!'});
            })

        },

        getThings: function(req,res)
        {
            Thing.find(function(err,things){
                res.json({things: things });
            });

        },

        extLogin: function(req, res, next) {
            var p = {username:'alexpalex', password:'dogpile'};
            //console.log("???", req);
            if (req.body.UserName) {
                p = {username:req.body.UserName, password:req.body.Password};
            }
            console.log("p=", p);
            apiconn.getMe(p , function(userData){
                if (userData.code == "rest_not_logged_in") {
                    res.send(401, {"message":'wrong credentials'});
                    return;
                }
                var result = {
                    userName: userData.name,
                    id: userData.id
                };
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
        }


    }

}



