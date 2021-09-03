// Copyright (C) 2021 Radioactive64

function loadMap(name) {
    var raw = require('./../client/maps/' + name + '.json');
    Collision.list[name] = [];
    Region.list[name] = [];
    Collision.list[name].width = raw.width;
    Collision.list[name].height = raw.height;
    for (var i in raw.layers) {
        if (raw.layers[i].name.includes('Collision')) {
            var rawlayer = raw.layers[i];
            for (var j in rawlayer.chunks) {
                var rawchunk = rawlayer.chunks[j];
                for (var k in rawchunk.data) {
                    var x = (k % rawchunk.width)+rawchunk.x;
                    var y = ~~(k / rawchunk.width)+rawchunk.y;
                    new Collision(name, x, y, rawchunk.data[k]-1);
                }
            }
        }
        if (raw.layers[i].name.includes('Spawner')) {
            var rawlayer = raw.layers[i];
            for (var j in rawlayer.chunks) {
                var rawchunk = rawlayer.chunks[j];
                for (var k in rawchunk.data) {
                    if (rawchunk.data[k]-1 == 1692) {
                        var x = (k % rawchunk.width)+rawchunk.x;
                        var y = ~~(k / rawchunk.width)+rawchunk.y;
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
                    } 
                }
            }
        }
        if (raw.layers[i].name.includes('Region')) {
            var rawlayer = raw.layers[i];
            for (var j in rawlayer.chunks) {
                var rawchunk = rawlayer.chunks[j];
                for (var k in rawchunk.data) {
                    if (rawchunk.data[k]-1 == 1695) {
                        var x = (k % rawchunk.width)+rawchunk.x;
                        var y = ~~(k / rawchunk.width)+rawchunk.y;
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
                    } 
                }
            }
        }
    }
};
loadMap('World');