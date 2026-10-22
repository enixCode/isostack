// Parts shared by several components, so that the whole family looks alike: screws, rack ears,
// label fitting and name plates, status lights, vents, ports, and two volumes for free shapes
// (block, cylinder). Pure functions returning SVG text, like draw.js. Face parts use the flat frame
// of a face (x to the right, y downward); groundPlate(), block() and cylinder() draw in world view.
import { escapeXml, place } from './draw.js';

export const screw = (x, y, r = 3) => `<circle cx="${x}" cy="${y}" r="${r}" class="screw"/>`;

// Rack ears on a front face: a strip on each side with two screws.
export const rackEars = (W, H) => `
  <rect width="16" height="${H}" fill="#2f3644"/>
  <rect x="${W - 16}" width="16" height="${H}" fill="#2f3644"/>
  ${screw(8, 14)}${screw(8, H - 14)}${screw(W - 8, 14)}${screw(W - 8, H - 14)}`;

// Text in the shared label style, escaped.
export const label = (x, y, text) => `<text x="${x}" y="${y}" class="label">${escapeXml(text)}</text>`;

// The one fitting rule for label text in room units: the 14 px font (about 8.5 units a character)
// shrinks down to half size, then the text is cut with an ellipsis. max caps the scale. Returns the
// text to write and its scale.
export function fitText(room, text, max = 1) {
  let scale = Math.min(max, room / (8.5 * text.length));
  if (scale < .5) {
    text = text.slice(0, Math.max(1, Math.floor(room / 4.25) - 1)) + '…';
    scale = .5;
  }
  return { text, scale };
}

// Label text that fits in room units, by the rule of fitText().
export function fitLabel(x, y, room, text) {
  const fit = fitText(room, text);
  return `<text x="${x}" y="${y}" class="label"${fit.scale < 1 ? ` style="font-size: ${(14 * fit.scale).toFixed(1)}px"` : ''}>${escapeXml(fit.text)}</text>`;
}

// Name plate in the front corner of a top face, kept inside the face; nothing without a label.
export function plate(W, D, text) {
  if (!text) return '';
  const l = Math.min(W - 16, Math.max(88, 24 + 8.5 * text.length)), y = Math.max(6, D - 48);
  const x = l <= W - 48 ? W - 24 - l : (W - l) / 2;
  return `<rect x="${x}" y="${y}" width="${l}" height="28" rx="3" fill="#e2e8f0"/>
  ${fitLabel(x + 12, y + 19, l - 24, text)}`;
}

// Name plate centered at (cx, cy) in a top frame, shrunk as a whole to fit a round lid of radius r.
export function lidPlate(cx, cy, r, text) {
  if (!text) return '';
  const l = Math.max(56, 24 + 8.5 * text.length), k = Math.min(1, (r - 4) / Math.hypot(l / 2, 14));
  return `<g transform="translate(${cx} ${cy}) scale(${k})" text-anchor="middle">
    <rect x="${-l / 2}" y="-14" width="${l}" height="28" rx="3" fill="#e2e8f0"/>${label(0, 5, text)}</g>`;
}

// Name plate lying on the ground in world view, centered on x, from z, 22 deep and at most max long.
export function groundPlate(x, z, max, text) {
  if (!text) return '';
  const l = Math.min(max, Math.max(48, 16 + 8.5 * text.length));
  return `
  <g ${place('top', x - l / 2, 0, z)}>
    <rect width="${l}" height="22" rx="3" fill="#e2e8f0"/>
    <g text-anchor="middle">${fitLabel(l / 2, 15.5, l - 12, text)}</g>
  </g>`;
}

// Seam of the cover panel on a top face, inset 10 units.
export const panel = (W, D, stroke = '#4b5467') => `<rect x="10" y="10" width="${W - 20}" height="${D - 20}" rx="3" fill="none" stroke="${stroke}" stroke-width="1.5"/>`;

// Status column of a rack device, cx its center line, from top down: power ring and its blue light,
// then the status, activity and fault lights, then a small button. About 62 units tall.
export const lights = (cx, top) => `
  <circle cx="${cx}" cy="${top + 9}" r="6" fill="#191d25" stroke="#4b5467"/>
  <circle cx="${cx}" cy="${top + 9}" r="2.5" class="led blue"/>
  <circle cx="${cx}" cy="${top + 27}" r="2.2" class="led status pulse"/>
  <circle cx="${cx}" cy="${top + 37}" r="2.2" class="led activity" style="${rhythm(Math.round(cx + top))}"/>
  <circle cx="${cx}" cy="${top + 47}" r="2.2" class="fault"/>
  <rect x="${cx - 5}" y="${top + 56}" width="10" height="5" rx="1" fill="#0d1015" stroke="#4b5467"/>`;

// The same lights in a row, for thin devices: x is the left end, cy the center line. About 41 units wide.
export const lightsRow = (x, cy) => `
  <circle cx="${x + 3}" cy="${cy}" r="2.5" class="led blue"/>
  <circle cx="${x + 16}" cy="${cy}" r="2.2" class="led status pulse"/>
  <circle cx="${x + 27}" cy="${cy}" r="2.2" class="led activity" style="${rhythm(Math.round(x + cy))}"/>
  <circle cx="${x + 38}" cy="${cy}" r="2.2" class="fault"/>`;

// Perforated vent; frame adds a thin border.
export const vent = (x, y, w, h, frame = false) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#perforation)"${frame ? ' stroke="#394151"' : ''}/>`;

// Grille of vertical slots.
export const grille = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#slots)"/>`;

// Varied but fixed blink rhythm for the n-th light, so that lights do not blink together.
// Goes in a style attribute: style="${rhythm(n)}". Every change falls on the shared beat of the CSS in
// draw.js: the period is 1, 2 or 3 turns of 2.4 s, the delay a whole number of .2 s beats.
// In a bank of many lights, one light in `share` blinks and the others stay lit, since each
// blinking light costs the browser a restyle at every frame.
export function rhythm(n, share = 1) {
  if (n * 7 % 11 % share >= 1) return '--period: 0s';
  return `--period: ${(2.4 * (1 + n * 5 % 3)).toFixed(1)}s; --delay: -${(n * 7 % 12 * .2).toFixed(1)}s`;
}

// A row of network ports (10 x 8 each) from (x, y), every step units; some of their link lights blink.
// The lights are a copy of their own, which carries the animation: an animated element inside a copy
// made by use makes the browser restyle the whole copy at every frame.
export function ports(x, y, count, step = 14, seed = 0) {
  let s = '';
  for (let i = 0; i < count; i++) {
    const at = `x="${x + step * i}" y="${y}"`;
    s += `<use href="#port" ${at}/><use href="#port-leds" ${at} class="led activity" style="${rhythm(seed + i, 3)}"/>`;
  }
  return s;
}

// Activity and fault lights of a drive bay of the server family, at its position (x, y). Drawn beside
// the bay and not inside it, for the reason given at ports().
export const bayLights = (x, y, n) => `<circle cx="${x + 32}" cy="${y + 8}" r="2" class="led activity" style="${rhythm(n, 3)}"/><circle cx="${x + 32}" cy="${y + 15}" r="2" class="fault"/>`;

// A solid box in world view, for free shapes: its back bottom corner at (x, y, z), w wide, d deep,
// h tall, in units. Each face takes a fill color and optional content drawn flat in its frame.
export function block(x, y, z, w, d, h, { top = '#3b4352', front = '#252b36', side = '#1d222b', topArt = '', frontArt = '', sideArt = '' } = {}) {
  return `
  <g ${place('top', x, y + h, z)}><rect width="${w}" height="${d}" fill="${top}"/>${topArt}</g>
  <g ${place('front', x, y + h, z + d)}><rect width="${w}" height="${h}" fill="${front}"/>${frontArt}</g>
  <g ${place('side', x + w, y + h, z + d)}><rect width="${d}" height="${h}" fill="${side}"/>${sideArt}</g>
  <rect class="edge" ${place('top', x, y + h, z)} width="${w}" height="${d}"/>
  <rect class="edge" ${place('front', x, y + h, z + d)} width="${w}" height="${h}"/>
  <rect class="edge" ${place('side', x + w, y + h, z + d)} width="${d}" height="${h}"/>`;
}

// A cylinder standing on the ground, centered in its W x W footprint, H tall (units). The back corner
// of the footprint is at the origin, so its axis falls on screen x = 0; move() sets it elsewhere.
// Returns its SVG (body, shading, lid, outline) and helpers to place details:
// y(h) is the screen y of the axis at height h, ring(h) the path of the front half circle at that
// height, at(h, a) the screen point on the surface at height h and angle a (radians, 0 = facing the
// viewer, negative to the left).
export function cylinder(W, H, { side = '#252b36', top = '#3b4352' } = {}) {
  const rx = .6124 * W, ry = .3536 * W, y = h => .5 * W - h;
  const outline = `M${-rx} ${y(H)}V${y(0)}A${rx} ${ry} 0 0 0 ${rx} ${y(0)}V${y(H)}`;
  return {
    rx, ry, y,
    ring: h => `M${-rx} ${y(h)}A${rx} ${ry} 0 0 0 ${rx} ${y(h)}`,
    at: (h, a = 0) => [rx * Math.sin(a), y(h) + ry * Math.cos(a)],
    svg: `
  <path d="${outline}Z" fill="${side}"/>
  <path d="${outline}Z" fill="url(#cylinder-shade)"/>
  <ellipse cx="0" cy="${y(H)}" rx="${rx}" ry="${ry}" fill="${top}"/>
  <path class="edge" d="${outline}"/>
  <ellipse class="edge" cx="0" cy="${y(H)}" rx="${rx}" ry="${ry}"/>`,
  };
}
