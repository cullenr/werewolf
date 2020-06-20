const firebase  = require('@firebase/testing');
const fs        = require('fs');

const projectId     = 'ww-testing';
const coverageUrl   = `http://localhost:8080/emulator/v1/projects/${projectId}:ruleCoverage.html`;
const rules         = fs.readFileSync('firestore.rules', 'utf8');

// NOTE ========================================================================
// The docs for the testing module are here - not with the rest of the firebase
// SDK docs.
// https://firebase.google.com/docs/database/security/test-rules-emulator

function authedApp(auth) {
  return firebase.initializeTestApp({ projectId, auth }).firestore();
}

function adminApp() {
  return firebase.initializeAdminApp({ projectId }).firestore();
}

before(async () => {
  await firebase.loadFirestoreRules({ projectId, rules });
});

after(async () => {
  await Promise.all(firebase.apps().map(app => app.delete()));
  console.log(`View rule coverage information at ${coverageUrl}\n`);
});

beforeEach('clear db', async () => {
    await firebase.clearFirestoreData({ projectId });
});

describe('Werewolf firestore rules', () => {
    it('require users to log in before creating a game', async () => {
        const user1 = authedApp(null).doc('games/game1');
        await firebase.assertFails(user1.set({ name: 'test 1' }));

        const user2 = authedApp({uid: 'pass'}).doc('games/game1');
        await firebase.assertSucceeds(user2.set({ name: 'test 1' }));
    });

    it('require users to log in before joining a game', async () => {
        const game = await adminApp().collection('games').add({isOpen: true});

        await firebase.assertFails(authedApp(null)
            .doc(`games/${game.id}/players/some-uid`)
            .set({name: 'foo'}));


        await firebase.assertSucceeds(authedApp({uid: 'some-uid'})
            .doc(`games/${game.id}/players/some-uid`)
            .set({name: 'foo'}));
    });

    it('prevent users from joining closed games', async () => {
        const game = await adminApp().collection('games').add({isOpen: false});

        await firebase.assertFails(authedApp(null)
            .doc(`games/${game.id}/players/some-uid`)
            .set({name: 'foo'}));


        await firebase.assertFails(authedApp({uid: 'some-uid'})
            .doc(`games/${game.id}/players/some-uid`)
            .set({name: 'foo'}));
    });

    describe('prevent users from deleting games', async () => {
        beforeEach('setting up game', async () => {
            await adminApp().doc('games/a').set({
                isOpen: false,
                name: 'old-name',
                host: 'host-uid'
            });
        })

        it('by rejecting unauthenticated users', async () => {
            await firebase.assertFails(authedApp(null)
                .doc('games/a')
                .delete());
        });
        it('by rejecting non owning users', async () => {
            await firebase.assertFails(authedApp({uid: 'some-uid'})
                .doc('games/a')
                .delete());
        });

        it('by rejecting approved users', async () => {
            await firebase.assertFails(authedApp({uid: 'host-uid'})
                .doc('games/a')
                .delete());
        });
    });

    describe('allow only game owners to modify a game', async () => {
        beforeEach('setting up game', async () => {
            await adminApp().doc('games/a').set({
                isOpen: false,
                name: 'old-name',
                host: 'host-uid'
            });
        })


        it('by rejecting unauthenticated users', async () => {
            await firebase.assertFails(authedApp(null)
                .doc('games/a')
                .update({name: 'new name'}));
        });
        it('by rejecting non owning users', async () => {
            await firebase.assertFails(authedApp({uid: 'some-uid'})
                .doc('games/a')
                .update({name: 'new name'}));
        });

        it('by accepting approved users', async () => {
            await firebase.assertSucceeds(authedApp({uid: 'host-uid'})
                .doc('games/a')
                .update({name: 'new name'}));
        });

    });

    describe('use a whitelist for vote reading', () => {
        const docPath = 'games/a/votes/v1';
        beforeEach('setting up round', async () => {
            await adminApp()
                .doc(docPath)
                .set({viewers: ['p1', 'p2']});
        });

        it('that rejects unauthenticated users', async () => {
            await firebase.assertFails(authedApp(null)
                .doc(docPath)
                .get())
        });

        it('that rejects non owning users', async () => {
            await firebase.assertFails(authedApp({uid: 'p0'})
                .doc(docPath)
                .get())
        });

        it('that accepts approved users', async () => {
            await firebase.assertSucceeds(authedApp({uid: 'p2'})
                .doc(docPath)
                .get())
        });
    });

    describe('use a whitelist for message reading', () => {
        const docPath = 'games/a/messages/m1';
        beforeEach('setting up round', async () => {
            await adminApp()
                .doc(docPath)
                .set({viewers: ['p1', 'p2']});
        });

        it('that rejects unauthenticated users', async () => {
            await firebase.assertFails(authedApp(null)
                .doc(docPath)
                .get())
        });

        it('that rejects non owning users', async () => {
            await firebase.assertFails(authedApp({uid: 'p0'})
                .doc(docPath)
                .get())
        });

        it('that accepts approved users', async () => {
            await firebase.assertSucceeds(authedApp({uid: 'p2'})
                .doc(docPath)
                .get())
        });
    });

    describe('manages role reading', () => {
        const docPath = 'games/a/roles/p1';
        beforeEach('setting up round', async () => {
            await adminApp().doc(docPath).set({type: 'werewolf'});
        });

        it('by rejecting unauthenticated users', async () => {
            await firebase.assertFails(authedApp(null) .doc(docPath)
                .get())
        });

        it('by rejecting non-owning users', async () => {
            await firebase.assertFails(authedApp({uid: 'p0'})
                .doc(docPath)
                .get())
        });

        it('by accepting owning users', async () => {
            await firebase.assertSucceeds(authedApp({uid: 'p1'})
                .doc(docPath)
                .get())
        });

        it('by accepting non owning, dead users', async () => {
            await adminApp()
                .doc('games/a/players/p0')
                .set({isDead: true});

            await firebase.assertSucceeds(authedApp({uid: 'p0'})
                .doc(docPath)
                .get())
        });
    });
});
