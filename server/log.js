// Copyright (C) 2021 Radioactive64

const fs = require('fs');

// chat
insertChat = function(text, textcolor) {
    var time = new Date();
    var utcminute = '' + time.getUTCMinutes();
    if(utcminute.length === 1){
        utcminute = '' + 0 + utcminute;
    }
    if(utcminute == '0'){
        utcminute = '00';
    }
    var color = '#000000';
    if (textcolor == 'server') {
        color = 'server';
    } else if (textcolor == '#FFFFFF00') {
        color = 'rainbow-pulse'
    } else {
        color = textcolor;
    }
    logColor(text, '\x1b[36m', 'chat');
    var msg = '[' + time.getUTCHours() + ':' + utcminute + '] ' + text;
    io.emit('insertChat', {msg:msg, color:color});
};
// logging
log = function(text) {
    logColor(text, '', 'log');
};
logColor = function(text, colorstring, type) {
    var time = new Date();
    var minute = '' + time.getMinutes();
    if(minute.length == 1){
        minute = '' + 0 + minute;
    }
    if(minute == '0'){
        minute = '00';
    }
    console.log('[' + time.getHours() + ':' + minute + '] ' + colorstring + text + '\x1b[0m');
    appendLog('[' + time.getHours() + ':' + minute + '] ' + text, type);
};
error = function(text) {
    logColor(text, '\x1b[31m', 'error');
};
appendLog = function(text, type) {
    var typestring = '--- ';
    if (type == 'error') typestring = 'ERR ';
    if (type == 'log') typestring = 'LOG ';
    if (type == 'chat') typestring = 'CHT ';
    fs.appendFileSync('./server/log.txt', typestring + text + '\n', {encoding: 'utf-8'});
};