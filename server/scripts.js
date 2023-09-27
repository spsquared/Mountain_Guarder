// Copyright (C) 2023 Sampleprovider(sp)

// trigger scripts
EventTrigger.criteria = {
    playerDistance: function ev_criteria_playerDistance(self, player, value) {
        return player.getGridDistance(self) < value;
    },
    quest: function ev_criteria_quest(self, player, value) {
        return player.quests.isInQuest(value) >= 0;
    },
    notQuest: function ev_criteria_notQuest(self, player, value) {
        return player.quests.isInQuest(value) == -1;
    }
};
EventTrigger.actions = {
    activateBossSpawner: function action_activateBossSpawner(self, player, data) {
        for (let spawner of Spawner.bossList) {
            if (spawner.map == data.map && spawner.gridx == data.x && spawner.gridy == data.y) {
                spawner.spawnMonster();
                return;
            }
        }
    },
    prompt: function action_prompt(self, player, data) {
        if (!player.talking) {
            player.prompt(data, null);
        }
    }
};

// item scripts
Inventory.useFunctions = {
    lodestone: function useFunction_lodestone(self) {
        self.openGaruderWarpMenu();
    }
};

// prompt scripts
Prompts.scripts = {
    specialEventGiveItem: function promptScript_specialEventGiveItem(self) {
        if (self.trackedData.events.indexOf('newyear2023') == -1) {
            self.trackedData.events.push('newyear2023');
            self.inventory.addItem('fireworklauncher', 1, [], true);
            setTimeout(function() {
                self.onDeath(self, 'fire');
                insertChat('Friendly Fire: oops, not again!', 'color: #FF5500;');
            }, 3000);
        }
    },
    spawnTutorialMonsters: function spawnTutorialMonsters(self) {
        for (let spawner of Spawner.bossList) {
            if (spawner.id == 'tutorialmaster') {
                spawner.spawnMonster();
                spawner.spawned = false;
                return;
            }
        }
    }
};

// Rig scripts
Rig.effects = {
    stun: function effect_stun(self) {
        self.stunned = true;
    },
    stun_end: function effect_stun_end(self) {
        self.stunned = false;
    },
    burning: function effect_burning(self) {
        new Particle(self.map, self.x, self.y, 'fire');
        if (self.effectTimers['burning'] % 5 == 0) {
            self.onHit(self, 'burning');
        }
    },
};

// npc scripts
Npc.scripts = {
    pinguThing: function npcScript_pinguThing(player, self) {
        self.startConversation(player, 'pingu');
        setTimeout(function() {
            player.socket.emit('cameraShake', 50);
            player.onDeath();
            player.teleport(ENV.spawnpoint.map, ENV.spawnpoint.x, ENV.spawnpoint.y, ENV.spawnpoint.layer);
        }, 5000)
    }
};

// player scripts
Player.usePatterns = {
    single: function usePattern_single(self, attack, stats, angle) {
        new Projectile(attack.projectile, angle+randomRange(-stats.accuracy/2, stats.accuracy/2), stats, self.id);
    },
    triple: function usePattern_triple(self, attack, stats, angle) {
        let angle2 = angle+randomRange(-stats.accuracy/2, stats.accuracy/2);
        new Projectile(attack.projectile, angle2-degrees(15), stats, self.id);
        new Projectile(attack.projectile, angle2, stats, self.id);
        new Projectile(attack.projectile, angle2+degrees(15), stats, self.id);
    },
    spray: function usePattern_spray(self, attack, stats, angle) {
        for (let i = 0; i < 3; i++) {
            new Projectile(attack.projectile, angle+randomRange(degrees(-15), degrees(15)), stats, self.id);
        }
    },
    spray2: function usePattern_spray2(self, attack, stats, angle) {
        for (let i = 0; i < 5; i++) {
            new Projectile(attack.projectile, angle+randomRange(degrees(-25), degrees(25)), stats, self.id);
        }
    },
    line: function usePattern_line(self, attack, stats, angle) {
        let angle2 = angle+randomRange(-stats.accuracy/2, stats.accuracy/2);
        new Projectile(attack.projectile, angle2, stats, self.id);
        new Projectile(attack.projectile, angle2-degrees(180), stats, self.id);
    },
    triangle: function usePattern_triangle(self, attack, stats, angle) {
        let angle2 = angle+randomRange(-stats.accuracy/2, stats.accuracy/2);
        new Projectile(attack.projectile, angle2-degrees(120), stats, self.id);
        new Projectile(attack.projectile, angle2, stats, self.id);
        new Projectile(attack.projectile, angle2+degrees(120), stats, self.id);
    },
    ring: function usePattern_ring(self, attack, stats, angle) {
        let angle2 = angle+randomRange(-stats.accuracy/2, stats.accuracy/2);
        new Projectile(attack.projectile, angle2, stats, self.id);
        new Projectile(attack.projectile, angle2-degrees(36), stats, self.id);
        new Projectile(attack.projectile, angle2-degrees(72), stats, self.id);
        new Projectile(attack.projectile, angle2-degrees(108), stats, self.id);
        new Projectile(attack.projectile, angle2-degrees(144), stats, self.id);
        new Projectile(attack.projectile, angle2-degrees(180), stats, self.id);
        new Projectile(attack.projectile, angle2-degrees(216), stats, self.id);
        new Projectile(attack.projectile, angle2-degrees(252), stats, self.id);
        new Projectile(attack.projectile, angle2-degrees(288), stats, self.id);
        new Projectile(attack.projectile, angle2-degrees(324), stats, self.id);
    },
    nearest: function usePattern_nearest(self, attack, stats, angle) {
        let lowest, target;
        self.searchChunks(Monster.chunks[self.map], 1, function(monster, id) {
            if (lowest == null || (self.getGridDistance(monster) < 20 && self.getGridDistance(monster) < self.getGridDistance(Monster.list[lowest]) && monster.alive)) lowest = id;
        });
        target = Monster.list[lowest];
        target && new Projectile(attack.projectile, 0, stats, self.id, target.x, target.y);
    },
    mouse: function usePattern_mouse(self, attack, stats, angle) {
        new Projectile(attack.projectile, 0, stats, self.id, self.x+self.mouseX, self.y+self.mouseY);
    }
};

// monster scripts
Monster.attacks = {
    generic_throw: function attack_generic_throw(self, timeout, stages, projectile) {
        if (self.ai.entityTarget && !self.region.noattack) {
            if (self.ai.lastAttack > seconds(timeout)) {
                if (stages.indexOf(self.ai.attackStage) != -1) {
                    let angle = self.getAngle(self.ai.entityTarget);
                    new Projectile(projectile, angle+randomRange(-self.stats.accuracy/2, self.stats.accuracy/2), self.stats, self.id);
                }
                self.ai.attackStage++;
                if (self.ai.attackStage > stages[stages.length-1]) {
                    self.ai.attackStage = 0;
                    self.ai.lastAttack = 0;
                }
            }
        }
    },
    bird: function attack_bird(self) {
        Monster.attacks.generic_throw(self, 1, [1, 5], 'ninjastar');
    },
    snowbird: function attack_snowbird(self) {
        Monster.attacks.generic_throw(self, 1, [1, 5], 'fastsnowball');
    },
    cherrybomb: function attack_cherrybomb(self) {
        if (self.ai.entityTarget && !self.region.noattack) {
            if (self.getDistance(self.ai.entityTarget) < 64) {
                self.ai.attackType = 'triggeredcherrybomb';
                self.ai.attackTime = 0;
            }
        }
    },
    triggeredcherrybomb: function attack_triggeredcherrybomb(self) {
        if (self.ai.attackTime == 0) {
            self.moveSpeed = 0;
            self.invincible = true;
            self.alive = false;
            self.animationStage = 0;
            self.animationLength = 10;
            self.animationSpeed = 100;
            self.onDeath = function onDeath() {};
        }
        self.ai.attackTime++;
        if (self.ai.attackTime >= seconds(0.3)) {
            self.ai.attackType = 'exploding';
            for (let i = 0; i < 100; i++) {
                new Particle(self.map, self.x, self.y, 'explosion', 3);
            }
            self.explosionSize = 4;
            self.searchChunks(Monster.chunks[self.map], 1, function(monster, id) {
                if (parseFloat(id) != self.id && self.getDistance(monster) < 200 && monster.alive && monster.ai.attackType != 'triggeredcherrybomb') {
                    if (monster.ai.attackType == 'cherrybomb') {
                        monster.ai.attackType = 'triggeredcherrybomb';
                        monster.ai.attackTime = 0;
                    } else {
                        monster.onHit(self, 'explosion');
                    }
                }
            });
            self.searchChunks(Player.chunks[self.map], 1, function(player, id) {
                if (self.getDistance(player) < 200 && player.alive) {
                    player.onHit(self, 'explosion');
                }
            });
        }
    },
    exploding: function attack_exploding(self) {
        if (self.animationStage >= 10) {
            delete Monster.list[self.id];
            if (Monster.chunks[self.chunkLocation.map] && Monster.chunks[self.chunkLocation.map][self.chunkLocation.layer] && Monster.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky] && Monster.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx]) delete Monster.chunks[self.chunkLocation.map][self.chunkLocation.layer][self.chunkLocation.chunky][self.chunkLocation.chunkx][self.id];
            else error('Could not delete monster from chunks!');
        }
    },
    snowball: function attack_snowball(self) {
        if (self.ai.lastAttack >= seconds(4)) {
            self.ai.attackStage++;
            if (self.ai.attackStage == 20) {
                self.ai.attackStage = 0;
                self.ai.lastAttack = 0;
                self.animationLength = 0;
                self.moveSpeed = 10;
            }
        }
        if (self.ai.entityTarget && !self.region.noattack) {
            if (self.ai.lastAttack >= seconds(4)) {
                if (self.ai.attackStage == 1) {
                    self.animationLength = 7;
                    self.animationSpeed = 100;
                    self.moveSpeed = 16;
                }
                let angle = 16*self.ai.attackStage;
                new Projectile('snowball', degrees(angle), self.stats, self.id);
                new Projectile('snowball', degrees(angle-90), self.stats, self.id);
                new Projectile('snowball', degrees(angle-180), self.stats, self.id);
                new Projectile('snowball', degrees(angle-270), self.stats, self.id);
            }
        }
    },
    cavebird: function attack_cavebird(self) {
        Monster.attacks.generic_throw(self, 1.5, [1, 3, 5], 'rock');
    },
    ram: function attack_ram(self) {
        if (self.ai.entityTarget && !self.region.noattack) {
            if ((self.ai.lastAttack > seconds(2) && self.getGridDistance(self.ai.entityTarget) < 2) || self.ai.attackStage != 0) {
                self.ai.lastAttack = 0;
                let angle = self.getAngle(self.ai.entityTarget);
                self.ai.charge = {
                    x: Math.cos(angle)*20,
                    y: Math.sin(angle)*20,
                    time: 2
                };
            }
        }
    },
    rockturret: function attack_rockturret(self) {
        if (self.ai.entityTarget && !self.region.noattack) {
            let t = self.getDistance(self.ai.entityTarget)/Projectile.types['explodingrock'].speed;
            let future = {
                x: self.ai.entityTarget.x + self.ai.entityTarget.xspeed*t,
                y: self.ai.entityTarget.y + self.ai.entityTarget.yspeed*t
            };
            let diff = (self.getAngle(future)-self.ai.attackStage) % (2*Math.PI);
            self.ai.attackStage += ((2*diff) % (2*Math.PI) - diff)*0.2;
            if (self.ai.lastAttack > seconds(1.5)) {
                self.ai.lastAttack = 0;
                new Projectile('explodingrock', self.ai.attackStage, self.stats, self.id);
                new Projectile('aiminglaser', self.ai.attackStage, self.stats, self.id);
            }
        }
    }
};
Monster.bossAttacks = {
    map: function bossAttack_map(self, type, data) {
        if (Monster.bossData[data.name]) {
            if (type == 'monsters') {
                for (let location of Monster.bossData[data.name]) {
                    let newmonster = new Monster(data.id, location.x*64+32, location.y*64+32, self.map, location.z, {dropItems: false, team: self.team});
                    self.ai.boss.linkedMonsters.push(newmonster);
                }
            } else if (type == 'projectiles') {
                for (let location of Monster.bossData[data.name]) {
                    new Projectile(data.id, 0, self.stats, self.id, location.x*64+32, location.y*64+32);
                }
            }
        } else {
            error('missing boss data ' + data.name);
        }
    },
    surround: function bossAttack_surround(self, type, data) {
        let increment = 2*Math.PI/data.amount; // oh no radians
        if (type == 'monsters') {
            let radius = self.collisionBoxSize/2*Math.sqrt(2);
            for (let i = 0; i < data.amount; i++) {
                let newmonster = new Monster(data.id, self.x+Math.cos(increment*i)*radius, self.y+Math.sin(increment*i)*radius, self.map, self.layer, {dropItems: false, team: self.team});
                self.ai.boss.linkedMonsters.push(newmonster);
            }
        } else if (type == 'projectiles') {
            for (let i = 0; i < data.amount; i++) {
                new Projectile(data.id, increment*i, self.stats, self.id);
            }
        }
    },
    player: function bossAttack_player(self, type, data) {
        if (type == 'monsters') {
            self.searchChunks(Player.chunks[self.map], Math.ceil(self.ai.maxRange/(64*Math.max(Collision.grid[self.map].chunkWidth, Collision.grid[self.map].chunkHeight))), function(player, id) {
                if (self.getGridDistance(player) < self.ai.maxRange  && (!self.rayCast(player) || self.getGridDistance(player) < 4) && player.alive) {
                    let id = data.id;
                    let x = player.x+randomRange(-64, 64);
                    let y = player.y+randomRange(-64, 64);
                    let map = self.map;
                    let layer = z;
                    new Particle(map, x, y, 'warning', data.warning);
                    self.ai.boss.pendingEvents.push({
                        timer: data.warning,
                        callback: function() {
                            let newmonster = new Monster(id, x, y, map, layer, {dropItems: false, team: self.team});
                            self.ai.boss.linkedMonsters.push(newmonster);
                        }
                    });
                }
            });
        } else if (type == 'projectiles') {
            self.searchChunks(Player.chunks[self.map], Math.ceil(self.ai.maxRange/(64*Math.max(Collision.grid[self.map].chunkWidth, Collision.grid[self.map].chunkHeight))), function(player, id) {
                if (self.getGridDistance(player) < self.ai.maxRange  && (!self.rayCast(player.x) || self.getGridDistance(player) < 4) && player.alive) {
                    let id = data.id;
                    let stats = data.stats;
                    let selfID = self.id;
                    let x = player.x+randomRange(-16, 16);
                    let y = player.y+randomRange(-16, 16);
                    new Particle(self.map, x, y, 'warning', data.warning);
                    self.ai.boss.pendingEvents.push({
                        timer: data.warning,
                        callback: function() {
                            new Projectile(id, 0, stats, selfID, x, y);
                        }
                    });
                }
            });
        }
    },
    random: function bossAttack_random(self, type, data) {
        for (let i = 0; i < data.amount; i++) {
            let attempts = 0;
            let x, y;
            while (attempts < 20) {
                x = self.gridx+Math.round(randomRange(-24, 24));
                y = self.gridy+Math.round(randomRange(-24, 24));
                if (Collision.grid[self.map] && Collision.grid[self.map][self.layer] && Collision.grid[self.map][self.layer][y] && Collision.grid[self.map][self.layer][y][x] == 0) break;
                attempts++;
            }
            x = x*64+32;
            y = y*64+32;
            new Particle(self.map, x, y, 'warning', data.warning);
            if (type == 'monsters') {
                let id = data.id;
                let map = self.map;
                let layer = self.layer;
                self.ai.boss.pendingEvents.push({
                    timer: data.warning,
                    callback: function() {
                        let newmonster = new Monster(id, x, y, map, layer, {dropItems: false, team: self.team});
                        self.ai.boss.linkedMonsters.push(newmonster);
                    }
                });
            } else if (type == 'projectiles') {
                let id = data.id;
                let stats = data.stats;
                let selfID = self.id;
                self.ai.boss.pendingEvents.push({
                    timer: data.warning,
                    callback: function() {
                        new Projectile(id, 0, stats, selfID, x, y);
                    }
                });
            }

        }
    },
    cameraShake: function bossAttack_cameraShake(self, type, data) {
        new Particle(self.map, self.x, self.y, type, data);
    }
};

// projectile scripts
Projectile.patterns = {
    none: function pattern_none(self) {
        self.lastPatternUpdate = 0;
    },
    spin: function pattern_spin(self) {
        self.angle += degrees(25);
        self.sinAngle = Math.sin(self.angle);
        self.cosAngle = Math.cos(self.angle);
        self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));
        self.lastPatternUpdate = 0;
    },
    slowspin: function pattern_spin(self) {
        self.angle += degrees(15);
        self.sinAngle = Math.sin(self.angle);
        self.cosAngle = Math.cos(self.angle);
        self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));
        self.lastPatternUpdate = 0;
    },
    weakhoming: function pattern_homing3(self) {
        self.angle += degrees(25);
        let lowest, target;
        if (self.parentIsPlayer) {
            self.searchChunks(Monster.chunks[self.map], 2, function(monster, id) {
                if (lowest == null || (self.getGridDistance(monster) < self.getGridDistance(Monster.list[lowest]) && monster.alive)) lowest = id;
            });
            target = Monster.list[lowest];
        } else {
            self.searchChunks(Player.chunks[self.map], 2, function(player, id) {
                if (lowest == null || (self.getGridDistance(player) < self.getGridDistance(Player.list[lowest]) && player.alive)) lowest = id;
            });
            target = Player.list[lowest];
        }
        if (target) {
            let angle = self.getAngle(target);
            self.xspeed = self.xspeed*0.9 + Math.cos(angle)*self.moveSpeed*0.1;
            self.yspeed = self.yspeed*0.9 + Math.sin(angle)*self.moveSpeed*0.1;
        }
        self.sinAngle = Math.sin(self.angle);
        self.cosAngle = Math.cos(self.angle);
        self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));
        self.lastPatternUpdate = 0;
    },
    homing: function pattern_homing(self) {
        self.angle += degrees(25);
        let lowest, target;
        if (self.parentIsPlayer) {
            self.searchChunks(Monster.chunks[self.map], 2, function(monster, id) {
                if (lowest == null || (self.getGridDistance(monster) < self.getGridDistance(Monster.list[lowest]) && monster.alive)) lowest = id;
            });
            target = Monster.list[lowest];
        } else {
            self.searchChunks(Player.chunks[self.map], 2, function(player, id) {
                if (lowest == null || (self.getGridDistance(player) < self.getGridDistance(Player.list[lowest]) && player.alive)) lowest = id;
            });
            target = Player.list[lowest];
        }
        if (target) {
            let angle = self.getAngle(target);
            self.xspeed = self.xspeed*0.8 + Math.cos(angle)*self.moveSpeed*0.2;
            self.yspeed = self.yspeed*0.8 + Math.sin(angle)*self.moveSpeed*0.2;
        }
        self.sinAngle = Math.sin(self.angle);
        self.cosAngle = Math.cos(self.angle);
        self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));
        self.lastPatternUpdate = 0;
    },
    homing2: function pattern_homing2(self) {
        let lowest, target;
        if (self.parentIsPlayer) {
            self.searchChunks(Monster.chunks[self.map], 2, function(monster, id) {
                if (lowest == null || (self.getGridDistance(monster) < self.getGridDistance(Monster.list[lowest]) && monster.alive)) lowest = id;
            });
            target = Monster.list[lowest];
        } else {
            self.searchChunks(Player.chunks[self.map], 2, function(player, id) {
                if (lowest == null || (self.getGridDistance(player) < self.getGridDistance(Player.list[lowest]) && player.alive)) lowest = id;
            });
            target = Player.list[lowest];
        }
        if (target) {
            let diff = (self.getAngle(target)-self.angle) % (2*Math.PI);
            self.angle += ((2*diff) % (2*Math.PI) - diff)*0.5;
            self.xspeed = Math.cos(self.angle)*self.moveSpeed;
            self.yspeed = Math.sin(self.angle)*self.moveSpeed;
            self.sinAngle = Math.sin(self.angle);
            self.cosAngle = Math.cos(self.angle);
            self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));
        }
        self.lastPatternUpdate = 0;
    },
    enchantHoming: function pattern_enchantHoming(self) {
        let lowest, target;
        self.searchChunks(Monster.chunks[self.map], 2, function(monster, id) {
            if (lowest == null || (self.getGridDistance(monster) < self.getGridDistance(Monster.list[lowest]) && monster.alive)) lowest = id;
        });
        target = Monster.list[lowest];
        if (target) {
            let angle = self.getAngle(target);
            self.angle += Math.min(0.05, Math.max(angle-self.angle, -0.05));
            self.xspeed = Math.cos(self.angle)*self.moveSpeed;
            self.yspeed = Math.sin(self.angle)*self.moveSpeed;
            self.sinAngle = Math.sin(self.angle);
            self.cosAngle = Math.cos(self.angle);
            self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));
        }
        self.lastPatternUpdate = 0;
    },
    follow: function pattern_follow(self) {
        const parent = Player.list[self.parentID] ?? Monster.list[self.parentID];
        if (parent != null) {
            self.x = parent.x;
            self.y = parent.y;
            self.x += self.cosAngle*(self.width/2+4);
            self.y += self.sinAngle*(self.width/2+4);
            self.xspeed = self.cosAngle;
            self.yspeed = self.sinAngle;
            self.frozen = true;
        }
        self.lastPatternUpdate = 0;
    },
    followDir: function pattern_followDir(self) {
        const parent = Player.list[self.parentID] ?? Monster.list[self.parentID];
        if (parent != null) {
            self.x = parent.x;
            self.y = parent.y;
            if (parent.heldItem) self.angle = parent.heldItem.angle;
            else self.angle = parent.ai.attackStage;
            self.sinAngle = Math.sin(self.angle);
            self.cosAngle = Math.cos(self.angle);
            self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));
            self.x += self.cosAngle*(self.width/2+4);
            self.y += self.sinAngle*(self.width/2+4);
            self.xspeed = self.cosAngle;
            self.yspeed = self.sinAngle;
            self.frozen = true;
        }
        self.lastPatternUpdate = 0;
    },
    orbit: function pattern_orbit(self) {
        const parent = Player.list[self.parentID] ?? Monster.list[self.parentID];
        if (parent) {
            self.x = parent.x;
            self.y = parent.y;
            self.angle += degrees(18);
            self.sinAngle = Math.sin(self.angle);
            self.cosAngle = Math.cos(self.angle);
            self.collisionBoxSize = Math.max(Math.abs(self.sinAngle*self.height)+Math.abs(self.cosAngle*self.width), Math.abs(self.cosAngle*self.height)+Math.abs(self.sinAngle*self.width));
            self.x += Math.cos(self.angle)*(self.width/2+4);
            self.y += Math.sin(self.angle)*(self.width/2+4);
            self.xspeed = self.cosAngle;
            self.yspeed = self.sinAngle;
            self.frozen = true;
        }
        self.lastPatternUpdate = 0;
    }
};
Projectile.contactEvents = {
    explosion: function contactEvent_explosion(self, entity, data) {
        for (let i = 0; i < data.size*50; i++) {
            new Particle(self.map, self.x, self.y, 'explosion', data.size);
        }
        self.explosionSize = data.size;
        self.searchChunks(Monster.chunks[self.map], 1, function(monster, id) {
            if (self.getDistance(monster) <= 64*data.size && !self.rayCast(monster) && monster.ai.attackType != 'triggeredcherrybomb' && monster.alive) {
                if (monster.ai.attackType == 'cherrybomb') {
                    monster.ai.attackType = 'triggeredcherrybomb';
                    monster.ai.attackTime = 0;
                } else {
                    monster.onHit(self, 'explosion');
                }
            }
        });
        self.searchChunks(Player.chunks[self.map], 1, function(player, id) {
            if (self.getDistance(player) <= 64*data.size && !self.rayCast(player) && player.alive) {
                player.onHit(self, 'explosion');
            }
        });
    },
    effect: function contactEvent_effect(self, entity, data) {
        if (entity) if (entity.entType == 'player' || entity.entType == 'monster') {
            entity.effectTimers[data.id] = Math.max(entity.effectTimers[data.id] ?? 0, data.time);
        }
    },
    areaeffect: function contactEvent_areaeffect(self, entity, data) {
        self.searchChunks(Monster.chunks[self.map], 1, function(monster, id) {
            let distance = self.getDistance(monster);
            if (distance <= 64*data.size && monster.alive) {
                monster.effectTimers[data.effect] = Math.max(monster.effectTimers[data.id] ?? 0, Math.round(data.time*(1-distance/(data.size*64))));
            }
        });
        self.searchChunks(Player.chunks[self.map], 1, function(player, id) {
            let distance = self.getDistance(player);
            if (distance <= 64*data.size && player.alive) {
                player.effectTimers[data.effect] = Math.max(player.effectTimers[data.id] ?? 0, Math.round(data.time*(1-distance/(data.size*64))));
            }
        });
    },
    areadamage: function contactEvent_areadamage(self, entity, data) {
        self.searchChunks(Monster.chunks[self.map], 1, function(monster, id) {
            let distance = self.getDistance(monster);
            if (distance <= 64*data.size && monster.alive) {
                self.areaDamage = Math.round(data.damage*(1-distance/(data.size*64)));
                monster.onHit(self, 'areadamage');
            }
        });
        self.searchChunks(Player.chunks[self.map], 1, function(player, id) {
            let distance = self.getDistance(player);
            if (distance <= 64*data.size && player.alive) {
                self.areaDamage = Math.round(data.damage*(1-distance/(data.size*64)));
                player.onHit(self, 'areadamage');
            }
        });
    },
    particles: function contactEvent_particles(self, entity, data) {
        switch (data.pattern) {
            case 'point':
                for (let i = 0; i < data.amount; i++) {
                    new Particle(self.map, self.x, self.y, data.particle);
                }
                break;
            case 'spread':
                for (let i = 0; i < data.amount; i++) {
                    new Particle(self.map, self.x+randomRange(-data.spread, data.spread), self.y+randomRange(-data.spread, data.spread), data.particle);
                }
                break;
            default:
                error('Invalid contact event particle pattern ' + data.pattern);
        }
    }
};

let secCache = new Map();
let tickCache = new Map();
let degCache = new Map();
let radCache = new Map();
function getSlope(pos1, pos2) {
    return (pos2.y - pos1.y) / (pos2.x - pos1.x);
};
function seconds(s) {
    return secCache.has(s) ? secCache.get(s) : secCache.set(s, s*20).get(s);
};
function ticks(t) {
    return tickCache.has(t) ? tickCache.get(t) : tickCache.set(t, t/20).get(t);
};
function degrees(d) {
    return degCache.has(d) ? degCache.get(d) : degCache.set(d, d*Math.PI/180).get(d);
};
function radians(r) {
    return radCache.has(r) ? radCache.get(r) : radCache.set(r, r*180/Math.PI).get(r);
};
function randomRange(lower, upper) {
    return Math.random()*(upper-lower)+lower;
};