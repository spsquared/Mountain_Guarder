// Copyright (C) 2023 Sampleprovider(sp)

const fs = require('fs');

// chat
insertChat = function insertChat(text, color) {
    var style = color;
    if (color == 'server') {
        style = 'color: #FFDD00;';
    } else if (color == 'death') {
        style = 'color: #FF0000;';
    } else if (color == 'error') {
        style = 'color: #FF0000; font-weight: bold;';
    } else if (color == 'anticheat') {
        style = 'color: #FF9900; font-weight: bold;';
    } else if (color == 'fun') {
        style = 'animation: special 2s linear infinite;';
    }
    logColor(text, '\x1b[36m', 'chat');
    io.emit('insertChat', {text:text, style:style});
    if (!ENV.offlineMode && ENV.useDiscordWebhook) try {postDiscord(text);} catch (err) {error(err);};
};
insertSingleChat = function insertSingleChat(text, color, username, log) {
    var socket = null;
    for (let i in Player.list) {
        if (Player.list[i].name == username) socket = Player.list[i].socket;
    }
    if (socket) {
        var style = color;
        if (color == 'server') {
            style = 'color: #FFDD00;';
        } else if (color == 'death') {
            style = 'color: #FF0000;';
        } else if (color == 'error') {
            style = 'color: #FF9900;';
        } else if (color == 'anticheat') {
            style = 'color: #FF0000; font-weight: bold;';
        } else if (color == 'fun') {
            style = 'animation: special 2s linear infinite;';
        }
        if (log) logColor(text, '\x1b[36m', 'chat');
        socket.emit('insertChat', {text:text, style:style});
    }
};

// logging
getTimeStamp = function getTimeStamp() {
    var time = new Date();
    var minute = '' + time.getUTCMinutes();
    if(minute.length == 1){
        minute = '' + 0 + minute;
    }
    if(minute == '0'){
        minute = '00';
    }
    return '[' + time.getUTCHours() + ':' + minute + '] ';
};
logColor = function logColor(text, colorstring, type) {
    let timestamp = getTimeStamp();
    if (process.env.DATABASE_URL) process.stdout.write(`${timestamp}${colorstring}${text}\x1b[0m\n\r> `);
    else process.stdout.write(`\r${timestamp}${colorstring}${text}\x1b[0m\n\r> `);
    appendLog(timestamp + text, type);
};
log = function log(text) {
    logColor(text, '', 'log');
};
debugLog = function debugLog(text) {
    logColor(text, '', 'debug');
};
warn = function warn(text) {
    logColor(text, '\x1b[33m', 'warn');
};
error = function error(text) {
    logColor(text, '\x1b[31m', 'error');
    if (text instanceof Error) appendLog(text.stack, 'error');
};
appendLog = function appendLog(text, type) {
    let typestring = '--- ';
    if (type == 'error') typestring = 'ERROR ';
    else if (type == 'warn') typestring = 'WARN  ';
    else if (type == 'log') typestring = 'LOG   ';
    else if (type == 'debug') typestring = 'DEBUG ';
    else if (type == 'chat') typestring = 'CHAT  ';
    fs.appendFileSync('./log.log', `${typestring}${text.replaceAll('\n', `\n${typestring}`)}\n`, {encoding: 'utf-8'}, function() {});
    if (global.ENV && !ENV.offlineMode && ENV.useDiscordWebhook && type != 'chat') try {postDebugDiscord(typestring, text.toString());} catch (err) {error(err);};
};

// console hooking (U-009E signifies message already put in logs or except from logging)
const stdout_write = process.stdout.write;
process.stdout.write = function mod_write(str, encode, fd) {
    stdout_write.apply(process.stdout, arguments);
    // may break in some edge cases (prevents logging typed characters)
    if (str.length <= 1) return;
    (typeof str != 'string' || (typeof str == 'string' && str[0] != '')) && appendLog(str, 'log');
};
const stderr_write = process.stderr.write;
process.stderr.write = function mod_write(str, encode, fd) {
    stderr_write.apply(process.stderr, arguments);
    (typeof str != 'string' || (typeof str == 'string' && str[0] != '')) && appendLog(str, 'error');
};