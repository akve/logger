module.exports = function(app, passport,models) {

    var api = require('./api.js')(models);

    app.get('/', function(req, res){
        res.render('index');
    });


    app.get('/partials/:name', showClientRequest, function (req, res) {
        var name = req.params.name;
        //console.log("!");
        res.render('partials/' + name);
    });

    app.get('/partials/auth/:name', showClientRequest, function (req, res) {
        var name = req.params.name;
        //console.log("!");
        res.render('partials/auth/' + name);
    });

    app.get('/api/people', showClientRequest, api.people);
    app.get('/api/tasks/:id', showClientRequest, api.tasks);
    app.get('/api/shots/:session', showClientRequest, api.shots);

    app.get('/api/shot', showClientRequest, api.shot);

    app.get('/api/Login', showClientRequest, api.extLogin);

    app.get('/api/check', showClientRequest, api.extCheck);

    app.post('/api/Login', showClientRequest, api.extLogin);

    app.post('/api/LogData', showClientRequest, api.extLogData);

    app.post('/api/postImage', showClientRequest, api.extPostImage);

    app.get('/api/postBills', showClientRequest, api.postBills);

    function showClientRequest(req, res, next) {
        var request = {
            REQUEST : {
                HEADERS: req.headers
                //BODY : req.body
            }
        }
        console.log(request)
        return next();
    }
}