// <iso-user>: the user element. Its behavior comes from IsoBox, its drawing from the user model.
// Load it alone with <script type="module" src=".../iso-user.js"> or import '.../iso-user.js',
// or load every element at once through index.js.
import { IsoBox } from '../../core/element.js';
import { user } from './draw.js';

export class IsoUser extends IsoBox {
  static model = user;
}

// Defined once: loading isostack twice, or a tag already taken, leaves the first definition in place.
if (!customElements.get('iso-user')) customElements.define('iso-user', IsoUser);
