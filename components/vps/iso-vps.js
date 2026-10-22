// <iso-vps>: the VPS element. Its behavior comes from IsoBox, its drawing from the vps model.
// Load it alone with <script type="module" src=".../iso-vps.js"> or import '.../iso-vps.js',
// or load every element at once through index.js.
import { IsoBox } from '../../core/element.js';
import { vps } from './draw.js';

export class IsoVps extends IsoBox {
  static model = vps;
}

// Defined once: loading isostack twice, or a tag already taken, leaves the first definition in place.
if (!customElements.get('iso-vps')) customElements.define('iso-vps', IsoVps);
