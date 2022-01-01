// Copyright (C) 2021 Radioactive64
// Go to README.md for more information

const version = 'v0.7.2';
require('./server/log.js');
console.info('\x1b[33m%s\x1b[0m', 'Mountain Guarder ' + version + ' copyright (C) Radioactive64 2021');
appendLog('Mountain Guarder ' + version + ' copyright (C) Radioactive64 2021', 'log');
logColor('Starting server...', '\x1b[32m', 'log');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const ivm = require('isolated-vm');
const readline = require('readline');
const prompt = readline.createInterface({input: process.stdin, output: process.stdout});
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 100,
    max: 50,
    handler: function(req, res, options) {}
});

app.get('/', function(req, res) {res.sendFile(__dirname + '/client/index.html');});
app.use('/client/',express.static(__dirname + '/client/'));
app.use(limiter);

// start server
var started = false;
ENV = {
    offlineMode: false,
    ops: [
        'Sampleprovider(sp)',
        'Suvanth',
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
        // connection
        socket.on('disconnect', async function() {
            if (player.name) {
                await player.saveData();
                insertChat(player.name + ' left the game', 'server');
            }
            delete Player.list[player.id];
        });
        socket.on('disconnected', async function() {
            if (player.name) {
                await player.saveData();
                insertChat(player.name + ' left the game', 'server');
            }
            delete Player.list[player.id];
            socket.emit('disconnected');
        });
        socket.on('timeout', async function() {
            if (player.name) {
                await player.saveData();
                insertChat(player.name + ' left the game', 'server');
            }
            delete Player.list[player.id];
            socket.emit('disconnected');
        });
        socket.on('error', async function() {
            socket.emit('disconnected');
            if (player.name) {
                await player.saveData();
                insertChat(player.name + ' left the game', 'server');
            }
            delete Player.list[player.id];
        });
        // debug
        socket.on('debugInput', async function(input) {
            var op = false;
            for (var i in ENV.ops) {
                if (player.name == ENV.ops[i]) op = true;
            }
            if (op) {
                if (player.name != 'lol') {
                    var valid = true;
                    var isolate = new ivm.Isolate();
                    var context = isolate.createContextSync();
                    context.global.setSync('global', context.global.derefInto());
                    context.evalSync('setInterval = function() {}; setTimeout = function() {}; insertChat = function() {}; insertSingleChat = function() {}; logColor = function() {}; log = function() {}; warn = function() {}; error = function() {}; appendLog = function() {}; Collision = function() {}; Collision.getColEntity = function() {}; Collision.grid = []; Spawner = function() {}; Spawner.grid = []; Region = function() {}; Region.grid = []; Teleporter = function() {}; Teleporter.grid = []; Inventory = function() {}; Inventory.Item = function() {}; Inventory.items = {}; ACCOUNTS = {connected: 0, connect: 0, disconnect: 0, signup: 0, login: 0, deleteAccount: 0, changePassword: 0, validateCredentials: 0, loadProgress: 0, saveProgress: 0}; Entity = function() {}; Entity.update = function() {}; Entity.getDebugData = function() {}; Rig = function() {}; Npc = function() {}; Npc.update = function() {}; Npc.getDebugData = function() {}; Npc.list = []; Player = function() {}; Player.update = function() {}; Player.getDebugData = function() {}; Player.list = []; Monster = function() {}; Monster.update = function() {}; Monster.getDebugData = function() {}; Monster.list = []; Projectile = function() {}; Projectile.update = function() {}; Projectile.getDebugData = function() {}; Projectile.list = []; Particle = function() {}; Particle.update = function() {}; Particle.list = []; DroppedItem = function() {}; DroppedItem.update = function() {}; DroppedItem.list = []; io = {on: 0}; forceQuit = function() {};');
                    try {
                        context.evalSync(input, {timeout: 1000});
                    } catch (err) {
                        var str = err + '';
                        if (str.includes('Error: Script execution timed out.')) valid = false;
                    }
                    try {
                        context.evalSync('crash = null; insertChat(); insertSingleChat(); logColor(); log(); warn(); error(); appendLog(); Collision.grid[\'test\'] = []; Collision(); Collision.getColEntity(); Spawner.grid[\'test\'] = []; Spawner(); Region.grid[\'test\'] = []; Region(); Teleporter.grid[\'test\'] = []; Teleporter(); Inventory.items[\'test\'] = {}; Inventory(); Inventory.Item(); if (ACCOUNTS.connected != 0 || ACCOUNTS.connect != 0 || ACCOUNTS.disconnect != 0 || ACCOUNTS.signup != 0 || ACCOUNTS.login != 0 || ACCOUNTS.deleteAccount != 0 || ACCOUNTS.changePassword != 0 || ACCOUNTS.validateCredentials != 0 || ACCOUNTS.loadProgress != 0 || ACCOUNTS.saveProgress != 0) {crash();} Entity(); Entity.update(); Entity.getDebugData(); Rig(); Npc(); Npc.update(); Npc.getDebugData(); Npc.list[0] = \'test\'; Player(); Player.update(); Player.getDebugData(); Player.list[0] = \'test\'; Monster(); Monster.update(); Monster.getDebugData(); Monster.list[0] = \'test\'; Projectile(); Projectile.update(); Projectile.getDebugData(); Projectile.list[0] = \'test\'; Particle(); Particle.update(); Particle.list[0] = \'test\'; DroppedItem(); DroppedItem.update(); DroppedItem.list[0] = \'test\'; if (io.on != 0) {crash();} forceQuit();');
                    } catch (err) {
                        valid = false;
                    }
                    context.release();
                    isolate.dispose();
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
                    var msg = eval(input);
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
        // ddos spam protection
        var packetCount = 0;
        var onevent = socket.onevent;
        socket.onevent = function(packet) {
            onevent.call(this, packet);
            if (packet.data != 'ping') packetCount++;
        };
        setInterval(function() {
            packetCount = Math.max(packetCount-200, 0);
            if (packetCount > 0) {
                if (player.name) {
                    insertChat(player.name + ' was kicked for socket.io DOS', 'anticheat');
                }
                delete Player.list[player.id];
                socket.emit('disconnected');
                socket.onevent = function(packet) {};
                socket.disconnect();
            }
        }, 100);
    } else {
        socket.emit('disconnected');
        socket.onevent = function(packet) {};
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
        if (player) player.onDeath(null, 'debug');
        else return ('No player with username ' + username);
    },
    kick: function(username) {
        var player = s.findPlayer(username);
        if (player) player.socket.emit('disconnected');
        else return ('No player with username ' + username);
    },
    kickAll: function() {
        io.emit('disconnected');
    },
    rickRoll: function(username) {
        var player = s.findPlayer(username);
        if (player) player.socket.emit('404');
        else return ('No player with username ' + username);
    },
    broadCast: function(text) {
        insertChat('[BC]: ' + text, 'server');
    },
    spawnMonster: function(type, x, y, map) {
        var monster = new Monster(type, x, y, map);
        return monster;
    },
    give: function(username, item) {
        var player = s.findPlayer(username);
        if (player) player.inventory.addItem(item);
        else return ('No player with username ' + username);
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
        clearInterval(updateTicks);
        started = false;
        for (var i in Player.list) {
            var player = Player.list[i];
            if (player.name) {
                await player.saveData();
                insertChat(player.name + ' left the game', 'server');
            }
            delete Player.list[i];
            player.socket.emit('disconnected');
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
const updateTicks = setInterval(function() {
    try {
        var pack = Entity.update();
        io.emit('updateTick', pack);
        var debugPack = Entity.getDebugData();
        for (var i in Player.list) {
            if (Player.list[i].debugEnabled) {
                Player.list[i].socket.emit('debugTick', debugPack);
            }
        }
    } catch (err) {
        forceQuit(err, 1);
    }
    tpscounter++;
}, 1000/20);
setInterval(async function() {
    TPS = tpscounter;
    tpscounter = 0;
}, 1000);

// critical errors
forceQuit = function(err, code) {
    try {
        error('SERVER ENCOUNTERED A CATASTROPHIC ERROR. STOP CODE:');
        console.error(err);
        insertChat('SERVER ENCOUNTERED A CATASTROPHIC ERROR.', 'error');
        insertChat(err, 'error');
        appendLog(err, 'error');
        appendLog('Error code ' + code, 'error');
        error('STOP.');
        clearInterval(updateTicks);
        io.emit('disconnected');
        started = false;
        ACCOUNTS.disconnect();
        active = false;
        console.error('\x1b[33m%s\x1b[0m', 'If this issue persists, please submit a bug report on GitHub with a screenshot of this screen and/or logfiles before this.');
        console.error('\x1b[33m%s\x1b[0m', 'Press ENTER or CTRL+C to exit.');
        const stopprompt = readline.createInterface({input: process.stdin, output: process.stdout});
        stopprompt.on('line', function(input) {
            appendLog('----------------------------------------');
            process.exit(code);
        });
        stopprompt.on('close', function() {
            appendLog('----------------------------------------');
            process.exit(code);
        });
    } catch (err) {
        console.error('There was an error trying to stop the server!');
        console.error(err);
        process.exit(1);
    }
};

// profanity filter
Filter = {
    words: ['fuck', 'bitch', 'shit', 'ass', 'sex', 'fock', 'bich', 'shat', '@ss', 'a$$', 'a$s', 'as$', '@$$', '@$s', '@s$', 'fuk', 'fucc', 'shiit', 'shrex'],
    check: function(string) {
        if (typeof string == 'string') {
            var checkstring = string;
            while (checkstring.includes(' ')) {
                checkstring = checkstring.replace(' ', '');
            }
            while (checkstring.includes('_')) {
                checkstring = checkstring.replace('_', '');
            }
            while (checkstring.includes('-')) {
                checkstring = checkstring.replace('-', '');
            }
            while (checkstring.includes('⠀')) {
                checkstring = checkstring.replace('⠀', '');
            }
            for (var i in Filter.words) {
                if (checkstring.includes(Filter.words[i])) return true;
            }
            return false;
        }
        return true;
    }
};