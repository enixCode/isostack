// <iso-desktop>: the desktop element. Its behavior comes from IsoBox, its drawing from the desktop model.
// Load it alone with <script type="module" src=".../iso-desktop.js"> or import '.../iso-desktop.js',
// or load every element at once through index.js.
import { IsoBox } from '../../core/element.js';
import { desktop } from './draw.js';

export class IsoDesktop extends IsoBox {
  static model = desktop;
}

// Defined once: loading isostack twice, or a tag already taken, leaves the first definition in place.
if (!customElements.get('iso-desktop')) customElements.define('iso-desktop', IsoDesktop);
