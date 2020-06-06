import {LitElement, html, css} from 'https://unpkg.com/lit-element/lit-element.js?module';


customElements.define('player-card', class extends LitElement {
    constructor() {
        super()
        this.name = 'Mysterious Stranger';
    }

    static get properties() {
        return {
            name: {type: String}
        }
    }

    render() {
        return html`<h3>${this.name}</h3>
        <!-- this slot should contain a button for the various voting purposes-->
        <slot name="action"></slot>`
    }
});
