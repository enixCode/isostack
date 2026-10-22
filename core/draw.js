// Drawing shared by every component: isometric projection, the generic box and free shapes.
// Pure functions: they return SVG text and never touch the DOM. The element (element.js) shows
// that text in its Shadow DOM; a Node script can write it as is to a .svg file.

// A grid cell is 40 units, and a unit is one pixel at zoom 1.
// The margin leaves room for the soft status halo, so that an <img> does not cut it.
export const CELL = 40, MARGIN = 64;

// Screen point of the world point (x, y, z); y is the height.
export const iso = (x, y, z) => [.866 * (x - z), .5 * (x + z) - y];

// Each face is drawn flat in its own frame, then laid in isometric view by a matrix
// (cos 30° = .866): lying down (top), facing forward (front) or facing right (side).
// (x, y, z) is the world point where the face origin lands.
const PLANES = { top: '.866 .5 -.866 .5', front: '.866 .5 0 1', side: '.866 -.5 0 1' };
export const place = (plane, x, y, z) => `transform="matrix(${PLANES[plane]} ${iso(x, y, z).join(' ')})"`;
// A drawing already in world view around the origin, such as a cylinder, moved to (x, y, z).
export const move = (x, y, z) => `transform="translate(${iso(x, y, z).join(' ')})"`;

export const escapeXml = text => text.replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);

// Accessible name of a drawing, as plain text: "Server srv-01, status ok".
export const describe = (model, o) => `${model.title}${o.label ? ' ' + o.label : ''}, status ${o.status}`;

// Shared look. This CSS travels inside the SVG, which must stay valid XML: no < or & in it.
// The data-status and data-open attributes sit on the svg root in a file, and on the frame
// around the drawings in the element. Nothing in a drawing depends on the status: a status change
// is this CSS alone, and the element never redraws for it.
const CSS = `
  /* Status goes through inherited variables (--_ prefix: internal): they are the only ones that
     reach the copies made by use, such as the network ports. */
  [data-status] {
    --_color: var(--iso-ok, #22c55e); --_disk: var(--iso-ok, #22c55e); --_disk-anim: activity;
    --_fault: #3a2d18; --_fault-anim: none;
  }
  [data-status="warn"] { --_color: var(--iso-warn, #f59e0b); --_fault: var(--_color); }
  [data-status="down"] {
    --_color: var(--iso-down, #ef4444); --_fault: var(--_color); --_fault-anim: pulse;
    --_disk: #1f2a22; --_disk-anim: none;
  }
  /* Unknown: no data, so a grey status light and no disk activity. */
  [data-status="unknown"] { --_color: var(--iso-unknown, #94a3b8); --_disk: #2b313d; --_disk-anim: none; }
  /* Cover: the front faces fade out when the box is open, to show the inside. */
  .cover { transition: opacity .4s; }
  [data-open] .cover { opacity: .08; }
  /* Inside: painted only while the box is open, and through the fade that follows closing it (the
     switch to none waits for the end of the transition, where supported). */
  .inside { display: none; transition: display .4s allow-discrete; }
  [data-open] .inside { display: inline; }
  .inside rect { stroke: #2a303b; vector-effect: non-scaling-stroke; }
  .floor-grid { fill: none; stroke: #c3cad5; stroke-width: 1; vector-effect: non-scaling-stroke; }
  /* Front edges fade partly with the cover; the back ones stay sharp. */
  .edge { fill: none; stroke: #0f1218; stroke-width: 1.5; stroke-linejoin: round; vector-effect: non-scaling-stroke; transition: opacity .4s; }
  [data-open] .edge { opacity: .35; }
  /* Status halo on the ground, warn and down only, in the status color. */
  .halo { display: none; }
  [data-status="warn"] .halo, [data-status="down"] .halo { display: inline; }
  .halo-core { fill: var(--_color); }
  .halo-fade stop { stop-color: var(--_color); }
  /* Lights glow without a filter: a 2 units wide band around the dot, under its flat core, painted by
     a radial gradient of its own color (see glow below). */
  .led, .fault { stroke-width: 4; paint-order: stroke; pointer-events: none; }
  .led.blue { stroke: url(#glow-blue); }
  .led.status { stroke: url(#glow-status); }
  .led.activity { stroke: url(#glow-disk); }
  .fault { stroke: url(#glow-fault); }
  .blue { fill: #38bdf8; }
  .status { fill: var(--_color); }
  .screw { fill: #11151b; stroke: #4b5467; }
  .label { font: 700 14px ui-monospace, Consolas, monospace; fill: #1e293b; }
  /* Animations. A light is lit or dim, never half way, and every change of every light falls on one
     shared beat of .2 s, so that the browser repaints a few times a second instead of at every frame.
     --period (a whole number of 2.4 s turns; 0 keeps the light lit) and --delay (whole beats) place a
     light in the pattern; the element shifts all its lights by --_phase, so that devices of a kind do
     not blink together. --iso-speed speeds the beat up or down, --iso-animation: paused freezes it. */
  .activity { fill: var(--_disk); animation: var(--_disk-anim) calc(var(--period, 2.4s) / var(--iso-speed, 1)) calc((var(--delay, 0s) + var(--_phase, 0s)) / var(--iso-speed, 1)) step-end infinite var(--iso-animation, running); }
  .pulse { animation: pulse calc(2.4s / var(--iso-speed, 1)) calc(var(--_phase, 0s) / var(--iso-speed, 1)) step-end infinite var(--iso-animation, running); }
  .fault { fill: var(--_fault); animation: var(--_fault-anim) calc(.8s / var(--iso-speed, 1)) step-end infinite var(--iso-animation, running); }
  @keyframes activity { 0%, 25%, 66.667%, 83.333% { opacity: 1; } 16.667%, 50%, 75% { opacity: .15; } }
  @keyframes pulse { 0% { opacity: 1; } 50% { opacity: .3; } }
  /* An animated light is moved to a layer of its own, which would not fade with the cover: the lights of
     an open cover stand still (the element also keeps them still through the fade that closes it). */
  [data-open] .cover .activity, [data-open] .cover .pulse, [data-open] .cover .fault { animation: none; }
  @media (prefers-reduced-motion: reduce) {
    .activity, .pulse, .fault { animation: none !important; }
    .cover, .edge, .inside { transition: none; }
  }
`;
// The look shared by the whole family, for the element, which adopts it once for all its instances.
export const SHARED_CSS = CSS;

// Halo of a light: a radial gradient in the color of the light, painted as the stroke of its circle.
// The gradient follows each circle (bounding-box units) and ends 1.75 radii from its center; its stops
// follow the tail of a blur 1.8 units wide. A gradient takes its color where it sits, under the
// data-status frame, so there is one per kind of light, each reading the variable of its light.
const glow = (name, color) => `
  <radialGradient id="glow-${name}" r=".875" style="color: ${color}">
    <stop offset=".571" stop-color="currentColor" stop-opacity=".42"/>
    <stop offset=".77" stop-color="currentColor" stop-opacity=".18"/>
    <stop offset="1" stop-color="currentColor" stop-opacity="0"/>
  </radialGradient>`;

// Stops of a soft ring (see soft()): the opacity falls from alpha at the inner end to nothing at the
// outer end along the curve p of a blurred edge, sampled evenly. The corner gradient borrows them.
const stops = (alpha, p, color = '') => p.map((v, i) => `<stop offset="${+(i / (p.length - 1)).toFixed(2)}" ${color}stop-opacity="${+(alpha * v).toFixed(3)}"/>`).join('');

// Shared <defs>, one entry per id. A model prefixes its own ids with its name, so they never clash
// with these. A drawing keeps only the ones it refers to.
const DEFS = {
  perforation: `
  <pattern id="perforation" width="6" height="6" patternUnits="userSpaceOnUse">
    <circle cx="3" cy="3" r="1.3" fill="#0d1015"/>
  </pattern>`,
  slots: `
  <pattern id="slots" width="8" height="10" patternUnits="userSpaceOnUse">
    <rect width="4" height="10" fill="#0d1015"/>
  </pattern>`,
  'glow-status': glow('status', 'var(--_color)'),
  'glow-disk': glow('disk', 'var(--_disk)'),
  'glow-fault': glow('fault', 'var(--_fault)'),
  'glow-blue': glow('blue', '#38bdf8'),
  // Ground shadow: the 32 units of its ring fade like a blur of 8, in strips and in corners.
  'shadow-edge': `
  <linearGradient id="shadow-edge" gradientUnits="userSpaceOnUse" x2="32">${stops(.2, [1, .759, .241, 0], 'stop-color="#0b1020" ')}</linearGradient>`,
  'shadow-corner': `
  <radialGradient id="shadow-corner" href="#shadow-edge" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="32"/>`,
  // Status halo: the 52 units of its ring fade like a blur of 14, in the status color.
  'halo-edge': `
  <linearGradient id="halo-edge" class="halo-fade" gradientUnits="userSpaceOnUse" x2="52">${stops(.55, [1, .815, .45, .128, 0])}</linearGradient>`,
  'halo-corner': `
  <radialGradient id="halo-corner" href="#halo-edge" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="52"/>`,
  // A network port; its link lights are a copy of their own (see ports() in parts.js).
  port: `
  <g id="port">
    <rect width="10" height="8" rx="1" fill="#0d1015" stroke="#394151"/>
    <rect x="3" y="3" width="4" height="3" fill="#1b2029"/>
  </g>
  <g id="port-leds"><circle cx="2" cy="1.8" r="1"/><circle cx="8" cy="1.8" r="1"/></g>`,
  'cylinder-shade': `
  <linearGradient id="cylinder-shade" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#ffffff" stop-opacity=".1"/>
    <stop offset=".45" stop-color="#ffffff" stop-opacity="0"/>
    <stop offset="1" stop-color="#000000" stop-opacity=".3"/>
  </linearGradient>`,
  shine: `
  <radialGradient id="shine" cx=".35" cy=".3" r=".75">
    <stop offset="0" stop-color="#ffffff" stop-opacity=".25"/>
    <stop offset=".55" stop-color="#ffffff" stop-opacity="0"/>
    <stop offset="1" stop-color="#000000" stop-opacity=".3"/>
  </radialGradient>`,
};

export const STATUSES = ['ok', 'warn', 'down', 'unknown'];

// Options read like attributes, as text or numbers. An unreadable size takes the model default,
// never below its minimum nor above its maximum; width and depth are whole cells, since details
// repeat cell by cell. A square model keeps its depth equal to its width.
// A boolean option follows HTML: true, or any text even empty, means present.
// Options specific to a component pass through untouched to its drawing.
export function normalize(model, options = {}) {
  const size = name => {
    let v = parseFloat(options[name]);
    if (!Number.isFinite(v)) v = model.defaults[name];
    if (name !== 'height') v = Math.round(v);
    return Math.min(model.maximum?.[name] ?? Infinity, Math.max(model.minimum[name], v));
  };
  const status = String(options.status ?? '').toLowerCase();
  const width = size('width');
  return {
    ...options,
    width, depth: model.square ? width : size('depth'), height: size('height'),
    status: STATUSES.includes(status) ? status : 'ok',
    label: options.label ? String(options.label) : '',
    open: options.open === true || typeof options.open === 'string',
  };
}

// A rectangle with soft edges, without blur (a blur over a large area is among the costliest things to
// paint): a solid core from (x0, y0) to (x1, y1), and around it a ring r wide that fades to nothing. The
// ring is four strips (linear gradient) and four corners (radial gradient): each is a square r wide, set
// in place by a matrix, so that the gradients, defined once in user space, fit any size. The caller turns
// off the smoothing of the pieces (crispEdges): they meet where their colors match, and smoothed edges
// would show seams. A box hides its footprint and what lies behind it: it passes no core and back =
// false, and only the front strips and corners are drawn.
function soft(name, x0, y0, x1, y1, r, core, back = true) {
  const w = x1 - x0, h = y1 - y0;
  const strip = (matrix, length) => `<rect transform="matrix(${matrix})" width="${r}" height="${length}" fill="url(#${name}-edge)"/>`;
  const corner = (sx, sy, x, y) => `<rect transform="matrix(${sx} 0 0 ${sy} ${x} ${y})" width="${r}" height="${r}" fill="url(#${name}-corner)"/>`;
  let pieces = (core ? `<rect ${core} x="${x0}" y="${y0}" width="${w}" height="${h}"/>` : '')
    + strip(`1 0 0 1 ${x1} ${y0}`, h) + strip(`0 1 1 0 ${x0} ${y1}`, w)
    + corner(1, 1, x1, y1) + corner(-1, 1, x0, y1) + corner(1, -1, x1, y0);
  if (back) pieces += strip(`-1 0 0 1 ${x0} ${y0}`, h) + strip(`0 -1 1 0 ${x0} ${y0}`, w) + corner(-1, -1, x0, y0);
  return pieces;
}

// The pieces of a drawing, for the element, which slips the children of a container between the
// back (ground) with its inside, and the front (cover, edges). A model is either a box, which draws
// its three faces flat (top, front, side), or a free shape, which draws everything itself with art().
// A box may add extra(), drawn last, for what sticks out of it (antennas, chips on a board).
// All get W, D, H in units and the normalized options; art() and extra() draw in world view, origin
// at the back corner on the ground, and may use place() and the helpers of parts.js.
export function layers(model, options) {
  const o = normalize(model, options), art = typeof model.art === 'function';
  // Only a container opens: it has something inside to show.
  if (!model.container) o.open = false;
  const W = o.width * CELL, D = o.depth * CELL, H = o.height * CELL;
  // Frame: from the left edge (x = 0, z = D) to the right edge (x = W, z = 0), from the top of the
  // cover to the front corner on the ground. The world origin, the back corner on the ground, is (0, 0).
  const originX = .866 * D + MARGIN, originY = H + MARGIN;
  const wide = .866 * (W + D) + 2 * MARGIN, tall = .5 * (W + D) + H + 2 * MARGIN;
  // Ground, lying flat: the status halo fades out from the footprint (drawn always, shown by the CSS for
  // warn and down); the shadow is the footprint pushed 6 units toward the front and 4 larger, softened
  // 16 units each side of its outline. A box covers the core of both, and the shadow behind it.
  const ground = `
    <g class="ground" shape-rendering="crispEdges" ${place('top', 0, 0, 0)}>
      <g class="halo">${soft('halo', 0, 0, W, D, 52, art ? 'class="halo-core" fill-opacity=".55"' : '')}</g>
      ${soft('shadow', 22, 22, W - 6, D - 6, 32, art ? 'fill="#0b1020" fill-opacity=".2"' : '', art)}
    </g>`;
  let back = ground, inside = '', front = '';
  if (art) back += `
    <g class="art">${model.art(W, D, H, o)}</g>`;
  else {
    // Inside: floor and its grid, back wall, left wall. Only a container has one, painted only while
    // open, when the cover fades out to show it.
    if (model.container) {
      let grid = '';
      for (let u = CELL; u < W; u += CELL) grid += `M${u} 0V${D}`;
      for (let v = CELL; v < D; v += CELL) grid += `M0 ${v}H${W}`;
      inside = `
    <g class="inside">
      <rect ${place('top', 0, 0, 0)} width="${W}" height="${D}" fill="#d3d9e2"/>
      <path class="floor-grid" ${place('top', 0, 0, 0)} d="${grid}"/>
      <rect ${place('front', 0, H, 0)} width="${W}" height="${H}" fill="#b8c0cc"/>
      <rect ${place('side', 0, H, D)} width="${D}" height="${H}" fill="#a3acba"/>
    </g>`;
    }
    front = `
    <g class="cover">
      <g ${place('top', 0, H, 0)}>${model.top(W, D, H, o)}</g>
      <g ${place('front', 0, H, D)}>${model.front(W, D, H, o)}</g>
      <g ${place('side', W, H, D)}>${model.side(W, D, H, o)}</g>
    </g>
    <!-- Visible edges, always drawn. -->
    <rect class="edge" ${place('top', 0, H, 0)} width="${W}" height="${D}"/>
    <rect class="edge" ${place('front', 0, H, D)} width="${W}" height="${H}"/>
    <rect class="edge" ${place('side', W, H, D)} width="${D}" height="${H}"/>${model.extra ? `
    <!-- What sticks out of the box belongs to its cover, and fades with it. -->
    <g class="cover extra">${model.extra(W, D, H, o)}</g>` : ''}`;
  }
  // The shared defs the drawing refers to (as #id), then the model's own.
  const style = CSS + (model.css ?? ''), drawn = style + (model.defs ?? '') + back + inside + front;
  const defs = Object.entries(DEFS).filter(([id]) => drawn.includes(`#${id}`)).map(([, svg]) => svg).join('') + (model.defs ?? '');
  return {
    o, originX, originY, wide, tall,
    data: `data-status="${o.status}"${o.open ? ' data-open=""' : ''}`,
    a11y: `role="img" aria-label="${escapeXml(describe(model, o))}"`,
    style, defs, back, inside, front,
  };
}

// A standalone SVG of a model, CSS included, readable as is in an <img>. A closed container's file
// leaves its inside out: nothing would show it.
export function draw(model, options) {
  const l = layers(model, options);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-l.originX} ${-l.originY} ${l.wide} ${l.tall}" width="${l.wide}" height="${l.tall}" ${l.data} ${l.a11y}>
  <style>${l.style}</style>
  <defs>${l.defs}</defs>
  <g class="drawing">${l.back}${l.o.open ? l.inside : ''}${l.front}</g>
</svg>`;
}
