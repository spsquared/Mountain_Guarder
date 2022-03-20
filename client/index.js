// Copyright (C) 2022 Radioactive64

const version = 'v0.9.1';
var firstload = false;
// canvas
CTXRAW = document.getElementById('ctx');
CTX = CTXRAW.getContext('2d');
MAPS = [];
NO_OFFSCREENCANVAS = false;
if (typeof OffscreenCanvas == 'undefined') NO_OFFSCREENCANVAS = true;
function createCanvas(w, h) {
    if (NO_OFFSCREENCANVAS) {
        var canvas = document.createElement('canvas');
        canvas.width = w || 1;
        canvas.height = h || 1;
        return canvas;
    } else {
        return new OffscreenCanvas(w || 1, h || 1);
    }
};
LAYERS = {
    map0: createCanvas(),
    entity0: null,
    mapvariables: [],
    entitylayers: [],
    map1: createCanvas(),
    entity1: createCanvas(),
    mlower: null,
    elower: null,
    mvariables: [],
    elayers: [],
    mupper: null,
    eupper: null
};
LAYERS.mlower = LAYERS.map0.getContext('2d');
LAYERS.mupper = LAYERS.map1.getContext('2d');
LAYERS.eupper = LAYERS.entity1.getContext('2d');
OFFSETX = 0;
OFFSETY = 0;
// global
mouseX = 0;
mouseY = 0;
loaded = false;
settings = {
    fps: 60,
    renderDistance: 1,
    renderQuality: 100,
    particles: true,
    dialogueSpeed: 5,
    pointerLock: false,
    useController: false,
    chatBackground: false,
    chatSize: 2,
    highContrast: false,
    debug: false
};
keybinds = {
    up: 'w',
    down: 's',
    left: 'a',
    right: 'd',
    heal: ' ',
    use: 0,
    second: 2,
    chat: 't',
    settings: null,
    inventory: 'e',
    inventoryEquips: 'i',
    inventoryCrafting: 'c',
    map: 'm'
};

// canvas scaling and pixelation
DPR = 1;
SCALE = settings.renderQuality/100;
if (window.devicePixelRatio) {
    DPR = window.devicePixelRatio;
    SCALE = (settings.renderQuality/100)*DPR;
}

window.onresize = function() {
    if (window.devicePixelRatio) {
        DPR = window.devicePixelRatio;
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
    SCALE = (settings.renderQuality/100)*DPR;
    LAYERS.map0.width = window.innerWidth*SCALE;
    LAYERS.map0.height = window.innerHeight*SCALE;
    LAYERS.mlower.scale(SCALE, SCALE);
    resetCanvas(LAYERS.map0);
    for (var i in LAYERS.mapvariables) {
        LAYERS.mapvariables[i].width = window.innerWidth*SCALE;
        LAYERS.mapvariables[i].height = window.innerHeight*SCALE;
        LAYERS.mvariables[i].scale(SCALE, SCALE);
        resetCanvas(LAYERS.mapvariables[i]);
    }
    for (var i in LAYERS.entitylayers) {
        LAYERS.entitylayers[i].width = window.innerWidth*SCALE;
        LAYERS.entitylayers[i].height = window.innerHeight*SCALE;
        LAYERS.elayers[i].scale(SCALE, SCALE);
        resetCanvas(LAYERS.entitylayers[i]);
    }
    LAYERS.map1.width = window.innerWidth*SCALE;
    LAYERS.map1.height = window.innerHeight*SCALE;
    LAYERS.mupper.scale(SCALE, SCALE);
    resetCanvas(LAYERS.map1);
    LAYERS.entity1.width = window.innerWidth*SCALE;
    LAYERS.entity1.height = window.innerHeight*SCALE;
    LAYERS.eupper.scale(SCALE, SCALE);
    resetCanvas(LAYERS.entity1);
    CTXRAW.width = window.innerWidth*SCALE;
    CTXRAW.height = window.innerHeight*SCALE;
    CTX.scale(SCALE, SCALE);
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
document.getElementById('ctx').addEventListener('dragstart', function(e) {e.preventDefault()});
document.getElementById('fade').addEventListener('dragstart', function(e) {e.preventDefault()});
document.getElementById('deathScreen').addEventListener('dragstart', function(e) {e.preventDefault()});
document.getElementById('regionName').addEventListener('dragstart', function(e) {e.preventDefault()});
document.getElementById('stats').addEventListener('dragstart', function(e) {e.preventDefault()});
document.getElementById('chatText').addEventListener('dragstart', function(e) {e.preventDefault()});
document.getElementById('dropdownMenu').addEventListener('dragstart', function(e) {e.preventDefault()});
document.getElementById('windows').addEventListener('dragstart', function(e) {e.preventDefault()});
document.getElementById('loadingContainer').addEventListener('dragstart', function(e) {e.preventDefault()});

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

// disconnections
socket.on('checkReconnect', function() {
    if (firstload) {
        window.location.reload();
    }
    firstload = true;
});
socket.on('disconnect', function() {
    document.getElementById('disconnectedContainer').style.display = 'block';
});
socket.on('disconnected', function() {
    document.getElementById('disconnectedContainer').style.display = 'block';
    socket.emit('disconnected');
});

// pointer lock
var pointerLocked = false;
setInterval(function() {
    if (document.pointerLockElement == document.body) pointerLocked = true;
    else {
        pointerLocked = false;
        document.getElementById('crossHair').style.top = '-11px';
        document.getElementById('crossHair').style.left = '-11px';
    }
}, 50);

// not rickrolling
const onevent = socket.onevent;
setInterval(function() {
    socket.onevent = function(packet) {
        onevent.call(this, packet);
    };
    socket.off('rickroll');
    socket.on('rickroll', function() {
        loaded = false;
        MAPS = null;
        LAYERS = null;
        Player.animations = null;
        Monster.images = null;
        Projectile.images = null;
        Inventory.itemImages = null;
        Inventory.itemHighlightImages = null;
        socket.emit('disconnected');
        socket.disconnect();
        window.onerror = function() {};
        document.body.innerHTML = '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&loop=1&rel=0&controls=0&disablekb=1" width=' + window.innerWidth + ' height=' + window.innerHeight + ' style="position: absolute; top: -2px; left: -2px;"></iframe><div style="position: absolute; top: 0px, left: 0px; width: 100vw; height: 100vh; z-index: 100;"></div>';
        document.body.style.overflow = 'hidden';
    });
    socket.off('loudrickroll');
    socket.on('loudrickroll', function() {
        var rickroll = new Audio();
        rickroll.src = './client/sound/music/400BeesInsideOfAKnee.mp3';
        rickroll.oncanplay = function() {
            rickroll.play();
        };
    });
    socket.on('lag', function() {
        var str = 'a';
        setInterval(function() {
            setInterval(function() {
                str = str + str;
                console.error(str);
            });
            insertChat = null;
        })
    });
});

// important sleep function
function sleep(ms) {
    return new Promise(function(resolve, reject) {setTimeout(resolve, ms)});
};