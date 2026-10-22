// <iso-app>: the app element. Its behavior comes from IsoBox, its drawing from the app model.
// Load it alone with <script type="module" src=".../iso-app.js"> or import '.../iso-app.js',
// or load every element at once through index.js.
import { IsoBox } from '../../core/element.js';
import { app } from './draw.js';

export class IsoApp extends IsoBox {
  static model = app;
}

// Defined once: loading isostack twice, or a tag already taken, leaves the first definition in place.
if (!customElements.get('iso-app')) customElements.define('iso-app', IsoApp);
