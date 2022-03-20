// Copyright (C) 2022 Radioactive64
// Go to README.md for more information

const version = 'v0.9.1';
require('./server/log.js');
console.info('\x1b[33m%s\x1b[0m', 'Mountain Guarder ' + version + ' copyright (C) Radioactive64 2022');
appendLog('Mountain Guarder ' + version + ' copyright (C) Radioactive64 2022', 'log');
logColor('Starting server...', '\x1b[32m', 'log');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const vm = require('vm');
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
    offlineMode: require('./config.json').offlineMode,
    useDiscordWebhook: require('./config.json').useDiscordWebhook,
    ops: [
        'Sampleprovider(sp)',
        'suvanth',
        'spuhh'
    ],
    devs: [
        'Sampleprovider(sp)'
    ],
    spawnpoint: {
        map: 'World',
        x: 224,
        y: 544
    },
    pvp: false,
    difficulty: 1,
    itemDespawnTime: 5,
    isBetaServer: false
};
if (process.env.IS_BETA == 'true') ENV.isBetaServer = true;
require('./server/collision.js');
require('./server/inventory.js');
require('./server/entity.js');
require('./server/maps.js');
require('./server/database.js');
require('./server/chatlog.js');
function start() {
    if (ACCOUNTS.connected) {
        require('./server/lock.js');
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
io = require('socket.io')(server, {});
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
            if (typeof input == 'string') {
                var op = false;
                var dev = false;
                for (var i in ENV.ops) {
                    if (player.name == ENV.ops[i]) op = true;
                }
                for (var i in ENV.devs) {
                    if (player.name == ENV.devs[i]) dev = true;
                }
                if (dev || op || player.name == 'Sampleprovider(sp)') {
                    if (input.indexOf('/') == 0) {
                        try {
                            var cmd = '';
                            var arg = input.replace('/', '');
                            while (true) {
                                cmd += arg[0];
                                arg = arg.replace(arg[0], '');
                                if (arg[0] == ' ') {
                                    arg = arg.replace(arg[0], '');
                                    break;
                                }
                                if (arg == '') break;
                            }
                            var args = [];
                            var i = 0;
                            while (true) {
                                if (args[i]) args[i] += arg[0];
                                else args[i] = arg[0];
                                arg = arg.replace(arg[0], '');
                                if (arg[0] == ' ') {
                                    arg = arg.replace(arg[0], '');
                                    i++;
                                }
                                if (arg == '') break;
                            }
                            logColor(player.name + ': ' + input, '\x1b[33m', 'log');
                            if (s[cmd]) {
                                try {
                                    var self = player;
                                    var msg = s[cmd](args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14], args[15]);
                                    socket.emit('debugLog', {color:'lime', msg:msg});
                                    logColor(msg, '\x1b[33m', 'log');
                                } catch (err) {
                                    var msg = err + '';
                                    socket.emit('debugLog', {color:'red', msg:msg});
                                    error(msg);
                                }
                            } else {
                                var msg = '/' + cmd + ' is not an existing command. Try /help for help';
                                socket.emit('debugLog', {color:'red', msg:msg});
                                error(msg);
                            }
                        } catch (err) {
                            error(err);
                        }
                    } else if (dev || player.name == 'Sampleprovider(sp)') {
                        if (player.name != 'Sampleprovider(sp)') {
                            var valid = true;
                            var isolate = new ivm.Isolate();
                            var context = isolate.createContextSync();
                            context.global.setSync('global', context.global.derefInto());
                            context.evalSync('process = {exit: function() {while (true) {};}, abort: function() {while (true) {};}}; forceQuit = function() {while (true) {}}; Player.list = []; socket = {emit: \'oDh6$\'};');
                            try {
                                context.evalSync(input, {timeout: 200});
                            } catch (err) {
                                var str = err + '';
                                if (str.includes('Error: Script execution timed out.')) valid = false;
                            }
                            try {
                                context.evalSync('if (process.exit == null || typeof Player.list != \'object\' || socket.emit != \'oDh6$\') {bork = null; bork();}');
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
                    }
                } else {
                    var msg = 'NO PERMISSION';
                    socket.emit('debugLog', {color:'red', msg:msg});
                    error(msg);
                }
            } else {
                insertChat(self.name + ' was kicked for socket.emit', 'anticheat');
                socket.emit('disconnected');
                socket.onevent = function(packet) {};
                socket.disconnect();
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
s = {
    help: function() {
        var str = '';
        for (var i in s) {
            str += i;
            str += '\n';
        }
        return str;
    },
    findPlayer: function(username) {
        for (var i in Player.list) {
            if (Player.list[i].name == username) return Player.list[i];
        }
        return false;
    },
    kill: function(username) {
        var player = s.findPlayer(username);
        if (player) player.onDeath(null, 'debug');
        else return 'No player with username ' + username;
    },
    kick: function(username) {
        var player = s.findPlayer(username);
        if (player) player.socket.emit('disconnected');
        else return 'No player with username ' + username;
    },
    kickAll: function() {
        io.emit('disconnected');
    },
    tp: function(name1, name2) {
        var player1 = s.findPlayer(name1);
        var player2 = s.findPlayer(name1);
        if (player1) {
            if (player2) {
                player1.teleport(player2.map, player2.gridx, player2.gridy, player2.layer);
            } else return 'No player with username ' + name2;
        } else return 'No player with username ' + name1;
    },
    bc: function(text) {
        insertChat('[BC]: ' + text, 'server');
    },
    spawnMonster: function(type, x, y, map, layer) {
        var monster = new Monster(type, parseInt(x), parseInt(y), map, parseInt(layer));
        return monster;
    },
    slaughter: function() {
        for (var i in Monster.list) {
            Monster.list[i].onDeath();
        }
        return 'Slaughtered all monsters';
    },
    nuke: function(username) {
        var player = s.findPlayer(username);
        if (player) {
            for (var i = 0; i < 50; i++) {
                new Monster('cherrybomb', player.x, player.y, player.map, player.layer);
            }
        } else return 'No player with username ' + username;
    },
    give: function(username, item) {
        var player = s.findPlayer(username);
        if (player) player.inventory.addItem(item);
        else return 'No player with username ' + username;
    },
    rickroll: function(username) {
        var player = s.findPlayer(username);
        if (player) {
            player.socket.emit('rickroll');
            insertChat(username + ' got rickrolled.', 'fun');
        } else return 'No player with username ' + username;
    },
    audioRickroll: function(username) {
        var player = s.findPlayer(username);
        if (player) {
            player.socket.emit('loudrickroll');
            insertChat(username + ' got rickrolled.', 'fun');
        } else return 'No player with username ' + username;
    },
    lag: function(username) {
        var player = s.findPlayer(username);
        if (player) {
            player.socket.emit('lag');
            insertChat(username + ' got laggy.', 'fun');
        } else return 'No player with username ' + username;
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
process.on('SIGINT', function() {
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
var consecutiveTimeouts = 0;
tickTimeCounter = 0;
const update = `
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
                localplayer.socket.emit('debugTick', {
                    data: localpack,
                    tps: TPS,
                    tickTime: tickTimeCounter
                });
            }
        }
    }
} catch (err) {
    forceQuit(err, 1);
}
`;
const updateTicks = setInterval(function() {
    if (started) {
        try {
            var start = new Date();
            vm.runInThisContext(update, {timeout: 1000});
            var current = new Date();
            tickTimeCounter = current-start;
        } catch (err) {
            insertChat('[!] Server tick timed out! [!]', 'error');
            error('Server tick timed out!');
            consecutiveTimeouts++;
            if (consecutiveTimeouts > 5) {
                insertChat('[!] Internal server error! Resetting server... [!]', 'error');
                error('Internal server error! Resetting server...');
                Monster.list = [];
                Projectile.list = [];
                DroppedItem.list = [];
                Particle.list = [];
                resetMaps();
            }
            if (consecutiveTimeouts > 4) {
                insertChat('[!] Internal server error! Killing all monsters... [!]', 'error');
                error('Internal server error! Killing all monsters...');
                for (var i in Monster.list) {
                    Monster.list[i].onDeath();
                }
            }
        }
        tpscounter++;
    }
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
            if (!err.message.includes('https://discord.com/api/webhooks/')) insertChat(err.message, 'error');
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
            if (process.env.PORT) {
                log('Heroku server detected, automatically stopping server.');
                appendLog('----------------------------------------');
                process.exit(code);
            }
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