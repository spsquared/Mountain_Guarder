// Copyright (C) 2021 Radioactive64

// window creator
DraggableWindow = function(id) {
    var self = {
        x: 0,
        y: 0,
        offsetX: 0,
        offsetY: 0,
        dragging: false,
        window: document.getElementById(id),
        windowBar: document.getElementById(id + 'Bar'),
        windowClose: document.getElementById(id + 'Close')
    };
    self.renderWindow = function() {
        self.window.style.left = self.x + 'px';
        self.window.style.top = self.y + 'px';
    };
    self.windowBar.onmousedown = function(e) {
        self.offsetX = e.pageX - self.x;
        self.offsetY = e.pageY - self.y;
        self.dragging = true;
    };
    document.addEventListener('mousemove', function(e) {
        if (self.dragging) {
            self.x = Math.min(Math.max(e.pageX-self.offsetX, 0), window.innerWidth-902);
            self.y = Math.min(Math.max(e.pageY-self.offsetY, 0), window.innerHeight-603);
            self.renderWindow();
        }
    });
    document.addEventListener('mouseup', function() {
        self.dragging = false;
    });
    self.windowClose.onclick = function() {
        self.hide();
    };
    self.hide = function() {
        self.window.style.display = 'none';
    };
    self.show = function() {
        self.window.style.display = 'block';
    };

    return self;
};