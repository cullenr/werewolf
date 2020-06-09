const functions = require('firebase-functions');
const admin     = require('firebase-admin');

admin.initializeApp();

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
        func()
    } catch(err) {
        throw new functions.https.HttpsError('invalid-argument', err.message);
    }
}

const sanitisePathParam = (param) => param.replace('/', '');

const querySnapshotToMap = qs.docs.reduce((acc, val) => {}, {
    acc[val.id] = val.data();
    return acc;
});

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
exports.startGame = functions.https.onCall(async (data, context) => {
    checkAuth(context);
    checkStringParam(data, 'gameId');

    const gameId          = sanitisePathParam(data.gameId);
    const game            = admin.firestore().doc(`games/${gameId}`);
    const roles           = game.collection(`roles`);
    const rounds          = game.collection(`rounds`);
    const players         = await game.collection(`players`).get();
    const playersAndRoles = wrapError(() =>
            distributeRoles(players, roleGroups.classic));

    // we cannot guarantee that we will be able to stay within the batch db
    // operation limit given that there are unknown number of players. Because
    // of this we will not use a transaction or batch to start the game.
    await game.update({isOpen: false});

    const rolesPromises = playersAndRoles.map(e => {
        // we will use set here, we are not able to use a transaction here so we
        // will try to make this code indempotent incase this function is called
        // again.
        return roles.doc(e.player.id).set(e.role);
    });
    await Promise.all(rolesPromises);

    await rounds.doc('r1').set({
        type: 'night',
        players: players.map(e => e.id),
        ghosts: []
        number: 0
    });

});

/**
 *  Securely adds a player to a game.
 *
 *  This function:
 *  - checks the user is authenticated
 *  - verifies the supplied salted hashed password against that of the game
 *  - adds the user to the game and sets their default values
 */
exports.joinGame = functions.https.onCall(async (data, context) => {

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
exports.castVote = functions.https.onCall((data, context) => {
    checkAuth(context);
    checkStringParam(data, 'nominee')
    checkStringParam(data, 'gameId')

    const uid   = context.auth.uid;
    const db    = admin.firestore();
    const round = await db.collection(`games/${gameId}/rounds`)
            .orderBy('number', 'desc')
            .limit(1)
            .get()
    const players = round.data().players;
    const ghosts  = round.data().ghosts || [];
    // check if the voter is allwed to vote
    if(!players.contains(uid)) {
        throw new functions.https.HttpsError('failed-precondition',
                'user is not allowed to vote on this round.');
    }

    await round.doc(`votes/${uid}`).set({
        nomineed: data.nominee,
        viewers: ghosts.concat(uid)
    });

    // check if this was the last vote - this is a small collection so this
    // approach is not too bad.
    const votes = round.collection('votes').get();
    if(votes.size === players.length) {
        const roles     = await db.collection(`games/${gameId}/roles`).get();
        const rolesMap  = querySnapshotToMap(roles);
        const votesMap  = querySnapshotToMap(votes);
        const roundType = round.data().type;
        const gamelogic = roundType === 'night'
                ? new game.NightRound(players, ghosts, rolesMap, votesMap)
                : new game.DayRound(players, ghosts, rolesMap, votesMap);

        // add all the events of the day/night to the game message bus
        const messages  = db.collection(`games/${gameId}/messages`)
        const promises  = gamelogic.message.map(messages.add);
        await Promise.all(promises);

        // start a new round if we do not have a gameover
        if(!gamelogic.gameover) {
            await db.collection(`games/${gameId}/rounds`).add({
                type: roundType === 'night' ? 'day' : 'night', 
                number: parseInt(round.data().number) + 1;
                players: gamelogic.players,
                ghosts: gamelogic.ghosts,
            })
        }
    }
});
