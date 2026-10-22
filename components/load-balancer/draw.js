// Load balancer drawing: a rack appliance with a fan-out symbol on the cover (one arrow splitting into
// three), lights, two rows of ports per cell and a small display on the front, vent grilles on the side.
// Face frames: top (u = width, v = depth), front (u = width, v downward),
// side (u = depth from the front, v downward). Details repeat instead of stretching.
import { CELL } from '../../core/draw.js';
import { grille, lightsRow, panel, plate, ports, rackEars } from '../../core/parts.js';

// Muted accent: the fan-out symbol and the display.
const ACCENT = '#46a4b4';

export const loadBalancer = {
  name: 'load-balancer',
  title: 'Load balancer',
  // Sizes in cells, default and minimum.
  defaults: { width: 7, depth: 4, height: 1.5 },
  minimum: { width: 4, depth: 3, height: 1.5 },
  // Classic sizes (width × depth, in cells) written as static files to dist/.
  sizes: [[5, 3], [7, 4], [10, 5]],
  // Fan-out symbol 59 × 46: one input splitting into three outputs, arrowheads pointing along the width.
  defs: `
    <g id="load-balancer-fanout">
      <circle cx="4" cy="22" r="4.5" fill="${ACCENT}"/>
      <path d="M4 22H50M24 22V10Q24 4 30 4H50M24 22V34Q24 40 30 40H50" fill="none" stroke="${ACCENT}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M49 -1L59 4L49 9ZM49 17L59 22L49 27ZM49 35L59 40L49 45Z" fill="${ACCENT}"/>
    </g>
  `,

  // Cover: panel seam, fan-out symbol at the back, name plate in the front corner.
  top(W, D, H, { label }) {
    return `
      <rect width="${W}" height="${D}" fill="#3b4352"/>
      ${panel(W, D)}
      <use href="#load-balancer-fanout" x="24" y="18"/>
      ${plate(W, D, label)}`;
  },

  // Front: rack ears, lights, a block of 2 × 2 ports per cell, a small display on the right.
  front(W, D, H) {
    const y = H / 2 - 10;
    let jacks = '';
    for (let i = 0; i < (W - 120) / CELL; i++) jacks += ports(68 + CELL * i, y, 2, 14, 4 * i) + ports(68 + CELL * i, y + 12, 2, 14, 4 * i + 2);
    return `
      <rect width="${W}" height="${H}" fill="#252b36"/>
      ${rackEars(W, H)}
      ${lightsRow(22, H / 2)}
      ${jacks}
      <rect x="${W - 58}" y="${H / 2 - 9}" width="36" height="18" rx="2" fill="#0d1015" stroke="#394151"/>
      <path d="M${W - 53} ${H / 2 - 3}h20M${W - 53} ${H / 2 + 3}h14" stroke="${ACCENT}" stroke-width="2"/>`;
  },

  // Side: one vent grille per cell.
  side(W, D, H) {
    let grilles = '';
    for (let k = 0; k < D / CELL; k++) grilles += grille(CELL * k + 8, 14, 20, H - 28);
    return `
      <rect width="${D}" height="${H}" fill="#1d222b"/>
      ${grilles}`;
  },
};
