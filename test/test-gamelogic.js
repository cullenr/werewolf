const gameLogic = require('../functions/gamelogic.js');

describe('Werewolf game rules', () => {
    describe('should decide round ending actions accordingly for', () => {
        describe('a game-over when the good guys win', () => {
            // the players voted to kill the last werewolf
            it('at the end of a day round', () => {
            })
            // players can kill eachother
            it('at the end of a night round (1v1)', () => {
            })
            // a ring of players voted for eachother
            it('at the end of a night round (1v1v1)', () => {
            })
        })
        describe('a game-over when the bad guys win', () => {
            // the bad guys voted off the last good player
            it('at the end of a day round', () => {
            })
            // the bad guys killed the last good player
            it('at the end of a night round', () => {
            })
        })
        it('the game not being over yet but a player is eliminted', () => {
        
        })
    })
    describe('should end "day" rounds accordingly when', () => {
        it('the vote has resulted in a draw', () => {
        
        })
    })
    describe('at night', () => {
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
})
