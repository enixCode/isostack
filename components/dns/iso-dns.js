// <iso-dns>: the dns element. Its behavior comes from IsoBox, its drawing from the dns model.
// Load it alone with <script type="module" src=".../iso-dns.js"> or import '.../iso-dns.js',
// or load every element at once through index.js.
import { IsoBox } from '../../core/element.js';
import { dns } from './draw.js';

export class IsoDns extends IsoBox {
  static model = dns;
}

// Defined once: loading isostack twice, or a tag already taken, leaves the first definition in place.
if (!customElements.get('iso-dns')) customElements.define('iso-dns', IsoDns);
