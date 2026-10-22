// <iso-cloud>: the cloud element. Its behavior comes from IsoBox, its drawing from the cloud model.
// Load it alone with <script type="module" src=".../iso-cloud.js"> or import '.../iso-cloud.js',
// or load every element at once through index.js.
import { IsoBox } from '../../core/element.js';
import { cloud } from './draw.js';

export class IsoCloud extends IsoBox {
  static model = cloud;
}

// Defined once: loading isostack twice, or a tag already taken, leaves the first definition in place.
if (!customElements.get('iso-cloud')) customElements.define('iso-cloud', IsoCloud);
