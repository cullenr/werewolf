const functions = require('firebase-functions');
const handlers = require('./handlers.js');
const da = require('./da.js');

exports.startGame = functions.https.onCall(handlers.startGame(da));
exports.castVote  = functions.https.onCall(handlers.castVote(da));
