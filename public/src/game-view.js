import {LitElement, html, css} from 'https://unpkg.com/lit-element/lit-element.js?module';
import './view-landing.js';
import './view-lobby.js';

customElements.define('game-view', class extends LitElement {
    constructor() {
        super();
        this.players = [{name: 'Felicia'}, {name: 'Beth'}]
    }

    static get properties() {
        return {
            mood: {type: String}
        }
    }

    static get styles() {
        return css`.mood { color: green; }`;
    }

    render() {
        return html`
        <h1>This is the game view</h1>
        <view-landing> </view-landing>
        <view-lobby .players=${this.players}> </view-lobby>
        <view-role> </view-role>
        <view-day-vote> </view-day-vote>
        <view-night-vote> </view-night-vote>
        <view-end-round> </view-end-round>`
    }
});
