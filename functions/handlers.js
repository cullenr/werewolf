const functions = require('firebase-functions');
const game = require('./gamelogic.js');

function checkAuth(context) {
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 
                'The function must be called while authenticated.');
    }
}

function checkStringParam(data, prop) {
    if (!data || !data[prop] || typeof data[prop] !== 'string') {
        throw new functions.https.HttpsError('invalid-argument',
            ``);
    }
} 

function checkArrayParam(data, prop) {
    if (!data || !data[prop] || data[prop] instanceof Array) {
        throw new functions.https.HttpsError('invalid-argument',
            `missing argument "${prop}" of type "${type}"`);
    }
} 

function wrapError(func) {
    try {
        return func()
    } catch(err) {
        throw new functions.https.HttpsError('invalid-argument', err.message);
    }
}


const querySnapshotToMap = qs => qs.docs.reduce((acc, val) => {
    acc[val.id] = val.data();
    return acc;
}, {});

/**
 * Starts the game.
 *
 * This can only be called by the game owner, we use `onCall` to aid with
 * passing and checking the auth tokens.
 *
 * This function:
 * - verifies the caller is legitimate
 * - sets game::isOpen to closed
 * - assigns a role to each player
 * - adds the first round to the game::rounds collection
 */
const startGame = da => (async (data, context) => {
    checkAuth(context);
    checkStringParam(data, 'gameId');

    const gameId          = data.gameId;
    const players         = await da.listPlayersIds(gameId);
    const playersAndRoles = wrapError(() =>
            game.distributeRoles(players, game.roleGroups.classic));

    // we cannot guarantee that we will be able to stay within the batch db
    // operation limit given that there are unknown number of players. Because
    // of this we will not use a transaction or batch to start the game.
    await da.closeGame(gameId);

    const rolesPromises = playersAndRoles.map(async e => {
        await da.addRole(gameId, e.player, e.role.type, e.role.team)
        await da.addMessages(gameId, [{
            type: 'role-assigned',
            viewers: [e.player],
            content: e.role.type
        }]);
    });
    await Promise.all(rolesPromises);

    await da.addRound(gameId, 'night', players, [], 0)
});

/**
 * Accepts a players vote.
 *
 * This can only be called by 'living' players.
 *
 * This function:
 * - verifies the caller is living
 * - adds or updates a vote for the given round and player
 * - checks if this was the last vote to be cast:
 *    - ends the round
 *    - starts a new round
 *    - possibly ends the game if the endgame is met
 */
const castVote = da => (async (data, context) => {
    checkAuth(context);
    checkStringParam(data, 'nominee')
    checkStringParam(data, 'gameId')

    const gameId = data.gameId;
    const uid   = context.auth.uid;
    const round = await da.getLatestRound(gameId)
    const players = round.data().players;
    const ghosts  = round.data().ghosts || [];
    // check if the voter is allwed to vote
    if(!players.includes(uid)) {
        throw new functions.https.HttpsError('failed-precondition',
                'user is not allowed to vote on this round.');
    }

    // add the vote to the round
    await da.addVote(gameId, uid, round.id, data.nominee, ghosts.concat(uid));

    // check if this was the last vote - this is a small collection so this
    // approach is not too bad.
    const votes = await da.getVotes(gameId, round.id);
    if(votes.size === players.length) {
        const roles     = await da.getRoles(data.gameId);
        const rolesMap  = querySnapshotToMap(roles);
        const votesMap  = querySnapshotToMap(votes);
        const roundType = round.data().type;
        const results = roundType === 'night'
                ? new game.NightRound(players, ghosts, votesMap, rolesMap)
                : new game.DayRound(players, ghosts, votesMap, rolesMap);

        // add all the events of the day/night to the game message bus
        await da.addMessages(gameId, results.messages);

        // start a new round if we do not have a gameover
        if(!results.gameover) {
            const nextPhase = roundType === 'night' ? 'day' : 'night';
            const nextNumber = parseInt(round.data().number) + 1;
            da.addRound(gameId, nextPhase, 
                    results.players, results.ghosts, nextNumber);
        }
    }
});

module.exports = {castVote, startGame};
