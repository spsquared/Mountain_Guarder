// Copyright (C) 2021 Radioactive64
// Go to README.md for more information

const version = 'v0.0.2';
console.info('\x1b[33m%s\x1b[0m', 'Mountain Guarder ' + version + ' copyright (C) Radioactive64 2021');
const express = require('express');
const app = express();
const server = require('http').Server(app);

app.get('/', function(req, res) {res.sendFile(__dirname + '/client/index.html');});
app.use('/client',express.static(__dirname + '/client'));

MAPS = [];
require('./server/collision.js');
require('./server/entity.js');
require('./server/maps.js');

if (process.env.PORT) {
    server.listen(process.env.PORT);
} else {
    server.listen(4000);
    console.info('\x1b[33m%s\x1b[0m', 'Server started on port 4000');
}

SOCKET_LIST = [];
io = require('socket.io') (server, {});
io.on('connection', function(socket) {
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;
    var player = new Player(socket);
    socket.emit('self', player.id);
    // connection
    socket.on('disconnect', function() {
        delete Player.list[player.id];
        delete SOCKET_LIST[socket.id];
    });
});

setInterval(function() {
    // update tick
    var pack1 = Player.update();
    var pack2 = Npc.update();
    var pack3 = Projectile.update();
    var pack = {
        players: [],
        monsters: [],
        projectiles: []
    };
    for (var i in pack1) {
        pack.players[i] = pack1[i];
    }
    for (var i in pack2) {
        pack.players[i] = pack2[i];
    }
    for (var i in pack3) {
        pack.projectiles[i] = pack3[i];
    }
    io.emit('updateTick', pack);
}, 1000/20);