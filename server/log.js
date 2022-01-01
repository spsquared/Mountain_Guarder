// Copyright (C) 2021 Radioactive64

const fs = require('fs');

// chat
insertChat = function(text, textcolor) {
    var style = '';
    if (textcolor == 'server') {
        style = 'color: #FFDD00;';
    } else if (textcolor == 'death') {
        style = 'color: #FF0000;';
    } else if (textcolor == 'error') {
        style = 'color: #FF9900;';
    } else if (textcolor == 'anticheat') {
        style = 'color: #FF0000; font-weight: bold;';
    } else {
        style = 'color: ' + textcolor + ';';
    }
    logColor(text, '\x1b[36m', 'chat');
    io.emit('insertChat', {text:text, style:style});
    postDiscord(text);
};
insertSingleChat = function(text, textcolor, username, log) {
    var socket = null;
    for (var i in Player.list) {
        if (Player.list[i].name == username) socket = Player.list[i].socket;
    }
    if (socket) {
        var style = '';
        if (textcolor == 'server') {
            style = 'color: #FFDD00;';
        } else if (textcolor == 'death') {
            style = 'color: #FF0000;';
        } else if (textcolor == 'error') {
            style = 'color: #FF9900;';
        } else if (textcolor == 'anticheat') {
            style = 'color: #FF0000; font-weight: bold;';
        } else if (textcolor == 'christmas') {
            style = 'animation: christmas 2s infinite;';
        } else {
            style = 'color: ' + textcolor + ';';
        }
        if (log) logColor(text, '\x1b[36m', 'chat');
        socket.emit('insertChat', {text:text, style:style});
    }
};

// logging
logColor = function(text, colorstring, type) {
    var time = new Date();
    var minute = '' + time.getUTCMinutes();
    if(minute.length == 1){
        minute = '' + 0 + minute;
    }
    if(minute == '0'){
        minute = '00';
    }
    console.log('[' + time.getUTCHours() + ':' + minute + '] ' + colorstring + text + '\x1b[0m');
    appendLog('[' + time.getUTCHours() + ':' + minute + '] ' + text, type);
};
log = function(text) {
    logColor(text, '', 'log');
};
warn = function(text) {
    logColor(text, '\x1b[33m', 'warn');
};
error = function(text) {
    logColor(text, '\x1b[31m', 'error');
};
appendLog = function(text, type) {
    var typestring = '--- ';
    if (type == 'error') typestring = 'ERR ';
    if (type == 'warn') typestring = '!WN ';
    if (type == 'log') typestring = 'LOG ';
    if (type == 'chat') typestring = 'CHT ';
    fs.appendFileSync('./server/log.txt', typestring + text + '\n', {encoding: 'utf-8'});
};