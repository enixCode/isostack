// Router drawing: a desktop box with lights, an accent WAN port and LAN ports per cell on the front,
// vent grilles on the side, a name plate on the cover and three antennas standing on top.
// Face frames: top (u = width, v = depth), front (u = width, v downward),
// side (u = depth from the front, v downward). Details repeat instead of stretching.
import { CELL, move } from '../../core/draw.js';
import { block, cylinder, grille, lightsRow, panel, plate, ports, vent } from '../../core/parts.js';

// Muted accent: the WAN port frame and the antenna tips.
const ACCENT = '#7c6fb8';

// Antenna in world view, its hinge's back bottom corner at (x, y, z): a small hinge block, then a
// thin mast centered on it.
function antenna(x, y, z) {
  const mast = cylinder(5, 46, { side: '#1d222b', top: ACCENT });
  return block(x, y, z, 9, 9, 7, { top: '#2f3644' })
    + `<g ${move(x + 2, y + 7, z + 2)}>${mast.svg}</g>`;
}

export const router = {
  name: 'router',
  title: 'Router',
  // Sizes in cells, default and minimum.
  defaults: { width: 6, depth: 4, height: 1.5 },
  minimum: { width: 4, depth: 3, height: 1.5 },
  // Classic sizes (width × depth, in cells) written as static files to dist/.
  sizes: [[4, 3], [6, 4], [8, 5]],

  // Cover: panel seam, vent, name plate in the front corner.
  top(W, D, H, { label }) {
    return `
      <rect width="${W}" height="${D}" fill="#3b4352"/>
      ${panel(W, D)}
      ${vent(26, 30, 72, 30)}
      ${plate(W, D, label)}`;
  },

  // Front: lights, the WAN port in its accent frame, a framed pair of LAN ports per cell, the power jack.
  front(W, D, H) {
    const y = H / 2 - 4;
    let lan = '';
    for (let i = 0; i < (W - 120) / CELL; i++) {
      lan += `<rect x="${92 + CELL * i}" y="${y - 4}" width="32" height="16" rx="2" fill="#191d25" stroke="#394151"/>${ports(96 + CELL * i, y, 2, 14, 2 * i + 1)}`;
    }
    return `
      <rect width="${W}" height="${H}" fill="#252b36"/>
      ${lightsRow(16, H / 2)}
      <rect x="66" y="${y - 4}" width="18" height="16" rx="2" fill="${ACCENT}"/>
      ${ports(70, y, 1, 14, 0)}
      ${lan}
      <circle cx="${W - 22}" cy="${H / 2}" r="5" fill="#0d1015" stroke="#394151"/>
      <circle cx="${W - 22}" cy="${H / 2}" r="1.6" fill="#4b5467"/>`;
  },

  // Side: one vent grille per cell.
  side(W, D, H) {
    let grilles = '';
    for (let k = 0; k < D / CELL; k++) grilles += grille(CELL * k + 8, 14, 20, H - 28);
    return `
      <rect width="${D}" height="${H}" fill="#1d222b"/>
      ${grilles}`;
  },

  // Antennas: three along the back of the cover, at both ends and in the middle.
  extra(W, D, H) {
    return [16, W / 2 - 4.5, W - 25].map(x => antenna(x, H, 14)).join('');
  },
};
