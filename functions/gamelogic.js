const roles = {
    VILLAGER:       {type: 'VILLAGER',      team: 'good'},
    SEER:           {type: 'SEER',          team: 'good'},
    HEALER:         {type: 'HEALER',        team: 'good'},
    EXECUTIONER:    {type: 'EXECUTIONER',   team: 'good'},
    ACOLITE:        {type: 'ACOLITE',       team: 'good'},
    SHAPE_SHIFTER:  {type: 'SHAPE_SHIFTER', team: 'good'},
    HERO:           {type: 'HERO',          team: 'good'},

    WEREWOLF:       {type: 'WEREWOLF',      team: 'bad'},
    ZOMBIE:         {type: 'ZOMBIE',        team: 'bad'},
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

class RoundResults {
    constructor(messages, players, ghosts) {
        this.messages = messages;
        this.players = players;
        this.ghosts = ghosts;
    }
}

class Message {
    constructor(viewers, type, data) {
        this.viewers = viewers;
        this.type = type;
        this.data = data;
    }
}

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

const getScores = (rolesMap, players) => players.reduce((acc, player) => {
    const team = rolesMap[player].team;
    acc[team]++;
    return acc;
}, {good: 0, bad: 0});

const countVotes = (arr) => arr.reduce((acc, val) => {
    acc[val.nominee] = acc[val.nominee] || 0;
    acc[val.nominee]++;
    return acc;
}, {});

function getOutcome(players, eliminations, rolesMap, recipients) {
    const remainingPlayers = players.filter(p => !eliminations.includes(p));
    const scores = getScores(rolesMap, remainingPlayers);

    if(scores.bad === 0) {
        // good wins - this can happen if:
        // 1. a daytime vote results in the last bad player being eliminated
        // 2. all the bad players kill each other at night
        return new Message(recipients, 'game-over', {victors: 'good'});
    } else if (scores.good === 0) {
        // evil prevails - we can get here if there are several bad players
        // voting co-operativly in the daytime
        return new Message(recipients, 'game-over', {victors: 'bad'});
    } else {
        // a player has been eliminated but it was not game ending
        return new Message(recipients, 'elimination', {players: eliminatedPlayers});
    }
}

/**
 *  Handles all votes in for a Classic mode day round.
 */
function endDayRound(rolesMap, votesMap, players, ghosts) {
    const votesArr = Object.values(votesMap);
    const results = countVotes(votesArr);
    const topTwo = Object.values(results).sort().slice(-2);
    const allPlayers = players.concat(ghosts);
    // is the vote a draw?
    if(topTwo[0] === topTwo[1]) {
        return [new Message(allPlayers, 'vote-draw', results)];
    } else {
        // check for win
        const eliminatedPlayer = topTwo[0];
        const outcome = getOutcome(players, [eliminatedPlayer], rolesMap, allPlayers);
        return ([outcome]);
    }
}

function endNightRound(rolesMap, votesMap, players, ghosts) {
    // players separated into their teams
    const teams = players.reduce((acc, player) => {
        const team = rolesMap[player].team;
        acc[team].push(player)
        return acc;
    }, {good: [], bad: []});
    // get a list of players that may be about to be eliminated
    const purgatory = teams.bad.map(player => votesMap[player].nominee);
    // the players the healers saved
    const healed = teams.good
        .filter(player => rolesMap[player].type === 'HEALER')
        .map(player => votesMap[player].nominee)
    // players saved by healers (only if they were actually killed first)
    const saved         = purgatory.filter(player => healed.includes(player))
    // players who are out this round
    const eliminated    = purgatory.filter(player => !healed.includes(player))
    // get a list of all the players so we can broadcast messages to this game
    const allPlayers    = ghosts.concat(players);
    // create a new ghosts array, we will use this to give read access to
    // 'private' messages - you can't hide from ghosts...

    const newGhosts     = ghosts.concat(eliminted);
    const newPlayers    = players.filter(p => !eliminations.includes(p));
    const out           = new RoundResults([], newPlayers, newGhosts);
    // TODO: add seer vote into this
    // TODO: implement private messages so we can do the following:
    // TODO: + add zombies here - they affect the win conditions
    // TODO: + add shapeshifters here - they affect the win conditions
    // TODO: + add hero self revive here - this affects win conditions
    // the above can be acheived with a pm collection on the player documents
    // here /games/{game}/players/{player}/messages/{message}
    // we can also handle the executioner this way to reuse the UI

    // at this point we have enough data to determine the outcome of this round
    const outcome = getOutcome(players, eliminations, rolesMap, allPlayers);
    // messages to send with the return value of this function
    out.push(outcome);
    // early out if we have a game over
    if(outcome.type === 'game-over') {
        return out;
    }
    // find out who the new executioner is
    const votesArr = Object
        .entries(votesMap)
        .filter(([player, vote]) => teams.good.includes(player))
        .map(([player, vote]) => (vote))

    // just pick the first, its anonymous.
    const executioner = countVotes(votesArr)[0];
    out.messages.push(new Message(
            allPlayers, 'executioner-elected', {player: executioner}));

    if(healed.length > 0) {
        for(let player of healed) {
            out.messages.push(new Message(allPlayers, 'player-healed', {player}))
        }
    } 
    return out;
}

module.exports = {
    endNightRound,
    endDayRound,
}
