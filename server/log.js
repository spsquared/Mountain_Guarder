// Copyright (C) 2021 Radioactive64

const fs = require('fs');

// chat
insertChat = function(text, textcolor) {
    var color = '#000000';
    if (textcolor == 'server') {
        color = 'server';
    } else if (textcolor == '#FFFFFF00' || textcolor == 'special') {
        color = 'rainbow-pulse'
    } else {
        color = textcolor;
    }
    logColor(text, '\x1b[36m', 'chat');
    io.emit('insertChat', {text:text, color:color});
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