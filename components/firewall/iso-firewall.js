// <iso-firewall>: the firewall element. Its behavior comes from IsoBox, its drawing from the firewall model.
// Load it alone with <script type="module" src=".../iso-firewall.js"> or import '.../iso-firewall.js',
// or load every element at once through index.js.
import { IsoBox } from '../../core/element.js';
import { firewall } from './draw.js';

export class IsoFirewall extends IsoBox {
  static model = firewall;
}

// Defined once: loading isostack twice, or a tag already taken, leaves the first definition in place.
if (!customElements.get('iso-firewall')) customElements.define('iso-firewall', IsoFirewall);
