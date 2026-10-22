// <iso-rack>: the rack element. Its behavior comes from IsoBox, its drawing from the rack model.
// Load it alone with <script type="module" src=".../iso-rack.js"> or import '.../iso-rack.js',
// or load every element at once through index.js.
import { IsoBox } from '../../core/element.js';
import { rack } from './draw.js';

export class IsoRack extends IsoBox {
  static model = rack;
}

// Defined once: loading isostack twice, or a tag already taken, leaves the first definition in place.
if (!customElements.get('iso-rack')) customElements.define('iso-rack', IsoRack);
