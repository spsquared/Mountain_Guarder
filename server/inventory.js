// Copyright (C) 2021 Radioactive64

Inventory = function(socket, id) {
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
        },
        maxItems: 30
    };

    socket.on('item', function(data) {
        if (data) {
            switch (data.action) {
                case 'drag':
                    self.dragItem(data.data.slot, data.data.newSlot);
                    break;
                default:
                    error('Invalid item action ' + data.action);
                    break;
            }
        } else {
            insertChat(Player.list[id].name + ' was kicked for socket.emit', 'anticheat');
            socket.emit('disconnected');
        }
    });
    self.addItem = function(id) {
        if (self.items.length < self.maxItems) {
            var slot = new Inventory.Item(id, self.items).slot;
            self.refreshItem(slot);
        } else {
            // if directly injected drop the items
        }
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
    self.refresh = function() {
        for (var i in self.items) {
            self.refreshItem(i);
            if (i > self.maxItems) {
                // drop the item
            }
        }
        for (var i in self.equips) {
            self.refreshItem(i);
        }
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
        var valid = true;
        if (slot1 == false && item2) {
            var dragslot = slot;
            if (slot == 'weapon2') dragslot = 'weapon';
            if (item2.slotType != dragslot) valid = false;
        }
        if (slot2 == false && item1) {
            var dragslot = newslot;
            if (newslot == 'weapon2') dragslot = 'weapon';
            if (item1.slotType != dragslot) valid = false;
        }
        if (valid) {
            if (item1) item1.slot = newslot;
            if (item2) item2.slot = slot;
            if (slot1) {
                self.items[slot] = item2;
            } else {
                self.equips[slot] = item2;
                Player.list[id].updateStats();
            }
            if (slot2) {
                self.items[newslot] = item1;
            } else {
                self.equips[newslot] = item1;
                Player.list[id].updateStats();
            }
        }
        self.refreshItem(slot);
        self.refreshItem(newslot);
    };
    self.getSaveData = function() {
        try {
            var pack = {
                items: [],
                equips: []
            };
            for (var i in self.items) {
                var localitem = self.items[i];
                pack.items.push({
                    id: localitem.id,
                    slot: localitem.slot,
                    enchantments: localitem.enchantments
                });
            }
            for (var i in self.equips) {
                var localitem = self.equips[i];
                if (localitem != null) {
                    pack.equips.push({
                        id: localitem.id,
                        slot: localitem.slot,
                        enchantments: localitem.enchantments
                    });
                }
            }
    
            return JSON.stringify(pack);
        } catch (err) {
            error(err);
        }
    };
    self.loadSaveData = function(data) {
        if (data) {
            try {
                var items = JSON.parse(data);
                socket.emit('item', {
                    action: 'maxItems',
                    slots: self.maxItems
                });
                for (var i in items.items) {
                    var localitem = items.items[i];
                    var newitem = new Inventory.Item(localitem.id, []);
                    newitem.slot = localitem.slot;
                    for (var j in localitem.enchantments) {
                        newitem.enchant(localitem.enchantments[j]);
                    }
                    self.items[localitem.slot] = newitem;
                }
                for (var i in items.equips) {
                    var localitem = items.equips[i];
                    var newitem = new Inventory.Item(localitem.id, []);
                    newitem.slot = localitem.slot;
                    for (var j in localitem.enchantments) {
                        newitem.enchant(localitem.enchantments[j]);
                    }
                    self.equips[localitem.slot] = newitem;
                }
                self.refresh();
            } catch(err) {
                error(err);
            }
        }
    };

    return self;
};
Inventory.Item = function(id, list) {
    if (Inventory.items[id] == null) {
        id = 'missing';
    }
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