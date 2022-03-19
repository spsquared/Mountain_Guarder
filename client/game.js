// Copyright (C) 2022 Radioactive64

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
    totalassets = 2;
    for (var i in data.maps) {
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
        await loadInventoryData();
        for (var i in data.maps) {
            await loadMap(data.maps[i]);
        }
        player = {map: data.self};
        await updateRenderedChunks();
        loadedassets++;
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
                        chunkJSON: [],
                        layerCount: 0
                    };
                    for (var i in json.layers) {
                        if (json.layers[i].visible) {
                            if (json.layers[i].name == 'Ground Terrain') {
                                MAPS[name].width = json.layers[i].width;
                                MAPS[name].height = json.layers[i].height;
                                MAPS[name].chunkwidth = json.layers[i].width;
                                MAPS[name].chunkheight = json.layers[i].height;
                                if (json.layers[i].chunks) {
                                    for (var j in json.layers[i].chunks) {
                                        var rawchunk = json.layers[i].chunks[j];
                                        MAPS[name].chunkwidth = rawchunk.width;
                                        MAPS[name].chunkheight = rawchunk.height;
                                        MAPS[name].offsetX = Math.min(rawchunk.x*64, MAPS[name].offsetX);
                                        MAPS[name].offsetY = Math.min(rawchunk.y*64, MAPS[name].offsetY);
                                    }
                                }
                            }
                            if (json.layers[i].chunks) {
                                for (var j in json.layers[i].chunks) {
                                    var rawchunk = json.layers[i].chunks[j];
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
                                if (MAPS[name].chunkJSON[0] == null) {
                                    MAPS[name].chunkJSON[0] = [[]];
                                }
                                MAPS[name].chunkJSON[0][0][json.layers[i].name] = json.layers[i].data;
                                MAPS[name].chunkJSON[0][0][json.layers[i].name].offsetX = 0;
                                MAPS[name].chunkJSON[0][0][json.layers[i].name].offsetY = 0;
                                if (json.layers[i].offsetx) MAPS[name].chunkJSON[0][0][json.layers[i].name].offsetX = json.layers[i].offsetx;
                                if (json.layers[i].offsety) MAPS[name].chunkJSON[0][0][json.layers[i].name].offsetY = json.layers[i].offsety;
                            }
                            if (json.layers[i].name.includes('Variable')) MAPS[name].layerCount++;
                        }
                    }
                    loadedassets++;
                    resolve();
                } else {
                    console.error('Error: Server returned status ' + this.status);
                }
            };
            request.onerror = function(){
                console.error('There was a connection error. Please retry');
                reject();
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
        if (settings.debug) frameStart = Date.now();
        for (var i = 0; i < MAPS[player.map].layerCount; i++) {
            if (LAYERS.entitylayers[i] == null) {
                LAYERS.entitylayers[i] = createCanvas();
                LAYERS.elayers[i] = LAYERS.entitylayers[i].getContext('2d');
                LAYERS.entitylayers[i].width = window.innerWidth*SCALE;
                LAYERS.entitylayers[i].height = window.innerHeight*SCALE;
                LAYERS.elayers[i].scale(SCALE, SCALE);
                resetCanvas(LAYERS.entitylayers[i]);
            }
        }
        CTX.clearRect(0, 0, window.innerWidth, window.innerHeight);
        OFFSETX = 0;
        OFFSETY = 0;
        if (MAPS[player.map].width*64 > window.innerWidth) OFFSETX = -Math.max((window.innerWidth/2) - (player.x - MAPS[player.map].offsetX), Math.min((MAPS[player.map].offsetX + (MAPS[player.map].width*64)) - player.x - (window.innerWidth/2), 0));
        if (MAPS[player.map].height*64 > window.innerHeight) OFFSETY = -Math.max((window.innerHeight/2) - (player.y - MAPS[player.map].offsetY), Math.min((MAPS[player.map].offsetY + (MAPS[player.map].height*64)) - player.y - (window.innerHeight/2), 0));
        // OFFSETX += Math.random()*200-100;
        // OFFSETY += Math.random()*200-100;
        drawMap();
        Entity.draw();
        CTX.drawImage(LAYERS.map0, 0, 0, window.innerWidth, window.innerHeight);
        for (var i = 0; i < MAPS[player.map].layerCount+1; i++) {
            if (LAYERS.entitylayers[i]) CTX.drawImage(LAYERS.entitylayers[i], 0, 0, window.innerWidth, window.innerHeight);
            if (LAYERS.mapvariables[i]) CTX.drawImage(LAYERS.mapvariables[i], 0, 0, window.innerWidth, window.innerHeight);
        }
        CTX.drawImage(LAYERS.map1, 0, 0, window.innerWidth, window.innerHeight);
        CTX.drawImage(LAYERS.entity1, 0, 0, window.innerWidth, window.innerHeight);
        drawDebug();
        if (settings.debug) {
            var current = Date.now();
            frameTimeCounter = current-frameStart;
        }
    }
};
function drawMap() {
    if (settings.debug) mapStart = Date.now();
    for (var i = 0; i < MAPS[player.map].layerCount+1; i++) {
        if (LAYERS.mapvariables[i] == null) {
            LAYERS.mapvariables[i] = createCanvas();
            LAYERS.mvariables[i] = LAYERS.mapvariables[i].getContext('2d');
            LAYERS.mapvariables[i].width = window.innerWidth*SCALE;
            LAYERS.mapvariables[i].height = window.innerHeight*SCALE;
            LAYERS.mvariables[i].scale(SCALE, SCALE);
            resetCanvas(LAYERS.mapvariables[i]);
        }
    }
    if (lastmap != player.map) {
        for (var i in MAPS) {
            for (var j in MAPS[i].chunks) {
                delete MAPS[i].chunks[j];
            }
        }
        lastmap = player.map;
    }
    LAYERS.mlower.clearRect(0, 0, window.innerWidth, window.innerHeight);
    LAYERS.mupper.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (var i in LAYERS.mvariables) {
        LAYERS.mvariables[i].clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
    LAYERS.mlower.save();
    LAYERS.mlower.translate((window.innerWidth/2)-player.x,(window.innerHeight/2)-player.y);
    LAYERS.mupper.save();
    LAYERS.mupper.translate((window.innerWidth/2)-player.x,(window.innerHeight/2)-player.y);
    for (var i in LAYERS.mvariables) {
        LAYERS.mvariables[i].save();
        LAYERS.mvariables[i].translate((window.innerWidth/2)-player.x,(window.innerHeight/2)-player.y);
    }
    for (var y in MAPS[player.map].chunks) {
        for (var x in MAPS[player.map].chunks[y]) {
            LAYERS.mlower.drawImage(MAPS[player.map].chunks[y][x].lower, (x*MAPS[player.map].chunkwidth*64)+OFFSETX, (y*MAPS[player.map].chunkheight*64)+OFFSETY, MAPS[player.map].chunkwidth*64, MAPS[player.map].chunkheight*64);
            LAYERS.mupper.drawImage(MAPS[player.map].chunks[y][x].upper, (x*MAPS[player.map].chunkwidth*64)+OFFSETX, (y*MAPS[player.map].chunkheight*64)+OFFSETY, MAPS[player.map].chunkwidth*64, MAPS[player.map].chunkheight*64);
            for (var z in MAPS[player.map].chunks[y][x].variables) {
                LAYERS.mvariables[z].drawImage(MAPS[player.map].chunks[y][x].variables[z], (x*MAPS[player.map].chunkwidth*64)+OFFSETX, (y*MAPS[player.map].chunkheight*64)+OFFSETY, MAPS[player.map].chunkwidth*64, MAPS[player.map].chunkheight*64);
            }
        }
    }
    LAYERS.mupper.fillStyle = '#000000';
    var width = MAPS[player.map].width*64;
    var height = MAPS[player.map].height*64;
    var offsetX = MAPS[player.map].offsetX;
    var offsetY = MAPS[player.map].offsetY;
    LAYERS.mupper.fillRect(-1024+offsetX+OFFSETX, -1024+offsetY+OFFSETY, width+2048, 1024);
    LAYERS.mupper.fillRect(-1024+offsetX+OFFSETX, height+offsetY+OFFSETY, width+2048, 1024);
    LAYERS.mupper.fillRect(-1024+offsetX+OFFSETX, -1024+offsetY+OFFSETY, 1024, height+2048);
    LAYERS.mupper.fillRect(width+offsetX+OFFSETX, offsetY+OFFSETY, 1024, height+2048);
    LAYERS.mlower.restore();
    LAYERS.mupper.restore();
    for (var i in LAYERS.mvariables) {
        LAYERS.mvariables[i].restore();
    }
    if (settings.debug) {
        var current = Date.now();
        mapTimeCounter = current-mapStart;
    }
};
async function resetRenderedChunks() {
    if (player) {
        MAPS[player.map].chunks = [];
        LAYERS.mapvariables = [];
        LAYERS.mvariables = [];
        await updateRenderedChunks();
    }
};
async function updateRenderedChunks() {
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
                    renderChunk(x, y, player.map);
                }
            } else if (MAPS[player.map].chunks[y][x] == undefined) {
                if (MAPS[player.map].chunkJSON[y]) if (MAPS[player.map].chunkJSON[y][x]) {
                    renderChunk(x, y, player.map);
                }
            }
        }
    }
};
function renderChunk(x, y, map) {
    var templower = createCanvas(MAPS[map].chunkwidth * 64, MAPS[map].chunkheight * 64);
    var tempupper = createCanvas(MAPS[map].chunkwidth * 64, MAPS[map].chunkheight * 64);
    var tlower = templower.getContext('2d');
    var tupper = tempupper.getContext('2d');
    resetCanvas(tempupper);
    resetCanvas(templower);
    var tempvariables = [];
    var tvariables = [];
    for (var i in MAPS[player.map].chunkJSON[y][x]) {
        var above = false;
        var variable = -1;
        var vindex = 0;
        if (i.includes('Above')) above = true;
        if (i.includes('Variable')) {
            variable = parseInt(i.replace('Variable', ''));
            vindex = tempvariables.length;
            tempvariables.push(createCanvas(MAPS[map].chunkwidth * 64, MAPS[map].chunkheight * 64));
            tvariables.push(tempvariables[vindex].getContext('2d'));
            resetCanvas(tempvariables[vindex]);
        }
        for (var j in MAPS[player.map].chunkJSON[y][x][i]) {
            var tileid = MAPS[player.map].chunkJSON[y][x][i][j];
            if (tileid != 0) {
                tileid--;
                var imgx = (tileid % 86)*17;
                var imgy = ~~(tileid / 86)*17;
                var dx = (j % MAPS[map].chunkwidth)*16+MAPS[player.map].chunkJSON[y][x][i].offsetX;
                var dy = ~~(j / MAPS[map].chunkwidth)*16+MAPS[player.map].chunkJSON[y][x][i].offsetY;
                if (above) {
                    tupper.drawImage(tileset, Math.round(imgx), Math.round(imgy), 16, 16, Math.round(dx*4), Math.round(dy*4), 64, 64);
                } else if (variable != -1) {
                    tvariables[vindex].drawImage(tileset, Math.round(imgx), Math.round(imgy), 16, 16, Math.round(dx*4), Math.round(dy*4), 64, 64);
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
        lower: templower,
        variables: tempvariables
    };
};
function drawDebug() {
    if (debugData && settings.debug) {
        debugStart = Date.now();
        var temp = new createCanvas(window.innerWidth, window.innerHeight);
        var tempctx = temp.getContext('2d');
        function getManhattanDistance(entity) {
            return Math.abs(player.x-entity.x) + Math.abs(player.y-entity.y);
        };
        tempctx.save();
        tempctx.translate((window.innerWidth/2)-player.x, (window.innerHeight/2)-player.y);
        // chunk borders
        var width = MAPS[player.map].chunkwidth*64;
        var height = MAPS[player.map].chunkheight*64;
        tempctx.beginPath();
        tempctx.strokeStyle = '#00FF00';
        tempctx.lineWidth = 4;
        for (var x = player.chunkx-settings.renderDistance; x <= player.chunkx+settings.renderDistance+1; x++) {
            tempctx.moveTo(x*width+OFFSETX, (player.chunky-settings.renderDistance)*height+OFFSETY);
            tempctx.lineTo(x*width+OFFSETX, (player.chunky+settings.renderDistance+1)*height+OFFSETY);
        }
        for (var y = player.chunky-settings.renderDistance; y <= player.chunky+settings.renderDistance+1; y++) {
            tempctx.moveTo((player.chunkx-settings.renderDistance)*width+OFFSETX, y*height+OFFSETY);
            tempctx.lineTo((player.chunkx+settings.renderDistance+1)*width+OFFSETX, y*height+OFFSETY);
        }
        tempctx.stroke();
        // players/npcs
        for (var i in debugData.players) {
            var localplayer = debugData.players[i];
            if (localplayer.map == player.map && getManhattanDistance(localplayer) < settings.renderDistance*2*MAPS[player.map].chunkwidth*64) {
                // keys
                tempctx.beginPath();
                tempctx.strokeStyle = '#000000';
                tempctx.lineWidth = 2;
                if (localplayer.keys.left) {
                    tempctx.moveTo(localplayer.x+OFFSETX, localplayer.y+OFFSETY);
                    tempctx.lineTo(localplayer.x-localplayer.width/2+OFFSETX, localplayer.y+OFFSETY);
                }
                if (localplayer.keys.right) {
                    tempctx.moveTo(localplayer.x+OFFSETX, localplayer.y+OFFSETY);
                    tempctx.lineTo(localplayer.x+localplayer.width/2+OFFSETX, localplayer.y+OFFSETY);
                }
                if (localplayer.keys.up) {
                    tempctx.moveTo(localplayer.x+OFFSETX, localplayer.y+OFFSETY);
                    tempctx.lineTo(localplayer.x+OFFSETX, localplayer.y-localplayer.height/2+OFFSETY);
                }
                if (localplayer.keys.down) {
                    tempctx.moveTo(localplayer.x+OFFSETX, localplayer.y+OFFSETY);
                    tempctx.lineTo(localplayer.x+OFFSETX, localplayer.y+localplayer.height/2+OFFSETY);
                }
                tempctx.stroke();
                // hitbox
                tempctx.beginPath();
                tempctx.strokeStyle = '#FF9900';
                tempctx.lineWidth = 4;
                tempctx.moveTo(localplayer.x-localplayer.width/2+OFFSETX, localplayer.y-localplayer.height/2+OFFSETY);
                tempctx.lineTo(localplayer.x-localplayer.width/2+OFFSETX, localplayer.y+localplayer.height/2+OFFSETY);
                tempctx.lineTo(localplayer.x+localplayer.width/2+OFFSETX, localplayer.y+localplayer.height/2+OFFSETY);
                tempctx.lineTo(localplayer.x+localplayer.width/2+OFFSETX, localplayer.y-localplayer.height/2+OFFSETY);
                tempctx.lineTo(localplayer.x-localplayer.width/2+OFFSETX, localplayer.y-localplayer.height/2+OFFSETY);
                tempctx.lineWidth = 2;
                tempctx.moveTo(localplayer.x-localplayer.collisionBoxSize/2+OFFSETX, localplayer.y-localplayer.collisionBoxSize/2+OFFSETY);
                tempctx.lineTo(localplayer.x-localplayer.collisionBoxSize/2+OFFSETX, localplayer.y+localplayer.collisionBoxSize/2+OFFSETY);
                tempctx.lineTo(localplayer.x+localplayer.collisionBoxSize/2+OFFSETX, localplayer.y+localplayer.collisionBoxSize/2+OFFSETY);
                tempctx.lineTo(localplayer.x+localplayer.collisionBoxSize/2+OFFSETX, localplayer.y-localplayer.collisionBoxSize/2+OFFSETY);
                tempctx.lineTo(localplayer.x-localplayer.collisionBoxSize/2+OFFSETX, localplayer.y-localplayer.collisionBoxSize/2+OFFSETY);
                tempctx.stroke();
                if (localplayer.path) {
                    if (localplayer.path[0]) {
                        tempctx.beginPath();
                        tempctx.strokeStyle = '#0000FF';
                        tempctx.lineWidth = 4;
                        tempctx.moveTo(localplayer.x+OFFSETX, localplayer.y+OFFSETY);
                        for (var j in localplayer.path) {
                            tempctx.lineTo(localplayer.path[j][0]*64+32+OFFSETX, localplayer.path[j][1]*64+32+OFFSETY);
                        }
                        tempctx.stroke();
                    }
                }
                if (localplayer.idleWaypoints) {
                    var waypoints = localplayer.idleWaypoints.waypoints;
                    var lastWaypoints = localplayer.idleWaypoints.lastWaypoints;
                    if (waypoints) if (waypoints[0]) {
                        tempctx.beginPath();
                        tempctx.strokeStyle = '#FFFF00';
                        tempctx.lineWidth = 4;
                        tempctx.textAlign = 'center';
                        tempctx.font = '10px Pixel';
                        tempctx.fillStyle = '#FFFF00';
                        for (var j in waypoints) {
                            if (waypoints[j].map == player.map) {
                                tempctx.moveTo(waypoints[j].x*64+OFFSETX, waypoints[j].y*64+OFFSETY);
                                tempctx.lineTo(waypoints[j].x*64+64+OFFSETX, waypoints[j].y*64+OFFSETY);
                                tempctx.lineTo(waypoints[j].x*64+64+OFFSETX, waypoints[j].y*64+64+OFFSETY);
                                tempctx.lineTo(waypoints[j].x*64+OFFSETX, waypoints[j].y*64+64+OFFSETY);
                                tempctx.lineTo(waypoints[j].x*64+OFFSETX, waypoints[j].y*64+OFFSETY);
                                tempctx.fillText(localplayer.name, waypoints[j].x*64+OFFSETX, waypoints[j].y*64+OFFSETY);
                            }
                        }
                        tempctx.stroke();
                    }
                    if (lastWaypoints) if (lastWaypoints[0]) {
                        tempctx.beginPath();
                        tempctx.strokeStyle = '#00FFFF';
                        tempctx.lineWidth = 4;
                        tempctx.textAlign = 'center';
                        tempctx.font = '10px Pixel';
                        tempctx.fillStyle = '#FFFF00';
                        for (var j in lastWaypoints) {
                            if (lastWaypoints[j].map == player.map) {
                                tempctx.moveTo(lastWaypoints[j].x*64+OFFSETX, lastWaypoints[j].y*64+OFFSETY);
                                tempctx.lineTo(lastWaypoints[j].x*64+64+OFFSETX, lastWaypoints[j].y*64+OFFSETY);
                                tempctx.lineTo(lastWaypoints[j].x*64+64+OFFSETX, lastWaypoints[j].y*64+64+OFFSETY);
                                tempctx.lineTo(lastWaypoints[j].x*64+OFFSETX, lastWaypoints[j].y*64+64+OFFSETY);
                                tempctx.lineTo(lastWaypoints[j].x*64+OFFSETX, lastWaypoints[j].y*64+OFFSETY);
                                tempctx.fillText(localplayer.name, waypoints[j].x+OFFSETX, waypoints[j].y+OFFSETY);
                            }
                        }
                        tempctx.stroke();
                    }
                }
            }
        }
        // monsters
        for (var i in debugData.monsters) {
            var localmonster = debugData.monsters[i];
            if (localmonster) if (localmonster.map == player.map) {
                // keys
                tempctx.beginPath();
                tempctx.strokeStyle = '#000000';
                tempctx.lineWidth = 2;
                if (localmonster.keys.left) {
                    tempctx.moveTo(localmonster.x+OFFSETX, localmonster.y+OFFSETY);
                    tempctx.lineTo(localmonster.x-localmonster.width/2+OFFSETX, localmonster.y+OFFSETY);
                }
                if (localmonster.keys.right) {
                    tempctx.moveTo(localmonster.x+OFFSETX, localmonster.y+OFFSETY);
                    tempctx.lineTo(localmonster.x+localmonster.width/2+OFFSETX, localmonster.y+OFFSETY);
                }
                if (localmonster.keys.up) {
                    tempctx.moveTo(localmonster.x+OFFSETX, localmonster.y+OFFSETY);
                    tempctx.lineTo(localmonster.x+OFFSETX, localmonster.y-localmonster.height/2+OFFSETY);
                }
                if (localmonster.keys.down) {
                    tempctx.moveTo(localmonster.x+OFFSETX, localmonster.y+OFFSETY);
                    tempctx.lineTo(localmonster.x+OFFSETX, localmonster.y+localmonster.height/2+OFFSETY);
                }
                tempctx.stroke();
                // hitbox
                tempctx.beginPath();
                tempctx.strokeStyle = '#FF9900';
                tempctx.lineWidth = 4;
                tempctx.moveTo(localmonster.x-localmonster.width/2+OFFSETX, localmonster.y-localmonster.height/2+OFFSETY);
                tempctx.lineTo(localmonster.x-localmonster.width/2+OFFSETX, localmonster.y+localmonster.height/2+OFFSETY);
                tempctx.lineTo(localmonster.x+localmonster.width/2+OFFSETX, localmonster.y+localmonster.height/2+OFFSETY);
                tempctx.lineTo(localmonster.x+localmonster.width/2+OFFSETX, localmonster.y-localmonster.height/2+OFFSETY);
                tempctx.lineTo(localmonster.x-localmonster.width/2+OFFSETX, localmonster.y-localmonster.height/2+OFFSETY);
                tempctx.lineWidth = 2;
                tempctx.moveTo(localmonster.x-localmonster.collisionBoxSize/2+OFFSETX, localmonster.y-localmonster.collisionBoxSize/2+OFFSETY);
                tempctx.lineTo(localmonster.x-localmonster.collisionBoxSize/2+OFFSETX, localmonster.y+localmonster.collisionBoxSize/2+OFFSETY);
                tempctx.lineTo(localmonster.x+localmonster.collisionBoxSize/2+OFFSETX, localmonster.y+localmonster.collisionBoxSize/2+OFFSETY);
                tempctx.lineTo(localmonster.x+localmonster.collisionBoxSize/2+OFFSETX, localmonster.y-localmonster.collisionBoxSize/2+OFFSETY);
                tempctx.lineTo(localmonster.x-localmonster.collisionBoxSize/2+OFFSETX, localmonster.y-localmonster.collisionBoxSize/2+OFFSETY);
                tempctx.stroke();
                // aggro range
                tempctx.beginPath();
                tempctx.strokeStyle = '#FF0000';
                tempctx.fillStyle = '#FF00000A';
                tempctx.lineWidth = 4;
                tempctx.arc(localmonster.x+OFFSETX, localmonster.y+OFFSETY, localmonster.aggroRange*64, 0, 2*Math.PI, false);
                tempctx.fill();
                tempctx.stroke();
                // aggro target
                if (Player.list[localmonster.aggroTarget]) {
                    tempctx.beginPath();
                    tempctx.strokeStyle = '#FF0000';
                    tempctx.lineWidth = 2;
                    tempctx.moveTo(localmonster.x+OFFSETX, localmonster.y+OFFSETY);
                    tempctx.lineTo(Player.list[localmonster.aggroTarget].x+OFFSETX, Player.list[localmonster.aggroTarget].y+OFFSETY);
                    tempctx.stroke();
                }
                // path
                if (localmonster.path[0]) {
                    tempctx.beginPath();
                    tempctx.strokeStyle = '#0000FF';
                    tempctx.lineWidth = 4;
                    tempctx.moveTo(localmonster.x+OFFSETX, localmonster.y+OFFSETY);
                    for (var j in localmonster.path) {
                        tempctx.lineTo(localmonster.path[j][0]*64+32+OFFSETX, localmonster.path[j][1]*64+32+OFFSETY);
                    }
                    tempctx.stroke();
                }
            }
        }
        // projectiles
        for (var i in debugData.projectiles) {
            var localprojectile = debugData.projectiles[i];
            if (localprojectile) if (localprojectile.map == player.map) {
                var sinAngle = Math.sin(localprojectile.angle);
                var cosAngle = Math.cos(localprojectile.angle);
                // hitbox
                tempctx.beginPath();
                tempctx.strokeStyle = '#FF9900';
                tempctx.lineWidth = 4;
                tempctx.moveTo(((localprojectile.width/2)*cosAngle)-((localprojectile.height/2)*sinAngle)+localprojectile.x+OFFSETX, ((localprojectile.width/2)*sinAngle)+((localprojectile.height/2)*cosAngle)+localprojectile.y+OFFSETY);
                tempctx.lineTo(((localprojectile.width/2)*cosAngle)-((-localprojectile.height/2)*sinAngle)+localprojectile.x+OFFSETX, ((localprojectile.width/2)*sinAngle)+((-localprojectile.height/2)*cosAngle)+localprojectile.y+OFFSETY);
                tempctx.lineTo(((-localprojectile.width/2)*cosAngle)-((-localprojectile.height/2)*sinAngle)+localprojectile.x+OFFSETX, ((-localprojectile.width/2)*sinAngle)+((-localprojectile.height/2)*cosAngle)+localprojectile.y+OFFSETY);
                tempctx.lineTo(((-localprojectile.width/2)*cosAngle)-((localprojectile.height/2)*sinAngle)+localprojectile.x+OFFSETX, ((-localprojectile.width/2)*sinAngle)+((localprojectile.height/2)*cosAngle)+localprojectile.y+OFFSETY);
                tempctx.lineTo(((localprojectile.width/2)*cosAngle)-((localprojectile.height/2)*sinAngle)+localprojectile.x+OFFSETX, ((localprojectile.width/2)*sinAngle)+((localprojectile.height/2)*cosAngle)+localprojectile.y+OFFSETY);
                tempctx.lineWidth = 2;
                tempctx.moveTo(localprojectile.x-localprojectile.collisionBoxSize/2+OFFSETX, localprojectile.y-localprojectile.collisionBoxSize/2+OFFSETY);
                tempctx.lineTo(localprojectile.x-localprojectile.collisionBoxSize/2+OFFSETX, localprojectile.y+localprojectile.collisionBoxSize/2+OFFSETY);
                tempctx.lineTo(localprojectile.x+localprojectile.collisionBoxSize/2+OFFSETX, localprojectile.y+localprojectile.collisionBoxSize/2+OFFSETY);
                tempctx.lineTo(localprojectile.x+localprojectile.collisionBoxSize/2+OFFSETX, localprojectile.y-localprojectile.collisionBoxSize/2+OFFSETY);
                tempctx.lineTo(localprojectile.x-localprojectile.collisionBoxSize/2+OFFSETX, localprojectile.y-localprojectile.collisionBoxSize/2+OFFSETY);
                tempctx.stroke();
                // angle
                tempctx.beginPath();
                tempctx.strokeStyle = '#000000';
                tempctx.lineWidth = 2;
                tempctx.moveTo(localprojectile.x+OFFSETX, localprojectile.y+OFFSETY);
                tempctx.lineTo(((localprojectile.width/2)*cosAngle)+localprojectile.x+OFFSETX, ((localprojectile.width/2)*sinAngle)+localprojectile.y+OFFSETY);
                tempctx.stroke();
            }
        }
        // dropped items
        for (var i in debugData.droppedItems) {
            var localdroppeditem = debugData.droppedItems[i];
            if (localdroppeditem) if (localdroppeditem.map == player.map) {
                tempctx.strokeStyle = '#FF9900';
                tempctx.lineWidth = 2;
                tempctx.moveTo(localdroppeditem.x-24+OFFSETX, localdroppeditem.y-24+OFFSETY);
                tempctx.lineTo(localdroppeditem.x-24+OFFSETX, localdroppeditem.y+24+OFFSETY);
                tempctx.lineTo(localdroppeditem.x+24+OFFSETX, localdroppeditem.y+24+OFFSETY);
                tempctx.lineTo(localdroppeditem.x+24+OFFSETX, localdroppeditem.y-24+OFFSETY);
                tempctx.lineTo(localdroppeditem.x-24+OFFSETX, localdroppeditem.y-24+OFFSETY);
            }
        }
        tempctx.restore();
        CTX.drawImage(temp, 0, 0);
        document.getElementById('debug').style.display = 'block';
        document.getElementById('mousepos').innerText = 'Mouse: (' + Math.floor((player.x+mouseX-OFFSETX)/64) + ', ' + Math.floor((player.y+mouseY-OFFSETY)/64) + ')';
        document.getElementById('position').innerText = 'Player: (' + Math.floor(player.x/64) + ', ' + Math.floor(player.y/64) + ')';
        var current = Date.now();
        debugTimeCounter = current-debugStart;
    } else {
        document.getElementById('debug').style.display = '';
    }
};
function resetFPS() {
    clearInterval(drawLoop);
    drawLoop = setInterval(function() {
        window.requestAnimationFrame(function() {
            drawFrame();
            fpsCounter++;
        });
    }, 1000/settings.fps);
};
resetFPS();

// io
socket.on('updateTick', function(data) {
    if (loaded) {
        Entity.update(data);
        player = Player.list[playerid];
        updateRenderedChunks();
    }
});
socket.on('debugTick', function(debug) {
    debugData = debug.data;
    tpsCounter = debug.tps;
    tickTime = debug.tickTime;
});
document.onkeydown = function(e) {
    if (loaded) {
        if (!e.isTrusted) {
            socket.emit('timeout');
        } else if (!inchat && !indebug) {
            var key = e.key.toLowerCase();
            if (key == keybinds.up) {
                socket.emit('keyPress', {key:'up', state:true});
            } else if (key == keybinds.down) {
                socket.emit('keyPress', {key:'down', state:true});
            } else if (key == keybinds.left) {
                socket.emit('keyPress', {key:'left', state:true});
            } else if (key == keybinds.right) {
                socket.emit('keyPress', {key:'right', state:true});
            } else if (key == keybinds.heal) {
                socket.emit('keyPress', {key:'heal', state:true});
            } else if (key == keybinds.chat) {
                document.getElementById('chatInput').focus();
                e.preventDefault();
            } else if (!e.getModifierState('Shift') && !e.getModifierState('Control') && !e.getModifierState('Alt') && !e.getModifierState('Meta')) {
                if (key == keybinds.inventory) {
                    toggleInventory();
                } else if (key == keybinds.inventoryEquips) {
                    toggleToEquips();
                } else if (key == keybinds.inventoryCrafting) {
                    toggleToCrafting();
                } else if (key == keybinds.map) {
                    toggleMap();
                } else if (key == keybinds.settings) {
                    toggleSettings();
                }
            } else if (key == 'i' && !e.getModifierState('Shift') && e.getModifierState('Control') && debugConsoleEnabled) {
                toggleDebugConsole();
            } else if (e.key == 'Meta' || e.key == 'Alt' || e.key == 'Control'){
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
        var key = e.key.toLowerCase();
        if (!e.isTrusted) {
            socket.emit('timeout');
        } else if (key == keybinds.up) {
            socket.emit('keyPress', {key:'up', state:false});
        } else if (key == keybinds.down) {
            socket.emit('keyPress', {key:'down', state:false});
        } else if (key == keybinds.left) {
            socket.emit('keyPress', {key:'left', state:false});
        } else if (key == keybinds.right) {
            socket.emit('keyPress', {key:'right', state:false});
        } else if (key == keybinds.heal) {
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
        if (!pointerLocked) {
            mouseX = e.clientX-window.innerWidth/2;
            mouseY = e.clientY-window.innerHeight/2;
        }
        if (!document.getElementById('chat').contains(e.target) && !document.getElementById('dropdownMenu').contains(e.target) && !document.getElementById('windows').contains(e.target) && !document.getElementById('deathScreen').contains(e.target)) {
            switch (e.button) {
                case keybinds.use:
                    socket.emit('click', {button: 'left', x: mouseX-OFFSETX, y: mouseY-OFFSETY, state: true});
                    break;
                case keybinds.second:
                    socket.emit('click', {button: 'right', x: mouseX-OFFSETX, y: mouseY-OFFSETY, state: true});
                    break;
            }
        }
        if (!pointerLocked && settings.pointerLock) document.body.requestPointerLock();
    }
};
document.onmouseup = function(e) {
    if (loaded) {
        if (!e.isTrusted) {
            socket.emit('timeout');
        }
        if (!pointerLocked) {
            mouseX = e.clientX-window.innerWidth/2;
            mouseY = e.clientY-window.innerHeight/2;
        }
        if (!e.target.matches('#menuContainer') && !e.target.matches('#chatInput') && !e.target.matches('#windows') && !e.target.matches('#dropdownMenu') && !e.target.matches('#regionName')) {
            switch (e.button) {
                case keybinds.use:
                    socket.emit('click', {button: 'left', x: mouseX-OFFSETX, y: mouseY-OFFSETY, state: false});
                    break;
                case keybinds.second:
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
        if (pointerLocked) {
            mouseX += e.movementX;
            mouseY += e.movementY;
            mouseX = Math.max(-window.innerWidth/2, Math.min(mouseX, window.innerWidth/2));
            mouseY = Math.max(-window.innerHeight/2, Math.min(mouseY, window.innerHeight/2));
            document.getElementById('crossHair').style.left = mouseX + window.innerWidth/2-11 + 'px';
            document.getElementById('crossHair').style.top = mouseY + window.innerHeight/2-11 + 'px';
        } else {
            mouseX = e.clientX-window.innerWidth/2;
            mouseY = e.clientY-window.innerHeight/2;
        }
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
    if (loaded) insertChat(data);
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

// world map
var map = document.getElementById('worldMap');
var worldMap = {
    x: 0,
    y: 0,
    map: 'World',
    scale: 1,
    dragging: false
};
function updateWorldMap() {
    // worldMap.x = Math.max((-map.width+488)+map.width*(1-worldMap.scale), Math.min(worldMap.x, -map.width*(1-worldMap.scale)));
    // worldMap.y = Math.max((-map.height+488)+map.height*(1-worldMap.scale), Math.min(worldMap.y, -map.height*(1-worldMap.scale)));
    map.style.transform = 'scale(' + worldMap.scale + ')';
    map.style.left = worldMap.x + 'px';
    map.style.top = worldMap.y + 'px';
};
map.onmousedown = function() {
    map.requestPointerLock();
    worldMap.dragging = true;
};
map.onmouseup = function() {
    if (settings.pointerLock) document.body.requestPointerLock();
    else if (document.pointerLockElement == map) document.exitPointerLock();
    worldMap.dragging = false;
};
map.onmousemove = function(e) {
    if (worldMap.dragging) {
        worldMap.x += e.movementX;
        worldMap.y += e.movementY;
        updateWorldMap();
    }
};
map.onwheel = function(e) {
    worldMap.scale -= e.deltaY/5000;
    worldMap.scale = Math.max(0.1, Math.min(worldMap.scale, 2));
    worldMap.x += ((mouseX+window.innerWidth/2)-worldMap.x)/(map.width*worldMap.scale)*(-e.deltaY/5000);
    worldMap.y += ((mouseY+window.innerHeight/2)-worldMap.y)/(map.height*worldMap.scale)*(-e.deltaY/5000);
    console.log(((mouseX+window.innerWidth/2)-worldMap.x)/(map.width*worldMap.scale))
    updateWorldMap();
};
updateWorldMap();

// performance metrics
var fpsCounter = 0;
var tpsCounter = 0;
var pingCounter = 0;
var pingSend = 0;
var frameTimeCounter = 0;
var frameStart = 0;
var entTimeCounter = 0;
var entStart = 0;
var mapTimeCounter = 0;
var mapStart = 0;
var debugTimeCounter = 0;
var debugStart = 0;
var tickTime = 0;
var entTime = 0;
var packetTime = 0;
setInterval(async function() {
    if (loaded) {
        document.getElementById('fps').innerText = 'FPS: ' + fpsCounter;
        document.getElementById('tps').innerText = 'TPS: ' + tpsCounter;
        document.getElementById('ping').innerText = 'Ping: ' + pingCounter + 'ms';
        fpsCounter = 0;
        pingSend = Date.now();
        socket.emit('ping');
        if (settings.debug) {
            var entities = 0, monsters = 0, projectiles = 0, particles = 0;
            for (var i in Player.list) {entities++;}
            for (var i in Monster.list) {entities++; monsters++;}
            for (var i in Projectile.list) {entities++; projectiles++;}
            for (var i in Particle.list) {entities++; particles++;}
            for (var i in DroppedItem.list) {entities++;}
            document.getElementById('enttotal').innerText = 'Ent: ' + entities;
            document.getElementById('entmonst').innerText = 'Mon: ' + monsters;
            document.getElementById('entproj').innerText = 'Proj: ' + projectiles;
            document.getElementById('entpart').innerText = 'Part: ' + particles;
            document.getElementById('drawTime').innerText = 'Frame: ' + frameTimeCounter + 'ms';
            document.getElementById('entdrawTime').innerText = 'Entity: ' + entTimeCounter + 'ms';
            document.getElementById('mapdrawTime').innerText = 'Map: ' + mapTimeCounter + 'ms';
            document.getElementById('debugdrawTime').innerText = 'Debug: ' + debugTimeCounter + 'ms';
            document.getElementById('tickTime').innerText = 'Tick: ' + tickTime + 'ms';
        }
    }
}, 1000);
socket.on('ping', function() {
    var current = Date.now();
    pingCounter = current-pingSend;
});

// debug console
var indebug = false;
const debugConsoleEnabled = new URLSearchParams(window.location.search).get('console');
if (debugConsoleEnabled) {
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