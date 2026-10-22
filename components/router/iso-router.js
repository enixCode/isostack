// <iso-router>: the router element. Its behavior comes from IsoBox, its drawing from the router model.
// Load it alone with <script type="module" src=".../iso-router.js"> or import '.../iso-router.js',
// or load every element at once through index.js.
import { IsoBox } from '../../core/element.js';
import { router } from './draw.js';

export class IsoRouter extends IsoBox {
  static model = router;
}

// Defined once: loading isostack twice, or a tag already taken, leaves the first definition in place.
if (!customElements.get('iso-router')) customElements.define('iso-router', IsoRouter);
