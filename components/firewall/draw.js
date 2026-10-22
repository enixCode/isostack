// Firewall drawing: a rack appliance whose front is a brick wall, one column of bricks per cell,
// above a row of lights and ports; vent grilles on the side, a name plate on the cover.
// Face frames: top (u = width, v = depth), front (u = width, v downward),
// side (u = depth from the front, v downward). Details repeat instead of stretching.
import { CELL } from '../../core/draw.js';
import { grille, lightsRow, panel, plate, ports, rackEars, screw } from '../../core/parts.js';

export const firewall = {
  name: 'firewall',
  title: 'Firewall',
  // Sizes in cells, default and minimum.
  defaults: { width: 7, depth: 4, height: 2 },
  minimum: { width: 4, depth: 3, height: 2 },
  // Classic sizes (width × depth, in cells) written as static files to dist/.
  sizes: [[4, 3], [7, 4], [10, 5]],
  // One cell of brick wall, 40 × 10, drawn over a brick-colored panel: a darker brick, then the
  // joints, at 0 and 20 for a full course, at 10 and 30 for a course offset by half a brick. Bricks
  // are never separate shapes side by side, so no seam shows where they cross a cell edge.
  defs: `
    <g id="firewall-course">
      <rect x="21" y="1" width="18" height="8" fill="#85412f"/>
      <path d="M0 0V10M20 0V10" stroke="#191d25" stroke-width="2"/>
    </g>
    <g id="firewall-course-offset">
      <rect x="11" y="1" width="18" height="8" fill="#85412f"/>
      <path d="M10 0V10M30 0V10" stroke="#191d25" stroke-width="2"/>
    </g>
  `,

  // Cover: panel seam and the name plate in the front corner.
  top(W, D, H, { label }) {
    return `
      <rect width="${W}" height="${D}" fill="#3b4352"/>
      ${panel(W, D)}
      ${plate(W, D, label)}`;
  },

  // Front: rack ears, a brick wall (one column per cell, courses as the height allows), then lights
  // and a block of three ports per cell along the bottom.
  front(W, D, H) {
    const courses = Math.floor((H - 36) / 10);
    let wall = '', beds = '';
    for (let j = 0; j < courses; j++) {
      for (let i = 0; i < W / CELL - 1; i++) wall += `<use href="#firewall-course${j % 2 ? '-offset' : ''}" x="${20 + CELL * i}" y="${8 + 10 * j}"/>`;
      if (j) beds += `M20 ${8 + 10 * j}H${W - 20}`;
    }
    let jacks = '';
    for (let i = 0; i < (W - 120) / CELL; i++) jacks += ports(70 + CELL * i, H - 24, 3, 13, 3 * i);
    return `
      <rect width="${W}" height="${H}" fill="#252b36"/>
      ${rackEars(W, H)}
      <rect x="20" y="8" width="${W - 40}" height="${10 * courses}" fill="#93483a" stroke="#191d25" stroke-width="2"/>
      ${wall}
      <path d="${beds}" stroke="#191d25" stroke-width="2"/>
      ${lightsRow(22, H - 20)}
      ${jacks}`;
  },

  // Side: cover seam, one vent grille and one screw per cell.
  side(W, D, H) {
    let grilles = '';
    for (let k = 0; k < D / CELL; k++) grilles += grille(CELL * k + 8, 18, 20, H - 40) + screw(CELL * k + 20, H - 12, 2);
    return `
      <rect width="${D}" height="${H}" fill="#1d222b"/>
      <path d="M0 10H${D}" stroke="#2b313c" stroke-width="1.5"/>
      ${grilles}`;
  },
};
