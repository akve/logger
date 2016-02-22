module.exports = function(app, passport,models) {

    var api = require('./api.js')(models);

    app.get('/', function(req, res){
        res.render('index');
    });

    app.get('/api/Login', showClientRequest, api.extLogin);

    app.get('/api/check', showClientRequest, api.extCheck);

    app.post('/api/Login', showClientRequest, api.extLogin);

    app.post('/api/LogData', showClientRequest, api.extLogData);

    app.post('/api/postImage', showClientRequest, api.extPostImage)

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