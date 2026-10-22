// <iso-load-balancer>: the load balancer element. Its behavior comes from IsoBox, its drawing from the
// load balancer model. Load it alone with <script type="module" src=".../iso-load-balancer.js"> or
// import '.../iso-load-balancer.js', or load every element at once through index.js.
import { IsoBox } from '../../core/element.js';
import { loadBalancer } from './draw.js';

export class IsoLoadBalancer extends IsoBox {
  static model = loadBalancer;
}

// Defined once: loading isostack twice, or a tag already taken, leaves the first definition in place.
if (!customElements.get('iso-load-balancer')) customElements.define('iso-load-balancer', IsoLoadBalancer);
