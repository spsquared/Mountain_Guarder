// Copyright (C) 2021 Radioactive64

const PF = require('pathfinding');

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
        width: 0,
        height: 0,
        map: 'World'
    };

    self.update = function() {
        self.updatePos();
    };
    self.updatePos = function() {
        self.collide();
    };
    self.collide = function() {
        var xdir = self.xspeed/self.moveSpeed;
        var ydir = self.yspeed/self.moveSpeed;
        for (var i = 0; i < self.moveSpeed; i++) {
            self.lastx = self.x;
            self.lasty = self.y;
            self.x += xdir;
            self.y += ydir;
            self.gridx = Math.floor(self.x/64);
            self.gridy = Math.floor(self.y/64);
            self.checkCollision();
        }
        self.x = Math.round(self.x);
        self.y = Math.round(self.y);
        self.gridx = Math.floor(self.x/64);
        self.gridy = Math.floor(self.y/64);
    };
    self.checkCollision = function() {
        var collisions = [];
        if (self.xspeed > 0) {
            for (var x = self.gridx+1; x >= self.gridx-1; x--) {
                if (self.yspeed > 0) {
                    for (var y = self.gridy+1; y >= self.gridy-1; y--) {
                        if (Collision.list[self.map][y]) if (Collision.list[self.map][y][x])
                        collisions.push(Collision.getColEntity(self.map, x, y));
                    }
                } else {
                    for (var y = self.gridy-1; y <= self.gridy+1; y++) {
                        if (Collision.list[self.map][y]) if (Collision.list[self.map][y][x])
                        collisions.push(Collision.getColEntity(self.map, x, y));
                    }
                }
            }
        } else {
            for (var x = self.gridx-1; x <= self.gridx+1; x++) {
                if (self.yspeed > 0) {
                    for (var y = self.gridy+1; y >= self.gridy-1; y--) {
                        if (Collision.list[self.map][y]) if (Collision.list[self.map][y][x])
                        collisions.push(Collision.getColEntity(self.map, x, y));
                    }
                } else {
                    for (var y = self.gridy-1; y <= self.gridy+1; y++) {
                        if (Collision.list[self.map][y]) if (Collision.list[self.map][y][x])
                        collisions.push(Collision.getColEntity(self.map, x, y));
                    }
                }
            }
        }
        var colliding = false;
        for (var i in collisions) {
            for (var j in collisions[i]) {
                if (self.collideWith(collisions[i][j])) colliding = true;
            }
        }
        if (colliding) {
            colliding = false;
            var x = self.x;
            self.x = self.lastx;
            for (var i in collisions) {
                for (var j in collisions[i]) {
                    if (self.collideWith(collisions[i][j])) {
                        colliding = true;
                    }
                }
            }
            if (colliding) {
                colliding = false;
                self.x = x;
                self.y = self.lasty;
                for (var i in collisions) {
                    for (var j in collisions[i]) {
                        if (self.collideWith(collisions[i][j])) {
                            colliding = true;
                        }
                    }
                }
                if (colliding) {
                    colliding = false;
                    self.x = self.lastx;
                    self.y = self.lasty;
                    for (var i in collisions) {
                        for (var j in collisions[i]) {
                            if (self.collideWith(collisions[i][j])) {
                                colliding = true;
                            }
                        }
                    }
                    if (colliding) {
                        // error('object is still colliding');
                    }
                }
            }
        }
    };
    self.collideWith = function(entity) {
        var bound1left = self.x-(self.width/2);
        var bound1right = self.x+(self.width/2);
        var bound1top = self.y-(self.height/2);
        var bound1bottom = self.y+(self.height/2); 
        var bound2left = entity.x-(entity.width/2);
        var bound2right = entity.x+(entity.width/2);
        var bound2top = entity.y-(entity.height/2);
        var bound2bottom = entity.y+(entity.height/2);
        if (entity.map == self.map && bound1left < bound2right && bound1right > bound2left && bound1top < bound2bottom && bound1bottom > bound2top) {
            return true;
        }
        return false;
    };
    
    return self;
};
Entity.update = function() {
    var pack1 = Player.update();
    var pack2 = Monster.update();
    var pack3 = Projectile.update();
    var pack4 = Npc.update();
    var pack5 = Particle.update();
    var pack = {
        players: [],
        monsters: [],
        projectiles: [],
        particles: []
    };
    for (var i in pack1) {
        pack.players[i] = pack1[i];
    }
    pack.monsters = pack2;
    pack.projectiles = pack3
    for (var i in pack4) {
        pack.players[i] = pack4[i];
    }
    pack.particles = pack5;

    return pack;
};

// rigs
Rig = function() {
    var self = new Entity();
    self.width = 32;
    self.height = 32;
    self.region = {
        name: 'The Wilderness',
        noattack: false,
        nomonster: false
    };
    self.keys = {
        up: false,
        down: false,
        left: false,
        right: false
    };
    self.animationStage = 0;
    self.animationLength = 0;
    self.lastFrameUpdate = 0;
    self.animationSpeed = 100;
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
    self.hp = 100;
    self.maxHP = 100;
    self.xp = 0;
    self.maxXP = 0;
    self.mana = 200;
    self.maxMana = 200;
    self.alive = true;
    self.lastAttack = 0;

    self.update = function() {
        self.updatePos();
        if (self.hp < 1) {
            self.onDeath();
        }
        self.updateAnimation();
    };
    self.updatePos = function() {
        self.xspeed = 0;
        self.yspeed = 0;
        if (self.keys.up) self.yspeed = -self.moveSpeed;
        if (self.keys.down) self.yspeed = self.moveSpeed;
        if (self.keys.left) self.xspeed = -self.moveSpeed;
        if (self.keys.right) self.xspeed = self.moveSpeed;
        self.collide();
        self.region = {
            name: 'The Wilderness',
            noattack: false,
            nomonster: false
        };
        if (Region.list[self.map][self.gridy]) if (Region.list[self.map][self.gridy][self.gridx]) if (Region.list[self.map][self.gridy][self.gridx].name != self.region.name) {
            self.region = Region.list[self.map][self.gridy][self.gridx];
            self.onRegionChange();
        }
    };
    self.updateAnimation = function() {
        self.lastFrameUpdate++;
        if (self.lastFrameUpdate >= seconds(self.animationSpeed/1000)) {
            self.animationStage++;
            if (self.animationStage > self.animationLength) self.animationStage = 0;
            self.lastFrameUpdate = 0;
        }
    };
    self.onHit = function(entity, type) {
        switch (type) {
            case 'projectile':
                self.hp -= entity.damage;
                break;
            default:
                error('Invalid Entity type: ' + type);
                break;
        }
    };
    self.onDeath = function(entity) {
        self.alive = false;
    };
    self.onRegionChange = function() {};
    self.teleport = function(map, x, y) {
        self.map = map;
        self.x = x*64+32;
        self.y = y*64+32;
        // particles
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
            animationStage: localnpc.animationStage,
            isNPC: true
        });
    }
    return pack;
};
Npc.list = [];

// players
Player = function(socket) {
    var self = new Rig();
    self.id = Math.random();
    self.x = 80;
    self.y = 80;
    self.attacking = false;
    self.mouseX = 0;
    self.mouseY = 0;

    var maps = [];
    for (var i in Collision.list) {
        maps.push(i);
    }
    socket.emit('mapData', maps);
    socket.on('keyPress', function(data) {
        if (data.key == 'up') self.keys.up = data.state;
        if (data.key == 'down') self.keys.down = data.state;
        if (data.key == 'left') self.keys.left = data.state;
        if (data.key == 'right') self.keys.right = data.state;
    });
    socket.on('click', function(data) {
        if (data.button == 'left') {
            self.attacking = data.state;
            self.mouseX = data.x;
            self.mouseY = data.y; 
        }
    });
    socket.on('mouseMove', function(data) {
        self.mouseX = data.x;
        self.mouseY = data.y;
    });

    self.update = function() {
        self.updatePos();
        if (self.hp < 1) {
            self.onDeath();
        }
        self.lastAttack++;
        if (self.attacking && !self.region.noattack && self.lastAttack > seconds(0.2)) {
            self.lastAttack = 0;
            new Projectile('arrow', self.x, self.y, self.map, self.x+self.mouseX, self.y+self.mouseY, self.id);
        }
        self.updateAnimation();
        self.updateClient();
    };
    self.updateClient = function() {
        
    };
    self.onRegionChange = function() {
        socket.emit('region', self.region.name);
    };

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
            y: localplayer.y,
            animationStage: localplayer.animationStage,
            isNPC: false
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
        path: [],
        pathfinder: new PF.BiAStarFinder({
            allowDiagonal: true,
            dontCrossCorners: true
        }),
        grid: new PF.Grid(),
        lastPath: 0,
        lastAttack: 0,
        attackStage: 0,
        attackTime: 0,
        aggroRange: 0
    };
    self.targetMonsters = false;
    var tempmonster = Monster.types[type];
    self.type = type;
    self.stats = tempmonster.stats;
    self.moveSpeed = tempmonster.moveSpeed;
    self.width = tempmonster.width;
    self.height = tempmonster.height;
    self.hp = tempmonster.hp;
    self.ai.attackType = tempmonster.attackType;
    self.ai.aggroRange = tempmonster.aggroRange;
    self.animationLength = tempmonster.animationLength;

    self.update = function() {
        if (self.hp < 1) {
            self.onDeath();
        }
        self.updateAnimation();
        self.updateAggro();
        self.updatePos();
    };
    self.updatePos = function() {
        self.collide();
        self.region = {
            name: 'The Wilderness',
            noattack: false,
            nomonster: false
        };
        if (Region.list[self.map][self.gridy]) if (Region.list[self.map][self.gridy][self.gridx]) if (Region.list[self.map][self.gridy][self.gridx].name != self.region.name) {
            self.region = Region.list[self.map][self.gridy][self.gridx];
            self.onRegionChange();
        }
    };
    self.updateAggro = function() {
        self.ai.aggroTarget = null;
        if (self.targetMonsters) {
            var lowest = null;
            for (var i in Monster.list) {
                if (lowest == null) lowest = i;
                if (self.getDistance(Monster.list[i]) < self.ai.aggroRange*64 && self.getDistance(Monster.list[i]) < self.getDistance(Monster.list[lowest]) && i != self.id && !Monster.list[i].region.nomonster) lowest = i;
            }
            self.ai.aggroTarget = Monster.list[lowest];
        } else {
            var lowest = null;
            for (var i in Player.list) {
                if (lowest == null) lowest = i;
                if (self.getDistance(Player.list[i]) < self.ai.aggroRange*64 && self.getDistance(Player.list[i]) < self.getDistance(Player.list[lowest]) && !Player.list[i].region.nomonster) lowest = i;
            }
            self.ai.aggroTarget = Player.list[lowest];
        }
        self.path();
        self.ai.lastAttack++;
        if (self.ai.aggroTarget) {
            switch (self.ai.attackType) {
                case 'bird':
                    if (self.ai.lastAttack > seconds(1)) {
                        if (self.ai.attackStage == 5) {
                            new Projectile('ninjastar', self.x, self.y, self.map, self.ai.aggroTarget.x+Math.random()*10-20, self.ai.aggroTarget.y+Math.random()*10-20, self.id);
                            self.ai.attackStage = 0;
                            self.ai.lastAttack = 0;
                        }
                        if (self.ai.attackStage == 1) {
                            new Projectile('ninjastar', self.x, self.y, self.map, self.ai.aggroTarget.x+Math.random()*10-20, self.ai.aggroTarget.y+Math.random()*10-20, self.id);
                        }
                        self.ai.attackStage++;
                    }
                    break;
                case 'snowbird':
                    if (self.ai.lastAttack > seconds(1)) {
                        if (self.ai.attackStage == 5) {
                            new Projectile('snowball', self.x, self.y, self.map, self.ai.aggroTarget.x+Math.random()*10-20, self.ai.aggroTarget.y+Math.random()*10-20, self.id);
                            self.ai.attackStage = 0;
                            self.ai.lastAttack = 0;
                        }
                        if (self.ai.attackStage == 1) {
                            new Projectile('snowball', self.x, self.y, self.map, self.ai.aggroTarget.x+Math.random()*10-20, self.ai.aggroTarget.y+Math.random()*10-20, self.id);
                        }
                        self.ai.attackStage++;
                    }
                    break;
                case 'cherrybomb':
                    if (self.getDistance(self.ai.aggroTarget) < 64) {
                        self.ai.attackType = 'exploding';
                        self.moveSpeed = 0;
                        self.hp = 1000000000000000000;
                        self.alive = false;
                        self.animationStage = 0;
                        self.animationLength = 10;
                        self.onDeath = function() {};
                        for (var i in Monster.list) {
                            if (parseFloat(i) != self.id && self.getDistance(Monster.list[i]) < 128) Monster.list[i].hp = 0;
                        }
                        for (var i in Player.list) {
                            if (self.getDistance(Player.list[i]) < 128) Player.list[i].hp = 0;
                        }
                    }
                    break;
                case 'exploding':
                    if (self.animationStage >= 10) delete Monster.list[self.id];
                    break;
                case 'snowball':
                    if (self.ai.lastAttack >= seconds(3)) {
                        if (self.ai.attackStage == 20) {
                            self.ai.attackStage = 0;
                            self.ai.lastAttack = 0;
                        }
                        if (self.ai.attackStage == 1) {
                            self.animationLength = 7;
                            self.animationSpeed = 100;
                        }
                        var angle = 16*self.ai.attackStage;
                        new Projectile('snowball', self.x, self.y, self.map, self.x+Math.cos(angle*(Math.PI/180)), self.y+Math.sin(angle*(Math.PI/180)), self.id);
                        new Projectile('snowball', self.x, self.y, self.map, self.x+Math.cos((angle-90)*(Math.PI/180)), self.y+Math.sin((angle-90)*(Math.PI/180)), self.id);
                        new Projectile('snowball', self.x, self.y, self.map, self.x+Math.cos((angle-180)*(Math.PI/180)), self.y+Math.sin((angle-180)*(Math.PI/180)), self.id);
                        new Projectile('snowball', self.x, self.y, self.map, self.x+Math.cos((angle-270)*(Math.PI/180)), self.y+Math.sin((angle-270)*(Math.PI/180)), self.id);
                        self.ai.attackStage++;
                    }
                    if (self.animationStage == 7) {
                        self.animationLength = 0;
                        self.animationSpeed = 100;
                    }
                    break;
                default:
                    error('Invalid attack type: ' + self.attackType);
                    break;
            }
        }
    };
    self.path = function() {
        self.ai.lastPath++;
        if (self.ai.lastPath >= seconds(0.1)) {
            self.ai.lastPath = 0;
            if (self.ai.aggroTarget) {
                try {
                    if (self.getDistance(self.ai.aggroTarget) < self.ai.aggroRange*64) {
                        var offsetx = self.gridx-self.ai.aggroRange-1;
                        var offsety = self.gridy-self.ai.aggroRange-1;
                        var x1 = self.ai.aggroRange+1;
                        var y1 = self.ai.aggroRange+1;
                        var x2 = self.ai.aggroTarget.gridx-offsetx;
                        var y2 = self.ai.aggroTarget.gridy-offsety;
                        var size = self.ai.aggroRange*2+1;
                        self.ai.grid = new PF.Grid(size, size);
                        for (var y = 0; y < size; y++) {
                            for (var x = 0; x < size; x++) {
                                var checkx = x+offsetx;
                                var checky = y+offsety;
                                if (Collision.list[self.map][checky]) if (Collision.list[self.map][checky][checkx]) {
                                    self.ai.grid.setWalkableAt(x, y, false);
                                }
                            }
                        }
                        var path = self.ai.pathfinder.findPath(x1, y1, x2, y2, self.ai.grid);
                        self.ai.path = PF.Util.compressPath(path);
                        self.ai.path.shift();
                        for (var i in self.ai.path) {
                            self.ai.path[i][0] += offsetx;
                            self.ai.path[i][1] += offsety;
                        }
                    }
                } catch (err) {
                    error(err);
                }
            }
        }
    };
    self.collide = function() {
        for (var i = 0; i < self.moveSpeed; i++) {
            self.keys = {
                up: false,
                down: false,
                left: false,
                right: false
            };
            self.xspeed = 0;
            self.yspeed = 0;
            if (self.ai.path[0]) {
                if (self.ai.path[0][0]+0.5 < self.x/64) self.keys.left = true;
                if (self.ai.path[0][0]+0.5 > self.x/64) self.keys.right = true;
                if (self.ai.path[0][1]+0.5 < self.y/64) self.keys.up = true;
                if (self.ai.path[0][1]+0.5 > self.y/64) self.keys.down = true;
                if (self.gridx == self.ai.path[0][0] && self.gridy == self.ai.path[0][1]) {
                    self.ai.path.shift();
                }
            }
            if (self.keys.up) self.yspeed = -self.moveSpeed;
            if (self.keys.down) self.yspeed = self.moveSpeed;
            if (self.keys.left) self.xspeed = -self.moveSpeed;
            if (self.keys.right) self.xspeed = self.moveSpeed;
            var xdir = self.xspeed/self.moveSpeed;
            var ydir = self.yspeed/self.moveSpeed;
            self.lastx = self.x;
            self.lasty = self.y;
            self.x += xdir;
            self.y += ydir;
            self.gridx = Math.floor(self.x/64);
            self.gridy = Math.floor(self.y/64);
            self.checkCollision();
        }
        self.x = Math.round(self.x);
        self.y = Math.round(self.y);
        self.gridx = Math.floor(self.x/64);
        self.gridy = Math.floor(self.y/64);
    };
    self.getDistance = function(entity) {
        return Math.sqrt(Math.pow(self.x-entity.x, 2) + Math.pow(self.y-entity.y, 2))
    };
    self.onHit = function(entity, type) {
        switch (type) {
            case 'projectile':
                self.hp -= entity.damage;
                if (entity.parentID) {
                    if (entity.parentIsPlayer) {
                        self.aggroTarget = Player.list[entity.parentID];
                    } else {
                        self.aggroTarget = Monster.list[entity.parentID];
                    }
                }
                break;
            default:
                error('Invalid Entity type: ' + type);
                break;
        }
    }
    self.onDeath = function() {
        self.alive = false;
        delete Monster.list[self.id];
    };
    self.onRegionChange = function() {
        if (self.region.nomonster) {
            self.updateAggro = function() {};
        }
    };

    Monster.list[self.id] = self;
    return self;
};
Monster.update = function() {
    var pack = [];
    for (var i in Monster.list) {
        var localmonster = Monster.list[i];
        var canupdate = false;
        for (var i in Player.list) {
            if (Player.list[i].map = localmonster.map) canupdate = true;
        }
        if (canupdate) {
            localmonster.update();
            pack.push({
                id: localmonster.id,
                map: localmonster.map,
                x: localmonster.x,
                y: localmonster.y,
                type: localmonster.type,
                animationStage: localmonster.animationStage
            });
        }
    }
    return pack;
};
Monster.types = require('./monster.json');
Monster.list = [];

// projectiles
Projectile = function(type, x, y, map, mousex, mousey, parentID) {
    var self = new Entity();
    self.id = Math.random();
    self.type = type;
    self.x = x;
    self.y = y;
    self.map = map;
    var tempprojectile = Projectile.types[type];
    self.type = type;
    self.width = tempprojectile.width;
    self.height = tempprojectile.height;
    self.moveSpeed = tempprojectile.speed;
    self.damage = tempprojectile.damage;
    self.pattern = Projectile.patterns[tempprojectile.pattern];
    self.angle = Math.atan2(-(self.y-mousey), -(self.x-mousex));
    self.xspeed = Math.cos(self.angle)*self.moveSpeed;
    self.yspeed = Math.sin(self.angle)*self.moveSpeed;
    self.x += self.xspeed;
    self.y += self.yspeed;
    self.parentID = parentID;
    self.parentIsPlayer = true;
    if (Monster.list[self.parentID]) self.parentIsPlayer = false;
    self.traveltime = 0;

    self.update = function() {
        self.updatePos();
        if (self.parentIsPlayer) {
            for (var i in Monster.list) {
                if (self.collideWith(Monster.list[i])) {
                    Monster.list[i].onHit(self, 'projectile');
                    delete Projectile.list[self.id];
                    break;
                }
            }
        } else {
            for (var i in Player.list) {
                if (self.collideWith(Player.list[i])) {
                    Player.list[i].onHit(self, 'projectile');
                    delete Projectile.list[self.id];
                    break;
                }
            }
        }
        self.traveltime++;
        if (self.traveltime > 60000) {
            delete Projectile.list[self.id];
        }
    };
    self.updatePos = function() {
        self.collide();
        self.pattern(self);
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
    self.collideWith = function(entity) {
        var vertices = [
            {x: ((self.width/2)*Math.cos(self.angle))-((self.height/2)*Math.sin(self.angle))+self.x, y: ((self.width/2)*Math.sin(self.angle))+((self.height/2)*Math.cos(self.angle))+self.y},
            {x: ((self.width/2)*Math.cos(self.angle))-((-self.height/2)*Math.sin(self.angle))+self.x, y: ((self.width/2)*Math.sin(self.angle))+((-self.height/2)*Math.cos(self.angle))+self.y},
            {x: ((-self.width/2)*Math.cos(self.angle))-((-self.height/2)*Math.sin(self.angle))+self.x, y: ((-self.width/2)*Math.sin(self.angle))+((-self.height/2)*Math.cos(self.angle))+self.y},
            {x: ((-self.width/2)*Math.cos(self.angle))-((self.height/2)*Math.sin(self.angle))+self.x, y: ((-self.width/2)*Math.sin(self.angle))+((self.height/2)*Math.cos(self.angle))+self.y},
            {x: self.x, y: self.y}
        ];
        var vertices2 = [
            {x: entity.x+entity.width/2, y: entity.y+entity.height/2},
            {x: entity.x+entity.width/2, y: entity.y-entity.height/2},
            {x: entity.x-entity.width/2, y: entity.y-entity.height/2},
            {x: entity.x-entity.width/2, y: entity.y+entity.height/2}
        ];
        function getSlope(pt1, pt2) {
            return (pt2.y - pt1.y) / (pt2.x - pt1.x);
        };

        for (var i = 0; i < 4; i++) {
            if (vertices2[i].y-vertices[0].y < (getSlope(vertices[0],vertices[1])*(vertices2[i].x-vertices[0].x))) {
                if (vertices2[i].y-vertices[1].y > (getSlope(vertices[1],vertices[2])*(vertices2[i].x-vertices[1].x))) {
                    if (vertices2[i].y-vertices[2].y > (getSlope(vertices[2],vertices[3])*(vertices2[i].x-vertices[2].x))) {
                        if (vertices2[i].y-vertices[3].y < (getSlope(vertices[3],vertices[0])*(vertices2[i].x-vertices[3].x))) {
                            return true;
                        }
                    }
                }
            }
            if (vertices[i].x > vertices2[2].x && vertices[i].x < vertices2[0].x && vertices[i].y > vertices2[2].y && vertices[i].y < vertices2[0].y) {
                return true;
            }
        }
        if (vertices[4].x > vertices2[2].x && vertices[4].x < vertices2[0].x && vertices[4].y > vertices2[2].y && vertices[4].y < vertices2[0].y) {
            return true;
        }

        return false;
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
            angle: localprojectile.angle,
            type: localprojectile.type
        });
    }
    return pack;
};
Projectile.types = require('./projectile.json');
Projectile.patterns = {
    none: function(self) {},
    spin: function(self) {
        self.angle += 25*(Math.PI/180);
    },
    homing: function(self) {
        self.angle = Math.atan2(-(self.y-target.y), -(self.x-target.x));
        self.xspeed = Math.cos(self.angle)*self.moveSpeed;
        self.yspeed = Math.sin(self.angle)*self.moveSpeed;
    },
    homing2: function(self) {
        var angle = Math.atan2(-(self.y-target.y), -(self.x-target.x));
        self.angle += Math.max(-0.1, Math.min(angle, 0.1));
        self.xspeed = Math.cos(self.angle)*self.moveSpeed;
        self.yspeed = Math.sin(self.angle)*self.moveSpeed;
    }
};
Projectile.list = [];

// particle storage
Particle = function(map, x, y, type, value) {
    var self = {
        map: map,
        x: x,
        y: y,
        type: type
    };
    if (value) self.value = value;

    Particle.list.push(self);
    return self;
};
Particle.update = function() {
    var particles = Particle.list;
    for (var i in Particle.list) {
        delete Particle.list[i];
    }
    return particles;
};
Particle.list = [];

function seconds(s) {
    return s*1000/(1000/20);
};