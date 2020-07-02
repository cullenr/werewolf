# Werewolf Firebase

Werewolf is a hidden identity game, players must discover the identity of the
evil Werewolf before they are all eaten! 

The game features a day and night phase, during the day a public vote is held
eliminate a player believed to be the Werewolf, all players participate. At
night the Werewolf secretly chooses to eliminate a single player. Additional
nighttime roles include the Healer and the Seer. The Healer can pick any player
to heal in the hope that they have correctly identified that nights Werewolf
victim, news of the Healers success will be made public the following day.  The
Seer can attempt to identify the Werewolf once per night, the Seer will be
secretly notified if they were successful in identifying the Werewolf. The
nighttime roles are assigned and performed secretly.

## Backend

This application uses Firestore, Cloud Functions and the Auth service from
Firebase. All game state is stored in Firestore, clients listen for document
writes to stay synchronised with other players. Certain actions on the db are
performed through Cloud functions to simplify access control to sensitive data,
this also reduces reads.

### Test

    firebase emulators:exec --only firestore 'npm test'

The cloud functions handlers are decoupled from the handlers exported to
firebase, because of this it is not necessary to test with the Cloud Function
emulator running.

While developing, the emulators can be run like so:

    firebase emulators:start

### Deploy

If the front end is also being updated, make sure that you add it under this
directory according to the details in the [Frontend](#Frontend) section of this
document.

    firebase deploy

## Frontend

The frontend is stored is stored in another repository (there are different
frontends written using different frameworks). To install the React frontend:

```
git submodule add git@github.com:cullenr/wereworlf-react.git public
cd public
npm install
npm run build

```
