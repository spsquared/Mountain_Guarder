// Copyright (C) 2021 Radioactive64
// Go to README.md for more information

const version = 'heroku testing';
console.info('\x1b[33m%s\x1b[0m', 'Mountain Guarder ' + version + ' copyright (C) Radioactive64 2021');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const readline = require('readline');
const prompt = readline.createInterface({input: process.stdin, output: process.stdout});

console.log('start things')
app.get('/', function(req, res) {res.sendFile(__dirname + '/client/index.html');});
app.use('/client',express.static(__dirname + '/client'));
console.log('got stuff')

// start server
require('./server/log.js');
require('./server/collision.js');
require('./server/entity.js');
require('./server/maps.js');
console.log('get files')

if (process.env.PORT) {
    server.listen(process.env.PORT);
} else {
    server.listen(4000);
    logColor('Server started on port 4000', '\x1b[32m', 'log');
    log('---------------------------');
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

// console inputs
prompt.on('line', async function(input) {
    try {
        appendLog(input, 'log');
        var command = Function('return (' + input + ')')();
        var msg = await command;
        if (msg == undefined) {
            msg = 'Successfully executed command';
        }
        logColor(msg, '\x1b[33m', 'log');
    } catch (err) {
        error('ERROR: "' + input + '" is not a valid input.');
        error(err);
    }
});
prompt.on('close', function() {
    appendLog('----------------------------------------');
    process.exit();
});

// Tickrate
TPS = 0;
var tpscounter = 0;
setInterval(function() {
    // update tick
    var pack = Entity.update();
    io.emit('updateTick', pack);
    tpscounter++;
}, 1000/20);
setInterval(async function() {
    TPS = tpscounter;
    tpscounter = 0;
}, 1000);