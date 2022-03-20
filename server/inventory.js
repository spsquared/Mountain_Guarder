// Copyright (C) 2022 Radioactive64

Inventory = function(socket, player) {
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
        var valid = false;
        if (typeof data == 'object') if (data.data && data.action) valid = true;
        if (valid) {
            switch (data.action) {
                case 'drag':
                    self.dragItem(data.data.slot, data.data.newSlot);
                    break;
                case 'drop':
                    self.dropItem(data.data.slot);
                    break;
                default:
                    error('Invalid item action ' + data.action);
                    break;
            }
        } else {
            insertChat(player.name + ' was kicked for socket.emit', 'anticheat');
            socket.emit('disconnected');
            player.socket.onevent = function(packet) {};
            player.socket.disconnect();
        }
    });
    self.addItem = function(id) {
        if (self.items.length < self.maxItems) {
            var slot = new Inventory.Item(id, self.items).slot;
            self.refreshItem(slot);
        } else {
            var angle = Math.random()*2*Math.PI;
            var distance = Math.random()*32;
            var x = player.x+Math.cos(angle)*distance;
            var y = player.y+Math.sin(angle)*distance;
            new DroppedItem(player.map, x, y, id, []);
        }
        return slot;
    };
    self.removeItem = function(slot) {
        if (typeof slot == 'number') {
            delete self.items[slot];
        } else {
            delete self.equips[slot];
        }
        self.refreshItem(slot);
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
    self.full = function() {
        if (self.items.length < self.maxItems) return false;
        return true;
    };
    self.refreshItem = function(slot) {
        if (typeof slot == 'number') {
            if (self.items[slot]) {
                self.items[slot].refresh();
                socket.emit('item', {
                    action: 'add',
                    data: self.items[slot].getData()
                });
            } else {
                socket.emit('item', {
                    action: 'remove',
                    data: {
                        slot: slot
                    }
                });
            }
        } else {
            if (self.equips[slot]) {
                self.equips[slot].refresh();
                socket.emit('item', {
                    action: 'add',
                    data: self.equips[slot].getData()
                });
            } else {
                socket.emit('item', {
                    action: 'remove',
                    data: {
                        slot: slot
                    }
                });
            }
            player.updateStats();
        }
    };
    self.enchantItem = function(slot, enchantment) {
        if (typeof slot == 'number') {
            self.items[slot].enchant(enchantment);
        } else {
            self.equips[slot].enchant(enchantment);
        }
        self.refreshItem(slot);
    };
    self.dragItem = function(slot, newslot) {
        var item1, item2;
        var slot1 = false, slot2 = false;
        if (typeof slot == 'number') slot1 = true;
        if (typeof newslot == 'number') slot2 = true;
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
                player.updateStats();
            }
            if (slot2) {
                self.items[newslot] = item1;
            } else {
                self.equips[newslot] = item1;
                player.updateStats();
            }
        }
        self.refreshItem(slot);
        self.refreshItem(newslot);
    };
    self.dropItem = function(slot) {
        var item;
        if (typeof slot == 'number') {
            item = self.items[slot];
        } else {
            item = self.equips[slot];
        }
        if (item) {
            var attempts = 0;
            var dropx, dropy;
            while (attempts < 100) {
                var angle = Math.random()*2*Math.PI;
                var distance = Math.random()*32;
                var x = player.x+Math.cos(angle)*distance;
                var y = player.y+Math.sin(angle)*distance;
                var collisions = [];
                if (Collision.grid[self.map]) {
                    for (var checkx = self.gridx-1; checkx <= self.gridx+1; checkx++) {
                        for (var checky = self.gridy-1; checky <= self.gridy+1; checky++) {
                            if (Collision.grid[self.map][checky]) if (Collision.grid[self.map][checky][checkx])
                            collisions.push(Collision.getColEntity(self.map, checkx, checky));
                        }
                    }
                }
                var colliding = false;
                for (var i in collisions) {
                    for (var j in collisions[i]) {
                        var bound1left = x-24;
                        var bound1right = x+24;
                        var bound1top = y-24;
                        var bound1bottom = y+24;
                        var bound2left = collisions[i][j].x-(collisions[i][j].width/2);
                        var bound2right = collisions[i][j].x+(collisions[i][j].width/2);
                        var bound2top = collisions[i][j].y-(collisions[i][j].height/2);
                        var bound2bottom = collisions[i][j].y+(collisions[i][j].height/2);
                        if (bound1left < bound2right && bound1right > bound2left && bound1top < bound2bottom && bound1bottom > bound2top) {
                            colliding = true;;
                        }
                    }
                }
                if (!colliding) {
                    dropx = x;
                    dropy = y;
                    break;
                }
                attempts++;
            }
            if (dropx) {
                new DroppedItem(player.map, dropx, dropy, item.id, item.enchantments);
                self.removeItem(item.slot);
            }
        }
    };
    self.getSaveData = function() {
        try {
            var pack = {
                items: [],
                equips: []
            };
            for (var i in self.items) {
                var localitem = self.items[i];
                if (localitem != null) {
                    pack.items.push({
                        id: localitem.id,
                        slot: localitem.slot,
                        enchantments: localitem.enchantments
                    });
                }
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
            console.error(err);
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
    var self = Object.create(Inventory.items[id]);
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