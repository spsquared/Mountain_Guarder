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
    Collision.list[map][y][x] = coltype;
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

Spawner = function(map, x, y, type) {
    var self = {
        id: null,
        x: x,
        y: y,
        map: map,
        type: type
    };
    self.id = Math.random();
    var spawnedmonster = new Monster(self.type, self.x, self.y, self.map);
    var spawnedmonster = new Monster(Spawner.list[self.spawnerID].type, Spawner.list[self.spawnerID].x, Spawner.list[self.spawnerID].y, Spawner.list[self.spawnerID].map);
    setMonsterRespawn(spawnedmonster, Spawner.list[self.spawnerID]);
};
setMonsterRespawn = function(spawnedmonster, self) {
    spawnedmonster.spawnerID = self.id;
    spawnedmonster.onDeath = function() {
        self.alive = false;
        delete Monster.list[self.id];
        setTimeout(async function() {
            var spawnedmonster = new Monster(Spawner.list[self.spawnerID].type, Spawner.list[self.spawnerID].x, Spawner.list[self.spawnerID].y, Spawner.list[self.spawnerID].map);
            setMonsterRespawn(spawnedmonster, Spawner.list[self.spawnerID]);
        });
    }
};