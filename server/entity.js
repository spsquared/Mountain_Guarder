// Copyright (C) 2021 Radioactive64

const PF = require('pathfinding');
const filter = require('leo-profanity');
filter.loadDictionary();

// entities
Entity = function() {
    var self = {
        id: null,
        x: 0,
        y: 0,
        map: 'World',
        xspeed: 0,
        yspeed: 0,
        lastx: 0,
        lasty: 0,
        gridx: 0,
        gridy: 0,
        moveSpeed: 0,
        width: 0,
        height: 0,
        noCollision: false,
        collisionBoxSize: 1
    };
    self.collisionBoxSize = Math.max(self.width, self.height);

    self.update = function() {
        self.updatePos();
    };
    self.updatePos = function() {
        self.collide();
    };
    self.collide = function() {
        try {
            var xdir = self.xspeed/self.moveSpeed;
            var ydir = self.yspeed/self.moveSpeed;
            if (xdir != 0 || ydir != 0) {
                for (var i = 0; i < self.moveSpeed; i++) {
                    self.lastx = self.x;
                    self.lasty = self.y;
                    self.x += xdir;
                    self.y += ydir;
                    self.gridx = Math.floor(self.x/64);
                    self.gridy = Math.floor(self.y/64);
                    if (!self.noCollision) self.checkCollision();
                }
            }
            self.x = Math.round(self.x);
            self.y = Math.round(self.y);
            self.gridx = Math.floor(self.x/64);
            self.gridy = Math.floor(self.y/64);
        } catch (err) {
            error(err);
        }
    };
    self.checkCollision = function() {
        var collisions = [];
        if (Collision.grid[self.map]) {
            if (self.xspeed > 0) {
                for (var x = self.gridx+1; x >= self.gridx-1; x--) {
                    if (self.yspeed > 0) {
                        for (var y = self.gridy+1; y >= self.gridy-1; y--) {
                            if (Collision.grid[self.map][y]) if (Collision.grid[self.map][y][x])
                            collisions.push(Collision.getColEntity(self.map, x, y));
                        }
                    } else {
                        for (var y = self.gridy-1; y <= self.gridy+1; y++) {
                            if (Collision.grid[self.map][y]) if (Collision.grid[self.map][y][x])
                            collisions.push(Collision.getColEntity(self.map, x, y));
                        }
                    }
                }
            } else {
                for (var x = self.gridx-1; x <= self.gridx+1; x++) {
                    if (self.yspeed > 0) {
                        for (var y = self.gridy+1; y >= self.gridy-1; y--) {
                            if (Collision.grid[self.map][y]) if (Collision.grid[self.map][y][x])
                            collisions.push(Collision.getColEntity(self.map, x, y));
                        }
                    } else {
                        for (var y = self.gridy-1; y <= self.gridy+1; y++) {
                            if (Collision.grid[self.map][y]) if (Collision.grid[self.map][y][x])
                            collisions.push(Collision.getColEntity(self.map, x, y));
                        }
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
        if (self.getSquareDistance(entity) <= self.collisionBoxSize/2 + entity.collisionBoxSize/2) {
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
        }
        return false;
    };
    self.getDistance = function(entity) {
        return Math.sqrt(Math.pow(self.x-entity.x, 2) + Math.pow(self.y-entity.y, 2));
    };
    self.getSquareDistance = function(entity) {
        return Math.max(Math.abs(self.x-entity.x), Math.abs(self.y-entity.y));
    };
    self.getGridDistance = function(entity) {
        if (entity.gridx) {
            return Math.sqrt(Math.pow(self.gridx-entity.gridx, 2) + Math.pow(self.gridy-entity.gridy, 2));
        } else {
            return Math.sqrt(Math.pow(self.gridx-entity.x, 2) + Math.pow(self.gridy-entity.y, 2));
        }
    };
    self.getSquareGridDistance = function(entity) {
        if (entity.gridx) {
            return Math.max(Math.abs(self.gridx-entity.gridx), Math.abs(self.gridy-entity.gridy));
        } else {
            return Math.max(Math.abs(self.gridx-entity.x), Math.abs(self.gridy-entity.y));
        }
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
        pack.players.push(pack1[i]);
    }
    pack.monsters = pack2;
    pack.projectiles = pack3;
    for (var i in pack4) {
        pack.players.push(pack4[i]);
    }
    pack.particles = pack5;

    return pack;
};
Entity.getDebugData = function() {
    var pack1 = Player.getDebugData();
    var pack2 = Monster.getDebugData();
    var pack3 = Projectile.getDebugData();
    var pack4 = Npc.getDebugData();
    var pack = {
        players: [],
        monsters: [],
        projectiles: []
    };
    for (var i in pack1) {
        pack.players.push(pack1[i]);
    }
    pack.monsters = pack2;
    pack.projectiles = pack3;
    for (var i in pack4) {
        pack.players.push(pack4[i]);
    }

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
        right: false,
        heal: false
    };
    self.animationStage = 0;
    self.animationLength = 0;
    self.lastFrameUpdate = 0;
    self.animationSpeed = 100;
    self.animationDirection = 'facing';
    self.facingDirection = 'down';
    self.moveSpeed = 15;
    self.stats = {
        damageType: null,
        projectileSpeed: 1,
        attack: 1,
        defense: 0,
        damageReduction: 0,
        heal: 1,
        speed: 1,
        range: 1,
        critChance: 0,
        knockback: 0
    };
    self.hp = 100;
    self.maxHP = 100;
    self.lastHeal = 0;
    self.lastAutoHeal = 0;
    self.xp = 0;
    self.maxXP = 0;
    self.mana = 200;
    self.maxMana = 200;
    self.lastManaUse = 0;
    self.lastManaRegen = 0;
    self.lastAutoManaRegen = 0;
    self.alive = true;
    self.invincible = false;
    self.name = 'empty Rig';
    self.lastAttack = 0;
    self.ai = {
        entityTarget: null,
        posTarget: {
            x: null,
            y: null
        },
        idleMove: 'none',
        idleRandom: {
            walking: false,
            waitTime: 10,
            lastPathEnd: 0
        },
        idleWaypoints: {
            walking: false,
            waypoints: [],
            xdir: 0,
            ydir: 0,
            waitTime: 5,
            lastPathEnd: 0
        },
        path: [],
        pathfinder: new PF.BiAStarFinder({
            allowDiagonal: true,
            dontCrossCorners: true
        }),
        grid: new PF.Grid(),
        lastPath: 0,
        maxRange: 100
    };
    self.aiControlled = true;
    self.characterStyle = {
        hair: 1,
        hairColor: '#000000',
        bodyColor: '#FFF0B4',
        shirtColor: '#FF3232',
        pantsColor: '#6464FF'
    };
    self.collisionBoxSize = Math.max(self.width, self.height);

    self.update = function() {
        self.updatePos();
        self.lastAutoHeal++;
        self.lastHeal++;
        if (self.lastAutoHeal >= seconds(0.2) && self.hp < self.maxHP) {
            self.hp = Math.min(self.hp+self.stats.heal, self.maxHP);
            self.lastAutoHeal = 0;
        }
        if (self.keys.heal && self.hp < self.maxHP && self.lastHeal >= seconds(0.5) && self.mana >= 10) {
            var oldhp = self.hp;
            self.lastHeal = 0;
            self.hp = Math.min(self.hp+20, self.maxHP);
            self.mana -= 10;
            self.lastManaUse = 0;
            new Particle(self.map, self.x, self.y, 'heal', '+' + self.hp-oldhp);
        }
        self.lastAutoManaRegen++;
        self.lastManaRegen++;
        self.lastManaUse++;
        if (self.lastAutoManaRegen >= seconds(0.5) && self.lastManaUse < seconds(2) && self.alive) {
            self.mana = Math.min(self.mana+1, self.maxMana);
            self.lastAutoManaRegen = 0;
        }
        if (self.lastManaUse >= seconds(2) && self.alive) {
            if (self.lastManaRegen >= seconds(0.1)) {
                self.mana = Math.min(self.mana+1, self.maxMana);
                self.lastManaRegen = 0;
            }
        }
        self.updateAnimation();
    };
    self.updatePos = function() {
        self.animationDirection = 'facing';
        if (self.keys.up) {
            self.animationDirection = 'up';
            self.facingDirection = 'up';
        }
        if (self.keys.down) {
            self.animationDirection = 'down';
            self.facingDirection = 'down';
        }
        if (self.keys.left) {
            if (self.keys.down) {
                self.animationDirection = 'downleft';
                self.facingDirection = 'downleft';
            } else if (self.keys.up) {
                self.animationDirection = 'upleft';
                self.facingDirection = 'upleft';
            } else {
                self.animationDirection = 'left';
                self.facingDirection = 'left';
            }
        }
        if (self.keys.right) {
            if (self.keys.down) {
                self.animationDirection = 'downright';
                self.facingDirection = 'downright';
            } else if (self.keys.up) {
                self.animationDirection = 'upright';
                self.facingDirection = 'upright';
            } else {
                self.animationDirection = 'right';
                self.facingDirection = 'right';
            }
        }
        if (self.aiControlled) {
            self.ai.lastPath++;
            if (self.ai.lastPath >= seconds(0.1)) {
                self.ai.lastPath = 0;
                if (self.ai.entityTarget) self.ai.pathtoEntity();
                else if (self.ai.posTarget.x) self.ai.pathtoPos();
                else if (self.ai.idleMove != 'none') self.ai.pathIdle();
                else self.ai.path = [];
            }
            self.keys = {
                up: false,
                down: false,
                left: false,
                right: false,
                heal: false
            };
        } else {
            self.xspeed = 0;
            self.yspeed = 0;
            if (self.keys.up) {
                self.yspeed = -self.moveSpeed;
            }
            if (self.keys.down) {
                self.yspeed = self.moveSpeed;
            }
            if (self.keys.left) {
                self.xspeed = -self.moveSpeed;
            }
            if (self.keys.right) {
                self.xspeed = self.moveSpeed;
            }
        }
        self.collide();
        self.animationDirection = 'facing';
        if (self.keys.up) {
            self.animationDirection = 'up';
            self.facingDirection = 'up';
        }
        if (self.keys.down) {
            self.animationDirection = 'down';
            self.facingDirection = 'down';
        }
        if (self.keys.left) {
            if (self.keys.down) {
                self.animationDirection = 'downleft';
                self.facingDirection = 'downleft';
            } else if (self.keys.up) {
                self.animationDirection = 'upleft';
                self.facingDirection = 'upleft';
            } else {
                self.animationDirection = 'left';
                self.facingDirection = 'left';
            }
        }
        if (self.keys.right) {
            if (self.keys.down) {
                self.animationDirection = 'downright';
                self.facingDirection = 'downright';
            } else if (self.keys.up) {
                self.animationDirection = 'upright';
                self.facingDirection = 'upright';
            } else {
                self.animationDirection = 'right';
                self.facingDirection = 'right';
            }
        }
        var foundregion = false;
        if (Region.grid[self.map][self.gridy]) if (Region.grid[self.map][self.gridy][self.gridx]) if (Region.grid[self.map][self.gridy][self.gridx].name != self.region.name) {
            self.region = Region.grid[self.map][self.gridy][self.gridx];
            self.onRegionChange();
        }
        if (Region.grid[self.map][self.gridy]) if (Region.grid[self.map][self.gridy][self.gridx]) foundregion = true;
        if (!foundregion && self.region.name != 'The Wilderness') {
            self.region = {
                name: 'The Wilderness',
                noattack: false,
                nomonster: false
            };
            self.onRegionChange();
        }
    };
    self.collide = function() {
        try {
            var xdir = self.xspeed/self.moveSpeed;
            var ydir = self.yspeed/self.moveSpeed;
            if (xdir != 0 || ydir != 0 || self.aiControlled) {
                for (var i = 0; i < self.moveSpeed; i++) {
                    if (self.aiControlled) {
                        self.keys = {
                            up: false,
                            down: false,
                            left: false,
                            right: false,
                            heal: false
                        };
                        self.xspeed = 0;
                        self.yspeed = 0;
                        if (self.ai.path[0]) {
                            if (self.ai.path[0][0]*64+32 < self.x) self.keys.left = true;
                            if (self.ai.path[0][0]*64+32 > self.x) self.keys.right = true;
                            if (self.ai.path[0][1]*64+32 < self.y) self.keys.up = true;
                            if (self.ai.path[0][1]*64+32 > self.y) self.keys.down = true;
                            if (self.gridx == self.ai.path[0][0] && self.gridy == self.ai.path[0][1]) {
                                self.ai.path.shift();
                            }
                            if (self.keys.up) self.yspeed = -self.moveSpeed;
                            if (self.keys.down) self.yspeed = self.moveSpeed;
                            if (self.keys.left) self.xspeed = -self.moveSpeed;
                            if (self.keys.right) self.xspeed = self.moveSpeed;
                        }
                        xdir = self.xspeed/self.moveSpeed;
                        ydir = self.yspeed/self.moveSpeed;
                        if (ydir == 0 && xdir == 0) break;
                    }
                    self.lastx = self.x;
                    self.lasty = self.y;
                    self.x += xdir;
                    self.y += ydir;
                    self.gridx = Math.floor(self.x/64);
                    self.gridy = Math.floor(self.y/64);
                    if (!self.noCollision) self.checkCollision();
                }
            }
            self.x = Math.round(self.x);
            self.y = Math.round(self.y);
            self.gridx = Math.floor(self.x/64);
            self.gridy = Math.floor(self.y/64);
            for (var i in self.keys) {
                if (Teleporter.grid[self.map][self.gridy]) if (Teleporter.grid[self.map][self.gridy][self.gridx]) if (Teleporter.grid[self.map][self.gridy][self.gridx].direction == i && self.keys[i]) {
                    self.teleport(Teleporter.grid[self.map][self.gridy][self.gridx].map, Teleporter.grid[self.map][self.gridy][self.gridx].x, Teleporter.grid[self.map][self.gridy][self.gridx].y);
                    break;
                }
            }
        } catch (err) {
            error(err);
        }
    };
    self.updateAnimation = function() {
        self.lastFrameUpdate++;
        if (self.lastFrameUpdate >= seconds(self.animationSpeed/1000)) {
            self.lastFrameUpdate = 0;
            switch (self.animationDirection) {
                case 'none':
                    self.animationStage = 0;
                    break;
                case 'loop':
                    self.animationStage++;
                    if (self.animationStage > self.animationLength) self.animationStage = 0;
                    break;
                case 'facing':
                    switch (self.facingDirection) {
                        case 'up':
                            self.animationStage = 24;
                            break;
                        case 'down':
                            self.animationStage = 0;
                            break;
                        case 'left':
                            self.animationStage = 36;
                            break;
                        case 'right':
                            self.animationStage = 12;
                            break;
                        case 'upleft':
                            self.animationStage = 30;
                            break;
                        case 'downleft':
                            self.animationStage = 42;
                            break;
                        case 'upright':
                            self.animationStage = 18;
                            break;
                        case 'downright':
                            self.animationStage = 6;
                            break;
                        default:
                            error('Invalid facingDirection ' + self.facingDirection);
                            break;
                    }
                    break;
                case 'up':
                    self.animationStage++;
                    if (self.animationStage < 25) self.animationStage = 25;
                    if (self.animationStage > 29) self.animationStage = 25;
                    break;
                case 'down':
                    self.animationStage++;
                    if (self.animationStage < 1) self.animationStage = 1;
                    if (self.animationStage > 5) self.animationStage = 1;
                    break;
                case 'left':;
                    self.animationStage++;
                    if (self.animationStage < 37) self.animationStage = 37;
                    if (self.animationStage > 41) self.animationStage = 37;
                    break;
                case 'right':
                    self.animationStage++;
                    if (self.animationStage < 13) self.animationStage = 13;
                    if (self.animationStage > 17) self.animationStage = 13;
                    break;
                case 'upleft':
                    self.animationStage++;
                    if (self.animationStage < 31) self.animationStage = 31;
                    if (self.animationStage > 35) self.animationStage = 31;
                    break;
                case 'downleft':
                    self.animationStage++;
                    if (self.animationStage < 43) self.animationStage = 43;
                    if (self.animationStage > 47) self.animationStage = 43;
                    break;
                case 'upright':
                    self.animationStage++;
                    if (self.animationStage < 19) self.animationStage = 19;
                    if (self.animationStage > 23) self.animationStage = 19;
                    break;
                case 'downright':
                    self.animationStage++;
                    if (self.animationStage < 7) self.animationStage = 7;
                    if (self.animationStage > 11) self.animationStage = 7;
                    break;
                default:
                    error('Invalid animationDirection ' + self.animationDirection);
                    break;
            }
        }
    };
    self.ai.pathtoEntity = function() {
        if (self.ai.entityTarget) {
            self.ai.path = [];
            try {
                if (self.getSquareGridDistance(self.ai.entityTarget) < self.ai.maxRange) {
                    var offsetx = self.gridx-self.ai.maxRange-1;
                    var offsety = self.gridy-self.ai.maxRange-1;
                    var x1 = self.ai.maxRange+1;
                    var y1 = self.ai.maxRange+1;
                    var x2 = self.ai.entityTarget.gridx-offsetx;
                    var y2 = self.ai.entityTarget.gridy-offsety;
                    var size = self.ai.maxRange*2+1;
                    self.ai.grid = new PF.Grid(size, size);
                    for (var y = 0; y < size; y++) {
                        for (var x = 0; x < size; x++) {
                            var checkx = x+offsetx;
                            var checky = y+offsety;
                            if (Collision.grid[self.map][checky]) if (Collision.grid[self.map][checky][checkx]) {
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
    };
    self.ai.pathtoPos = function() {
        if (self.ai.posTarget) {
            self.ai.path = [];
            try {
                if (self.getSquareGridDistance(self.ai.posTarget) < self.ai.maxRange) {
                    var offsetx = self.gridx-self.ai.maxRange-1;
                    var offsety = self.gridy-self.ai.maxRange-1;
                    var x1 = self.ai.maxRange+1;
                    var y1 = self.ai.maxRange+1;
                    var x2 = self.ai.posTarget.x-offsetx;
                    var y2 = self.ai.posTarget.y-offsety;
                    var size = self.ai.maxRange*2+1;
                    self.ai.grid = new PF.Grid(size, size);
                    for (var y = 0; y < size; y++) {
                        for (var x = 0; x < size; x++) {
                            var checkx = x+offsetx;
                            var checky = y+offsety;
                            if (Collision.grid[self.map][checky]) if (Collision.grid[self.map][checky][checkx]) {
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
    };
    self.ai.pathIdle = function() {
        if (self.ai.idleMove == 'waypoints') {
            if (self.ai.idleWaypoints.lastPathEnd >= seconds(self.ai.idleWaypoints.waitTime*Math.random())) {
                self.ai.idleWaypoints.lastPathEnd = 0;
                var waypoints = self.ai.idleWaypoints.waypoints;
                if (waypoints) {
                    for (var i in waypoints) {
                        var waypoint = waypoints[i];
                        waypoint.h = self.getGridDistance(waypoint);
                        waypoint.g = 1;
                        if (self.ai.idleWaypoints.xdir == -1) {
                            if (waypoint.x < self.gridx) waypoint.g++;
                            else waypoint.g--;
                        } else if (self.ai.idleWaypoints.xdir == 1) {
                            if (waypoint.x > self.gridx) waypoint.g++;
                            else waypoint.g--;
                        }
                        if (self.ai.idleWaypoints.ydir == -1) {
                            if (waypoint.y < self.gridy) waypoint.g++;
                            else waypoint.g--;
                        } else if (self.ai.idleWaypoints.ydir == 1) {
                            if (waypoint.y > self.gridy) waypoint.g++;
                            else waypoint.g--;
                        }
                        waypoint.f = waypoint.h*0.1 + waypoint.g*5;
                        if (waypoint.x == self.gridx && waypoint.y == self.gridy) waypoint.f = 1000000000;
                    }
                    waypoints = waypoints.sort(function(a, b) {b.f-a.f});
                    if (waypoints[0]) {
                        if (waypoints[0].x < self.gridx) self.ai.idleWaypoints.xdir = -1;
                        if (waypoints[0].x > self.gridx) self.ai.idleWaypoints.xdir = 1;
                        if (waypoints[0].y < self.gridx) self.ai.idleWaypoints.ydir = -1;
                        if (waypoints[0].y > self.gridx) self.ai.idleWaypoints.ydir = 1;
                        self.ai.posTarget = waypoints[0];
                        self.ai.pathtoPos();
                        self.ai.idleWaypoints.walking = true;
                    }
                }
            }
            if (self.gridx == self.ai.posTarget.x && self.gridy == self.ai.posTarget.y) self.ai.idleWaypoints.walking = false;
            if (!self.ai.idleWaypoints.walking) {
                self.ai.idleWaypoints.lastPathEnd += seconds(0.1);
                self.ai.path = [];
            }
        } else if (self.ai.idleMove == 'random') {
            if (self.ai.idleRandom.lastPathEnd >= seconds(self.ai.idleRandom.waitTime)*Math.random()) {
                self.ai.idleRandom.lastPathEnd = 0;
                var pathAttempts = 0;
                while (true) {
                    pathAttempts++;
                    var attempts = 0;
                    var pos = {
                        x: 0,
                        y: 0
                    };
                    while (true) {
                        attempts++;
                        pos.x = Math.round(self.gridx+Math.random()*2-1);
                        pos.y = Math.round(self.gridy+Math.random()*2-1);
                        if (Collision.grid[self.map][pos.y]) if (Collision.grid[self.map][pos.y][pos.x]) {}
                        else break;
                        if (attempts >= 10) break;
                    }
                    self.ai.posTarget = pos;
                    self.ai.pathtoPos();
                    if (self.ai.path != []) break;
                    if (pathAttempts >= 10) break;
                }
                if (self.ai.path[0]) {
                    self.ai.idleRandom.walking = true;
                }
            }
            if (self.gridx == self.ai.posTarget.x && self.gridy == self.ai.posTarget.y) self.ai.idleRandom.walking = false;
            if (!self.ai.idleRandom.walking) {
                self.ai.idleRandom.lastPathEnd += seconds(0.1);
                self.ai.path = [];
            }
        }
    };
    self.onHit = function(entity, type) {
        var oldhp = self.hp;
        if (self.invincible == false) {
            switch (type) {
                case 'projectile':
                    self.hp -= Math.max(Math.round((entity.damage*(1-self.stats.defense))-self.stats.damageReduction), 0);
                    if (self.hp < 0) {
                        if (entity.parentIsPlayer) self.onDeath(Player.list[entity.parentID], 'killed');
                        else self.onDeath(Monster.list[entity.parentID], 'killed');
                    }
                    break;
                case 'cherrybomb':
                    self.hp -= Math.max(Math.round((500*(1-self.stats.defense))-self.stats.damageReduction), 0);
                    if (self.hp < 0) self.onDeath(entity, 'explosion');
                    break;
                default:
                    error('Invalid Entity type: ' + type);
                    break;
            }
        }
        new Particle(self.map, self.x, self.y, 'damage', self.hp-oldhp);
    };
    self.onDeath = function(entity, type) {
        var oldhp = self.hp;
        self.hp = 0;
        self.alive = false;
        if (self.hp != oldhp) {
            new Particle(self.map, self.x, self.y, 'damage', self.hp-oldhp);
        }
        for (var i = 0; i < 20; i++) {
            new Particle(self.map, self.x, self.y, 'death');
        }
        switch (type) {
            case 'killed':
                insertChat(self.name + ' was killed by ' + entity.name + '.', 'death');
                break;
            case 'explosion':
                insertChat(self.name + ' blew up.', 'death');
                break;
            case 'debug':
                insertChat(self.name + ' was debugged.', 'death');
                break;
            default:
                insertChat(self.name + ' died.', 'death');
                break;
        }
    };
    self.onRegionChange = function() {};
    self.teleport = function(map, x, y) {
        for (var i = 0; i < 20; i++) {
            new Particle(self.map, self.x, self.y, 'teleport');
        }
        self.map = map;
        self.x = x*64+32;
        self.y = y*64+32;
        for (var i = 0; i < 20; i++) {
            new Particle(self.map, self.x, self.y, 'teleport');
        }
    };

    return self;
};

// npcs
Npc = function(id, x, y, map) {
    var self = new Rig();
    self.id = Math.random();
    self.animationSpeed = 100;
    self.animationDirection = 'facing';
    self.facingDirection = 'down';
    self.npcId = id;
    self.invincible = true;
    self.name = 'Npc';
    self.stats = {
        damageType: null,
        projectileSpeed: 0,
        attack: 0,
        defense: 1,
        damageReduction: 0,
        heal: 1,
        speed: 1,
        range: 0,
        critChance: 0,
        knockback: 0
    };
    self.moveSpeed = 5;
    var tempnpc = Npc.rawJson[id];
    self.x = x*64+32;
    self.y = y*64+32;
    self.map = map;
    switch (tempnpc.type) {
        case 'static':
            self.moveSpeed = 0;
            break;
        case 'waypoint':
            self.ai.idleMove = 'waypoints';
            break;
        case 'random':
            self.ai.idleMove = 'random';
            break;
        default:
            error('Invalid npc type ' + tempnpc.type);
            break;
    }
    for (var i in tempnpc.data) {
        self[i] = tempnpc.data[i];
    }
    self.collisionBoxSize = Math.max(self.width, self.height);

    self.update = function() {
        self.updatePos();
        self.updateAnimation();
    };
    self.onDeath = function() {};

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
            name: localnpc.name,
            animationStage: localnpc.animationStage,
            characterStyle: localnpc.characterStyle,
            isNPC: true
        });
    }
    
    return pack;
};
Npc.getDebugData = function() {
    var pack = [];
    for (var i in Npc.list) {
        var localnpc = Npc.list[i];
        pack.push({
            map: localnpc.map,
            x: localnpc.x,
            y: localnpc.y,
            width: localnpc.width,
            height: localnpc.height,
            collisionBoxSize: localnpc.collisionBoxSize,
            animationStage: localnpc.animationStage,
            path: localnpc.ai.path,
            keys: localnpc.keys,
            isNPC: true
        });
    }

    return pack;
};
Npc.rawJson = require('./npc.json');
Npc.list = [];

// players
Player = function(socket) {
    var self = new Rig();
    self.id = Math.random();
    self.socket = socket;
    self.map = ENV.spawnpoint.map;
    self.x = ENV.spawnpoint.x;
    self.y = ENV.spawnpoint.y;
    self.animationSpeed = 100;
    self.animationDirection = 'facing';
    self.facingDirection = 'down';
    self.attacking = false;
    self.lastHeal = 0;
    self.stats.heal = 1;
    self.mouseX = 0;
    self.mouseY = 0;
    self.name = null;
    self.aiControlled = false;
    self.inventory = new Inventory(socket, self.id);
    self.attack = {
        projectile: null,
        projectilePattern: 'single',
        useTime: 0,
        manaCost: 0,
    };
    self.heldItem = {
        id: null,
        angle: 0
    };
    self.teleportLocation = {
        map: 'World',
        x: 0,
        y: 0
    };
    self.canMove = false;
    self.alive = false;
    self.debugEnabled = false;
    self.creds = {
        username: null,
        password: null
    };
    self.signedIn = false;
    self.collisionBoxSize = Math.max(self.width, self.height);

    var maps = [];
    for (var i in Collision.grid) {
        maps.push(i);
    }
    socket.on('signIn', async function(cred) {
        var valid = ACCOUNTS.validateCredentials(cred.username, cred.password);
        switch (valid) {
            case 0:
                if (filter.check(cred.username)) {
                    socket.emit('disconnected');
                    break;
                }
                switch (cred.state) {
                    case 'signIn':
                        if (!self.signedIn) {
                            var status = await ACCOUNTS.login(cred.username, cred.password);
                            switch (status) {
                                case 0:
                                    var signedIn = false;
                                    for (var i in Player.list) {
                                        if (Player.list[i].name == cred.username) {
                                            signedIn = true;
                                        }
                                    }
                                    if (!signedIn) {
                                        self.creds.username = cred.username;
                                        self.creds.password = cred.password;
                                        socket.emit('mapData', maps);
                                    } else {
                                        socket.emit('signInState', 'alreadySignedIn');
                                    }
                                    break;
                                case 1:
                                    socket.emit('signInState', 'incorrectPassword');
                                    break;
                                case 2:
                                    socket.emit('signInState', 'noAccount');
                                    break;
                            }
                            self.signedIn = true;
                        }
                        break;
                    case 'loaded':
                        if (cred.username == self.creds.username && cred.password == self.creds.password) {
                            await self.loadData();
                            self.name= cred.username;
                            socket.emit('signInState', 'signedIn');
                            insertChat(self.name + ' joined the game.', 'server');
                            self.canMove = true;
                            self.alive = true;
                        } else {
                            socket.emit('signInState', 'invalidSignIn');
                        }
                        break;
                    case 'signUp':
                        var status = await ACCOUNTS.signup(cred.username, cred.password);
                        switch (status) {
                            case 0:
                                socket.emit('signInState', 'signedUp');
                                break;
                            case 1:
                                socket.emit('signInState', 'accountExists');
                                break;
                            case 2:
                                socket.emit('signInState', 'databaseError');
                                break;
                        }
                        break;
                    case 'deleteAccount':
                        var status = await ACCOUNTS.deleteAccount(cred.username, cred.password);
                        switch (status) {
                            case 0:
                                self.name = cred.username;
                                socket.emit('signInState', 'deletedAccount');
                                break;
                            case 1:
                                socket.emit('signInState', 'incorrectPassword');
                                break;
                            case 2:
                                socket.emit('signInState', 'noAccount');
                                break;
                            case 3:
                                socket.emit('signInState', 'databaseError');
                                break;
                        }
                        break;
                    case 'changePassword':
                        var status = await ACCOUNTS.changePassword(cred.username, cred.oldPassword, cred.password);
                        switch (status) {
                            case 0:
                                self.name = cred.username;
                                socket.emit('signInState', 'changedPassword');
                                break;
                            case 1:
                                socket.emit('signInState', 'incorrectPassword');
                                break;
                            case 2:
                                socket.emit('signInState', 'noAccount');
                                break;
                            case 3:
                                socket.emit('signInState', 'databaseError');
                                break;
                        }
                        break;
                    default:
                        error('Invalid sign in state ' + cred.state);
                        break;
                }
            break;
            case 1:
                socket.emit('signInState', 'noUsername');
                break;
            case 2:
                socket.emit('signInState', 'shortUsername');
                break;
            case 3:
                socket.emit('signInState', 'longUsername');
                break;
            case 4:
                socket.emit('signInState', 'noPassword');
                break;
            case 5:
                socket.emit('signInState', 'invalidCharacters');
                break;
        }
    });
    socket.on('keyPress', function(data) {
        if (data) {
            if (self.alive && self.canMove) {
                if (data.key == 'up') self.keys.up = data.state;
                if (data.key == 'down') self.keys.down = data.state;
                if (data.key == 'left') self.keys.left = data.state;
                if (data.key == 'right') self.keys.right = data.state;
                if (data.key == 'heal') self.keys.heal = data.state;
            }
        } else {
            insertChat(self.name + ' cheated using socket.emit()', 'anticheat');
            socket.emit('disconnected');
        }
    });
    socket.on('click', function(data) {
        if (data) {
            if (self.alive && self.canMove) {
                if (data.button == 'left') {
                    self.attacking = data.state;
                    self.mouseX = data.x;
                    self.mouseY = data.y; 
                }
            }
        } else {
            insertChat(self.name + ' cheated using socket.emit()', 'anticheat');
            socket.emit('disconnected');
        }
    });
    socket.on('mouseMove', function(data) {
        if (data) {
            self.mouseX = data.x;
            self.mouseY = data.y;
        } else {
            insertChat(self.name + ' cheated using socket.emit()', 'anticheat');
            socket.emit('disconnected');
        }
    });
    socket.on('respawn', function() {
        if (self.alive) {
            self.onDeath();
            insertChat(self.name + ' respawn cheated.', 'anticheat');
        } else self.respawn();
    });
    socket.on('teleport1', function() {
        for (var i = 0; i < 20; i++) {
            new Particle(self.map, self.x, self.y, 'teleport');
        }
        self.map = self.teleportLocation.map;
        self.x = self.teleportLocation.x;
        self.y = self.teleportLocation.y;
        for (var i = 0; i < 20; i++) {
            new Particle(self.map, self.x, self.y, 'teleport');
        }
        socket.emit('teleport2', {map: self.map, x: self.x, y: self.y});
    });
    socket.on('teleport2', function() {
        self.canMove = true;
    });
    socket.on('toggleDebug', function() {
        self.debugEnabled = !self.debugEnabled;
    });
    socket.on('chat', function(msg) {
        if (self.signedIn) {
            if (msg) {
                try {
                    if (msg[0] == '/') {
                        var cmd = '';
                        var arg = msg.replace('/', '');
                        while (true) {
                            cmd = cmd + arg[0];
                            arg = arg.replace(arg[0], '');
                            if (arg[0] == ' ') {
                                arg = arg.replace(arg[0], '');
                                break;
                            }
                            if (arg == '') break;
                        }
                        var args = [];
                        var i = 0;
                        while (true) {
                            if (args[i]) args[i] = args[i] + arg[0];
                            else args[i] = arg[0];
                            arg = arg.replace(arg[0], '');
                            if (arg[0] == ' ') {
                                if (!(cmd == 'msg' && i == 1)) {
                                    arg = arg.replace(arg[0], '');
                                    i++;
                                }
                            }
                            if (arg == '') break;
                        }
                        switch (cmd) {
                            case 'msg':
                                if (args[0] == null) {
                                    insertSingleChat('No recipient!', 'error', self.name, false);
                                    return;
                                }
                                if (args[0] == self.name) {
                                    insertSingleChat('You can\'t message yourself!', 'error', self.name, false);
                                    return;
                                }
                                var valid = false;
                                for (var i in Player.list) {
                                    if (Player.list[i].name == args[0]) valid = true;
                                }
                                if (!valid) {
                                    insertSingleChat('No player found with name ' + args[0], 'error', self.name, false);
                                    break;
                                }
                                if (args[1] == null || args[1] == ' ') {
                                    insertSingleChat('Empty message!', 'error', self.name, false);
                                    return;
                                }
                                if (valid) {
                                    insertSingleChat(self.name + '->' + args[0] + ': ' + filter.clean(args[1], '-'), '', args[0], true);
                                    insertSingleChat(self.name + '->' + args[0] + ': ' + filter.clean(args[1], '-'), '', self.name, false);
                                }
                                break;
                            case 'waypoint':
                                insertSingleChat('No waypoints unlocked yet.', 'error', self.name, false);
                                break;
                            case 'error':
                                insertSingleChat('FATAL ERROR', 'anticheat', self.name, false);
                                insertSingleChat('FATAL ERROR', 'anticheat', self.name, false);
                                insertSingleChat('FATAL ERROR', 'anticheat', self.name, false);
                                insertSingleChat('FATAL ERROR', 'anticheat', self.name, false);
                                insertSingleChat('FATAL ERROR', 'anticheat', self.name, false);
                                insertSingleChat('FATAL ERROR', 'anticheat', self.name, false);
                                insertSingleChat('FATAL ERROR', 'anticheat', self.name, false);
                                break;
                            default:
                                insertSingleChat('Command not found ' + cmd, 'error', self.name, false);
                                break;
                        }
                    } else {
                        var valid = false;
                        for (var i in msg) {
                            if (msg[i] != ' ') valid = true;
                        }
                        if (valid) insertChat(self.name + ': ' + filter.clean(msg, '-'), '');
                    }
                } catch (err) {
                    error(err);
                }
            }
        }
    });

    self.update = function() {
        self.updatePos();
        self.lastAttack++;
        if (self.attacking && !self.region.noattack && self.lastAttack > self.attack.useTime && self.attack.projectile != null && self.mana >= self.attack.manaCost && self.alive) {
            self.lastAttack = 0;
            switch (self.attack.projectilePattern) {
                case 'single':
                    new Projectile(self.attack.projectile, self.x, self.y, self.map, Math.atan2(self.mouseY, self.mouseX), self.id);
                    break;
                case 'double':
                    var angle = Math.atan2(self.mouseY, self.mouseX);
                    new Projectile(self.attack.projectile, self.x, self.y, self.map, angle-degrees(15), self.id);
                    new Projectile(self.attack.projectile, self.x, self.y, self.map, angle+degrees(15), self.id);
                    break;
                case 'triple':
                    var angle = Math.atan2(self.mouseY, self.mouseX);
                    new Projectile(self.attack.projectile, self.x, self.y, self.map, angle-degrees(20), self.id);
                    new Projectile(self.attack.projectile, self.x, self.y, self.map, angle, self.id);
                    new Projectile(self.attack.projectile, self.x, self.y, self.map, angle+degrees(20), self.id);
                    break;
                case 'spray':
                    var angle = Math.atan2(self.mouseY, self.mouseX);
                    new Projectile(self.attack.projectile, self.x, self.y, self.map, angle+Math.random()*0.2-0.1, self.id);
                    break;
                case 'line':
                    var angle = Math.atan2(self.mouseY, self.mouseX);
                    new Projectile(self.attack.projectile, self.x, self.y, self.map, angle, self.id);
                    new Projectile(self.attack.projectile, self.x, self.y, self.map, angle-degrees(180), self.id);
                    break;
                case 'triangle':
                    var angle = Math.atan2(self.mouseY, self.mouseX);
                    new Projectile(self.attack.projectile, self.x, self.y, self.map, angle-degrees(120), self.id);
                    new Projectile(self.attack.projectile, self.x, self.y, self.map, angle, self.id);
                    new Projectile(self.attack.projectile, self.x, self.y, self.map, angle+degrees(120), self.id);
                    break;
                case 'ring':
                    var angle = Math.atan2(self.mouseY, self.mouseX);
                    new Projectile(self.attack.projectile, self.x, self.y, self.map, angle, self.id);
                    new Projectile(self.attack.projectile, self.x, self.y, self.map, angle-degrees(36), self.id);
                    new Projectile(self.attack.projectile, self.x, self.y, self.map, angle-degrees(72), self.id);
                    new Projectile(self.attack.projectile, self.x, self.y, self.map, angle-degrees(108), self.id);
                    new Projectile(self.attack.projectile, self.x, self.y, self.map, angle-degrees(144), self.id);
                    new Projectile(self.attack.projectile, self.x, self.y, self.map, angle-degrees(180), self.id);
                    new Projectile(self.attack.projectile, self.x, self.y, self.map, angle-degrees(216), self.id);
                    new Projectile(self.attack.projectile, self.x, self.y, self.map, angle-degrees(252), self.id);
                    new Projectile(self.attack.projectile, self.x, self.y, self.map, angle-degrees(288), self.id);
                    new Projectile(self.attack.projectile, self.x, self.y, self.map, angle-degrees(324), self.id);
                break;
                default:
                    error('Invalid projectilePattern ' + self.attack.projectilePattern);
                    break;
            }
            self.mana -= self.attack.manaCost;
        }
        self.lastAutoHeal++;
        self.lastHeal++;
        if (self.lastAutoHeal >= seconds(0.4) && self.hp < self.maxHP && self.alive) {
            self.hp = Math.min(self.hp+self.stats.heal, self.maxHP);
            self.lastAutoHeal = 0;
        }
        if (self.keys.heal && self.alive && self.hp < self.maxHP && self.lastHeal >= seconds(1) && self.mana >= 20) {
            var oldhp = self.hp;
            self.lastHeal = 0;
            self.hp = Math.min(self.hp+20, self.maxHP);
            self.mana -= 20;
            self.lastManaUse = 0;
            new Particle(self.map, self.x, self.y, 'heal', '+' + self.hp-oldhp);
        }
        self.lastAutoManaRegen++;
        self.lastManaRegen++;
        self.lastManaUse++;
        if (self.lastAutoManaRegen >= seconds(0.5) && self.lastManaUse < seconds(2) && self.alive) {
            self.mana = Math.min(self.mana+1, self.maxMana);
            self.lastAutoManaRegen = 0;
        }
        if (self.lastManaUse >= seconds(2) && self.alive) {
            if (self.lastManaRegen >= seconds(0.1)) {
                self.mana = Math.min(self.mana+1, self.maxMana);
                self.lastManaRegen = 0;
            }
        }
        self.heldItem.angle = Math.atan2(self.mouseY, self.mouseX);
        self.updateAnimation();
        self.updateClient();
    };
    self.updateClient = function() {
        var pack = {
            id: self.id,
            hp: self.hp,
            maxHP: self.maxHP,
            xp: self.xp,
            maxXP: self.maxXP,
            mana: self.mana,
            maxMana: self.maxMana,
        }
        socket.emit('updateSelf', pack);
    };
    self.onRegionChange = function() {
        socket.emit('region', self.region.name);
    };
    self.teleport = function(map, x, y) {
        self.teleportLocation.map = map;
        self.teleportLocation.x = x*64+32;
        self.teleportLocation.y = y*64+32;
        socket.emit('teleport1');
        self.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            heal: false
        };
        self.canMove = false;
    };
    self.onDeath = function(entity, type) {
        var oldhp = self.hp;
        self.hp = 0;
        self.alive = false;
        socket.emit('playerDied');
        self.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            heal: false
        };
        self.attacking = false;
        if (self.hp != oldhp) {
            new Particle(self.map, self.x, self.y, 'damage', self.hp-oldhp);
        }
        for (var i = 0; i < 20; i++) {
            new Particle(self.map, self.x, self.y, 'playerdeath');
        }
        switch (type) {
            case 'killed':
                insertChat(self.name + ' was killed by ' + entity.name + '.', 'death');
                break;
            case 'explosion':
                insertChat(self.name + ' blew up.', 'death');
                break;
            case 'debug':
                insertChat(self.name + ' was debugged.', 'death');
                break;
            default:
                insertChat(self.name + ' died.', 'death');
                break;
        }
    };
    self.respawn = function() {
        self.hp = self.maxHP;
        self.alive = true;
    };
    self.updateStats = function() {
        self.stats = {
            damageType: null,
            projectileSpeed: 1,
            attack: 1,
            defense: 0,
            damageReduction: 0,
            heal: 1,
            speed: 1,
            range: 1,
            critChance: 0,
            knockback: 0
        };
        self.attack = {
            projectile: null,
            projectilePattern: 'single',
            useTime: 0,
            manaCost: 0,
        };
        self.heldItem.id = null;
        self.maxHP = 100;
        if (self.inventory.equips.weapon) {
            var item = self.inventory.equips.weapon;
            self.stats.damageType = item.damageType;
            self.stats.attack *= item.damage;
            self.stats.critChance += item.critChance;
            self.stats.knockback += item.damage;
            self.attack.projectile = item.projectile;
            self.attack.projectilePattern = item.projectilePattern;
            self.stats.projectileSpeed = item.projectileSpeed;
            self.attack.useTime = item.useTime;
            self.attack.manaCost = item.manaCost;
            self.heldItem.id = item.id;
        }
        for (var i in self.inventory.equips) {
            var localitem = self.inventory.equips[i];
            if (localitem) if (!i.includes('weapon')) {
                for (var j in localitem.effects) {
                    var effect = localitem.effects[j];
                    switch (effect.id) {
                        case 'health':
                            self.maxHP *= effect.value;
                            self.maxHP = Math.round(self.maxHP);
                            break;
                        case 'damage':
                            self.stats.attack *= effect.value;
                            break;
                        case 'rangedDamage':
                            if (self.stats.damageType == 'ranged') self.stats.attack *= effect.value;
                            break;
                        case 'meleeDamage':
                            if (self.stats.damageType == 'melee') self.stats.attack *= effect.value;
                            break;
                        case 'magicDamage':
                            if (self.stats.damageType == 'magic') self.stats.attack *= effect.value;
                            break;
                        case 'range':
                            self.stats.range *= effect.value;
                            break;
                        case 'critChance':
                            self.stats.critChance += effect.value;
                            break;
                        case 'damageReduction':
                            self.stats.damageReduction += effect.value;
                            break;
                        case 'defense':
                            self.stats.defense += effect.value;
                            self.stats.defense = Math.min(self.stats.defense, 1);
                            break;
                        default:
                            error('Invalid item effect ' + effect.id);
                            break;
                    }
                }
            }
        }
    };
    self.saveData = async function() {
        await ACCOUNTS.saveProgress(self.creds.username, self.creds.password, self.inventory.getSaveData());
    };
    self.loadData = async function() {
        self.inventory.loadSaveData(await ACCOUNTS.loadProgress(self.creds.username, self.creds.password));
        self.updateStats();
        var noWeapon = true;
        for (var i in self.inventory.items) {
            if (self.inventory.items[i].slotType == 'weapon') noWeapon = false;
        }
        if (self.inventory.equips['weapon']) noWeapon = false;
        if (self.inventory.equips['weapon2']) noWeapon = false;
        if (noWeapon) {
            self.inventory.addItem('simplewoodenbow');
        }
    };

    Player.list[self.id] = self;
    return self;
};
Player.update = function() {
    var pack = [];
    for (var i in Player.list) {
        var localplayer = Player.list[i];
        if (localplayer.name) {
            localplayer.update();
            pack.push({
                id: localplayer.id,
                map: localplayer.map,
                x: localplayer.x,
                y: localplayer.y,
                name: localplayer.name,
                animationStage: localplayer.animationStage,
                characterStyle: localplayer.characterStyle,
                hp: localplayer.hp,
                maxHP: localplayer.maxHP,
                heldItem: localplayer.heldItem,
                isNPC: false
            });
        }
    }

    return pack;
};
Player.getDebugData = function() {
    var pack = [];
    for (var i in Player.list) {
        var localplayer = Player.list[i];
        if (localplayer.name) {
            pack.push({
                map: localplayer.map,
                x: localplayer.x,
                y: localplayer.y,
                width: localplayer.width,
                height: localplayer.height,
                collisionBoxSize: localplayer.collisionBoxSize,
                animationStage: localplayer.animationStage,
                keys: localplayer.keys,
                isNPC: false
            });
        }
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
    self.animationDirection = 'loop'
    self.ai.attackType = 'none';
    self.ai.lastAttack = 0;
    self.ai.attackStage = 0;
    self.ai.attackTime = 0;
    self.ai.damaged = false;
    self.ai.fleeing = false;
    self.ai.fleeThreshold = 0;
    self.ai.inNomonsterRegion = false;
    self.targetMonsters = false;
    try {
        var tempmonster = Monster.types[type];
        self.type = type;
        self.name = tempmonster.name;
        self.stats = tempmonster.stats;
        self.moveSpeed = tempmonster.moveSpeed;
        self.width = tempmonster.width;
        self.height = tempmonster.height;
        self.ai.attackType = tempmonster.attackType;
        self.ai.attackTime = 0;
        self.ai.maxRange = tempmonster.aggroRange;
        self.ai.circleTarget = tempmonster.circleTarget;
        self.ai.circleDistance = tempmonster.circleDistance;
        self.ai.circleDirection = -0.5;
        self.ai.idleMove = tempmonster.idleMove;
        self.hp = tempmonster.hp;
        self.ai.fleeThreshold = tempmonster.fleeThreshold;
        self.maxHP = tempmonster.hp;
        self.xpDrop = tempmonster.xpDrop;
        self.drops = tempmonster.drops;
        self.animationLength = tempmonster.animationLength;
    } catch (err) {
        error(err);
        return;
    }
    self.collisionBoxSize = Math.max(self.width, self.height);
    self.active = true;

    self.update = function() {
        self.active = false;
        for (var i in Player.list) {
            if (Player.list[i].map == self.map && self.getSquareGridDistance(Player.list[i]) < 48) {
                self.active = true;
            }
        }
        if (self.stats.heal != 0) {
            self.lastAutoHeal++;
            if (self.lastAutoHeal >= seconds(0.2) && self.hp < self.maxHP) {
                self.hp = Math.min(self.hp+self.stats.heal, self.maxHP);
                self.lastAutoHeal = 0;
            }
        }
        if (self.active) {
            self.updateAggro();
            self.updatePos();
            self.attack();
            self.updateAnimation();
        }
    };
    self.updatePos = function() {
        if (self.aiControlled) {
            self.ai.lastPath++;
            if (self.ai.lastPath >= seconds(0.1)) {
                self.ai.lastPath = 0;
                self.ai.path = [];
                if (self.ai.inNomonsterRegion) {
                    var closest = {
                        x: null,
                        y: null
                    };
                    for (var x = self.gridx-20; x < self.gridx+20; x++) {
                        for (var y = self.gridy-20; y < self.gridy+20; y++) {
                            if (Region.grid[self.map][y]) if (Region.grid[self.map][y][x]) if (Region.grid[self.map][y][x].nomonster == false) {
                                if (closest.x == null) closest = {
                                    x: x,
                                    y: y
                                };
                                if (self.getGridDistance({x: x, y: y}) < self.getGridDistance(closest)) {
                                    closest = {
                                        x: x,
                                        y: y
                                    };
                                }
                            }
                        }
                    }
                    if (closest) {
                        self.ai.posTarget = closest;
                        self.ai.pathtoPos();
                    }
                } else if (self.ai.entityTarget) {
                    if (self.ai.fleeing) {
                        try {
                            var offsetx = self.gridx-self.ai.maxRange-1;
                            var offsety = self.gridy-self.ai.maxRange-1;
                            var size = self.ai.maxRange*2+1;
                            var grid = [];
                            for (var i = 0; i < size; i++) {
                                grid[i] = [];
                                for (var j = 0; j < size; j++) {
                                    grid[i][j] = {
                                        g: 0,
                                        h: 0,
                                        f: 0,
                                        x: i+offsetx,
                                        y: j+offsety
                                    };
                                }
                            }
                            for (var y = 0; y < size; y++) {
                                for (var x = 0; x < size; x++) {
                                    var checkx = x+offsetx;
                                    var checky = y+offsety;
                                    grid[x][y].h = Math.sqrt(Math.pow(self.gridx-checkx, 2) + Math.pow(self.gridy-checky, 2));
                                    grid[x][y].g = Math.sqrt(Math.pow(self.ai.entityTarget.gridx-checkx, 2) + Math.pow(self.ai.entityTarget.gridy-checky, 2));
                                    grid[x][y].f = grid[x][y].h-grid[x][y].g;
                                    if (Collision.grid[self.map][checky]) if (Collision.grid[self.map][checky][checkx]) {
                                        grid[x][y].g = 999;
                                    }
                                    if (Region.grid[self.map]) if (Region.grid[self.map][Math.floor(y)]) if (Region.grid[self.map][Math.floor(y)][Math.floor(x)]) if (Region.grid[self.map][Math.floor(y)][Math.floor(x)].nomonster) {
                                        grid[x][y].g = 999;
                                    }
                                }
                            }
                            var best = null;
                            for (var x in grid) {
                                for (var y in grid) {
                                    if (best == null) best = grid[x][y];
                                    if (grid[x][y].f < best.f) best = grid[x][y];
                                }
                            }
                            if (best) {
                                self.ai.posTarget.x = best.x;
                                self.ai.posTarget.y = best.y;
                                self.ai.pathtoPos();
                            }
                        } catch (err) {
                            error(err);
                        }
                    } else if (self.ai.circleTarget && self.getGridDistance(self.ai.entityTarget) < (self.ai.circleDistance+1)*64) {
                        try {
                            var target = self.ai.entityTarget;
                            var angle = Math.atan2(target.y-self.y, target.x-self.x);
                            var x = target.gridx*64+Math.round((Math.cos(angle)*self.ai.circleDistance)*64);
                            var y = target.gridy*64+Math.round((Math.sin(angle)*self.ai.circleDistance)*64);
                            angle = Math.atan2(target.y-y, target.x-x);
                            var oldangle = angle;
                            angle += self.ai.circleDirection;
                            x = target.gridx*64+Math.round((Math.cos(angle)*self.ai.circleDistance)*64);
                            y = target.gridy*64+Math.round((Math.sin(angle)*self.ai.circleDistance)*64);
                            var invalid = false;
                            if (Collision.grid[self.map][Math.floor(y)]) if (Collision.grid[self.map][Math.floor(y)][Math.floor(x)]) {
                                invalid = true;
                            }
                            if (Region.grid[self.map]) if (Region.grid[self.map][Math.floor(y)]) if (Region.grid[self.map][Math.floor(y)][Math.floor(x)]) if (Region.grid[self.map][Math.floor(y)][Math.floor(x)].nomonster) {
                                invalid = true;
                            }
                            if (Math.random() <= 0.02) invalid = true;
                            if (invalid) {
                                angle = oldangle;
                                self.ai.circleDirection *= -1;
                                angle += self.ai.circleDirection;
                                x = target.gridx*64+Math.round((Math.cos(angle)*self.ai.circleDistance)*64);
                                y = target.gridy*64+Math.round((Math.sin(angle)*self.ai.circleDistance)*64);
                            }
                            self.ai.posTarget.x = target.gridx+Math.round(Math.cos(angle)*self.ai.circleDistance);
                            self.ai.posTarget.y = target.gridy+Math.round(Math.sin(angle)*self.ai.circleDistance);
                            self.ai.pathtoPos();
                        } catch (err) {
                            error(err);
                        }
                    } else {
                        self.ai.pathtoEntity();
                    }
                } else if (self.ai.idleMove != 'none') {
                    self.ai.pathIdle();
                } else {
                    self.ai.path = [];
                }
            }
            self.keys = {
                up: false,
                down: false,
                left: false,
                right: false,
                heal: false
            };
        } else {
            self.xspeed = 0;
            self.yspeed = 0;
            if (self.keys.up) {
                self.yspeed = -self.moveSpeed;
            }
            if (self.keys.down) {
                self.yspeed = self.moveSpeed;
            }
            if (self.keys.left) {
                self.xspeed = -self.moveSpeed;
            }
            if (self.keys.right) {
                self.xspeed = self.moveSpeed;
            }
        }
        self.collide();
        var foundregion = false;
        if (Region.grid[self.map][self.gridy]) if (Region.grid[self.map][self.gridy][self.gridx]) if (Region.grid[self.map][self.gridy][self.gridx].name != self.region.name) {
            self.region = Region.grid[self.map][self.gridy][self.gridx];
            self.onRegionChange();
        }
        if (Region.grid[self.map][self.gridy]) if (Region.grid[self.map][self.gridy][self.gridx]) foundregion = true;
        if (!foundregion && self.region.name != 'The Wilderness') {
            self.region = {
                name: 'The Wilderness',
                noattack: false,
                nomonster: false
            };
            self.onRegionChange();
        }
    };
    self.updateAggro = function() {
        if (!self.ai.fleeing) {
            if (self.targetMonsters) {
                var lowest = null;
                for (var i in Monster.list) {
                    if (Monster.list[i].map == self.map && self.getGridDistance(Monster.list[i]) < self.ai.maxRange && i != self.id && !Monster.list[i].region.nomonster && Monster.list[i].alive) {
                        if (lowest == null) lowest = i;
                        if (self.getGridDistance(Monster.list[i]) < self.getGridDistance(Monster.list[lowest])) {
                            lowest = i;
                        }
                    }
                }
                if (lowest) self.ai.entityTarget = Monster.list[lowest];
                if (lowest == null && !self.damaged) self.ai.entityTarget = null;
            } else {
                var lowest = null;
                for (var i in Player.list) {
                    if (Player.list[i].map == self.map && self.getGridDistance(Player.list[i]) < self.ai.maxRange && i != self.id && !Player.list[i].region.nomonster && Player.list[i].alive) {
                        if (lowest == null) lowest = i;
                        if (self.getGridDistance(Player.list[i]) < self.getGridDistance(Player.list[lowest])) {
                            lowest = i;
                        }
                    }
                }
                if (lowest) self.ai.entityTarget = Player.list[lowest];
                if (lowest == null && !self.damaged) self.ai.entityTarget = null;
            }
        }
    };
    self.attack = function() {
        self.ai.lastAttack++;
        switch (self.ai.attackType) {
            case 'triggeredcherrybomb':
                self.ai.attackTime++;
                if (self.ai.attackTime >= 2) {
                    self.ai.attackType = 'exploding';
                    self.moveSpeed = 0;
                    self.invincible = true;
                    self.alive = false;
                    self.animationStage = 0;
                    self.animationLength = 10;
                    self.onDeath = function() {};
                    for (var i = 0; i < 50; i++) {
                        new Particle(self.map, self.x, self.y, 'explosion');
                    }
                    for (var i in Monster.list) {
                        if (parseFloat(i) != self.id && self.getDistance(Monster.list[i]) <= 192) {
                            if (Monster.list[i].ai.attackType == 'cherrybomb') {
                                Monster.list[i].ai.attackType = 'triggeredcherrybomb';
                                Monster.list[i].ai.attackTime = 0;
                            } else if (Monster.list[i].ai.attackType != 'triggeredcherrybomb') {
                                Monster.list[i].onDeath(self, 'explosion');
                            }
                        } else if (parseFloat(i) != self.id && self.getDistance(Monster.list[i]) <= 320) {
                            if (Monster.list[i].ai.attackType == 'cherrybomb') {
                                Monster.list[i].ai.attackType = 'triggeredcherrybomb';
                                Monster.list[i].ai.attackTime = 0;
                            } else if (Monster.list[i].ai.attackType != 'triggeredcherrybomb') {
                                Monster.list[i].onHit(self, 'cherrybomb');
                            }
                        }
                    }
                    for (var i in Player.list) {
                        if (self.getDistance(Player.list[i]) <= 192) Player.list[i].onDeath(self, 'explosion');
                        else if (self.getDistance(Player.list[i]) <= 320) Player.list[i].onHit(self, 'cherrybomb');
                    }
                }
                break;
            case 'exploding':
                if (self.animationStage >= 10) delete Monster.list[self.id];
                break;
            case 'snowball':
                if (self.animationStage == 7) {
                    self.animationLength = 0;
                    self.animationSpeed = 100;
                }
                break;
            default:
                break;
        }
        if (self.ai.entityTarget && !self.region.noattack) {
            switch (self.ai.attackType) {
                case 'bird':
                    if (self.ai.lastAttack > seconds(1)) {
                        if (self.ai.attackStage == 5) {
                            var angle = Math.atan2(self.ai.entityTarget.y-self.y, self.ai.entityTarget.x-self.x);
                            new Projectile('ninjastar', self.x, self.y, self.map, angle+Math.random()*0.2-0.1, self.id);
                            self.ai.attackStage = 0;
                            self.ai.lastAttack = 0;
                        }
                        if (self.ai.attackStage == 1) {
                            var angle = Math.atan2(self.ai.entityTarget.y-self.y, self.ai.entityTarget.x-self.x);
                            new Projectile('ninjastar', self.x, self.y, self.map, angle+Math.random()*0.2-0.1, self.id);
                        }
                        self.ai.attackStage++;
                    }
                    break;
                case 'snowbird':
                    if (self.ai.lastAttack > seconds(1)) {
                        if (self.ai.attackStage == 5) {
                            var angle = Math.atan2(self.ai.entityTarget.y-self.y, self.ai.entityTarget.x-self.x);
                            new Projectile('fastsnowball', self.x, self.y, self.map, angle+Math.random()*0.2-0.1, self.id);
                            self.ai.attackStage = 0;
                            self.ai.lastAttack = 0;
                        }
                        if (self.ai.attackStage == 1) {
                            var angle = Math.atan2(self.ai.entityTarget.y-self.y, self.ai.entityTarget.x-self.x);
                            new Projectile('fastsnowball', self.x, self.y, self.map, angle+Math.random()*0.2-0.1, self.id);
                        }
                        self.ai.attackStage++;
                    }
                    break;
                case 'cherrybomb':
                    if (self.getDistance(self.ai.entityTarget) < 64) {
                        self.ai.attackType = 'exploding';
                        self.moveSpeed = 0;
                        self.invincible = true;
                        self.alive = false;
                        self.animationStage = 0;
                        self.animationLength = 10;
                        self.onDeath = function() {};
                        for (var i = 0; i < 50; i++) {
                            new Particle(self.map, self.x, self.y, 'explosion');
                        }
                        for (var i in Monster.list) {
                            if (parseFloat(i) != self.id && self.getDistance(Monster.list[i]) <= 192) {
                                if (Monster.list[i].ai.attackType == 'cherrybomb') {
                                    Monster.list[i].ai.attackType = 'triggeredcherrybomb';
                                    Monster.list[i].ai.attackTime = 0;
                                } else if (Monster.list[i].ai.attackType != 'triggeredcherrybomb') {
                                    Monster.list[i].onDeath(self, 'explosion');
                                }
                            } else if (parseFloat(i) != self.id && self.getDistance(Monster.list[i]) <= 320) {
                                if (Monster.list[i].ai.attackType == 'cherrybomb') {
                                    Monster.list[i].ai.attackType = 'triggeredcherrybomb';
                                    Monster.list[i].ai.attackTime = 0;
                                } else if (Monster.list[i].ai.attackType != 'triggeredcherrybomb') {
                                    Monster.list[i].onHit(self, 'cherrybomb');
                                }
                            }
                        }
                        for (var i in Player.list) {
                            if (self.getDistance(Player.list[i]) <= 192) Player.list[i].onDeath(self, 'explosion');
                            else if (self.getDistance(Player.list[i]) <= 320) Player.list[i].onHit(self, 'cherrybomb');
                        }
                    }
                    break;
                case 'triggeredcherrybomb':
                    break;
                case 'exploding':
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
                        new Projectile('snowball', self.x, self.y, self.map, degrees(angle), self.id);
                        new Projectile('snowball', self.x, self.y, self.map, degrees(angle-90), self.id);
                        new Projectile('snowball', self.x, self.y, self.map, degrees(angle-180), self.id);
                        new Projectile('snowball', self.x, self.y, self.map, degrees(angle-270), self.id);
                        self.ai.attackStage++;
                    }
                    break;
                default:
                    error('Invalid attack type: ' + self.ai.attackType);
                    break;
            }
        }
    };
    self.onHit = function(entity, type) {
        var oldhp = self.hp;
        if (self.invincible == false) {
            switch (type) {
                case 'projectile':
                    self.hp -= Math.max(Math.round((entity.damage*(1-self.stats.defense))-self.stats.damageReduction), 0);
                    if (self.hp < 0) {
                        if (entity.parentIsPlayer) self.onDeath(Player.list[entity.parentID]);
                        else self.onDeath(Monster.list[entity.parentID]);
                    }
                    if (entity.parentID) {
                        if (entity.parentIsPlayer) {
                            self.entityTarget = Player.list[entity.parentID];
                        } else {
                            self.entityTarget = Monster.list[entity.parentID];
                        }
                        self.damaged = true;
                    }
                    break;
                case 'cherrybomb':
                    self.hp -= Math.max(Math.round((500*(1-self.stats.defense))-self.stats.damageReduction), 0);
                    if (self.hp < 0) self.onDeath(entity, 'cherrybomb');
                    break;
                default:
                    error('Invalid Entity type: ' + type);
                    break;
            }
        }
        new Particle(self.map, self.x, self.y, 'damage', self.hp-oldhp);
        if (self.hp < self.ai.fleeThreshold) self.ai.fleeing = true;
    };
    self.onDeath = function(entity, type) {
        var oldhp = self.hp;
        self.hp = 0;
        self.alive = false;
        if (entity) {
            entity.xp += self.xpDrop;
            if (entity.inventory != null && self.drops[0]) {
                try {
                    var multiplier = 0;
                    for (var i in self.drops) {
                        multiplier += Inventory.items[self.drops[i]].dropChance;
                    }
                    var random = Math.random()*multiplier;
                    var min = 0;
                    var max = 0;
                    var item;
                    for (var i in self.drops) {
                        max += Inventory.items[self.drops[i]].dropChance;
                        if (random >= min && random <= max) {
                            item = self.drops[i];
                            break;
                        }
                        min += Inventory.items[self.drops[i]].dropChance;
                    }
                    entity.inventory.addItem(item);
                } catch (err) {
                    error(err);
                }
            }
        }
        if (self.hp != oldhp) {
            new Particle(self.map, self.x, self.y, 'damage', self.hp-oldhp);
        }
        for (var i = 0; i < 20; i++) {
            new Particle(self.map, self.x+Math.random()*self.width*2-self.width, self.y+Math.random()*self.height*2-self.height, 'death');
        }
        delete Monster.list[self.id];
    };
    self.onRegionChange = function() {
        if (self.region.nomonster) {
            self.ai.inNomonsterRegion = true;
            self.ai.entityTarget = null;
            self.ai.posTarget = null;
            self.ai.path = [];
        } else {
            self.ai.inNomonsterRegion = false;
        }
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
            y: localmonster.y,
            type: localmonster.type,
            animationStage: localmonster.animationStage,
            hp: localmonster.hp,
            maxHP: localmonster.maxHP
        });
    }

    return pack;
};
Monster.getDebugData = function() {
    var pack = [];
    for (var i in Monster.list) {
        var localmonster = Monster.list[i];
        if (localmonster.active) {
            if (localmonster.ai.entityTarget) {
                pack.push({
                    map: localmonster.map,
                    x: localmonster.x,
                    y: localmonster.y,
                    width: localmonster.width,
                    height: localmonster.height,
                    collisionBoxSize: localmonster.collisionBoxSize,
                    animationStage: localmonster.animationStage,
                    path: localmonster.ai.path,
                    keys: localmonster.keys,
                    aggroTarget: localmonster.ai.entityTarget.id,
                    aggroRange: localmonster.ai.maxRange
                });
            } else {
                pack.push({
                    map: localmonster.map,
                    x: localmonster.x,
                    y: localmonster.y,
                    width: localmonster.width,
                    height: localmonster.height,
                    collisionBoxSize: localmonster.collisionBoxSize,
                    animationStage: localmonster.animationStage,
                    path: localmonster.ai.path,
                    keys: localmonster.keys,
                    aggroTarget: null,
                    aggroRange: localmonster.ai.maxRange
                });
            }
        }
    }

    return pack;
};
Monster.types = require('./monster.json');
Monster.list = [];

// projectiles
Projectile = function(type, x, y, map, angle, parentID) {
    var self = new Entity();
    self.id = Math.random();
    self.type = type;
    self.x = x;
    self.y = y;
    self.map = map;
    try {
        var tempprojectile = Projectile.types[type];
        self.type = type;
        self.width = tempprojectile.width;
        self.height = tempprojectile.height;
        self.moveSpeed = tempprojectile.speed;
        self.damage = tempprojectile.damage;
        self.noCollision = tempprojectile.noCollision;
        self.maxRange = tempprojectile.range;
        self.pattern = Projectile.patterns[tempprojectile.pattern];
    } catch (err) {
        error(err);
        return;
    }
    self.angle = angle;
    self.x += Math.cos(self.angle)*(self.width/2+4);
    self.y += Math.sin(self.angle)*(self.width/2+4);
    self.parentID = parentID;
    self.parentIsPlayer = true;
    if (Monster.list[self.parentID]) self.parentIsPlayer = false;
    var parent;
    if (self.parentIsPlayer) {
        parent = Player.list[self.parentID];
    } else {
        parent = Monster.list[self.parentID];
    }
    try {
        self.damage *= parent.stats.attack;
        self.maxRange *= parent.stats.range;
        self.moveSpeed *= parent.stats.projectileSpeed;
    } catch (err) {
        error(err);
        return;
    }
    self.traveltime = 0;
    self.xspeed = Math.cos(self.angle)*self.moveSpeed;
    self.yspeed = Math.sin(self.angle)*self.moveSpeed;
    self.sinAngle = Math.sin(self.angle);
    self.cosAngle = Math.cos(self.angle);
    self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));

    self.update = function() {
        if (self.parentIsPlayer) {
            if (Player.list[self.parentID] == null) {
                delete Projectile.list[self.id];
                return;
            }
        } else {
            if (Monster.list[self.parentID] == null) {
                delete Projectile.list[self.id];
                return;
            }
        }
        if (self.updatePos()) return;
        if (!self.parentIsPlayer || ENV.pvp) {
            for (var i in Player.list) {
                if (self.collideWith(Player.list[i]) && Player.list[i].map == self.map && Player.list[i].alive && i != self.parentID) {
                    Player.list[i].onHit(self, 'projectile');
                    delete Projectile.list[self.id];
                    break;
                }
            }
        }
        if (self.parentIsPlayer) {
            for (var i in Monster.list) {
                if (self.collideWith(Monster.list[i]) && Monster.list[i].map == self.map && Monster.list[i].alive && i != self.parentID) {
                    Monster.list[i].onHit(self, 'projectile');
                    delete Projectile.list[self.id];
                    break;
                }
            }
        }
        self.traveltime++;
        if (self.traveltime > seconds(self.maxRange)) {
            delete Projectile.list[self.id];
        }
    };
    self.updatePos = function() {
        self.collide();
        self.pattern(self);
        if (self.checkCollision()) return true;
        return false;
    };
    self.checkCollision = function() {
        var collisions = [];
        if (Collision.grid[self.map][self.gridy]) if (Collision.grid[self.map][self.gridy][self.gridx]) {
            collisions.push(Collision.getColEntity(self.map, self.gridx, self.gridy));
        }
        if (Collision.grid[self.map][self.gridy-1]) if (Collision.grid[self.map][self.gridy-1][self.gridx]) {
            collisions.push(Collision.getColEntity(self.map, self.gridx, self.gridy-1));
        }
        if (Collision.grid[self.map][self.gridy+1]) if (Collision.grid[self.map][self.gridy+1][self.gridx]) {
            collisions.push(Collision.getColEntity(self.map, self.gridx, self.gridy+1));
        }
        if (Collision.grid[self.map][self.gridy]) if (Collision.grid[self.map][self.gridy][self.gridx-1]) {
            collisions.push(Collision.getColEntity(self.map, self.gridx-1, self.gridy));
        }
        if (Collision.grid[self.map][self.gridy]) if (Collision.grid[self.map][self.gridy][self.gridx+1]) {
            collisions.push(Collision.getColEntity(self.map, self.gridx+1, self.gridy));
        }
        for (var i in collisions) {
            for (var j in collisions[i]) {
                if (self.collideWith(collisions[i][j])) {
                    delete Projectile.list[self.id];
                    return true;
                }
            }
        }
        return false;
    };
    self.collideWith = function(entity) {
        if (entity.map == self.map) {
            if (entity.noProjectile == null || entity.noProjectile == false) {
                if (self.getSquareDistance(entity) <= self.collisionBoxSize/2 + entity.collisionBoxSize/2) {
                    var vertices = [
                        {x: ((self.width/2)*self.cosAngle)-((self.height/2)*self.sinAngle)+self.x, y: ((self.width/2)*self.sinAngle)+((self.height/2)*self.cosAngle)+self.y},
                        {x: ((self.width/2)*self.cosAngle)-((-self.height/2)*self.sinAngle)+self.x, y: ((self.width/2)*self.sinAngle)+((-self.height/2)*self.cosAngle)+self.y},
                        {x: ((-self.width/2)*self.cosAngle)-((-self.height/2)*self.sinAngle)+self.x, y: ((-self.width/2)*self.sinAngle)+((-self.height/2)*self.cosAngle)+self.y},
                        {x: ((-self.width/2)*self.cosAngle)-((self.height/2)*self.sinAngle)+self.x, y: ((-self.width/2)*self.sinAngle)+((self.height/2)*self.cosAngle)+self.y},
                        {x: self.x, y: self.y}
                    ];
                    var vertices2 = [
                        {x: entity.x+entity.width/2, y: entity.y+entity.height/2},
                        {x: entity.x+entity.width/2, y: entity.y-entity.height/2},
                        {x: entity.x-entity.width/2, y: entity.y-entity.height/2},
                        {x: entity.x-entity.width/2, y: entity.y+entity.height/2}
                    ];
            
                    for (var i = 0; i < 4; i++) {
                        if (vertices2[i].y-vertices[0].y < (self.getSlope(vertices[0], vertices[1])*(vertices2[i].x-vertices[0].x))) {
                            if (vertices2[i].y-vertices[1].y > (self.getSlope(vertices[1], vertices[2])*(vertices2[i].x-vertices[1].x))) {
                                if (vertices2[i].y-vertices[2].y > (self.getSlope(vertices[2], vertices[3])*(vertices2[i].x-vertices[2].x))) {
                                    if (vertices2[i].y-vertices[3].y < (self.getSlope(vertices[3], vertices[0])*(vertices2[i].x-vertices[3].x))) {
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
                }
            }
            return false;
        }
    };
    self.getSlope = function(pos1, pos2) {
        return (pos2.y - pos1.y) / (pos2.x - pos1.x);
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
Projectile.getDebugData = function() {
    var pack = [];
    for (var i in Projectile.list) {
        localprojectile = Projectile.list[i];
        pack.push({
            map: localprojectile.map,
            x: localprojectile.x,
            y: localprojectile.y,
            width: localprojectile.width,
            height: localprojectile.height,
            angle: localprojectile.angle,
            collisionBoxSize: localprojectile.collisionBoxSize,
            parentIsPlayer: localprojectile.parentIsPlayer,
            parent: localprojectile.parent
        });
    }
    
    return pack;
};
Projectile.types = require('./projectile.json');
Projectile.list = [];
Projectile.patterns = {
    none: function(self) {},
    spin: function(self) {
        self.angle += degrees(25);
        self.sinAngle = Math.sin(self.angle);
        self.cosAngle = Math.cos(self.angle);
        self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));
    },
    homing: function(self) {
        self.angle = 0;
        var lowest, target;
        if (self.parentIsPlayer) {
            for (var i in Monster.list) {
                if (Monster.list[i].map == self.map && Monster.list[i].alive) {
                    if (lowest == null) lowest = i;
                    if (self.getGridDistance(Monster.list[i]) < self.getGridDistance(Monster.list[lowest])) {
                        lowest = i;
                    }
                }
            }
            target = Monster.list[lowest];
        } else {
            for (var i in Player.list) {
                if (Player.list[i].map == self.map && Player.list[i].alive) {
                    if (lowest == null) lowest = i;
                    if (self.getGridDistance(Player.list[i]) < self.getGridDistance(Player.list[lowest])) {
                        lowest = i;
                    }
                }
            }
            target = Player.list[lowest];
        }
        if (target) {
            var angle = Math.atan2(-(self.y-target.y), -(self.x-target.x));
            self.xspeed = Math.cos(angle)*self.moveSpeed;
            self.yspeed = Math.sin(angle)*self.moveSpeed;
            self.sinAngle = Math.sin(self.angle);
            self.cosAngle = Math.cos(self.angle);
            self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));
        }
    },
    homing2: function(self) {
        var target;
        if (self.parentIsPlayer) {
            for (var i in Monster.list) {
                if (Monster.list[i].map == self.map && Monster.list[i].alive) {
                    if (target == null) target = i;
                    if (self.getGridDistance(Monster.list[i]) < self.getGridDistance(Monster.list[target])) {
                        target = i;
                    }
                }
            }
        } else {
            for (var i in Player.list) {
                if (Player.list[i].map == self.map && Player.list[i].alive) {
                    if (target == null) target = i;
                    if (self.getGridDistance(Player.list[i]) < self.getGridDistance(Player.list[target])) {
                        target = i;
                    }
                }
            }
        }
        if (target) {
            var angle = Math.atan2(-(self.y-target.y), -(self.x-target.x));
            self.angle += Math.max(-0.1, Math.min(angle, 0.1));
            self.xspeed = Math.cos(self.angle)*self.moveSpeed;
            self.yspeed = Math.sin(self.angle)*self.moveSpeed;
            self.sinAngle = Math.sin(self.angle);
            self.cosAngle = Math.cos(self.angle);
            self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));
        }
    },
    follow: function(self) {
        if (self.parentIsPlayer) {
            if (Player.list[self.parentID]) {
                self.x = Player.list[self.parentID].x;
                self.y = Player.list[self.parentID].y;
                self.angle = Player.list[self.parentID].heldItem.angle;
                self.sinAngle = Math.sin(self.angle);
                self.cosAngle = Math.cos(self.angle);
            }
        } else {
            if (Monster.list[self.parentID]) {
                self.x = Monster.list[self.parentID].x;
                self.y = Monster.list[self.parentID].y;
                self.angle = Monster.list[self.parentID].heldItem.angle;
                self.sinAngle = Math.sin(self.angle);
                self.cosAngle = Math.cos(self.angle);
            }
        }
        self.x += Math.cos(self.angle)*(self.width/2+4);
        self.y += Math.sin(self.angle)*(self.width/2+4);
    }
};

// particles
Particle = function(map, x, y, type, value) {
    var self = {
        map: map,
        x: x,
        y: y,
        type: type,
        value: value
    };

    Particle.list.push(self);
    return self;
};
Particle.update = function() {
    var pack = Particle.list;
    Particle.list = [];

    return pack;
};
Particle.list = [];

// dropped items
DroppedItem = function(map, x, y, data) {
    var self = new Entity();
    self.x = x;
    self.y = y;
    self.map = map;
    for (var i in data) {
        self[i] = data[i];
    }

    self.update = function() {

    };

    DroppedItem.list[self.id] = self;
    return self;
};
DroppedItem.update = function() {
    var pack = [];
    for (var i in DroppedItem.list) {
        localdroppeditem = DroppedItem.list[i];
        localdroppeditem.update();
        pack.push({
            id: localdroppeditem.id,
            map: localdroppeditem.map,
            x: localdroppeditem.x,
            y: localdroppeditem.y,
            itemId: localdroppeditem.itemId,
            enchants: localdroppeditem.enchants
        });
    }

    return pack;
};
DroppedItem.list = [];

// conversion functions
function seconds(s) {
    return s*20;
};
function degrees(degrees) {
    return degrees*Math.PI/180;
};