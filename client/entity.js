// Copyright (C) 2021 Radioactive64

// entities
Entity = function(id, x, y) {
    var self = {
        id: id,
        x: x,
        y: y,
        xspeed: 0,
        yspeed: 0,
        width: 0,
        height: 0,
        rotation: 0,
        interpolationStage: 0,
        updated: true
    };

    self.update = function(x, y) {
        self.xspeed = (x-self.x)/4;
        self.yspeed = (y-self.y)/4;
        self.interpolationStage = 0;
        self.updated = true;
    };
    self.draw = function() {
        CTX.translate(self.x, self.y);
        CTX.rotate(self.angle);
        CTX.fillText('MISSING TEXTURE', 0, 0);
        CTX.rotate(-self.angle);
        CTX.translate(-self.x, -self.y);
        if (self.interpolationStage < 4) {
            self.x += self.xspeed;
            self.y += self.yspeed;
            self.interpolationStage++;
        }
    };

    return self;
};
Entity.update = function(data) {
    Player.update(data.players);
    Monster.update(data.monsters);
    Projectile.update(data.projectiles);
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
    entities = entities.sort(function(a, b) {return a.y - b.y;});
    for (var i in entities) {
        entities[i].draw();
    }
};

// rigs
Rig = function(id, x, y) {
    var self = new Entity(id, x, y);
    self.rawWidth = 0;
    self.rawHeight = 0;
    self.animationsCanvas = new OffscreenCanvas(1, 1);
    self.animations = self.animationsCanvas.getContext('2d');
    self.animationStage = 0;
    
    self.draw = function() {
        CTX.fillText('MISSING TEXTURE', self.x, self.y);
        if (self.interpolationStage < 4) {
            self.x += self.xspeed;
            self.y += self.yspeed;
            self.interpolationStage++;
        }
    };

    return self;
};

// players
Player = function(id, x, y) {
    var self = new Rig(id, x, y);
    self.animationsCanvas.width = 192;
    self.animationsCanvas.height = 16;
    var badImage = new Image();
    badImage.src = './client/img/player/worseimage.png';
    badImage.onload = function() {
        self.animations.drawImage(badImage, 0, 0);
    }

    self.draw = function () {
        CTX.drawImage(self.animationsCanvas, self.animationStage*8, 0, 8, 16, self.x-16, self.y-48, 32, 64);
        if (self.interpolationStage < 4) {
            self.x += self.xspeed;
            self.y += self.yspeed;
            self.interpolationStage++;
        }
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
            Player.list[data[i].id].update(data[i].x, data[i].y);
        } else {
            new Player(data[i].id, data[i].x, data[i].y);
            Player.list[data[i].id].update(data[i].x, data[i].y);
        }
    }
    for (var i in Player.list) {
        if (Player.list[i].updated == false) {
            delete Player.list[i];
        }
    }
};
Player.list = [];

// monsters
Monster = function(id, type, x, y) {
    var self = new Rig(id, x, y);
    var tempmonster = Monster.types[type];
    self.type = type;
    self.width = tempmonster.width;
    self.height = tempmonster.height;
    self.rawWidth = tempmonster.rawWidth;
    self.rawHeight = tempmonster.rawHeight;
    var animationimg = new Image();
    animationimg.src = './client/img/monster/' + self.type + '.png';
    animationimg.onload = function() {
        self.animationsCanvas.width = animationimg.width;
        self.animationsCanvas.height = animationimg.height;
        self.animations.drawImage(animationimg, 0, 0);
    }

    self.draw = function () {
        CTX.drawImage(self.animationsCanvas, self.animationStage*self.rawWidth, 0, self.rawWidth, self.rawHeight, self.x-self.width/2, self.y-self.height/2, self.width, self.height);
        if (self.interpolationStage < 4) {
            self.x += self.xspeed;
            self.y += self.yspeed;
            self.interpolationStage++;
        }
    };

    Monster.list[self.id] = self;
};
Monster.update = function(data) {
    for (var i in Monster.list) {
        Monster.list[i].updated = false;
    }
    for (var i in data) {
        if (Monster.list[data[i].id]) {
            Monster.list[data[i].id].update(data[i].x, data[i].y);
        } else {
            new Monster(data[i].id, data[i].type, data[i].x, data[i].y);
            Monster.list[data[i].id].update(data[i].x, data[i].y);
        }
    }
    for (var i in Monster.list) {
        if (Monster.list[i].updated == false) {
            delete Monster.list[i];
        }
    }
};
$.getJSON('./client/monster.json', function(data) {
    Monster.types = data;
});
Monster.list = [];

// projectiles
Projectile = function(id, type, x, y) {
    var self = new Entity(id, x, y);
    self.angle = 0;
    var tempprojectile = Projectile.types[type];
    self.type = type;
    self.width = tempprojectile.width;
    self.height = tempprojectile.height;
    self.rawWidth = tempprojectile.rawWidth;
    self.rawHeight = tempprojectile.rawHeight;
    self.animationsCanvas = new OffscreenCanvas(1, 1);
    self.animations = self.animationsCanvas.getContext('2d');
    self.animationStage = 0;
    var animationimg = new Image();
    animationimg.src = './client/img/projectile/' + self.type + '.png';
    animationimg.onload = function() {
        self.animationsCanvas.width = animationimg.width;
        self.animationsCanvas.height = animationimg.height;
        self.animations.drawImage(animationimg, 0, 0);
    }

    self.update = function(x, y, angle) {
        self.xspeed = (x-self.x)/4;
        self.yspeed = (y-self.y)/4;
        self.interpolationStage = 0;
        self.angle = angle;
        self.updated = true;
    };
    self.draw = function() {
        CTX.save();
        CTX.translate(self.x, self.y);
        CTX.rotate(self.angle);
        CTX.drawImage(self.animationsCanvas, self.animationStage*self.rawWidth, 0, self.rawWidth, self.rawHeight, -self.width/2, -self.height/2, self.width, self.height);
        // CTX.drawImage(self.animationsCanvas, self.animationStage*self.rawWidth, 0, self.rawWidth, self.rawHeight, 0-self.width/2, 0-self.height/2, self.width, self.height);
        CTX.restore();
        if (self.interpolationStage < 4) {
            self.x += self.xspeed;
            self.y += self.yspeed;
            self.interpolationStage++;
        }
    };

    Projectile.list[self.id] = self;
};
Projectile.update = function(data) {
    for (var i in Projectile.list) {
        Projectile.list[i].updated = false;
    }
    for (var i in data) {
        if (Projectile.list[data[i].id]) {
            Projectile.list[data[i].id].update(data[i].x, data[i].y, data[i].angle);
        } else {
            new Projectile(data[i].id, data[i].type, data[i].x, data[i].y);
            Projectile.list[data[i].id].update(data[i].x, data[i].y, data[i].angle);
        }
    }
    for (var i in Projectile.list) {
        if (Projectile.list[i].updated == false) {
            delete Projectile.list[i];
        }
    }
};
$.getJSON('./client/projectile.json', function(data) {
    Projectile.types = data;
});
Projectile.list = [];