// Copyright (C) 2021 Radioactive64

var player;
var playerid = 0;
var mapnameFade, mapnameWait;
var lastmap;
var debugData = {};

// loading
var loadedassets = 0;
var totalassets = 1;
socket.on('mapData', function(data) {
    load(data);
});
var tilesetloaded = false;
var tileset = new Image();
tileset.onload = function() {
    tilesetloaded = true;
    loadedassets++;
};
function load(data) {
    document.getElementById('loadingContainer').style.animationName = 'fadeIn';
    document.getElementById('loadingContainer').style.display = 'block';
    totalassets = 1;
    for (var i in data) {
        totalassets++;
    }
    setTimeout(async function() {
        await getEntityData();
        await getInventoryData();
        document.getElementById('loadingBar').style.display = 'block';
        tileset.src = './client/maps/roguelikeSheet.png';
        var updateLoadBar = setInterval(function() {
            var percent = Math.round(loadedassets/totalassets*100) + '%';
            document.getElementById('loadingBarText').innerText = loadedassets + '/' + totalassets + ' (' + percent + ')';
            document.getElementById('loadingBarInner').style.width = percent;
            if (loadedassets >= totalassets) {
                clearInterval(updateLoadBar);
                document.getElementById('loadingIcon').style.opacity = 0;
                setTimeout(function() {
                    socket.emit('signIn', {
                        state: 'loaded',
                        username: document.getElementById('username').value,
                        password: document.getElementById('password').value
                    });
                    loaded = true;
                }, 500);
            }
        }, 5);
        await loadEntityData();
        await sleep(Math.random()*50);
        await loadInventoryData();
        var wait = setInterval(async function() {
            if (tilesetloaded) {
                clearInterval(wait);
                for (var i in data) {
                    await sleep(Math.random()*50);
                    await loadMap(data[i]);
                }
            }
        }, 5);
    }, 500);
};
function loadMap(name) {
    return new Promise(async function(resolve, reject) {
        if (tilesetloaded) {
            var request = new XMLHttpRequest();
            request.open('GET', './client/maps/' + name + '.json', true);
            request.onload = async function() {
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
                    await sleep(Math.random()*100);
                    resolve();
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
    });
};
function MGHC() {};

// draw
var drawLoop = null;
function drawFrame() {
    if (loaded && player) {
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
    }
    updateRenderedChunks();
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
    LAYERS.mupper.fillStyle = '#000000';
    var width = MAPS[player.map].width*64;
    var height = MAPS[player.map].height*64;
    var offsetX = MAPS[player.map].offsetX;
    var offsetY = MAPS[player.map].offsetY;
    LAYERS.mupper.fillRect(-128+offsetX+OFFSETX, -128+offsetY+OFFSETY, width+256, 128);
    LAYERS.mupper.fillRect(-128+offsetX+OFFSETX, height+offsetY+OFFSETY, width+256, 128);
    LAYERS.mupper.fillRect(-128+offsetX+OFFSETX, -128+offsetY+OFFSETY, 128, height+256);
    LAYERS.mupper.fillRect(width+offsetX+OFFSETX, offsetY+OFFSETY, 128, height+256);
    LAYERS.mlower.restore();
    LAYERS.mupper.restore();
};
function updateRenderedChunks() {
    for (var y in MAPS[player.map].chunks) {
        for (var x in MAPS[player.map].chunks[y]) {
            if (Math.abs(player.chunkx-x) > settings.renderDistance || Math.abs(player.chunky-y) > settings.renderDistance) {
                delete MAPS[player.map].chunks[y][x];
            }
        }
    }
    for (var y = player.chunky-settings.renderDistance; y <= player.chunky+settings.renderDistance; y++) {
        for (var x = player.chunkx-settings.renderDistance; x <= player.chunkx+settings.renderDistance; x++) {
            if (MAPS[player.map].chunks[y] == undefined) {
                if (MAPS[player.map].chunkJSON[y]) if (MAPS[player.map].chunkJSON[y][x]) {
                    renderChunk(MAPS[player.map].chunkJSON[y][x], x, y, player.map);
                }
            } else if (MAPS[player.map].chunks[y][x] == undefined) {
                if (MAPS[player.map].chunkJSON[y]) if (MAPS[player.map].chunkJSON[y][x]) {
                    renderChunk(MAPS[player.map].chunkJSON[y][x], x, y, player.map);
                }
            }
        }
    }
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
        // chunk borders
        var width = MAPS[player.map].chunkwidth*64;
        var height = MAPS[player.map].chunkheight*64;
        CTX.beginPath();
        CTX.strokeStyle = '#00FF00';
        CTX.lineWidth = 4;
        for (var x = player.chunkx-settings.renderDistance; x <= player.chunkx+settings.renderDistance+1; x++) {
            CTX.moveTo(x*width+OFFSETX, (player.chunky-settings.renderDistance)*height+OFFSETY);
            CTX.lineTo(x*width+OFFSETX, (player.chunky+settings.renderDistance+1)*height+OFFSETY);
        }
        for (var y = player.chunky-settings.renderDistance; y <= player.chunky+settings.renderDistance+1; y++) {
            CTX.moveTo((player.chunkx-settings.renderDistance)*width+OFFSETX, y*height+OFFSETY);
            CTX.lineTo((player.chunkx+settings.renderDistance+1)*width+OFFSETX, y*height+OFFSETY);
        }
        CTX.stroke();
        // players/npcs
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
                CTX.lineWidth = 2;
                CTX.moveTo(localplayer.x-localplayer.collisionBoxSize/2+OFFSETX, localplayer.y-localplayer.collisionBoxSize/2+OFFSETY);
                CTX.lineTo(localplayer.x-localplayer.collisionBoxSize/2+OFFSETX, localplayer.y+localplayer.collisionBoxSize/2+OFFSETY);
                CTX.lineTo(localplayer.x+localplayer.collisionBoxSize/2+OFFSETX, localplayer.y+localplayer.collisionBoxSize/2+OFFSETY);
                CTX.lineTo(localplayer.x+localplayer.collisionBoxSize/2+OFFSETX, localplayer.y-localplayer.collisionBoxSize/2+OFFSETY);
                CTX.lineTo(localplayer.x-localplayer.collisionBoxSize/2+OFFSETX, localplayer.y-localplayer.collisionBoxSize/2+OFFSETY);
                CTX.stroke();
                if (localplayer.path) {
                    if (localplayer.path[0]) {
                        CTX.beginPath();
                        CTX.strokeStyle = '#0000FF';
                        CTX.lineWidth = 4;
                        CTX.moveTo(localplayer.x+OFFSETX, localplayer.y+OFFSETY);
                        for (var j in localplayer.path) {
                            CTX.lineTo(localplayer.path[j][0]*64+32+OFFSETX, localplayer.path[j][1]*64+32+OFFSETY);
                        }
                        CTX.stroke();
                    }
                }
                if (localplayer.idleWaypoints) {
                    var waypoints = localplayer.idleWaypoints.waypoints;
                    var lastWaypoints = localplayer.idleWaypoints.lastWaypoints;
                    if (waypoints) if (waypoints[0]) {
                        CTX.beginPath();
                        CTX.strokeStyle = '#FFFF00';
                        CTX.lineWidth = 4;
                        CTX.textAlign = 'center';
                        CTX.font = '10px Pixel';
                        CTX.fillStyle = '#FFFF00';
                        for (var j in waypoints) {
                            if (waypoints[j].map == player.map) {
                                CTX.moveTo(waypoints[j].x*64+OFFSETX, waypoints[j].y*64+OFFSETY);
                                CTX.lineTo(waypoints[j].x*64+64+OFFSETX, waypoints[j].y*64+OFFSETY);
                                CTX.lineTo(waypoints[j].x*64+64+OFFSETX, waypoints[j].y*64+64+OFFSETY);
                                CTX.lineTo(waypoints[j].x*64+OFFSETX, waypoints[j].y*64+64+OFFSETY);
                                CTX.lineTo(waypoints[j].x*64+OFFSETX, waypoints[j].y*64+OFFSETY);
                                CTX.fillText(localplayer.name, waypoints[j].x+OFFSETX, waypoints[j].y+OFFSETY);
                            }
                        }
                        CTX.stroke();
                    }
                    if (lastWaypoints) if (lastWaypoints[0]) {
                        CTX.beginPath();
                        CTX.strokeStyle = '#00FFFF';
                        CTX.lineWidth = 4;
                        CTX.textAlign = 'center';
                        CTX.font = '10px Pixel';
                        CTX.fillStyle = '#FFFF00';
                        for (var j in lastWaypoints) {
                            if (lastWaypoints[j].map == player.map) {
                                CTX.moveTo(lastWaypoints[j].x*64, lastWaypoints[j].y*64+OFFSETY);
                                CTX.lineTo(lastWaypoints[j].x*64+64+OFFSETX, lastWaypoints[j].y*64+OFFSETY);
                                CTX.lineTo(lastWaypoints[j].x*64+64+OFFSETX, lastWaypoints[j].y*64+64+OFFSETY);
                                CTX.lineTo(lastWaypoints[j].x*64+OFFSETX, lastWaypoints[j].y*64+64+OFFSETY);
                                CTX.lineTo(lastWaypoints[j].x*64+OFFSETX, lastWaypoints[j].y*64+OFFSETY);
                                CTX.fillText(localplayer.name, waypoints[j].x+OFFSETX, waypoints[j].y+OFFSETY);
                            }
                        }
                        CTX.stroke();
                    }
                }
            }
        }
        // monsters
        for (var i in debugData.monsters) {
            var localmonster = debugData.monsters[i];
            if (localmonster) if (localmonster.map == player.map && inRenderDistancePixels(localmonster)) {
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
                CTX.lineWidth = 2;
                CTX.moveTo(localmonster.x-localmonster.collisionBoxSize/2+OFFSETX, localmonster.y-localmonster.collisionBoxSize/2+OFFSETY);
                CTX.lineTo(localmonster.x-localmonster.collisionBoxSize/2+OFFSETX, localmonster.y+localmonster.collisionBoxSize/2+OFFSETY);
                CTX.lineTo(localmonster.x+localmonster.collisionBoxSize/2+OFFSETX, localmonster.y+localmonster.collisionBoxSize/2+OFFSETY);
                CTX.lineTo(localmonster.x+localmonster.collisionBoxSize/2+OFFSETX, localmonster.y-localmonster.collisionBoxSize/2+OFFSETY);
                CTX.lineTo(localmonster.x-localmonster.collisionBoxSize/2+OFFSETX, localmonster.y-localmonster.collisionBoxSize/2+OFFSETY);
                CTX.stroke();
                // aggro range
                CTX.beginPath();
                CTX.strokeStyle = '#FF0000';
                CTX.fillStyle = '#FF00000A';
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
                    CTX.moveTo(localmonster.x+OFFSETX, localmonster.y+OFFSETY);
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
            if (localprojectile) if (localprojectile.map == player.map && inRenderDistancePixels(localprojectile)) {
                var sinAngle = Math.sin(localprojectile.angle);
                var cosAngle = Math.cos(localprojectile.angle);
                // hitbox
                CTX.beginPath();
                CTX.strokeStyle = '#FF9900';
                CTX.lineWidth = 4;
                CTX.moveTo(((localprojectile.width/2)*cosAngle)-((localprojectile.height/2)*sinAngle)+localprojectile.x+OFFSETX, ((localprojectile.width/2)*sinAngle)+((localprojectile.height/2)*cosAngle)+localprojectile.y+OFFSETY);
                CTX.lineTo(((localprojectile.width/2)*cosAngle)-((-localprojectile.height/2)*sinAngle)+localprojectile.x+OFFSETX, ((localprojectile.width/2)*sinAngle)+((-localprojectile.height/2)*cosAngle)+localprojectile.y+OFFSETY);
                CTX.lineTo(((-localprojectile.width/2)*cosAngle)-((-localprojectile.height/2)*sinAngle)+localprojectile.x+OFFSETX, ((-localprojectile.width/2)*sinAngle)+((-localprojectile.height/2)*cosAngle)+localprojectile.y+OFFSETY);
                CTX.lineTo(((-localprojectile.width/2)*cosAngle)-((localprojectile.height/2)*sinAngle)+localprojectile.x+OFFSETX, ((-localprojectile.width/2)*sinAngle)+((localprojectile.height/2)*cosAngle)+localprojectile.y+OFFSETY);
                CTX.lineTo(((localprojectile.width/2)*cosAngle)-((localprojectile.height/2)*sinAngle)+localprojectile.x+OFFSETX, ((localprojectile.width/2)*sinAngle)+((localprojectile.height/2)*cosAngle)+localprojectile.y+OFFSETY);
                CTX.lineWidth = 2;
                CTX.moveTo(localprojectile.x-localprojectile.collisionBoxSize/2+OFFSETX, localprojectile.y-localprojectile.collisionBoxSize/2+OFFSETY);
                CTX.lineTo(localprojectile.x-localprojectile.collisionBoxSize/2+OFFSETX, localprojectile.y+localprojectile.collisionBoxSize/2+OFFSETY);
                CTX.lineTo(localprojectile.x+localprojectile.collisionBoxSize/2+OFFSETX, localprojectile.y+localprojectile.collisionBoxSize/2+OFFSETY);
                CTX.lineTo(localprojectile.x+localprojectile.collisionBoxSize/2+OFFSETX, localprojectile.y-localprojectile.collisionBoxSize/2+OFFSETY);
                CTX.lineTo(localprojectile.x-localprojectile.collisionBoxSize/2+OFFSETX, localprojectile.y-localprojectile.collisionBoxSize/2+OFFSETY);
                CTX.stroke();
                // angle
                CTX.beginPath();
                CTX.strokeStyle = '#000000';
                CTX.lineWidth = 2;
                CTX.moveTo(localprojectile.x+OFFSETX, localprojectile.y+OFFSETY);
                CTX.lineTo(((localprojectile.width/2)*cosAngle)+localprojectile.x+OFFSETX, ((localprojectile.width/2)*sinAngle)+localprojectile.y+OFFSETY);
                CTX.stroke();
            }
        }
        CTX.restore();
        document.getElementById('tps').style.display = 'block';
        document.getElementById('ping').style.display = 'block';
        document.getElementById('mousepos').style.display = 'block';
        document.getElementById('position').style.display = 'block';
        document.getElementById('enttotal').style.display = 'block';
        document.getElementById('entmonst').style.display = 'block';
        document.getElementById('entproj').style.display = 'block';
        document.getElementById('entpart').style.display = 'block';
        document.getElementById('mousepos').innerText = 'Mouse: (' + parseInt(Math.floor(player.x/64)+Math.floor((player.x+mouseX)/64)) + ', ' + Math.floor(player.y/64)+Math.floor((player.y+mouseY)/64) + ')';
        document.getElementById('position').innerText = 'Player: (' + Math.floor(player.x/64) + ', ' + Math.floor(player.y/64) + ')';
    } else {
        document.getElementById('tps').style.display = '';
        document.getElementById('ping').style.display = '';
        document.getElementById('mousepos').style.display = '';
        document.getElementById('position').style.display = '';
        document.getElementById('enttotal').style.display = '';
        document.getElementById('entmonst').style.display = '';
        document.getElementById('entproj').style.display = '';
        document.getElementById('entpart').style.display = '';
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
    tpsCounter++;
});
socket.on('debugTick', function(debug) {
    debugData = debug;
});
document.onkeydown = function(e) {
    if (loaded) {
        if (!e.isTrusted) {
            socket.emit('timeout');
        }
        if (!inchat && !indebug) {
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
            } else if (e.key == 't' || e.key == 'T') {
                document.getElementById('chatInput').focus();
                e.preventDefault();
            } else if (e.key == 'i' || e.key == 'I' && !e.getModifierState('Shift')) {
                if (e.getModifierState('Control') && new URLSearchParams(window.location.search).get('console')) {
                    toggleDebugConsole();
                } else {
                    toggleInventory();
                }
            } else if (e.key == 'e' || e.key == 'E') {
                toggleInventory();
            } else if (e.key == 'Meta' || e.key == 'Alt' || e.key == 'Control' || e.key == 'Shift'){
                socket.emit('keyPress', {key:'up', state:false});
                socket.emit('keyPress', {key:'down', state:false});
                socket.emit('keyPress', {key:'left', state:false});
                socket.emit('keyPress', {key:'right', state:false});
                socket.emit('keyPress', {key:'heal', state:false});
                socket.emit('click', {button: 'left', x: mouseX, y: mouseY, state: false});
                socket.emit('click', {button: 'right', x: mouseX, y: mouseY, state: false});
            }
        }
    }
};
document.onkeyup = function(e) {
    if (loaded) {
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
        } else {
            if (!inchat) {
                if (e.key == '\\') {
                    toggle('debug');
                    document.getElementById('debugToggle').checked = settings.debug;
                }
            }
        }
    }
};
document.onmousedown = function(e) {
    if (loaded) {
        if (!e.isTrusted) {
            socket.emit('timeout');
        }
        mouseX = e.clientX-window.innerWidth/2;
        mouseY = e.clientY-window.innerHeight/2;
        if (!document.getElementById('chat').contains(e.target) && !document.getElementById('dropdownMenu').contains(e.target) && !document.getElementById('windows').contains(e.target) && !document.getElementById('deathScreen').contains(e.target)) {
            switch (e.button) {
                case 0:
                    socket.emit('click', {button: 'left', x: mouseX-OFFSETX, y: mouseY-OFFSETY, state: true});
                    break;
                case 2:
                    socket.emit('click', {button: 'right', x: mouseX-OFFSETX, y: mouseY-OFFSETY, state: true});
                    break;
            }
        }
    }
};
document.onmouseup = function(e) {
    if (loaded) {
        if (!e.isTrusted) {
            socket.emit('timeout');
        }
        mouseX = e.clientX-window.innerWidth/2;
        mouseY = e.clientY-window.innerHeight/2;
        if (!e.target.matches('#signinContainer') && !e.target.matches('#chatInput') && !e.target.matches('#windows') && !e.target.matches('#dropdownMenu') && !e.target.matches('#regionName')) {
            switch (e.button) {
                case 0:
                    socket.emit('click', {button: 'left', x: mouseX-OFFSETX, y: mouseY-OFFSETY, state: false});
                    break;
                case 2:
                    socket.emit('click', {button: 'right', x: mouseX-OFFSETX, y: mouseY-OFFSETY, state: false});
                    break;
            }
        }
    }
};
document.onmousemove = function(e) {
    if (loaded) {
        if (!e.isTrusted) {
            socket.emit('timeout');
        }
        mouseX = e.clientX-window.innerWidth/2;
        mouseY = e.clientY-window.innerHeight/2;
        socket.emit('mouseMove', {x: mouseX-OFFSETX, y: mouseY-OFFSETY});
        DroppedItem.updateHighlight();
    }
};
setInterval(function() {
    if (loaded) {
        socket.emit('mouseMove', {x: mouseX-OFFSETX, y: mouseY-OFFSETY});
        DroppedItem.updateHighlight();
    }
}, 500);
socket.on('updateSelf', function(data) {
    playerid = data.id;
    document.getElementById('statsHPvalue').style.width = (data.hp/data.maxHP)*100 + '%';
    document.getElementById('statsHPtext').innerText = data.hp + '/' + data.maxHP;
    document.getElementById('statsXPvalue').style.width = (data.xp/data.maxXP)*100 + '%';
    document.getElementById('statsXPtext').innerText = data.xp + '/' + data.maxXP;
    document.getElementById('statsMNvalue').style.width = (data.mana/data.maxMana)*100 + '%';
    document.getElementById('statsMNtext').innerText = data.mana + '/' + data.maxMana;
});
socket.on('region', function(name) {
    clearInterval(mapnameFade);
    clearTimeout(mapnameWait);
    document.getElementById('regionName').innerText = name;
    document.getElementById('regionName').style.display = 'block';
    document.getElementById('regionName').style.animationName = 'fadeIn';
    mapnameWait = setTimeout(function() {
        document.getElementById('regionName').style.animationName = 'fadeOut';
        mapnameWait = setTimeout(function() {
            document.getElementById('regionName').style.display = '';
        }, 2000);
    }, 6000);
});
socket.on('teleport1', function() {
    document.getElementById('fade').style.display = 'block';
    document.getElementById('fade').style.animationName = 'fadeIn';
    document.getElementById('fade').onanimationend = function() {
        socket.emit('teleport');
        document.getElementById('fade').onanimationend = function() {};
    };
});
socket.on('teleport2', function(pos) {
    player.map = pos.map;
    player.x = pos.x;
    player.y = pos.y;
    document.getElementById('fade').style.animationName = 'fadeOut';
    document.getElementById('fade').onanimationend = function() {
        document.getElementById('fade').style.display = 'none';
        socket.emit('teleport2');
        document.getElementById('fade').onanimationend = function() {};
    };
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
    var scroll = false;
    if (document.getElementById('chatText').scrollTop + document.getElementById('chatText').clientHeight >= document.getElementById('chatText').scrollHeight - 5) scroll = true;
    document.getElementById('chatText').appendChild(msg);
    if (scroll) document.getElementById('chatText').scrollTop = document.getElementById('chatText').scrollHeight;
};

// performance metrics
var fpsCounter = 0;
var tpsCounter = 0;
var pingCounter = 0;
setInterval(async function() {
    if (loaded) {
        document.getElementById('fps').innerText = 'FPS: ' + fpsCounter;
        document.getElementById('tps').innerText = 'TPS: ' + tpsCounter;
        document.getElementById('ping').innerText = 'Ping: ' + pingCounter + 'ms';
        fpsCounter = 0;
        tpsCounter = 0;
        socket.emit('ping');
        pingSend = new Date();
        var entities = 0, monsters = 0, projectiles = 0, particles = 0;
        for (var i in Player.list) {entities++;}
        for (var i in Monster.list) {entities++; monsters++;}
        for (var i in Projectile.list) {entities++; projectiles++;}
        for (var i in Particle.list) {entities++; particles++;}
        document.getElementById('enttotal').innerText = 'E: ' + entities;
        document.getElementById('entmonst').innerText = 'M: ' + monsters;
        document.getElementById('entproj').innerText = 'P: ' + projectiles;
        document.getElementById('entpart').innerText = 'H: ' + particles;
    }
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
});

// debug console
var indebug = false;
if (new URLSearchParams(window.location.search).get('console')) {
    var consoleHistory = [];
    var historyIndex = 0;
    var consoleInput = document.getElementById('debugInput');
    var consoleLog = document.getElementById('debugLog');
    consoleInput.onkeydown = function(event) {
        if (event.key == 'Enter') {
            if (consoleInput.value != '') {
                socket.emit('debugInput', consoleInput.value);
                if (consoleInput.value != consoleHistory[consoleHistory.length-1]) consoleHistory.push(consoleInput.value);
                historyIndex = consoleHistory.length;
                log = document.createElement('div');
                log.className = 'ui-darkText';
                log.innerText = '> ' + consoleInput.value;
                var scroll = false;
                if (consoleLog.scrollTop + consoleLog.clientHeight >= consoleLog.scrollHeight - 5) scroll = true;
                consoleLog.appendChild(log);
                if (scroll) consoleLog.scrollTop = consoleLog.scrollHeight;
                consoleInput.value = '';
            }
        }
        if (event.key == 'ArrowUp') {
            historyIndex--;
            if (historyIndex < 0) {
                historyIndex = 0;
            }
            if (consoleHistory[historyIndex]) consoleInput.value = consoleHistory[historyIndex];
        }
        if (event.key == 'ArrowDown') {
            historyIndex++;
            if (consoleHistory[historyIndex]) consoleInput.value = consoleHistory[historyIndex];
            if (historyIndex >= consoleHistory.length) {
                historyIndex = consoleHistory.length;
                consoleInput.value = '';
            }
        }
    };
    socket.on('debugLog', function(msg) {
        log = document.createElement('div');
        log.className = 'ui-darkText';
        log.style.color = msg.color;
        log.innerText = msg.msg;
        var scroll = false;
        if (consoleLog.scrollTop + consoleLog.clientHeight >= consoleLog.scrollHeight - 5) scroll = true;
        consoleLog.appendChild(log);
        if (scroll) consoleLog.scrollTop = consoleLog.scrollHeight;
    });
    consoleInput.onfocus = function() {
        indebug = true;
    };
    consoleInput.onblur = function() {
        indebug = false;
    };
    document.getElementById('debugConsoleButton').style.display = 'block';
}