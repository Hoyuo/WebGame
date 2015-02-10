//http 서버
var http = require('http');
var express = require('express');
var routes = require('./routes');
var app = express();
var server = http.createServer(app);
server.listen(3000);

//웹페이지 구성
var engine = require('ejs-locals');
var path = require('path');
var bodyParser = require('body-parser');
var session = require('cookie-session');
var favicon = require('serve-favicon');

//Socket.IO
var io = require('socket.io').listen(server);


//비밀번호 암호화
var crypto = require('crypto');
var myHash = function myHash(key) {
    var hash = crypto.createHash('sha1');
    hash.update(key);
    return hash.digest('hex');
}

//Create Session
var createSession = function createSession() {
    return function (req, res, next) {
        if (!req.session.login) {
            req.session.login = 'logout';
        }
        next();
    };
};

//all environment
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(require('express-method-override')('method_override_param_name'));
app.use(session({secret: 'secret key'}));
app.use(express.static(path.join(__dirname, '/views')));

app.engine('ejs', engine);

app.get('/', routes.index);
app.get('/SIGN_UP', routes.sign_up);
app.get('/CHECKUSERNAME', routes.checkUserName);
app.get('/LOGOUT', routes.logout);
app.get('/gameroomlist', routes.gameroomlist);
app.get('/CREATEROOM', routes.createroom);
app.get('/JOIN_ROOM', routes.joinRoom);

app.post('/SIGN_UP', function (req, res, next) {
    if (req.body.password == req.body.confirm_password) {
        req.username = req.body.username;
        req.password = myHash(req.body.password);
        next();
    }
    else {
        res.redirect('/SIGN_UP');
    }
}, routes.sign_up_post);

app.post('/CREATE_ROOM', function (req, res, next) {
    req.roomname = req.body.insert_name;
    req.game = req.body.insert_game;
    req.playerCount = req.body.insert_player;
    next();
}, routes.createroom_post);

app.post('/LOGIN', function (req, res, next) {
    req.username = req.body.username;
    req.password = myHash(req.body.password);
    next();
}, routes.login_post);

app.post('/LOGINMOBILE', function (req, res, next) {
    req.username = req.body.userId;
    req.password = myHash(req.body.password);
    console.log(req.username);
    console.log(req.password);
    next();
}, routes.moblie_login_post);

var socket_ids = [];
var count = 0;

function registerUser(socket, nickname) {
    socket.get('nickname', function (err, pre_nick) {
        if (pre_nick != undefined) delete socket_ids[pre_nick];
        socket_ids[nickname] = socket.id;
        socket.set('nickname', nickname, function () {
        });
    });
}

io.sockets.on('connection', function (socket) {
    console.log('test', io.sockets.manager.rooms);
    socket.emit('new');

    socket.on('join', function (data) {
        socket.join(data.roomname);
        console.log('test', io.sockets.manager.rooms);
        socket.set('room', data.roomname);
        socket.get('room', function (error, room) {
            console.log(room);
            io.sockets.in(room).emit('join', data.userid);
        });
    });

    socket.on('newSend', function (data) {
        registerUser(socket, data);
    });

    socket.on('UUID', function (data) {
        var nickname = 'player' + count;
        count++;
        count = count % 2;
        registerUser(socket, nickname);
        console.log(nickname);
    });

    socket.on('btn', function (data) {
        socket.get('nickname', function (err, nickname) {
            var iValue = nickname.indexOf('0');
            var socket_id = socket_ids['webPage'];
            if (socket_id != undefined) {
                if (iValue != -1)
                    io.sockets.socket(socket_id).emit('btn_1', data);
                else
                    io.sockets.socket(socket_id).emit('btn_2', data);
            }// if
        });
    });

    socket.on('pad', function (data, flag) {
        socket.get('nickname', function (err, nickname) {
            var iValue = nickname.indexOf('0');
            var socket_id = socket_ids['webPage'];
            if (socket_id != undefined) {
                if (iValue != -1)
                    io.sockets.socket(socket_id).emit('pad_1', data, flag);
                else
                    io.sockets.socket(socket_id).emit('pad_2', data, flag);
            }// if
        });
    });

    socket.on('disconnect', function () {
        socket.get('room', function (error, room) {
            socket.leave(room);
            console.log('test', io.sockets.manager.rooms);
        });

        socket.get('nickname', function (err, nickname) {
            if (nickname != undefined) {
                delete socket_ids[nickname];
            }
        });
    });

    socket.on('test', function() {
        console.log('test');
    });
});