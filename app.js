var sys = require('sys'),
    http = require('http'),
    express = require('express'),
    app = express(),
    server = http.createServer(app),
    io = require('socket.io').listen(server);

server.listen(13000);

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.send('Hello World');
});

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
    socket.emit('new');

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
                    io.sockets.socket(socket_id).emit('btn_2', data);
                else
                    io.sockets.socket(socket_id).emit('btn_1', data);
            }// if
        });
    });

    socket.on('pad', function(data, flag) {
        socket.get('nickname', function (err, nickname) {
            var iValue = nickname.indexOf('0');
            var socket_id = socket_ids['webPage'];
            if (socket_id != undefined) {
                if (iValue != -1)
                    io.sockets.socket(socket_id).emit('pad_2', data, flag);
                else
                    io.sockets.socket(socket_id).emit('pad_1', data, flag);
            }// if
        });
    });

    socket.on('disconnect', function () {
        socket.get('nickname', function (err, nickname) {
            if (nickname != undefined) {
                delete socket_ids[nickname];
            }
        });
    });
});