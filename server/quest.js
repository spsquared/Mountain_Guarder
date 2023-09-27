// Copyright (C) 2023 Sampleprovider(sp)

QuestHandler = function(socket, player) {
    const self = {
        qualified: [],
        done: [],
        current: [],
        lastTick: 0
    };

    self.startQuest = function startQuest(id) {
        if (self.qualifiesFor(id)) {
            self.current[id] = new QuestData(id);
            socket.emit('quest', {
                type: 'start',
                id: id
            });
        } else {
            socket.emit('quest', {
                type: 'qualification',
                id: id
            });
        }
    };
    self.advanceQuestStage = function advanceQuestStage(id) {
        if (self.current[id].advanceStage()) {
            self.endQuest(id, true);
        } else socket.emit('quest', {
            type: 'advance',
            id: id,
            stage: self.current[id].stage
        });
    };
    self.endQuest = function endQuest(id, success) {
        const rewards = self.current[id].rewards;
        delete self.current[id];
        if (success) {
            if (self.done.indexOf(id) == -1) self.done.push(id);
            socket.emit('quest', {
                type: 'end',
                id: id
            });
            for (let i in rewards) {
                if (i == 'xp') {
                    player.xp += rewards[i];
                } else if (i == 'items') {
                    for (let j in rewards[i]) {
                        player.inventory.addItem(j, rewards[i][j], [], true);
                    }
                }
            }
        } else {
            socket.emit('quest', {
                type: 'fail',
                id: id
            });
        }
    };
    self.updateQuestRequirements = function updateQuestRequirements(data) {
        for (let i in self.current) {
            if (self.current[i].checkRequirements(data)) self.advanceQuestStage(i);
        }
    };
    self.updateClient = function updateClient() {
        self.lastTick++;
        if (self.lastTick > 3) {
            self.lastTick = 0;
            const pack = [];
            for (let i in self.current) {
                pack.push({
                    id: i,
                    data: self.current[i].objectivesComplete,
                    stage: self.current[i].stage
                });
            }
            socket.emit('questData', pack);
        }
    };
    self.qualifiesFor = function qualifiesFor(id) {
        const quest = QuestData.quests[id];
        if (quest) {
            if (player.xpLevel < quest.requirements.xpLevel) return false;
            for (let i in quest.requirements.completed) {
                if (self.done.indexOf(quest.requirements.completed[i]) == -1) return false;
            }
            return true;
        } else {
            error('Invalid quest id ' + id);
            return false;
        }
    };
    self.finishedQuest = function finishedQuest(id) {
        for (let i in self.done) {
            if (self.done[i].id == id) return true;
        }
        return false;
    };
    self.isInQuest = function isInQuest(id) {
        for (let i in self.current) {
            if (self.current[i].id == id) return self.current[i].stage;
        }
        return -1;
    };
    self.failQuests = function failQuests(reason) {
        if (reason == 'death') {
            for (let i in self.current) {
                if (self.current[i].failOnDeath) self.endQuest(i, false);
            }
        }
    };
    self.getSaveData = function getSaveData() {
        var pack = {
            done: self.done
        };
        return pack;
    };
    self.loadSaveData = function loadSaveData(data) {
        self.done = data.done;
    };

    return self;
};
QuestData = function(id) {
    const quest = cloneDeep(QuestData.quests[id]);
    const self = {
        id: id,
        stages: quest.objectives,
        stage: 0,
        objectives: cloneDeep(quest.objectives[0]),
        objectivesComplete: cloneDeep(quest.objectives[0]),
        rewards: quest.rewards,
        failOnDeath: quest.failOnDeath
    };
    for (let i in self.objectivesComplete) {
        if (i == 'killMonster' || i == 'obtain') {
            for (let j in self.objectivesComplete[i]) {
                self.objectivesComplete[i][j] = 0;
            }
        } else if (i == 'talk' || i == 'area') {
            self.objectivesComplete[i] = false;
        } else {
            self.objectivesComplete[i] = 0;
        }
    }

    self.checkRequirements = function checkRequirements(data) {
        let objectives = self.objectivesComplete;
        let goals = self.objectives;
        for (let i in objectives) {
            switch (i) {
                case 'obtain':
                    for (let j in data.aqquiredItems) {
                        for (let k in objectives[i]) {
                            if (j == k) objectives[i][k] += data.aqquiredItems[j];
                        }
                    }
                    break;
                case 'area':
                    if (data.pos.map == goals[i].map && Math.sqrt((data.pos.x-goals[i].x)**2+(data.pos.x-goals[i].x)**2) < goals[i].r) {
                        objectives[i] = true;
                    }
                    break;
                case 'killPlayer':
                    objectives[i] += data.trackedData.playerKills;
                    break;
                case 'killMonster':
                    for (let j in data.trackedData.monstersKilled) {
                        for (let k in objectives[i]) {
                            if (k == 'any') objectives[i][k] += data.trackedData.monstersKilled[j].count;
                            if (k == 'bird' && data.trackedData.monstersKilled[j].id.includes('bird')) objectives[i][k] += data.trackedData.monstersKilled[j].count;
                            if (k == data.trackedData.monstersKilled[j].id) objectives[i][k] += data.trackedData.monstersKilled[j].count;
                        }
                    }
                    break;
                case 'dealDamage':
                    objectives[i] += data.trackedData.damageDealt;
                    break;
                case 'dps':
                    objectives[i] = Math.max(data.trackedData.dps, objectives[i]);
                    break;
                case 'talk':
                    if (data.talkedWith == goals[i]) objectives[i] = true;
                    break;
                default:
                    error('Invalid quest objective ' + i);
                    break;
            }
        }
        let completed = true;
        check: for (let j in objectives) {
            if (j == 'killMonster' || j == 'obtain') {
                for (let k in objectives[j]) {
                    if (objectives[j][k] < goals[j][k]) {
                        completed = false;
                        break check;
                    }
                }
            } else if (j == 'talk' || j == 'area') {
                if (objectives[j] == false) {
                    completed = false;
                    break check;
                }
            } else {
                if (objectives[j] < goals[j]) {
                    completed = false;
                    break check;
                }
            }
        }
        return completed;
    };
    self.advanceStage = function advanceStage() {
        self.stage++;
        if (self.stages[self.stage] == null) return true;
        self.objectives = cloneDeep(self.stages[self.stage]);
        self.objectivesComplete = cloneDeep(self.stages[self.stage]);
        for (let i in self.objectivesComplete) {
            if (i == 'killMonster' || i == 'obtain') {
                for (let j in self.objectivesComplete[i]) {
                    self.objectivesComplete[i][j] = 0;
                }
            } else if (i == 'talk' || i == 'area') {
                self.objectivesComplete[i] = false;
            } else {
                self.objectivesComplete[i] = 0;
            }
        }
        return false;
    };

    return self;
};
QuestData.quests = require('./../client/quests.json');

Criteria = {};
Criteria.qualifiesFor = function qualifiesFor(player, id) {
    const criterion = Criteria.data[id];
    if (criterion) {
        for (let criteria of criterion) {
            if (typeof Criteria.criteria[criteria.type] == 'function') {
                if (!Criteria.criteria[criteria.type](player, criteria.value)) return false;
            } else {
                error('Invalid Criteria criteria ' + criteria.type);
            }
        }
    } else {
        error('Invalid criteria id ' + id);
    }
};
Criteria.criteria = {
    quest: function criteria_quest(self, value) {
        return self.quests.finishedQuest(value);
    },
    qualifies_quest: function criteria_qualifies_quest(self, value) {
        return self.quests.qualifiesFor(value);
    }
};
Criteria.data = require('./criteria.json');

Prompts = {};
Prompts.init = function() {
    for (let i in Prompts.dialogues) {
        for (let j in Prompts.dialogues[i]) {
            for (const option of Prompts.dialogues[i][j].options) {
                if (option.action.includes('script_')) {
                    option.script = Prompts.scripts[option.action.replace('script_', '')];
                } else if (option.action.includes('script-end_')) {
                    option.script = Prompts.scripts[option.action.replace('script-end_', '')];
                } else if (option.action.includes('teleport_')) {
                    let opts = option.action.replace('teleport_', '').split(',');
                    option.location = [opts[0], parseInt(opts[1]), parseInt(opts[2]), parseInt(opts[3])];
                } else if (option.action.includes('teleport-end_')) {
                    let opts = option.action.replace('teleport_', '').split(',');
                    option.location = [opts[0], parseInt(opts[1]), parseInt(opts[2]), parseInt(opts[3])];
                }
            }
        }
    }
};
Prompts.dialogues = require('./../client/prompts.json');
Prompts.scripts = {};