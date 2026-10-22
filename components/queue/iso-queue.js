// <iso-queue>: the queue element. Its behavior comes from IsoBox, its drawing from the queue model.
// Load it alone with <script type="module" src=".../iso-queue.js"> or import '.../iso-queue.js',
// or load every element at once through index.js.
import { IsoBox } from '../../core/element.js';
import { queue } from './draw.js';

export class IsoQueue extends IsoBox {
  static model = queue;
}

// Defined once: loading isostack twice, or a tag already taken, leaves the first definition in place.
if (!customElements.get('iso-queue')) customElements.define('iso-queue', IsoQueue);
