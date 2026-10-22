// <iso-db>: the database element. Its behavior comes from IsoBox, its drawing from the db model.
// Load it alone with <script type="module" src=".../iso-db.js"> or import '.../iso-db.js',
// or load every element at once through index.js.
import { IsoBox } from '../../core/element.js';
import { db } from './draw.js';

export class IsoDb extends IsoBox {
  static model = db;
}

// Defined once: loading isostack twice, or a tag already taken, leaves the first definition in place.
if (!customElements.get('iso-db')) customElements.define('iso-db', IsoDb);
