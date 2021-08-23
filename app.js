// Copyright (C) 2021 Radioactive64
// Go to README.md for more information

const version = 'v0.0.3';
console.info('\x1b[33m%s\x1b[0m', 'Mountain Guarder ' + version + ' copyright (C) Radioactive64 2021');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const readline = require('readline');
const prompt = readline.createInterface({input: process.stdin, output: process.stdout});

app.get('/', function(req, res) {res.sendFile(__dirname + '/client/index.html');});
app.use('/client',express.static(__dirname + '/client'));

// start server
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

// Console inputs
prompt.on('line', async function(input) {
    try {
        var command = Function('return (' + input + ')')();
        var msg = await command;
        if (msg == undefined) {
            msg = 'Successfully executed command';
        }
        console.log(msg);
    } catch (err) {
        console.error(err);
    }
});
prompt.on('close', function() {
    process.exit();
});

// Tickrate
setInterval(function() {
    // update tick
    var pack = Entity.update();
    io.emit('updateTick', pack);
}, 1000/20);