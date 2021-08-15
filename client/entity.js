// Copyright (C) 2021 Radioactive64

// entities
Entity = function(id) {
    var self = {
        id: id,
        x: 0,
        y: 0,
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
Entity.draw = function() {
    // sort through entities and draw them according from lowest y value to highest
};

// rigs
Rig = function() {
    var self = new Entity();
    
    self.draw = function() {
        ctx.fillText('MISSING TEXTURE', self.x, self.y);
        if (self.interpolationStage < 4) {
            self.x += self.xspeed;
            self.y += self.yspeed;
            self.interpolationStage++;
        }
    };

    return self;
};

// players
Player = function(id) {
    var self = new Rig();
    self.id = id;
    self.animationsCanvas = new OffscreenCanvas(192, 16);
    self.animations = self.animationsCanvas.getContext('2d');
    self.animationStage = 0;

    var badImage = new Image();
    badImage.src = './client/img/player/worseimage.png';
    self.animations.drawImage(badImage, 0, 0);

    self.draw = function () {
        CTX.drawImage(badImage, self.animationStage*8, 0, 8, 16, self.x-16, self.y-48, 32, 64);
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
            new Player(data[i].id);
            Player.list[data[i].id].update(data[i].x, data[i].y);
        }
    }
    for (var i in Player.list) {
        if (Player.list[i].updated == false) {
            delete Player.list[i];
        }
    }
};
Player.draw = function() {
    for (var i in Player.list) {
        Player.list[i].draw();
    }
};
Player.list = [];