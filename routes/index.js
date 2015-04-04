//DataBase
//DB Connection
var mongoose = require('mongoose');
var url = require('url');

//connects to MongoDB
mongoose.connect('mongodb://210.118.74.103:27017/membership');

//get the connection from mongoose
var db = mongoose.connection;

//creates DB schma for MongoDB
var memberSchema = mongoose.Schema({
    username: 'string',
    password: 'string',
    uuid: 'string'
});

//compiles our schema into model
var Member = mongoose.model('Member', memberSchema);


////////////////////////////////////////////////////////////////


var express = require('express');
var router = express.Router();

var roomList = [];
var roomSqu = 1;
var loginUser = [];
var loginCnt = 0;

/* GET home page. */
router.get('/', function (req, res, next) {
    var errCode = req.query.errCode;

    if (errCode == null) {
        errCode = 0;
    }

    if (req.session.user_id == null) {
        res.render('login', {
            title: 'Return 1990 - Main',
            login: 'logout',
            username: '',
            errCode: errCode
        });
    }
    else {
        res.redirect('/ROOM_LIST');
    }
});

router.get('/SIGN_UP', function (req, res, next) {
    res.render('sign_up', {
        title: 'Return 1990 - SignUp',
        login: 'logout',
        username: ''
    });
});

router.get('/ROOM_LIST', function (req, res, next) {
    var errCode = req.query.errCode;

    if (errCode == null) {
        errCode = 0;
    }

    if (req.session.user_id == null) {
        res.redirect('/');
    }
    else {
        res.render('room_list', {
            title: 'Return 1990 - GameRoomList',
            login: 'login',
            username: req.session.user_id,
            roomList: roomList,
            errCode: errCode
        });
    }
});

router.get('/CHECKROOMNAME', function (req, res, next) {
    var roomName = req.query.roomName;
    var result = false;

    for (var i = 0; i < roomList.length; i++) {
        if (roomList[i].roomName == roomName) {
            result = true;
        }
    }

    if (result == true) {
        res.end('true');
    }
    else {
        res.end('false');
    }
});

router.get('/1P_OUT_ROOM', function (req, res, next) {
    var roomNum = req.query.roomNum;

    delete roomList[roomNum];

    res.redirect('/ROOM_LIST');
});


var crypto = require('crypto');
var myHash = function myHash(key) {
    var hash = crypto.createHash('sha1');
    hash.update(key);
    return hash.digest('hex');
};


/* POST Home Page */
router.post('/LOGIN', function (req, res, next) {
    Member.findOne({username: req.body.user_id}, function (err, member) {
        if (member === null) {
            res.redirect('/?errCode=1');
        }
        else {
            if (member.password !== myHash(req.body.user_pw)) {
                res.redirect('/?errCode=2');
            }
            else {
                var result = 0;

                for (var i = 0; i < loginUser.length; i++) {
                    if (loginUser[i] == req.body.user_id) {
                        result = 1;
                    }
                }

                if (result == 0) {
                    req.session.user_id = req.body.user_id;
                    loginUser[loginCnt++] = req.body.user_id;
                    res.redirect('/ROOM_LIST');
                }
                else {
                    res.redirect('/?errCode=3');
                }
            }
        }
    });
});

router.post('/CREATE_ROOM', function (req, res, next) {
    res.render('create_room', {
        title: 'Return 1990 - Create Room',
        username: req.session.user_id,
        login: 'login'
    });
});

router.post('/1P_GAME_ROOM', function (req, res, next) {
    roomList[roomSqu] = {
        roomNum: roomSqu,
        roomName: req.body.roomname,
        gameName: req.body.insert_game,
        maxPlayer: req.body.insert_player,
        currentPlayer: 1,
        peer_1p_id: null,
        peer_2p_id: null,
        user_1p_id: req.session.user_id,
        user_2p_id: null
    };

    roomSqu++;

    res.render('1p_game_room', {
        title: 'Return 1990 - 1PGameRoom',
        login: 'login',
        username: req.session.user_id,
        roomInfo: roomList[roomSqu - 1]
    });
});

router.post('/2P_GAME_ROOM', function (req, res, next) {
    var room = roomList[req.body.roomNum];

    if (room.maxPlayer == '1') {
        res.redirect('/ROOM_LIST?errCode=1');
    }
    else {
        if (room.currentPlayer == 2) {
            res.redirect('/ROOM_LIST?errCode=2');
        }
        else {
            room.currentPlayer = 2;
            room.user_2p_id = req.session.user_id;

            res.render('2p_game_room', {
                title: 'Return 1990 - 2PGameRoom',
                login: 'login',
                username: req.session.user_id,
                roomInfo: roomList[room.roomNum]
            });
        }
    }
});

var roomFind = function (userId) {
    for (var room in roomList) {
        if (userId == room.user_1p_id || userId == room.user_2p_id) {
            return room;
        }
    }
    return null;
}

module.exports = router;
module.exports.roomList = roomList;
module.exports.loginUser = loginUser;
module.exports.roomFind = roomFind;