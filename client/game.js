// Copyright (C) 2021 Radioactive64

var player = null;
var playerid = null;

// rendering
CTXRAW = document.getElementById('ctx')
CTX = CTXRAW.getContext('2d');
MAPS = [];
LAYERS = {
    map0: new OffscreenCanvas(100, 100),
    entity0: new OffscreenCanvas(100, 100),
    map1: new OffscreenCanvas(100, 100),
    entity1: new OffscreenCanvas(100, 100),
    mlower: null,
    elower: null,
    mupper: null,
    eupper: null
};
LAYERS.mlower = LAYERS.map0.getContext('2d');
LAYERS.elower = LAYERS.entity0.getContext('2d');
LAYERS.mupper = LAYERS.map1.getContext('2d');
LAYERS.eupper = LAYERS.entity1.getContext('2d');
function drawLayers(json) {
    // meadow guarder worledit mod draw layers
};
setInterval(function() {
    if (player) {
        CTX.clearRect(0, 0, window.innerWidth, window.innerHeight);
        CTX.drawImage(MAPS['test'], player.x-window.innerWidth/2, player.y-window.innerHeight/2, window.innerWidth, window.innerHeight, 0, 0, window.innerWidth, window.innerHeight);
        CTX.save();
        CTX.translate((window.innerWidth/2)-player.x,(window.innerHeight/2)-player.y);
        Entity.draw();
        CTX.restore();
    }
}, 1000/60);

// update ticks
socket.on('updateTick', function(data) {
    Entity.update(data);
    player = Player.list[playerid];
});
document.onkeydown = function(e) {
    if (e.key == 'w' || e.key == 'W' || e.key == 'ArrowUp') {
        socket.emit('keyPress', {key:'up', state:true});
    }
    if (e.key == 's' || e.key == 'S' || e.key == 'ArrowDown') {
        socket.emit('keyPress', {key:'down', state:true});
    }
    if (e.key == 'a' || e.key == 'A' || e.key == 'ArrowLeft') {
        socket.emit('keyPress', {key:'left', state:true});
    }
    if (e.key == 'd' || e.key == 'D' || e.key == 'ArrowRight') {
        socket.emit('keyPress', {key:'right', state:true});
    }
};
document.onkeyup = function(e) {
    if (e.key == 'w' || e.key == 'W' || e.key == 'ArrowUp') {
        socket.emit('keyPress', {key:'up', state:false});
    }
    if (e.key == 's' || e.key == 'S' || e.key == 'ArrowDown') {
        socket.emit('keyPress', {key:'down', state:false});
    }
    if (e.key == 'a' || e.key == 'A' || e.key == 'ArrowLeft') {
        socket.emit('keyPress', {key:'left', state:false});
    }
    if (e.key == 'd' || e.key == 'D' || e.key == 'ArrowRight') {
        socket.emit('keyPress', {key:'right', state:false});
    }
};


MAPS['test'] = new OffscreenCanvas(3200, 3200);
var tempimage = new Image();
tempimage.src = './client/maps/The Village.png';
tempimage.onload = function() {
    resetCanvas(MAPS['test']);
    MAPS['test'].getContext('2d').drawImage(tempimage, 0, 0, 3200, 3200);
}

// player wierdness
socket.on('self', function(id) {
    playerid = id;
});