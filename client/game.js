// Copyright (C) 2021 Radioactive64

var player = null;
var playerid = null;
var mouseX = 0;
var mouseY = 0;
var mapnameFade = null;
var mapnameWait = null;

// maps
var mapsloaded = 0;
var totalmaps = 1;
socket.on('mapData', function(data) {
    totalmaps = 0;
    for (var i in data) {
        totalmaps++;
    }
    for (var i in data) {
        loadMap(data[i]);
    }
});
function loadMap(name) {
    if (tilesetloaded) {
        var request = new XMLHttpRequest();
        request.open('GET', './client/maps/' + name + '.json', true);
        request.onload = function() {
            if (this.status >= 200 && this.status < 400) {
                var json = JSON.parse(this.response);
                renderLayers(json, name);
                mapsloaded++;
            } else {
                console.error('Error: Server returned status ' + this.status);
            }
        };
        request.onerror = function(){
            console.error('There was a connection error. Please retry');
        };
        request.send();
    } else {
        setTimeout(function() {
            loadMap(name);
        }, 100);
    }
};
var renderDistance = 1;
var tilesetloaded = false;
var tileset = new Image();
tileset.src = './client/maps/roguelikeSheet.png';
tileset.onload = function() {
    tilesetloaded = true;
};
function renderLayers(json, name) {
    MAPS[name] = {
        width: json.width,
        chunkwidth: 0,
        chunks: []
    };
    for (var i in json.layers) {
        if (json.layers[i].visible) {
            for (var j in json.layers[i].chunks) {
                var rawchunk = json.layers[i].chunks[j];
                MAPS[name].chunkwidth = rawchunk.width;
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

// draw
setInterval(function() {
    if (player && mapsloaded >= totalmaps) {
        LAYERS.mlower.clearRect(0, 0, window.innerWidth, window.innerHeight);
        LAYERS.elower.clearRect(0, 0, window.innerWidth, window.innerHeight);
        LAYERS.mupper.clearRect(0, 0, window.innerWidth, window.innerHeight);
        LAYERS.eupper.clearRect(0, 0, window.innerWidth, window.innerHeight);
        CTX.clearRect(0, 0, window.innerWidth, window.innerHeight);
        drawMap();
        CTX.drawImage(LAYERS.map0, 0, 0, window.innerWidth, window.innerHeight);
        Entity.draw();
        CTX.drawImage(LAYERS.entity0, 0, 0, window.innerWidth, window.innerHeight);
        CTX.drawImage(LAYERS.map1, 0, 0, window.innerWidth, window.innerHeight);
    }
}, 1000/60);
function drawMap() {
    LAYERS.mlower.save();
    LAYERS.mlower.translate((window.innerWidth/2)-player.x,(window.innerHeight/2)-player.y);
    LAYERS.mupper.save();
    LAYERS.mupper.translate((window.innerWidth/2)-player.x,(window.innerHeight/2)-player.y);
    for (var i = player.chunkx-renderDistance; i <= player.chunkx+renderDistance; i++) {
        for (var j = player.chunky-renderDistance; j <= player.chunky+renderDistance; j++) {
            if (MAPS[player.map].chunks[j]) if (MAPS[player.map].chunks[j][i]) {
                var chunk = MAPS[player.map].chunks[j][i];
                var width = MAPS[player.map].chunkwidth;
                LAYERS.mlower.drawImage(chunk.lower, i*width*64, j*width*64, width*64, width*64);
                LAYERS.mupper.drawImage(chunk.upper, i*width*64, j*width*64, width*64, width*64);
            }
        }
    }
    LAYERS.mlower.restore();
    LAYERS.mupper.restore();
};

// send/recieve packets
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
document.onmousedown = function(e) {
    switch (e.button) {
        case 0:
            socket.emit('click', {button: 'left', x: e.clientX-window.innerWidth/2, y: e.clientY-window.innerHeight/2, state: true});
            break;
        case 2:
            socket.emit('click', {button: 'right', x: e.clientX-window.innerWidth/2, y: e.clientY-window.innerHeight, state: true});
            break;
    }
};
document.onmouseup = function(e) {
    switch (e.button) {
        case 0:
            socket.emit('click', {button: 'left', x: e.clientX-window.innerWidth/2, y: e.clientY-window.innerHeight/2, state: false});
            break;
        case 2:
            socket.emit('click', {button: 'right', x: e.clientX-window.innerWidth/2, y: e.clientY-window.innerHeight, state: false});
            break;
    }
};
document.onmousemove = function(e) {
    socket.emit('mouseMove', {x: e.clientX-window.innerWidth/2, y: e.clientY-window.innerHeight/2});
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
}

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
    // something to do with css and time and stuff
});

// player wierdness
socket.on('self', function(id) {
    playerid = id;
});