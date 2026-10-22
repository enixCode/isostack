// <iso-cache>: the cache element. Its behavior comes from IsoBox, its drawing from the cache model.
// Load it alone with <script type="module" src=".../iso-cache.js"> or import '.../iso-cache.js',
// or load every element at once through index.js.
import { IsoBox } from '../../core/element.js';
import { cache } from './draw.js';

export class IsoCache extends IsoBox {
  static model = cache;
}

// Defined once: loading isostack twice, or a tag already taken, leaves the first definition in place.
if (!customElements.get('iso-cache')) customElements.define('iso-cache', IsoCache);
