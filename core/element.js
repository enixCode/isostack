// IsoBox: the generic Web Component of the family (iso-server, iso-db, iso-app...).
// It draws nothing itself: it reads its attributes, shows in its Shadow DOM the SVG drawn by
// core/draw.js, publishes its anchor and position, holds the children of a container, and handles
// the mouse (blue cubes, click and hover). An update touches only what changed: a status change and
// the blue cubes never redraw, and the lights of an element out of view or paused stand still.
import { CELL, SHARED_CSS, place, normalize, layers, describe } from './draw.js';

// Screen direction of the axis each cube pulls (unit vectors).
const AXES = { width: [.866, .5], depth: [-.866, .5] };

// Small blue cube of side c, whose deepest bottom corner is at (x, y, z).
const cube = (axis, x, y, z, c = 18) => `<g class="handle" data-axis="${axis}">
  <rect ${place('top', x, y + c, z)} width="${c}" height="${c}" fill="#60a5fa"/>
  <rect ${place('front', x, y + c, z + c)} width="${c}" height="${c}" fill="#3b82f6"/>
  <rect ${place('side', x + c, y + c, z + c)} width="${c}" height="${c}" fill="#1d4ed8"/>
</g>`;

const number = v => Number.isFinite(parseFloat(v)) ? parseFloat(v) : 0;

// Layout and mouse: only the drawn shapes react, not the rectangle around them.
const CSS = `
  :host { display: inline-block; pointer-events: none; }
  :host([hidden]) { display: none; }
  /* The position variables published on the host stop at the frame: left to flow into the drawing,
     they would style all of it again each time the element moves. */
  .frame { position: relative; --iso-anchor-x: initial; --iso-anchor-y: initial; --iso-offset-x: initial; --iso-offset-y: initial; --iso-order: initial; }
  svg { position: absolute; left: 0; top: 0; display: block; overflow: visible; user-select: none; -webkit-user-select: none; }
  .drawing { pointer-events: auto; }
  .ground { pointer-events: none; }
  /* Open, the faded cover lets the mouse reach the elements inside. */
  [data-open] .cover, [data-open] .edge { pointer-events: none; }
  /* Children of a container: between the inside and the cover, each standing at its own x, y, z
     cells from the back corner of the floor, painted back to front. A closed container does not draw
     them at all (the switch to none waits for the end of the fade, where supported). */
  .children { position: absolute; width: 0; height: 0; z-index: 0; display: none; transition: display .4s allow-discrete; }
  [data-open] .children { display: block; }
  ::slotted(*) {
    position: absolute; left: 0; top: 0; z-index: var(--iso-order, 0);
    translate: calc(var(--iso-offset-x, 0px) - var(--iso-anchor-x, 0px)) calc(var(--iso-offset-y, 0px) - var(--iso-anchor-y, 0px));
  }
  /* A page zooms the element from outside, which a non-scaling stroke does not follow in Chromium, yet
     such a stroke costs paint time at every zoom step: the element draws its strokes in plain units. A
     face lies skewed, which thins its strokes to .866: 1.73 and 1.155 give back the 1.5 and 1 unit of a
     standalone drawing. Outlines in world view (cylinders, globes) are not skewed: they keep 1.5. */
  .frame .edge, .frame .inside rect, .frame .floor-grid { vector-effect: none; }
  .frame rect.edge { stroke-width: 1.73; }
  .frame .inside rect, .frame .floor-grid { stroke-width: 1.155; }
  .handle rect { stroke: #1e3a8a; stroke-linejoin: round; stroke-width: 1.155; }
  [data-axis="width"] { cursor: nwse-resize; }
  [data-axis="depth"] { cursor: nesw-resize; }
  /* Paused, or out of view: the lights stand still. A rule on the lights themselves, not a variable
     that every shape inherits, keeps this cheap to switch. */
  [data-still] .activity, [data-still] .pulse, [data-still] .fault { animation-play-state: paused; }
  /* While the cover fades back in, its lights stay still, so that they fade with it (see draw.js). */
  [data-closing] .cover .activity, [data-closing] .cover .pulse, [data-closing] .cover .fault { animation: none; }
  @media (prefers-reduced-motion: reduce) { .children { transition: none; } }
`;

// Constructable stylesheets, adopted by the shadow roots instead of a <style> each: one for the whole
// family (the shared look and this file's CSS), and one per model that has CSS of its own.
const sheetOf = css => {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  return sheet;
};
let shared;
const sheets = new WeakMap();
function sheetsOf(model) {
  shared ??= sheetOf(SHARED_CSS + CSS);
  if (!sheets.has(model)) sheets.set(model, model.css ? [shared, sheetOf(model.css)] : [shared]);
  return sheets.get(model);
}

// Shifts the lights of each element by a whole number of beats (see the animations in draw.js), so
// that devices of a kind do not blink together while every change still falls on the beat.
let count = 0;

export class IsoBox extends HTMLElement {
  // The common contract: every component accepts these attributes, and may add its own.
  static observedAttributes = ['width', 'depth', 'height', 'status', 'label', 'resizable', 'open', 'paused', 'x', 'y', 'z'];
  // The component drawing (title, sizes, CSS, faces or art): each subclass provides its own.
  static model;
  // One observer for every element: an element out of view stops its lights, so that a long page or a
  // big diagram only animates what it shows. The margin starts them just before they come into view.
  static #seen = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(entries => { for (const { target, isIntersecting } of entries) target.#hide(!isIntersecting); }, { rootMargin: '128px' })
    : null;
  #frame; #anchor; #origin = [0, 0];
  #drawn = false; // true once the drawing is in the Shadow DOM
  #read = null; // the normalized attributes, kept until one of them changes
  #published = ''; // the last position rule written
  #away = false; // out of view
  #closing = 0; // timer of the closing fade
  #drag = null; // cube drag in progress
  #swallowClick = false; // true right after a cube drag, to swallow the click that follows

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.adoptedStyleSheets = sheetsOf(this.constructor.model);
    root.innerHTML = '<style></style><div class="frame"></div>';
    this.#anchor = root.querySelector('style');
    // The frame stays in place when the drawing changes: it keeps the pointer capture during a drag.
    this.#frame = root.querySelector('.frame');
    this.#frame.style.setProperty('--_phase', `-${(count++ * 5 % 12 * .2).toFixed(1)}s`);
    this.#frame.addEventListener('pointerdown', e => this.#grab(e));
    this.#frame.addEventListener('pointermove', e => this.#move(e));
    for (const type of ['pointerup', 'pointercancel']) this.#frame.addEventListener(type, () => this.#release());
    // A cube drag is not a click on the element: the click that follows it is swallowed.
    root.addEventListener('click', e => this.#swallowClick && e.stopPropagation(), true);
  }

  // JS properties, mirrors of the attributes.
  get width() { return this.#options().width; }
  set width(v) { this.setAttribute('width', v); }
  get depth() { return this.#options().depth; }
  set depth(v) { this.setAttribute('depth', v); }
  get height() { return this.#options().height; }
  set height(v) { this.setAttribute('height', v); }
  get status() { return this.#options().status; }
  set status(v) { this.setAttribute('status', v); }
  get label() { return this.#options().label; }
  set label(v) { this.setAttribute('label', v); }
  get resizable() { return this.hasAttribute('resizable'); }
  set resizable(v) { this.toggleAttribute('resizable', Boolean(v)); }
  get open() { return this.hasAttribute('open'); }
  set open(v) { this.toggleAttribute('open', Boolean(v)); }
  // Freezes the lights: cheaper to switch on many elements than the --iso-animation variable.
  get paused() { return this.hasAttribute('paused'); }
  set paused(v) { this.toggleAttribute('paused', Boolean(v)); }
  // Position in a container (or a page grid), in cells: x along the width, z along the depth, y up.
  get x() { return number(this.getAttribute('x')); }
  set x(v) { this.setAttribute('x', v); }
  get y() { return number(this.getAttribute('y')); }
  set y(v) { this.setAttribute('y', v); }
  get z() { return number(this.getAttribute('z')); }
  set z(v) { this.setAttribute('z', v); }

  // Attributes read and clamped by core/draw.js, exactly like the options of a .svg file. Read once
  // for all the getters, until an attribute changes.
  #options() {
    if (!this.#read) {
      const raw = {};
      for (const name of this.constructor.observedAttributes) raw[name] = this.getAttribute(name);
      this.#read = normalize(this.constructor.model, raw);
    }
    return this.#read;
  }

  // Drawn on the first connection, whatever the number of attributes set before.
  connectedCallback() {
    if (!this.#drawn) this.#render();
    IsoBox.#seen?.observe(this);
  }

  disconnectedCallback() { IsoBox.#seen?.unobserve(this); }

  attributeChangedCallback(name, before, after) {
    if (before === after) return;
    this.#read = null;
    if (!this.#drawn) return;
    if (name === 'open') this.#open();
    else if (name === 'status') this.#recolor();
    else if (name === 'resizable') this.#handles();
    else if (name === 'paused') this.#still();
    else if (name === 'x' || name === 'y' || name === 'z') this.#publish();
    else this.#render();
  }

  #render() {
    const model = this.constructor.model, l = layers(model, this.#options());
    const view = `viewBox="${-l.originX} ${-l.originY} ${l.wide} ${l.tall}" width="${l.wide}" height="${l.tall}"`;
    this.#origin = [l.originX, l.originY];
    this.#frame.style.width = `${l.wide}px`;
    this.#frame.style.height = `${l.tall}px`;
    this.#frame.dataset.status = l.o.status;
    this.#frame.toggleAttribute('data-open', l.o.open);
    const cubes = this.resizable ? this.#cubes(l.o) : '';
    // A container draws its back (ground, inside), then holds its children, then draws its front
    // (cover, edges, cubes). Anything else is one drawing.
    this.#frame.innerHTML = model.container
      ? `<svg ${view} ${l.a11y}><defs>${l.defs}</defs><g class="drawing">${l.back}${l.inside}</g></svg>`
        + `<div class="children" style="left: ${l.originX}px; top: ${l.originY}px"><slot></slot></div>`
        + `<svg ${view} aria-hidden="true"><g class="drawing">${l.front}${cubes}</g></svg>`
      : `<svg ${view} ${l.a11y}><defs>${l.defs}</defs><g class="drawing">${l.back}${l.front}${cubes}</g></svg>`;
    this.#drawn = true;
    this.#still();
    this.#publish();
  }

  // Opening only changes CSS: the drawings stay in place so that the fade can play. Only a container
  // opens. Closing keeps the cover's lights still for the 0.4 s of the fade.
  #open() {
    if (!this.constructor.model.container) return;
    this.#frame.toggleAttribute('data-open', this.open);
    clearTimeout(this.#closing);
    this.#frame.toggleAttribute('data-closing', !this.open);
    if (!this.open) this.#closing = setTimeout(() => this.#frame.removeAttribute('data-closing'), 400);
  }

  // The status is pure CSS (data-status on the frame): the lights and the halo follow, nothing is drawn
  // again. Only the name read aloud changes.
  #recolor() {
    const o = this.#options();
    this.#frame.dataset.status = o.status;
    this.#frame.querySelector('svg').setAttribute('aria-label', describe(this.constructor.model, o));
  }

  // The blue cubes come and go alone, at the end of the front drawing.
  #handles() {
    const front = this.#frame.querySelector('svg:last-of-type > .drawing'), shown = front.querySelectorAll('.handle');
    if (this.resizable && !shown.length) front.insertAdjacentHTML('beforeend', this.#cubes(this.#options()));
    else if (!this.resizable) for (const handle of shown) handle.remove();
  }

  // The lights stand still while the element is paused or out of view.
  #still() { this.#frame.toggleAttribute('data-still', this.paused || this.#away); }

  #hide(away) {
    this.#away = away;
    this.#still();
  }

  // Published on the host: the anchor (where the back corner on the ground falls in the element's
  // box), and the offset and paint order of its x, y, z position, used by a container or a page.
  #publish() {
    const { x, y, z } = this, o = this.#options(), [ax, ay] = this.#origin;
    const order = Math.round((x + o.width / 2 + z + o.depth / 2) * 1000 + y * 10);
    const css = `:host { --iso-anchor-x: ${ax}px; --iso-anchor-y: ${ay}px; `
      + `--iso-offset-x: ${.866 * (x - z) * CELL}px; --iso-offset-y: ${(.5 * (x + z) - y) * CELL}px; --iso-order: ${order}; }`;
    // Written only when a value moved: a page that sets x and z on every element costs nothing for the rest.
    if (css === this.#published) return;
    this.#anchor.textContent = this.#published = css;
  }

  // Blue cubes: middle of the front for the depth, middle of the side for the width, only on the
  // axes the model lets grow.
  #cubes(o) {
    const W = o.width * CELL, D = o.depth * CELL, H = o.height * CELL;
    return (this.#grows('depth') ? cube('depth', W / 2 - 9, H / 2 - 9, D) : '')
      + (this.#grows('width') ? cube('width', W, H / 2 - 9, D / 2 - 9) : '');
  }

  #grows(axis) {
    const model = this.constructor.model;
    return (model.maximum?.[axis] ?? Infinity) > model.minimum[axis] && !(axis === 'depth' && model.square);
  }

  #grab(e) {
    const handle = e.target.closest('[data-axis]');
    if (!handle) return;
    // The drag belongs to the cube: the page must not, for instance, pan its view at the same time.
    e.stopPropagation();
    const axis = handle.dataset.axis;
    // Screen scale of the element, page zoom included, to turn pixels into units.
    const scale = this.#frame.querySelector('svg').getScreenCTM().a;
    this.#drag = { axis, x: e.clientX, y: e.clientY, start: this[axis], scale };
    this.#frame.setPointerCapture(e.pointerId);
  }

  #move(e) {
    if (!this.#drag) return;
    const { axis, x, y, start, scale } = this.#drag, [ax, ay] = AXES[axis], model = this.constructor.model;
    // Mouse drag projected on the cube axis, in whole cells, within the model limits.
    const cells = Math.round(start + (ax * (e.clientX - x) + ay * (e.clientY - y)) / scale / CELL);
    const v = Math.min(model.maximum?.[axis] ?? Infinity, Math.max(model.minimum[axis], cells));
    if (v === this[axis]) return;
    this[axis] = v;
    this.dispatchEvent(new Event('input', { bubbles: true }));
  }

  #release() {
    if (!this.#drag) return;
    const { axis, start } = this.#drag;
    this.#drag = null;
    this.#swallowClick = true;
    setTimeout(() => this.#swallowClick = false);
    if (this[axis] !== start) this.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
