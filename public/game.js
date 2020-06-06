 

const roles = {
    NOT_SET: 0,

    GHOST: 1,           // a dead player, they can see all other roles
    VILLAGER: 2,
    SEER: 3,
    HEALER: 4,
    WEREWOLF: 5,
    EXECUTIONER: 6,     // this players avater is the executioner, 
    // villagers and heros will vote for vote for
    // this role at night.

    // advanced
    ACOLITE: 6,         // becomes a werewolf if killed by an existing
    // werewolf
    SHAPE_SHIFTER: 7,   // can swap their role with another player, 
    // the other player then becomes the shape shifter
    HERO: 8,             // this player is notified they are the only 
    // villager at the start of the game
    NECROMANCER: 9      // brings the dead back to life there is a change they will become a zombie though - aka another werewolf. only the resurected knows this.
};

const events = {
    NEW_PLAYER: 0,
    NEW_ROUND: 1,
    NIGHT_PHASE: 2,
    PLAYERS_UPDATED: 3
};

/**
 *  The player Id is gathered from the 
 */
class Player {
    constructor() {
        this.name;
        this.role; // private
    }
}

class Round {
    constructor() {
        this.phase;         // 'day' | 'night'
        this.players;       // string[] living pids
        this.ghosts;        // string[] dead pids
        this.publicVote;    // collection Vote 
        this.privateVote;   // collection Vote
        this.nightTimeTask; // string 
    }
}

class Vote {
    constructor() {
        this.nominee; 
    }
}

export class Game extends EventTarget {

    constructor(userId, db) {
        super();
        this.db = db;
        this.userId = userId;
        this.currentRound;
    }

    async create(name) {
        this.gameModel = await this.db.collection('games').add({
            name, 
            state: 'open',
            round: 0
        });

        this.init();
    }

    async join(gameId) {
        this.gameModel = await this.db.collection('games').doc(`${gameId}`);
        this.init();
    }

    async init() {
        this.playerModel = await this.gameModel
                .collection('players')
                .doc(`${this.userId}`)
                .set({name: 'some person'})

        this.gameModel
                .collection('rounds')
                .onSnapshot(s => s.docChanges().forEach(c => {
            // a new round has begun
            if (c.type === 'added') {
                //dispatch some event to do with rounds
                this.currentRound = s.doc.ref();
                this.dispatchEvent(events.NEW_ROUND, c.doc.data());
            }
            // its night time
            if (c.type === 'modified') {
                const data = c.doc.data();
                if (data.phase === 'night') {
                    this.dispatchEvent(events.NIGHT_PHASE, data);
                }
            }
        }));

        this.gameModel
                .collection('roles')
                .doc(this.userId)
                .onSnapshot(s => {
            // we have been assigned a role
            if (s.type == 'added' || s.type == 'modified')
            this.dispatchEvent(events.NEW_ROLE, s.doc.data().value);
        });

       this.gameModel
               .collection('players')
               .onSnapshot(s => {
           // get complete list of players
           const players = s.docs.map(d => d.data());
           dispatchEvent(events.PLAYERS_UPDATED, players);
       });
    }

    /**
     *  Each round a set of options is presented to the player, they get to
     *  choose one and set it here.
     */
    voteOption() {
        
    }
}
