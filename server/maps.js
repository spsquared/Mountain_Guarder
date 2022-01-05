// Copyright (C) 2021 Radioactive64

var npcWaypoints = {};
function loadMap(name) {
    var raw = require('./../client/maps/' + name + '.json');
    Collision.grid[name] = [];
    Region.grid[name] = [];
    Teleporter.grid[name] = [];
    Collision.grid[name].width = raw.width;
    Collision.grid[name].height = raw.height;
    for (var i in raw.layers) {
        if (raw.layers[i].name.includes('Collision:')) {
            var rawlayer = raw.layers[i];
            if (rawlayer.chunks) {
                for (var j in rawlayer.chunks) {
                    var rawchunk = rawlayer.chunks[j];
                    Collision.grid[name].chunkWidth = rawchunk.width;
                    Collision.grid[name].chunkHeight = rawchunk.height;
                    for (var k in rawchunk.data) {
                        var x = (k % rawchunk.width)+rawchunk.x;
                        var y = ~~(k / rawchunk.width)+rawchunk.y;
                        new Collision(name, x, y, rawchunk.data[k]-1);
                    }
                }
            } else {
                Collision.grid[name].chunkWidth = rawlayer.width;
                Collision.grid[name].chunkHeight = rawlayer.height;
                for (var j in rawlayer.data) {
                    var x = (j % rawlayer.width);
                    var y = ~~(j / rawlayer.width);
                    new Collision(name, x, y, rawlayer.data[j]-1);
                }
            }
        }
        if (raw.layers[i].name.includes('Npc:')) {
            var rawlayer = raw.layers[i];
            if (rawlayer.name.includes(':waypoints')) {
                var npcId = rawlayer.name.replace('Npc:', '');
                npcId = npcId.replace(':waypoints', '');
                var waypoints = [];
                if (rawlayer.chunks) {
                    for (var j in rawlayer.chunks) {
                        var rawchunk = rawlayer.chunks[j];
                        for (var k in rawchunk.data) {
                            if (rawchunk.data[k] != 0) {
                                var x = (k % rawchunk.width)+rawchunk.x;
                                var y = ~~(k / rawchunk.width)+rawchunk.y;
                                if (rawchunk.data[k]-1 == 1777) {
                                    waypoints.push({
                                        map: name,
                                        x: x,
                                        y: y
                                    });
                                } else {
                                    error('Invalid npc waypoint at (' + x + ',' + y + ')');
                                }
                            }
                        }
                    }
                } else {
                    for (var j in rawlayer.data) {
                        if (rawlayer.data[j] != 0) {
                            var x = (j % rawlayer.width);
                            var y = ~~(j / rawlayer.width);
                            if (rawlayer.data[j]-1 == 1777) {
                                waypoints.push({
                                    map: name,
                                    x: x,
                                    y: y
                                });
                            } else {
                                error('Invalid npc waypoint at (' + x + ',' + y + ')');
                            }
                        }
                    }
                }
                if (npcWaypoints[npcId]) {
                    npcWaypoints[npcId] = npcWaypoints[npcId].concat(waypoints);
                } else {
                    npcWaypoints[npcId] = waypoints;
                }
            } else {
                if (rawlayer.chunks) {
                    for (var j in rawlayer.chunks) {
                        var rawchunk = rawlayer.chunks[j];
                        for (var k in rawchunk.data) {
                            if (rawchunk.data[k] != 0) {
                                var x = (k % rawchunk.width)+rawchunk.x;
                                var y = ~~(k / rawchunk.width)+rawchunk.y;
                                if (rawchunk.data[k]-1 == 1691) {
                                    new Npc(npcId, x, y, name);
                                } else {
                                    error('Invalid npc spawner at (' + x + ',' + y + ')');
                                }
                            }
                        }
                    }
                } else {
                    for (var j in rawlayer.data) {
                        if (rawlayer.data[j] != 0) {
                            var x = (j % rawlayer.width);
                            var y = ~~(j / rawlayer.width);
                            if (rawlayer.data[j]-1 == 1691) {
                                new Npc(npcId, x, y, name);
                            } else {
                                error('Invalid npc spawner at (' + x + ',' + y + ')');
                            }
                        }
                    }
                }
            }
        }
        if (raw.layers[i].name.includes('Spawner:')) {
            var rawlayer = raw.layers[i];
            if (rawlayer.chunks) {
                for (var j in rawlayer.chunks) {
                    var rawchunk = rawlayer.chunks[j];
                    for (var k in rawchunk.data) {
                        if (rawchunk.data[k] != 0) {
                            var x = (k % rawchunk.width)+rawchunk.x;
                            var y = ~~(k / rawchunk.width)+rawchunk.y;
                            if (rawchunk.data[k]-1 == 1692) {
                                var monsterstring = rawlayer.name.replace('Spawner:', '');
                                var spawnmonsters = [];
                                var lastl = 0;
                                for (var l in monsterstring) {
                                    if (monsterstring[l] == ',') {
                                        spawnmonsters.push(monsterstring.slice(lastl, l));
                                        lastl = parseInt(l)+1;
                                    }
                                }
                                new Spawner(name, x, y, spawnmonsters);
                            } else {
                                error('Invalid spawner at (' + x + ',' + y + ')');
                            }
                        }
                    }
                }
            } else {
                for (var j in rawlayer.data) {
                    if (rawlayer.data[j] != 0) {
                        var x = (j % rawlayer.width);
                        var y = ~~(j / rawlayer.width);
                        if (rawlayer.data[j]-1 == 1692) {
                            var monsterstring = rawlayer.name.replace('Spawner:', '');
                            var spawnmonsters = [];
                            var lastl = 0;
                            for (var l in monsterstring) {
                                if (monsterstring[l] == ',') {
                                    spawnmonsters.push(monsterstring.slice(lastl, l));
                                    lastl = parseInt(l)+1;
                                }
                            }
                            new Spawner(name, x, y, spawnmonsters);
                        } else {
                            error('Invalid spawner at (' + x + ',' + y + ')');
                        }
                    }
                }
            }
        }
        if (raw.layers[i].name.includes('Region:')) {
            var rawlayer = raw.layers[i];
            if (rawlayer.chunks) {
                for (var j in rawlayer.chunks) {
                    var rawchunk = rawlayer.chunks[j];
                    for (var k in rawchunk.data) {
                        if (rawchunk.data[k] != 0) {
                            var x = (k % rawchunk.width)+rawchunk.x;
                            var y = ~~(k / rawchunk.width)+rawchunk.y;
                            if (rawchunk.data[k]-1 == 1695) {
                                var propertystring = rawlayer.name.replace('Region:', '');
                                var properties = [];
                                var lastl = 0;
                                for (var l in propertystring) {
                                    if (propertystring[l] == ':') {
                                        properties.push(propertystring.slice(lastl, l));
                                        lastl = parseInt(l)+1;
                                    }
                                }
                                new Region(name, x, y, properties);
                            } else {
                                error('Invalid region at (' + x + ',' + y + ')');
                            }
                        }
                    }
                }
            } else {
                for (var j in rawlayer.data) {
                    if (rawlayer.data[j] != 0) {
                        var x = (j % rawlayer.width);
                        var y = ~~(j / rawlayer.width);
                        if (rawlayer.data[j]-1 == 1695) {
                            var propertystring = rawlayer.name.replace('Region:', '');
                            var properties = [];
                            var lastl = 0;
                            for (var l in propertystring) {
                                if (propertystring[l] == ':') {
                                    properties.push(propertystring.slice(lastl, l));
                                    lastl = parseInt(l)+1;
                                }
                            }
                            new Region(name, x, y, properties);
                        } else {
                            error('Invalid region at (' + x + ',' + y + ')');
                        }
                    }
                }
            }
        }
        if (raw.layers[i].name.includes('Teleporter:')) {
            var rawlayer = raw.layers[i];
            if (rawlayer.chunks) {
                for (var j in rawlayer.chunks) {
                    var rawchunk = rawlayer.chunks[j];
                    for (var k in rawchunk.data) {
                        if (rawchunk.data[k] != 0) {
                            var x = (k % rawchunk.width)+rawchunk.x;
                            var y = ~~(k / rawchunk.width)+rawchunk.y;
                            if (rawchunk.data[k]-1 == 1694) {
                                var propertystring = rawlayer.name.replace('Teleporter:', '');
                                var properties = [];
                                var lastl = 0;
                                for (var l in propertystring) {
                                    if (propertystring[l] == ',') {
                                        properties.push(propertystring.slice(lastl, l));
                                        lastl = parseInt(l)+1;
                                    }
                                }
                                new Teleporter(name, x, y, properties);
                            } else {
                                error('Invalid teleporter at (' + x + ',' + y + ')');
                            }
                        }
                    }
                }
            } else {
                for (var j in rawlayer.data) {
                    if (rawlayer.data[j] != 0) {
                        var x = (j % rawlayer.width);
                        var y = ~~(j / rawlayer.width);
                        if (rawlayer.data[j]-1 == 1694) {
                            var propertystring = rawlayer.name.replace('Teleporter:', '');
                            var properties = [];
                            var lastl = 0;
                            for (var l in propertystring) {
                                if (propertystring[l] == ',') {
                                    properties.push(propertystring.slice(lastl, l));
                                    lastl = parseInt(l)+1;
                                }
                            }
                            new Teleporter(name, x, y, properties);
                        } else {
                            error('Invalid teleporter at (' + x + ',' + y + ')');
                        }
                    }
                }
            }
        }
    }
};

loadMap('World');
loadMap('The Void')
loadMap('Outpost Cottage 1');
loadMap('Outpost Cottage 2');

for (var i in Npc.list) {
    if (npcWaypoints[Npc.list[i].npcId]) {
        Npc.list[i].ai.idleWaypoints.waypoints = npcWaypoints[Npc.list[i].npcId];
    }
}