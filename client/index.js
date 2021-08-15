// Copyright (C) 2021 Radioactive64

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
function resetCanvases() {
    LAYERS.map0.width = window.innerWidth*dpr;
    LAYERS.map0.height = window.innerHeight*dpr;
    LAYERS.mlower.scale(dpr, dpr);
    LAYERS.entity0.width = window.innerWidth*dpr;
    LAYERS.entity0.height = window.innerHeight*dpr;
    LAYERS.elower.scale(dpr, dpr);
    LAYERS.map1.width = window.innerWidth*dpr;
    LAYERS.map1.height = window.innerHeight*dpr;
    LAYERS.mupper.scale(dpr, dpr);
    LAYERS.entity1.width = window.innerWidth*dpr;
    LAYERS.entity1.height = window.innerHeight*dpr;
    LAYERS.eupper.scale(dpr, dpr);
    CTXRAW.width = window.innerWidth;
    CTXRAW.height = window.innerHeight;
    // CTX.scale(dpr, dpr);
    CTX.imageSmoothingEnabled = false;
    CTX.webkitImageSmoothingEnabled = false;
    CTX.mozImageSmoothingEnabled = false;
};
resetCanvases();