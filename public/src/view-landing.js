import {LitElement, html, css} from 'https://unpkg.com/lit-element/lit-element.js?module';


customElements.define('view-landing', class extends LitElement {
    constructor() {
        super()
        this.isWorking = false;
    }

    showJoinDialogue() {
        const gameId = window.prompt('Please enter a game id');
        if (gameId) {
            this.isWorking = true;
            console.log(gameId);
        }
    }

    createGame() {
        this.isWorking = true;
    }

    render() {
        return html`
        <button @click=${this.showJoinDialogue} ?disabled=${this.isWorking}>JOIN</button>
        <button @click=${this.createGame} ?disabled=${this.isWorking} >HOST</button>
    `
    }
});
