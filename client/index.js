// Copyright (C) 2021 Radioactive64

const version = 'v0.5.4';
var firstload = false;
// canvas
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
OFFSETX = 0;
OFFSETY = 0;
settings = {
    fps: 60,
    renderDistance: 1,
    renderQuality: 100,
    particles: true,
    chatBackground: false,
    chatSize: 2,
    debug: false
};

// canvas scaling and pixelation
var dpr = 1;
if (window.devicePixelRatio) {
    dpr = window.devicePixelRatio;
}

window.onresize = function() {
    if (window.devicePixelRatio) {
        dpr = window.devicePixelRatio;
    }
    resetCanvases();
    drawFrame();
    snapWindows();
};
function resetCanvas(ctx) {
    ctx.getContext('2d').imageSmoothingEnabled = false;
    ctx.getContext('2d').webkitImageSmoothingEnabled = false;
    ctx.getContext('2d').mozImageSmoothingEnabled = false;
};
function resetCanvases() {
    var scale = dpr*(settings.renderQuality/100);
    LAYERS.map0.width = window.innerWidth*scale;
    LAYERS.map0.height = window.innerHeight*scale;
    LAYERS.mlower.scale(scale, scale);
    resetCanvas(LAYERS.map0);
    LAYERS.entity0.width = window.innerWidth*scale;
    LAYERS.entity0.height = window.innerHeight*scale;
    LAYERS.elower.scale(scale, scale);
    resetCanvas(LAYERS.entity0);
    LAYERS.map1.width = window.innerWidth*scale;
    LAYERS.map1.height = window.innerHeight*scale;
    LAYERS.mupper.scale(scale, scale);
    resetCanvas(LAYERS.map1);
    LAYERS.entity1.width = window.innerWidth*scale;
    LAYERS.entity1.height = window.innerHeight*scale;
    LAYERS.eupper.scale(scale, scale);
    resetCanvas(LAYERS.entity1);
    CTXRAW.width = window.innerWidth*scale;
    CTXRAW.height = window.innerHeight*scale;
    CTX.scale(scale, scale);
    resetCanvas(CTXRAW);
    for (var i in MAPS) {
        for (var j in MAPS[i].chunks) {
            for (var k in MAPS[i].chunks[j]) {
                resetCanvas(MAPS[i].chunks[j][k].upper);
                resetCanvas(MAPS[i].chunks[j][k].lower);
            }
        }
    }
};
resetCanvases();

// right click and highlight prevention
document.querySelectorAll("input").forEach(function(item) {if (item.type != 'text' && item.type != 'password') {item.addEventListener('focus', function() {this.blur();});}});
document.querySelectorAll("button").forEach(function(item) {item.addEventListener('focus', function() {this.blur();});});
document.getElementById('ctx').addEventListener('contextmenu', function(e) {e.preventDefault()});
document.getElementById('fade').addEventListener('contextmenu', function(e) {e.preventDefault()});
document.getElementById('deathScreen').addEventListener('contextmenu', function(e) {e.preventDefault()});
document.getElementById('regionName').addEventListener('contextmenu', function(e) {e.preventDefault()});
document.getElementById('stats').addEventListener('contextmenu', function(e) {e.preventDefault()});
document.getElementById('chatText').addEventListener('contextmenu', function(e) {e.preventDefault()});
document.getElementById('dropdownMenu').addEventListener('contextmenu', function(e) {e.preventDefault()});
document.getElementById('windows').addEventListener('contextmenu', function(e) {e.preventDefault()});
document.getElementById('loadingContainer').addEventListener('contextmenu', function(e) {e.preventDefault()});
document.getElementById('ctx').addEventListener('dblclick', function(e) {e.preventDefault()});
document.getElementById('fade').addEventListener('dblclick', function(e) {e.preventDefault()});
document.getElementById('deathScreen').addEventListener('dblclick', function(e) {e.preventDefault()});
document.getElementById('regionName').addEventListener('dblclick', function(e) {e.preventDefault()});
document.getElementById('stats').addEventListener('dblclick', function(e) {e.preventDefault()});
document.getElementById('chatText').addEventListener('dblclick', function(e) {e.preventDefault()});
document.getElementById('dropdownMenu').addEventListener('dblclick', function(e) {e.preventDefault()});
document.getElementById('windows').addEventListener('dblclick', function(e) {e.preventDefault()});
document.getElementById('loadingContainer').addEventListener('dblclick', function(e) {e.preventDefault()});

// version
document.getElementById('version').innerText = version;

// error logging
window.onerror = function(err) {
    insertChat({
        text: 'An error occurred:\n' + err,
        style: 'color: #FF0000;'
    });
};
window.onoffline = function(e){
    socket.emit('timeout');
};
// server restarts
socket.on('checkReconnect', function() {
    if (firstload) {
        window.location.reload();
    }
    firstload = true;
});
socket.on('disconnected', function() {
    document.getElementById('disconnectedContainer').style.display = 'block';
});

// important sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};