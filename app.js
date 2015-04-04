var http = require('http');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
//var logger = require('morgan');
//var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var session = require('cookie-session');
var app = express();
var server = http.createServer(app);
server.listen(13000);

var engine = require('ejs-locals');
var url = require('url');

var io = require('socket.io').listen(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(express.cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '/views')));
app.set('view engine', 'ejs');
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(require('express-method-override')('method_override_param_name'));
app.use(session({secret: 'keyboard cat', resave: false, saveUninitialized: true}));
//app.use(createSession());
app.engine('ejs', engine);

app.use('/', routes);
app.use('/users', users);


io.set('log level', 2);

var socket_user_id = [];

io.sockets.on('connection', function(socket){
    socket.on('save_user_id', function(data){
       socket_user_id[socket.id] = data.user_id;
    });

    socket.on('set_1p_peer_id', function(data){
        routes.roomList[data.roomNum].peer_1p_id = data.peer_1p_id;
        //console.log(routes.roomList);
    });

    socket.on('set_2p_peer_id', function(data){
        routes.roomList[data.roomNum].peer_2p_id = data.peer_2p_id;
        //console.log(routes.roomList);
        console.log(routes.roomList[data.roomNum]);
    });

    socket.on('disconnect', function(){
        //console.log(socket_user_id[socket.id]);
        for(var i=0; i<routes.loginUser.length; i++){
            if( routes.loginUser[i] == socket_user_id[socket.id] ){
                delete routes.loginUser[i];
                break;
            }
        }
        //console.log(routes.loginUser.length + '?' + routes.loginCnt + ' user login : ' + routes.loginUser);
    });
});


/*
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});*/


module.exports = app;
