// <iso-docker>: the Docker host element. Its behavior comes from IsoBox, its drawing from the docker model.
// Load it alone with <script type="module" src=".../iso-docker.js"> or import '.../iso-docker.js',
// or load every element at once through index.js.
import { IsoBox } from '../../core/element.js';
import { docker } from './draw.js';

export class IsoDocker extends IsoBox {
  static model = docker;
}

// Defined once: loading isostack twice, or a tag already taken, leaves the first definition in place.
if (!customElements.get('iso-docker')) customElements.define('iso-docker', IsoDocker);
