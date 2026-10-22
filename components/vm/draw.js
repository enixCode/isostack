// Virtual machine drawing: a slate box whose faces carry a dashed violet frame, the mark of
// something virtual, with a console window on the cover and virtual disks on the front.
// Face frames: top (u = width, v = depth), front (u = width, v downward),
// side (u = depth from the front, v downward). Details repeat instead of stretching.
import { CELL } from '../../core/draw.js';
import { grille, lightsRow, plate, rhythm } from '../../core/parts.js';

// Dashed frame inset by m on a w × h face.
const frame = (w, h, m) => `<rect x="${m}" y="${m}" width="${w - 2 * m}" height="${h - 2 * m}" rx="3" class="vm-frame"/>`;

export const vm = {
  name: 'vm',
  title: 'Virtual machine',
  // Open, it shows its floor: containers and apps can stand inside.
  container: true,
  // Sizes in cells, default and minimum.
  defaults: { width: 6, depth: 5, height: 2.5 },
  minimum: { width: 3, depth: 3, height: 1.5 },
  // Classic sizes (width × depth, in cells) written as static files to dist/.
  sizes: [[3, 3], [6, 5], [8, 6]],
  css: `
    .vm-frame { fill: none; stroke: #9a8cdb; stroke-width: 1.5; stroke-dasharray: 7 4; }
    .vm-ink { fill: none; stroke: #9a8cdb; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  `,
  // Virtual disk 30 × 22, a ghost of a drive bay: tinted dashed outline, slots. Its activity light is
  // drawn beside it, for the reason given at ports() in core/parts.js.
  defs: `
    <g id="vm-disk">
      <rect width="30" height="22" rx="2" fill="#9a8cdb" fill-opacity=".08" stroke="#9a8cdb" stroke-opacity=".75" stroke-dasharray="3 2"/>
      <path d="M5 8h14M5 12h14M5 16h9" stroke="#4b5467" stroke-width="1.6"/>
    </g>
  `,

  // Cover: a console window at the back (its cursor blinks with activity), name plate in front.
  top(W, D, H, { label }) {
    return `
      <rect width="${W}" height="${D}" fill="#3b4352"/>
      ${frame(W, D, 8)}
      <g transform="translate(18 18)">
        <rect width="86" height="48" rx="3" fill="#0d1015" stroke="#4b5467"/>
        <path d="M0 10H86" stroke="#394151"/>
        <circle cx="7" cy="5" r="1.8" fill="#4b5467"/><circle cx="13" cy="5" r="1.8" fill="#4b5467"/><circle cx="19" cy="5" r="1.8" fill="#4b5467"/>
        <path d="M9 19l6 5l-6 5" class="vm-ink"/>
        <rect x="19" y="27" width="9" height="3" class="activity" style="${rhythm(4)}"/>
        <path d="M9 39H58" stroke="#2b313d" stroke-width="2"/>
      </g>
      ${plate(W, D, label)}`;
  },

  // Front: a window. Title bar with the status lights where window buttons would be, then one
  // column of virtual disks per cell, as many rows as the height holds, centered.
  front(W, D, H) {
    const rows = Math.floor((H - 31) / 27), top = 22 + (H - 28 - rows * 27 + 5) / 2;
    let disks = '';
    for (let i = 0; i < W / CELL - 1; i++) {
      for (let j = 0; j < rows; j++) {
        const x = 25 + CELL * i, y = top + 27 * j;
        disks += `<use href="#vm-disk" x="${x}" y="${y}"/><circle cx="${x + 25}" cy="${y + 7}" r="2" class="led activity" style="${rhythm(i * rows + j, 3)}"/>`;
      }
    }
    return `
      <rect width="${W}" height="${H}" fill="#252b36"/>
      <rect x="6" y="6" width="${W - 12}" height="16" fill="#2f3644"/>
      <rect x="13" y="9" width="7" height="7" fill="none" stroke="#9a8cdb" stroke-width="1.3"/><rect x="16" y="12" width="7" height="7" fill="#2f3644" stroke="#9a8cdb" stroke-width="1.3"/>
      ${frame(W, H, 6)}
      ${lightsRow(W - 54, 14)}
      ${disks}`;
  },

  // Side: dashed frame, one vent grille per cell.
  side(W, D, H) {
    let grilles = '';
    for (let k = 0; k < D / CELL; k++) grilles += grille(CELL * k + 12, 14, 16, H - 28);
    return `
      <rect width="${D}" height="${H}" fill="#1d222b"/>
      ${frame(D, H, 6)}
      ${grilles}`;
  },
};
