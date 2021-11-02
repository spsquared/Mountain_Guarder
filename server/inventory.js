// Copyright (C) 2021 Radioactive64

Inventory = function(socket) {
    var self = {
        items: [],
        equips: {
            weapon: null,
            weapon2: null,
            helmet: null,
            armor: null,
            boots: null,
            offhand: null,
            key: null,
            crystal: null
        }
    };

    socket.on('item', function(data) {
        switch (data.action) {
            case 'drag':
                self.dragItem(data.data.slot, data.data.newSlot);
                break;
            default:
                error('Invalid item action ' + data.action);
                break;
        }
    });
    self.addItem = function(id) {
        var slot = new Inventory.Item(id, self.items).slot;
        self.refreshItem(slot);
    };
    self.removeItem = function(slot) {
        if (isFinite(slot)) {
            delete self.items[slot];
        } else {
            delete self.equips[slot];
        }
        socket.emit('item', {
            action: 'remove',
            data: {
                slot: slot
            }
        });
    };
    self.refreshItem = function(slot) {
        if (isFinite(slot)) {
            if (self.items[slot]) {
                self.items[slot].refresh();
                socket.emit('item', {
                    action: 'add',
                    data: self.items[slot].getData()
                });
            } else {
                self.removeItem(slot);
            }
        } else {
            if (self.equips[slot]) {
                self.equipItem(slot, self.equips[slot]);
                self.equips[slot].refresh();
                socket.emit('item', {
                    action: 'add',
                    data: self.equips[slot].getData()
                });
            } else {
                self.removeItem(slot);
            }
        }
    };
    self.enchantItem = function(slot, enchantment) {
        if (isFinite(slot)) {
            self.items[slot].enchant(enchantment);
        } else {
            self.equips[slot].enchant(enchantment);
        }
        self.refreshItem(slot);
    };
    self.dragItem = function(slot, newslot) {
        var item1, item2;
        var slot1 = false, slot2 = false;
        if (isFinite(slot)) slot1 = true;
        if (isFinite(newslot)) slot2 = true;
        if (slot1) {
            item1 = self.items[slot];
        } else {
            item1 = self.equips[slot];
        }
        if (slot2) {
            item2 = self.items[newslot];
        } else {
            item2 = self.equips[newslot];
        }
        if (item1) item1.slot = newslot;
        if (item2) item2.slot = slot;
        if (slot1) {
            self.items[slot] = item2;
        } else {
            self.equips[slot] = item2;
        }
        if (slot2) {
            self.items[newslot] = item1;
        } else {
            self.equips[newslot] = item1;
        }
        self.refreshItem(slot);
        self.refreshItem(newslot);
    };
    self.equipItem = function(slot, item) {

    };

    return self;
};
Inventory.Item = function(id, list) {
    var self = Inventory.items[id];
    self.id = id;
    self.slot = 0;
    while (true) {
        if (list[self.slot] == null) break;
        self.slot++;
    }
    self.enchantments = [];

    self.getData = function() {
        return {
            id: self.id,
            slot: self.slot,
            enchantments: self.enchantments
        };
    };
    self.refresh = function() {
        // refresh or something
    };
    self.enchant = function(enchantment) {
        self.enchantments.push(enchantment);
    };

    self.refresh();
    list[self.slot] = self;
    return self;
};
Inventory.items = require('./item.json');