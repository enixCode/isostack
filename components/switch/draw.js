// Network switch drawing: a thin rack box with lights, a block of ports per cell and SFP uplink cages
// on the front, a small grille per cell on the side, a name plate on the cover.
// Face frames: top (u = width, v = depth), front (u = width, v downward),
// side (u = depth from the front, v downward). Details repeat instead of stretching.
import { CELL } from '../../core/draw.js';
import { grille, lightsRow, panel, plate, ports, rackEars, rhythm } from '../../core/parts.js';

// switch is a reserved word: the model has a local name and is exported as switch below.
const networkSwitch = {
  name: 'switch',
  title: 'Switch',
  // Sizes in cells, default, minimum and maximum. One rack unit: the height stays 1 cell.
  defaults: { width: 8, depth: 4, height: 1 },
  minimum: { width: 4, depth: 3, height: 1 },
  maximum: { width: 16, depth: 8, height: 1 },
  // Classic sizes (width × depth, in cells) written as static files to dist/.
  sizes: [[4, 3], [8, 4], [12, 4]],
  // SFP uplink cage 13 × 8: metal frame, dark opening. Its link light is drawn beside it, for the
  // reason given at ports() in core/parts.js.
  defs: `
    <g id="switch-sfp">
      <rect width="13" height="8" rx=".5" fill="#6b7485" stroke="#8b95a7" stroke-width=".6"/>
      <rect x="1.5" y="1.5" width="10" height="5" fill="#0d1015"/>
      <rect x="3" y="3.5" width="7" height="1.2" fill="#394151"/>
    </g>
  `,

  // Cover: panel seam and the name plate in the front corner.
  top(W, D, H, { label }) {
    return `
      <rect width="${W}" height="${D}" fill="#3b4352"/>
      ${panel(W, D)}
      ${plate(W, D, label)}`;
  },

  // Front: rack ears, lights, one block of 3 × 2 ports per cell, then four SFP uplinks on the right.
  front(W, D, H) {
    const y = H / 2 - 10;
    let jacks = '';
    for (let i = 0; i < (W - 120) / CELL; i++) jacks += ports(66 + CELL * i, y, 3, 12, 6 * i) + ports(66 + CELL * i, y + 12, 3, 12, 6 * i + 3);
    let uplinks = '';
    for (let j = 0; j < 4; j++) {
      const x = W - 54 + 17 * (j % 2), y2 = y + 12 * Math.floor(j / 2);
      uplinks += `<use href="#switch-sfp" x="${x}" y="${y2}"/><circle cx="${x + 11}" cy="${y2 + 2.6}" r="1" class="led activity" style="${rhythm(50 + j)}"/>`;
    }
    return `
      <rect width="${W}" height="${H}" fill="#252b36"/>
      ${rackEars(W, H)}
      ${lightsRow(20, H / 2)}
      ${jacks}
      ${uplinks}`;
  },

  // Side: one small vent grille per cell.
  side(W, D, H) {
    let grilles = '';
    for (let k = 0; k < D / CELL; k++) grilles += grille(CELL * k + 8, 10, 20, H - 20);
    return `
      <rect width="${D}" height="${H}" fill="#1d222b"/>
      ${grilles}`;
  },
};

export { networkSwitch as switch };
