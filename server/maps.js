function loadMap(name) {
    Collision.list[name] = [];
    var raw = require('./../client/maps/' + name + '.json');
    for (var i in raw.layers) {
        if (raw.layers[i].name == 'Collision') {
            var rawlayer = raw.layers[i];
            for (var y = 0; y < rawlayer.height; y++) {
                Collision.list[name][y] = [];
            }
            for (var j in rawlayer.data) {
                var x = (j % rawlayer.width);
                var y = ~~(j / rawlayer.width);
                new Collision(name, x, y, rawlayer.data[j]-1);
            }
        }
    }
}
loadMap('The Village');