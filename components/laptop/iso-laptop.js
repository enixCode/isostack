// <iso-laptop>: the laptop element. Its behavior comes from IsoBox, its drawing from the laptop model.
// Load it alone with <script type="module" src=".../iso-laptop.js"> or import '.../iso-laptop.js',
// or load every element at once through index.js.
import { IsoBox } from '../../core/element.js';
import { laptop } from './draw.js';

export class IsoLaptop extends IsoBox {
  static model = laptop;
}

// Defined once: loading isostack twice, or a tag already taken, leaves the first definition in place.
if (!customElements.get('iso-laptop')) customElements.define('iso-laptop', IsoLaptop);
