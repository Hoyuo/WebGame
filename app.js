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
        socket_ids[nickname] = socket.id
    });
}

io.sockets.on('connection', function (socket) {
    socket.emit('new', {nickname : 'player' + count});

    socket.on('btn', function(data) {
        console.log("btn : " + data);
        io.sockets.emit('btn', data);

    });

    socket.on('pad', function(data, flag) {
        console.log("pad : " + data + flag);
        io.sockets.emit('pad', data, flag);

    });

    socket.on('UUID', function(data) {
       console.log("UUID : " + data);
    });

    socket.on('disconnection', function() {
        console.log('disconnection');
    })
});