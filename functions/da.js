const admin     = require('firebase-admin');

admin.initializeApp();
const db                = admin.firestore();

/**
 *  String tag that removes forward slashes from interpolated params
 *  @example clean`this/${is}/safe?`; // here is will have '/' removed
 */
const clean             = (strings, ...keys) => {
  let out = strings[0];
  for(let i = 0,j = 1; i < keys.length; i++, j++) {
    out += String(keys[i]).replace('/', '') + String(strings[j])
  }
  return out;
}

// we will use set here, we are not able to use a transaction for most ops so we
// will try to make this code indempotent incase this function is called again.
module.exports = {
    /**
     *  the player ids are most importand and we can get a list of those in a
     *  single read if we use listDocuments
     */
    listPlayersIds(gameId) {
        return db
            .collection(clean`games/${gameId}/players`)
            .listDocuments()
            .then(res => res.map(e => e.id));
    },
    getRoles(gameId) {
        return db
            .collection(clean`games/${gameId}/roles`)
            .get();
    },
    getLatestRound(gameId) {
        return db
            .collection(clean`games/${gameId}/rounds`)
            .orderBy('number', 'desc')
            .limit(1)
            .get();
    },
    addRound(gameId, type, players, ghosts, number) {
        return db
            .doc(clean`games/${gameId}/rounds/r${number}`)
            .set({ type, players, ghosts, number });
    },
    addRole(gameId, playerId, type, team) {
        return db
            .doc(clean`games/${gameId}/roles/${playerId}`)
            .set({ type, team });
    },
    addVote(gameId, playerId, roundId, nominee, viewers) {
        return db
            .doc(clean`games/${gameId}/votes/${playerId}`)
            .set({ nominee, viewers, roundId });
    },
    getVotes(gameId, roundId) {
        return db
            .collection(clean`games/${gameId}/votes`)
            .where('roundId', '==', roundId)
            .get();
    },
    addMessages(gameId, messages) {
        const collection = db.collection(clean`games/${gameId}/messages`)
        const promises   = messages.map(collection.add);
        return Promise.all(promises);
    },
    closeGame(gameId) {
        return db.doc(clean`games/${gameId}`).update({isOpen: false});
    }
}
