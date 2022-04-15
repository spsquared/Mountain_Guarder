// Copyright (C) 2022 Radioactive64

const inventoryItems = document.getElementById('inventoryItemsBody');
const inventoryEquips = document.getElementById('inventoryEquipsBody');
const dragDiv = document.getElementById('invDrag');
const tooltip = document.getElementById('invHoverTooltip');

// inventory structure
Inventory = {
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
    },
    currentDrag: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
    currentHover: null,
    maxItems: 30
};
Inventory.Item = function(id, slot, amount, enchantments) {
    var self = Object.assign({}, Inventory.itemTypes[id]);
    self.id = id;
    self.slot = slot;
    self.stackSize = amount || 1;
    self.enchantments = enchantments || [];
    self.refresh = function() {
        Inventory.items[self.slot].refresh();
    };
    self.enchant = function(enchantments) {
        // set enchant html string (<span style="color: #009900">Speed +10%</span>)
    };

    if (typeof slot == 'number') {
        Inventory.items[slot].item = self;
    } else {
        Inventory.equips[slot].item = self;
    }
    return self;
};
Inventory.Slot = function() {
    var slot = document.createElement('div');
    slot.className = 'invSlot';
    slot.draggable = false;
    var self = {
        slotId: Inventory.items.length,
        item: null,
        slot: slot,
        mousedOver: false
    };

    self.refresh = function() {
        if (self.item) {
            if (self.item.stackSize != 1) slot.innerHTML = '<img src="/client/img/item/' + self.item.id + '.png" class="invSlotImg noSelect"></img><div class="invSlotStackSize noSelect">' + self.item.stackSize + '</div>';
            else slot.innerHTML = '<img src="/client/img/item/' + self.item.id + '.png" class="invSlotImg noSelect"></img>';
        } else {
            slot.innerHTML = '<img src="/client/img/item/empty.png" class="invSlotImgNoGrab noSelect"></img>';
        }
    };
    slot.onmouseover = function(e) {
        self.mousedOver = true;
        if (self.item) {
            Inventory.currentHover = self.slotId;
            loadTooltip(self.slotId);
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
    slot.draggable = false;
    var self = {
        slotId: equip,
        item: null,
        slot: slot,
        mousedOver: false
    };

    self.refresh = function() {
        if (self.item) {
            slot.innerHTML = '<img src="/client/img/item/' + self.item.id + '.png" class="invSlotImg noSelect"></img>';
        } else {
            slot.innerHTML = '<img src="/client/img/item/emptySlot' + self.slotId + '.png" class="invSlotImgNoGrab"></img>';
        }
    };
    slot.onmouseover = function(e) {
        self.mousedOver = true;
        if (self.item) {
            Inventory.currentHover = self.slotId;
            loadTooltip(self.slotId);
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
Inventory.addItem = function(id, slot, amount, enchantments) {
    new Inventory.Item(id, slot, amount, enchantments);
    Inventory.refreshSlot(slot);
};
Inventory.removeItem = function(slot) {
    if (slot != null) {
        if (typeof slot == 'number') {
            Inventory.items[slot].item = null;
        } else {
            Inventory.equips[slot].item = null;
        }
        Inventory.refreshSlot(slot);
    }
};
Inventory.refreshSlot = function(slot) {
    if (typeof slot == 'number') {
        Inventory.items[slot].refresh();
    } else {
        Inventory.equips[slot].refresh();
    }
};
Inventory.enchantSlot = function(slot, enchantments) {
    if (typeof slot == 'number') {
        Inventory.items[slot].enchant(enchantments);
    } else {
        Inventory.equips[slot].enchant(enchantments);
    }
    Inventory.refreshSlot(slot);
};
Inventory.startDrag = function(slot) {
    Inventory.currentDrag = slot;
    dragDiv.style.display = 'block';
    document.getElementById('invDragStackSize').innerText = '';
    if (typeof slot == 'number') {
        document.getElementById('invDragImg').src = '/client/img/item/' + Inventory.items[slot].item.id + '.png';
        if (Inventory.items[slot].item.stackSize != 1) document.getElementById('invDragStackSize').innerText = Inventory.items[slot].item.stackSize;
        Inventory.items[slot].slot.innerHTML = '<img src="/client/img/item/empty.png" class="invSlotImgNoGrab"></img>';
    } else {
        document.getElementById('invDragImg').src = '/client/img/item/' + Inventory.equips[slot].item.id + '.png';
        if (Inventory.equips[slot].item.stackSize != 1) document.getElementById('invDragStackSize').innerText = Inventory.equips[slot].item.stackSize;
        Inventory.equips[slot].slot.innerHTML = '<img src="/client/img/item/emptySlot' + Inventory.equips[slot].slotId + '.png" class="invSlotImgNoGrab"></img>';
    }
};
Inventory.endDrag = function(slot) {
    dragDiv.style.display = '';
    document.getElementById('invDragImg').src = '/client/img/item/empty.png';
    document.getElementById('invDragStackSize').innerText = '';
    socket.emit('item', {
        action: 'drag',
        data: {
            slot: Inventory.currentDrag,
            newSlot: slot
        }
    });
    Inventory.currentDrag = null;
};
Inventory.drop = function(amount) {
    dragDiv.style.display = '';
    document.getElementById('invDragImg').src = '/client/img/item/empty.png';
    document.getElementById('invDragStackSize').innerText = '';
    socket.emit('item', {
        action: 'drop',
        data: {
            slot: Inventory.currentDrag,
            amount: amount || 1
        }
    });
    Inventory.currentDrag = null;
};
Inventory.getRarityColor = function(rarity) {
    var str = '';
    switch (rarity) {
        case 'missing':
            str = 'color: red;';
            break;
        case 'coin':
            str = 'color: goldenrod;';
            break;
        case 'blucoin':
            str = 'color: #3C70FF;'
            break;
        case -1:
            str = 'animation: christmas 2s infinite;';
            break;
        case 0:
            str = 'color: white;';
            break;
        case 1:
            str = 'color: yellow;';
            break;
        case 2:
            str = 'color: gold;';
            break;
    }
    return str;
};
Inventory.generateEffects = function(item) {
    var str = '';
    if (typeof item == 'object') {
        if (item.slotType == 'weapon') {
            var damageType = 'Damage';
            switch (item.damageType) {
                case 'ranged':
                    damageType = ' Ranged damage';
                    break;
                case 'melee':
                    damageType = ' Melee damage';
                    break;
                case 'magic':
                    damageType = ' Purple damage';
                    break;
                default:
                    break;
            }
            str += '<br><span style="color: lime; font-size: 12px;">' + item.damage + damageType + '</span>';
            if (item.critChance != 0) {
                str += '<br><span style="color: lime; font-size: 12px;">' + Math.round(item.critChance*100) + '% Critical hit chance</span>';
            }
            if (item.critPower != 0) {
                str += '<br><span style="color: lime; font-size: 12px;">' + Math.round(item.critPower*100) + '% Critical hit power</span>';
            }
        }
        for (var i in item.effects) {
            var color = '';
            var number = '+0';
            var effect = 'nothing';
            var localeffect = item.effects[i];
            if (localeffect.value < 0) {
                color = 'red';
                number = localeffect.value;
            } else {
                color = 'lime';
                number = '+' + localeffect.value;
            }
            switch (localeffect.id) {
                case 'health':
                    effect = 'HP';
                    if (localeffect.value-1 < 0) {
                        color = 'red';
                        number = Math.round(localeffect.value*100-100) + '%';
                    } else {
                        color = 'lime';
                        number = '+' + Math.round(localeffect.value*100-100) + '%';
                    }
                    break;
                case 'damage':
                    effect = 'Damage';
                    if (localeffect.value-1 < 0) {
                        color = 'red';
                        number = Math.round(localeffect.value*100-100) + '%';
                    } else {
                        color = 'lime';
                        number = '+' + Math.round(localeffect.value*100-100) + '%';
                    }
                    break;
                case 'rangedDamage':
                    effect = 'Ranged damage';
                    if (localeffect.value-1 < 0) {
                        color = 'red';
                        number = Math.round(localeffect.value*100-100) + '%';
                    } else {
                        color = 'lime';
                        number = '+' + Math.round(localeffect.value*100-100) + '%';
                    }
                    break;
                case 'meleeDamage':
                    effect = 'Melee damage';
                    if (localeffect.value-1 < 0) {
                        color = 'red';
                        number = Math.round(localeffect.value*100-100) + '%';
                    } else {
                        color = 'lime';
                        number = '+' + Math.round(localeffect.value*100-100) + '%';
                    }
                    break;
                case 'magicDamage':
                    effect = 'Purple damage';
                    if (localeffect.value-1 < 0) {
                        color = 'red';
                        number = Math.round(localeffect.value*100-100) + '%';
                    } else {
                        color = 'lime';
                        number = '+' + Math.round(localeffect.value*100-100) + '%';
                    }
                    break;
                case 'critChance':
                    effect = 'Critical hit chance';
                    if (localeffect.value < 0) {
                        color = 'red';
                        number = localeffect.value*100 + '%';
                    } else {
                        color = 'lime';
                        number = '+' + localeffect.value*100 + '%';
                    }
                    break;
                case 'critPower':
                    effect = 'Critical hit power';
                    if (localeffect.value < 0) {
                        color = 'red';
                        number = localeffect.value*100 + '%';
                    } else {
                        color = 'lime';
                        number = '+' + localeffect.value*100 + '%';
                    }
                    break;
                case 'damageReduction':
                    effect = 'Resistance';
                    if (localeffect.value < 0) {
                        color = 'red';
                        number = localeffect.value;
                    } else {
                        color = 'lime';
                        number = '+' + localeffect.value;
                    }
                    break;
                case 'defense':
                    effect = 'Defense';
                    if (localeffect.value < 0) {
                        color = 'red';
                        number = localeffect.value*100 + '%';
                    } else {
                        color = 'lime';
                        number = '+' + localeffect.value*100 + '%';
                    }
                    break;
                case 'speed':
                    effect = 'Move speed';
                    if (localeffect.value-1 < 0) {
                        color = 'red';
                        number = Math.round(localeffect.value*100-100) + '%';
                    } else {
                        color = 'lime';
                        number = '+' + Math.round(localeffect.value*100-100) + '%';
                    }
                    break;
                default:
                    console.error('Invalid effect id ' + localeffect.id);
                    break;
            }
            str += '<br><span style="color: ' + color + '; font-size: 12px;">' + number + ' ' + effect + '</span>';
        }
    }
    if (str == '') str = '<br><span style="font-size: 12px;">No Effects</span>';
    return str;
};
document.addEventListener('mousedown', function(e) {
    if (loaded) {
        if (e.button == 0) {
            for (var i in Inventory.items) {
                if (Inventory.items[i].mousedOver) {
                    dragDiv.style.left = e.clientX-32 + 'px';
                    dragDiv.style.top = e.clientY-32 + 'px';
                    if (Inventory.items[i].item) Inventory.startDrag(Inventory.items[i].slotId);
                    return;
                }
            }
            for (var i in Inventory.equips) {
                if (Inventory.equips[i].mousedOver) {
                    dragDiv.style.left = e.clientX-32 + 'px';
                    dragDiv.style.top = e.clientY-32 + 'px';
                    if (Inventory.equips[i].item) Inventory.startDrag(Inventory.equips[i].slotId);
                    return;
                }
            }
        }
    }
});
document.addEventListener('mouseup', function(e) {
    if (loaded) {
        if (e.button == 0) {
            if (Inventory.currentDrag != null) {
                if (document.getElementById('inventory').contains(e.target)) {
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
                } else {
                    if (typeof Inventory.currentDrag == 'number') Inventory.drop(Inventory.items[Inventory.currentDrag].item.stackSize);
                    else Inventory.drop(Inventory.equips[Inventory.currentDrag].item.stackSize);
                }
            }
        }
    }
});
document.addEventListener('mousemove', function(e) {
    if (loaded) {
        if (Inventory.currentDrag != null) {
            dragDiv.style.left = e.clientX-32 + 'px';
            dragDiv.style.top = e.clientY-32 + 'px';
        }
        if (Inventory.currentHover != null && Inventory.currentDrag == null) {
            tooltip.style.opacity = 1;
            tooltip.style.left = e.clientX + 'px';
            tooltip.style.top = e.clientY + 'px';
        } else {
            tooltip.style.opacity = 0;
        }
    }
});
document.addEventListener('keydown', function(e) {
    if (loaded) {
        if (!inchat && !indebug) {
            if (e.key.toLowerCase() == keybinds.drop) {
                for (var i in Inventory.items) {
                    if (Inventory.items[i].item) if (Inventory.items[i].mousedOver) {
                        Inventory.currentDrag = Inventory.items[i].slotId;
                        if (e.getModifierState('Control')) Inventory.drop(Inventory.items[i].item.stackSize);
                        else Inventory.drop(1);
                        tooltip.style.opacity = 0;
                        Inventory.currentHover = null;
                    }
                }
                for (var i in Inventory.equips) {
                    if (Inventory.equips[i].item) if (Inventory.equips[i].mousedOver) {
                        Inventory.currentDrag = Inventory.equips[i].slotId;
                        Inventory.drop();
                        tooltip.style.opacity = 0;
                        Inventory.currentHover = null;
                    }
                }
            } else if (e.key.toLowerCase() == keybinds.swap) {
                socket.emit('item', {
                    action: 'swap',
                    data: {}
                });
                e.preventDefault();
            }
        }
    }
})
function loadTooltip(slot) {
    var item;
    if (typeof slot == 'number') item = Inventory.items[slot].item;
    else item = Inventory.equips[slot].item;
    tooltip.innerHTML = '<span style="font-size: 16px; ' + Inventory.getRarityColor(item.rarity) + '">' + item.name + '</span><br><span style="font-size: 14px;">' + item.slotType.charAt(0).toUpperCase()+item.slotType.slice(1) + '</span><br><span style="font-size: 12px;">' + item.description + '</span>' + Inventory.generateEffects(item);
};
Inventory.itemTypes = [];
Inventory.itemImages = [];
Inventory.itemHighlightImages = [];
function getInventoryData() {
    totalassets++;
    var request = new XMLHttpRequest();
    request.open('GET', '/client/item.json', false);
    request.onload = async function() {
        if (this.status >= 200 && this.status < 400) {
            var json = JSON.parse(this.response);
            Inventory.itemTypes = json;
            loadedassets++;
            for (var i in Inventory.itemTypes) {
                totalassets += 2;
                Inventory.itemImages[i] = new Image();
                Inventory.itemHighlightImages[i] = new Image();
            }
            totalassets++;
            Inventory.itemImages['empty'] = new Image();
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
    for (var i in Inventory.equips) {
        totalassets++;
        Inventory.itemImages[i] = new Image();
    }
};
async function loadInventoryData() {
    for (var i in Inventory.itemTypes) {
        await new Promise(function(resolve, reject) {
            Inventory.itemImages[i].onload = function() {
                loadedassets++;
                resolve();
            };
            Inventory.itemImages[i].src = '/client/img/item/' + i + '.png';
            Inventory.itemImages[i].className = 'invSlotImg noSelect';
        });
        await new Promise(function(resolve, reject) {
            Inventory.itemHighlightImages[i].onload = function() {
                loadedassets++;
                resolve();
            };
            Inventory.itemHighlightImages[i].src = '/client/img/item/highlighted/' + i + '.png';
            Inventory.itemHighlightImages[i].className = 'invSlotImg noSelect';
        });
    }
    await new Promise(function(resolve, reject) {
        Inventory.itemImages['empty'].onload = function() {
            loadedassets++;
            resolve();
        };
        Inventory.itemImages['empty'].src = '/client/img/item/empty.png';
        Inventory.itemImages['empty'].className = 'invSlotImgNoGrab noSelect';
    });
    for (var i in Inventory.equips) {
        await new Promise(function(resolve, reject) {
            Inventory.itemImages[i].onload = function() {
                loadedassets++;
                resolve();
            };
            Inventory.itemImages[i].src = '/client/img/item/emptySlot' + i + '.png';
            Inventory.itemImages[i].className = 'invSlotImgNoGrab noSelect';
        });
    }
    for (var i in Inventory.equips) {
        new Inventory.EquipSlot(i);
    }
};

// io
socket.on('item', function(data) {
    switch (data.action) {
        case 'maxItems':
            Inventory.maxItems = data.slots;
            for (var i = 0; i < Inventory.maxItems; i++) {
                new Inventory.Slot();
            }
            break;
        case 'add':
            Inventory.addItem(data.data.id, data.data.slot, data.data.stackSize, data.data.enchantments);
            break;
        case 'remove':
            Inventory.removeItem(data.data.slot);
            break;
        default:
            console.error('Invalid item action ' + data.action);
            break;
    }
});