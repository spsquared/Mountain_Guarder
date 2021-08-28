// Copyright (C) 2021 Radioactive64

$.ajaxSetup({cache: true, async:false});

// canvas scaling and pixelation
var dpr = 1;
if (window.devicePixelRatio) {
    dpr = window.devicePixelRatio;
}

window.onresize = function() {
    if (window.devicePixelRatio) {
        dpr = window.devicePixelRatio;
    }
    resetCanvases();
};
function resetCanvas(ctx) {
    ctx.getContext('2d').imageSmoothingEnabled = false;
    ctx.getContext('2d').webkitImageSmoothingEnabled = false;
    ctx.getContext('2d').mozImageSmoothingEnabled = false;
};
function resetCanvases() {
    LAYERS.map0.width = window.innerWidth*dpr;
    LAYERS.map0.height = window.innerHeight*dpr;
    LAYERS.mlower.scale(dpr, dpr);
    resetCanvas(LAYERS.map0);
    LAYERS.entity0.width = window.innerWidth*dpr;
    LAYERS.entity0.height = window.innerHeight*dpr;
    LAYERS.elower.scale(dpr, dpr);
    resetCanvas(LAYERS.entity0);
    LAYERS.map1.width = window.innerWidth*dpr;
    LAYERS.map1.height = window.innerHeight*dpr;
    LAYERS.mupper.scale(dpr, dpr);
    resetCanvas(LAYERS.map1);
    LAYERS.entity1.width = window.innerWidth*dpr;
    LAYERS.entity1.height = window.innerHeight*dpr;
    LAYERS.eupper.scale(dpr, dpr);
    resetCanvas(LAYERS.entity1);
    CTXRAW.width = window.innerWidth*dpr;
    CTXRAW.height = window.innerHeight*dpr;
    CTX.scale(dpr, dpr);
    resetCanvas(CTXRAW);
    for (var i in MAPS) {
        resetCanvas(MAPS[i]);
    }
};
resetCanvases();

// random preventions
document.querySelectorAll("input").forEach(function(item) {if (item.type != 'text' && item.type != 'password') {item.addEventListener('focus', function() {this.blur();});}});
document.querySelectorAll("button").forEach(function(item) {item.addEventListener('focus', function() {this.blur();});});
document.addEventListener('contextmenu', function(e) {e.preventDefault()});

window.onerror = function() {
    // insert to chat
}