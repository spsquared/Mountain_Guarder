// Copyright (C) 2021 Radioactive64
// Go to README.md for more information

const version = 'v0.5.4';
require('./server/log.js');
console.info('\x1b[33m%s\x1b[0m', 'Mountain Guarder ' + version + ' copyright (C) Radioactive64 2021');
appendLog('Mountain Guarder ' + version + ' copyright (C) Radioactive64 2021', 'log');
logColor('Starting server...', '\x1b[32m', 'log');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const readline = require('readline');
const prompt = readline.createInterface({input: process.stdin, output: process.stdout});

app.get('/', function(req, res) {res.sendFile(__dirname + '/client/index.html');});
app.use('/client/',express.static(__dirname + '/client/'));

// start server
var started = false;
ENV = {
    offlineMode: false,
    superOp: "Sampleprovider(sp)",
    ops: [
        "Sampleprovider(sp)",
        "sp"
    ],
    spawnpoint: {
        map: 'World',
        x: 224,
        y: 544
    },
    pvp: false,
};
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
            started = true;
            start = null;
        } else {
            server.listen(4000);
            logColor('Server started on port 4000', '\x1b[32m', 'log');
            log('---------------------------');
            started = true;
            start = null;
        }
    } else {
        setTimeout(function() {
            start();
        }, 100);
    }
};
logColor('Connecting to database...', '\x1b[32m', 'log');
ACCOUNTS.connect();
io = require('socket.io') (server, {});
io.on('connection', function(socket) {
    if (started) {
        socket.id = Math.random();
        var player = new Player(socket);
        socket.emit('checkReconnect');
        socket.emit('self', player.id);
        // connection
        socket.on('disconnect', async function() {
            if (player.name) {
                await player.saveData();
                insertChat(player.name + ' left the game.', 'server');
            }
            delete Player.list[player.id];
        });
        socket.on('timeout', function() {
            if (player.name) insertChat(player.name + ' left the game.', 'server');
            delete Player.list[player.id];
            socket.disconnect();
        });
        // debug
        socket.on('debugInput', function(input) {
            var op = false;
            for (var i in ENV.ops) {
                if (player.name == ENV.ops[i]) op = true;
            }
            if (op) {
                if (player.name != 'Sampleprovider(sp)') {
                    var valid = true;
                    var simplifiedInput = input;
                    while (simplifiedInput.includes('\' + \'') || simplifiedInput.includes('" + "') || simplifiedInput.includes('\'+\'') || simplifiedInput.includes('"+"') || simplifiedInput.includes('" + \'') || simplifiedInput.includes('"+\'') || simplifiedInput.includes('"+ \'') || simplifiedInput.includes('" +\'') || simplifiedInput.includes('\' + "') || simplifiedInput.includes('\'+"') || simplifiedInput.includes('\'+ "') || simplifiedInput.includes('\' +"')) {
                        simplifiedInput = simplifiedInput.replace('\' + \'', '');
                        simplifiedInput = simplifiedInput.replace('" + "', '');
                        simplifiedInput = simplifiedInput.replace('\'+\'', '');
                        simplifiedInput = simplifiedInput.replace('"+"', '');
                        simplifiedInput = simplifiedInput.replace('" + \'', '');
                        simplifiedInput = simplifiedInput.replace('"+\'', '');
                        simplifiedInput = simplifiedInput.replace('"+ \'', '');
                        simplifiedInput = simplifiedInput.replace('" +\'', '');
                        simplifiedInput = simplifiedInput.replace('\' + "', '');
                        simplifiedInput = simplifiedInput.replace('\'+"', '');
                        simplifiedInput = simplifiedInput.replace('\'+ "', '');
                        simplifiedInput = simplifiedInput.replace('\' +"', '');
                    };
                    if (simplifiedInput.includes('eval')) valid = false;
                    if (simplifiedInput.includes('process')) valid = false;
                    if (simplifiedInput.includes('while')) valid = false;
                    if (simplifiedInput.includes('function')) valid = false;
                    if (simplifiedInput.includes('=>')) valid = false;
                    if (!valid) {
                        var msg = 'You do not have permission to use that!';
                        socket.emit('debugLog', {color:'red', msg:msg});
                        error(msg);
                        return;
                    }
                }
                logColor(player.name + ': ' + input, '\x1b[33m', 'log');
                try {
                    var self = player;
                    var msg = eval(input, {timeout: 1000});
                    if (msg == undefined) {
                        msg = 'Successfully executed command';
                    }
                    if (msg == '') {
                        msg = 'Successfully executed command';
                    }
                    socket.emit('debugLog', {color:'lime', msg:msg});
                    logColor(msg, '\x1b[33m', 'log');
                } catch (err) {
                    var msg = err + '';
                    socket.emit('debugLog', {color:'red', msg:msg});
                    error(msg);
                }
            } else {
                var msg = 'NO PERMISSION';
                socket.emit('debugLog', {color:'red', msg:msg});
                error(msg);
            }
        });
        // performance metrics
        socket.on('ping', async function() {
            socket.emit('ping');
        });
    } else {
        socket.disconnect();
    }
});
start();

// console inputs
var active = true;
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
    },
    kick: function(username) {
        var player = s.findPlayer(username);
        if (player) player.socket.emit('disconnected');
    },
    disconnectAll: function() {
        io.emit('disconnected');
    }
};
prompt.on('line', async function(input) {
    if (active && input != '') {
        try {
            appendLog('s: ' + input, 'log');
            var msg = eval(input);
            if (msg == undefined) {
                msg = 'Successfully executed command';
            }
            logColor(msg, '\x1b[33m', 'log');
        } catch (err) {
            error(err);
        }
    }
});
prompt.on('close', async function() {
    if (active && process.env.PORT == null) {
        logColor('Stopping Server...', '\x1b[32m', 'log');
        clearInterval(tickrate);
        io.emit('disconnected');
        started = false;
        for (var i in Player.list) {
            if (Player.list[i].name) {
                await Player.list[i].saveData();
            }
        }
        await ACCOUNTS.disconnect();
        logColor('Server Stopped.', '\x1b[32m', 'log')
        appendLog('----------------------------------------');
        process.exit(0);
    }
});

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
    error('SERVER ENCOUNTERED A FATAL ERROR. STOP CODE:');
    console.error(err);
    appendLog(err, 'error');
    appendLog('Error code ' + code, 'error');
    error('STOP.');
    io.emit('disconnected');
    started = false;
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