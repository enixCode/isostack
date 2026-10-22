// <iso-raspberry-pi>: the Raspberry Pi element. Its behavior comes from IsoBox, its drawing from the raspberryPi model.
// Load it alone with <script type="module" src=".../iso-raspberry-pi.js"> or import '.../iso-raspberry-pi.js',
// or load every element at once through index.js.
import { IsoBox } from '../../core/element.js';
import { raspberryPi } from './draw.js';

export class IsoRaspberryPi extends IsoBox {
  static model = raspberryPi;
}

// Defined once: loading isostack twice, or a tag already taken, leaves the first definition in place.
if (!customElements.get('iso-raspberry-pi')) customElements.define('iso-raspberry-pi', IsoRaspberryPi);
