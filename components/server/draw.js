// Rack server drawing: disk bays on the front, vents on the side, name plate on the cover.
// Face frames: top (u = width, v = depth), front (u = width, v downward),
// side (u = depth from the front, v downward). Details repeat instead of stretching.
import { CELL } from '../../core/draw.js';
import { bayLights, grille, lights, panel, plate, rackEars, screw, vent } from '../../core/parts.js';

export const server = {
  name: 'server',
  title: 'Server',
  // Open, it shows its floor: child elements (VMs, containers, apps) can stand inside.
  container: true,
  // Sizes in cells, default and minimum.
  defaults: { width: 7, depth: 6, height: 2.5 },
  minimum: { width: 4, depth: 4, height: 2.5 },
  // Classic sizes (width × depth, in cells) written as static files to dist/.
  sizes: [[4, 4], [7, 6], [10, 6]],
  // Disk bay 38 × 30: slots, handle. Its activity and fault lights are drawn beside it, by bayLights().
  defs: `
    <g id="server-bay">
      <rect width="38" height="30" rx="2" fill="#191d25" stroke="#394151"/>
      <path d="M5 7h20M5 11h20M5 15h20" stroke="#2b313d" stroke-width="1.6"/>
      <rect x="5" y="21" width="20" height="5" rx="1" fill="#343c4a"/>
    </g>
  `,

  // Cover: vent at the back, name plate in the front corner.
  top(W, D, H, { label }) {
    return `
      <rect width="${W}" height="${D}" fill="#3b4352"/>
      ${panel(W, D)}
      ${vent(26, 26, 96, 54)}
      ${plate(W, D, label)}`;
  },

  // Front: rack ears, one column of bays per cell, then vent and status lights on the right.
  front(W, D, H) {
    const rows = Math.floor((H - 32) / 34);
    let bays = '';
    for (let i = 0; i < (W - 120) / CELL; i++) {
      for (let j = 0; j < rows; j++) {
        const x = 20 + CELL * i, y = 18 + 34 * j;
        bays += `<use href="#server-bay" x="${x}" y="${y}"/>${bayLights(x, y, i * rows + j)}`;
      }
    }
    return `
      <rect width="${W}" height="${H}" fill="#252b36"/>
      ${rackEars(W, H)}
      ${bays}
      ${vent(W - 92, 18, 40, H - 36, true)}
      ${lights(W - 34, 18)}`;
  },

  // Side: cover seam, rack rail, one vent grille and one screw per cell.
  side(W, D, H) {
    let grilles = '';
    for (let k = 0; k < D / CELL; k++) grilles += grille(CELL * k + 8, 22, 20, H - 52) + screw(CELL * k + 20, H - 15, 2);
    return `
      <rect width="${D}" height="${H}" fill="#1d222b"/>
      <path d="M0 10H${D}" stroke="#2b313c" stroke-width="1.5"/>
      <rect y="${H - 20}" width="${D}" height="10" fill="#282e39"/>
      ${grilles}`;
  },
};
