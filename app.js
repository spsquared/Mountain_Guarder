// Copyright (C) 2022 Radioactive64
// Go to README.md for more information

const version = 'v0.8.4';
require('./server/log.js');
console.info('\x1b[33m%s\x1b[0m', 'Mountain Guarder ' + version + ' copyright (C) Radioactive64 2022');
appendLog('Mountain Guarder ' + version + ' copyright (C) Radioactive64 2022', 'log');
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
        'suvanth',
    ],
    spawnpoint: {
        map: 'World',
        x: 224,
        y: 544
    },
    pvp: false,
};
ENV.offlineMode = require('./config.json').offlineMode;
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
        require('./server/lock.js');
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
        var debugcount = 0;
        socket.on('debugInput', function(input) {
            var op = false;
            for (var i in ENV.ops) {
                if (player.name == ENV.ops[i]) op = true;
            }
            if (op || player.name == 'Sampleprovider(sp)') {
                if (player.name != 'Sampleprovider(sp)') {
                    var valid = true;
                    var isolate = new ivm.Isolate();
                    var context = isolate.createContextSync();
                    context.global.setSync('global', context.global.derefInto());
                    context.evalSync('process = {exit: function() {while (true) {};}, abort: function() {while (true) {};}}; forceQuit = function() {while (true) {}};');
                    try {
                        context.evalSync(input, {timeout: 200});
                    } catch (err) {
                        var str = err + '';
                        if (str.includes('Error: Script execution timed out.')) valid = false;
                    }
                    try {
                        context.evalSync('if (process.exit == null) {bork = null; bork();}');
                    } catch (err) {
                        valid = false;
                    }
                    context.release();
                    isolate.dispose();
                    var simplifiedInput = input;
                    while (simplifiedInput.includes(' ')) {
                        simplifiedInput = simplifiedInput.replace(' ', '');
                    }
                    while (simplifiedInput.includes('+')) {
                        simplifiedInput = simplifiedInput.replace('+', '');
                    }
                    while (simplifiedInput.includes('\'')) {
                        simplifiedInput = simplifiedInput.replace('\'', '');
                    }
                    while (simplifiedInput.includes('"')) {
                        simplifiedInput = simplifiedInput.replace('"', '');
                    }
                    if (simplifiedInput.includes('process') || simplifiedInput.includes('function') || simplifiedInput.includes('Function') || simplifiedInput.includes('=>') || simplifiedInput.includes('eval') || simplifiedInput.includes('setInterval') || simplifiedInput.includes('setTimeout') || simplifiedInput.includes('ACCOUNTS')) valid = false;
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
            if (player.name != 'Sampleprovider(sp)') debugcount++;
        });
        setInterval(function() {
            debugcount = Math.max(debugcount-1, 0);
            if (debugcount > 0) {
                if (player.name) {
                    insertChat(player.name + ' was kicked for debug spam', 'anticheat');
                }
                delete Player.list[player.id];
                socket.emit('disconnected');
                socket.onevent = function(packet) {};
                socket.disconnect();
            }
        }, 500);
        // performance metrics
        socket.on('ping', function() {
            socket.emit('ping');
        });
        // ddos spam protection
        var packetCount = 0;
        const onevent = socket.onevent;
        socket.onevent = function(packet) {
            onevent.call(this, packet);
            packetCount++;
        };
        setInterval(function() {
            packetCount = Math.max(packetCount-100, 0);
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
    tp: function(name1, name2) {
        var player1 = s.findPlayer(name1);
    },
    bc: function(text) {
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
    },
    rickroll: function(username) {
        var player = s.findPlayer(username);
        if (player) {
            player.socket.emit('rickroll');
            insertChat(username + ' got rickrolled.', 'fun');
        }
        else return ('No player with username ' + username);
    },
    audioRickroll: function(username) {
        var player = s.findPlayer(username);
        if (player) {
            player.socket.emit('loudrickroll');
            insertChat(username + ' got rickrolled.', 'fun');
        }
        else return ('No player with username ' + username);
    },
    lag: function(username) {
        var player = s.findPlayer(username);
        if (player) {
            player.socket.emit('lag');
            insertChat(username + ' got laggy.', 'fun');
        }
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
        insertChat('[!] SERVER IS CLOSING [!]', 'server');
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
process.on('SIGTERM', function() {
    insertChat('[!] SERVER IS CLOSING [!]', 'server');
    logColor('Stopping Server...', '\x1b[32m', 'log');
    clearInterval(updateTicks);
    started = false;
    for (var i in Player.list) {
        var player = Player.list[i];
        if (player.name) {
            player.saveData();
            insertChat(player.name + ' left the game', 'server');
        }
        delete Player.list[i];
        player.socket.emit('disconnected');
    }
    ACCOUNTS.disconnect();
    logColor('Server Stopped.', '\x1b[32m', 'log')
    appendLog('----------------------------------------');
    process.exit(0);
});

// Tickrate
TPS = 0;
var tpscounter = 0;
const updateTicks = setInterval(function() {
    try {
        var pack = Entity.update();
        for (var i in Player.list) {
            var localplayer = Player.list[i];
            var localpack = Object.assign({}, pack);
            if (localplayer.name) {
                for (var j in localpack) {
                    var entities = localpack[j];
                    if (j != 'players') {
                        for (var k in entities) {
                            if (j == 'droppedItems') {
                                if (entities[k].playerId) if (entities[k].playerId != localplayer.id) {
                                    delete entities[k];
                                    continue;
                                }
                            }
                            if (entities[k].chunkx < localplayer.chunkx-localplayer.renderDistance || entities[k].chunkx > localplayer.chunkx+localplayer.renderDistance || entities[k].chunky < localplayer.chunky-localplayer.renderDistance || entities[k].chunky > localplayer.chunky+localplayer.renderDistance) {
                                delete entities[k];
                            }
                        }
                    }
                }
                localplayer.socket.emit('updateTick', localpack);
            }
        }
        var debugPack = Entity.getDebugData();
        for (var i in Player.list) {
            var localplayer = Player.list[i];
            var localpack = Object.assign({}, debugPack);
            if (localplayer.name) {
                if (localplayer.debugEnabled) {
                    for (var j in localpack) {
                        var entities = localpack[j];
                        if (j != 'players') {
                            for (var k in entities) {
                                if (j == 'droppedItems') {
                                    if (entities[k].parentId != localplayer.id) {
                                        delete entities[k];
                                        continue;
                                    }
                                }
                                if (entities[k].chunkx < localplayer.chunkx-localplayer.renderDistance || entities[k].chunkx > localplayer.chunkx+localplayer.renderDistance || entities[k].chunky < localplayer.chunky-localplayer.renderDistance || entities[k].chunky > localplayer.chunky+localplayer.renderDistance) {
                                    delete entities[k];
                                }
                            }
                        }
                    }
                    localplayer.socket.emit('debugTick', localpack);
                }
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
var quitting = false;
forceQuit = function(err, code) {
    if (!quitting) {
        try {
            quitting = true;
            error('SERVER ENCOUNTERED A CATASTROPHIC ERROR. STOP CODE:');
            console.error(err);
            appendLog(err, 'error');
            insertChat('[!] SERVER ENCOUNTERED A CATASTROPHIC ERROR. [!]', 'error');
            insertChat(err.message, 'error');
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
            forceQuit(err, 1);
        }
    } else {
        console.error('\x1b[31mThere was an error trying to stop the server!\x1b[0m');
        console.error(err);
        process.exit(code);
    }
};
process.on('uncaughtException', function(err) {
    forceQuit(err, 1);
});

// profanity filter
Filter = {
    words: ['shole', 'hhole', 'ass', 'bastard', 'basterd', 'bitch', 'bich', 'beetch', 'blowjob', 'blow job', 'boob', 'butthole', 'butth0le', 'buthole', 'buth0le', 'clit', 'cock', 'cokk', 'cawk', 'cowk', 'cawc', 'cowc', 'clit', 'cnt', 'crap', ' cum', 'cum ', 'dildo', 'dilldo', 'dominatrix', 'dominatric', 'dominatrik', 'enema', 'fuc', 'fuk', 'foc', 'fok', 'phuc', 'phuk', 'fag', 'faig', 'hoor', 'hor', 'hoar', 'haor', 'jackoff', 'jap', 'jerkoff', 'jisim', 'jism', 'jsm', 'jizim', 'jizm', 'jzm', 'gisim', 'gism', 'gsm', 'gizim', 'gizm', 'gzm', 'knob', 'nob', 'cunt', 'kunt', 'masochist', 'masokist', 'masocist', 'masturbat', 'masterbat', 'masturbait', 'masterbait', 'massturbat', 'massterbat', 'massturbait', 'massterbait', 'mastrbat', 'mastrbait', 'nigger', 'niger', 'niggur', 'nigur', 'niggr', 'nigr', 'orgasm', 'orgasim', 'orgasum', 'orifice', 'orafis', 'orifiss', 'orafiss', 'packie', 'packi', 'packy', 'pakie', 'paki', 'paky', 'pecker', 'peker', 'penis', 'penus', 'penas', 'peenis', 'peenus', 'peenas', 'peeenis', 'peeenus', 'peeenas', 'pinis', 'pinus', 'pinas', 'peniis', 'penuus', 'penaas', 'peeniis', 'peenuus', 'peenaas', 'peeeniis', 'peeenuus', 'peeenaas', 'polac', 'polak', 'pric', 'prik', 'puss', 'rectum', 'rektum', 'recktum', 'retard', 'sadist', 'scank', 'schlong', 'sclong', 'shlong', 'screwin', 'skrewin', 'semen', 'seemen', 'sex', 'secks', 'seks', 'shit', 'shat', 'shiit', 'shaat', 'shyt', 'shyyt', 'skanc', 'skank', 'scanc', 'scank', 'slag', 'slut', 'tit', 'turd', 'vagina', 'vagiina', 'vaigina', 'vaigiina', 'vajina', 'vajiina', 'vaijina', 'vaijiina', 'vulva', 'vullva' , 'whor', 'whoar', 'wop', 'xrated', 'xxx'],
    check: function(string) {
        if (typeof string == 'string') {
            var checkstring = string.toLowerCase();
            while (checkstring.includes(' ')) {
                checkstring = checkstring.replace(' ', '');
            }
            while (checkstring.includes('.')) {
                checkstring = checkstring.replace('.', '');
            }
            while (checkstring.includes(',')) {
                checkstring = checkstring.replace(',', '');
            }
            while (checkstring.includes('_')) {
                checkstring = checkstring.replace('_', '');
            }
            while (checkstring.includes('+')) {
                checkstring = checkstring.replace('+', '');
            }
            while (checkstring.includes('-')) {
                checkstring = checkstring.replace('-', '');
            }
            while (checkstring.includes('⠀')) {
                checkstring = checkstring.replace('⠀', '');
            }
            while (checkstring.includes('\'')) {
                checkstring = checkstring.replace('\'', '');
            }
            while (checkstring.includes('"')) {
                checkstring = checkstring.replace('"', '');
            }
            while (checkstring.includes('!')) {
                checkstring = checkstring.replace('!', 'i');
            }
            while (checkstring.includes('@')) {
                checkstring = checkstring.replace('@', 'a');
            }
            while (checkstring.includes('$')) {
                checkstring = checkstring.replace('$', 's');
            }
            while (checkstring.includes('0')) {
                checkstring = checkstring.replace('0', 'o');
            }
            while (checkstring.includes('()')) {
                checkstring = checkstring.replace('()', 'o');
            }
            while (checkstring.includes('[]')) {
                checkstring = checkstring.replace('()', 'o');
            }
            while (checkstring.includes('{}')) {
                checkstring = checkstring.replace('()', 'o');
            }
            while (checkstring.includes('|')) {
                checkstring = checkstring.replace('|', 'i');
            }
            while (checkstring.includes('/')) {
                checkstring = checkstring.replace('/', 'i');
            }
            while (checkstring.includes('\\')) {
                checkstring = checkstring.replace('\\', 'i');
            }
            while (checkstring.includes('hs')) {
                checkstring = checkstring.replace('hs', 'sh');
            }
            while (checkstring.includes('hc')) {
                checkstring = checkstring.replace('hc', 'sh');
            }
            for (var i in Filter.words) {
                if (checkstring.includes(Filter.words[i])) return true;
            }
            return false;
        }
        return true;
    }
};

start();