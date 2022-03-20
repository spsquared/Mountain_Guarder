// Copyright (C) 2022 Radioactive64

const PF = require('pathfinding');

// entities
Entity = function() {
    var self = {
        id: null,
        x: 0,
        y: 0,
        map: 'World',
        layer: 0,
        xspeed: 0,
        yspeed: 0,
        lastx: 0,
        lasty: 0,
        gridx: 0,
        gridy: 0,
        chunkx: 0,
        chunky: 0,
        moveSpeed: 0,
        slowedDown: false,
        width: 0,
        height: 0,
        noCollision: false,
        collisionBoxSize: 1
    };
    self.id = Math.random();
    self.collisionBoxSize = Math.max(self.width, self.height);

    self.update = function() {
        self.updatePos();
    };
    self.updatePos = function() {
        self.collide();
    };
    self.collide = function() {
        try {
            if (self.xspeed != 0 || self.yspeed != 0) {
                self.lastx = self.x;
                self.lasty = self.y;
                self.x += self.xspeed;
                self.y += self.yspeed;
                self.gridx = Math.floor(self.x/64);
                self.gridy = Math.floor(self.y/64);
                if (!self.noCollision) {
                    var colliding = false;
                    if (Math.abs(self.xspeed) >= 192 && Math.abs(self.yspeed) >= 192) colliding = self.checkLargeSpannedCollision();
                    else colliding = self.checkSpannedCollision();
                    if (colliding) {
                        self.x = self.lastx;
                        self.y = self.lasty;
                        var movex = 0;
                        var movey = 0;
                        while (Math.abs(movex) < Math.abs(self.xspeed) || Math.abs(movey) < Math.abs(self.yspeed)) {
                            var xdir = self.xspeed/Math.ceil(Math.max(self.xspeed, self.yspeed)/self.width) || 0;
                            var ydir = self.yspeed/Math.ceil(Math.max(self.xspeed, self.yspeed)/self.height) || 0;
                            self.lastx = self.x;
                            self.lasty = self.y;
                            var lastmovex = movex;
                            var lastmovey = movey;
                            self.x += xdir;
                            self.y += ydir;
                            movex += xdir;
                            movey += ydir;
                            self.gridx = Math.floor(self.x/64);
                            self.gridy = Math.floor(self.y/64);
                            var colliding = false;
                            if (self.width >= 128 && self.height >= 128) colliding = self.checkLargeSpannedCollision();
                            else colliding = self.checkSpannedCollision();
                            if (colliding) {
                                self.x = self.lastx;
                                self.y = self.lasty;
                                movex = lastmovex;
                                movey = lastmovey;
                                var xdir2 = xdir/Math.ceil(Math.max(xdir, ydir));
                                var ydir2 = ydir/Math.ceil(Math.max(xdir, ydir));
                                var movex2 = 0;
                                var movey2 = 0;
                                while (Math.abs(movex2) < Math.abs(xdir) || Math.abs(movey2) < Math.abs(ydir)) {
                                    self.lastx = self.x;
                                    self.lasty = self.y;
                                    self.x += xdir2;
                                    self.y += ydir2;
                                    movex += xdir2;
                                    movey += ydir2;
                                    movex2 += xdir2;
                                    movey2 += ydir2;
                                    self.gridx = Math.floor(self.x/64);
                                    self.gridy = Math.floor(self.y/64);
                                    if (self.doPointCollision()) break;
                                    self.checkLayer();
                                    self.checkSlowdown();
                                }
                                if (self.checkPointCollision()) break;
                            }
                            self.checkLayer();
                            self.checkSlowdown();
                        }
                    }
                }
                self.x = Math.round(self.x);
                self.y = Math.round(self.y);
                self.gridx = Math.floor(self.x/64);
                self.gridy = Math.floor(self.y/64);
                self.chunkx = Math.floor(self.gridx/Collision.grid[self.map].chunkWidth);
                self.chunky = Math.floor(self.gridy/Collision.grid[self.map].chunkHeight);
            }
        } catch (err) {
            error(err);
        }
    };
    self.checkCollisionLine = function(x1, y1, x2, y2) {
        if (x1-x2 != 0) {
            for (var x = Math.floor(Math.min(x1, x2)/64); x <= Math.floor(Math.max(x1, x2)/64); x++) {
                var y = Math.floor(((y2-y1)/(x2-x1)*(x*64)+y1)/64);
                if (Collision.getColEntity(self.map, x, y, self.layer)[0][0]) return true;
            }
        } else {
            var x = Math.floor(x1/64);
            for (var y = Math.floor(Math.min(y1, y2)/64); y <= Math.floor(Math.max(y1, y2)/64); y++) {
                if (Collision.getColEntity(self.map, x, y, self.layer)[0][0]) return true;
            }
        }
        return false;
    };
    self.checkSpannedCollision = function() {
        var x = self.x;
        var y = self.y;
        var width = self.width;
        var height = self.height;
        self.width += Math.abs(self.x-self.lastx);
        self.height += Math.abs(self.y-self.lasty);
        self.x = (self.x+self.lastx)/2;
        self.y = (self.y+self.lasty)/2;
        self.gridx = Math.floor(self.x/64);
        self.gridy = Math.floor(self.y/64);
        self.collisionBoxSize = Math.max(self.width, self.height);
        var colliding = self.checkPointCollision();
        self.x = x;
        self.y = y;
        self.width = width;
        self.height = height;
        self.collisionBoxSize = Math.max(self.width, self.height);
        self.gridx = Math.floor(self.x/64);
        self.gridy = Math.floor(self.y/64);
        return colliding;
    };
    self.checkLargeSpannedCollision = function() {
        var colliding = false;
        if (self.checkPointCollision()) colliding = true;
        if (self.checkCollisionLine(self.lastx-self.width/2, self.lasty-self.height/2, self.x-self.width/2, self.y-self.height/2)) colliding = true;
        if (self.checkCollisionLine(self.lastx-self.width/2, self.lasty+self.height/2, self.x-self.width/2, self.y+self.height/2)) colliding = true;
        if (self.checkCollisionLine(self.lastx+self.width/2, self.lasty+self.height/2, self.x+self.width/2, self.y+self.height/2)) colliding = true;
        if (self.checkCollisionLine(self.lastx+self.width/2, self.lasty-self.height/2, self.x+self.width/2, self.y-self.height/2)) colliding = true;
        if (self.checkCollisionLine(self.lastx, self.lasty, self.x, self.y)) colliding = true;
        return colliding;
    };
    self.checkPointCollision = function() {
        var collisions = [];
        var range = Math.ceil(self.collisionBoxSize/128);
        for (var x = self.gridx-range; x <= self.gridx+range; x++) {
            for (var y = self.gridy-range; y <= self.gridy+range; y++) {
                collisions.push(Collision.getColEntity(self.map, x, y, self.layer));
            }
        }
        for (var i in collisions) {
            for (var j in collisions[i]) {
                if (self.collideWith(collisions[i][j])) return true;
            }
        }
        return false;
    };
    self.doPointCollision = function() {
        var collisions = [];
        var range = Math.ceil(self.collisionBoxSize/128);
        for (var x = self.gridx-range; x <= self.gridx+range; x++) {
            for (var y = self.gridy-range; y <= self.gridy+range; y++) {
                collisions.push(Collision.getColEntity(self.map, x, y, self.layer));
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
                }
            }
        }
        return colliding;
    };
    self.checkLayer = function() {
        var collisions = [];
        var range = Math.ceil(self.collisionBoxSize/128);
        for (var x = self.gridx-range; x <= self.gridx+range; x++) {
            for (var y = self.gridy-range; y <= self.gridy+range; y++) {
                collisions.push(Layer.getColEntity(self.map, x, y, self.layer));
            }
        }
        var dir = 0;
        for (var i in collisions) {
            for (var j in collisions[i]) {
                if (self.collideWith(collisions[i][j])) dir = collisions[i][j].dir;
            }
        }
        if (dir != 0) {
            self.layer += dir;
        }
    };
    self.checkSlowdown = function() {
        var collisions = [];
            for (var y = self.gridy-1; y <= self.gridy+1; y++) {
                for (var x = self.gridx-1; x <= self.gridx+1; x++) {
                    collisions.push(Slowdown.getColEntity(self.map, x, y, self.layer));
                }
            }
        var colliding = false;
        for (var i in collisions) {
            for (var j in collisions[i]) {
                if (self.collideWith(collisions[i][j])) colliding = true;
            }
        }
        self.slowedDown = colliding;
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
        if (entity.gridx != null) {
            return Math.sqrt(Math.pow(self.gridx-entity.gridx, 2) + Math.pow(self.gridy-entity.gridy, 2));
        } else {
            return Math.sqrt(Math.pow(self.gridx-entity.x, 2) + Math.pow(self.gridy-entity.y, 2));
        }
    };
    self.getSquareGridDistance = function(entity) {
        if (entity.gridx != null) {
            return Math.max(Math.abs(self.gridx-entity.gridx), Math.abs(self.gridy-entity.gridy));
        } else {
            return Math.max(Math.abs(self.gridx-entity.x), Math.abs(self.gridy-entity.y));
        }
    };
    self.rayCast = function(x, y) {
        try {
            var ray = {
                x: self.x,
                y: self.y,
                angle: 0,
                xspeed: 0,
                yspeed: 0
            };
            ray.angle = Math.atan2(y-ray.y, x-ray.x);
            ray.xspeed = Math.cos(ray.angle)*15;
            ray.yspeed = Math.sin(ray.angle)*15;
            var distance = Math.ceil(self.getDistance({x: x, y: y})/15)
            for (var i = 0; i < distance; i++) {
                ray.x += ray.xspeed;
                ray.y += ray.yspeed;
                if (Collision.grid[self.map][self.layer][Math.floor(ray.y/64)]) if (Collision.grid[self.map][self.layer][Math.floor(ray.y/64)][Math.floor(ray.x/64)] != null && Collision.grid[self.map][self.layer][Math.floor(ray.y/64)][Math.floor(ray.x/64)] < 15 && Collision.grid[self.map][self.layer][Math.floor(ray.y/64)][Math.floor(ray.x/64)] != 0) {
                    return true;
                }
            }
        } catch (err) {
            error(err);
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
    var pack6 = DroppedItem.update();
    var pack = {
        players: [],
        monsters: [],
        projectiles: [],
        particles: [],
        droppedItems: []
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
    pack.droppedItems = pack6;

    return pack;
};
Entity.getDebugData = function() {
    var pack1 = Player.getDebugData();
    var pack2 = Monster.getDebugData();
    var pack3 = Projectile.getDebugData();
    var pack4 = Npc.getDebugData();
    var pack5 = DroppedItem.getDebugData();
    var pack = {
        players: [],
        monsters: [],
        projectiles: [],
        droppedItems: []
    };
    for (var i in pack1) {
        pack.players.push(pack1[i]);
    }
    pack.monsters = pack2;
    pack.projectiles = pack3;
    for (var i in pack4) {
        pack.players.push(pack4[i]);
    }
    pack.droppedItems = pack5;

    return pack;
};

// rigs
Rig = function() {
    var self = new Entity();
    self.width = 32;
    self.height = 32;
    self.controls = {
        up: false,
        down: false,
        left: false,
        right: false,
        xaxis: 0,
        yaxis: 0,
        x: 0,
        y: 0,
        heal: false
    };
    self.xmove = 0;
    self.ymove = 0;
    self.xknockback = 0;
    self.yknockback = 0;
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
        heal: 0,
        speed: 1,
        range: 1,
        critChance: 0,
        critPower: 1,
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
    self.alive = true;
    self.invincible = false;
    self.canMove = true;
    self.teleporting = false;
    self.name = 'empty Rig';
    self.lastAttack = 0;
    self.region = {
        name: 'The Wilderness',
        noattack: false,
        nomonster: false
    };
    self.ai = {
        entityTarget: null,
        posTarget: {
            x: null,
            y: null
        },
        idleMove: 'none',
        idleRandom: {
            walking: false,
            waitTime: 4,
            lastPathEnd: 0
        },
        idleWaypoints: {
            walking: false,
            lastWaypoints: [],
            waypoints: [],
            pos: {
                x: null,
                y: null
            },
            waitTime: 20,
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
        if (self.stats.heal != 0) if (self.lastAutoHeal >= self.stats.heal && self.hp < self.maxHP && self.alive) {
            self.hp = Math.min(self.hp+1, self.maxHP);
            self.lastAutoHeal = 0;
        }
        if (self.controls.heal && self.hp < self.maxHP && self.lastHeal >= seconds(0.5) && self.mana >= 10) {
            var oldhp = self.hp;
            self.lastHeal = 0;
            self.hp = Math.min(self.hp+20, self.maxHP);
            self.mana -= 10;
            self.lastManaUse = 0;
            new Particle(self.map, self.x, self.y, self.layer, self.layer, 'heal', '+' + self.hp-oldhp);
        }
        self.lastManaRegen++;
        self.lastManaUse++;
        if (self.lastAutoManaRegen >= seconds(0.5) && self.lastManaUse < seconds(1.5) && self.alive) {
            self.mana = Math.min(self.mana+1, self.maxMana);
            self.lastManaRegen = 0;
        }
        if (self.lastManaUse >= seconds(1.5) && self.alive) {
            self.mana = Math.min(self.mana+1, self.maxMana);
            self.lastManaRegen = 0;
        }
        self.updateAnimation();
    };
    self.updatePos = function() {
        if (self.aiControlled) {
            self.ai.lastPath++;
            if (self.ai.lastPath >= seconds(0.1)) {
                self.ai.lastPath = 0;
                if (self.ai.entityTarget) self.ai.pathtoEntity();
                else if (self.ai.posTarget.x) self.ai.pathtoPos();
                else if (self.ai.idleMove != 'none') self.ai.pathIdle();
                else self.ai.path = [];
            }
            self.controls = {
                up: false,
                down: false,
                left: false,
                right: false,
                xaxis: 0,
                yaxis: 0,
                x: 0,
                y: 0,
                heal: false
            };
        } else {
            if (self.slowedDown) self.moveSpeed *= 0.5;
            self.controls.x = self.controls.xaxis;
            self.controls.y = self.controls.yaxis;
            if (self.controls.up) self.controls.y = Math.max(-1, Math.min(self.controls.y-1, 1));
            if (self.controls.down) self.controls.y = Math.max(-1, Math.min(self.controls.y+1, 1));
            if (self.controls.left) self.controls.x = Math.max(-1, Math.min(self.controls.x-1, 1));
            if (self.controls.right) self.controls.x = Math.max(-1, Math.min(self.controls.x+1, 1));
            self.xmove = self.controls.x*self.moveSpeed;
            self.ymove = self.controls.y*self.moveSpeed;
            if (self.slowedDown) self.moveSpeed *= 2;
        }
        self.xspeed = Math.round(self.xmove+self.xknockback);
        self.yspeed = Math.round(self.ymove+self.yknockback);
        self.collide();
        self.xknockback *= 0.25;
        self.yknockback *= 0.25;
        if (0-Math.abs(self.xknockback) > -0.5) self.xknockback = 0;
        if (0-Math.abs(self.yknockback) > -0.5) self.yknockback = 0;
        self.animationDirection = 'facing';
        if (self.controls.x || self.controls.y) {
            var dir = Math.round(radians(Math.atan2(self.controls.y, self.controls.x))/45);
            if (dir <= 0) dir = 8-Math.abs(dir);
            if (dir == 8) dir = 0;
            switch (dir) {
                case 0:
                    self.animationDirection = 'right';
                    break;
                case 1:
                    self.animationDirection = 'downright';
                    break;
                case 2:
                    self.animationDirection = 'down';
                    break;
                case 3:
                    self.animationDirection = 'downleft';
                    break;
                case 4:
                    self.animationDirection = 'left';
                    break;
                case 5:
                    self.animationDirection = 'upleft';
                    break;
                case 6:
                    self.animationDirection = 'up';
                    break;
                case 7:
                    self.animationDirection = 'upright';
                    break;
            }
        }
        if (self.animationDirection != 'facing') self.facingDirection = self.animationDirection;
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
        if (Teleporter.grid[self.map][self.gridy]) if (Teleporter.grid[self.map][self.gridy][self.gridx]) if (Teleporter.grid[self.map][self.gridy][self.gridx]) {
            if (self.yspeed != 00 || self.xspeed != 0) {
                var direction = Teleporter.grid[self.map][self.gridy][self.gridx].direction;
                if ((direction == 'up' && self.yspeed < 0) || (direction == 'down' && self.yspeed > 0) || (direction == 'left' && self.xspeed < 0) || (direction == 'right' && self.xspeed > 0)) {
                    self.teleport(Teleporter.grid[self.map][self.gridy][self.gridx].map, Teleporter.grid[self.map][self.gridy][self.gridx].x, Teleporter.grid[self.map][self.gridy][self.gridx].y, Teleporter.grid[self.map][self.gridy][self.gridx].layer);
                }
            }
        }
    };
    self.collide = function() {
        try {
            if (self.xspeed != 0 || self.yspeed != 0 || self.aiControlled) {
                self.lastx = self.x;
                self.lasty = self.y;
                self.x += self.xspeed;
                self.y += self.yspeed;
                self.gridx = Math.floor(self.x/64);
                self.gridy = Math.floor(self.y/64);
                if (!self.noCollision || self.aiControlled) {
                    var colliding = false;
                    if (Math.abs(self.xspeed) >= 192 && Math.abs(self.yspeed) >= 192) colliding = self.checkLargeSpannedCollision();
                    else colliding = self.checkSpannedCollision();
                    if (self.aiControlled) if (self.aiControl()) colliding = true;
                    if (colliding) {
                        self.x = self.lastx;
                        self.y = self.lasty;
                        var movexmove = 0;
                        var moveymove = 0;
                        var remainingxmove = self.xmove;
                        var remainingymove = self.ymove;
                        var remainingxknockback = Math.round(self.xknockback);
                        var remainingyknockback = Math.round(self.yknockback);
                        var max = Math.max(Math.abs(remainingxmove), Math.abs(remainingymove), Math.abs(remainingxknockback), Math.abs(remainingyknockback));
                        var xdirmove = remainingxmove/Math.ceil(max/self.width) || 0;
                        var ydirmove = remainingymove/Math.ceil(max/self.height) || 0;
                        var xdirknockback = remainingxknockback/Math.ceil(max/self.width) || 0;
                        var ydirknockback = remainingyknockback/Math.ceil(max/self.height) || 0;
                        while (!(-1 < remainingxmove && remainingxmove < 1) || !(-1 < remainingymove && remainingymove < 1) || !(-1 < remainingxknockback && remainingxknockback < 1) || !(-1 < remainingyknockback && remainingyknockback < 1)) {
                            self.lastx = self.x;
                            self.lasty = self.y;
                            var lastmovexmove = movexmove;
                            var lastmoveymove = moveymove;
                            var lastremainingxmove = remainingxmove;
                            var lastremainingymove = remainingymove;
                            var lastremainingxknockback = remainingxknockback;
                            var lastremainingyknockback = remainingyknockback;
                            self.x += xdirmove;
                            self.y += ydirmove;
                            self.x += xdirknockback;
                            self.y += ydirknockback;
                            movexmove += Math.abs(xdirmove);
                            moveymove += Math.abs(ydirmove);
                            remainingxmove -= xdirmove;
                            remainingymove -= ydirmove;
                            remainingxknockback -= xdirknockback;
                            remainingyknockback -= ydirknockback;
                            self.gridx = Math.floor(self.x/64);
                            self.gridy = Math.floor(self.y/64);
                            var colliding = false;
                            var changedDir = false;
                            if (self.width >= 128 && self.height >= 128) colliding = self.checkLargeSpannedCollision();
                            else colliding = self.checkSpannedCollision();
                            if (self.aiControlled) if (self.aiControl()) changedDir = true;
                            if (colliding || changedDir) {
                                self.x = self.lastx;
                                self.y = self.lasty;
                                movexmove = lastmovexmove;
                                moveymove = lastmoveymove;
                                remainingxmove = lastremainingxmove;
                                remainingymove = lastremainingymove;
                                remainingxknockback = lastremainingxknockback;
                                remainingyknockback = lastremainingyknockback;
                                if (changedDir) {
                                    self.aiControl();
                                    remainingxmove = self.xmove-(movexmove*Math.abs(self.xmove)/self.xmove) || 0;
                                    remainingymove = self.ymove-(moveymove*Math.abs(self.ymove)/self.ymove) || 0;
                                    var max = Math.max(Math.abs(remainingxmove), Math.abs(remainingymove), Math.abs(remainingxknockback), Math.abs(remainingyknockback));
                                    xdirmove = remainingxmove/Math.ceil(max/self.width) || 0;
                                    ydirmove = remainingymove/Math.ceil(max/self.height) || 0;
                                    xdirknockback = remainingxknockback/Math.ceil(max/self.width) || 0;
                                    ydirknockback = remainingyknockback/Math.ceil(max/self.height) || 0;
                                }
                                var movexmove2 = 0;
                                var moveymove2 = 0;
                                var remainingxmove2 = xdirmove;
                                var remainingymove2 = ydirmove;
                                var remainingxknockback2 = xdirknockback;
                                var remainingyknockback2 = ydirknockback;
                                var max2 = Math.max(Math.abs(remainingxmove2), Math.abs(remainingymove2), Math.abs(remainingxknockback2), Math.abs(remainingyknockback2));
                                var xdirmove2 = 0;
                                var ydirmove2 = 0;
                                var xdirknockback2 = 0;
                                var ydirknockback2 = 0;
                                var xdirmove2 = remainingxmove2/Math.ceil(Math.abs(max2)) || 0;
                                var ydirmove2 = remainingymove2/Math.ceil(Math.abs(max2)) || 0;
                                var xdirknockback2 = remainingxknockback2/Math.ceil(Math.abs(max2)) || 0;
                                var ydirknockback2 = remainingyknockback2/Math.ceil(Math.abs(max2)) || 0;
                                while (!(-1 < remainingxmove2 && remainingxmove2 < 1) || !(-1 < remainingymove2 && remainingymove2 < 1) || !(-1 < remainingxknockback2 && remainingxknockback2 < 1) || !(-1 < remainingyknockback2 && remainingyknockback2 < 1)) {
                                    if (self.aiControlled) if (self.aiControl()) {
                                        remainingxmove = self.xmove-(movexmove*Math.abs(self.xmove)/self.xmove) || 0;
                                        remainingymove = self.ymove-(moveymove*Math.abs(self.ymove)/self.ymove) || 0;
                                        var max = Math.max(Math.abs(remainingxmove), Math.abs(remainingymove), Math.abs(remainingxknockback), Math.abs(remainingyknockback));
                                        xdirmove = remainingxmove/Math.ceil(max/self.width) || 0;
                                        ydirmove = remainingymove/Math.ceil(max/self.height) || 0;
                                        xdirknockback = remainingxknockback/Math.ceil(max/self.width) || 0;
                                        ydirknockback = remainingyknockback/Math.ceil(max/self.height) || 0;
                                        remainingxmove2 = xdirmove-(movexmove2*Math.abs(self.xmove)/self.xmove) || 0;
                                        remainingymove2 = ydirmove-(moveymove2*Math.abs(self.ymove)/self.ymove) || 0;
                                        var max2 = Math.max(Math.abs(remainingxmove2), Math.abs(remainingymove2), Math.abs(remainingxknockback2), Math.abs(remainingyknockback2));
                                        xdirmove2 = remainingxmove2/Math.ceil(Math.abs(max2)) || 0;
                                        ydirmove2 = remainingymove2/Math.ceil(Math.abs(max2)) || 0;
                                        xdirknockback2 = remainingxknockback2/Math.ceil(Math.abs(max2)) || 0;
                                        ydirknockback2 = remainingyknockback2/Math.ceil(Math.abs(max2)) || 0;
                                    }
                                    self.lastx = self.x;
                                    self.lasty = self.y;
                                    self.x += xdirmove2;
                                    self.y += ydirmove2;
                                    self.x += xdirknockback2;
                                    self.y += ydirknockback2;
                                    movexmove += Math.abs(xdirmove2);
                                    moveymove += Math.abs(ydirmove2);
                                    remainingxmove -= xdirmove2;
                                    remainingymove -= ydirmove2;
                                    remainingxknockback -= xdirknockback2;
                                    remainingyknockback -= ydirknockback2;
                                    movexmove2 += Math.abs(xdirmove2);
                                    moveymove2 += Math.abs(ydirmove2);
                                    remainingxmove2 -= xdirmove2;
                                    remainingymove2 -= ydirmove2;
                                    remainingxknockback2 -= xdirknockback2;
                                    remainingyknockback2 -= ydirknockback2;
                                    self.gridx = Math.floor(self.x/64);
                                    self.gridy = Math.floor(self.y/64);
                                    if (self.doPointCollision()) break;
                                    self.checkLayer();
                                    self.checkSlowdown();
                                }
                                if (self.checkPointCollision()) break;
                            }
                        }
                    }
                }
                if (Collision.grid[self.map]) {
                    if (self.x-self.width/2 < Collision.grid[self.map].offsetX*64) self.x = Collision.grid[self.map].offsetX*64+self.width/2;
                    if (self.x+self.width/2 > Collision.grid[self.map].offsetX*64+Collision.grid[self.map].width*64) self.x = Collision.grid[self.map].offsetX*64+Collision.grid[self.map].width*64-self.width/2;
                    if (self.y-self.height/2 < Collision.grid[self.map].offsetY*64) self.y = Collision.grid[self.map].offsetY*64+self.height/2;
                    if (self.y+self.height/2 > Collision.grid[self.map].offsetY*64+Collision.grid[self.map].height*64) self.y = Collision.grid[self.map].offsetY*64+Collision.grid[self.map].height*64-self.height/2;
                }
                self.x = Math.round(self.x);
                self.y = Math.round(self.y);
                self.gridx = Math.floor(self.x/64);
                self.gridy = Math.floor(self.y/64);
                self.chunkx = Math.floor(self.gridx/Collision.grid[self.map].chunkWidth);
                self.chunky = Math.floor(self.gridy/Collision.grid[self.map].chunkHeight);
            }
        } catch (err) {
            error(err);
        }
    };
    self.aiControl = function() {
        var oldcontrols = self.controls;
        self.controls = {
            up: false,
            down: false,
            left: false,
            right: false,
            xaxis: 0,
            yaxis: 0,
            x: 0,
            y: 0,
            heal: false
        };
        self.xmove = 0;
        self.ymove = 0;
        if (self.ai.path[0]) {
            // var angle = Math.atan2(self.ai.path[0][1]*64+32-self.y, self.ai.path[0][0]*64+32-self.x);
            // self.controls.xaxis = Math.cos(angle);
            // self.controls.yaxis = Math.sin(angle);
            if (self.ai.path[0][0]*64+32 < self.x) self.controls.left = true;
            else if (self.ai.path[0][0]*64+32 > self.x) self.controls.right = true;
            if (self.ai.path[0][1]*64+32 < self.y) self.controls.up = true;
            else if (self.ai.path[0][1]*64+32 > self.y) self.controls.down = true;
            if (Math.round(self.x) == self.ai.path[0][0]*64+32 && Math.round(self.y) == self.ai.path[0][1]*64+32) {
                self.ai.path.shift();
            }
            if (self.slowedDown) self.moveSpeed *= 0.5;
            self.controls.x = self.controls.xaxis;
            self.controls.y = self.controls.yaxis;
            if (self.controls.up) self.controls.y = Math.max(-1, Math.min(self.controls.y-1, 1));
            if (self.controls.down) self.controls.y = Math.max(-1, Math.min(self.controls.y+1, 1));
            if (self.controls.left) self.controls.x = Math.max(-1, Math.min(self.controls.x-1, 1));
            if (self.controls.right) self.controls.x = Math.max(-1, Math.min(self.controls.x+1, 1));
            self.xmove = self.controls.x*self.moveSpeed;
            self.ymove = self.controls.y*self.moveSpeed;
            if (self.slowedDown) self.moveSpeed *= 2;
            self.xspeed = Math.round(self.xmove+self.xknockback);
            self.yspeed = Math.round(self.ymove+self.yknockback);
        }
        for (var i in self.controls) {
            if (self.controls[i] != oldcontrols[i]) return true;
        }
        return false;
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
                var x = self.x;
                var y = self.y;
                if (self.ai.entityTarget.layer != self.layer) {
                    // var openList = [];
                    // var closedList = [];
                    // for (var py in Layer.grid[self.map][self.layer]) {
                    //     for (var px in Layer.grid[self.map][self.layer][py]) {
                    //         if (Layer.grid[self.map][self.layer][py][px]) openList.push({
                    //             x: px,
                    //             y: py,
                    //             layer: self.layer,
                    //             f: 0,
                    //             g: 0,
                    //             h: 0,
                    //             parent: null,
                    //             visited: false,
                    //             closed: false
                    //         });
                    //     }
                    // }
                    // while (openList.length > 0) {
                    //     var lowest = 0;
                    //     for (var i in openList) {
                    //         if (openList[i].f < openList[lowest].f) lowest = i;
                    //     }
                    //     var currentNode = openList[lowest];

                    //     // return if found
                    //     if (currentNode.layer == self.ai.entityTarget.layer) {
                    //         self.ai.posTarget = {
                    //             x: entityTarget.x,
                    //             y: entityTarget.y
                    //         };
                    //         self.x = currentNode.x;
                    //         self.y = currentNode.y;
                    //         var path = self.ai.pathtoPos();
                    //         if (path[0]) {
                    //             var retpath = path.reverse();
                    //             var parent = closedList[currentNode.parent];
                    //             var current = currentNode;
                    //             while (parent) {
                    //                 self.ai.posTarget = {
                    //                     x: current.x,
                    //                     y: current.y
                    //                 };
                    //                 self.x = parent.x;
                    //                 self.y = parent.y;
                    //                 path = self.ai.pathtoPos();
                    //                 retpath = retpath.concat(path);
                    //                 current = parent;
                    //                 parent = closedList[current.parent];
                    //             }
                    //             retpath.reverse();
                    //             console.log(retpath);
                    //             return retpath;
                    //         }
                    //     }
            
                    //     // var removeIndex = openList.indexOf(currentNode);
                    //     // openList.splice(removeIndex, 1);
                    //     // currentNode.closed = true;
                    //     // closedList.push(currentNode);
                        
                    //     // var neighbors = findNeighbors(currentNode.x, currentNode.y);
                    //     // for (var i in neighbors) {
                    //     //     var neighbor = neighbors[i];
                            
                    //     //     if (neighbor.closed || !neighbor.walkable) {
                    //     //         continue;
                    //     //     }
        
                    //     //     var nodeAccessable = false;
                    //     //     for (var i in self.collisionList) {
                    //     //         var tempnode = self.collisionList[i];
                    //     //         if (tempnode.x >= neighbor.x - 2 && tempnode.x <= neighbor.x + 2 && tempnode.y <= neighbor.y + 4 && tempnode.y > neighbor.y) {
                    //     //             nodeAccessable = true;
                    //     //         }
                    //     //     }
                    //     //     if (currentNode.y <= neighbor.y) {
                    //     //         nodeAccessable = true;
                    //     //     }
                            
                    //     //     if (!nodeAccessable) {
                    //     //         continue;
                    //     //     }
            
                    //     //     var gScore = currentNode.g+1;
                    //     //     var bestG = false;
                    //     //     if (!neighbor.visited) {
                    //     //         bestG = true;
                    //     //         neighbor.visited = true;
                    //     //         self.visitedList.push(neighbor);
                    //     //         self.openList.push(neighbor);
                    //     //     } else if (gScore < neighbor.g) {
                    //     //         bestG = true;
                    //     //     }
                    //     //     if (bestG) {
                    //     //         neighbor.e = 0;
                    //     //         var closest = {
                    //     //             side1: false,
                    //     //             side2: false,
                    //     //             above: false,
                    //     //             below: false,
                    //     //         };
                    //     //         for (var i in self.collisionList) {
                    //     //             var tempnode = self.collisionList[i];
                    //     //             if (tempnode.x >= neighbor.x - 2 && tempnode.x <= neighbor.x + 2) closest.side2 = true;
                    //     //             if (tempnode.x >= neighbor.x - 1 && tempnode.x <= neighbor.x + 1) closest.side1 = true;
                    //     //             if (tempnode.y == neighbor.y - 1) closest.above = true;
                    //     //             if (tempnode.y == neighbor.y + 1) closest.below = true;
                    //     //         }
                    //     //         if (closest.side2) neighbor.e -= 1;
                    //     //         if (closest.side1) neighbor.e -= 1;
                    //     //         if (closest.above) neighbor.e += 4;
                    //     //         if (closest.below) neighbor.e -= 2;
                    //     //         neighbor.parent = self.closedList.indexOf(currentNode);
                    //     //         neighbor.g = gScore;
                    //     //         neighbor.h = self.heuristic(neighbor.x, neighbor.y, x2, y2);
                    //     //         neighbor.f = neighbor.g + neighbor.h + neighbor.e;
                    //     //     }
                    //     // }
                    // }
                } else {
                    self.ai.posTarget = {
                        x: self.ai.entityTarget.gridx,
                        y: self.ai.entityTarget.gridy
                    };
                    self.ai.pathtoPos();
                }
            } catch (err) {
                error(err);
            }
        }
        return self.ai.path;
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
                            if (Collision.grid[self.map][self.layer]) if (Collision.grid[self.map][self.layer][checky]) if (Collision.grid[self.map][self.layer][checky][checkx]) {
                                self.ai.grid.setWalkableAt(x, y, false);
                            }
                        }
                    }
                    var path = self.ai.pathfinder.findPath(x1, y1, x2, y2, self.ai.grid);
                    path.shift();
                    self.ai.path = PF.Util.compressPath(path);
                    for (var i in self.ai.path) {
                        self.ai.path[i][0] += offsetx;
                        self.ai.path[i][1] += offsety;
                    }
                }
            } catch (err) {
                error(err);
            }
        }
        return self.ai.path;
    };
    self.ai.pathIdle = function() {
        // self.ai.path = [];
        if (self.ai.idleMove == 'waypoints') {
            try {
                if (self.ai.idleWaypoints.lastPathEnd >= seconds(self.ai.idleWaypoints.waitTime)*Math.random()) {
                    self.ai.idleWaypoints.lastPathEnd = 0;
                    var waypoints = Array.from(self.ai.idleWaypoints.waypoints);
                    var lastWaypoints = self.ai.idleWaypoints.lastWaypoints;
                    if (waypoints) {
                        for (var i in waypoints) {
                            var waypoint = waypoints[i];
                            if (waypoint.map != self.map) delete waypoints[i];
                            if (waypoint.x == self.gridx && waypoint.y == self.gridy && waypoint.map == self.map) {
                                var alreadyExists = false;
                                for (var j in lastWaypoints) {
                                    if (waypoint.x == lastWaypoints[j].x && waypoint.y == lastWaypoints[j].y && waypoint.map == lastWaypoints[j].map) alreadyExists = true;
                                }
                                if (!alreadyExists) self.ai.idleWaypoints.lastWaypoints.unshift(waypoint);
                            }
                        }
                        var waypointCount = 0;
                        for (var i in waypoints) {
                            if (waypoints[i].map == self.map) waypointCount++;
                        }
                        if (lastWaypoints.length > Math.min(4, waypointCount-1)) lastWaypoints.pop();
                        for (var i in waypoints) {
                            var waypoint = waypoints[i];
                            for (var j in lastWaypoints) {
                                if (waypoint.x == lastWaypoints[j].x && waypoint.y == lastWaypoints[j].y && waypoint.map == lastWaypoints[j].map) delete waypoints[i];
                            }
                        }
                        var lowest;
                        for (var i in waypoints) {
                            if (lowest == null) lowest = i;
                            if (lowest) if (self.getGridDistance(waypoints[i]) < self.getGridDistance(waypoints[lowest])) {
                                lowest = i;
                            }
                        }
                        if (lowest) {
                            self.ai.posTarget.x = waypoints[lowest].x;
                            self.ai.posTarget.y = waypoints[lowest].y;
                            self.ai.idleWaypoints.pos = waypoints[lowest];
                            self.ai.idleWaypoints.lastWaypoints.unshift(self.ai.idleWaypoints.pos);
                            self.ai.pathtoPos();
                            self.ai.idleWaypoints.walking = true;
                            self.ai.posTarget = {
                                x: null,
                                y: null
                            };
                        }
                    }
                }
                if (self.x == self.ai.idleWaypoints.pos.x*64+32 && self.y == self.ai.idleWaypoints.pos.y*64+32) self.ai.idleWaypoints.walking = false;
                if (!self.ai.idleWaypoints.walking) {
                    self.ai.idleWaypoints.lastPathEnd += seconds(0.1);
                    self.ai.path = [];
                }
            } catch (err) {
                error(err);
            }
        } else if (self.ai.idleMove == 'random') {
            try {
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
                            if (Collision.grid[self.map][self.layer][pos.y]) if (Collision.grid[self.map][self.layer][pos.y][pos.x]) {}
                            else break;
                            if (attempts >= 10) break;
                        }
                        self.ai.posTarget.x = pos.x;
                        self.ai.posTarget.y = pos.y;
                        self.ai.idleWaypoints.pos = self.ai.posTarget;
                        self.ai.pathtoPos();
                        self.ai.idleWaypoints.walking = true;
                        self.ai.posTarget = {
                            x: null,
                            y: null
                        };
                        if (self.ai.path != []) break;
                        if (pathAttempts >= 10) break;
                    }
                    if (self.ai.path[0]) {
                        self.ai.idleRandom.walking = true;
                    }
                }
                if (self.gridx == self.ai.idleWaypoints.pos.x && self.gridy == self.ai.idleWaypoints.pos.y) self.ai.idleRandom.walking = false;
                if (!self.ai.idleRandom.walking) {
                    self.ai.idleRandom.lastPathEnd += seconds(0.1);
                    self.ai.path = [];
                }
            } catch (err) {
                error(err);
            }
        }
        return self.ai.path;
    };
    self.onHit = function(entity, type) {
        var oldhp = self.hp;
        var critHp = 0;
        var parent;
        if (entity.parentIsPlayer) parent = Player.list[entity.parentID];
        else parent = Monster.list[entity.parentID];
        if (parent) {
            if (Math.random() < parent.stats.critChance) critHp = entity.damage*parent.stats.critPower;
        }
        if (self.invincible == false) {
            switch (type) {
                case 'projectile':
                    self.hp -= Math.max(Math.round(((entity.damage+critHp)*(1-self.stats.defense))-self.stats.damageReduction), 0);
                    var rand = 0.5+Math.random();
                    self.xknockback += entity.xspeed*entity.knockback*rand;
                    self.yknockback += entity.yspeed*entity.knockback*rand;
                    if (self.hp < 0) {
                        if (entity.parentIsPlayer) self.onDeath(Player.list[entity.parentID], 'killed');
                        else self.onDeath(Monster.list[entity.parentID], 'killed');
                    }
                    break;
                case 'cherrybomb':
                    self.hp -= Math.max(Math.round((500*(1-self.stats.defense))-self.stats.damageReduction), 0);
                    var rand = 0.5+Math.random();
                    var angle = Math.atan2(self.y-entity.y, self.x-entity.x);
                    self.xknockback += angle*rand*20;
                    self.yknockback += angle*rand*20;
                    if (self.hp < 0) self.onDeath(entity, 'explosion');
                    break;
                default:
                    error('Invalid Entity type: ' + type);
                    break;
            }
        }
        if (critHp) new Particle(self.map, self.x, self.y, self.layer, 'critdamage', self.hp-oldhp);
        else new Particle(self.map, self.x, self.y, self.layer, 'damage', self.hp-oldhp);
    };
    self.onDeath = function(entity, type) {
        if (!self.invincible) {
            var oldhp = self.hp;
            self.hp = 0;
            self.alive = false;
            if (self.hp != oldhp) {
                new Particle(self.map, self.x, self.y, self.layer, 'damage', self.hp-oldhp);
            }
            for (var i = 0; i < 20; i++) {
                new Particle(self.map, self.x, self.y, self.layer, 'death');
            }
            switch (type) {
                case 'killed':
                    insertChat(self.name + ' was killed by ' + entity.name + '.', 'death');
                    break;
                case 'explosion':
                    insertChat(self.name + ' blew up.', 'death');
                    break;
                case 'cherrybomb':
                    var rand = 0.5+Math.random();
                    var angle = Math.atan2(self.y-entity.y, self.x-entity.x);
                    self.xknockback += angle*rand*40;
                    self.yknockback += angle*rand*40;
                    insertChat(self.name + ' blew up.', 'death');
                    break;
                case 'debug':
                    insertChat(self.name + ' was debugged.', 'death');
                    break;
                default:
                    insertChat(self.name + ' died.', 'death');
                    break;
            }
        }
    };
    self.onRegionChange = function() {};
    self.teleport = function(map, x, y, layer) {
        if (!self.teleporting) {
            self.teleporting = true;
            for (var i = 0; i < 20; i++) {
                new Particle(self.map, self.x, self.y, self.layer, 'teleport');
            }
            self.map = map;
            self.x = x*64+32;
            self.y = y*64+32;
            self.layer = layer;
            self.ai.path = [];
            self.ai.entityTarget = null;
            self.ai.posTarget = {
                x: null,
                y: null
            };
            self.ai.idleRandom.walking = false;
            self.ai.idleWaypoints.walking = false;
            self.ai.idleWaypoints.lastWaypoints = [];
            for (var i = 0; i < 20; i++) {
                new Particle(self.map, self.x, self.y, self.layer, 'teleport');
            }
            self.teleporting = false;
        }
    };

    return self;
};

// npcs
Npc = function(id, x, y, map) {
    var self = new Rig();
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
    self.gridx = Math.floor(self.x/64);
    self.gridy = Math.floor(self.y/64);
    self.chunkx = Math.floor(self.gridx/Collision.grid[self.map].chunkWidth);
    self.chunky = Math.floor(self.gridy/Collision.grid[self.map].chunkHeight);
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
    self.rightClickEvent = new Function('return ' + tempnpc.rightClickEvent)();
    for (var i in tempnpc.data) {
        self[i] = tempnpc.data[i];
    }
    delete tempnpc;
    self.aiControlled = true;
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
            layer: localnpc.layer,
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
            name: localnpc.name,
            collisionBoxSize: localnpc.collisionBoxSize,
            path: localnpc.ai.path,
            idleWaypoints: localnpc.ai.idleWaypoints,
            controls: localnpc.controls,
        });
    }

    return pack;
};
Npc.rawJson = require('./npc.json');
Npc.list = [];

// players
Player = function(socket) {
    var self = new Rig();
    self.socket = socket;
    self.ip = socket.handshake.headers['x-forwarded-for'];
    self.map = ENV.spawnpoint.map;
    self.x = ENV.spawnpoint.x;
    self.y = ENV.spawnpoint.y;
    self.gridx = Math.floor(self.x/64);
    self.gridy = Math.floor(self.y/64);
    self.chunkx = Math.floor(self.gridx/Collision.grid[self.map].chunkWidth);
    self.chunky = Math.floor(self.gridy/Collision.grid[self.map].chunkHeight);
    self.animationSpeed = 100;
    self.animationDirection = 'facing';
    self.facingDirection = 'down';
    self.attacking = false;
    self.lastHeal = 0;
    self.stats.heal = 8;
    self.mouseX = 0;
    self.mouseY = 0;
    self.name = null;
    self.aiControlled = false;
    self.inventory = new Inventory(socket, self);
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
        y: 0,
        layer: 0
    };
    self.invincible = true;
    self.canMove = false;
    self.talking = false;
    self.alive = false;
    self.debugEnabled = false;
    self.creds = {
        username: null,
        password: null
    };
    self.signUpAttempts = 0;
    setInterval(function() {
        self.signUpAttempts = Math.max(self.signUpAttempts-1, 0);
        if (self.signUpAttempts >= 1) {
            insertChat(self.name + ' was kicked for sign up spam', 'anticheat');
            socket.emit('disconnected');
            socket.onevent = function(packet) {};
            socket.disconnect();
        }
    }, 3000);
    self.signedIn = false;
    self.collisionBoxSize = Math.max(self.width, self.height);
    self.renderDistance = 1;

    var maps = [];
    for (var i in Collision.grid) {
        maps.push(i);
    }
    socket.on('signIn', async function(cred) {
        if (cred) if (typeof cred.username == 'string' && typeof cred.password == 'string') {
            if (ENV.isBetaServer && (cred.state == 'deleteAccount' || cred.state == 'signUp')) {
                socket.emit('signInState', 'disabled');
                return;
            }
            var valid = ACCOUNTS.validateCredentials(cred.username, cred.password);
            switch (valid) {
                case 0:
                    if (Filter.check(cred.username)) {
                        socket.emit('disconnected');
                        socket.onevent = function(packet) {};
                        socket.disconnect();
                        return;
                    }
                    switch (cred.state) {
                        case 'signIn':
                            if (!self.signedIn) {
                                var status = await ACCOUNTS.login(cred.username, cred.password);
                                switch (status) {
                                    case 0:
                                        var signedIn = false;
                                        for (var i in Player.list) {
                                            if (Player.list[i].creds.username == cred.username) {
                                                signedIn = true;
                                            }
                                        }
                                        if (!signedIn) {
                                            self.creds.username = cred.username;
                                            self.creds.password = cred.password;
                                            socket.emit('mapData', {maps: maps, self: self.map});
                                            self.signedIn = true;
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
                            }
                            break;
                        case 'loaded':
                            if (cred.username == self.creds.username && cred.password == self.creds.password) {
                                self.name = self.creds.username;
                                await self.loadData();
                                socket.emit('signInState', 'signedIn');
                                insertChat(self.name + ' joined the game', 'server');
                                self.invincible = false;
                                self.canMove = true;
                                self.alive = true;
                            } else {
                                socket.emit('signInState', 'invalidSignIn');
                            }
                            break;
                        case 'signUp':
                            self.signUpAttempts++;
                            var highest = 0;
                            for (var i in Player.list) {
                                if (Player.list[i].ip == self.ip) highest = Math.max(highest, Player.list[i].signUpAttempts);
                            }
                            for (var i in Player.list) {
                                if (Player.list[i].ip == self.ip) Player.list[i].signUpAttempts = highest;
                            }
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
                                case 3:
                                    socket.emit('signInState', 'unavailable');
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
                            if (cred.oldPassword) {
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
                            } else {
                                insertChat(self.name + ' was kicked for socket.emit', 'anticheat');
                                socket.emit('disconnected');
                                socket.onevent = function(packet) {};
                                socket.disconnect();
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
        } else {
            insertChat(self.name + ' was kicked for socket.emit', 'anticheat');
            socket.emit('disconnected');
            socket.onevent = function(packet) {};
            socket.disconnect();
        }
    });
    socket.on('keyPress', async function(data) {
        if (typeof data == 'object') {
            if (self.alive) {
                self.controls[data.key] = data.state;
            }
        } else {
            insertChat(self.name + ' was kicked for socket.emit', 'anticheat');
            socket.emit('disconnected');
            socket.onevent = function(packet) {};
            socket.disconnect();
        }
    });
    socket.on('click', async function(data) {
        if (typeof data == 'object') {
            if (self.alive) {
                if (data.button == 'left') {
                    self.attacking = data.state;
                    self.mouseX = data.x;
                    self.mouseY = data.y; 
                } else if (data.button == 'right') {
                    if (data.state) {
                        for (var i in DroppedItem.list) {
                            var localdroppeditem = DroppedItem.list[i];
                            if (self.getDistance(localdroppeditem) < 512) {
                                if (localdroppeditem.playerId == self.id || localdroppeditem.playerId == null) {
                                    var x = self.x+data.x;
                                    var y = self.y+data.y;
                                    var left = localdroppeditem.x-localdroppeditem.width/2;
                                    var right = localdroppeditem.x+localdroppeditem.width/2;
                                    var top = localdroppeditem.y-localdroppeditem.height/2;
                                    var bottom = localdroppeditem.y+localdroppeditem.height/2;
                                    if (x >= left && x <= right && y >= top && y <= bottom) {
                                        if (!self.inventory.full()) {
                                            var slot = self.inventory.addItem(localdroppeditem.itemId);
                                            for (var j in localdroppeditem.enchants) {
                                                self.inventory.enchantItem(slot, localdroppeditem.enchants[j]);
                                            }
                                            delete DroppedItem.list[i];
                                        }
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            insertChat(self.name + ' was kicked for socket.emit', 'anticheat');
            socket.emit('disconnected');
            socket.onevent = function(packet) {};
            socket.disconnect();
        }
    });
    socket.on('mouseMove', async function(data) {
        if (typeof data == 'object') {
            self.mouseX = data.x;
            self.mouseY = data.y;
        } else {
            insertChat(self.name + ' was kicked for socket.emit', 'anticheat');
            socket.emit('disconnected');
            socket.onevent = function(packet) {};
            socket.disconnect();
        }
    });
    socket.on('respawn', function() {
        if (self.alive) {
            self.onDeath();
            insertChat(self.name + ' respawn cheated.', 'anticheat');
        } else self.respawn();
    });
    socket.on('renderDistance', function(chunks) {
        self.renderDistance = chunks;
    });
    socket.on('teleport', function() {
        if (self.teleporting) {
            for (var i = 0; i < 20; i++) {
                new Particle(self.map, self.x, self.y, self.layer, 'teleport');
            }
            self.map = self.teleportLocation.map;
            self.x = self.teleportLocation.x;
            self.y = self.teleportLocation.y;
            self.layer = self.teleportLocation.layer;
            for (var i = 0; i < 20; i++) {
                new Particle(self.map, self.x, self.y, self.layer, 'teleport');
            }
            socket.emit('teleport2', {map: self.map, x: self.x, y: self.y});
            self.teleporting = false;
        }
    });
    socket.on('toggleDebug', function() {
        self.debugEnabled = !self.debugEnabled;
    });
    var charCount = 0;
    var msgCount = 0;
    socket.on('chat', function(msg) {
        if (self.signedIn) {
            if (typeof msg == 'string') {
                try {
                    if (msg.indexOf('/') == 0) {
                        var cmd = '';
                        var arg = msg.replace('/', '');
                        while (true) {
                            cmd += arg[0];
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
                            if (args[i]) args[i] += arg[0];
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
                            case 'help':
                                insertSingleChat('COMMAND HELP:\n/help -Returns all commands available\n/msg <username> <message> -Private message a player\n/waypoint <location> -Teleport to a waypoint\n', 'deepskyblue', self.name, false);
                                break;
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
                                    insertSingleChat(self.name + '->' + args[0] + ': ' + Filter.clean(args[1]), '', args[0], true);
                                    insertSingleChat(self.name + '->' + args[0] + ': ' + Filter.clean(args[1]), '', self.name, false);
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
                        if (valid) {
                            if (Filter.check(msg)) insertSingleChat('Hey! Don\'t do that!', 'error', self.name, false);
                            else insertChat(self.name + ': ' + msg, '');
                            charCount += msg.length;
                            msgCount++;
                        }
                    }
                } catch (err) {
                    error(err);
                }
            } else {
                insertChat(self.name + ' was kicked for socket.emit', 'anticheat');
                socket.emit('disconnected');
                socket.onevent = function(packet) {};
                socket.disconnect();
            }
        }
    });
    var spamcheck = setInterval(function() {
        charCount = Math.max(charCount-128, 0);
        msgCount = Math.max(msgCount-2, 0);
        if (charCount > 0 || msgCount > 0) {
            if (self.name) {
                insertChat(self.name + ' was kicked for spamming', 'anticheat');
            }
            socket.emit('disconnected');
            socket.onevent = function(packet) {};
            socket.disconnect();
            clearInterval(spamcheck);
        }
    }, 1000);

    self.update = function() {
        if (self.canMove) self.updatePos();
        self.lastAttack++;
        if (self.attacking && !self.region.noattack && self.lastAttack > self.attack.useTime && self.attack.projectile != null && self.mana >= self.attack.manaCost && self.alive) {
            self.lastAttack = 0;
            var angle = Math.atan2(self.mouseY, self.mouseX);
            switch (self.attack.projectilePattern) {
                case 'single':
                    new Projectile(self.attack.projectile, angle, self.id);
                    break;
                case 'triple':
                    new Projectile(self.attack.projectile, angle-degrees(20), self.id);
                    new Projectile(self.attack.projectile, angle, self.id);
                    new Projectile(self.attack.projectile, angle+degrees(20), self.id);
                    break;
                case 'spray':
                    for (var i = 0; i < 5; i++) {
                        new Projectile(self.attack.projectile, angle+Math.random()*0.2-0.1, self.id);
                    }
                    break;
                case 'line':
                    new Projectile(self.attack.projectile, angle, self.id);
                    new Projectile(self.attack.projectile, angle-degrees(180), self.id);
                    break;
                case 'triangle':
                    new Projectile(self.attack.projectile, angle-degrees(120), self.id);
                    new Projectile(self.attack.projectile, angle, self.id);
                    new Projectile(self.attack.projectile, angle+degrees(120), self.id);
                    break;
                case 'ring':
                    new Projectile(self.attack.projectile, angle, self.id);
                    new Projectile(self.attack.projectile, angle-degrees(36), self.id);
                    new Projectile(self.attack.projectile, angle-degrees(72), self.id);
                    new Projectile(self.attack.projectile, angle-degrees(108), self.id);
                    new Projectile(self.attack.projectile, angle-degrees(144), self.id);
                    new Projectile(self.attack.projectile, angle-degrees(180), self.id);
                    new Projectile(self.attack.projectile, angle-degrees(216), self.id);
                    new Projectile(self.attack.projectile, angle-degrees(252), self.id);
                    new Projectile(self.attack.projectile, angle-degrees(288), self.id);
                    new Projectile(self.attack.projectile, angle-degrees(324), self.id);
                    break;
                default:
                    error('Invalid projectilePattern ' + self.attack.projectilePattern);
                    break;
            }
            self.mana -= self.attack.manaCost;
            if (self.attack.manaCost != 0) self.lastManaUse = 0;
        }
        self.lastAutoHeal++;
        self.lastHeal++;
        if (self.stats.heal != 0) if (self.lastAutoHeal >= self.stats.heal && self.hp < self.maxHP && self.alive) {
            self.hp = Math.min(self.hp+1, self.maxHP);
            self.lastAutoHeal = 0;
        }
        if (self.controls.heal && self.alive && self.hp < self.maxHP && self.lastHeal >= seconds(1) && self.mana >= 20) {
            var oldhp = self.hp;
            self.lastHeal = 0;
            self.hp = Math.min(self.hp+20, self.maxHP);
            self.mana -= 20;
            self.lastManaUse = 0;
            new Particle(self.map, self.x, self.y, self.layer, 'heal', '+' + self.hp-oldhp);
        }
        self.lastManaRegen++;
        self.lastManaUse++;
        if (self.lastAutoManaRegen >= seconds(0.5) && self.lastManaUse < seconds(1.5) && self.alive) {
            self.mana = Math.min(self.mana+1, self.maxMana);
            self.lastManaRegen = 0;
        }
        if (self.lastManaUse >= seconds(1.5) && self.alive) {
            self.mana = Math.min(self.mana+1, self.maxMana);
            self.lastManaRegen = 0;
        }
        var mouseangle = Math.atan2(self.mouseY, self.mouseX);
        self.heldItem.angle = mouseangle;
        self.updateAnimation();
        var mouseddir = Math.round(radians(mouseangle)/45);
        if (mouseddir <= 0) mouseddir = 8-Math.abs(mouseddir);
        if (mouseddir == 8) mouseddir = 0;
        var dir = 'up';
        switch (mouseddir) {
            case 0:
                dir = 'right';
                break;
            case 1:
                dir = 'downright';
                break;
            case 2:
                dir = 'down';
                break;
            case 3:
                dir = 'downleft';
                break;
            case 4:
                dir = 'left';
                break;
            case 5:
                dir = 'upleft';
                break;
            case 6:
                dir = 'up';
                break;
            case 7:
                dir = 'upright';
                break;
        }
        self.facingDirection = dir;
        self.updateClient();
        if (self.gridx == 3 && self.gridy == 9 && self.map == 'World' && self.alive) self.onDeath(self, 'fire');
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
    self.teleport = function(map, x, y, layer) {
        if (!self.teleporting) {
            self.teleporting = true;
            self.teleportLocation.map = map;
            self.teleportLocation.x = x*64+32;
            self.teleportLocation.y = y*64+32;
            self.teleportLocation.layer = layer;
            socket.emit('teleport1');
        }
    };
    self.onDeath = function(entity, type) {
        if (!self.invincible) {
            var oldhp = self.hp;
            self.hp = 0;
            self.alive = false;
            socket.emit('playerDied');
            self.controls = {
                up: false,
                down: false,
                left: false,
                right: false,
                xaxis: 0,
                yaxis: 0,
                x: 0,
                y: 0,
                heal: false
            };
            self.attacking = false;
            if (self.hp != oldhp) {
                new Particle(self.map, self.x, self.y, self.layer, 'damage', self.hp-oldhp);
            }
            for (var i = 0; i < 20; i++) {
                new Particle(self.map, self.x, self.y, self.layer, 'playerdeath');
            }
            switch (type) {
                case 'killed':
                    if (entity) insertChat(self.name + ' was killed by ' + entity.name, 'death');
                    else insertChat(self.name + ' died', 'death');
                    break;
                case 'explosion':
                    insertChat(self.name + ' blew up.', 'death');
                    break;
                case 'cherrybomb':
                    var rand = 0.5+Math.random();
                    var angle = Math.atan2(self.y-entity.y, self.x-entity.x);
                    self.xknockback += angle*rand*40;
                    self.yknockback += angle*rand*40;
                    insertChat(self.name + ' blew up.', 'death');
                    break;
                case 'fire':
                    insertChat(self.name + ' went up in flames', 'death');
                    break;
                case 'debug':
                    insertChat(self.name + ' was debugged', 'death');
                    break;
                default:
                    insertChat(self.name + ' died', 'death');
                    break;
            }
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
            heal: 8,
            speed: 1,
            range: 1,
            critChance: 0,
            critPower: 1,
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
            self.stats.critPower += item.critPower;
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
            if (i != 'weapon2') if (localitem) {
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
                        case 'critPower':
                            self.stats.critPower += effect.value;
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
        var data = await ACCOUNTS.loadProgress(self.creds.username, self.creds.password);
        if (data) self.inventory.loadSaveData(data);
        else {
            socket.emit('item', {
                action: 'maxItems',
                slots: self.inventory.maxItems
            });
            self.inventory.refresh();
        }
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
                layer: localplayer.layer,
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
                controls: localplayer.controls,
            });
        }
    }

    return pack;
};
Player.list = [];

// monsters
Monster = function(type, x, y, map, layer) {
    var self = new Rig();
    self.x = x;
    self.y = y;
    self.map = map;
    if (layer != null) self.layer = layer;
    self.gridx = Math.floor(self.x/64);
    self.gridy = Math.floor(self.y/64);
    self.chunkx = Math.floor(self.gridx/Collision.grid[self.map].chunkWidth);
    self.chunky = Math.floor(self.gridy/Collision.grid[self.map].chunkHeight);
    self.animationDirection = 'loop'
    self.ai.attackType = 'none';
    self.ai.lastAttack = 0;
    self.ai.attackStage = 0;
    self.ai.attackTime = 0;
    self.ai.fleeing = false;
    self.ai.fleeThreshold = 0;
    self.ai.inNomonsterRegion = false;
    self.ai.lastTracked = 0;
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
        self.ai.circleDirection = -0.2;
        self.ai.idleMove = tempmonster.idleMove;
        self.hp = tempmonster.hp;
        self.ai.fleeThreshold = tempmonster.fleeThreshold;
        self.maxHP = tempmonster.hp;
        self.xpDrop = tempmonster.xpDrop;
        self.drops = tempmonster.drops;
        self.animationLength = tempmonster.animationLength;
        delete tempmonster;
    } catch (err) {
        error(err);
        return;
    }
    self.collisionBoxSize = Math.max(self.width, self.height);
    self.active = false;

    self.update = function() {
        self.active = false;
        for (var i in Player.list) {
            if (Player.list[i].map == self.map && self.getSquareGridDistance(Player.list[i]) < 48) {
                self.active = true;
                break;
            }
        }
        if (self.stats.heal != 0) {
            self.lastAutoHeal++;
            if (self.lastAutoHeal >= self.stats.heal && self.hp < self.maxHP && self.alive) {
                self.hp = Math.min(self.hp+1, self.maxHP);
                self.lastAutoHeal = 0;
            }
        }
        if (self.active) {
            self.updateAggro();
            if (self.canMove) self.updatePos();
            self.attack();
            self.updateAnimation();
        }
    };
    self.updatePos = function() {
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
                                if (Collision.grid[self.map][self.layer][checky]) if (Collision.grid[self.map][self.layer][checky][checkx]) {
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
                } else if (self.ai.circleTarget && self.getGridDistance(self.ai.entityTarget) < (self.ai.circleDistance+1)*64 && !self.rayCast(self.ai.entityTarget.x, self.ai.entityTarget.y)) {
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
                        if (!self.rayCast(x, y) == false) invalid = true; 
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
        self.xspeed = Math.round(self.xmove+self.xknockback);
        self.yspeed = Math.round(self.ymove+self.yknockback);
        self.collide();
        self.xknockback *= 0.25;
        self.yknockback *= 0.25;
        if (0-Math.abs(self.xknockback) > -0.5) self.xknockback = 0;
        if (0-Math.abs(self.yknockback) > -0.5) self.yknockback = 0;
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
        self.ai.lastTracked++;
        if (self.targetMonsters) {
            var lowest;
            for (var i in Monster.list) {
                if (Monster.list[i].map == self.map && self.getGridDistance(Monster.list[i]) < self.ai.maxRange && !self.rayCast(Monster.list[i].x, Monster.list[i].y) && i != self.id && !Monster.list[i].region.nomonster && Monster.list[i].alive) {
                    if (lowest == null) lowest = i;
                    if (lowest) if (self.getGridDistance(Monster.list[i]) < self.getGridDistance(Monster.list[lowest])) {
                        lowest = i;
                    }
                }
            }
            if (lowest && !self.ai.fleeing) {
                self.ai.entityTarget = Monster.list[lowest];
                self.ai.lastTracked = 0;
            }
            if (self.ai.lastTracked > seconds(5)) {
                self.ai.entityTarget = null;
            }
            if (self.ai.entityTarget) if (!self.ai.entityTarget.alive) self.ai.entityTarget = null;
        } else {
            var lowest;
            for (var i in Player.list) {
                if (Player.list[i].map == self.map && self.getGridDistance(Player.list[i]) < self.ai.maxRange  && !self.rayCast(Player.list[i].x, Player.list[i].y) && !Player.list[i].region.nomonster && Player.list[i].alive) {
                    if (lowest == null) lowest = i;
                    if (lowest) if (self.getGridDistance(Player.list[i]) < self.getGridDistance(Player.list[lowest])) {
                        lowest = i;
                    }
                }
            }
            if (lowest && !self.ai.fleeing) {
                self.ai.entityTarget = Player.list[lowest];
                self.ai.lastTracked = 0;
            }
            if (self.ai.lastTracked > seconds(5)) {
                self.ai.entityTarget = null;
            }
            if (self.ai.entityTarget) if (!self.ai.entityTarget.alive) self.ai.entityTarget = null;
        }
    };
    self.attack = function() {
        self.ai.lastAttack++;
        switch (self.ai.attackType) {
            case 'triggeredcherrybomb':
                if (self.ai.attackTime == 0) {
                    self.moveSpeed = 0;
                    self.invincible = true;
                    self.alive = false;
                    self.animationStage = 0;
                    self.animationLength = 10;
                    self.onDeath = function() {};
                }
                self.ai.attackTime++;
                if (self.ai.attackTime >= seconds(0.2)) {
                    self.ai.attackType = 'exploding';
                    for (var i = 0; i < 100; i++) {
                        new Particle(self.map, self.x, self.y, self.layer, 'explosion');
                    }
                    for (var i in Monster.list) {
                        if (parseFloat(i) != self.id && self.getDistance(Monster.list[i]) <= 64) {
                            if (Monster.list[i].ai.attackType == 'cherrybomb') {
                                Monster.list[i].ai.attackType = 'triggeredcherrybomb';
                                Monster.list[i].ai.attackTime = 0;
                            } else if (Monster.list[i].ai.attackType != 'triggeredcherrybomb' && Monster.list[i].alive) {
                                Monster.list[i].onDeath(self, 'cherrybomb');
                            }
                        } else if (parseFloat(i) != self.id && self.getDistance(Monster.list[i]) <= 128) {
                            if (Monster.list[i].ai.attackType != 'cherrybomb' && Monster.list[i].ai.attackType != 'triggeredcherrybomb' && Monster.list[i].alive) {
                                Monster.list[i].onHit(self, 'cherrybomb');
                            }
                        }
                    }
                    for (var i in Player.list) {
                        if (self.getDistance(Player.list[i]) <= 64 && Player.list[i].alive) Player.list[i].onDeath(self, 'cherrybomb');
                        else if (self.getDistance(Player.list[i]) <= 128 && Player.list[i].alive) Player.list[i].onHit(self, 'cherrybomb');
                    }
                }
                break;
            case 'exploding':
                if (self.animationStage >= 10) delete Monster.list[self.id];
                break;
            case 'snowball':
                if (self.ai.lastAttack >= seconds(4)) {
                    self.ai.attackStage++;
                    if (self.ai.attackStage == 20) {
                        self.ai.attackStage = 0;
                        self.ai.lastAttack = 0;
                        self.animationLength = 0;
                        self.moveSpeed = 10;
                    }
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
                            new Projectile('ninjastar', angle+Math.random()*0.2-0.1, self.id);
                            self.ai.attackStage = 0;
                            self.ai.lastAttack = 0;
                        }
                        if (self.ai.attackStage == 1) {
                            var angle = Math.atan2(self.ai.entityTarget.y-self.y, self.ai.entityTarget.x-self.x);
                            new Projectile('ninjastar', angle+Math.random()*0.2-0.1, self.id);
                        }
                        self.ai.attackStage++;
                    }
                    break;
                case 'snowbird':
                    if (self.ai.lastAttack > seconds(1)) {
                        if (self.ai.attackStage == 5) {
                            var angle = Math.atan2(self.ai.entityTarget.y-self.y, self.ai.entityTarget.x-self.x);
                            new Projectile('fastsnowball', angle+Math.random()*0.2-0.1, self.id);
                            self.ai.attackStage = 0;
                            self.ai.lastAttack = 0;
                        }
                        if (self.ai.attackStage == 1) {
                            var angle = Math.atan2(self.ai.entityTarget.y-self.y, self.ai.entityTarget.x-self.x);
                            new Projectile('fastsnowball', angle+Math.random()*0.2-0.1, self.id);
                        }
                        self.ai.attackStage++;
                    }
                    break;
                case 'cherrybomb':
                    if (self.getDistance(self.ai.entityTarget) < 64) {
                        self.ai.attackType = 'triggeredcherrybomb';
                        self.ai.attackTime = 0;
                    }
                    break;
                case 'triggeredcherrybomb':
                    break;
                case 'exploding':
                    break;
                case 'snowball':
                    if (self.ai.lastAttack >= seconds(4)) {
                        if (self.ai.attackStage == 1) {
                            self.animationLength = 7;
                            self.animationSpeed = 100;
                            self.moveSpeed = 16;
                        }
                        var angle = 16*self.ai.attackStage;
                        new Projectile('snowball', degrees(angle), self.id);
                        new Projectile('snowball', degrees(angle-90), self.id);
                        new Projectile('snowball', degrees(angle-180), self.id);
                        new Projectile('snowball', degrees(angle-270), self.id);
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
        var critHp = 0;
        var parent;
        if (entity.parentIsPlayer) parent = Player.list[entity.parentID];
        else parent = Monster.list[entity.parentID];
        if (parent) {
            if (Math.random() < parent.stats.critChance) critHp = entity.damage*parent.stats.critPower;
        }
        if (self.invincible == false) {
            switch (type) {
                case 'projectile':
                    self.hp -= Math.max(Math.round(((entity.damage+critHp)*(1-self.stats.defense))-self.stats.damageReduction), 0);
                    var rand = 0.5+Math.random();
                    self.xknockback += entity.xspeed*entity.knockback*rand;
                    self.yknockback += entity.yspeed*entity.knockback*rand;
                    if (self.hp < 0) {
                        self.onDeath(parent);
                    }
                    if (parent) self.ai.entityTarget = parent;
                    break;
                case 'cherrybomb':
                    self.hp -= Math.max(Math.round((500*(1-self.stats.defense))-self.stats.damageReduction), 0);
                    var rand = 0.5+Math.random();
                    var angle = Math.atan2(self.y-entity.y, self.x-entity.x);
                    self.xknockback += angle*rand*20;
                    self.yknockback += angle*rand*20;
                    if (self.hp < 0) self.onDeath(entity, 'explosion');
                    break;
                default:
                    error('Invalid Entity type: ' + type);
                    break;
            }
        }
        if (critHp) new Particle(self.map, self.x, self.y, self.layer, 'critdamage', self.hp-oldhp);
        else new Particle(self.map, self.x, self.y, self.layer, 'damage', self.hp-oldhp);
        if (self.hp < self.ai.fleeThreshold) self.ai.fleeing = true;
    };
    self.onDeath = function(entity, type) {
        var oldhp = self.hp;
        self.hp = 0;
        self.alive = false;
        if (entity) entity.xp += self.xpDrop;
        try {
            var multiplier = 0;
            for (var i in self.drops) {
                multiplier += self.drops[i];
            }
            var random = Math.random()*multiplier;
            var min = 0;
            var max = 0;
            var item;
            for (var i in self.drops) {
                max += self.drops[i];
                if (random >= min && random <= max) {
                    item = i;
                    break;
                }
                min += self.drops[i];
            }
            var id;
            if (entity) id = entity.id;
            if (item != 'nothing') {
                var attempts = 0;
                var dropx, dropy;
                while (attempts < 100) {
                    var angle = Math.random()*2*Math.PI;
                    var distance = Math.random()*32;
                    var x = self.x+Math.cos(angle)*distance;
                    var y = self.y+Math.sin(angle)*distance;
                    var collisions = [];
                    if (Collision.grid[self.map]) {
                        for (var checkx = self.gridx-1; checkx <= self.gridx+1; checkx++) {
                            for (var checky = self.gridy-1; checky <= self.gridy+1; checky++) {
                                if (Collision.grid[self.map][checky]) if (Collision.grid[self.map][checky][checkx])
                                collisions.push(Collision.getColEntity(self.map, checkx, checky));
                            }
                        }
                    }
                    var colliding = false;
                    for (var i in collisions) {
                        for (var j in collisions[i]) {
                            var bound1left = x-24;
                            var bound1right = x+24;
                            var bound1top = y-24;
                            var bound1bottom = y+24;
                            var bound2left = collisions[i][j].x-(collisions[i][j].width/2);
                            var bound2right = collisions[i][j].x+(collisions[i][j].width/2);
                            var bound2top = collisions[i][j].y-(collisions[i][j].height/2);
                            var bound2bottom = collisions[i][j].y+(collisions[i][j].height/2);
                            if (bound1left < bound2right && bound1right > bound2left && bound1top < bound2bottom && bound1bottom > bound2top) {
                                colliding = true;;
                            }
                        }
                    }
                    if (!colliding) {
                        dropx = x;
                        dropy = y;
                        break;
                    }
                    attempts++;
                }
                if (dropx) new DroppedItem(self.map, dropx, dropy, item, [], id);
            }
        } catch (err) {
            error(err);
        }
        if (self.hp != oldhp) {
            new Particle(self.map, self.x, self.y, self.layer, 'damage', self.hp-oldhp);
        }
        for (var i = 0; i < 20; i++) {
            new Particle(self.map, self.x+Math.random()*self.width*2-self.width, self.y+Math.random()*self.height*2-self.height, self.layer, 'death');
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
            layer: localmonster.layer,
            chunkx: localmonster.chunkx,
            chunky: localmonster.chunky,
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
                    controls: localmonster.controls,
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
                    path: localmonster.ai.path,
                    controls: localmonster.controls,
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
Projectile = function(type, angle, parentID) {
    var self = new Entity();
    self.type = type;
    try {
        var tempprojectile = Projectile.types[type];
        self.type = type;
        self.width = tempprojectile.width;
        self.height = tempprojectile.height;
        self.moveSpeed = tempprojectile.speed;
        self.damage = tempprojectile.damage;
        self.noCollision = tempprojectile.noCollision;
        self.maxRange = tempprojectile.range;
        self.knockback = tempprojectile.knockback;
        self.pattern = Projectile.patterns[tempprojectile.pattern];
        delete tempprojectile;
    } catch (err) {
        error(err);
        return;
    }
    self.angle = angle;
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
        self.x = parent.x;
        self.y = parent.y;
        self.map = parent.map;
        self.layer = parent.layer;
        self.damage *= parent.stats.attack;
        self.maxRange *= parent.stats.range;
        self.moveSpeed *= parent.stats.projectileSpeed;
    } catch (err) {
        error(err);
        return;
    }
    self.traveltime = 0;
    self.sinAngle = Math.sin(self.angle);
    self.cosAngle = Math.cos(self.angle);
    self.xspeed = self.cosAngle*self.moveSpeed;
    self.yspeed = self.sinAngle*self.moveSpeed;
    self.vertices = [
        {x: ((self.width/2)*self.cosAngle)-((self.height/2)*self.sinAngle)+self.x, y: ((self.width/2)*self.sinAngle)+((self.height/2)*self.cosAngle)+self.y},
        {x: ((self.width/2)*self.cosAngle)-((-self.height/2)*self.sinAngle)+self.x, y: ((self.width/2)*self.sinAngle)+((-self.height/2)*self.cosAngle)+self.y},
        {x: ((-self.width/2)*self.cosAngle)-((-self.height/2)*self.sinAngle)+self.x, y: ((-self.width/2)*self.sinAngle)+((-self.height/2)*self.cosAngle)+self.y},
        {x: ((-self.width/2)*self.cosAngle)-((self.height/2)*self.sinAngle)+self.x, y: ((-self.width/2)*self.sinAngle)+((self.height/2)*self.cosAngle)+self.y},
        {x: self.x, y: self.y}
    ];
    self.lastvertices = self.vertices;
    self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));
    self.x += self.cosAngle*self.width/2;
    self.y += self.sinAngle*self.width/2;

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
                if (self.collideWith(Player.list[i]) && Player.list[i].alive && i != self.parentID) {
                    Player.list[i].onHit(self, 'projectile');
                    delete Projectile.list[self.id];
                    break;
                }
            }
        } else {
            for (var i in Monster.list) {
                if (self.collideWith(Monster.list[i]) && Monster.list[i].alive && i != self.parentID) {
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
        self.pattern(self);
        self.collide();
        return self.checkPointCollision() && !self.noCollision;
    };
    self.checkSpannedCollision = function() {
        var colliding = false;
        var width = self.width;
        var height = self.height
        self.width += Math.abs(self.x-self.lastx);
        self.height += Math.abs(self.y-self.lasty);
        var x = self.x;
        var y = self.y;
        self.x = self.lastx;
        self.y = self.lasty;
        if (self.checkPointCollision()) colliding = true;
        self.x = x;
        self.y = y;
        self.width = width;
        self.height = height;
        if (colliding) delete Projectile.list[self.id];
        return false;
    };
    self.checkLargeSpannedCollision = function() {
        var colliding = false;
        if (self.checkPointCollision()) colliding = true;
        if (self.checkCollisionLine(self.lastvertices[0].x, self.lastvertices[0].y, self.vertices[0].x, self.vertices[0].y)) colliding = true;
        if (self.checkCollisionLine(self.lastvertices[1].x, self.lastvertices[1].y, self.vertices[1].x, self.vertices[1].y)) colliding = true;
        if (self.checkCollisionLine(self.lastvertices[2].x, self.lastvertices[2].y, self.vertices[2].x, self.vertices[2].y)) colliding = true;
        if (self.checkCollisionLine(self.lastvertices[3].x, self.lastvertices[3].y, self.vertices[3].x, self.vertices[3].y)) colliding = true;
        if (self.checkCollisionLine(self.lastx, self.lasty, self.x, self.y)) colliding = true;
        if (colliding) delete Projectile.list[self.id];
        return false;
    }
    self.checkPointCollision = function() {
        var collisions = [];
        var range = Math.ceil(self.collisionBoxSize/128);
        for (var x = self.gridx-range; x <= self.gridx+range; x++) {
            for (var y = self.gridy-range; y <= self.gridy+range; y++) {
                collisions.push(Collision.getColEntity(self.map, x, y, self.layer));
            }
        }
        self.lastvertices = self.vertices;
        self.vertices = [
            {x: ((self.width/2)*self.cosAngle)-((self.height/2)*self.sinAngle)+self.x, y: ((self.width/2)*self.sinAngle)+((self.height/2)*self.cosAngle)+self.y},
            {x: ((self.width/2)*self.cosAngle)-((-self.height/2)*self.sinAngle)+self.x, y: ((self.width/2)*self.sinAngle)+((-self.height/2)*self.cosAngle)+self.y},
            {x: ((-self.width/2)*self.cosAngle)-((-self.height/2)*self.sinAngle)+self.x, y: ((-self.width/2)*self.sinAngle)+((-self.height/2)*self.cosAngle)+self.y},
            {x: ((-self.width/2)*self.cosAngle)-((self.height/2)*self.sinAngle)+self.x, y: ((-self.width/2)*self.sinAngle)+((self.height/2)*self.cosAngle)+self.y},
            {x: self.x, y: self.y}
        ];
        for (var i in collisions) {
            for (var j in collisions[i]) {
                if (self.collideWith(collisions[i][j])) {
                    return true;
                }
            }
        }
        return false;
    };
    self.doPointCollision = function() {
        var colliding = self.checkPointCollision();
        if (colliding) delete Projectile.list[self.id];
        return colliding;
    };
    self.checkLayer = function() {};
    self.checkSlowdown = function() {};
    self.collideWith = function(entity) {
        if (entity.map == self.map) {
            if (entity.noProjectile == null || entity.noProjectile == false) {
                if (self.getSquareDistance(entity) <= self.collisionBoxSize/2 + entity.collisionBoxSize/2) {
                    var vertices2 = [
                        {x: entity.x+entity.width/2, y: entity.y+entity.height/2},
                        {x: entity.x+entity.width/2, y: entity.y-entity.height/2},
                        {x: entity.x-entity.width/2, y: entity.y-entity.height/2},
                        {x: entity.x-entity.width/2, y: entity.y+entity.height/2}
                    ];
                    for (var i = 0; i < 4; i++) {
                        if (vertices2[i].y-self.vertices[0].y < (self.getSlope(self.vertices[0], self.vertices[1])*(vertices2[i].x-self.vertices[0].x))) {
                            if (vertices2[i].y-self.vertices[1].y > (self.getSlope(self.vertices[1], self.vertices[2])*(vertices2[i].x-self.vertices[1].x))) {
                                if (vertices2[i].y-self.vertices[2].y > (self.getSlope(self.vertices[2], self.vertices[3])*(vertices2[i].x-self.vertices[2].x))) {
                                    if (vertices2[i].y-self.vertices[3].y < (self.getSlope(self.vertices[3], self.vertices[0])*(vertices2[i].x-self.vertices[3].x))) {
                                        return true;
                                    }
                                }
                            }
                        }
                        if (self.vertices[i].x > vertices2[2].x && self.vertices[i].x < vertices2[0].x && self.vertices[i].y > vertices2[2].y && self.vertices[i].y < vertices2[0].y) {
                            return true;
                        }
                    }
                    if (self.vertices[4].x > vertices2[2].x && self.vertices[4].x < vertices2[0].x && self.vertices[4].y > vertices2[2].y && self.vertices[4].y < vertices2[0].y) {
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
            layer: localprojectile.layer,
            chunkx: localprojectile.chunkx,
            chunky: localprojectile.chunky,
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
        self.angle += degrees(25);
        self.sinAngle = Math.sin(self.angle);
        self.cosAngle = Math.cos(self.angle);
        self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));
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
            var angle = Math.atan2(target.y-self.y, target.x-self.x);
            self.xspeed = Math.cos(angle)*self.moveSpeed;
            self.yspeed = Math.sin(angle)*self.moveSpeed;
        }
        self.sinAngle = Math.sin(self.angle);
        self.cosAngle = Math.cos(self.angle);
        self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));
    },
    homing2: function(self) {
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
            var angle = Math.atan2(target.y-self.y, target.x-self.x);
            self.angle += Math.min(0.2, Math.max(angle-self.angle, -0.2));
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
                self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));
            }
        } else {
            if (Monster.list[self.parentID]) {
                self.x = Monster.list[self.parentID].x;
                self.y = Monster.list[self.parentID].y;
                self.angle = Monster.list[self.parentID].heldItem.angle;
                self.sinAngle = Math.sin(self.angle);
                self.cosAngle = Math.cos(self.angle);
                self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));
            }
        }
        self.x += Math.cos(self.angle)*(self.width/2+4);
        self.y += Math.sin(self.angle)*(self.width/2+4);
    }
};

// particles
Particle = function(map, x, y, layer, type, value) {
    var self = {
        map: map,
        x: x,
        y: y,
        layer: layer,
        chunkx: Math.floor(x/(Collision.grid[map].chunkWidth*64)),
        chunky: Math.floor(y/(Collision.grid[map].chunkHeight*64)),
        type: type,
        value: value
    };

    Particle.list.push(self);
    return self;
};
Particle.update = function() {
    var pack = [];
    for (var i in Particle.list) {
        localparticle = Particle.list[i];
        pack.push(localparticle);
    }
    Particle.list = [];

    return pack;
};
Particle.list = [];

// dropped items
DroppedItem = function(map, x, y, itemId, enchantments, playerId) {
    var self = {
        id: null,
        x: x,
        y: y,
        map: map,
        chunkx: Math.floor(x/(Collision.grid[map].chunkWidth*64)),
        chunky: Math.floor(y/(Collision.grid[map].chunkHeight*64)),
        width: 48,
        height: 48,
        itemId: itemId,
        enchantments: [],
        playerId: playerId
    };
    self.id = Math.random();
    var valid = false;
    for (var i in Inventory.items) {
        if (itemId == i) {
            valid = true;
            break;
        }
    }
    if (!valid) self.itemId = 'missing';
    self.enchantments = enchantments;
    self.time = 0;

    self.update = function() {
        self.time++;
        if (self.time >= seconds(ENV.itemDespawnTime*60)) delete DroppedItem.list[self.id];
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
            layer: localdroppeditem.layer,
            chunkx: localdroppeditem.chunkx,
            chunky: localdroppeditem.chunky,
            itemId: localdroppeditem.itemId,
            playerId: localdroppeditem.playerId
        });
    }

    return pack;
};
DroppedItem.getDebugData = function() {
    var pack = [];
    for (var i in DroppedItem.list) {
        localdroppeditem = DroppedItem.list[i];
        pack.push({
            map: localdroppeditem.map,
            x: localdroppeditem.x,
            y: localdroppeditem.y,
            itemId: localdroppeditem.itemId,
            enchantments: localdroppeditem.enchantments
        });
    }

    return pack;
};
DroppedItem.list = [];

// conversion functions
function seconds(s) {
    return s*20;
};
function ticks(t) {
    return Math.round(t/20);
};
function degrees(d) {
    return d*Math.PI/180;
};
function radians(r) {
    return r*180/Math.PI;
};