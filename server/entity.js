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
                        process.exit(69);
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
        if (entity.map == self.map && bound1left < bound2right && bound1right > bound2left && bound1top < bound2bottom && bound1bottom > bound2top) {
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
    self.width = 32;
    self.height = 32;
    self.keys = {
        up: false,
        down: false,
        left: false,
        right: false
    };
    self.animationStage = 0;
    self.animationLength = 0;
    self.lastFrameUpdate = 0;
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
    self.alive = true;

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
    };
    self.updateAnimation = function() {
        self.lastFrameUpdate++;
        if (self.lastFrameUpdate > 100/(1000/20)) {
            self.animationStage++;
            if (self.animationStage > self.animationLength) self.animationStage = 0;
        }
    };
    self.onDeath = function() {
        self.alive = false;
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
            animationStage: localnpc.animationStage
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
            new Projectile('arrow', self.x, self.y, self.map, data.x, data.y);
        }
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
            y: localplayer.y,
            animationStage: localplayer.animationStage
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
        currentNode: 0,
        pathfinder: new PF.AStarFinder({
            allowDiagonal: true,
            dontCrossCorners: true
        }),
        grid: new PF.Grid(Object.create(Collision.list[self.map])),
        lastPath: 0,
        lastAttack: 0
    };
    for (var i in Collision.list[self.map]) {
        for (var j in Collision.list[self.map][i]) {
            if (Collision.list[self.map][i][j] != 0) {
                self.ai.grid.setWalkableAt(j, i, false);
            }
        }
    }
    self.targetMonsters = false;
    var tempmonster = Monster.types[type];
    self.type = type;
    self.stats = tempmonster.stats;
    self.moveSpeed = tempmonster.moveSpeed;
    self.width = tempmonster.width;
    self.height = tempmonster.height;
    self.hp = tempmonster.hp;
    self.ai.attackType = tempmonster.attackType;
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
        if (self.ai.path[self.ai.currentNode]) {
            self.keys = {
                up: false,
                down: false,
                left: false,
                right: false
            };
            if (self.ai.path[self.ai.currentNode][0] < self.gridx) self.keys.left = true;
            if (self.ai.path[self.ai.currentNode][0] > self.gridx) self.keys.right = true;
            if (self.ai.path[self.ai.currentNode][1] < self.gridy) self.keys.up = true;
            if (self.ai.path[self.ai.currentNode][1] > self.gridy) self.keys.down = true;
            if (self.ai.path[self.ai.currentNode+1]) {
                if (self.gridx == self.ai.path[self.ai.currentNode+1][0] && self.gridx == self.ai.path[self.ai.currentNode+1][0]) {
                    self.ai.currentNode++;
                }
            }
            for (var i in self.ai.path) {
                if (i >= self.ai.currentNode && self.gridx == self.ai.path[i][0] && self.gridy == self.ai.path[i][1]) {
                    self.ai.currentNode = parseInt(i) + 1;
                    if (self.ai.currentNode > self.ai.path.length) self.ai.currentNode = self.ai.path.length;
                }
            }
        }
        self.xspeed = 0;
        self.yspeed = 0;
        if (self.keys.up) self.yspeed = -self.moveSpeed;
        if (self.keys.down) self.yspeed = self.moveSpeed;
        if (self.keys.left) self.xspeed = -self.moveSpeed;
        if (self.keys.right) self.xspeed = self.moveSpeed;
        self.collide();
    };
    self.updateAggro = function() {
        self.path();
        if (self.ai.aggroTarget) {
            switch (self.ai.attackType) {
                case 'bird':
                    // ninja stars (ninja birds lol)
                    break;
                case 'snowbird':
                    // snowballs
                    break;
                case 'cherrybomb':
                    if (self.getDistance(self.ai.aggroTarget) < 64) {
                        self.ai.attackType = 'exploding';
                        self.moveSpeed = 0;
                        self.hp = 1000000000000;
                        self.animationStage = 0;
                        self.animationLength = 10;
                        for (var i in Monster.list) {
                            Monster.list[i].hp -= 1*self.stats.attack;
                        }
                        for (var i in Player.list) {
                            Player.list[i].hp -= 1*self.stats.attack;
                        }
                    }
                    break;
                case 'exploding':
                    if (self.animationStage >= 10) delete Monster.list[self.id];
                    break;
                case 'snowball':
                    // snow things
                    break;
                default:
                    error('Invalid attack type: ' + self.attackType);
                    break;
            }
        }
    };
    self.path = function() {
        self.ai.lastPath++;
        if (self.ai.lastPath > 100/(1000/20)) {
            self.ai.lastPath = 0;
            if (self.targetMonsters) {
                var lowest = null;
                for (var i in Monster.list) {
                    if (lowest == null) lowest = i;
                    if (self.getDistance(Monster.list[i]) < self.getDistance(Monster.list[lowest]) && i != self.id) lowest = i;
                }
                self.ai.aggroTarget = Monster.list[lowest];
            } else {
                var lowest = null;
                for (var i in Player.list) {
                    if (lowest == null) lowest = i;
                    if (self.getDistance(Player.list[i]) < self.getDistance(Player.list[lowest]) && i != self.id) lowest = i;
                }
                self.ai.aggroTarget = Player.list[lowest];
            }
            if (self.ai.aggroTarget) {
                var gridbackup = self.ai.grid.clone();
                self.ai.path = self.ai.pathfinder.findPath(self.gridx, self.gridy, self.ai.aggroTarget.gridx, self.ai.aggroTarget.gridy, self.ai.grid);
                self.ai.grid = gridbackup;
                self.ai.currentNode = 1;
            }
        }
    };
    self.getDistance = function(entity) {
        return Math.sqrt((Math.pow(Math.abs(self.x-entity.x), 2)) + (Math.pow(Math.abs(self.y-entity.y), 2)));
    };
    self.onDeath = function() {
        self.alive = false;
        delete Monster.list[self.id];
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
Projectile = function(type, x, y, map, mousex, mousey) {
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
    self.angle = Math.atan2(-(self.y-mousey), -(self.x-mousex));
    self.xspeed = Math.cos(self.angle)*self.moveSpeed;
    self.yspeed = Math.sin(self.angle)*self.moveSpeed;
    self.x += self.xspeed;
    self.y += self.yspeed;

    self.update = function() {
        self.updatePos();
        for (var i in Monster.list) {
            if (self.collideWith(Monster.list[i])) {
                Monster.list[i].hp -= 10;
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
            angle: localprojectile.angle,
            type: localprojectile.type
        });
    }
    return pack;
};
Projectile.types = require('./projectile.json');
Projectile.patterns = {
    none: function() {},
    homing: function(target) {
        self.angle = Math.atan2(-(self.y-target.y), -(self.x-target.x));
        self.xspeed = Math.cos(self.angle)*self.moveSpeed;
        self.yspeed = Math.sin(self.angle)*self.moveSpeed;
    },
    homing2: function(target) {
        var angle = Math.atan2(-(self.y-target.y), -(self.x-target.x));
        self.angle += Math.max(-0.1, Math.min(angle, 0.1));
        self.xspeed = Math.cos(self.angle)*self.moveSpeed;
        self.yspeed = Math.sin(self.angle)*self.moveSpeed;
    }
};
Projectile.list = [];