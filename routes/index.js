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

//route functions
// Main (page: 0)
exports.index = function (req, res) {
    if (req.session.login === 'login') {
        res.redirect('/gameroomlist');
        return;
    }
    res.status(200);
    res.render('index', {
        title: 'OldGame',
        page: 0,
        url: req.url,
        login: req.session.login,
        username: req.session.username
    });
};

exports.login_post = function (req, res) {
    Member.findOne({username: req.username, password: req.password}, function (err, member) {
        if (member != null) {
            req.session.login = 'login';
            req.session.username = req.username;
            res.status(200);
            res.redirect('/gameroomlist');
            console.log('로그인 성공');
        }
        else {
            res.status(100);
            res.redirect('/');
        }
    });
};

exports.gameroomlist = function (req, res) {
    if (req.session.login !== 'login') {
        res.redirect('/');
        return;
    }

    res.render('gameroomlist', {
        title: 'OldGame',
        login: req.session.login,
        username: req.session.username,
        url: req.url
    });
};

exports.moblie_login_post = function (req, res) {
    res.status(200);
    Member.findOne({username: req.username, password: req.password}, function (err, member) {
        if (member != null) {
            res.json({status: 200, username: req.username});
            console.log("성공");
        }
        else {
            res.json({status: 100, username: req.username});
            console.log("실패");
        }
    });
};

exports.logout = function (req, res) {
    req.session.login = 'logout';

    res.status(200);
    res.redirect('/');
};

exports.sign_up = function (req, res) {
    res.status(200);

    res.render('sign_up', {
        title: 'Sign up',
        url: req.url,
        page: 5,
        login: req.session.login,
        username: req.session.username,
        existingUsername: 'null'
    });

};

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

exports.sign_up_post = function (req, res) {
    res.status(200);

    var curUsername = req.username;
    if (curUsername == "") {
        res.redirect('/SIGN_UP');
    } else {
        Member.findOne({username: curUsername}, function (err, member) {
            if (err) return handleError(err);

            if (member == null) {
                var myMember = new Member({username: curUsername, password: req.password});
                myMember.save(function (err, data) {
                    if (err) {
                        console.log("error");
                    }
                    console.log('member is inserted');
                });
                res.redirect('/');
            }
            else {
                res.redirect('/SIGN_UP');
            }
        });
    }
};

exports.createroom = function (req, res) {
    if (req.session.login !== 'login') {
        res.redirect('/');
        return;
    }

    res.render('createroom', {
        title: 'OldGame',
        url: req.url,
        page: 7,
        login: req.session.login,
        username: req.session.username
    });
};

exports.createroom_post = function (req, res) {
    if (req.session.login !== 'login') {
        res.redirect('/');
        return;
    }

    res.render('jsnes', {
        title: 'OldGame',
        url: req.url,
        page: 6,
        login: req.session.login,
        username: req.session.username,
        roomname: req.roomname,
        game: req.game,
        playerCount: req.playerCount
    });
};

exports.joinRoom = function (req, res) {
    if (req.session.login !== 'login') {
        res.redirect('/');
        return;
    }

    res.render('jsnes', {
        title: 'OldGame',
        url: req.url,
        page: 7,
        login: req.session.login,
        username: req.session.username,
        roomname: req.body.roomname
    });
};

exports.checkid = function (userId, uuid) {
    Member.findOne({username: userId}, function (err, member) {
        if (member != null) {
            Member.update({uuid: uuid}, function (err) {
                console.log("데이터 저장됨");
            });
            console.log("1 찾았다");
        }
        else {
            console.log("해당하는 uuid값에 대한 정보가 없습니다.");
        }
    });
};