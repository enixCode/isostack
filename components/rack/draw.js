// Rack cabinet drawing: a tall slate cabinet. Front: perforated door between two rails whose unit
// marks repeat cell by cell, a handle, a plinth; cover: one fan per cell; side: a plain panel.
// Open, servers stack inside as children, one above the other with y.
// Face frames: top (u = width, v = depth), front (u = width, v downward),
// side (u = depth from the front, v downward). Details repeat instead of stretching.
import { CELL } from '../../core/draw.js';
import { grille, lightsRow, plate, screw, vent } from '../../core/parts.js';

// Rail from (x, y), h tall: a unit mark and three square holes per cell.
function rail(x, y, h) {
  let holes = '';
  for (let k = 0; k * CELL + 30 <= h; k++) {
    const t = y + k * CELL;
    holes += `<rect x="${x}" y="${t + 1}" width="10" height="2" fill="#a3acba"/>`;
    for (const d of [9, 19, 29]) holes += `<rect x="${x + 3.5}" y="${t + d}" width="3" height="3" fill="#0d1015"/>`;
  }
  return `<rect x="${x}" y="${y}" width="10" height="${h}" fill="#4b5467"/>${holes}`;
}

export const rack = {
  name: 'rack',
  title: 'Rack',
  // Open, it shows its floor: servers stand inside, stacked with y.
  container: true,
  // Sizes in cells, default and minimum: at least a server wide and deep.
  defaults: { width: 4, depth: 4, height: 7 },
  minimum: { width: 4, depth: 4, height: 3 },
  // Classic sizes (width × depth, in cells) written as static files to dist/.
  sizes: [[4, 4], [5, 4], [8, 4]],
  // Fan 24 across, centered: guard rings and hub.
  defs: `
    <g id="rack-fan">
      <circle r="12" fill="#191d25" stroke="#4b5467"/>
      <circle r="8" fill="none" stroke="#2f3644" stroke-width="1.5"/>
      <circle r="3.5" fill="#2f3644"/>
    </g>
  `,

  // Cover: one fan per cell along the back, name plate in the front corner.
  top(W, D, H, { label }) {
    let fans = '';
    for (let u = CELL / 2; u < W; u += CELL) fans += `<use href="#rack-fan" x="${u}" y="30"/>`;
    return `
      <rect width="${W}" height="${D}" fill="#3b4352"/>
      <rect x="4" y="4" width="${W - 8}" height="${D - 8}" rx="3" fill="none" stroke="#4b5467" stroke-width="1.5"/>
      ${fans}
      ${plate(W, D, label)}`;
  },

  // Front: status lights on the header, perforated door with its rails and handle, plinth.
  front(W, D, H) {
    let feet = '';
    for (let u = CELL / 2; u < W; u += CELL) feet += `<rect x="${u - 8}" y="${H - 10}" width="16" height="4" rx="1" fill="#0d1015"/>`;
    return `
      <rect width="${W}" height="${H}" fill="#252b36"/>
      ${lightsRow(W - 54, 10)}
      <rect x="8" y="20" width="${W - 16}" height="${H - 40}" rx="3" fill="#1b2029" stroke="#394151"/>
      ${rail(14, 26, H - 52)}
      ${rail(W - 24, 26, H - 52)}
      ${vent(28, 26, W - 56, H - 52)}
      <rect x="${W - 38}" y="${H / 2 - 22}" width="7" height="44" rx="3" fill="#3b4352" stroke="#4b5467"/>
      <circle cx="${W - 34.5}" cy="${H / 2 - 13}" r="2" fill="#0d1015"/>
      <rect y="${H - 16}" width="${W}" height="16" fill="#191d25"/>
      ${feet}`;
  },

  // Side: a panel between header and plinth, one vent and one plinth screw per cell.
  side(W, D, H) {
    let vents = '';
    for (let k = 0; k < D / CELL; k++) vents += grille(CELL * k + 10, 28, 20, 26) + screw(CELL * k + 20, H - 8, 2);
    return `
      <rect width="${D}" height="${H}" fill="#1d222b"/>
      <rect x="6" y="20" width="${D - 12}" height="${H - 40}" rx="3" fill="none" stroke="#2b313c" stroke-width="1.5"/>
      <rect y="${H - 16}" width="${D}" height="16" fill="#151920"/>
      ${vents}`;
  },
};
