// Copyright (C) 2021 Radioactive64

const version = 'v0.1.2';
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
};
function resetCanvas(ctx) {
    ctx.getContext('2d').imageSmoothingEnabled = false;
    ctx.getContext('2d').webkitImageSmoothingEnabled = false;
    ctx.getContext('2d').mozImageSmoothingEnabled = false;
};
function resetCanvases() {
    LAYERS.map0.width = window.innerWidth*dpr;
    LAYERS.map0.height = window.innerHeight*dpr;
    LAYERS.mlower.scale(dpr, dpr);
    resetCanvas(LAYERS.map0);
    LAYERS.entity0.width = window.innerWidth*dpr;
    LAYERS.entity0.height = window.innerHeight*dpr;
    LAYERS.elower.scale(dpr, dpr);
    resetCanvas(LAYERS.entity0);
    LAYERS.map1.width = window.innerWidth*dpr;
    LAYERS.map1.height = window.innerHeight*dpr;
    LAYERS.mupper.scale(dpr, dpr);
    resetCanvas(LAYERS.map1);
    LAYERS.entity1.width = window.innerWidth*dpr;
    LAYERS.entity1.height = window.innerHeight*dpr;
    LAYERS.eupper.scale(dpr, dpr);
    resetCanvas(LAYERS.entity1);
    CTXRAW.width = window.innerWidth*dpr;
    CTXRAW.height = window.innerHeight*dpr;
    CTX.scale(dpr, dpr);
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
document.getElementById('ctx').addEventListener('dblclick', function(e) {e.preventDefault()});
// version
document.getElementById('version').innerText = version;

window.onerror = function(err) {
    insertChat({
        text: 'An error occurred: ' + err,
        style: 'color: #FF0000;'
    });
};
window.onoffline = function(e){
    socket.emit('timeout');
};

// important sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};