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
        maxspeed: 0,
        width: 0,
        height: 0,
        map: null
    };

    self.update = function() {
        self.updatePos();
        self.collide();
    };
    self.updatePos = function() {
        self.x += self.xspeed;
        self.y += self.yspeed;
        self.lastx = self.x;
        self.lasty = self.y;
    };
    self.collide = function() {
        // waiting on finished collision engine and testing
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
    self.maxspeed = 10;
    self.alive = true;
    self.updatePos = function() {
        self.xspeed = 0;
        self.yspeed = 0;
        if (self.keys.up) self.y -= self.maxspeed;
        if (self.keys.down) self.y += self.maxspeed;
        if (self.keys.left) self.x -= self.maxspeed;
        if (self.keys.right) self.x += self.maxspeed;
        self.lastx = self.x;
        self.lasty = self.y;
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