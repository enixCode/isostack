// <iso-switch>: the network switch element. Its behavior comes from IsoBox, its drawing from the switch model.
// Load it alone with <script type="module" src=".../iso-switch.js"> or import '.../iso-switch.js',
// or load every element at once through index.js.
import { IsoBox } from '../../core/element.js';
import { switch as networkSwitch } from './draw.js';

export class IsoSwitch extends IsoBox {
  static model = networkSwitch;
}

// Defined once: loading isostack twice, or a tag already taken, leaves the first definition in place.
if (!customElements.get('iso-switch')) customElements.define('iso-switch', IsoSwitch);
