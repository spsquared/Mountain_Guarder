// Copyright (C) 2021 Radioactive64

var player;
var playerid = 0;
mouseX = 0;
mouseY = 0;
var mapnameFade, mapnameWait;
var lastchunkx, lastchunky, lastmap;
var debugData = {};

// loading
var loaded = false;
// maploading
var loadedassets = 0;
var totalassets = 1;
socket.on('mapData', function(data) {
    load(data);
});
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
            loadEntityData();
            for (var i in data) {
                await loadMap(data[i]);
            }
            loadInventoryData();
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
                MAPS[name] = {
                    width: 0,
                    height: 0,
                    offsetX: 0,
                    offsetY: 0,
                    chunkwidth: 0,
                    chunkheight: 0,
                    chunks: [],
                    chunkJSON: []
                };
                for (var i in json.layers) {
                    if (json.layers[i].visible) {
                        if (json.layers[i].name == 'Ground Terrain') {
                            MAPS[name].width = json.layers[i].width;
                            MAPS[name].height = json.layers[i].height;
                        }
                        if (json.layers[i].chunks) {
                            for (var j in json.layers[i].chunks) {
                                var rawchunk = json.layers[i].chunks[j];
                                MAPS[name].chunkwidth = rawchunk.width;
                                MAPS[name].chunkheight = rawchunk.height;
                                MAPS[name].offsetX = Math.min(rawchunk.x*64, MAPS[name].offsetX);
                                MAPS[name].offsetY = Math.min(rawchunk.y*64, MAPS[name].offsetY);
                                if (MAPS[name].chunkJSON[rawchunk.y/rawchunk.width] == null) {
                                    MAPS[name].chunkJSON[rawchunk.y/rawchunk.width] = [];
                                }
                                if (MAPS[name].chunkJSON[rawchunk.y/rawchunk.width][rawchunk.x/rawchunk.height] == null) {
                                    MAPS[name].chunkJSON[rawchunk.y/rawchunk.width][rawchunk.x/rawchunk.height] = [];
                                }
                                MAPS[name].chunkJSON[rawchunk.y/rawchunk.width][rawchunk.x/rawchunk.width][json.layers[i].name] = rawchunk.data;
                                MAPS[name].chunkJSON[rawchunk.y/rawchunk.width][rawchunk.x/rawchunk.width][json.layers[i].name].offsetX = 0;
                                MAPS[name].chunkJSON[rawchunk.y/rawchunk.width][rawchunk.x/rawchunk.width][json.layers[i].name].offsetY = 0;
                                if (json.layers[i].offsetx) MAPS[name].chunkJSON[rawchunk.y/rawchunk.width][rawchunk.x/rawchunk.width][json.layers[i].name].offsetX = json.layers[i].offsetx;
                                if (json.layers[i].offsety) MAPS[name].chunkJSON[rawchunk.y/rawchunk.width][rawchunk.x/rawchunk.width][json.layers[i].name].offsetY = json.layers[i].offsety;
                            }
                        } else {
                            if (json.layers[i].name == 'Ground Terrain') {
                                MAPS[name].chunkwidth = json.layers[i].width;
                                MAPS[name].chunkheight = json.layers[i].height;
                            }
                            if (MAPS[name].chunkJSON[0] == null) {
                                MAPS[name].chunkJSON[0] = [[]];
                            }
                            MAPS[name].chunkJSON[0][0][json.layers[i].name] = json.layers[i].data;
                            MAPS[name].chunkJSON[0][0][json.layers[i].name].offsetX = 0;
                            MAPS[name].chunkJSON[0][0][json.layers[i].name].offsetY = 0;
                            if (json.layers[i].offsetx) MAPS[name].chunkJSON[0][0][json.layers[i].name].offsetX = json.layers[i].offsetx;
                            if (json.layers[i].offsety) MAPS[name].chunkJSON[0][0][json.layers[i].name].offsetY = json.layers[i].offsety;
                        }
                    }
                }
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
function MGHC() {};

// draw
var drawLoop = null;
function drawFrame() {
    if (player && loadedassets >= totalassets) {
        LAYERS.mlower.clearRect(0, 0, window.innerWidth, window.innerHeight);
        LAYERS.elower.clearRect(0, 0, window.innerWidth, window.innerHeight);
        LAYERS.mupper.clearRect(0, 0, window.innerWidth, window.innerHeight);
        LAYERS.eupper.clearRect(0, 0, window.innerWidth, window.innerHeight);
        CTX.clearRect(0, 0, window.innerWidth, window.innerHeight);
        OFFSETX = 0;
        OFFSETY = 0;
        if (MAPS[player.map].width*64 > window.innerWidth) OFFSETX = -Math.max((window.innerWidth/2) - (player.x - MAPS[player.map].offsetX), Math.min((MAPS[player.map].offsetX + (MAPS[player.map].width*64)) - player.x - (window.innerWidth/2), 0));
        if (MAPS[player.map].height*64 > window.innerHeight) OFFSETY = -Math.max((window.innerHeight/2) - (player.y - MAPS[player.map].offsetY), Math.min((MAPS[player.map].offsetY + (MAPS[player.map].height*64)) - player.y - (window.innerHeight/2), 0));
        drawMap();
        Entity.draw();
        CTX.drawImage(LAYERS.map0, 0, 0, window.innerWidth, window.innerHeight);
        CTX.drawImage(LAYERS.entity0, 0, 0, window.innerWidth, window.innerHeight);
        CTX.drawImage(LAYERS.map1, 0, 0, window.innerWidth, window.innerHeight);
        CTX.drawImage(LAYERS.entity1, 0, 0, window.innerWidth, window.innerHeight);
        MGHC();
        drawDebug();
    }
};
function drawMap() {
    if (lastmap != player.map) {
        for (var i in MAPS) {
            for (var j in MAPS[i].chunks) {
                delete MAPS[i].chunks[j];
            }
        }
        lastmap = player.map;
        lastchunkx = null;
        lastchunky = null;
    }
    if (player.map == 'World') {
        if (lastchunkx != player.chunkx || lastchunky != player.chunky) {
            updateRenderedChunks();
        }
    } else {
        if (MAPS[player.map].chunks[0] == undefined) {
            renderChunk(MAPS[player.map].chunkJSON[0][0], 0, 0, player.map);
        } else if (MAPS[player.map].chunks[0][0] == undefined) {
            renderChunk(MAPS[player.map].chunkJSON[0][0], 0, 0, player.map);
        }
    }
    LAYERS.mlower.save();
    LAYERS.mlower.translate((window.innerWidth/2)-player.x,(window.innerHeight/2)-player.y);
    LAYERS.mupper.save();
    LAYERS.mupper.translate((window.innerWidth/2)-player.x,(window.innerHeight/2)-player.y);
    for (var y in MAPS[player.map].chunks) {
        for (var x in MAPS[player.map].chunks[y]) {
            LAYERS.mlower.drawImage(MAPS[player.map].chunks[y][x].lower, (x*MAPS[player.map].chunkwidth*64)+OFFSETX, (y*MAPS[player.map].chunkheight*64)+OFFSETY, MAPS[player.map].chunkwidth*64, MAPS[player.map].chunkheight*64);
            LAYERS.mupper.drawImage(MAPS[player.map].chunks[y][x].upper, (x*MAPS[player.map].chunkwidth*64)+OFFSETX, (y*MAPS[player.map].chunkheight*64)+OFFSETY, MAPS[player.map].chunkwidth*64, MAPS[player.map].chunkheight*64);
        }
    }
    LAYERS.mlower.restore();
    LAYERS.mupper.restore();
};
function updateRenderedChunks() {
    for (var y in MAPS['World'].chunks) {
        for (var x in MAPS['World'].chunks[y]) {
            if (Math.abs(player.chunkx-x) > settings.renderDistance || Math.abs(player.chunky-y) > settings.renderDistance) {
                delete MAPS['World'].chunks[y][x];
            }
        }
    }
    for (var y = player.chunky-settings.renderDistance; y <= player.chunky+settings.renderDistance; y++) {
        for (var x = player.chunkx-settings.renderDistance; x <= player.chunkx+settings.renderDistance; x++) {
            if (MAPS['World'].chunkJSON[y]) if (MAPS['World'].chunkJSON[y][x]) {
                if (MAPS['World'].chunks[y] == undefined) {
                    renderChunk(MAPS['World'].chunkJSON[y][x], x, y, 'World');
                } else if (MAPS['World'].chunks[y][x] == undefined) {
                    renderChunk(MAPS['World'].chunkJSON[y][x], x, y, 'World');
                }
            }
        }
    }
    lastchunkx = player.chunkx;
    lastchunky = player.chunky;
};
function renderChunk(data, x, y, map) {
    var templower = new OffscreenCanvas(MAPS[map].chunkwidth * 64, MAPS[map].chunkheight * 64);
    var tempupper = new OffscreenCanvas(MAPS[map].chunkwidth * 64, MAPS[map].chunkheight * 64);
    var tlower = templower.getContext('2d');
    var tupper = tempupper.getContext('2d');
    resetCanvas(tempupper);
    resetCanvas(templower);
    for (var i in data) {
        for (var j in data[i]) {
            var tileid = data[i][j];
            if (tileid != 0) {
                tileid--;
                var imgx = (tileid % 86)*17;
                var imgy = ~~(tileid / 86)*17;
                var dx = (j % MAPS[map].chunkwidth)*16+data[i].offsetX;
                var dy = ~~(j / MAPS[map].chunkwidth)*16+data[i].offsetY;
                if (i.includes('Above')) {
                    tupper.drawImage(tileset, Math.round(imgx), Math.round(imgy), 16, 16, Math.round(dx*4), Math.round(dy*4), 64, 64);
                } else {
                    tlower.drawImage(tileset, Math.round(imgx), Math.round(imgy), 16, 16, Math.round(dx*4), Math.round(dy*4), 64, 64);
                }
            }
        }
    }
    if (MAPS[map].chunks[y] == null) {
        MAPS[map].chunks[y] = [];
    }
    MAPS[map].chunks[y][x] = {
        upper: tempupper,
        lower: templower
    };
};
function drawDebug() {
    if (debugData && settings.debug) {
        function getManhattanDistance(entity) {
            return Math.abs(player.x-entity.x) + Math.abs(player.y-entity.y);
        };
        CTX.save();
        CTX.translate((window.innerWidth/2)-player.x, (window.innerHeight/2)-player.y);
        // players
        for (var i in debugData.players) {
            var localplayer = debugData.players[i];
            if (localplayer.map == player.map && getManhattanDistance(localplayer) < settings.renderDistance*2*MAPS[player.map].chunkwidth*64) {
                // keys
                CTX.beginPath();
                CTX.strokeStyle = '#000000';
                CTX.lineWidth = 2;
                if (localplayer.keys.left) {
                    CTX.moveTo(localplayer.x+OFFSETX, localplayer.y+OFFSETY);
                    CTX.lineTo(localplayer.x-localplayer.width/2+OFFSETX, localplayer.y+OFFSETY);
                }
                if (localplayer.keys.right) {
                    CTX.moveTo(localplayer.x+OFFSETX, localplayer.y+OFFSETY);
                    CTX.lineTo(localplayer.x+localplayer.width/2+OFFSETX, localplayer.y+OFFSETY);
                }
                if (localplayer.keys.up) {
                    CTX.moveTo(localplayer.x+OFFSETX, localplayer.y+OFFSETY);
                    CTX.lineTo(localplayer.x+OFFSETX, localplayer.y-localplayer.height/2+OFFSETY);
                }
                if (localplayer.keys.down) {
                    CTX.moveTo(localplayer.x+OFFSETX, localplayer.y+OFFSETY);
                    CTX.lineTo(localplayer.x+OFFSETX, localplayer.y+localplayer.height/2+OFFSETY);
                }
                CTX.stroke();
                // hitbox
                CTX.beginPath();
                CTX.strokeStyle = '#FF9900';
                CTX.lineWidth = 4;
                CTX.moveTo(localplayer.x-localplayer.width/2+OFFSETX, localplayer.y-localplayer.height/2+OFFSETY);
                CTX.lineTo(localplayer.x-localplayer.width/2+OFFSETX, localplayer.y+localplayer.height/2+OFFSETY);
                CTX.lineTo(localplayer.x+localplayer.width/2+OFFSETX, localplayer.y+localplayer.height/2+OFFSETY);
                CTX.lineTo(localplayer.x+localplayer.width/2+OFFSETX, localplayer.y-localplayer.height/2+OFFSETY);
                CTX.lineTo(localplayer.x-localplayer.width/2+OFFSETX, localplayer.y-localplayer.height/2+OFFSETY);
                CTX.stroke();
            }
        }
        // monsters
        for (var i in debugData.monsters) {
            var localmonster = debugData.monsters[i];
            if (localmonster.map == player.map && getManhattanDistance(localmonster) < settings.renderDistance*2*MAPS[player.map].chunkwidth*64) {
                // keys
                CTX.beginPath();
                CTX.strokeStyle = '#000000';
                CTX.lineWidth = 2;
                if (localmonster.keys.left) {
                    CTX.moveTo(localmonster.x+OFFSETX, localmonster.y+OFFSETY);
                    CTX.lineTo(localmonster.x-localmonster.width/2+OFFSETX, localmonster.y+OFFSETY);
                }
                if (localmonster.keys.right) {
                    CTX.moveTo(localmonster.x+OFFSETX, localmonster.y+OFFSETY);
                    CTX.lineTo(localmonster.x+localmonster.width/2+OFFSETX, localmonster.y+OFFSETY);
                }
                if (localmonster.keys.up) {
                    CTX.moveTo(localmonster.x+OFFSETX, localmonster.y+OFFSETY);
                    CTX.lineTo(localmonster.x+OFFSETX, localmonster.y-localmonster.height/2+OFFSETY);
                }
                if (localmonster.keys.down) {
                    CTX.moveTo(localmonster.x+OFFSETX, localmonster.y+OFFSETY);
                    CTX.lineTo(localmonster.x+OFFSETX, localmonster.y+localmonster.height/2+OFFSETY);
                }
                CTX.stroke();
                // hitbox
                CTX.beginPath();
                CTX.strokeStyle = '#FF9900';
                CTX.lineWidth = 4;
                CTX.moveTo(localmonster.x-localmonster.width/2+OFFSETX, localmonster.y-localmonster.height/2+OFFSETY);
                CTX.lineTo(localmonster.x-localmonster.width/2+OFFSETX, localmonster.y+localmonster.height/2+OFFSETY);
                CTX.lineTo(localmonster.x+localmonster.width/2+OFFSETX, localmonster.y+localmonster.height/2+OFFSETY);
                CTX.lineTo(localmonster.x+localmonster.width/2+OFFSETX, localmonster.y-localmonster.height/2+OFFSETY);
                CTX.lineTo(localmonster.x-localmonster.width/2+OFFSETX, localmonster.y-localmonster.height/2+OFFSETY);
                CTX.stroke();
                // aggro range
                CTX.beginPath();
                CTX.strokeStyle = '#FF0000';
                CTX.fillStyle = '#FF00000F';
                CTX.lineWidth = 4;
                CTX.arc(localmonster.x+OFFSETX, localmonster.y+OFFSETY, localmonster.aggroRange*64, 0, 2*Math.PI, false);
                CTX.fill();
                CTX.stroke();
                // aggro target
                if (Player.list[localmonster.aggroTarget]) {
                    CTX.beginPath();
                    CTX.strokeStyle = '#FF0000';
                    CTX.lineWidth = 2;
                    CTX.moveTo(localmonster.x+OFFSETX, localmonster.y+OFFSETY);
                    CTX.lineTo(Player.list[localmonster.aggroTarget].x+OFFSETX, Player.list[localmonster.aggroTarget].y+OFFSETY);
                    CTX.stroke();
                }
                // path
                if (localmonster.path[0]) {
                    CTX.beginPath();
                    CTX.strokeStyle = '#0000FF';
                    CTX.lineWidth = 4;
                    CTX.moveTo(localmonster.path[0][0]*64+32+OFFSETX, localmonster.path[0][1]*64+32+OFFSETY);
                    for (var j in localmonster.path) {
                        CTX.lineTo(localmonster.path[j][0]*64+32+OFFSETX, localmonster.path[j][1]*64+32+OFFSETY);
                    }
                    CTX.stroke();
                }
            }
        }
        // projectiles
        for (var i in debugData.projectiles) {
            var localprojectile = debugData.projectiles[i];
            // hitbox
            CTX.beginPath();
            CTX.strokeStyle = '#FF9900';
            CTX.lineWidth = 4;
            CTX.moveTo(((localprojectile.width/2)*Math.cos(localprojectile.angle))-((localprojectile.height/2)*Math.sin(localprojectile.angle))+localprojectile.x+OFFSETX, ((localprojectile.width/2)*Math.sin(localprojectile.angle))+((localprojectile.height/2)*Math.cos(localprojectile.angle))+localprojectile.y+OFFSETY);
            CTX.lineTo(((localprojectile.width/2)*Math.cos(localprojectile.angle))-((-localprojectile.height/2)*Math.sin(localprojectile.angle))+localprojectile.x+OFFSETX, ((localprojectile.width/2)*Math.sin(localprojectile.angle))+((-localprojectile.height/2)*Math.cos(localprojectile.angle))+localprojectile.y+OFFSETY);
            CTX.lineTo(((-localprojectile.width/2)*Math.cos(localprojectile.angle))-((-localprojectile.height/2)*Math.sin(localprojectile.angle))+localprojectile.x+OFFSETX, ((-localprojectile.width/2)*Math.sin(localprojectile.angle))+((-localprojectile.height/2)*Math.cos(localprojectile.angle))+localprojectile.y+OFFSETY);
            CTX.lineTo(((-localprojectile.width/2)*Math.cos(localprojectile.angle))-((localprojectile.height/2)*Math.sin(localprojectile.angle))+localprojectile.x+OFFSETX, ((-localprojectile.width/2)*Math.sin(localprojectile.angle))+((localprojectile.height/2)*Math.cos(localprojectile.angle))+localprojectile.y+OFFSETY);
            CTX.lineTo(((localprojectile.width/2)*Math.cos(localprojectile.angle))-((localprojectile.height/2)*Math.sin(localprojectile.angle))+localprojectile.x+OFFSETX, ((localprojectile.width/2)*Math.sin(localprojectile.angle))+((localprojectile.height/2)*Math.cos(localprojectile.angle))+localprojectile.y+OFFSETY);
            CTX.stroke();
            // angle
            CTX.beginPath();
            CTX.strokeStyle = '#000000';
            CTX.lineWidth = 2;
            CTX.moveTo(localprojectile.x+OFFSETX, localprojectile.y+OFFSETY);
            CTX.lineTo(((localprojectile.width/2)*Math.cos(localprojectile.angle))+localprojectile.x+OFFSETX, ((localprojectile.width/2)*Math.sin(localprojectile.angle))+localprojectile.y+OFFSETY);
            CTX.stroke();
        }
        CTX.restore();
    }
};
function resetFPS() {
    clearInterval(drawLoop);
    drawLoop = setInterval(function() {
        drawFrame();
    }, 1000/settings.fps);
};
resetFPS();

// io
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
    if (!inchat) {
        if (e.key == 'w' || e.key == 'W' || e.key == 'ArrowUp') {
            socket.emit('keyPress', {key:'up', state:true});
        } else if (e.key == 's' || e.key == 'S' || e.key == 'ArrowDown') {
            socket.emit('keyPress', {key:'down', state:true});
        } else if (e.key == 'a' || e.key == 'A' || e.key == 'ArrowLeft') {
            socket.emit('keyPress', {key:'left', state:true});
        } else if (e.key == 'd' || e.key == 'D' || e.key == 'ArrowRight') {
            socket.emit('keyPress', {key:'right', state:true});
        } else if (e.key == ' ') {
            socket.emit('keyPress', {key:'heal', state:true});
        } else if (e.key == 'Enter') {
            document.getElementById('chatInput').focus();
        } else if (e.key == 'Meta' || e.key == 'Alt' || e.key == 'Control'){
            socket.emit('keyPress', {key:'up', state:false});
            socket.emit('keyPress', {key:'down', state:false});
            socket.emit('keyPress', {key:'left', state:false});
            socket.emit('keyPress', {key:'right', state:false});
            socket.emit('keyPress', {key:'heal', state:false});
        }
    }
};
document.onkeyup = function(e) {
    if (!e.isTrusted) {
        socket.emit('timeout');
    } else if (e.key == 'w' || e.key == 'W' || e.key == 'ArrowUp') {
        socket.emit('keyPress', {key:'up', state:false});
    } else if (e.key == 's' || e.key == 'S' || e.key == 'ArrowDown') {
        socket.emit('keyPress', {key:'down', state:false});
    } else if (e.key == 'a' || e.key == 'A' || e.key == 'ArrowLeft') {
        socket.emit('keyPress', {key:'left', state:false});
    } else if (e.key == 'd' || e.key == 'D' || e.key == 'ArrowRight') {
        socket.emit('keyPress', {key:'right', state:false});
    } else if (e.key == ' ') {
        socket.emit('keyPress', {key:'heal', state:false});
    } else if (e.key == '\\') {
        settings.debug = !settings.debug;
        document.getElementById('debugToggle').checked = settings.debug;
        socket.emit('toggleDebug');
    } else if (e.key == 'i' || e.key == 'W' || e.key == 'e' || e.key == 'E') {
        toggleInventory();
    }
};
document.onmousedown = function(e) {
    if (!e.isTrusted) {
        socket.emit('timeout');
    }
    if (!e.target.matches('#signinContainer') && !e.target.matches('#chatInput') && !e.target.matches('#windows') && !e.target.matches('#dropdownMenu') && !e.target.matches('#regionName')) {
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
    if (!e.target.matches('#signinContainer') && !e.target.matches('#chatInput') && !e.target.matches('#windows') && !e.target.matches('#dropdownMenu') && !e.target.matches('#regionName')) {
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
socket.on('region', function(name) {
    clearInterval(mapnameFade);
    clearTimeout(mapnameWait);
    document.getElementById('regionName').innerText = name;
    document.getElementById('regionName').style.display = 'block';
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
                document.getElementById('regionName').style.display = 'none';
            }
        }, 20);
    }, 6000);
});
socket.on('teleport1', function() {
    document.getElementById('fade').style.display = 'block';
    document.getElementById('fade').style.opacity = 0;
    var opacity = 0;
    var fade = setInterval(function() {
        document.getElementById('fade').style.opacity = opacity;
        opacity += 0.04;
        if (opacity >= 1) {
            clearInterval(fade);
            document.getElementById('fade').style.opacity = 1;
            socket.emit('teleport1');
        }
    }, 20);
});
socket.on('teleport2', function(pos) {
    player.map = pos.map;
    player.x = pos.x;
    player.y = pos.y;
    var opacity = 1;
    var fade = setInterval(function() {
        document.getElementById('fade').style.opacity = opacity;
        opacity -= 0.04;
        if (opacity <= 0) {
            clearInterval(fade);
            document.getElementById('fade').style.display = 'none';
            socket.emit('teleport2');
        }
    }, 20);
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
socket.on('debugTick', function(debug) {
    debugData = debug;
});

// automove prevention
document.addEventListener("visibilitychange", function() {
    socket.emit('keyPress', {key:'up', state:false});
    socket.emit('keyPress', {key:'down', state:false});
    socket.emit('keyPress', {key:'left', state:false});
    socket.emit('keyPress', {key:'right', state:false});
    socket.emit('keyPress', {key:'heal', state:false});
});

// chat
var inchat = false;
var chatInput = document.getElementById('chatInput');
chatInput.onfocus = function() {
    inchat = true;
    socket.emit('keyPress', {key:'up', state:false});
    socket.emit('keyPress', {key:'down', state:false});
    socket.emit('keyPress', {key:'left', state:false});
    socket.emit('keyPress', {key:'right', state:false});
    socket.emit('keyPress', {key:'heal', state:false});
};
chatInput.onblur = function() {
    inchat = false;
};
chatInput.onkeydown = function(e) {
    if (!e.isTrusted) {
        socket.emit('timeout');
    }
    if (e.key == 'Enter') {
        if (chatInput.value != '') {
            socket.emit('chat', chatInput.value);
            chatInput.value = '';
        }
    }
};
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
};

// performance metrics
var fps = 0;
var fpsCounter = 0;
var ping = 0;
var pingSend = new Date();
var pingCounter = 0;
setInterval(async function() {
    fps = fpsCounter;
    fpsCounter = 0;
    ping = pingCounter;
    document.getElementById('fps').innerText = 'FPS: ' + fps;
}, 1000);
function fpsLoop() {
    window.requestAnimationFrame(function() {
        fpsCounter++;
        fpsLoop();
    });
};
fpsLoop();
socket.on('ping', function() {
    var current = new Date();
    pingCounter = current-pingSend;
    socket.emit('ping');
    pingSend = new Date();
});
socket.emit('ping');