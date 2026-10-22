// <iso-storage>: the storage element. Its behavior comes from IsoBox, its drawing from the storage model.
// Load it alone with <script type="module" src=".../iso-storage.js"> or import '.../iso-storage.js',
// or load every element at once through index.js.
import { IsoBox } from '../../core/element.js';
import { storage } from './draw.js';

export class IsoStorage extends IsoBox {
  static model = storage;
}

// Defined once: loading isostack twice, or a tag already taken, leaves the first definition in place.
if (!customElements.get('iso-storage')) customElements.define('iso-storage', IsoStorage);
