// Copyright (C) 2021 Radioactive64

var inventoryItems = document.getElementById('inventoryItemsBody');
var inventoryEquips = document.getElementById('inventoryEquipsBody');

// inventory structure
Inventory = {
    items: [],
    equips: {
        weapon: null,
        weapon2: null,
        helmet: null,
        armor: null,
        boots: null,
        offhand: null,
        key: null,
        crystal: null,
    },
    currentDrag: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
    currentHover: null
};
Inventory.Item = function(id, slot) {
    var self = Inventory.itemTypes[id];
    self.id = id;
    self.slot = slot;
    self.enchantments = [];
    self.refresh = function() {
        Inventory.items[self.slot].refresh();
    };
    self.enchant = function(enchantments) {
        // set enchant html string (<span style="color: #009900">Speed +10%</span>)
    };

    if (isFinite(slot)) {
        Inventory.items[slot].item = self;
    } else {
        Inventory.equips[slot].item = self;
    }
    return self;
};
Inventory.Slot = function() {
    var slot = document.createElement('div');
    slot.className = 'invSlot';
    var self = {
        slotId: Inventory.items.length,
        item: null,
        mousedOver: false
    };

    self.refresh = function() {
        if (self.item) {
            slot.innerHTML = '<img src="./client/img/item/' + self.item.id + '.png" class="invSlotImg"></img>';
        } else {
            slot.innerHTML = '<img src="./client/img/item/empty.png" class="invSlotImgNoGrab"></img>';
        }
    };
    slot.onmouseover = function(e) {
        self.mousedOver = true;
        if (self.item) {
            Inventory.currentHover = self.slotId;
        }
    };
    slot.onmouseout = function(e) {
        self.mousedOver = false;
        Inventory.currentHover = null;
    };

    inventoryItems.appendChild(slot);
    Inventory.items.push(self);
    self.refresh();
    return self;
};
Inventory.EquipSlot = function(equip) {
    var slot = document.createElement('div');
    slot.id = 'invSlotEquip' + equip;
    slot.className = 'invSlot';
    var self = {
        slotId: equip,
        item: null,
        mousedOver: false
    };

    self.refresh = function() {
        if (self.item) {
            slot.innerHTML = '<img src="./client/img/item/' + self.item.id + '.png" class="invSlotImg"></img>';
        } else {
            slot.innerHTML = '<img src="./client/img/item/emptySlot' + self.slotId + '.png" class="invSlotImgNoGrab"></img>';
        }
    };
    slot.onmouseover = function(e) {
        self.mousedOver = true;
        if (self.item) {
            Inventory.currentHover = self.slotId;
        }
    };
    slot.onmouseout = function(e) {
        self.mousedOver = false;
        Inventory.currentHover = null;
    };

    inventoryEquips.appendChild(slot);
    Inventory.equips[self.slotId] = self;
    self.refresh();
    return self;
};
Inventory.addItem = function(id, slot, enchantments) {
    var item = new Inventory.Item(id, slot);
    item.enchant(enchantments);
    Inventory.refreshSlot(slot);
};
Inventory.removeItem = function(slot) {
    if (isFinite(slot)) {
        Inventory.items[slot].item = null;
    } else {
        Inventory.equips[slot].item = null;
    }
    Inventory.refreshSlot(slot);
};
Inventory.refreshSlot = function(slot) {
    if (isFinite(slot)) {
        Inventory.items[slot].refresh();
    } else {
        Inventory.equips[slot].refresh();
    }
};
Inventory.enchantSlot = function(slot, enchantments) {
    if (isFinite(slot)) {
        Inventory.items[slot].enchant(enchantments);
    } else {
        Inventory.equips[slot].enchant(enchantments);
    }
    Inventory.refreshSlot(slot);
};
Inventory.startDrag = function(slot) {
    Inventory.currentDrag = slot;
    document.getElementById('invDragImg').style.display = 'block';
    if (isFinite(slot)) {
        document.getElementById('invDragImg').src = './client/img/item/' + Inventory.items[slot].item.id + '.png';
    } else {
        document.getElementById('invDragImg').src = './client/img/item/' + Inventory.equips[slot].item.id + '.png';
    }
};
Inventory.endDrag = function(slot) {
    socket.emit('item', {
        action: 'drag',
        data: {
            slot: Inventory.currentDrag,
            newSlot: slot
        }
    });
    Inventory.currentDrag = null;
};
document.addEventListener('mousedown', function(e) {
    for (var i in Inventory.items) {
        if (Inventory.items[i].mousedOver) {
            document.getElementById('invDragImg').style.left = e.clientX-32 + 'px';
            document.getElementById('invDragImg').style.top = e.clientY-32 + 'px';
            if (Inventory.items[i].item) Inventory.startDrag(Inventory.items[i].slotId);
        }
    }
    for (var i in Inventory.equips) {
        if (Inventory.equips[i].mousedOver) {
            document.getElementById('invDragImg').style.left = e.clientX-32 + 'px';
            document.getElementById('invDragImg').style.top = e.clientY-32 + 'px';
            if (Inventory.equips[i].item) Inventory.startDrag(Inventory.equips[i].slotId);
        }
    }
});
document.addEventListener('mouseup', function(e) {
    if (Inventory.currentDrag != null) {
        document.getElementById('invDragImg').style.display = '';
        document.getElementById('invDragImg').src = './client/img/item/empty.png';
        setTimeout(function() {
            for (var i in Inventory.items) {
                if (Inventory.items[i].mousedOver) {
                    Inventory.endDrag(Inventory.items[i].slotId);
                    return;
                }
            }
            for (var i in Inventory.equips) {
                if (Inventory.equips[i].mousedOver) {
                    Inventory.endDrag(Inventory.equips[i].slotId);
                    return;
                }
            }
            Inventory.endDrag(Inventory.currentDrag);
        }, 5);
    }
});
document.addEventListener('mousemove', function(e) {
    if (Inventory.currentDrag != null) {
        document.getElementById('invDragImg').style.left = e.clientX-32 + 'px';
        document.getElementById('invDragImg').style.top = e.clientY-32 + 'px';
    }
    if (Inventory.currentHover != null && Inventory.currentDrag == null) {
        document.getElementById('invHoverTooltip').style.opacity = 1;
        // document.getElementById('invHoverTooltip').style.left = e.clientX + 'px';
        // document.getElementById('invHoverTooltip').style.top = e.clientY + 'px';
    } else {
        document.getElementById('invHoverTooltip').style.opacity = 0;
    }
});
Inventory.itemTypes = [];
function loadInventoryData() {
    totalassets++;
    var request = new XMLHttpRequest();
    request.open('GET', './client/item.json', true);
    request.onload = async function() {
        if (this.status >= 200 && this.status < 400) {
            var json = JSON.parse(this.response);
            Inventory.itemTypes = json;
            loadedassets++;
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

// io
socket.on('item', function(data) {
    switch (data.action) {
        case 'add':
            Inventory.addItem(data.data.id, data.data.slot, data.data.enchantments);
            break;
        case 'remove':
            Inventory.removeItem(data.data.slot);
            break;
        default:
            console.error('Invalid item action ' + data.action);
            break;
    }
});

for (var i in Inventory.equips) {
    new Inventory.EquipSlot(i);
}
for (var i = 0; i < 30; i++) {
    new Inventory.Slot();
}