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

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// uncomment after placing your favicon in /public
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


var socket_user_id = [];
var socket_flag = [];

io.sockets.on('connection', function (socket) {
    socket.on('save_user_id', function (data) {
        socket_user_id[socket.id] = data.user_id;
        if (data.flag != undefined) {
            socket_flag[socket.id] = data.flag;
        }
        routes.loginUser[(routes.loginCnt)++] = data.user_id;
    });

    socket.on('set_1p_peer_id', function (data) {
        routes.roomList[data.roomNum].peer_1p_id = data.peer_1p_id;
    });

    socket.on('set_2p_peer_id', function (data) {
        routes.roomList[data.roomNum].peer_2p_id = data.peer_2p_id;
    });

    socket.on('disconnect', function () {
        for (var i = 0; i < routes.loginUser.length; i++) {
            if (routes.loginUser[i] == socket_user_id[socket.id]) {
                delete routes.loginUser[i];
                break;
            }
        }

        if (socket_flag[socket.id] != undefined) {
            for (var i = 0; i < routes.roomList.length; i++) {
                if (routes.roomList[i] != undefined) {
                    if (routes.roomList[i].user_1p_id != undefined) {
                        if (routes.roomList[i].user_1p_id == socket_user_id[socket.id]) {
                            delete routes.roomList[i];
                            break;
                        }
                    }

                    if (routes.roomList[i].user_2p_id != undefined) {
                        if (routes.roomList[i].user_2p_id == socket_user_id[socket.id]) {
                            routes.roomList[i].user_2p_id = null;
                            routes.roomList[i].peer_2p_id = null;
                            routes.roomList[i].currentPlayer = 1;
                            break;
                        }
                    }
                }
            }
        }
    });

    //todo Android Processing
    socket.on('join', function (data) {
        socket.join(data.roomNum);
    });


    socket.on('btn', function (userId, btn) {
        var room = routes.roomFind(userId);
        if (room != null) {
            if (routes.roomList[room].user_1p_id == userId) {
                io.sockets.in(room).emit('btn_1', btn);
            } else if (routes.roomList[room].user_2p_id == userId) {
                io.sockets.in(room).emit('btn_2', btn);
            }
        }
    });

    socket.on('pad', function (userId, dir, flag) {
        var room = routes.roomFind(userId);
        if (room != null) {
            if (routes.roomList[room].user_1p_id == userId) {
                //console.log('pad_1', dir, flag);
                io.sockets.in(room).emit('pad_1', dir, flag);
            } else if (routes.roomList[room].user_2p_id == userId) {
                //console.log('pad_2', dir, flag);
                io.sockets.in(room).emit('pad_2', dir, flag);
            }
        }
    });
});

module.exports = app;
