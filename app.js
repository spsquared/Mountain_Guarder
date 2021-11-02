// Copyright (C) 2021 Radioactive64
// Go to README.md for more information

const version = 'v0.5.0';
console.info('\x1b[33m%s\x1b[0m', 'Mountain Guarder ' + version + ' copyright (C) Radioactive64 2021');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const readline = require('readline');
const prompt = readline.createInterface({input: process.stdin, output: process.stdout});

app.get('/', function(req, res) {res.sendFile(__dirname + '/client/index.html');});
app.use('/client/',express.static(__dirname + '/client/'));

// start server
ENV = {
    offlineMode: false,
    spawnpoint: {
        map: 'World',
        x: 224,
        y: 544
    },
    pvp: false,
};
require('./server/log.js');
require('./server/collision.js');
require('./server/inventory.js');
require('./server/entity.js');
require('./server/maps.js');
require('./server/database.js');
function start() {
    if (ACCOUNTS.connected) {
        if (process.env.PORT) {
            server.listen(process.env.PORT);
            logColor('Server started.', '\x1b[32m', 'log')
            log('---------------------------');
            start = null;
        } else {
            server.listen(4000);
            logColor('Server started on port 4000', '\x1b[32m', 'log');
            log('---------------------------');
            start = null;
        }
    } else {
        setTimeout(function() {
            start();
        }, 100);
    }
};
start();

// connections
SOCKET_LIST = [];
io = require('socket.io') (server, {});
io.on('connection', function(socket) {
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;
    var player = new Player(socket);
    socket.emit('checkReconnect');
    socket.emit('self', player.id);
    // connection
    socket.on('disconnect', function() {
        if (player.name) insertChat(player.name + ' left the game.', 'server');
        delete Player.list[player.id];
        delete SOCKET_LIST[socket.id];
    });
    socket.on('timeout', function() {
        if (player.name) insertChat(player.name + ' left the game.', 'server');
        delete Player.list[player.id];
        delete SOCKET_LIST[socket.id];
        socket.disconnect();
    });
    // performance metrics
    socket.on('ping', async function() {
        socket.emit('ping');
    });
});

// console inputs
var active = true;
prompt.on('line', async function(input) {
    if (active && input != '') {
        try {
            appendLog(input, 'log');
            var msg = eval(input)
            if (msg == undefined) {
                msg = 'Successfully executed command';
            }
            logColor(msg, '\x1b[33m', 'log');
        } catch (err) {
            error('ERROR: "' + input + '" is not a valid input.');
            error(err);
        }
    }
});
prompt.on('close', function() {
    if (active && process.env.PORT == null) {
        clearInterval(tickrate);
        appendLog('----------------------------------------');
        io.emit('disconnected');
        ACCOUNTS.disconnect();
        process.exit(0);
    }
});
const s = {
    findPlayer: function(username) {
        for (var i in Player.list) {
            if (Player.list[i].name == username) return Player.list[i];
        }
        return false;
    },
    kill: function(username) {
        var player = s.findPlayer(username);
        if (player) player.onDeath();
    }
};

// Tickrate
TPS = 0;
var tpscounter = 0;
const tickrate = setInterval(function() {
    // update tick
    var pack = Entity.update();
    io.emit('updateTick', pack);
    var debugPack = Entity.getDebugData();
    for (var i in Player.list) {
        if (Player.list[i].debugEnabled) {
            Player.list[i].socket.emit('debugTick', debugPack);
        }
    }
    tpscounter++;
}, 1000/20);
setInterval(async function() {
    TPS = tpscounter;
    tpscounter = 0;
}, 1000);

// critical errors
forceQuit = function(err, code) {
    console.error('\n');
    error('SERVER ENCOUNTERED A FATAL ERROR. STOP CODE:');
    console.error(err);
    appendLog(code, 'error');
    error('STOP.\n');
    io.emit('disconnected');
    ACCOUNTS.disconnect();
    active = false;
    console.error('\x1b[33m%s\x1b[0m', 'If this issue persists, please submit a bug report on GitHub with a screenshot of this screen and/or logfiles before this.');
    console.error('\x1b[33m%s\x1b[0m', 'Press ENTER or CTRL+C to exit.');
    const stopprompt = readline.createInterface({input: process.stdin, output: process.stdout});
    stopprompt.on('line', function(input) {
        clearInterval(tickrate);
        appendLog('----------------------------------------');
        process.exit(code);
    });
    stopprompt.on('close', function() {
        clearInterval(tickrate);
        appendLog('----------------------------------------');
        process.exit(code);
    });
};