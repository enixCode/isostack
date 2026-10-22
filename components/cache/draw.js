// Cache drawing: a short puck of thin memory discs with glowing seams, a row of chips around each
// disc, and a lightning bolt beside the name plate on the lid. A free shape, like db: around the
// axis that cylinder() puts at screen x = 0, details s units from the front along the surface.
import { place } from '../../core/draw.js';
import { cylinder, label, rhythm } from '../../core/parts.js';

// Thin discs, about two per cell of height; one chip every PITCH units along the surface.
const DISC = 20, PITCH = 13;
// Accent: electric cyan, for the seams and the bolt. Their glow is a wider, fainter stroke under them, not a blur.
const ACCENT = '#22d3ee';

export const cache = {
  name: 'cache',
  title: 'Cache',
  // Round: the depth follows the width.
  square: true,
  // Sizes in cells: default, minimum, and a maximum height that keeps it short.
  defaults: { width: 4, depth: 4, height: 1.5 },
  minimum: { width: 2, depth: 2, height: 1 },
  maximum: { width: 12, depth: 12, height: 2 },
  // Classic sizes (width × depth, in cells) written as static files to dist/.
  sizes: [[2, 2], [4, 4], [6, 6]],

  art(W, D, H, o) {
    const r = W / 2, c = cylinder(W, H), n = Math.max(1, Math.round(H / DISC)), t = H / n;
    // Screen point on the surface at height h, s units from the front.
    const at = (h, s) => c.at(h, s / r);
    // Memory chip: a dark patch on the surface, 7 units wide and 8 tall, centered at (h, s).
    const chip = (h, s) => `<path d="M${at(h + 4, s - 3.5)}A${c.rx} ${c.ry} 0 0 0 ${at(h + 4, s + 3.5)}L${at(h - 4, s + 3.5)}A${c.rx} ${c.ry} 0 0 1 ${at(h - 4, s - 3.5)}Z"/>`;
    let chips = '', lights = '', seams = '';
    for (let i = 0; i < n; i++) {
      const m = (i + .5) * t, [x, y] = at(m, 0);
      // Chips around the front, up to about 65 degrees each way; the middle holds a light.
      for (let s = PITCH; s / r < 1.15; s += PITCH) chips += chip(m, -s) + chip(m, s);
      lights += `<circle cx="${x}" cy="${y}" r="2.4" ${i === n - 1 ? 'class="led status pulse"' : `class="led activity" style="${rhythm(i)}"`}/>`;
      if (i) seams += c.ring(i * t);
    }
    // Lid: the bolt then the plate in one row, centered and shrunk to fit inside the ring.
    const l = o.label ? Math.max(56, 24 + 8.5 * o.label.length) : 0, row = l ? 30 + l : 22;
    const k = Math.min(1, (r - 10) / Math.hypot(row / 2, 20));
    return `${c.svg}
      <g fill="#11151b" stroke="#394151">${chips}</g>
      <path d="${seams}" fill="none" stroke="${ACCENT}" stroke-width="5" stroke-opacity=".2"/>
      <path d="${seams}" fill="none" stroke="${ACCENT}" stroke-width="1.5" stroke-opacity=".8"/>
      ${lights}
      <g ${place('top', 0, H, 0)}>
        <circle cx="${r}" cy="${r}" r="${r - 6}" fill="none" stroke="#4b5467" stroke-width="1.5"/>
        <g transform="translate(${r} ${r}) scale(${k})" text-anchor="middle">
          <path d="M5 -20L-11 4H0L-5 20L11 -4H0Z" transform="translate(${11 - row / 2} 0)" fill="${ACCENT}" stroke="${ACCENT}" stroke-opacity=".22" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke"/>
          ${l ? `<rect x="${row / 2 - l}" y="-14" width="${l}" height="28" rx="3" fill="#e2e8f0"/>${label(row / 2 - l / 2, 5, o.label)}` : ''}
        </g>
      </g>`;
  },
};
