// Raspberry Pi drawing: an abstract B board (B+ to Pi 5), each part where all of these boards have
// it. Seen from above, the GPIO header runs along the back edge, the USB stacks and the Ethernet
// jack stand on the right short end, power, video and audio sit low along the front edge, and the
// SoC and its RAM lie in the middle; chips and connectors are drawn by extra(). A taller box stacks
// boards on spacers, one board per half cell. Face frames: top (u = width, v = depth), front
// (u = width, v downward), side (u = depth from the front, v downward).
import { CELL, place } from '../../core/draw.js';
import { block, fitText, label, ports, rhythm } from '../../core/parts.js';

// Muted green board, grey metal for shields and spacers, black plastic.
const PCB = { top: '#3a5f4b', front: '#2c4a3b', side: '#233c30' };
const METAL = { top: '#8a93a2', front: '#697181', side: '#565d6b' };
const PLASTIC = { top: '#232831', front: '#161a21', side: '#11151b' };
// Board thickness in a stack, in units.
const BOARD = 5;

// Boards in the box: one per half cell, at least one; each level takes an equal share of the height.
function levels(H) {
  const n = Math.max(1, Math.floor(H / (CELL / 2)));
  return { n, L: H / n };
}

// Mounting holes, 3.5 mm from the edges and 58 x 49 mm apart: the right pair stops before the ports.
const HOLES = [[5, 5], [87, 5], [5, 75], [87, 75]];

// Port block on the right short end, overhanging it by 3, from the back: two USB stacks, then the
// Ethernet jack in the front corner. z is the back end, w the width along the edge, d the depth.
const USB = [{ z: 4, w: 18.5, d: 25, h: 22 }, { z: 29, w: 18.5, d: 25, h: 22 }];
const JACK = { z: 54, w: 22, d: 30, h: 19 };

// Port faces, flat, w × h. The jack reuses the shared network port, scaled up.
function jackFace(w, h, seed) {
  const s = Math.min(1.8, (h - 2) / 8);
  return `<g transform="translate(${(w - 10 * s) / 2} ${(h - 8 * s) / 2}) scale(${s})">${ports(0, 0, 1, 14, seed)}</g>`;
}
function usbFace(w, h) {
  const slot = y => `<rect x="2.5" y="${y}" width="${w - 5}" height="6.5" rx="1" fill="#0d1015"/><rect x="5" y="${y + 2.2}" width="${w - 10}" height="2" fill="#c3cad5"/>`;
  return slot(h / 2 - 7.25) + slot(h / 2 + .75);
}

// Low connectors on the front edge, overhanging it by 1.5, from the left: the power socket, two video
// ports (a tapered slot) and the round audio jack. x is the left end; each has its color and face art.
const video = (w, h) => `<path d="M2 ${h / 2 - 1.3}h${w - 4}l-1 2.6h${6 - w}z" fill="#0d1015"/>`;
const LOW = [
  { x: 10, w: 12, d: 10, h: 4.5, color: METAL, art: (w, h) => `<rect x="2" y="${h / 2 - 1.2}" width="${w - 4}" height="2.4" rx="1.2" fill="#0d1015"/>` },
  { x: 32, w: 10, d: 8, h: 4.5, color: METAL, art: video },
  { x: 51, w: 10, d: 8, h: 4.5, color: METAL, art: video },
  { x: 71, w: 10, d: 14, h: 8.5, color: PLASTIC, art: (w, h) => `<circle cx="${w / 2}" cy="${h / 2}" r="3.4" fill="#2f3644"/><circle cx="${w / 2}" cy="${h / 2}" r="1.6" fill="#0d1015"/>` },
];

// A flat connector face in a stack gap: x its left end, w × h standing on the board at bottom.
const face = (x, w, h, bottom, fill, art) => `<g transform="translate(${x} ${bottom - h})"><rect width="${w}" height="${h}" fill="${fill}"/>${art(w, h)}</g>`;

// Power (status) and activity lights of the n-th board from the top, at the left end, cy their center
// line. Its jack blinks with seed 2n, its activity light with 2n + 1, so that no two lights blink together.
const leds = (cy, n) => `<circle cx="8" cy="${cy}" r="2.2" class="led status pulse"/>
  <circle cx="14" cy="${cy}" r="2.2" class="led activity" style="${rhythm(2 * n + 1)}"/>`;

// Light silkscreen tag between the GPIO header and the SoC, from the left; its room stops before the
// port block, and the text follows the shared fitting rule. Nothing without a label.
function tag(text) {
  if (!text) return '';
  const l = Math.min(79, 12 + 8.5 * text.length), fit = fitText(l - 12, text);
  return `<rect x="6" y="11" width="${l}" height="22" rx="2" fill="#e2e8f0"/>
    <g transform="translate(12 ${+(22 + 5 * fit.scale).toFixed(2)}) scale(${+fit.scale.toFixed(3)})">${label(0, 0, fit.text)}</g>`;
}

// A face of the stack, len units long, in the given tone: each level is a board edge over a dark gap,
// with a spacer under each mounting hole (posts, centers along the face); gap(i, top, bottom) adds
// what stands in the gap above the board below. One board is solid.
function layered(len, H, tone, posts, gap) {
  const { n, L } = levels(H);
  if (n === 1) return `<rect width="${len}" height="${H}" fill="${PCB[tone]}"/>`;
  let s = `<rect width="${len}" height="${H}" fill="#0d1015"/>`;
  for (let i = 0; i < n; i++) {
    const top = i * L + BOARD, bottom = (i + 1) * L;
    s += posts.map(p => `<rect x="${p - 1.5}" y="${top}" width="3" height="${bottom - top}" fill="${METAL[tone]}"/>`).join('')
      + (i < n - 1 ? gap(i, top, bottom) : '')
      + `<rect y="${i * L}" width="${len}" height="${BOARD}" fill="${PCB[tone]}"/>`;
  }
  return s;
}

export const raspberryPi = {
  name: 'raspberry-pi',
  title: 'Raspberry Pi',
  // Sizes in cells: a fixed footprint; a taller box stacks more boards, up to four.
  defaults: { width: 3, depth: 2, height: 0.4 },
  minimum: { width: 3, depth: 2, height: 0.4 },
  maximum: { width: 3, depth: 2, height: 2 },
  // Classic sizes (width × depth, in cells) written as static files to dist/.
  sizes: [[3, 2]],

  // Top board: traces from the SoC to the RAM, the ports and the video, mounting holes, label tag,
  // then the power and activity lights at the left end.
  top(W, D, H, { label: text }) {
    const hole = ([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="#a7b0be"/><circle cx="${x}" cy="${y}" r="1.7" fill="#0d1015"/>`;
    return `
      <rect width="${W}" height="${D}" fill="${PCB.top}"/>
      <path d="M51 39H56M51 44H56M51 49H56M70 40H80L86 34H96M70 45H82L88 39H96M66 53V58L72 64H94M70 50L74 54V60H94M36 55V72M40 55V72M46 55V62L55 70V72" fill="none" stroke="#467259" stroke-width="1.2"/>
      ${HOLES.map(hole).join('')}
      ${tag(text)}
      ${leds(62, 0)}`;
  },

  // Front: the board edge; in a stack, the low connectors and the lights of the lower boards show in
  // the gaps, the lights a little higher since they stand back from the edge.
  front(W, D, H) {
    return layered(W, H, 'front', [5, 87], (i, top, bottom) =>
      LOW.map(c => face(c.x, c.w, Math.min(c.h, bottom - top), bottom, c.color.front, c.art)).join('') + leds(bottom - 8, i + 1));
  },

  // Side: the board edge; in a stack, the USB and Ethernet faces of the lower boards show in the gaps.
  side(W, D, H) {
    return layered(D, H, 'side', [5, D - 5], (i, top, bottom) => {
      const at = (c, art) => face(D - c.z - c.w, c.w, Math.min(c.h, bottom - top), bottom, METAL.side, art);
      return USB.map(c => at(c, usbFace)).join('') + at(JACK, (w, h) => jackFace(w, h, 2 * (i + 1)));
    });
  },

  // On the top board, back to front: GPIO header along the back edge, SoC and RAM in the middle, the
  // low connectors on the front edge, then the port block on the right end.
  extra(W, D, H) {
    let pins = '';
    for (const z of [3.2, 6.8]) {
      let d = '';
      for (let i = 0; i < 20; i++) d += `M${(1.15 + 3.6 * i).toFixed(2)} 0h1.3v8h-1.3z`;
      pins += `<path ${place('front', 10, H + 11, z)} d="${d}" fill="#b4bcc9"/>`;
    }
    const low = LOW.map(c => block(c.x, H, D + 1.5 - c.d, c.w, c.d, c.h, { ...c.color, frontArt: c.art(c.w, c.h) })).join('');
    const port = (c, art) => block(W + 3 - c.d, H, c.z, c.d, c.w, c.h, { ...METAL, sideArt: art(c.w, c.h) });
    return `
      ${block(10, H, 1.4, 72, 7.2, 3.5, PLASTIC)}${pins}
      ${block(30, H, 34, 21, 21, 2.5, { top: '#7c8595', front: '#5b6372', side: '#4a515e', topArt: '<rect x="3.5" y="3.5" width="14" height="14" rx="1" fill="none" stroke="#9aa3b2"/>' })}
      ${block(56, H, 37, 14, 15, 2, { ...PLASTIC, topArt: '<circle cx="3" cy="3" r="1" fill="#4b5467"/>' })}
      ${low}
      ${USB.map(c => port(c, usbFace)).join('')}${port(JACK, (w, h) => jackFace(w, h, 0))}`;
  },
};
