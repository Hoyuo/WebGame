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
    uuid: 'string',
    weblogin: 'boolean',
    applogin: 'boolean',
    socketlogin: 'boolean'
});

//compiles our schema into model
var Member = mongoose.model('Member', memberSchema);

//route functions
// 메인페이지
exports.index = function (req, res) {
    if (req.session.login === 'login') {
        res.redirect('/GAMEROOMLIST');
        return;
    }
    res.status(200);

    res.render('index', {
        title: 'OldGame',
        page: 0,
        login: 'logout',
        username: '',
        check: 0
    });
};

//로그인페이지
exports.login_post = function (req, res) {
    Member.findOne({username: req.username, password: req.password}, function (err, member) {
        if (member !== null) {
            if (member.weblogin === false) {
                Member.update({username: member.username}, {$set: {weblogin: true}}, function (err) {
                });
                req.session.login = 'login';
                req.session.username = req.username;
                res.status(200);
                res.redirect('/GAMEROOMLIST');
            } else {
                res.render('index', {
                    title: 'OldGame',
                    page: 0,
                    login: 'logout',
                    username: '',
                    check: 1
                });
            }
        } else {
            res.render('index', {
                title: 'OldGame',
                page: 0,
                login: 'logout',
                username: '',
                check: 2
            });
        }
    });
};

//게임방리스트페이지
exports.GAMEROOMLIST = function (req, res) {
    if (req.session.login !== 'login') {
        res.redirect('/');
        return;
    }
    res.render('gameroomlist', {
        title: 'OldGame',
        login: req.session.login,
        username: req.session.username
    });
};

exports.moblie_login_post = function (req, res) {
    Member.findOne({username: req.username, password: req.password}, function (err, member) {
        if (member != null) {
            res.status(200);
            res.json({status: 200, username: req.username});
        }
        else {
            res.status(100);
            res.json({status: 100, username: req.username});
        }
    });
};

//로그아웃페이지
//todo uncaught Error: Syntax error, unrecognized expression: 애러 처리 해야함
exports.logout = function (req, res) {
    Member.update({username: req.session.username}, {$set: {weblogin: false}}, function (err, updated) {
        if (err || !updated) {
            console.log('logout 실패');
            if (req.session.login === 'logout') {
                res.status(200);
                res.redirect('/');
            }
        }
        else {
            console.log('logout 성공');
            req.session.login = 'logout';
            req.session.username = '';
            res.status(200);
            res.redirect('/');
        }
    });
};

//회원가입페이지
exports.sign_up = function (req, res) {
    res.status(200);

    res.render('sign_up', {
        title: 'Sign up',
        page: 1,
        login: req.session.login,
        username: req.session.username,
        existingUsername: 'null'
    });
};

//회원가입체크(중복아이디 존재 여부)
exports.checkUserName = function (req, res) {
    var uri = url.parse(req.url, true);
    Member.findOne({username: uri.query.id}, function (err, member) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        if (member != null) {
            res.end('true');
        }
        else {
            res.end('false');
        }
    });
};

//회원가입진행
exports.sign_up_post = function (req, res) {
    res.status(200);

    var curUsername = req.username;
    if (curUsername == "") {
        res.redirect('/SIGN_UP');
    } else {
        Member.findOne({username: curUsername}, function (err, member) {
            if (err) return handleError(err);

            if (member == null) {
                var myMember = new Member({
                    username: curUsername,
                    password: req.password,
                    uuid: 0,
                    weblogin: 0,
                    applogin: 0,
                    socketlogin: 0
                });
                myMember.save(function (err, data) {
                    if (err) {
                    }
                });
                res.redirect('/');
            }
            else {
                res.redirect('/SIGN_UP');
            }
        });
    }
};

//방생성페이지
exports.createroom = function (req, res) {
    if (req.session.login !== 'login') {
        res.redirect('/');
        return;
    }

    res.render('createroom', {
        title: 'OldGame',
        page: 2,
        login: req.session.login,
        username: req.session.username
    });
};

//방이름체크
exports.checkRoomName = function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    if (req.ret === true) {
        res.end('true');
    } else {
        res.end('false');
    }
}

//방생성진행
exports.createroom_post = function (req, res) {
    if (req.session.login !== 'login') {
        res.redirect('/');
        return;
    }

    if (req.roomname === undefined) {
        res.redirect('/');
        return;
    }

    res.render('jsnes', {
        title: 'OldGame',
        page: 3,
        login: req.session.login,
        username: req.session.username,
        roomname: req.roomname,
        game: req.game,
        playerCount: req.playerCount
    });
};

//방입장페이지
exports.joinRoom = function (req, res) {
    if (req.session.login !== 'login') {
        res.redirect('/');
        return;
    }

    res.render('joinroom', {
        title: 'OldGame',
        page: 4,
        login: req.session.login,
        username: req.session.username,
        roomname: req.roomname,
        game: req.game,
        playerCount: req.playerCount,
        peer_1p_id: req.peer_1p_id
    });
};


exports.checkid = function (userId, uuid) {
    Member.findOne({username: userId}, function (err, member) {
        if (member != null) {
            Member.update({uuid: uuid}, function (err) {
            });
        }
    });
};