// Copyright (C) 2021 Radioactive64

var player = null;
var playerid = null;
mouseX = 0;
mouseY = 0;
var mapnameFade = null;
var mapnameWait = null;
settings = {
    fps: 60
};
var drawLoop = null;

// loading
var loaded = false;
// maploading
var loadedassets = 0;
var totalassets = 1;
socket.on('mapData', function(data) {
    load(data);
});
var renderDistance = 1;
var tilesetloaded = false;
var tileset = new Image();
tileset.onload = function() {
    tilesetloaded = true;
};
function load(data) {
    tileset.src = './client/maps/roguelikeSheet.png';
    totalassets = 0;
    for (var i in data) {
        totalassets++;
    }
    var wait = setInterval(async function() {
        if (tilesetloaded) {
            clearInterval(wait);
            loadEntitydata();
            for (var i in data) {
                await loadMap(data[i]);
            }
        }
    }, 100);
    var updateLoadBar = setInterval(function() {
        if (loadedassets >= totalassets) {
            clearInterval(updateLoadBar);
            loaded = true;
        }
    });
};
async function loadMap(name) {
    if (tilesetloaded) {
        var request = new XMLHttpRequest();
        request.open('GET', './client/maps/' + name + '.json', true);
        request.onload = function() {
            if (this.status >= 200 && this.status < 400) {
                var json = JSON.parse(this.response);
                renderLayers(json, name);
                loadedassets++;
            } else {
                console.error('Error: Server returned status ' + this.status);
            }
        };
        request.onerror = function(){
            console.error('There was a connection error. Please retry');
        };
        request.send();
    } else {
        await sleep(100);
        await loadMap(name);
    }
};
function renderLayers(json, name) {
    MAPS[name] = {
        width: 0,
        height: 0,
        offsetX: 0,
        offsetY: 0,
        chunkwidth: 0,
        chunks: []
    };
    for (var i in json.layers) {
        if (json.layers[i].visible) {
            if (json.layers[i].name == 'Ground Terrain') {
                MAPS[name].width = json.layers[i].width;
                MAPS[name].height = json.layers[i].height;
            }
            for (var j in json.layers[i].chunks) {
                var rawchunk = json.layers[i].chunks[j];
                MAPS[name].chunkwidth = rawchunk.width;
                MAPS[name].offsetX = Math.min(rawchunk.x*64, MAPS[name].offsetX);
                MAPS[name].offsetY = Math.min(rawchunk.y*64, MAPS[name].offsetY);
                var templower = new OffscreenCanvas(rawchunk.width * 64, rawchunk.height * 64);
                var tempupper = new OffscreenCanvas(rawchunk.width * 64, rawchunk.height * 64);
                if (MAPS[name].chunks[rawchunk.y/rawchunk.width]) if (MAPS[name].chunks[rawchunk.y/rawchunk.width][rawchunk.x/rawchunk.width]) {
                    templower = MAPS[name].chunks[rawchunk.y/rawchunk.width][rawchunk.x/rawchunk.width].lower;
                    tempupper = MAPS[name].chunks[rawchunk.y/rawchunk.width][rawchunk.x/rawchunk.width].upper;
                }
                var tlower = templower.getContext('2d');
                var tupper = tempupper.getContext('2d');
                resetCanvas(tempupper);
                resetCanvas(templower);
                for (var k in rawchunk.data) {
                    var tileid = rawchunk.data[k];
                    if (tileid != 0) {
                        tileid--;
                        var imgx = (tileid % 86)*17;
                        var imgy = ~~(tileid / 86)*17;
                        var dx = (k % rawchunk.width)*16;
                        var dy = ~~(k / rawchunk.width)*16;
                        if (json.layers[i].name.includes('Above')) {
                            tupper.drawImage(tileset, Math.round(imgx), Math.round(imgy), 16, 16, Math.round(dx*4), Math.round(dy*4), 64, 64);
                        } else {
                            tlower.drawImage(tileset, Math.round(imgx), Math.round(imgy), 16, 16, Math.round(dx*4), Math.round(dy*4), 64, 64);
                        }
                    }
                }
                if (MAPS[name].chunks[rawchunk.y/rawchunk.width]) {
                    MAPS[name].chunks[rawchunk.y/rawchunk.width][rawchunk.x/rawchunk.width] = {
                        upper: tempupper,
                        lower: templower
                    };
                } else {
                    MAPS[name].chunks[rawchunk.y/rawchunk.width] = [];
                    MAPS[name].chunks[rawchunk.y/rawchunk.width][rawchunk.x/rawchunk.width] = {
                        upper: tempupper,
                        lower: templower
                    };
                }
            }
        }
    }
};
function MGHC() {};

// draw
function drawFrame() {
    if (player && loadedassets >= totalassets) {
        LAYERS.mlower.clearRect(0, 0, window.innerWidth, window.innerHeight);
        LAYERS.elower.clearRect(0, 0, window.innerWidth, window.innerHeight);
        LAYERS.mupper.clearRect(0, 0, window.innerWidth, window.innerHeight);
        LAYERS.eupper.clearRect(0, 0, window.innerWidth, window.innerHeight);
        CTX.clearRect(0, 0, window.innerWidth, window.innerHeight);
        OFFSETX = -Math.max((window.innerWidth/2) - (player.x - MAPS[player.map].offsetX), Math.min((MAPS[player.map].offsetX + (MAPS[player.map].width*64)) - player.x - (window.innerWidth/2), 0));
        OFFSETY = -Math.max((window.innerHeight/2) - (player.y - MAPS[player.map].offsetY), Math.min((MAPS[player.map].offsetY + (MAPS[player.map].height*64)) - player.y - (window.innerHeight/2), 0));
        drawMap();
        CTX.drawImage(LAYERS.map0, 0, 0, window.innerWidth, window.innerHeight);
        Entity.draw();
        CTX.drawImage(LAYERS.entity0, 0, 0, window.innerWidth, window.innerHeight);
        CTX.drawImage(LAYERS.map1, 0, 0, window.innerWidth, window.innerHeight);
        CTX.drawImage(LAYERS.entity1, 0, 0, window.innerWidth, window.innerHeight);
        MGHC();
    }
};
function drawMap() {
    LAYERS.mlower.save();
    LAYERS.mlower.translate((window.innerWidth/2)-player.x,(window.innerHeight/2)-player.y);
    LAYERS.mupper.save();
    LAYERS.mupper.translate((window.innerWidth/2)-player.x,(window.innerHeight/2)-player.y);
    for (var x = player.chunkx-renderDistance; x <= player.chunkx+renderDistance; x++) {
        for (var y = player.chunky-renderDistance; y <= player.chunky+renderDistance; y++) {
            if (MAPS[player.map].chunks[y]) if (MAPS[player.map].chunks[y][x]) {
                var chunk = MAPS[player.map].chunks[y][x];
                var width = MAPS[player.map].chunkwidth;
                LAYERS.mlower.drawImage(chunk.lower, (x*width*64)+OFFSETX, (y*width*64)+OFFSETY, width*64, width*64);
                LAYERS.mupper.drawImage(chunk.upper, (x*width*64)+OFFSETX, (y*width*64)+OFFSETY, width*64, width*64);
            }
        }
    }
    LAYERS.mlower.restore();
    LAYERS.mupper.restore();
};
function resetFPS() {
    clearInterval(drawLoop);
    drawLoop = setInterval(function() {
        drawFrame();
    }, 1000/settings.fps);
};
resetFPS();

// send/recieve packets
socket.on('updateTick', function(data) {
    if (loaded) {
        Entity.update(data);
        player = Player.list[playerid];
    }
});
document.onkeydown = function(e) {
    if (!e.isTrusted) {
        socket.emit('timeout');
    }
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
    if (e.key == ' ') {
        socket.emit('keyPress', {key:'heal', state:true});
    }
    if(e.key === 'Meta' || e.key === 'Alt' || e.key === 'Control'){
        socket.emit('keyPress', {key:'up', state:false});
        socket.emit('keyPress', {key:'down', state:false});
        socket.emit('keyPress', {key:'left', state:false});
        socket.emit('keyPress', {key:'right', state:false});
        socket.emit('keyPress', {key:'heal', state:false});
    }
};
document.onkeyup = function(e) {
    if (!e.isTrusted) {
        socket.emit('timeout');
    }
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
    if (e.key == ' ') {
        socket.emit('keyPress', {key:'heal', state:false});
    }
};
document.onmousedown = function(e) {
    if (!e.isTrusted) {
        socket.emit('timeout');
    }
    if (!e.target.matches('#signinContainer') && !e.target.matches('#chatInput') && !e.target.matches('#windows') && !e.target.matches('#dropdownMenu')) {
        switch (e.button) {
            case 0:
                socket.emit('click', {button: 'left', x: e.clientX-window.innerWidth/2-OFFSETX, y: e.clientY-window.innerHeight/2-OFFSETY, state: true});
                break;
            case 2:
                socket.emit('click', {button: 'right', x: e.clientX-window.innerWidth/2-OFFSETX, y: e.clientY-window.innerHeight-OFFSETY, state: true});
                break;
        }
    }
};
document.onmouseup = function(e) {
    if (!e.isTrusted) {
        socket.emit('timeout');
    }
    if (!e.target.matches('#signinContainer') && !e.target.matches('#chatInput') && !e.target.matches('#windows') && !e.target.matches('#dropdownMenu')) {
        switch (e.button) {
            case 0:
                socket.emit('click', {button: 'left', x: e.clientX-window.innerWidth/2-OFFSETX, y: e.clientY-window.innerHeight/2-OFFSETY, state: false});
                break;
            case 2:
                socket.emit('click', {button: 'right', x: e.clientX-window.innerWidth/2-OFFSETX, y: e.clientY-window.innerHeight-OFFSETY, state: false});
                break;
        }
    }
};
document.onmousemove = function(e) {
    if (!e.isTrusted) {
        socket.emit('timeout');
    }
    socket.emit('mouseMove', {x: e.clientX-window.innerWidth/2-OFFSETX, y: e.clientY-window.innerHeight/2-OFFSETY});
};
socket.on('region', function(name) {
    clearInterval(mapnameFade);
    clearTimeout(mapnameWait);
    document.getElementById('regionName').innerText = name;
    var opacity = 0;
    mapnameFade = setInterval(function() {
        opacity += 0.04;
        document.getElementById('regionName').style.opacity = opacity;
        if (opacity >= 1) {
            clearInterval(mapnameFade);
            fade = null;
        }
    }, 20);
    mapnameWait = setTimeout(function() {
        opacity = 1;
        mapnameFade = setInterval(function() {
            opacity -= 0.02;
            document.getElementById('regionName').style.opacity = opacity;
            if (opacity <= 0) {
                clearInterval(mapnameFade);
                fade = null;
            }
        }, 20);
    }, 6000);
});
socket.on('updateSelf', function(data) {
    document.getElementById('statsHPvalue').style.width = (data.hp/data.maxHP)*100 + '%';
    document.getElementById('statsHPtext').innerText = data.hp + '/' + data.maxHP;
    document.getElementById('statsXPvalue').style.width = (data.xp/data.maxXP)*100 + '%';
    document.getElementById('statsXPtext').innerText = data.xp + '/' + data.maxXP;
    document.getElementById('statsMNvalue').style.width = (data.mana/data.maxMana)*100 + '%';
    document.getElementById('statsMNtext').innerText = data.mana + '/' + data.maxMana;
});
socket.on('self', function(id) {
    playerid = id;
});
socket.on('playerDied', function() {
    document.getElementById('respawnButton').style.display = 'none';
    document.getElementById('deathScreen').style.display = 'block';
    var time = 5;
    document.getElementById('respawnTimer').innerText = time;
    var timer = setInterval(function() {
        time--;
        document.getElementById('respawnTimer').innerText = time;
        if (time == 0) {
            clearInterval(timer);
            document.getElementById('respawnButton').style.display = 'block';
        }
    }, 1000);
});
function respawn() {
    socket.emit('respawn');
    document.getElementById('respawnButton').style.display = 'none';
    document.getElementById('deathScreen').style.display = 'none';
};

// automove prevention
document.addEventListener("visibilitychange",function(){
    socket.emit('keyPress', {key:'up', state:false});
    socket.emit('keyPress', {key:'down', state:false});
    socket.emit('keyPress', {key:'left', state:false});
    socket.emit('keyPress', {key:'right', state:false});
    socket.emit('keyPress', {key:'heal', state:false});
});

// menu buttons
var menuopen = false;
function toggleDropdown() {
    if (menuopen) {
        document.getElementById('dropdownMenuItems').style.display = 'none';
        menuopen = false;
    } else {
        document.getElementById('dropdownMenuItems').style.display = 'block';
        menuopen = true;
    }
};
var inventoryWindow = new DraggableWindow('inventory');
var settingsWindow = new DraggableWindow('settings');
function openInventory() {
    inventoryWindow.show();
    toggleDropdown();
};
function openSettings() {
    settingsWindow.show();
    toggleDropdown();
};

// chat
socket.on('insertChat', function(data) {
    insertChat(data);
});
function insertChat(data) {
    var time = new Date();
    var minute = '' + time.getMinutes();
    if(minute.length == 1){
        minute = '' + 0 + minute;
    }
    if(minute == '0'){
        minute = '00';
    }
    var msg = document.createElement('div');
    msg.style = data.style;
    msg.innerText = '[' + time.getHours() + ':' + minute + '] ' + data.text;
    document.getElementById('chatText').appendChild(msg);
    console.log(msg)
};