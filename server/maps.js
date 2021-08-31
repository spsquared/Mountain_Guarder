// Copyright (C) 2021 Radioactive64

function loadMap(name) {
    Collision.list[name] = [];
    var raw = require('./../client/maps/' + name + '.json');
    Collision.list[name].width = raw.width;
    Collision.list[name].height = raw.height;
    for (var y = 0; y < raw.height; y++) {
        Collision.list[name][y] = [];
    }
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
    }
}
loadMap('World');