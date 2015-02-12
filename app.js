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
};

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

//roominfo
var roominfo = [];

app.get('/', routes.index);
app.get('/SIGN_UP', routes.sign_up);
app.get('/CHECKUSERNAME', routes.checkUserName);
app.get('/LOGOUT', routes.logout);
app.get('/gameroomlist', routes.gameroomlist);
app.get('/CREATEROOM', routes.createroom);

app.post('/JOIN_ROOM', function (req, res, next) {
    req.roomname = req.body.roomname;
    req.game = req.body.game;
    req.playerCount = req.body.playerCount;
    req.peer_1p_id = roominfo[req.roomname].peer_id;
    next();
}, routes.joinRoom);

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

app.post('/ROOM_ADMIN', function (req, res, next) {
    req.roomname = req.body.insert_name;
    req.game = req.body.insert_game;
    req.playerCount = req.body.insert_player;

    roominfo[req.roomname] = {game: req.game, playerCount: req.playerCount, peer_id: 0};
    next();
}, routes.createroom_post);

app.post('/LOGIN', function (req, res, next) {
    req.username = req.body.username;
    req.password = myHash(req.body.password);
    next();
}, routes.login_post);

app.post('/LOGINMOBILE', function (req, res, next) {
    console.log('모바일 접속');
    req.username = req.body.userId;
    req.password = myHash(req.body.password);
    next();
}, routes.moblie_login_post);

var socket_ids = [];

function registerUser(socket, nickname) {
    socket.get('nickname', function (err, pre_nick) {
        socket.get('room', function (error, room) {
            if (pre_nick != undefined) delete socket_ids[pre_nick];
            socket_ids[nickname] = {id: socket.id, nickname: nickname, roomname: room};
            socket.set('nickname', nickname, function () {
            });
        });
    });
}

function getRoomlist(data) {
    var roomlist = [];
    for (var key in data) {
        if (key.indexOf("/") > -1) {
            roomlist.push({
                roomname: key.split("/").join(""),
                no_of_persons: data[key].length,
                game: roominfo[key.split("/").join("")].game,
                playerCount: roominfo[key.split("/").join("")].playerCount
            });
        }
    }
    return roomlist;
}

function getRoomSocketId(nickname) {
    for (var socketid in socket_ids) {
        if (socketid == nickname) {
            return socket_ids[socketid];
        }
    }
    return -1;
}

io.set('log level', 2);

io.sockets.on('connection', function (socket) {
    socket.emit('new');

    //방 입장
    socket.on('join', function (data) {
        socket.join(data.roomname);
        socket.set('room', data.roomname);
        socket.get('room', function (error, room) {
        });
    });

    //웹 페이지 데이터값 받기
    socket.on('webSingUp', function (data) {
        registerUser(socket, data);
    });

    //폰 등록
    socket.on('UUID', function (uuid, userid) {
        routes.checkid(userid, uuid);
        registerUser(socket, userid);
    });

    //버튼 입력 처리
    socket.on('btn', function (data) {
        socket.get('nickname', function (err, nickname) {
            var room = getRoomSocketId(nickname + '_webPage');
            var playerlist = io.sockets.manager.rooms["/" + room.roomname];
            if (room !== -1) {
                if (playerlist[0] === room.id)//todo 수정
                    io.sockets.in(room.room).emit('btn_1', data);
                else
                    io.sockets.in(room.room).emit('btn_2', data);
            }
        });
    });

    socket.on('btn_web', function (data) {
        socket.get('nickname', function (err, nickname) {
            var room = getRoomSocketId(nickname);
            var playerlist = io.sockets.manager.rooms["/" + room.roomname];

            if (room !== -1) {
                if (playerlist[0] === room.id)//todo 수정
                    io.sockets.in(room.room).emit('btn_1', data);
                else
                    io.sockets.in(room.room).emit('btn_2', data);
            }
        });
    });

    //방향키 입력 처리
    socket.on('pad', function (data, flag) {
        socket.get('nickname', function (err, nickname) {
            var room = getRoomSocketId(nickname + '_webPage');
            var playerlist = io.sockets.manager.rooms["/" + room.roomname];
            if (room !== -1) {
                if (playerlist[0] === room.id)//todo 수정
                    io.sockets.in(room.room).emit('pad_1', data, flag);
                else
                    io.sockets.in(room.room).emit('pad_2', data, flag);
            }// if
        });
    });

    socket.on('pad_web', function (data, flag) {
        socket.get('nickname', function (err, nickname) {
            var room = getRoomSocketId(nickname);
            var playerlist = io.sockets.manager.rooms["/" + room.roomname];
            if (room !== -1) {
                if (playerlist[0] === room.id)//todo 수정
                    io.sockets.in(room.room).emit('pad_1', data, flag);
                else
                    io.sockets.in(room.room).emit('pad_2', data, flag);
            }// if
        });
    });

    //방 목록 요청 : 방 정보(방 이름, 채팅 참여 인원)
    socket.on('request_room_list', function () {
        var roomlist = [];
        roomlist = getRoomlist(io.sockets.manager.rooms);
        socket.emit('roomlist', roomlist);
    });

    //연결 해제
    socket.on('disconnect', function () {


        //닉네임 등록 해제
        socket.get('nickname', function (err, nickname) {
            //방 정보 해제
            if (nickname != undefined) {
                if (nickname.indexOf('_webPage') != -1) {
                    socket.get('room', function (error, room) {
                        io.sockets.in(room).emit('reStart');
                        socket.leave(room);
                    });
                }
                delete socket_ids[nickname];
            }
        });
    });

    socket.on('save_1p_peer_id', function (data) {
        socket.get('room', function (error, room) {
            roominfo[room].peer_id = data.peer_1p_id;
        });
    });
});
