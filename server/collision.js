// Copyright (C) 2021 Radioactive64

Collision = function(map, x, y, type) {
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
        default:
            error('invalid collision');
            break;
    }
    if (Collision.list[map][y]) {
        Collision.list[map][y][x] = coltype;
    } else {
        Collision.list[map][y] = [];
        Collision.list[map][y][x] = coltype;
    }
};
Collision.getColEntity = function(map, x, y) {
    var collision = [];
    switch (Collision.list[map][y][x]) {
        case 0:
            break;
        case 1:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+32,
                width: 64,
                height: 64
            };
            break;
        case 2:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+48,
                width: 64,
                height: 32
            };
            break;
        case 3:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+16,
                width: 64,
                height: 32
            };
            break;
        case 4:
            collision[0] = {
                map: map,
                x: x*64+16,
                y: y*64+32,
                width: 32,
                height: 64
            };
            break;
        case 5:
            collision[0] = {
                map: map,
                x: x*64+48,
                y: y*64+32,
                width: 32,
                height: 64
            };
            break;
        case 6:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+48,
                width: 64,
                height: 32
            };
            collision[1] = {
                map: map,
                x: x*64+48,
                y: y*64+32,
                width: 32,
                height: 64
            };
            break;
        case 7:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+16,
                width: 64,
                height: 32
            };
            collision[1] = {
                map: map,
                x: x*64+16,
                y: y*64+32,
                width: 32,
                height: 64
            };
            break;
        case 8:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+16,
                width: 64,
                height: 32
            };
            collision[1] = {
                map: map,
                x: x*64+48,
                y: y*64+32,
                width: 32,
                height: 64
            };
            break;
        case 9:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+48,
                width: 64,
                height: 32
            };
            collision[1] = {
                map: map,
                x: x*64+16,
                y: y*64+32,
                width: 32,
                height: 64
            };
            break;
        case 10:
            collision[0] = {
                map: map,
                x: x*64+32,
                y: y*64+32,
                width: 32,
                height: 32
            };
            break;
        case 11:
            collision[0] = {
                map: map,
                x: x*64+16,
                y: y*64+48,
                width: 32,
                height: 32
            };
            break;
        case 12:
            collision[0] = {
                map: map,
                x: x*64+48,
                y: y*64+48,
                width: 32,
                height: 32
            };
            break;
        case 13:
            collision[0] = {
                map: map,
                x: x*64+48,
                y: y*64+16,
                width: 32,
                height: 32
            };
            break;
        case 14:
            collision[0] = {
                map: map,
                x: x*64+16,
                y: y*64+16,
                width: 32,
                height: 32
            };
            break;
        default:
            console.error('invalid collision');
            break;
    }
    return collision;
};
Collision.list = [];

Spawner = function(map, x, y, types) {
    var self = {
        id: null,
        x: x*64+32,
        y: y*64+32,
        map: map,
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
            var localmonster = new Monster(monstertype, self.x, self.y, self.map);
            localmonster.spawnerID = self.id;
            localmonster.onDeath = function() {
                localmonster.alive = false;
                try {
                    Spawner.list[localmonster.spawnerID].onMonsterDeath();
                } catch (err) {
                    error(err);
                }
                delete Monster.list[localmonster.id];
            };
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
    if (Region.list[map][y]) {
        Region.list[map][y][x] = data;
    } else {
        Region.list[map][y] = [];
        Region.list[map][y][x] = data;
    }
};
Region.list = [];