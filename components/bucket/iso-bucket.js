// <iso-bucket>: the bucket element. Its behavior comes from IsoBox, its drawing from the bucket model.
// Load it alone with <script type="module" src=".../iso-bucket.js"> or import '.../iso-bucket.js',
// or load every element at once through index.js.
import { IsoBox } from '../../core/element.js';
import { bucket } from './draw.js';

export class IsoBucket extends IsoBox {
  static model = bucket;
}

// Defined once: loading isostack twice, or a tag already taken, leaves the first definition in place.
if (!customElements.get('iso-bucket')) customElements.define('iso-bucket', IsoBucket);
