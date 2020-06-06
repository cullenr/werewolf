import {LitElement, html, css} from 'https://unpkg.com/lit-element/lit-element.js?module';

import './player-card.js'

customElements.define('view-lobby', class extends LitElement {
    constructor() {
        super()
        this.players = [];
    }

    static get properties() {
        return {
            players: {type: Array}
        }
    }
    renderPlayerCard(player) {
        return html`<player-card name=${player.name}></player-card>`;
    }

    render() {
        return html`
        <button @click=${}>READY!</button>
        <li>
            ${this.players.map(this.renderPlayerCard)}
        </li>
    `
    }
});

