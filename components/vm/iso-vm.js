// <iso-vm>: the virtual machine element. Its behavior comes from IsoBox, its drawing from the vm model.
// Load it alone with <script type="module" src=".../iso-vm.js"> or import '.../iso-vm.js',
// or load every element at once through index.js.
import { IsoBox } from '../../core/element.js';
import { vm } from './draw.js';

export class IsoVm extends IsoBox {
  static model = vm;
}

// Defined once: loading isostack twice, or a tag already taken, leaves the first definition in place.
if (!customElements.get('iso-vm')) customElements.define('iso-vm', IsoVm);
