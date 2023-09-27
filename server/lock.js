// Copyright (C) 2023 Sampleprovider(sp)
const {lock} = require('object-property-lock');

// node
lock(global, ['setInterval', 'setTimeout', 'setImmediate']);
// app.js
lock(ENV, ['ops', 'devs', 'useLocalDatabase', 'useDiscordWebhook', 'enableMGAPI', 'autoSaveInterval', 'isBetaServer']);
lock(global, ['io', 's', 'forceQuit', 'cloneDeep']);
lock(io);
lock(s);
// database.js
lock(ACCOUNTS, ['connect', 'disconnect', 'signup', 'login', 'deleteAccount', 'changePassword', 'validateCredentials', 'loadProgress', 'saveProgress', 'ban', 'unban']);
// log.js
lock(global, ['insertChat', 'insertSinglechat', 'getTimeStamp', 'logColor', 'log', 'debugLog', 'warn', 'error', 'appendLog']);
lock(process.stdin, ['write']);
lock(process.stdout, ['write']);
// collision.js
lock(global, ['Collision', 'Layer', 'Slowdown', 'Spawner', 'BossSpawner', 'Region', 'Teleporter', 'GaruderWarp', 'EventTrigger']);
lock(global.Collision, ['getColEntity']);
lock(global.Layer, ['getColEntity', 'getColDir', 'init', 'lazyInit', 'loadCache', 'writeCache', 'generateGraphs', 'generateLookupTables', 'graph', 'lookupTable', 'lazyInitQueue']);
lock(global.Slowdown, ['getColEntity']);
lock(global.Spawner, ['init']);
lock(global.GaruderWarp, ['locations', 'triggers', 'addPosition', 'addWarpAddTrigger']);
lock(global.EventTrigger, ['update', 'init', 'triggers', 'criteria', 'actions', 'list']);
// inventory.js
lock(global, ['Inventory', 'Enchanter', 'Shop', 'SellShop']);
lock(global.Inventory, ['isSameItem', 'Item', 'items', 'craftingRecipes', 'enchantments']);
lock(global.Shop, ['shops']);
// entity.js
lock(global, ['Entity', 'Rig', 'Npc', 'Player', 'Monster', 'Projectile', 'Particle', 'DroppedItem']);
lock(global.Entity, ['update', 'getDebugData']);
lock(global.Rig, ['effects']);
lock(global.Npc, ['update', 'getDebugData', 'init', 'rawJson', 'scripts']);
lock(global.Player, ['update', 'getDebugData', 'usePatterns', 'xpLevels']);
lock(global.Monster, ['update', 'getDebugData', 'types', 'attacks', 'bossData', 'bossAttacks']);
lock(global.Projectile, ['update', 'getDebugData', 'types', 'patterns', 'contactEvents']);
lock(global.Particle, ['update']);
lock(global.DroppedItem, ['update']);
// maps.js
lock(global, 'MAPS');
lock(global.MAPS, ['load', 'reload']);