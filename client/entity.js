// Copyright (C) 2021 Radioactive64

// entities
Entity = function(id, map, x, y) {
    var self = {
        id: id,
        map: map,
        x: x,
        y: y,
        xspeed: 0,
        yspeed: 0,
        chunkx: 0,
        chunky: 0,
        width: 0,
        height: 0,
        rotation: 0,
        interpolationStage: 0,
        animationImage: new Image(),
        updated: true
    };

    self.update = function(param) {
        self.map = param.map;
        self.xspeed = (param.x-self.x)/(settings.fps/20);
        self.yspeed = (param.y-self.y)/(settings.fps/20);
        self.interpolationStage = 0;
        self.updated = true;
    };
    self.draw = function() {
        if (self.map == player.map && self.chunkx >= player.chunkx-settings.renderDistance && self.chunkx <= player.chunkx+settings.renderDistance && self.chunky>= player.chunky-settings.renderDistance && self.chunky <= player.chunky+settings.renderDistance) {
            LAYERS.elower.fillText('MISSING TEXTURE', self.x+OFFSETX, self.y+OFFSETY);
        }
        if (self.interpolationStage < (settings.fps/20)) {
            self.x += self.xspeed;
            self.y += self.yspeed;
            self.chunkx = Math.floor(self.x/(64*MAPS[self.map].chunkwidth));
            self.chunky = Math.floor(self.y/(64*MAPS[self.map].chunkheight));
            self.interpolationStage++;
        }
    };

    return self;
};
Entity.update = function(data) {
    Player.update(data.players);
    Monster.update(data.monsters);
    Projectile.update(data.projectiles);
    Particle.update(data.particles);
};
Entity.draw = function() {
    var entities = [];
    for (var i in Player.list) {
        entities.push(Player.list[i]);
    }
    for (var i in Monster.list) {
        entities.push(Monster.list[i]);
    }
    for (var i in Projectile.list) {
        entities.push(Projectile.list[i]);
    }
    for (var i in Particle.list) {
        entities.push(Particle.list[i]);
    }
    entities = entities.sort(function(a, b) {return a.y - b.y;});
    LAYERS.elower.save();
    LAYERS.eupper.save();
    LAYERS.elower.translate((window.innerWidth/2)-player.x,(window.innerHeight/2)-player.y);
    LAYERS.eupper.translate((window.innerWidth/2)-player.x,(window.innerHeight/2)-player.y);
    for (var i in entities) {
        if (entities[i].map == player.map) entities[i].draw();
    }
    LAYERS.elower.restore();
    LAYERS.eupper.restore();
};

// rigs
Rig = function(id, map, x, y) {
    var self = new Entity(id, map, x, y);
    self.rawWidth = 0;
    self.rawHeight = 0;
    self.drawHealthBar = true;
    self.hp = 0;
    self.maxHP = 0;
    self.xp = 0;
    self.manaFull = false;
    
    self.update = function(param) {
        self.map = param.map;
        self.xspeed = (param.x-self.x)/(settings.fps/20);
        self.yspeed = (param.y-self.y)/(settings.fps/20);
        self.interpolationStage = 0;
        self.animationStage = param.animationStage;
        self.hp = param.hp;
        self.maxHP = param.maxHP;
        self.updated = true;
    };
    self.draw = function() {
        if (self.map == player.map && self.chunkx >= player.chunkx-settings.renderDistance && self.chunkx <= player.chunkx+settings.renderDistance && self.chunky>= player.chunky-settings.renderDistance && self.chunky <= player.chunky+settings.renderDistance) {
            LAYERS.elower.fillText('MISSING TEXTURE', self.x+OFFSETX, self.y+OFFSETY);
            LAYERS.eupper.drawImage(Rig.healthBarR, 0, 0, 42, 5, self.x-63+OFFSETX, self.y-52+OFFSETY, 126, 15);
            LAYERS.eupper.drawImage(Rig.healthBarR, 1, 5, (self.hp/self.maxHP)*40, 5, self.x-60+OFFSETX, self.y-52+OFFSETY, (self.hp/self.maxHP)*120, 15);
        }
        if (self.interpolationStage < (settings.fps/20)) {
            self.x += self.xspeed;
            self.y += self.yspeed;
            self.chunkx = Math.floor(self.x/(64*MAPS[self.map].chunkwidth));
            self.chunky = Math.floor(self.y/(64*MAPS[self.map].chunkheight));
            self.interpolationStage++;
        }
    };

    return self;
};
Rig.healthBarG = new Image();
Rig.healthBarR = new Image();

// players
Player = function(id, map, x, y, isNPC) {
    var self = new Rig(id, map, x, y);
    self.animationImage = null;
    self.animationsCanvas = new OffscreenCanvas(48, 128);
    self.animationsContext = self.animationsCanvas.getContext('2d');
    self.characterStyle = {
        hair: 1,
        hairColor: '#000000',
        bodyColor: '#FFF0B4',
        shirtColor: '#FF3232',
        pantsColor: '#6464FF'
    };
    if (isNPC) self.drawHealthBar = false;

    self.draw = function () {
        if (self.map == player.map && self.chunkx >= player.chunkx-settings.renderDistance && self.chunkx <= player.chunkx+settings.renderDistance && self.chunky >= player.chunky-settings.renderDistance && self.chunky <= player.chunky+settings.renderDistance) {
            LAYERS.elower.drawImage(self.animationsCanvas, (self.animationStage % 6)*8, (~~(self.animationStage / 6))*16, 8, 16, self.x-16+OFFSETX, self.y-52+OFFSETY, 32, 64);
            if (self.drawHealthBar) {
                LAYERS.eupper.drawImage(Rig.healthBarG, 0, 0, 42, 5, self.x-63+OFFSETX, self.y-68+OFFSETY, 126, 15);
                LAYERS.eupper.drawImage(Rig.healthBarG, 1, 5, (self.hp/self.maxHP)*40, 5, self.x-60+OFFSETX, self.y-68+OFFSETY, (self.hp/self.maxHP)*120, 15);
            }
        }
        if (self.interpolationStage < (settings.fps/20)) {
            self.x += self.xspeed;
            self.y += self.yspeed;
            self.chunkx = Math.floor(self.x/(64*MAPS[self.map].chunkwidth));
            self.chunky = Math.floor(self.y/(64*MAPS[self.map].chunkheight));
            self.interpolationStage++;
        }
    };
    self.updateAnimationCanvas = function() {
        self.animationsContext.drawImage(self.drawTintedCanvas('body'), 0, 0);
        self.animationsContext.drawImage(self.drawTintedCanvas('shirt'), 0, 0);
        self.animationsContext.drawImage(self.drawTintedCanvas('pants'), 0, 0);
        self.animationsContext.drawImage(self.drawTintedCanvas('hair'), 0, 0);
    };
    self.drawTintedCanvas = function(asset) {
        var buffer = new OffscreenCanvas(48, 128);
        var btx = buffer.getContext('2d');
        if (asset == 'hair') btx.drawImage(Player.animations[asset][self.characterStyle.hair], 0, 0);
        else btx.drawImage(Player.animations[asset], 0, 0);
        btx.fillStyle = self.characterStyle[asset + 'Color'];
        btx.globalCompositeOperation = 'multiply';
        btx.fillRect(0, 0, 48, 128);
        btx.globalCompositeOperation = 'destination-in';
        if (asset == 'hair') btx.drawImage(Player.animations[asset][self.characterStyle.hair], 0, 0);
        else btx.drawImage(Player.animations[asset], 0, 0);
        return buffer;
    };

    Player.list[self.id] = self;
    return self;
};
Player.update = function(data) {
    for (var i in Player.list) {
        Player.list[i].updated = false;
    }
    for (var i in data) {
        if (Player.list[data[i].id]) {
            Player.list[data[i].id].update(data[i]);
        } else {
            new Player(data[i].id, data[i].map, data[i].x, data[i].y, data.isNPC);
            Player.list[data[i].id].updateAnimationCanvas();
            Player.list[data[i].id].update(data[i]);
        }
    }
    for (var i in Player.list) {
        if (Player.list[i].updated == false) {
            delete Player.list[i];
        }
    }
};
Player.list = [];
Player.animations = {
    hair: [
        new Image(),
        new Image(),
        new Image(),
        new Image(),
        new Image(),
        new Image(),
        new Image()
    ],
    body: new Image(),
    shirt: new Image(),
    pants: new Image()
};

// monsters
Monster = function(id, map, x, y, type) {
    var self = new Rig(id, map, x, y);
    var tempmonster = Monster.types[type];
    self.type = type;
    self.width = tempmonster.width;
    self.height = tempmonster.height;
    self.rawWidth = tempmonster.rawWidth;
    self.rawHeight = tempmonster.rawHeight;
    self.animationImage = Monster.images[type];

    self.draw = function () {
        if (self.map == player.map && self.chunkx >= player.chunkx-settings.renderDistance && self.chunkx <= player.chunkx+settings.renderDistance && self.chunky>= player.chunky-settings.renderDistance && self.chunky <= player.chunky+settings.renderDistance) {
            LAYERS.elower.drawImage(self.animationImage, self.animationStage*self.rawWidth, 0, self.rawWidth, self.rawHeight, self.x-self.width/2+OFFSETX, self.y-self.height/2+OFFSETY, self.width, self.height);
            LAYERS.eupper.drawImage(Rig.healthBarR, 0, 0, 42, 5, self.x-63+OFFSETX, self.y-self.height/2-20+OFFSETY, 126, 15);
            LAYERS.eupper.drawImage(Rig.healthBarR, 1, 5, (self.hp/self.maxHP)*40, 5, self.x-60+OFFSETX, self.y-self.height/2-20+OFFSETY, (self.hp/self.maxHP)*120, 15);
        }
        if (self.interpolationStage < (settings.fps/20)) {
            self.x += self.xspeed;
            self.y += self.yspeed;
            self.chunkx = Math.floor(self.x/(64*MAPS[self.map].chunkwidth));
            self.chunky = Math.floor(self.y/(64*MAPS[self.map].chunkheight));
            self.interpolationStage++;
        }
    };

    Monster.list[self.id] = self;
    return self;
};
Monster.update = function(data) {
    for (var i in Monster.list) {
        Monster.list[i].updated = false;
    }
    for (var i in data) {
        if (Monster.list[data[i].id]) {
            Monster.list[data[i].id].update(data[i]);
        } else {
            new Monster(data[i].id, data[i].map, data[i].x, data[i].y, data[i].type);
            Monster.list[data[i].id].update(data[i])
        }
    }
    for (var i in Monster.list) {
        if (Monster.list[i].updated == false) {
            delete Monster.list[i];
        }
    }
};
Monster.list = [];
Monster.types = [];
Monster.images = [];

// projectiles
Projectile = function(id, map, x, y, angle, type) {
    var self = new Entity(id, map, x, y);
    self.angle = angle;
    self.rotationspeed = 0;
    var tempprojectile = Projectile.types[type];
    self.type = type;
    self.width = tempprojectile.width;
    self.height = tempprojectile.height;
    self.rawWidth = tempprojectile.rawWidth;
    self.rawHeight = tempprojectile.rawHeight;
    self.animationImage = Projectile.images[type];
    self.animationStage = 0;

    self.update = function(param) {
        self.map = param.map;
        self.xspeed = (param.x-self.x)/(settings.fps/20);
        self.yspeed = (param.y-self.y)/(settings.fps/20);
        self.interpolationStage = 0;
        self.rotationspeed = (param.angle-self.angle)/(settings.fps/20);
        self.updated = true;
    };
    self.draw = function() {
        if (self.map == player.map && self.chunkx >= player.chunkx-settings.renderDistance && self.chunkx <= player.chunkx+settings.renderDistance && self.chunky>= player.chunky-settings.renderDistance && self.chunky <= player.chunky+settings.renderDistance) {
            LAYERS.elower.save();
            LAYERS.elower.translate(self.x+OFFSETX, self.y+OFFSETY);
            LAYERS.elower.rotate(self.angle);
            LAYERS.elower.drawImage(self.animationImage, self.animationStage*self.rawWidth, 0, self.rawWidth, self.rawHeight, -self.width/2, -self.height/2, self.width, self.height);
            LAYERS.elower.restore();
        }
        if (self.interpolationStage < (settings.fps/20)) {
            self.x += self.xspeed;
            self.y += self.yspeed;
            self.chunkx = Math.floor(self.x/(64*MAPS[self.map].chunkwidth));
            self.chunky = Math.floor(self.y/(64*MAPS[self.map].chunkheight));
            self.angle += self.rotationspeed;
            self.interpolationStage++;
        }
    };

    Projectile.list[self.id] = self;
    return self;
};
Projectile.update = function(data) {
    for (var i in Projectile.list) {
        Projectile.list[i].updated = false;
    }
    for (var i in data) {
        if (Projectile.list[data[i].id]) {
            Projectile.list[data[i].id].update(data[i]);
        } else {
            new Projectile(data[i].id, data[i].map, data[i].x, data[i].y, data[i].angle, data[i].type);
            Projectile.list[data[i].id].update(data[i]);
        }
    }
    for (var i in Projectile.list) {
        if (Projectile.list[i].updated == false) {
            delete Projectile.list[i];
        }
    }
};
Projectile.list = [];
Projectile.types = [];
Projectile.images = [];

// particles
Particle = function(map, x, y, type, value) {
    var self = {
        id: null,
        map: map,
        x: x,
        y: y,
        xspeed: 0,
        yspeed: 0,
        color: '#000000',
        opacity: 100,
        type: type,
        value: value,
        chunkx: 0,
        chunky: 0
    };
    self.id = Math.random();
    switch (self.type) {
        case 'damage':
            self.xspeed = Math.random()*4-2;
            self.yspeed = -10;
            break;
        case 'heal':
            self.xspeed = Math.random()*4-2;
            self.yspeed = -10;
            break;
        case 'teleport':
            var angle = Math.random()*360*(Math.PI/180);
            self.xspeed = Math.sin(angle)*Math.random()*2;
            self.yspeed = Math.cos(angle)*Math.random()*2;
            break;
        case 'explosion':
            var random = Math.random();
            if (random <= 0.2) {
                self.color = '#FFFFFF';
            } else if (random <= 0.4) {
                self.color = '#999999';
            } else {
                self.color = '#333333';
            }
            var angle = Math.random()*360*(Math.PI/180);
            self.xspeed = Math.sin(angle)*Math.random()*5;
            self.yspeed = Math.cos(angle)*Math.random()*5;
            self.opacity = 150;
            break;
        case 'death':
            self.color = '#FF0000';
            self.yspeed = -5;
            break;
        case 'playerdeath':
            self.color = '#FF0000';
            var angle = Math.random()*360*(Math.PI/180);
            self.xspeed = Math.sin(angle)*Math.random()*3;
            self.yspeed = Math.cos(angle)*Math.random()*3-10;
            break;
        default:
            console.error('invalid particle type ' + self.type);
            return;
    }

    self.draw = function() {
        self.x += self.xspeed;
        self.y += self.yspeed;
        self.chunkx = Math.floor(self.x/(64*MAPS[self.map].chunkwidth));
        self.chunky = Math.floor(self.y/(64*MAPS[self.map].chunkheight));
        if (self.opacity <= 0) {
            delete Particle.list[self.id];
            return;
        }
        switch (self.type) {
            case 'damage':
                self.xspeed *= 0.98;
                self.yspeed += 0.5;
                self.opacity -= 2;
                if (self.map == player.map && self.chunkx >= player.chunkx-settings.renderDistance && self.chunkx <= player.chunkx+settings.renderDistance && self.chunky>= player.chunky-settings.renderDistance && self.chunky <= player.chunky+settings.renderDistance) {
                    var opstring = self.opacity.toString(16);
                    if (opstring.length == 1) opstring = 0 + opstring;
                    LAYERS.elower.fillStyle = '#FF0000' + opstring;
                    LAYERS.elower.textAlign = 'center';
                    LAYERS.elower.font = '24px Pixel';
                    LAYERS.elower.fillText(self.value, self.x+OFFSETX, self.y+OFFSETY);
                }
                break;
            case 'heal':
                self.xspeed *= 0.98;
                self.yspeed += 0.5;
                self.opacity -= 2;
                if (self.map == player.map && self.chunkx >= player.chunkx-settings.renderDistance && self.chunkx <= player.chunkx+settings.renderDistance && self.chunky>= player.chunky-settings.renderDistance && self.chunky <= player.chunky+settings.renderDistance) {
                    var opstring = self.opacity.toString(16);
                    if (opstring.length == 1) opstring = 0 + opstring;
                    LAYERS.elower.fillStyle = '#00FF00' + opstring;
                    LAYERS.elower.textAlign = 'center';
                    LAYERS.elower.font = '24px Pixel';
                    LAYERS.elower.fillText(self.value, self.x+OFFSETX, self.y+OFFSETY);
                }
                break;
            case 'teleport':
                self.xspeed *= 0.95;
                self.yspeed *= 0.95;
                self.opacity -= 1;
                if (self.map == player.map && self.chunkx >= player.chunkx-settings.renderDistance && self.chunkx <= player.chunkx+settings.renderDistance && self.chunky>= player.chunky-settings.renderDistance && self.chunky <= player.chunky+settings.renderDistance) {
                    var opstring = self.opacity.toString(16);
                    if (opstring.length == 1) opstring = 0 + opstring;
                    LAYERS.elower.fillStyle = '#9900CC' + opstring;
                    LAYERS.elower.fillRect(self.x-10+OFFSETX, self.y-10+OFFSETY, 20, 20);
                }
                break;
            case 'explosion':
                self.xspeed *= 0.9;
                self.yspeed *= 0.9;
                self.opacity -= 1;
                if (self.map == player.map && self.chunkx >= player.chunkx-settings.renderDistance && self.chunkx <= player.chunkx+settings.renderDistance && self.chunky>= player.chunky-settings.renderDistance && self.chunky <= player.chunky+settings.renderDistance) {
                    var opacity = Math.min(self.opacity, 100);
                    var opstring = opacity.toString(16);
                    if (opstring.length == 1) opstring = 0 + opstring;
                    LAYERS.elower.fillStyle = self.color + opstring;
                    LAYERS.elower.fillRect(self.x-10+OFFSETX, self.y-10+OFFSETY, 20, 20);
                }
                break;
            case 'death':
                self.yspeed *= 0.95;
                self.opacity -= 2;
                if (self.map == player.map && self.chunkx >= player.chunkx-settings.renderDistance && self.chunkx <= player.chunkx+settings.renderDistance && self.chunky>= player.chunky-settings.renderDistance && self.chunky <= player.chunky+settings.renderDistance) {
                    var opacity = Math.min(self.opacity, 100);
                    var opstring = opacity.toString(16);
                    if (opstring.length == 1) opstring = 0 + opstring;
                    LAYERS.elower.fillStyle = self.color + opstring;
                    LAYERS.elower.fillRect(self.x-5+OFFSETX, self.y-5+OFFSETY, 10, 10);
                }
                break;
            case 'playerdeath':
                self.xspeed *= 0.98;
                self.yspeed += 0.5;
                self.opacity -= 2;
                if (self.map == player.map && self.chunkx >= player.chunkx-settings.renderDistance && self.chunkx <= player.chunkx+settings.renderDistance && self.chunky>= player.chunky-settings.renderDistance && self.chunky <= player.chunky+settings.renderDistance) {
                    var opacity = Math.min(self.opacity, 100);
                    var opstring = opacity.toString(16);
                    if (opstring.length == 1) opstring = 0 + opstring;
                    LAYERS.elower.fillStyle = self.color + opstring;
                    LAYERS.elower.fillRect(self.x-10+OFFSETX, self.y-10+OFFSETY, 20, 20);
                }
                break;
            default:
                console.error('invalid particle type ' + self.type);
                break;
        }
    };

    Particle.list[self.id] = self;
    return self;
};
Particle.update = function(data) {
    for (var i in data) {
        new Particle(data[i].map, data[i].x, data[i].y, data[i].type, data[i].value);
    }
};
Particle.list = [];

// load data
function loadEntitydata() {
    // health bars
    totalassets += 2;
    Rig.healthBarG.src = './client/img/player/healthbar_green.png';
    Rig.healthBarG.onload = function() {loadedassets++;};
    Rig.healthBarR.src = './client/img/monster/healthbar_red.png';
    Rig.healthBarR.onload = function() {loadedassets++;};
    // players
    for (var i in Player.animations) {
        if (i == 'hair') {
            for (var j in Player.animations[i]) {
                // totalassets++;
                Player.animations[i][j].src = './client/img/player/playermap_' + i + j + '.png';
                Player.animations[i][j].onload = function() {loadedassets++;};
            }
        } else {
            totalassets++;
            Player.animations[i].src = './client/img/player/playermap_' + i + '.png';
            Player.animations[i].onload = function() {loadedassets++;};
        }
    }
    // monsters
    totalassets++;
    var request = new XMLHttpRequest();
    request.open('GET', './client/monster.json', true);
    request.onload = async function() {
        if (this.status >= 200 && this.status < 400) {
            var json = JSON.parse(this.response);
            Monster.types = json;
            loadedassets++;
            for (var i in Monster.types) {
                totalassets++;
                Monster.images[i] = new Image();
                Monster.images[i].src = './client/img/monster/' + i + '.png';
                Monster.images[i].onload = function() {loadedassets++;}
            }
        } else {
            console.error('Error: Server returned status ' + this.status);
            await sleep(1000);
            request.send();
        }
    };
    request.onerror = function(){
        console.error('There was a connection error. Please retry');
    };
    request.send();
    // projectiles
    totalassets++;
    var request = new XMLHttpRequest();
    request.open('GET', './client/projectile.json', true);
    request.onload = async function() {
        if (this.status >= 200 && this.status < 400) {
            var json = JSON.parse(this.response);
            Projectile.types = json;
            loadedassets++;
            for (var i in Projectile.types) {
                totalassets++;
                Projectile.images[i] = new Image();
                Projectile.images[i].src = './client/img/projectile/' + i + '.png';
                Projectile.images[i].onload = function() {loadedassets++;}
            }
        } else {
            console.error('Error: Server returned status ' + this.status);
            await sleep(1000);
            request.send();
        }
    };
    request.onerror = function(){
        console.error('There was a connection error. Please retry');
    };
    request.send();
};