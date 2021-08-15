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
        maxspeed: 0,
        width: 16,
        height: 16,
        map: "The Village"
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
            collisions.push(Collision.getType(self.map, self.gridx, self.gridy));
        }
        if (Collision.list[self.map][self.gridy-1]) if (Collision.list[self.map][self.gridy-1][self.gridx]) {
            collisions.push(Collision.getType(self.map, self.gridx, self.gridy-1));
        }
        if (Collision.list[self.map][self.gridy+1]) if (Collision.list[self.map][self.gridy+1][self.gridx]) {
            collisions.push(Collision.getType(self.map, self.gridx, self.gridy+1));
        }
        if (Collision.list[self.map][self.gridy]) if (Collision.list[self.map][self.gridy][self.gridx-1]) {
            collisions.push(Collision.getType(self.map, self.gridx-1, self.gridy));
        }
        if (Collision.list[self.map][self.gridy]) if (Collision.list[self.map][self.gridy][self.gridx+1]) {
            collisions.push(Collision.getType(self.map, self.gridx+1, self.gridy));
        }
        for (var i in collisions) {
            for (var j in collisions[i]) {
                if (self.collideWith(collisions[i][j])) {
                    var x = self.x;
                    self.x = self.lastx;
                    if (self.collideWith(collisions[i][j])) {
                        self.x = x;
                        self.y = self.lasty;
                        if (self.collideWith(collisions[i][j])) {
                            self.x = self.lastx;
                            self.y = self.lasty;
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
    self.getInit = function() {
        // todo
    };
    
    return self;
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
    self.stats = {
        hp: 0,
        xp: 0,
        mana: 0,
        level: 0,
        isplaceholder: true
    };
    self.maxspeed = 20;
    self.alive = true;
    self.updatePos = function() {
        self.xspeed = 0;
        self.yspeed = 0;
        if (self.keys.up) self.yspeed = -self.maxspeed;
        if (self.keys.down) self.yspeed = self.maxspeed;
        if (self.keys.left) self.xspeed = -self.maxspeed;
        if (self.keys.right) self.xspeed = self.maxspeed;
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
Monster = function(type, x, y) {
    var self = new Rig();
    self.id = Math.random();
    self.type = type;

    Monster.list[self.id] = self;
};
Monster.update = function() {
    var pack = [];
    for (var i in Monster.list) {
        var localmonster = Monster.list[i];
        localmonster.update();
        pack.push({
            id: localmonster.id,
            type: localmonster.type,
            map: localmonster.map,
            x: localmonster.x,
            y: localmonster.y
        });
    }
    return pack;
};
Monster.list = [];

// projectiles
Projectile = function(type, x, y, angle) {
    var self = new Entity();
    self.id = Math.random();
    self.type = type;
    self.x = x;
    self.y = y;
    self.angle = angle*(180/Math.PI);
    self.xspeed = Math.cos(angle)*20;
    self.yspeed = Math.sin(angle)*20;
    self.width = 16;
    self.height = 32;
    
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