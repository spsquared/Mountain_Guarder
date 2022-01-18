// Copyright (C) 2022 Radioactive64
const {lock} = require('object-property-lock');

// node
lock(global, ['setInterval', 'setTimeout', 'setImmediate']);
// app.js
lock(ENV, ['ops', 'offlineMode']);
lock(io);
lock(global, ['forceQuit']);
// database.js
lock(ACCOUNTS, ['connect', 'disconnect', 'signup', 'login', 'deleteAccount', 'changePassword', 'validateCredentials', 'loadProgress', 'saveProgress']);
// log.js
lock(global, ['insertChat', 'insertSinglechat', 'logColor', 'log', 'warn', 'error', 'appendLog']);
// collision.js
lock(global, ['Collision', 'Layer', 'Slowdown', 'Spawner', 'Teleporter']);
lock(global.Collision, ['getColEntity']);
lock(global.Layer, ['getColEntity']);
lock(global.Slowdown, ['getColEntity']);
// inventory.js
lock(global, ['Inventory']);
lock(global.Inventory, ['Item', 'items'])
// entity.js
lock(global, ['Entity', 'Rig', 'Npc', 'Player', 'Monster', 'Projectile', 'Particle', 'DroppedItem']);
lock(global.Entity, ['update', 'getDebugData']);
lock(global.Npc, ['update', 'getDebugData']);
lock(global.Player, ['update', 'getDebugData']);
lock(global.Monster, ['update', 'getDebugData']);
lock(global.Projectile, ['update', 'getDebugData']);
lock(global.Particle, ['update']);
lock(global.DroppedItem, ['update', 'getDebugData']);

