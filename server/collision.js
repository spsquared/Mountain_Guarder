// Copyright (C) 2022 Radioactive64

Collision = function(map, x, y, layer, type) {
    var coltype = 0;
    switch (type) {
        case -1:
            coltype = 0;
            break;
        case 2121:
            coltype = 1;
            break;
        case 2122:
            coltype = 2;
            break;
        case 2123:
            coltype = 3;
            break;
        case 2124:
            coltype = 4;
            break;
        case 2125:
            coltype = 5;
            break;
        case 2126:
            coltype = 6;
            break;
        case 2127:
            coltype = 7;
            break;
        case 2128:
            coltype = 8;
            break;
        case 2129:
            coltype = 9;
            break;
        case 2207:
            coltype = 10;
            break;
        case 2208:
            coltype = 11;
            break;
        case 2209:
            coltype = 12;
            break;
        case 2210:
            coltype = 13;
            break;
        case 2211:
            coltype = 14;
            break;
        case 2212:
            coltype = 15;
            break;
        case 2213:
            coltype = 16;
            break;
        case 2293:
            coltype = 17;
            break;
        case 2294:
            coltype = 18;
            break;
        case 2295:
            coltype = 19;
            break;
        case 2296:
            coltype = 20;
            break;
        case 2297:
            coltype = 21;
            break;
        case 2298:
            coltype = 22;
            break;
        case 2299:
            coltype = 23;
            break;
        case 2230:
            coltype = 24;
            break;
        case 2231:
            coltype = 25;
            break;
        case 2379:
            coltype = 26;
            break;
        case 2380:
            coltype = 27;
            break;
        case 2381:
            coltype = 28;
            break;
        case 2382:
            coltype = 29;
            break;
        case 2383:
            coltype = 30;
            break;
        case 2384:
            coltype = 31;
            break;
        case 2385:
            coltype = 32;
            break;
        case 1949:
            new Layer(map, x, y, layer, 1);
            return;
        case 1950:
            new Layer(map, x, y, layer, 2);
            return;
        case 1951:
            new Layer(map, x, y, layer, 3);
            return;
        case 1952:
            new Layer(map, x, y, layer, 4);
            return;
        case 1953:
            new Layer(map, x, y, layer, 5);
            return;
        case 2035:
            new Layer(map, x, y, layer, 6);
            return;
        case 2036:
            new Layer(map, x, y, layer, 7);
            return;
        case 2037:
            new Layer(map, x, y, layer, 8);
            return;
        case 2038:
            new Layer(map, x, y, layer, 9);
            return;
        case 2039:
            new Layer(map, x, y, layer, 10);
            return;
        case 2130:
            coltype = 3;
            new Layer(map, x, y, layer, 2);
            break;
        case 2131:
            coltype = 2;
            new Layer(map, x, y, layer, 3);
            break;
        case 2132:
            coltype = 5;
            new Layer(map, x, y, layer, 4);
            break;
        case 2133:
            coltype = 4;
            new Layer(map, x, y, layer, 5);
            break;
        case 2216:
            coltype = 3;
            new Layer(map, x, y, layer, 7);
            break;
        case 2217:
            coltype = 2;
            new Layer(map, x, y, layer, 8);
            break;
        case 2218:
            coltype = 5;
            new Layer(map, x, y, layer, 9);
            break;
        case 2219:
            coltype = 4;
            new Layer(map, x, y, layer, 10);
            break;
        case 2302:
            coltype = 19;
            new Layer(map, x, y, layer, 2);
            break;
        case 2303:
            coltype = 18;
            new Layer(map, x, y, layer, 3);
            break;
        case 2304:
            coltype = 21;
            new Layer(map, x, y, layer, 4);
            break;
        case 2305:
            coltype = 20;
            new Layer(map, x, y, layer, 5);
            break;
        case 2388:
            coltype = 19;
            new Layer(map, x, y, layer, 7);
            break;
        case 2389:
            coltype = 18;
            new Layer(map, x, y, layer, 8);
            break;
        case 2390:
            coltype = 21;
            new Layer(map, x, y, layer, 9);
            break;
        case 2391:
            coltype = 20;
            new Layer(map, x, y, layer, 10);
            break;
        default:
            error('Invalid collision at (' + map + ',' + layer + ',' + x + ',' + y + ')');
            break;
    }
    if (Collision.grid[map][layer][parseInt(y)]) {
        Collision.grid[map][layer][parseInt(y)][parseInt(x)] = coltype;
    } else {
        Collision.grid[map][layer][parseInt(y)] = [];
        Collision.grid[map][layer][parseInt(y)][parseInt(x)] = coltype;
    }
    return coltype;
};
Collision.getColEntity = function(map, x, y, layer) {
    var collision = [];
    var coltype = 0;
    if (Collision.grid[map]) if (Collision.grid[map][layer]) if (Collision.grid[map][layer][y]) if (Collision.grid[map][layer][y][x]) coltype = Collision.grid[map][layer][y][x];
    var noProjectile = false;
    if (coltype > 16) {
        noProjectile = true;
        coltype -= 16;
    }
    switch (coltype) {
        case 0:
            break;
        case 1:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+32,
                width: 64,
                height: 64,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            break;
        case 2:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+48,
                width: 64,
                height: 32,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            break;
        case 3:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+16,
                width: 64,
                height: 32,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            break;
        case 4:
            collision[0] = {
                map: map,
                x: x*64+16,
                y: y*64+32,
                width: 32,
                height: 64,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            break;
        case 5:
            collision[0] = {
                map: map,
                x: x*64+48,
                y: y*64+32,
                width: 32,
                height: 64,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            break;
        case 6:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+48,
                width: 64,
                height: 32,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            collision[1] = {
                map: map,
                x: x*64+48,
                y: y*64+32,
                width: 32,
                height: 64,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            break;
        case 7:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+16,
                width: 64,
                height: 32,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            collision[1] = {
                map: map,
                x: x*64+16,
                y: y*64+32,
                width: 32,
                height: 64,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            break;
        case 8:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+16,
                width: 64,
                height: 32,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            collision[1] = {
                map: map,
                x: x*64+48,
                y: y*64+32,
                width: 32,
                height: 64,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            break;
        case 9:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+48,
                width: 64,
                height: 32,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            collision[1] = {
                map: map,
                x: x*64+16,
                y: y*64+32,
                width: 32,
                height: 64,
                collisionBoxSize: 64,
                noProjectile: noProjectile
            };
            break;
        case 10:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+32,
                width: 32,
                height: 32,
                collisionBoxSize: 32,
                noProjectile: noProjectile
            };
            break;
        case 11:
            collision[0] = {
                map: map,
                x: x*64+16,
                y: y*64+48,
                width: 32,
                height: 32,
                collisionBoxSize: 32,
                noProjectile: noProjectile
            };
            break;
        case 12:
            collision[0] = {
                map: map,
                x: x*64+48,
                y: y*64+48,
                width: 32,
                height: 32,
                collisionBoxSize: 32,
                noProjectile: noProjectile
            };
            break;
        case 13:
            collision[0] = {
                map: map,
                x: x*64+48,
                y: y*64+16,
                width: 32,
                height: 32,
                collisionBoxSize: 32,
                noProjectile: noProjectile
            };
            break;
        case 14:
            collision[0] = {
                map: map,
                x: x*64+16,
                y: y*64+16,
                width: 32,
                height: 32,
                collisionBoxSize: 32,
                noProjectile: noProjectile
            };
            break;
        case 15:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+40,
                width: 48,
                height: 48,
                collisionBoxSize: 48,
                noProjectile: noProjectile
            };
            break;
        case 16:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+36,
                width: 48,
                height: 56,
                collisionBoxSize: 56,
                noProjectile: noProjectile
            };
            break;
        default:
            error('Invalid collision ' + coltype + ' at (' + map + ',' + layer + ',' + x + ',' + y + ')');
            break;
    }
    
    return collision;
};
Collision.grid = [];

Layer = function(map, x, y, layer, type) {
    if (Layer.grid[map][layer][parseInt(y)]) {
        Layer.grid[map][layer][parseInt(y)][parseInt(x)] = type;
    } else {
        Layer.grid[map][layer][parseInt(y)] = [];
        Layer.grid[map][layer][parseInt(y)][parseInt(x)] = type;
    }
    return type;
};
Layer.getColEntity = function(map, x, y, layer) {
    var collision = [];
    var coltype = 0;
    if (Layer.grid[map]) if (Layer.grid[map][layer]) if (Layer.grid[map][layer][y]) if (Layer.grid[map][layer][y][x]) coltype = Layer.grid[map][layer][y][x];
    var dir = 1;
    if (coltype > 5) {
        dir = -1;
        coltype -= 5;
    }
    switch (coltype) {
        case 0:
            break;
        case 1:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+32,
                width: 64,
                height: 64,
                collisionBoxSize: 64,
                dir: dir
            };
            break;
        case 2:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+48,
                width: 64,
                height: 32,
                collisionBoxSize: 64,
                dir: dir
            };
            break;
        case 3:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+16,
                width: 64,
                height: 32,
                collisionBoxSize: 64,
                dir: dir
            };
            break;
        case 4:
            collision[0] = {
                map: map,
                x: x*64+16,
                y: y*64+32,
                width: 32,
                height: 64,
                collisionBoxSize: 64,
                dir: dir
            };
            break;
        case 5:
            collision[0] = {
                map: map,
                x: x*64+48,
                y: y*64+32,
                width: 32,
                height: 64,
                collisionBoxSize: 64,
                dir: dir
            };
            break;
        default:
            error('Invalid layer ' + coltype + 'at (' + map + ',' + layer + ',' + x + ',' + y + ')');
            break;
    }
    
    return collision;
};
Layer.grid = [];

Slowdown = function(map, x, y, type) {
    var coltype = 0;
    switch (type) {
        case 0:
            break;
        case 2465:
            coltype = 1;
            break;
        case 2466:
            coltype = 2;
            break;
        case 2467:
            coltype = 3;
            break;
        case 2468:
            coltype = 4;
            break;
        case 2469:
            coltype = 5;
            break;
        default:
            error('Invalid slowdown at (' + map + ',' + layer + ',' + x + ',' + y + ')');
            break;
    }
    if (Slowdown.grid[map][parseInt(y)]) {
        Slowdown.grid[map][parseInt(y)][parseInt(x)] = type;
    } else {
        Slowdown.grid[map][parseInt(y)] = [];
        Slowdown.grid[map][parseInt(y)][parseInt(x)] = type;
    }
    return type;
}
Slowdown.getColEntity = function(map, x, y) {
    var collision = [];
    var coltype = 0;
    if (Slowdown.grid[map]) if (Slowdown.grid[map][y]) if (Slowdown.grid[map][y][x]) coltype = Slowdown.grid[map][y][x];
    switch (coltype) {
        case 0:
            break;
        case 1:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+32,
                width: 64,
                height: 64,
                collisionBoxSize: 64,
            };
            break;
        case 2:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+48,
                width: 64,
                height: 32,
                collisionBoxSize: 64,
            };
            break;
        case 3:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+16,
                width: 64,
                height: 32,
                collisionBoxSize: 64,
            };
            break;
        case 4:
            collision[0] = {
                map: map,
                x: x*64+16,
                y: y*64+32,
                width: 32,
                height: 64,
                collisionBoxSize: 64,
            };
            break;
        case 5:
            collision[0] = {
                map: map,
                x: x*64+48,
                y: y*64+32,
                width: 32,
                height: 64,
                collisionBoxSize: 64,
            };
            break;
        default:
            error('Invalid slowdown ' + coltype + 'at (' + map + ',' + layer + ',' + x + ',' + y + ')');
            break;
    }
    
    return collision;
};
Slowdown.grid = [];

Spawner = function(map, x, y, layer, types) {
    var self = {
        id: null,
        x: x*64+32,
        y: y*64+32,
        map: map,
        layer: parseInt(layer),
        types: types
    };
    self.id = Math.random();

    self.spawnMonster = function() {
        try {
            var multiplier = 0;
            for (var i in self.types) {
                multiplier += Monster.types[self.types[i]].spawnChance;
            }
            var random = Math.random()*multiplier;
            var min = 0;
            var max = 0;
            var monstertype;
            for (var i in self.types) {
                max += Monster.types[self.types[i]].spawnChance;
                if (random >= min && random <= max) {
                    monstertype = self.types[i];
                    break;
                }
                min += Monster.types[self.types[i]].spawnChance;
            }
            for (var i = 0; i < 50; i++) {
                new Particle(self.map, self.x, self.y, 'spawn');
            }
            var localmonster = new Monster(monstertype, self.x, self.y, self.map, self.layer);
            localmonster.spawnerID = self.id;
            localmonster.oldOnDeath = localmonster.onDeath;
            localmonster.onDeath = function(entity) {
                try {
                    Spawner.list[localmonster.spawnerID].onMonsterDeath();
                } catch (err) {
                    error(err);
                }
                localmonster.oldOnDeath(entity);
            };
            localmonster.canMove = false;
            setTimeout(function() {
                localmonster.canMove = true;
            }, 3000);
        } catch (err) {
            error(err);
        }
    };
    self.onMonsterDeath = function() {
        var time = Math.random()*10000+10000;
        setTimeout(function() {
            self.spawnMonster();
        }, time);
    };
    
    self.spawnMonster();

    Spawner.list[self.id] = self;
    return self;
};
Spawner.list = [];

Region = function(map, x, y, properties) {
    var data = {
        name: 'missing name',
        noattack: false,
        nomonster: false
    };
    for (var i in properties) {
        if (properties[i] == 'noattack') data.noattack = true;
        else if (properties[i] == 'nomonster') data.nomonster = true;
        else data.name = properties[i];
    }
    if (Region.grid[map][parseInt(y)]) {
        Region.grid[map][parseInt(y)][parseInt(x)] = data;
    } else {
        Region.grid[map][parseInt(y)] = [];
        Region.grid[map][parseInt(y)][parseInt(x)] = data;
    }

    return data;
};
Region.grid = [];

Teleporter = function(map, x, y, properties) {
    var data = {
        x: 0,
        y: 0,
        map: 'World',
        layer: 0,
        direction: null
    };
    data.map = properties[0];
    data.x = parseInt(properties[1]);
    data.y = parseInt(properties[2]);
    data.layer = parseInt(properties[3]);
    data.direction = properties[4];
    if (Teleporter.grid[map][parseInt(y)]) {
        Teleporter.grid[map][parseInt(y)][parseInt(x)] = data;
    } else {
        Teleporter.grid[map][parseInt(y)] = [];
        Teleporter.grid[map][parseInt(y)][parseInt(x)] = data;
    }

    return data;
};
Teleporter.grid = [];