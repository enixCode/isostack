// Storage drawing (NAS, disk array): standing drive trays on the front, grilles on the side, name
// plate on the cover. Face frames: top (u = width, v = depth), front (u = width, v downward),
// side (u = depth from the front, v downward). Details repeat instead of stretching.
import { CELL } from '../../core/draw.js';
import { grille, lights, panel, plate, rhythm, vent } from '../../core/parts.js';

export const storage = {
  name: 'storage',
  title: 'Storage',
  // Sizes in cells: a box taller than the server, one drive tray per width cell.
  defaults: { width: 6, depth: 5, height: 3 },
  minimum: { width: 4, depth: 4, height: 3 },
  // Classic sizes (width × depth, in cells) written as static files to dist/.
  sizes: [[4, 4], [6, 5], [9, 5]],
  // Standing drive tray 30 × 88: perforated face, latch in the accent color. Its activity and fault
  // lights are drawn beside it, for the reason given at ports() in core/parts.js.
  defs: `
    <g id="storage-bay">
      <rect width="30" height="88" rx="2" fill="#2a303c" stroke="#394151"/>
      <rect x="5" y="15" width="20" height="54" fill="url(#perforation)"/>
      <rect x="4" y="74" width="22" height="9" rx="2" fill="#3e6d73"/>
      <rect x="10" y="77" width="10" height="3" rx="1" fill="#0d1015"/>
    </g>
  `,

  // Cover: a perforated strip along the back, name plate in the front corner.
  top(W, D, H, { label }) {
    return `
      <rect width="${W}" height="${D}" fill="#3b4352"/>
      ${panel(W, D)}
      ${vent(24, 22, W - 48, 16)}
      ${plate(W, D, label)}`;
  },

  // Front: one tray per cell (one more row per 96 units of height), status lights and a USB port in the last cell.
  front(W, D, H) {
    const rows = Math.max(1, Math.floor((H - 24) / 96)), top = (H - 96 * rows + 8) / 2;
    let bays = '';
    for (let i = 0; i < W / CELL - 1; i++) {
      for (let j = 0; j < rows; j++) {
        const x = CELL * i + 6, y = top + 96 * j;
        bays += `<use href="#storage-bay" x="${x}" y="${y}"/>
        <circle cx="${x + 9}" cy="${y + 8}" r="2" class="led activity" style="${rhythm(i * rows + j, 3)}"/><circle cx="${x + 21}" cy="${y + 8}" r="2" class="fault"/>`;
      }
    }
    return `
      <rect width="${W}" height="${H}" fill="#252b36"/>
      <rect x="2" y="${top - 5}" width="${W - 42}" height="${96 * rows + 2}" rx="3" fill="#13161c"/>
      ${bays}
      ${lights(W - 20, top)}
      <rect x="${W - 27}" y="${top + 72}" width="14" height="6" rx="1" fill="#0d1015" stroke="#4b5467"/>
      <rect y="${H - 6}" width="${W}" height="6" fill="#1b2029"/>`;
  },

  // Side: one grille per cell, above a plinth.
  side(W, D, H) {
    let grilles = '';
    for (let k = 0; k < D / CELL; k++) grilles += grille(CELL * k + 10, 16, 20, H - 40);
    return `
      <rect width="${D}" height="${H}" fill="#1d222b"/>
      ${grilles}
      <rect y="${H - 6}" width="${D}" height="6" fill="#171b22"/>`;
  },
};
