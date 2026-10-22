// <iso-server>: the server element. Its behavior comes from IsoBox, its drawing from the server model.
// Load it alone with <script type="module" src=".../iso-server.js"> or import '.../iso-server.js',
// or load every element at once through index.js.
import { IsoBox } from '../../core/element.js';
import { server } from './draw.js';

export class IsoServer extends IsoBox {
  static model = server;
}

// Defined once: loading isostack twice, or a tag already taken, leaves the first definition in place.
if (!customElements.get('iso-server')) customElements.define('iso-server', IsoServer);
