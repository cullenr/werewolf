const roles = {
    VILLAGER: {
        type: 'VILLAGER',
        team: 'good',
        priority: 3,
        process: (nominations, round) => {}
    },
    SEER: {
        type: 'SEER',
        team: 'good',
        priority: 2,
        process: (nominations, round) => nominations.forEach(e => {
            const nomineeRoleType = round.roleMap[e.nominee].type;
            if( nomineeRoleType === roles.ZOMBIE.type ||
                nomineeRoleType === roles.WEREWOLF.type) {
                round.addPrivateMessage(e.voter, 'seer-success', e.nominee);
            } else {
                round.addPrivateMessage(e.voter, 'seer-failure', e.nominee);
            }
        })
    },
    HEALER: {
        type: 'HEALER',
        team: 'good',
        priority: 2,
        process: (nominations, round) => nominations
            .forEach(e => round.resurect(e.nominee))
    },
    EXECUTIONER: {
        type: 'EXECUTIONER',
        team: 'good',
        priority: 3,
        process: (nominations, round) => {}
    },
    ACOLITE: {
        type: 'ACOLITE',
        team: 'good',
        priority: 3,
        process: (nominations, round) => {}
    },
    SHAPE_SHIFTER: {
        type: 'SHAPE_SHIFTER',
        team: 'good',
        priority: 3,
        process: (nominations, round) => {}
    },
    HERO: {
        type: 'HERO',
        team: 'good',
        priority: 4,
        process: (nominations, round) => {}
    },

    WEREWOLF: {
        type: 'WEREWOLF',
        team: 'bad',
        priority: 1,
        process: (nominations, round) => nominations
            .forEach(e => round.eliminate(e.nominee))
    },
    ZOMBIE: {
        type: 'ZOMBIE',
        team: 'bad',
        priority: 1,
        process: (nominations, round) => nominations
            .forEach(e => round.eliminate(e.nominee))
    },
};

const roleGroups = {
    classic: {
        minPlayers: 3,
        special: [roles.WEREWOLF, roles.SEER, roles.HEALER],
        default: roles.VILLAGER
    },
    hero: {
        minPlayers: 3,
        special: [roles.HERO],
        default: roles.ZOMBIE
    },
};

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function distributeRoles(players, roles) {
    if(players.length < roles.minPlayers) {
        throw new Error(`at least ${roles.minPlayers} players needed`);
    }

    return shuffle(players.slice(0))
        .map((player, i) => ({
            player,
            role: roles.special[i] || roles.default
        }));
}

class GameRound {
    constructor(players, ghosts, voteMap, roleMap) {
        this.players = players.slice(0);
        this.ghosts = ghosts.slice(0);
        this.voteMap = voteMap;
        this.roleMap = roleMap;
        this.privateMessages = [];
        this.publicMessages = [];
        this.eliminations = [];
        this.resurections = [];

        // run the round specific logic
        this.update();

        // automatically add the game-over message
        const winners = this.checkWinners();
        if (winners) {
            this.addPublicMessage('game-over', {victors: winners});
            this.gameover = true;
        } else {
            this.gameover = false;
        }
    }

    /**
     *  @internal
     */
    update() {
        // override this
    }

    scorePoll(arr) {
        const results  = arr.reduce((acc, val) => {
            acc[val] = acc[val] || 0;
            acc[val]++;
            return acc;
        }, {});
        const asArray = Object
            .entries(results)
            .sort(([k1, v1], [k2, v2]) => v2 - v1)
        return asArray;
    }

    eliminate(player) {
        if (this.players.includes(player)) {
            this.ghosts.push(player);
            this.players = this.players.filter(e => e !== player);
            this.resurections = this.resurections.filter(e => e !== player);
            this.eliminations.push(player);
        }
    }

    resurect(player) {
        if (this.ghosts.includes(player)) {
            this.players.push(player);
            this.ghosts = this.ghosts.filter(e => e !== player);
            this.eliminations = this.eliminations.filter(e => e !== player);
            this.resurections.push(player);
        }
    }

    addPrivateMessage(to, type, content) {
        this.privateMessages.push({to, type, content});
    }

    addPublicMessage(type, content) {
        // we sort the array to make testing easier
        const allPlayers = this.players.concat(this.ghosts).sort();
        this.publicMessages.push({ to: allPlayers, type, content });
    }

    checkWinners() {
        const scores = this.players.reduce((acc, player) => {
            const team = this.roleMap[player].team;
            acc[team]++;
            return acc;
        }, {good: 0, bad: 0});

        if(scores.bad === 0) {
            // good wins - this can happen if:
            // 1. a daytime vote results in the last bad player being eliminated
            // 2. all the bad players eliminate each other at night
            return 'good';
        } else if (scores.good === 0) {
            // evil prevails - we can get here if there are several bad players
            // voting co-operativly in the daytime
            return 'bad';
        } else {
            return;
        }
    }

    get messages() {
        const pms = this.privateMessages.map(e => ({
            to: this.ghosts.concat(e.to).sort(), // sort for easier testings
            type: e.type,
            content: e.content
        }));
        return pms.concat(this.publicMessages);
    }
}

class DayRound extends GameRound {
    constructor(players, ghosts, voteMap, roleMap) {
        super(players, ghosts, voteMap, roleMap);
    }

    update() {
        const votesArr = Object.values(this.voteMap).map(e => e.nominee);
        const results = this.scorePoll(votesArr);
        if(results[0][1] === results[1][1]) {
            this.addPublicMessage('vote-draw', results);
        } else {
            this.eliminate(results[0][0])
            this.addPublicMessage('execution', {
                player: results[0][0],
                votes: results[0][1]
            });
        }
    }
}

class NightRound extends GameRound {
    constructor(players, ghosts, voteMap, roleMap) {
        super(players, ghosts, voteMap, roleMap);
    }

    update() {
        // visit each role in this game in their priority order
        for (const role of this.orderedRoles) {
            const nominations = this.getNominations(role.type);
            role.process(nominations, this);
        }

        // if we have a game over this could be undefined
        if(this.executioner) {
            this.addPublicMessage('executioner-elected', this.executioner);
        }

        if(this.eliminations.length) {
            this.addPublicMessage('eliminations', this.eliminations);
        }

        if(this.resurections.length) {
            this.addPublicMessage('resurections', this.resurections);
        }
    }

    get orderedRoles() {
        const enabledRoles = this.players.reduce((acc, player) => {
            // we are mapping to the server side roles here too as these
            // contain the proirity and process functions that are not
            // serialised to the db
            const roleType = this.roleMap[player].type;
            acc[roleType] = roles[roleType];
            return acc;
        }, {});

        return Object
            .values(enabledRoles)
            .sort((a, b) => a.priority > b.priority)
    }

    get executioner() {
        // this will include all good votes including the healer and seer to
        // make sure that we always choose an executioner if the game is not a
        // game over.
        const goodPlayers = this.players
            .filter(e => this.roleMap[e].team === 'good');
        const goodVotes = goodPlayers
            .map(e => this.voteMap[e].nominee);
        const results = this.scorePoll(goodVotes);
        return results[0];
    }

    getNominations(roleName) {
        return this.players
            .filter(player => this.roleMap[player].type === roleName)
            .map(player => ({
                voter: player,
                nominee: this.voteMap[player].nominee
            }))
    }
}

module.exports = {
    distributeRoles,
    roleGroups,
    NightRound,
    DayRound,
    test: {
        GameRound
    }
}
