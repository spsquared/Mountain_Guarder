// Copyright (C) 2023 Sampleprovider(sp)

Inventory = function(socket, player) {
    const self = {
        items: [],
        equips: {
            weapon: null,
            weapon2: null,
            helmet: null,
            armor: null,
            boots: null,
            shield: null,
            key: null,
            crystal: null,
            sell: null
        },
        maxItems: 30,
        cachedItem: null
    };
    self.items.length = self.maxItems;
    for (let i in self.items) {
        self.items[i] = null;
    }

    socket.on('item', function(data) {
        let valid = false;
        if (typeof data == 'object' && data != null && data.action != null) valid = true;
        if (valid) {
            switch (data.action) {
                case 'takeItem':
                    if (data.slot == 'sell' && self.equips['sell'] != null) socket.emit('item', {
                        action: 'itemvalue',
                        data: {
                            value: 0
                        }
                    });
                    self.takeItem(data.slot, data.amount);
                    break;
                case 'placeItem':
                    self.placeItem(data.slot, data.amount);
                    if (data.slot == 'sell' && self.equips['sell'] != null) socket.emit('item', {
                        action: 'itemvalue',
                        data: {
                            value: self.equips['sell'].value * self.equips['sell'].stackSize
                        }
                    });
                    break;
                case 'dropItem':
                    self.dropItem(data.slot, data.amount);
                    break;
                case 'swap':
                    if (self.equips['weapon'] && self.equips['weapon2']) {
                        const weapon = self.equips['weapon'];
                        const weapon2 = self.equips['weapon2'];
                        new Inventory.Item(weapon.id, self.equips, weapon.stackSize, weapon.enchantments, 'weapon2');
                        new Inventory.Item(weapon2.id, self.equips, weapon2.stackSize, weapon2.enchantments, 'weapon');
                        self.refreshItem('weapon');
                        self.refreshItem('weapon2');
                    }
                    break;
                case 'quickEquip':
                    self.quickEquipItem(data.slot);
                    break;
                case 'use':
                    self.useItem(data.slot);
                    break;
                case 'craft':
                    self.craftItem(data.slot);
                    break;
                default:
                    error('Invalid item action ' + data.action);
                    break;
            }
        } else {
            player.kick();
        }
    });
    self.addItem = function addItem(id, amount, enchantments, banner) {
        let newitem = new Inventory.Item(id, self.items, amount ?? 1, enchantments ?? []);
        if (newitem.overflow) {
            let angle = Math.random()*2*Math.PI;
            let distance = Math.random()*32;
            let x = player.x+Math.cos(angle)*distance;
            let y = player.y+Math.sin(angle)*distance;
            new DroppedItem(player.map, x, y, id, enchantments ?? [], newitem.overflow);
        }
        for (let i in newitem.modifiedSlots) {
            self.refreshItem(newitem.modifiedSlots[i]);
        }
        if (banner) socket.emit('item', {
            action: 'banner',
            data: {
                id: id,
                amount: amount-(newitem.overflow ?? 0),
            }
        });
        return newitem.overflow ?? 0;
    };
    self.removeItem = function removeItem(id, amount, banner) {
        amount = amount ?? 1;
        let totalRemoved = 0;
        let modifiedSlots = [];
        for (let i in self.items) {
            if (self.items[i] && self.items[i].id == id) {
                let removed = self.items[i].stackSize-Math.max(self.items[i].stackSize-amount, 0);
                self.items[i].stackSize -= removed;
                amount -= removed;
                if (self.items[i].stackSize < 1) self.items[i] = null;
                modifiedSlots.push(parseInt(i));
                totalRemoved += removed;
                if (amount <= 0) break;
            }
        }
        for (let i in modifiedSlots) {
            self.refreshItem(modifiedSlots[i]);
        }
        if (banner) socket.emit('item', {
            action: 'banner',
            data: {
                id: id,
                amount: -totalRemoved,
            }
        });
        return modifiedSlots;
    };
    self.removeItemSlot = function removeItemSlot(slot, amount, banner) {
        amount = amount ?? 1;
        let size = 0;
        let id;
        if (typeof slot == 'number') {
            if (self.items[slot]) {
                id = self.items[slot].id;
                self.items[slot].stackSize -= amount;
                size = Math.max(self.items[slot].stackSize, 0);
                if (self.items[slot].stackSize < 1) self.items[slot] = null;
            }
        } else {
            if (self.equips[slot]) {
                id = self.equips[slot].id;
                self.equips[slot].stackSize -= amount;
                size = Math.max(self.equips[slot].stackSize, 0);
                if (self.equips[slot].stackSize < 1) self.equips[slot] = null;
            }
        }
        self.refreshItem(slot);
        if (banner && id != undefined) socket.emit('item', {
            action: 'banner',
            data: {
                id: id,
                amount: -amount,
            }
        });
        return size;
    };
    self.contains = function contains(id, amount) {
        var count = 0;
        for (let i in self.items) {
            if (self.items[i] && self.items[i].id == id) count += self.items[i].stackSize;
        }
        return count >= amount;
    };
    self.refresh = function refresh() {
        for (let i = 0; i < self.maxItems; i++) {
            self.refreshItem(parseInt(i));
            if (self.items[i] == null) self.items[i] = null;
        }
        for (let i in self.items) {
            if (i >= self.maxItems) {
                self.dropItem(parseInt(i));
            }
        }
        for (let i in self.equips) {
            self.refreshItem(i);
        }
    };
    self.refreshItem = function refreshItem(slot) {
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
    self.enchantItem = function enchantItem(slot, enchantment) {
        if (typeof slot == 'number') {
            self.items[slot].enchant(enchantment);
        } else {
            self.equips[slot].enchant(enchantment);
        }
        self.refreshItem(slot);
    };
    self.refreshCached = function refreshCached() {
        if (self.cachedItem) {
            socket.emit('dragging', {
                id: self.cachedItem.id,
                stackSize: self.cachedItem.stackSize
            });
        } else {
            socket.emit('dragging', null);
        }
    };
    self.takeItem = function takeItem(slot, amount) {
        let item;
        if (typeof slot == 'number') {
            item = self.items[slot];
            let valid = false;
            for (let i in self.items) {
                if (slot === parseInt(i)) valid = true;
            }
            if (!valid) {
                player.kick();
                return;
            }
        }
        else if (typeof slot == 'string') {
            item = self.equips[slot];
            let valid = false;
            for (let i in self.equips) {
                if (slot === i) valid = true;
            }
            if (!valid) {
                player.kick();
                return;
            }
        }
        else player.kick();
        if (item) {
            if (amount > item.stackSize || amount < 1 || typeof amount != 'number') {
                player.kick();
                return;
            }
            self.cachedItem = new Inventory.Item(item.id, null, amount, item.enchantments, 0);
            self.removeItemSlot(slot, amount);
            self.refreshItem(slot);
            self.refreshCached();
        }
    };
    self.placeItem = function placeItem(slot, amount) {
        let item;
        if (typeof slot == 'number') {
            item = self.items[slot];
            let valid = false;
            for (let i in self.items) {
                if (slot === parseInt(i)) valid = true;
            }
            if (!valid) {
                player.kick();
                return;
            }
        } else if (typeof slot == 'string') {
            item = self.equips[slot];
            let valid = false;
            for (let i in self.equips) {
                if (slot === i) valid = true;
            }
            if (!valid) {
                player.kick();
                return;
            }
        } else {
            player.kick();
            return;
        }
        if (self.cachedItem) {
            if (amount > self.cachedItem.stackSize || amount < 1 || typeof amount != 'number') {
                player.kick();
                return;
            }
            if (item) {
                if (Inventory.isSameItem(self.cachedItem, item) && (typeof slot == 'number' || slot == 'sell')) {
                    let old = item.stackSize;
                    item.stackSize = Math.min(item.maxStackSize, item.stackSize+amount);
                    self.cachedItem.stackSize -= item.stackSize-old;
                    if (self.cachedItem.stackSize < 1) self.cachedItem = null;
                } else {
                    let canSwap = true;
                    if (typeof slot == 'number') {
                        new Inventory.Item(self.cachedItem.id, self.items, self.cachedItem.stackSize, self.cachedItem.enchantments, slot);
                    } else {
                        canSwap = false;
                        if ((self.cachedItem.stackSize == 1 && (self.cachedItem.slotType == slot || (slot == 'weapon2' && self.cachedItem.slotType == 'weapon'))) || slot == 'sell') {
                            canSwap = true;
                            new Inventory.Item(self.cachedItem.id, self.equips, self.cachedItem.stackSize, self.cachedItem.enchantments, slot);
                        }
                    }
                    if (canSwap) {
                        self.cachedItem = new Inventory.Item(item.id, null, item.stackSize, item.enchantments, 0);
                    }
                }
            } else {
                if ((self.cachedItem.stackSize == 1 && (self.cachedItem.slotType == slot || (slot == 'weapon2' && self.cachedItem.slotType == 'weapon'))) || slot == 'sell' || typeof slot == 'number') {
                    const item = new Inventory.Item(self.cachedItem.id, null, amount, self.cachedItem.enchantments, slot);
                    if (typeof slot == 'number') {
                        self.items[slot] = item;
                    } else {
                        self.equips[slot] = item;
                    }
                    self.cachedItem.stackSize -= amount;
                    if (self.cachedItem.stackSize <= 0) self.cachedItem = null;
                }
            }
            self.refreshItem(slot);
            self.refreshCached();
        }
    };
    self.dropItem = function dropItem(slot, amount) {
        let item;
        if (typeof slot == 'number') item = self.items[slot];
        else if (typeof slot == 'string') item = self.equips[slot];
        else item = self.cachedItem;
        if (item) {
            if (amount > item.stackSize || amount < 1 || typeof amount != 'number') {
                player.kick();
                return;
            }
            let attempts = 0;
            let dropx, dropy;
            while (attempts < 100) {
                let angle = Math.random()*2*Math.PI;
                let distance = Math.random()*32;
                let x = player.x+Math.cos(angle)*distance;
                let y = player.y+Math.sin(angle)*distance;
                let collisions = [];
                if (Collision.grid[self.map]) {
                    for (let checkx = self.gridx-1; checkx <= self.gridx+1; checkx++) {
                        for (let checky = self.gridy-1; checky <= self.gridy+1; checky++) {
                            if (Collision.grid[self.map][checky] && Collision.grid[self.map][checky][checkx])
                            collisions.push(Collision.getColEntity(self.map, checkx, checky));
                        }
                    }
                }
                let colliding = false;
                for (let i in collisions) {
                    for (let j in collisions[i]) {
                        let bound1left = x-24;
                        let bound1right = x+24;
                        let bound1top = y-24;
                        let bound1bottom = y+24;
                        let bound2left = collisions[i][j].x-(collisions[i][j].width/2);
                        let bound2right = collisions[i][j].x+(collisions[i][j].width/2);
                        let bound2top = collisions[i][j].y-(collisions[i][j].height/2);
                        let bound2bottom = collisions[i][j].y+(collisions[i][j].height/2);
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
                if (slot == null) {
                    item.stackSize -= amount;
                    if (item.stackSize < 1) self.cachedItem = null;
                    self.refreshCached();
                }
                else self.removeItemSlot(item.slot, amount);
            }
        }
    };
    self.quickEquipItem = function quickEquipItem(slot) {
        let item;
        if (typeof slot == 'number') {
            item = self.items[slot];
            let valid = false;
            for (let i in self.items) {
                if (slot === parseInt(i)) valid = true;
            }
            if (!valid) {
                player.kick();
                return;
            }
        } else if (typeof slot == 'string') {
            return;
        } else {
            player.kick();
            return;
        }
        if (item) {
            let newSlot;
            for (let i in self.equips) {
                if (item.slotType === i) newSlot = i;
            }
            if (newSlot) {
                const slotItem = self.equips[newSlot];
                new Inventory.Item(item.id, self.equips, item.stackSize, item.enchantments, newSlot);
                if (slotItem) new Inventory.Item(slotItem.id, self.items, slotItem.stackSize, slotItem.enchantments, slot);
                else self.items[slot] = null;
                self.refreshItem(slot);
                self.refreshItem(newSlot);
            }
        }
    };
    self.useItem = function useItem(slot) {
        let item;
        if (typeof slot == 'number') {
            item = self.items[slot];
            let valid = false;
            for (let i in self.items) {
                if (slot === parseInt(i)) valid = true;
            }
            if (!valid) {
                player.kick();
                return;
            }
        } else if (typeof slot == 'string') {
            return;
        } else {
            player.kick();
            return;
        }
        if (item && item.usable) {
            typeof Inventory.useFunctions[item.id] == 'function' && Inventory.useFunctions[item.id](player);
            typeof Inventory.useFunctions[item.id] != 'function' && error('missing item use function ' + item.id);
        }
    }
    self.craftItem = function craftItem(slot) {
        const craft = Inventory.craftingRecipies[slot];
        if (craft) {
            var canCraft = true;
            for (let i in craft.resources) {
                if (!self.contains(i, craft.resources[i])) canCraft = false;
            }
            if (canCraft) {
                if (self.cachedItem) {
                    if (Inventory.isSameItem(self.cachedItem, new Inventory.Item(craft.item, [null], craft.amount, []))) {
                        self.cachedItem.stackSize += craft.amount;
                        if (self.cachedItem.stackSize > self.cachedItem.maxStackSize) {
                            self.cachedItem.stackSize -= craft.amount;
                            return;
                        }
                } else {
                        return;
                    }
                } else {
                    self.cachedItem = new Inventory.Item(craft.item, [null], craft.amount, []);
                }
                self.refreshCached();
                for (let i in craft.resources) {
                    self.removeItem(i, craft.resources[i]);
                }
            }
        } else {
            player.kick();
        }
    };
    self.getSaveData = function getSaveData() {
        try {
            if (self.cachedItem != null) {
                self.addItem(self.cachedItem.id, self.cachedItem.amount, self.cachedItem.enchantments, false);
                self.cachedItem = null;
            }
            if (self.equips['sell'] != null) {
                const item = self.equips['sell'];
                self.addItem(item.id, item.stackSize, item.enchantments, false);
                self.equips['sell'] = null;
                self.refreshItem('sell');
            }
            const pack = {
                items: [],
                equips: []
            };
            for (let i in self.items) {
                if (self.items[i] != null) {
                    pack.items.push(self.items[i].getData());
                }
            }
            for (let i in self.equips) {
                if (self.equips[i] != null) {
                    pack.equips.push(self.equips[i].getData());
                }
            }
            return pack;
        } catch (err) {
            error(err);
        }
    };
    self.loadSaveData = function loadSaveData(items) {
        if (typeof items == 'object' && items != null) {
            try {
                socket.emit('item', {
                    action: 'maxItems',
                    slots: self.maxItems
                });
                for (let i in items.items) {
                    const localitem = items.items[i];
                    if (localitem) {
                        new Inventory.Item(localitem.id, self.items, localitem.stackSize, localitem.enchantments, parseInt(localitem.slot));
                    }
                }
                for (let i in items.equips) {
                    const localitem = items.equips[i];
                    if (localitem) {
                        new Inventory.Item(localitem.id, self.equips, localitem.stackSize, localitem.enchantments, localitem.slot);
                    }
                }
            } catch(err) {
                error(err);
            }
        }
    };

    return self;
};
Inventory.isSameItem = function isSameItem(item1, item2) {
    if (item1 && item2) {
        if (item1.id == item2.id) {
            let enchantsSame = true;
            search: for (let i in item1.enchantments) {
                for (let j in item2.enchantments) {
                    if (item1.enchantments[i].id == item2.enchantments[j].id && item1.enchantments[i].level == item2.enchantments[j].level) continue search;
                }
                enchantsSame = false;
            }
            if (enchantsSame) return true;
        }
    }
    return false;
};
Inventory.Item = function Item(id, list, amount, enchantments, slot) {
    if (Inventory.items[id] == undefined) {
        id = 'missing';
    }
    const self = cloneDeep(Inventory.items[id]);
    self.id = id;
    self.slot = slot ?? 0;
    self.stackSize = 0;
    self.overflow = amount < 1 ? 1 : (amount ?? 1);
    self.enchantments = enchantments ?? [];
    if (slot == undefined && list != null) {
        while (true) {
            if (list[self.slot] == null) break;
            self.slot++;
        }
        self.modifiedSlots = [];
        for (let i in list) {
            if (Inventory.isSameItem(self, list[i])) {
                let size = list[i].stackSize;
                list[i].stackSize = Math.min(list[i].maxStackSize, list[i].stackSize+self.overflow);
                self.overflow = Math.max(0, self.overflow-(list[i].stackSize-size));
                self.modifiedSlots.push(parseInt(i));
                if (self.overflow == 0) return {
                    modifiedSlots: self.modifiedSlots
                };
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
                let newitem = new Inventory.Item(id, list, self.overflow, enchantments);
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
    } else {
        self.stackSize = self.overflow;
        self.overflow = 0;
    }

    self.getData = function getData() {
        return {
            id: self.id,
            slot: self.slot,
            enchantments: self.enchantments,
            stackSize: self.stackSize
        };
    };
    self.refresh = function refresh() {
        if (self.stackSize > self.maxStackSize) error('Stack Overflow (no not that one)');
    };
    self.enchant = function enchant(enchantment) {
        self.enchantments.push(enchantment);
    };

    self.refresh();
    if (list != null) list[self.slot] = self;
    return self;
};
Inventory.items = require('./item.json');
Inventory.craftingRecipies = require('./../client/crafts.json').items;
Inventory.enchantments = null;
Inventory.useFunctions = {};

Enchanter = function(socket, inventory, player) {
    const self = {

    };
    player.attacking = false;
    player.shield = false;
    player.heldItem.usingShield = false;
    player.canMove = false;
    player.invincible = true;
    player.controls = {
        up: false,
        down: false,
        left: false,
        right: false,
        xaxis: 0,
        yaxis: 0,
        x: 0,
        y: 0,
        heal: false
    };
    player.inShop = true;
    player.shop = self;
    player.animationDirection = 'facing';
};

Shop = function(id, socket, inventory, player, npc) {
    const self = {
        id: id,
        slots: []
    };
    try {
        self.slots = Shop.shops[id].slots;
    } catch (err) {
        error(err);
        return false;
    }
    player.attacking = false;
    player.shield = false;
    player.heldItem.usingShield = false;
    player.canMove = false;
    player.invincible = true;
    player.controls = {
        up: false,
        down: false,
        left: false,
        right: false,
        xaxis: 0,
        yaxis: 0,
        x: 0,
        y: 0,
        heal: false
    };
    player.inShop = true;
    player.shop = self;
    player.animationDirection = 'facing';
    
    socket.on('shop', function listener(data) {
        let valid = false;
        if (typeof data == 'object' && data != null && data.action != null) valid = true;
        if (valid) {
            switch (data.action) {
                case 'close':
                    socket.off('shop', listener);
                    self.close();
                    break;
                case 'buy':
                    self.buy(data.slot);
                    break;
                default:
                    error('Invalid item action ' + data.action);
                    break;
            }
        } else {
            player.kick();
        }
    });
    self.buy = function buy(item) {
        if (self.slots[item] != null) {
            const slot = self.slots[item];
            var canBuy = true;
            for (let i in slot.costs) {
                if (!inventory.contains(i, slot.costs[i])) canBuy = false;
            }
            if (canBuy) {
                if (inventory.cachedItem) {
                    if (Inventory.isSameItem(inventory.cachedItem, new Inventory.Item(slot.item.id, [null], slot.item.amount, slot.item.enchantments))) {
                        inventory.cachedItem.stackSize += slot.item.amount;
                        if (inventory.cachedItem.stackSize >= inventory.cachedItem.maxStackSize) {
                            inventory.cachedItem.stackSize -= slot.item.amount;
                            return;
                        }
                    } else {
                        return;
                    }
                } else {
                    inventory.cachedItem = new Inventory.Item(slot.item.id, null, slot.item.amount, slot.item.enchantments, 0);
                }
                inventory.refreshCached();
                for (let i in slot.costs) {
                    inventory.removeItem(i, slot.costs[i], true);
                }
            }
        } else {
            player.kick();
        }
    };
    self.close = function close() {
        player.canMove = true;
        player.invincible = false;
        player.inShop = false;
        player.shop = null;
        socket.emit('shopClose');
        npc.closeShop();
    };
    socket.emit('shop', {
        id: self.id
    });

    return self;
};
Shop.shops = require('./../client/shop.json');

SellShop = function(socket, inventory, player, npc) {
    const self = {};
    player.attacking = false;
    player.shield = false;
    player.heldItem.usingShield = false;
    player.canMove = false;
    player.invincible = true;
    player.controls = {
        up: false,
        down: false,
        left: false,
        right: false,
        xaxis: 0,
        yaxis: 0,
        x: 0,
        y: 0,
        heal: false
    };
    player.inShop = true;
    player.shop = self;
    player.animationDirection = 'facing';
    
    socket.on('sellshop', function listener(data) {
        let valid = false;
        if (typeof data == 'object' && data != null && data.action != null) valid = true;
        if (valid) {
            switch (data.action) {
                case 'close':
                    socket.off('sellshop', listener);
                    self.close();
                    break;
                case 'sell':
                    self.sell();
                    break;
                default:
                    error('Invalid item action ' + data.action);
                    break;
            }
        } else {
            player.kick();
        }
    });
    self.sell = function sell() {
        if (inventory.equips['sell'] != null) {
            const item = inventory.equips['sell'];
            let value = item.value*item.stackSize;
            let blucoins = Math.floor(value/421875);
            value %= 421875;
            let goldcoins = Math.floor(value/5625);
            value %= 5625;
            let silvercoins = Math.floor(value/75);
            value %= 75;
            let coppercoins = value;
            inventory.removeItemSlot('sell', item.stackSize, true);
            if (blucoins > 0) inventory.addItem('blucoin', blucoins, [], true);
            if (goldcoins > 0) inventory.addItem('goldcoin', goldcoins, [], true);
            if (silvercoins > 0) inventory.addItem('silvercoin', silvercoins, [], true);
            if (coppercoins > 0) inventory.addItem('coppercoin', coppercoins, [], true);
            socket.emit('item', {
                action: 'itemvalue',
                data: {
                    value: 0
                }
            });
        }
    };
    self.close = function close() {
        if (inventory.equips['sell'] != null) {
            const item = inventory.equips['sell'];
            inventory.addItem(item.id, item.stackSize, item.enchantments, false);
            inventory.equips['sell'] = null;
            inventory.refreshItem('sell');
            socket.emit('item', {
                action: 'itemvalue',
                data: {
                    value: 0
                }
            });
        }
        player.canMove = true;
        player.invincible = false;
        player.inShop = false;
        npc.closeShop();
    };
    
    socket.emit('sellshop');
};