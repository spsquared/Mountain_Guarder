// Copyright (C) 2023 Sampleprovider(sp)

function updateItemPreviewImage(e) {
	var image = document.getElementById('itemPreviewImg');
	image.src = URL.createObjectURL(e.target.files[0]);
};
function updateItemBaseStats() {
    var slotType = document.getElementById('slotType').value;
    document.getElementById('statsWeapon').style.display = 'none';
    document.getElementById('statsShield').style.display = 'none';
    document.getElementById('statsOffhand').style.display = 'none';
    document.getElementById('statsKey').style.display = 'none';
    if (slotType == 'weapon' || slotType == 'crystal') {
        document.getElementById('statsWeapon').style.display = '';
    } else if (slotType == 'shield') {
        document.getElementById('statsShield').style.display = '';
    } else if (slotType == 'offhand') {
        document.getElementById('statsOffhand').style.display = '';
    } else if (slotType == 'key') {
        document.getElementById('statsKey').style.display = '';
    }
};
updateItemBaseStats();

const effects = ['health', 'damage', 'rangedDamage', 'meleeDamage', 'magicDamage', 'critChance', 'critPower', 'damageReduction', 'defense', 'speed'];
const enchantments = ['lightness', 'speed', 'poisonEffect', 'burningEffect', 'range', 'accuracy', 'power', 'piercing', 'sharpness', 'reach', 'force', 'efficiency', 'sorcery', 'focus', 'spuhrpling', 'protection', 'spikes', 'swiftness', 'toughness', 'mirroring'];

function generateServerItem() {
    let id = document.getElementById('id').value;
    if (id == '') {
        window.alert('Please fill out all values');
        return;
    }
    if (id.includes(' ')) {
        window.alert('Invalid characters.');
        return;
    }
    const item = {
        slotType: null,
        rarity: null,
        maxStackSize: 1
    };
    let slotType = document.getElementById('slotType').value;
    if (slotType == 'weapon' || slotType == 'crystal') {
        item.projectile = null;
        item.projectilePattern = null;
        item.projectileSpeed = null;
        item.projectileRange = null;
        item.accuracy = null;
        item.damage = null;
        item.damageType = null;
        item.critChance = null;
        item.critPower = null;
        item.knockback = null;
        item.useTime = null;
        item.manaCost = null;
    } else if (slotType == 'shield') {
        item.knockbackResistance = null;
        item.blockAngle = null;
        item.projectileReflectChance = null;
    } else if (slotType == 'key') {
        item.manaIncrease = null;
        item.manaRegenerationSpeed = null;
        item.manaRegenerationAmount = null;
    }
    for (let i in item) {
        let value = document.getElementById(i).value;
        if (value == '') {
            window.alert('Please fill out all values');
            return;
        }
        if (value.includes(' ') && i != 'name') {
            window.alert('Invalid characters.');
            return;
        }
        if (isNaN(value*2) == false) value = parseFloat(value);
        item[i] = value;
    }
    item.effects = [];
    for (let i in effects) {
        let value = document.getElementById('effect' + effects[i]).value;
        if (value != '') {
            if (isNaN(value*2) == false) value = parseFloat(value);
            item.effects.push({
                id: effects[i],
                value: value
            });
        }
    }
    item.enchantments = [];
    for (let i in enchantments) {
        let checked = document.getElementById('enchant' + enchantments[i]).checked;
        if (checked) {
            item.enchantments.push(enchantments[i]);
        }
    }
    let temparray = {};
    temparray[id] = item;
    let jsonStr = JSON.stringify(temparray, null, 4);
    jsonStr = jsonStr.replace('{\n    ', '');
    let modified = '';
    for (let i = 0; i < jsonStr.length-2; i++) {
        modified += jsonStr[i];
    }
    modified += ',';
    navigator.clipboard.writeText(modified);
    window.alert('Copied to clipboard!');
};
function generateClientItem() {
    let id = document.getElementById('id').value;
    if (id == '') {
        window.alert('Please fill out all values');
        return;
    }
    if (id.includes(' ')) {
        window.alert('Invalid characters.');
        return;
    }
    const item = {
        name: null,
        description: null,
        slotType: null,
        rarity: null
    };
    let slotType = document.getElementById('slotType').value;
    if (slotType == 'weapon' || slotType == 'crystal') {
        item.damage = null;
        item.damageType = null;
        item.critChance = null;
        item.critPower = null;
        item.knockback = null;
        item.useTime = null;
        item.manaCost = null;
        item.heldAngle = null;
        item.heldDistance = null;
    } else if (slotType == 'shield') {
        item.knockbackResistance = null;
        item.blockAngle = null;
        item.projectileReflectChance = null;
    } else if (slotType == 'key') {
        item.manaIncrease = null;
        item.manaRegenerationSpeed = null;
        item.manaRegenerationAmount = null;
    }
    for (let i in item) {
        let value = document.getElementById(i).value;
        if (value == '') {
            window.alert('Please fill out all values');
            return;
        }
        if (value.includes(' ') && i != 'name' && i != 'description') {
            window.alert('Invalid characters.');
            return;
        }
        if (isNaN(value*2) == false) value = parseFloat(value);
        item[i] = value;
    }
    item.effects = [];
    for (let i in effects) {
        let value = document.getElementById('effect' + effects[i]).value;
        if (value != '') {
            if (isNaN(value*2) == false) value = parseFloat(value);
            item.effects.push({
                id: effects[i],
                value: value
            });
        }
    }
    let temparray = {};
    temparray[id] = item;
    let jsonStr = JSON.stringify(temparray, null, 4);
    jsonStr = jsonStr.replace('{\n    ', '');
    let modified = '';
    for (let i = 0; i < jsonStr.length-2; i++) {
        modified += jsonStr[i];
    }
    modified += ',';
    navigator.clipboard.writeText(modified);
    window.alert('Copied to clipboard!');
};