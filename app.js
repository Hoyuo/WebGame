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
var session = require('express-session');
var favicon = require('serve-favicon');
var url = require('url');

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

//roominfo
var roominfo = [];

//all environment
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(require('express-method-override')('method_override_param_name'));
app.use(session({secret: 'keyboard cat', resave: false, saveUninitialized: true}));
app.use(express.static(path.join(__dirname, '/views')));
app.use(createSession());
app.engine('ejs', engine);

//처음 접속
app.get('/', routes.index);

//회원가입페이지이동
app.get('/SIGN_UP', routes.sign_up);

//회원가입
app.post('/SIGN_UP', function (req, res, next) {
    if (req.body.password === req.body.confirm_password) {
        req.username = req.body.username;
        req.password = myHash(req.body.password);
        next();
    }
    /* else {
     res.redirect('/SIGN_UP');
     }*/
}, routes.sign_up_post);

//중복아이디확인
app.get('/CHECKUSERNAME', routes.checkUserName);

//로그인처리
app.post('/LOGIN', function (req, res, next) {
    req.username = req.body.username;
    req.password = myHash(req.body.password);
    next();
}, routes.login_post);

//모바일로그인
app.post('/LOGINMOBILE', function (req, res, next) {
    req.username = req.body.userId;
    req.password = myHash(req.body.password);
    next();
}, routes.moblie_login_post);

//로그아웃
app.get('/LOGOUT', routes.logout);

//게임방화면(로비)
app.get('/GAMEROOMLIST', routes.GAMEROOMLIST);

//방만들기
app.get('/CREATEROOM', routes.createroom);

//중복방확인
app.get('/CHECKROOMNAME', function (req, res, next) {
    var uri = url.parse(req.url, true);
    var roomname = uri.query.id;
    if (roominfo[roomname] === undefined) {
        req.ret = false;
    } else {
        req.ret = true;
    }
    //undefined이면 방이름이 없어서 중복이 아니므로 false
    //방이름이 있으면 true
    next();
}, routes.checkRoomName);

//방참여
app.post('/JOIN_ROOM', function (req, res, next) {
    req.roomname = req.body.roomname;
    req.game = req.body.game;
    req.playerCount = req.body.playerCount;
    req.peer_1p_id = roominfo[req.roomname].peer_id;
    next();
}, routes.joinRoom);

//1P페이지이동
app.post('/ROOM_ADMIN', function (req, res, next) {
    req.roomname = req.body.roomname;
    req.game = req.body.game;
    req.playerCount = req.body.playerCount;
    next();
}, routes.createroom_post);

app.get('/ROOM_ADMIN', routes.GAMEROOMLIST);

//소켓담당부분
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
            var temp = key.split("/").join("");
            if (roominfo[temp] !== undefined) {
                roomlist.push({
                    roomname: key.split("/").join(""),
                    game: roominfo[key.split("/").join("")].game,
                    playerCount: roominfo[key.split("/").join("")].playerCount,
                    currentPlayer: data[key].length
                });
            }
        }
    }
    return roomlist;
}

//no_of_persons: data[key].length
function getRoomSocketId(nickname) {
    for (var socketid in socket_ids) {
        if (socketid === nickname) {
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

    //방 생성 후 방 정보 등록
    socket.on('roominfo', function (room) {
        roominfo[room.roomname] = {game: room.game, playerCount: room.playerCount, peer_id: 0};
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
                if (playerlist[0] === room.id) {
                    io.sockets.in(room.room).emit('btn_1', data);
                }
                else {
                    io.sockets.in(room.room).emit('btn_2', data);
                }
            }
        });
    });

    socket.on('btn_web', function (data) {
        socket.get('nickname', function (err, nickname) {
            var room = getRoomSocketId(nickname);
            var playerlist = io.sockets.manager.rooms["/" + room.roomname];

            if (room !== -1) {
                if (playerlist[0] === room.id)
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
            if (room !== -1) {
                var playerlist = io.sockets.manager.rooms["/" + room.roomname];

                if (playerlist[0] === room.id)
                    io.sockets.in(room.room).emit('pad_1', data, flag);
                else
                    io.sockets.in(room.room).emit('pad_2', data, flag);
            }// if
        });
    });

    socket.on('pad_web', function (data, flag) {
        socket.get('nickname', function (err, nickname) {
            var room = getRoomSocketId(nickname);
            if (room !== -1) {
                var playerlist = io.sockets.manager.rooms["/" + room.roomname];

                if (playerlist[0] === room.id)
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

    socket.on('check_room_info', function (data) {
        var roomlist = [];
        roomlist = getRoomlist(io.sockets.manager.rooms);
        for (var i = 0; i < roomlist.length; i++) {
            if (roomlist[i].roomname === data) {
                socket.emit('check_room_info_post', roomlist[i]);
                return;
            }
        }
        socket.emit('check_room_info_post', false);
    });

    //연결 해제
    socket.on('disconnect', function () {
        //닉네임 등록 해제
        socket.get('nickname', function (err, nickname) {
            //방 정보 해제

            if (nickname != undefined) {
                var chk = nickname.substring(nickname.length - 2, nickname.length);
                if (chk != '2p') {

                    if (nickname.indexOf('_webPage') != -1) {
                        socket.get('room', function (error, room) {
                            roominfo[room] = undefined;
                            io.sockets.in(room).emit('reStart');
                            socket.leave(room);
                        });
                    }
                    delete socket_ids[nickname];
                    routes.fireLogout(nickname.substring(0, nickname.length - 8));
                    //console.log(nickname.substring(0, nickname.length-8));
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
