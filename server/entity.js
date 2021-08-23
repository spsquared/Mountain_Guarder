// Copyright (C) 2021 Radioactive64

// entities
Entity = function() {
    var self = {
        id: null,
        x: 0,
        y: 0,
        xspeed: 0,
        yspeed: 0,
        lastx: 0,
        lasty: 0,
        gridx: 0,
        gridy: 0,
        moveSpeed: 0,
        width: 16,
        height: 16,
        map: null
    };

    self.update = function() {
        self.updatePos();
    };
    self.updatePos = function() {
        self.collide();
    };
    self.collide = function() {
        var reachedx = false;
        var reachedy = false;
        var xdir = 0;
        var ydir = 0;
        var xtravel = 0;
        var ytravel = 0;
        if (self.xspeed < 0) {
            xdir = -1;
        }
        if (self.yspeed < 0) {
            ydir = -1;
        }
        if (self.xspeed > 0) {
            xdir = 1;
        }
        if (self.yspeed > 0) {
            ydir = 1;
        }
        while (!reachedx || !reachedy) {
            if (xtravel >= Math.abs(self.xspeed)) reachedx = true;
            if (ytravel >= Math.abs(self.yspeed)) reachedy = true;
            self.lastx = self.x;
            self.lasty = self.y;
            self.x += xdir;
            self.y += ydir;
            self.gridx = Math.floor(self.x/64);
            self.gridy = Math.floor(self.y/64);
            self.checkCollision();
            xtravel++;
            ytravel++;
        }
    };
    self.checkCollision = function() {
        var collisions = [];
        if (Collision.list[self.map][self.gridy]) if (Collision.list[self.map][self.gridy][self.gridx]) {
            collisions.push(Collision.getColEntity(self.map, self.gridx, self.gridy));
        }
        if (Collision.list[self.map][self.gridy-1]) if (Collision.list[self.map][self.gridy-1][self.gridx]) {
            collisions.push(Collision.getColEntity(self.map, self.gridx, self.gridy-1));
        }
        if (Collision.list[self.map][self.gridy+1]) if (Collision.list[self.map][self.gridy+1][self.gridx]) {
            collisions.push(Collision.getColEntity(self.map, self.gridx, self.gridy+1));
        }
        if (Collision.list[self.map][self.gridy]) if (Collision.list[self.map][self.gridy][self.gridx-1]) {
            collisions.push(Collision.getColEntity(self.map, self.gridx-1, self.gridy));
        }
        if (Collision.list[self.map][self.gridy]) if (Collision.list[self.map][self.gridy][self.gridx+1]) {
            collisions.push(Collision.getColEntity(self.map, self.gridx+1, self.gridy));
        }
        for (var i in collisions) {
            for (var j in collisions[i]) {
                if (self.collideWith(collisions[i][j])) {
                    var x = self.x;
                    var xspeed = self.xspeed;
                    self.x = self.lastx;
                    self.xspeed = 0;
                    if (self.collideWith(collisions[i][j])) {
                        self.x = x;
                        self.xspeed = xspeed;
                        self.y = self.lasty;
                        self.yspeed = 0;
                        if (self.collideWith(collisions[i][j])) {
                            self.x = self.lastx;
                            self.xspeed = 0;
                            self.y = self.lasty;
                            self.yspeed = 0;
                        }
                    }
                }
            }
        }
    }
    self.collideWith = function(entity) {
        var bound1left = self.x-(self.width/2);
        var bound1right = self.x+(self.width/2);
        var bound1top = self.y-(self.height/2);
        var bound1bottom = self.y+(self.height/2); 
        var bound2left = entity.x-(entity.width/2);
        var bound2right = entity.x+(entity.width/2);
        var bound2top = entity.y-(entity.height/2);
        var bound2bottom = entity.y+(entity.height/2);
        if (entity.map == self.map && bound1left < bound2right && bound1right >= bound2left && bound1top <= bound2bottom && bound1bottom >= bound2top) {
            return true;
        }
        return false;
    };
    
    return self;
};
Entity.update = function() {
    var pack1 = Player.update();
    var pack2 = Npc.update();
    var pack3 = Projectile.update();
    var pack4 = Monster.update();
    var pack = {
        players: [],
        monsters: [],
        projectiles: []
    };
    for (var i in pack1) {
        pack.players[i] = pack1[i];
    }
    for (var i in pack2) {
        pack.players[i] = pack2[i];
    }
    for (var i in pack3) {
        pack.projectiles[i] = pack3[i];
    }
    for (var i in pack4) {
        pack.monsters[i] = pack4[i];
    }

    return pack;
};

// rigs
Rig = function() {
    var self = new Entity();
    self.keys = {
        up: false,
        down: false,
        left: false,
        right: false
    };
    self.moveSpeed = 20;
    self.stats = {
        attack: 1,
        defense: 0,
        damageReduction: 0,
        heal: 1,
        speed: 1,
        range: 1,
        critChance: 0
    };
    self.hp = 0;
    self.alive = true;

    self.update = function() {
        self.updatePos();
        if (self.hp < 1) {
            self.alive = false;
        }
    };
    self.updatePos = function() {
        self.xspeed = 0;
        self.yspeed = 0;
        if (self.keys.up) self.yspeed = -self.moveSpeed;
        if (self.keys.down) self.yspeed = self.moveSpeed;
        if (self.keys.left) self.xspeed = -self.moveSpeed;
        if (self.keys.right) self.xspeed = self.moveSpeed;
        self.collide();
    };

    return self;
};

// npcs
Npc = function(param) {
    var self = new Rig();
    self.id = Math.random();

    Npc.list[self.id] = self;
    return self;
};
Npc.update = function() {
    var pack = [];
    for (var i in Npc.list) {
        localnpc = Npc.list[i];
        localnpc.update();
        pack.push({
            id: localnpc.id,
            map: localnpc.map,
            x: localnpc.x,
            y: localnpc.y,
        });
    }
    return pack;
};
Npc.list = [];

// players
Player = function(socket) {
    var self = new Rig();
    self.id = Math.random();
    
    self.map = 'The Village';

    socket.on('keyPress', function(data) {
        if (data.key == 'up') self.keys.up = data.state;
        if (data.key == 'down') self.keys.down = data.state;
        if (data.key == 'left') self.keys.left = data.state;
        if (data.key == 'right') self.keys.right = data.state;
    });

    Player.list[self.id] = self;
    return self;
};
Player.update = function() {
    var pack = [];
    for (var i in Player.list) {
        var localplayer = Player.list[i];
        localplayer.update();
        pack.push({
            id: localplayer.id,
            map: localplayer.map,
            x: localplayer.x,
            y: localplayer.y
        });
    }
    return pack;
};
Player.list = [];

// monsters
Monster = function(type, x, y, map) {
    var self = new Rig();
    self.id = Math.random();
    self.x = x;
    self.y = y;
    self.map = map;
    self.ai = {
        aggroTarget: null,
        attackType: 'none',
        idleMove: 'random',

    };
    for (var mtype in Monster.types) {
        if (type == mtype) {
            var tempmonster = Monster.types[mtype];
            self.type = type;
            self.stats = tempmonster.stats;
            self.moveSpeed = tempmonster.moveSpeed;
            self.width = tempmonster.width;
            self.height = tempmonster.height;
            self.hp = tempmonster.hp
        }
    }

    self.update = function() {
        if (self.hp < 1) {
            self.alive = false;
        }
    };
    self.updateAggro = function() {
        // find player with lowest distance
    };

    Monster.list[self.id] = self;
    return self;
};
Monster.update = function() {
    var pack = [];
    for (var i in Monster.list) {
        var localmonster = Monster.list[i];
        localmonster.update();
        pack.push({
            id: localmonster.id,
            map: localmonster.map,
            x: localmonster.x,
            y: localmonster.y
        });
    }
    return pack;
};
Monster.types = require('./monster.json');
Monster.list = [];

// projectiles
Projectile = function(type, x, y, map, mousex, mousey) {
    var self = new Entity();
    self.id = Math.random();
    self.type = type;
    self.x = x;
    self.y = y;
    self.map = map;
    self.angle = Math.atan2(-(y-mousey), -(x-mousex));
    self.xspeed = Math.cos(self.angle)*20;
    self.yspeed = Math.sin(self.angle)*20;
    self.width = 16;
    self.height = 32;

    self.update = function() {
        self.updatePos();
        for (var i in Player.list) {
            if (self.collideWith(Player.list[i])) {
                Player.list[i].hp = 0;
                delete Projectile.list[self.id];
            }
        }
    };
    self.checkCollision = function() {
        var collisions = [];
        if (Collision.list[self.map][self.gridy]) if (Collision.list[self.map][self.gridy][self.gridx]) {
            collisions.push(Collision.getColEntity(self.map, self.gridx, self.gridy));
        }
        if (Collision.list[self.map][self.gridy-1]) if (Collision.list[self.map][self.gridy-1][self.gridx]) {
            collisions.push(Collision.getColEntity(self.map, self.gridx, self.gridy-1));
        }
        if (Collision.list[self.map][self.gridy+1]) if (Collision.list[self.map][self.gridy+1][self.gridx]) {
            collisions.push(Collision.getColEntity(self.map, self.gridx, self.gridy+1));
        }
        if (Collision.list[self.map][self.gridy]) if (Collision.list[self.map][self.gridy][self.gridx-1]) {
            collisions.push(Collision.getColEntity(self.map, self.gridx-1, self.gridy));
        }
        if (Collision.list[self.map][self.gridy]) if (Collision.list[self.map][self.gridy][self.gridx+1]) {
            collisions.push(Collision.getColEntity(self.map, self.gridx+1, self.gridy));
        }
        for (var i in collisions) {
            for (var j in collisions[i]) {
                if (self.collideWith(collisions[i][j])) {
                    delete Projectile.list[self.id];
                }
            }
        }
    };
    
    Projectile.list[self.id] = self;
    return self;
};
Projectile.update = function() {
    var pack = [];
    for (var i in Projectile.list) {
        localprojectile = Projectile.list[i];
        localprojectile.update();
        pack.push({
            id: localprojectile.id,
            map: localprojectile.map,
            x: localprojectile.x,
            y: localprojectile.y,
            angle: localprojectile.angle
        });
    }
    return pack;
};
Projectile.list = [];