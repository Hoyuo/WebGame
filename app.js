var http = require('http');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
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

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '/views')));
app.set('view engine', 'ejs');
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(require('express-method-override')('method_override_param_name'));
app.use(session({secret: 'keyboard cat', resave: false, saveUninitialized: true}));
app.engine('ejs', engine);

app.use('/', routes);
app.use('/users', users);


io.set('log level', 2);

var socket_user_id = [];

io.sockets.on('connection', function (socket) {
    socket.on('save_user_id', function (data) {
        socket_user_id[socket.id] = data.user_id;
    });

    socket.on('set_1p_peer_id', function (data) {
        routes.roomList[data.roomNum].peer_1p_id = data.peer_1p_id;
        //console.log(routes.roomList);
    });

    socket.on('set_2p_peer_id', function (data) {
        routes.roomList[data.roomNum].peer_2p_id = data.peer_2p_id;
        //console.log(routes.roomList);
        console.log(routes.roomList[data.roomNum]);
    });

    socket.on('disconnect', function () {
        //console.log(socket_user_id[socket.id]);
        for (var i = 0; i < routes.loginUser.length; i++) {
            if (routes.loginUser[i] == socket_user_id[socket.id]) {
                delete routes.loginUser[i];
                break;
            }
        }
    });

    //Android Processing
    socket.on('btn', function (userId, btn) {
        var room = routes.roomFind(userId);
        console.log(pad, room);
        if (room != null) {
            if (routes.roomList[room].user_1p_id == userId) {
                socket.emit('btn_1', btn);
            } else if (routes.roomList[room].user_2p_id == userId) {
                socket.emit('btn_2', btn);
            }
        }
    });

    socket.on('pad', function (userId, dir, flag) {
        var room = routes.roomFind(userId);
        console.log(pad, room);
        if (room != null) {
            if (routes.roomList[room].user_1p_id == userId) {
                socket.emit('pad_1', dir, flag);
            } else if (routes.roomList[room].user_2p_id == userId) {
                socket.emit('pad_2', dir, flag);
            }
        }
    });
});

module.exports = app;
