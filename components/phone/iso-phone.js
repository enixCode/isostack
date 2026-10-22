// <iso-phone>: the phone element. Its behavior comes from IsoBox, its drawing from the phone model.
// Load it alone with <script type="module" src=".../iso-phone.js"> or import '.../iso-phone.js',
// or load every element at once through index.js.
import { IsoBox } from '../../core/element.js';
import { phone } from './draw.js';

export class IsoPhone extends IsoBox {
  static model = phone;
}

// Defined once: loading isostack twice, or a tag already taken, leaves the first definition in place.
if (!customElements.get('iso-phone')) customElements.define('iso-phone', IsoPhone);
