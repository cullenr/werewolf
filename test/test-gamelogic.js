const chai = require('chai');
const assert = chai.assert;

const game = require('../functions/gamelogic.js');


describe('class GameRound', () => {
    describe('checkWinners method', () => {
        it('returns "undefined" there is no winner', () => {
            const players = ['p1', 'p2', 'p3', 'p4'];
            const ghosts = [];
            const voteMap = {
                p1: {nominee: 'p2'},
                p2: {nominee: 'p2'},
                p3: {nominee: 'p2'},
                p4: {nominee: 'p1'}
            };
            const roleMap = {
                p1: {type: 'WEREWOLF', team: 'bad'},
                p2: {type: 'VILLAGER', team: 'good'},
                p3: {type: 'VILLAGER', team: 'good'},
                p4: {type: 'VILLAGER', team: 'good'}
            };
            const round = new game.test
                .GameRound(players, ghosts, voteMap, roleMap);
            const res = round.checkWinners();

            assert.isUndefined(res);
        });

        it('returns "good" the "good" team wins', () => {
            const players = ['p2', 'p3', 'p4'];
            const ghosts = [];
            const voteMap = {
                p2: {nominee: 'p1'},
                p3: {nominee: 'p1'},
                p4: {nominee: 'p1'}
            };
            const roleMap = {
                p2: {type: 'VILLAGER', team: 'good'},
                p3: {type: 'VILLAGER', team: 'good'},
                p4: {type: 'VILLAGER', team: 'good'}
            };
            const round = new game.test
                .GameRound(players, ghosts, voteMap, roleMap);
            const res = round.checkWinners();

            assert.equal(res, 'good');
        });

        it('returns "bad" the "bad" team wins', () => {
            const players = ['p1'];
            const ghosts = [];
            const voteMap = {
                p1: {nominee: 'p2'},
            };
            const roleMap = {
                p1: {type: 'WEREWOLF', team: 'bad'},
            };
            const round = new game.test
                .GameRound(players, ghosts, voteMap, roleMap);
            const res = round.checkWinners();

            assert.equal(res, 'bad');
        });
    });

    describe('eliminate method', () => {
        it('eliminates players', () => {
            const round = new game.test.GameRound(['p1', 'p2'], ['p3']);
            round.eliminate('p1');

            assert.equal(round.players.length, 1)
            assert.deepEqual(round.players, ['p2'])
            assert.equal(round.ghosts.length, 2)
            assert.includeMembers(round.ghosts, ['p1', 'p3'])
            assert.equal(round.eliminations.length, 1)
            assert.deepEqual(round.eliminations, ['p1'])
            assert.equal(round.resurections.length, 0)

        })
        it('eliminates players only once', () => {
            const round = new game.test.GameRound(['p1', 'p2'], ['p3']);
            round.eliminate('p1');
            round.eliminate('p1');

            assert.equal(round.players.length, 1)
            assert.deepEqual(round.players, ['p2'])
            assert.equal(round.ghosts.length, 2)
            assert.includeMembers(round.ghosts, ['p1', 'p3'])
            assert.equal(round.eliminations.length, 1)
            assert.deepEqual(round.eliminations, ['p1'])
            assert.equal(round.resurections.length, 0)
        })
        it('eliminates resurected players only once', () => {
            const round = new game.test.GameRound(['p1', 'p2'], ['p3']);
            round.eliminate('p1');
            round.resurect('p1');
            round.eliminate('p1');

            assert.equal(round.players.length, 1)
            assert.deepEqual(round.players, ['p2'])
            assert.equal(round.ghosts.length, 2)
            assert.includeMembers(round.ghosts, ['p1', 'p3'])
            assert.equal(round.eliminations.length, 1)
            assert.deepEqual(round.eliminations, ['p1'])
            assert.equal(round.resurections.length, 0)
        })
    })
    describe('resurect method', () => {
        it('resurects players', () => {
            const round = new game.test.GameRound(['p1', 'p2'], ['p3']);
            round.resurect('p3');

            assert.equal(round.players.length, 3)
            assert.includeMembers(round.players, ['p1', 'p2', 'p3'])

            assert.equal(round.ghosts.length, 0)

            assert.equal(round.eliminations.length, 0)

            assert.equal(round.resurections.length, 1)
            assert.includeMembers(round.players, ['p3'])
        })
        it('resurects players only once', () => {
            const round = new game.test.GameRound(['p1', 'p2'], ['p3']);
            round.resurect('p3');
            round.resurect('p3');

            assert.equal(round.players.length, 3)
            assert.includeMembers(round.players, ['p1', 'p2', 'p3'])

            assert.equal(round.ghosts.length, 0)

            assert.equal(round.eliminations.length, 0)

            assert.equal(round.resurections.length, 1)
            assert.includeMembers(round.players, ['p3'])
        })
        it('resurects eliminated players only once', () => {
            const round = new game.test.GameRound(['p1', 'p2'], ['p3']);
            round.resurect('p3');
            round.eliminate('p3');
            round.resurect('p3');

            assert.equal(round.players.length, 3)
            assert.includeMembers(round.players, ['p1', 'p2', 'p3'])

            assert.equal(round.ghosts.length, 0)

            assert.equal(round.eliminations.length, 0)

            assert.equal(round.resurections.length, 1)
            assert.includeMembers(round.players, ['p3'])
        })
    })
    describe('scorePoll method', () => {
        it('orders its output by number of votes', () => {
            const round = new game.test.GameRound([], []);
            const votes = round.scorePoll(['p1', 'p1', 'p1', 'p3', 'p2', 'p2']);

            assert.deepEqual(votes[0], ['p1', 3]);
            assert.deepEqual(votes[1], ['p2', 2]);
            assert.deepEqual(votes[2], ['p3', 1]);
            assert.equal(votes.length, 3)
        })
        it('places draws next to each other', () => {
            const round = new game.test.GameRound([], []);
            const votes = round.scorePoll(['p1', 'p1', 'p2', 'p3', 'p2']);

            assert.deepEqual(votes[2], ['p3', 1]);
            assert.equal(votes.length, 3)
            assert.includeDeepMembers(votes, [
                ['p1', 2],
                ['p2', 2],
                ['p3', 1],
            ])
        })
    })
    describe('private messaging methods', () => {
        it('adds ghosts to the private messages when requested', () => {
            const round = new game.test.GameRound(['p1', 'p2'], ['p3']);
            round.addPrivateMessage('p1', 'test', 'value')
            const messages = round.messages;

            assert.equal(messages.length, 1);
            assert.deepEqual(messages, [{
                to: ['p1', 'p3'],
                type:'test',
                content: 'value'
            }]);
        })
        it('orders the recipients', () => {
            const round = new game.test.GameRound(['p4', 'p2'], ['p1', 'p3']);
            round.addPrivateMessage('p4', 'test', 'value')
            const messages = round.messages;

            assert.equal(messages.length, 1);
            assert.deepEqual(messages, [{
                to: ['p1', 'p3', 'p4'],
                type:'test',
                content: 'value'
            }]);
        })
    })
    describe('public messaging methods', () => {
        it('adds ghosts to the private messages when requested', () => {
            const round = new game.test.GameRound(['p1', 'p2'], ['p3']);
            round.addPublicMessage('test', 'value')
            const messages = round.messages;

            assert.equal(messages.length, 1);
            assert.deepEqual(messages, [{
                to: ['p1', 'p2', 'p3'],
                type:'test',
                content: 'value'
            }]);
        })
        it('orders the recipients', () => {
            const round = new game.test.GameRound(['p4', 'p2'], ['p1', 'p3']);
            round.addPublicMessage('test', 'value')
            const messages = round.messages;

            assert.equal(messages.length, 1);
            assert.deepEqual(messages, [{
                to: ['p1', 'p2', 'p3', 'p4'],
                type:'test',
                content: 'value'
            }]);
        })
    })
});

describe('Werewolf night rounds', () => {
    describe('produces messages notifying', () => {
        it('selection of an executioner (dead or alive!)', () => {
            const players = ['p1', 'p2', 'p3', 'p4', 'p5'];
            const ghosts = [];
            const voteMap = {
                p1: {nominee: 'p2'},
                p2: {nominee: 'p2'},
                p3: {nominee: 'p2'},
                p4: {nominee: 'p2'},
                p5: {nominee: 'p3'},
            };
            const roleMap = {
                p1: {type: 'WEREWOLF', team: 'bad'},
                p2: {type: 'VILLAGER', team: 'good'},
                p3: {type: 'VILLAGER', team: 'good'},
                p4: {type: 'VILLAGER', team: 'good'},
                p5: {type: 'VILLAGER', team: 'good'},
            };
            const round = new game.NightRound(players, ghosts, voteMap, roleMap);
            const messages = round.messages;

            // two votes as p2's vote for themself is not counted as they are
            // dead - this is a bug and should be addressed when we allow ghosts
            // to vote - this will give the ghosts an oppertunity to do somthing
            assert.includeDeepMembers(messages, [{
                to: ['p1', 'p2', 'p3', 'p4', 'p5'],
                type:'executioner-elected',
                content: ['p2', 2]
            }]);
        });

        it('elimination of players', () => {
            const players = ['p1', 'p2', 'p3', 'p4', 'p5'];
            const ghosts = [];
            const voteMap = {
                p1: {nominee: 'p2'},
                p2: {nominee: 'p3'},
                p3: {nominee: 'p2'},
                p4: {nominee: 'p2'},
                p5: {nominee: 'p2'},
            };
            const roleMap = {
                p1: {type: 'WEREWOLF', team: 'bad'},
                p2: {type: 'WEREWOLF', team: 'bad'},
                p3: {type: 'VILLAGER', team: 'good'},
                p4: {type: 'VILLAGER', team: 'good'},
                p5: {type: 'VILLAGER', team: 'good'},
            };
            const round = new game.NightRound(players, ghosts, voteMap, roleMap);
            const messages = round.messages;

            assert.includeDeepMembers(messages, [{
                to: ['p1', 'p2', 'p3', 'p4', 'p5'],
                type:'eliminations',
                content: ['p2', 'p3']
            }]);
        });
        it('resurection of players', () => {
            const players = ['p1', 'p2', 'p3', 'p4', 'p5'];
            const ghosts = [];
            const voteMap = {
                p1: {nominee: 'p3'},
                p2: {nominee: 'p3'},
                p3: {nominee: 'p2'},
                p4: {nominee: 'p2'},
                p5: {nominee: 'p2'},
            };
            const roleMap = {
                p1: {type: 'WEREWOLF', team: 'bad'},
                p2: {type: 'HEALER',   team: 'good'},
                p3: {type: 'VILLAGER', team: 'good'},
                p4: {type: 'VILLAGER', team: 'good'},
                p5: {type: 'VILLAGER', team: 'good'},
            };
            const round = new game.NightRound(players, ghosts, voteMap, roleMap);
            const messages = round.messages;

            assert.includeDeepMembers(messages, [{
                to: ['p1', 'p2', 'p3', 'p4', 'p5'],
                type:'resurections',
                content: ['p3']
            }]);
        });
        it('seers successful identification of enemies', () => {
            const players = ['p1', 'p2', 'p3', 'p4', 'p5'];
            const ghosts = ['p6', 'p7'];
            const voteMap = {
                p1: {nominee: 'p3'},
                p2: {nominee: 'p1'},
                p3: {nominee: 'p2'},
                p4: {nominee: 'p2'},
                p5: {nominee: 'p2'},
            };
            const roleMap = {
                p1: {type: 'WEREWOLF', team: 'bad'},
                p2: {type: 'SEER',     team: 'good'},
                p3: {type: 'VILLAGER', team: 'good'},
                p4: {type: 'VILLAGER', team: 'good'},
                p5: {type: 'VILLAGER', team: 'good'},
            };
            const round = new game.NightRound(players, ghosts, voteMap, roleMap);
            const messages = round.messages;

            assert.includeDeepMembers(messages, [{
                to: ['p2', 'p3', 'p6', 'p7'],
                type:'seer-success',
                content: 'p1'
            }]);
        });
        it('seers unsuccessful identification of enemies', () => {
            const players = ['p1', 'p2', 'p3', 'p4', 'p5'];
            const ghosts = ['p6', 'p7'];
            const voteMap = {
                p1: {nominee: 'p3'},
                p2: {nominee: 'p3'},
                p3: {nominee: 'p2'},
                p4: {nominee: 'p2'},
                p5: {nominee: 'p2'},
            };
            const roleMap = {
                p1: {type: 'WEREWOLF', team: 'bad'},
                p2: {type: 'SEER',     team: 'good'},
                p3: {type: 'VILLAGER', team: 'good'},
                p4: {type: 'VILLAGER', team: 'good'},
                p5: {type: 'VILLAGER', team: 'good'},
            };
            const round = new game.NightRound(players, ghosts, voteMap, roleMap);
            const messages = round.messages;

            assert.includeDeepMembers(messages, [{
                to: ['p2', 'p3', 'p6', 'p7'],
                type:'seer-failure',
                content: 'p3'
            }]);
        });
    });
});

describe('Werewolf daytime rounds', () => {
    describe('produces messages notifying', () => {
        it('the vote results in a draw', () => {
            const players = ['p1', 'p2', 'p3', 'p4'];
            const ghosts = [];
            const voteMap = {
                p1: {nominee: 'p2'},
                p2: {nominee: 'p2'},
                p3: {nominee: 'p1'},
                p4: {nominee: 'p1'}
            };
            const roleMap = {
                p1: {type: 'WEREWOLF', team: 'bad'},
                p2: {type: 'VILLAGER', team: 'good'},
                p3: {type: 'VILLAGER', team: 'good'},
                p4: {type: 'VILLAGER', team: 'good'}
            };
            const round = new game.DayRound(players, ghosts, voteMap, roleMap);
            const messages = round.messages;

            assert.equal(messages.length, 1);

            const message = messages[0];
            assert.equal(message.type, 'vote-draw');
            assert.includeDeepMembers(message.to, [
                'p1', 'p2', 'p3', 'p4'
            ]);
            assert.includeDeepMembers(message.content, [
                ['p1', 2],
                ['p2', 2]
            ]);
        })
        it('the vote results in an elimination', () => {
            const players = ['p1', 'p2', 'p3', 'p4'];
            const ghosts = [];
            const voteMap = {
                p1: {nominee: 'p2'},
                p2: {nominee: 'p2'},
                p3: {nominee: 'p2'},
                p4: {nominee: 'p1'}
            };
            const roleMap = {
                p1: {type: 'WEREWOLF', team: 'bad'},
                p2: {type: 'VILLAGER', team: 'good'},
                p3: {type: 'VILLAGER', team: 'good'},
                p4: {type: 'VILLAGER', team: 'good'}
            };
            const round = new game.DayRound(players, ghosts, voteMap, roleMap);
            const messages = round.messages;

            assert.equal(messages.length, 1);

            const message = messages[0];
            assert.equal(message.type, 'execution');
            assert.includeDeepMembers(message.to, [
                'p1', 'p2', 'p3', 'p4'
            ]);
            assert.deepEqual(message.content, {
                player: 'p2',
                votes: 3
            });
        })
    })
})

describe.skip('different role abilities', () => {
    it('allow Healers to heal dead players', () => {

    })
    it('do nothing when Healers heal living players', () => {

    })
    it('allow Healers to heal themselves', () => {

    })
    it('allow Seers to see enemies', () => {

    })
    it('do nothing when Seers misidentify enemies', () => {

    })
    it('do nothinh when Seers identify themselves', () => {

    })
    it('allow killers to kill good players', () => {

    })
    it('allow killers to kill bad players', () => {

    })
    // preventing this would be possible by throwing an error and having the
    // onCall function 'wrap' it with 'operation-not-allowed' error.
    it('allow killers to kill themselves', () => {

    })

})
