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
            shield: null,
            key: null,
            crystal: null
        },
        maxItems: 30
    };
    self.items.length = self.maxItems;
    for (var i in self.items) {
        self.items[i] = null;
    }

    socket.on('item', function(data) {
        var valid = false;
        if (typeof data == 'object' && data != null) if (typeof data.data == 'object' && data.data != null && data.action != null) valid = true;
        if (valid) {
            switch (data.action) {
                case 'drag':
                    self.dragItem(data.data.slot, data.data.newSlot);
                    break;
                case 'drop':
                    self.dropItem(data.data.slot, data.data.amount);
                    break;
                case 'swap':
                    self.dragItem('weapon', 'weapon2');
                    break;
                default:
                    error('Invalid item action ' + data.action);
                    break;
            }
        } else {
            player.socketKick();
        }
    });
    self.addItem = function(id, amount, enchantments) {
        if (!self.full()) {
            var newitem = new Inventory.Item(id, self.items, amount || 1, enchantments || []);
            if (newitem.overflow) {
                var angle = Math.random()*2*Math.PI;
                var distance = Math.random()*32;
                var x = player.x+Math.cos(angle)*distance;
                var y = player.y+Math.sin(angle)*distance;
                new DroppedItem(player.map, x, y, id, enchantments || [], newitem.overflow);
            }
            for (var i in newitem.modifiedSlots) {
                self.refreshItem(newitem.modifiedSlots[i]);
            }
            if (newitem.overflow) return newitem.overflow;
            return newitem.modifiedSlots[newitem.modifiedSlots.length-1];
        } else {
            var angle = Math.random()*2*Math.PI;
            var distance = Math.random()*32;
            var x = player.x+Math.cos(angle)*distance;
            var y = player.y+Math.sin(angle)*distance;
            return new DroppedItem(player.map, x, y, id, enchantments || [], amount);
        }
    };
    self.removeItem = function(slot, amount) {
        if (typeof slot == 'number') {
            if (self.items[slot]) {
                self.items[slot].stackSize -= amount || 1;
                if (self.items[slot].stackSize < 1) delete self.items[slot];
            }
        } else {
            if (self.equips[slot]) {
                self.equips[slot].stackSize -= amount || 1;
                if (self.equips[slot].stackSize < 1) delete self.equips[slot];
            }
        }
        self.refreshItem(slot);
    };
    self.refresh = function() {
        for (var i = 0; i < self.maxItems; i++) {
            self.refreshItem(parseInt(i));
            if (self.items[i] == null) self.items[i] = null;
        }
        for (var i in self.items) {
            if (i >= self.maxItems) {
                self.dropItem(parseInt(i));
            }
        }
        for (var i in self.equips) {
            self.refreshItem(i);
        }
    };
    self.full = function() {
        for (var i = 0; i < self.maxItems; i++) {
            if (self.items[i] == null) return false;
            else if (self.items[i].stackSize < self.items[i].maxStackSize) return false;
        }
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
        if (slot != newslot) {
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
                var switchItems = true;
                if (item1 && item2) if (item1.id == item2.id && item1.stackSize < item1.maxStackSize) {
                    var enchantsSame = true;
                    for (var j in item1.enchantments) {
                        var enchantfound = false;
                        for (var k in item2.enchantments) {
                            if (item1.enchantments[j].id == item2.enchantments[k].id) if (item1.enchantments[j].level == item2.enchantments[k].level) enchantfound = true;
                        }
                        if (enchantfound == false) enchantsSame = false;
                    }
                    if (enchantsSame) {
                        var size = item2.stackSize;
                        item2.stackSize = Math.min(item2.maxStackSize, item2.stackSize+item1.stackSize);
                        item1.stackSize = Math.max(0, item1.stackSize-(item2.stackSize-size));
                        if (item1.stackSize <= 0) {
                            if (slot1) {
                                self.items[slot] = null;
                            } else {
                                self.equips[slot] = null;
                            }
                            switchItems = false;
                        }
                    }
                }
                if (switchItems) {
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
            }
            self.refreshItem(slot);
        }
        self.refreshItem(newslot);
    };
    self.dropItem = function(slot, amount) {
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
                            colliding = true;
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
                new DroppedItem(player.map, dropx, dropy, item.id, item.enchantments, amount);
                self.removeItem(item.slot, amount);
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
                    pack.items.push(localitem.getData());
                }
            }
            for (var i in self.equips) {
                var localitem = self.equips[i];
                if (localitem != null) {
                    pack.equips.push(localitem.getData());
                }
            }
            return pack;
        } catch (err) {
            console.error(err);
        }
    };
    self.loadSaveData = function(items) {
        if (typeof items == 'object' && items != null) {
            try {
                socket.emit('item', {
                    action: 'maxItems',
                    slots: self.maxItems
                });
                for (var i in items.items) {
                    var localitem = items.items[i];
                    if (localitem) {
                        var newitem = new Inventory.Item(localitem.id, [null], localitem.stackSize, localitem.enchantments);
                        if (typeof newitem == 'object') {
                            newitem.slot = parseInt(localitem.slot);
                            self.items[newitem.slot] = newitem;
                        }
                    }
                }
                for (var i in items.equips) {
                    var localitem = items.equips[i];
                    if (localitem) {
                        var newitem = new Inventory.Item(localitem.id, [null], localitem.stackSize, localitem.enchantments);
                        if (typeof newitem == 'object') {
                            newitem.slot = localitem.slot;
                            self.equips[newitem.slot] = newitem;
                        }
                    }
                }
            } catch(err) {
                error(err);
            }
        }
    };

    return self;
};
Inventory.Item = function(id, list, amount, enchantments) {
    if (Inventory.items[id] == null) {
        id = 'missing';
    }
    var self = cloneDeep(Inventory.items[id]);
    self.id = id;
    self.slot = 0;
    self.stackSize = 0;
    self.overflow = amount || 1;
    while (true) {
        if (list[self.slot] == null) break;
        self.slot++;
    }
    self.modifiedSlots = [];
    for (var i in list) {
        if (list[i]) if (list[i].id == self.id && list[i].stackSize < list[i].maxStackSize) {
            var enchantsSame = true;
            for (var j in list[i].enchantments) {
                var enchantfound = false;
                for (var k in enchantments) {
                    if (list[i].enchantments[j].id == enchantments[k].id) if (list[i].enchantments[j].level == enchantments[k].level) enchantfound = true;
                }
                if (enchantfound == false) enchantsSame = false;
            }
            if (enchantsSame) {
                var size = list[i].stackSize;
                list[i].stackSize = Math.min(list[i].maxStackSize, list[i].stackSize+self.overflow);
                self.overflow = Math.max(0, self.overflow-(list[i].stackSize-size));
                self.modifiedSlots.push(parseInt(i));
                if (self.overflow == 0) return {
                    modifiedSlots: self.modifiedSlots
                };
            }
        }
    }
    if (self.slot >= list.length) {
        return {
            overflow: self.overflow,
            modifiedSlots: self.modifiedSlots
        };
    }
    self.modifiedSlots.push(self.slot);
    self.stackSize = Math.min(self.overflow, self.maxStackSize);
    self.overflow -= Math.min(self.overflow, self.maxStackSize);
    if (self.overflow) {
        try {
            list[self.slot] = self;
            var newitem = new Inventory.Item(id, list, self.overflow, enchantments);
            self.modifiedSlots = self.modifiedSlots.concat(newitem.modifiedSlots);
            self.overflow = newitem.overflow;
        } catch (err) {
            error(err);
            return {
                overflow: self.overflow,
                modifiedSlots: self.modifiedSlots
            };
        }
    }
    self.enchantments = enchantments || [];

    self.getData = function() {
        return {
            id: self.id,
            slot: self.slot,
            enchantments: self.enchantments,
            stackSize: self.stackSize
        };
    };
    self.refresh = function() {
        if (self.stackSize > self.maxStackSize) error('Stack Overflow (no not that one)');
    };
    self.enchant = function(enchantment) {
        self.enchantments.push(enchantment);
    };

    self.refresh();
    list[self.slot] = self;
    return self;
};
Inventory.items = require('./item.json');
Inventory.enchantments = null;