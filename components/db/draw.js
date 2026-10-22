// Database drawing: a stack of discs, one per cell of height, each with a drive slot and its lights,
// and the name plate on the lid. A free shape: art() draws it in world view, around the axis that
// cylinder() puts at screen x = 0. Details sit s units from the front along the surface, so their
// spacing never stretches with the width.
import { CELL, move, place } from '../../core/draw.js';
import { cylinder, lidPlate, rhythm } from '../../core/parts.js';

// Gap between two discs, and how deep the groove it leaves cuts in (units).
const GAP = 4, GROOVE = 4;

export const db = {
  name: 'db',
  title: 'Database',
  // Round: the depth follows the width.
  square: true,
  // Sizes in cells, default and minimum.
  defaults: { width: 4, depth: 4, height: 3 },
  minimum: { width: 2, depth: 2, height: 1 },
  // Classic sizes (width × depth, in cells) written as static files to dist/.
  sizes: [[2, 2], [4, 4], [6, 6]],

  art(W, D, H, { label }) {
    const r = W / 2, c = cylinder(W, H), n = Math.max(1, Math.round(H / CELL)), band = H / n;
    // A disc w wide from height h0 to h1, on the same axis.
    const disc = (w, h0, h1, colors) => `<g ${move((W - w) / 2, h0, (W - w) / 2)}>${cylinder(w, h1 - h0, colors).svg}</g>`;
    // Screen point on the surface at height h, s units from the front.
    const at = (h, s) => c.at(h, s / r);
    const led = (h, s, attrs) => `<circle cx="${at(h, s)[0]}" cy="${at(h, s)[1]}" r="2.2" ${attrs}/>`;
    // Drive slot: a dark patch on the surface, 30 units long and 6 tall, centered at height h.
    const slot = h => `<path d="M${at(h + 3, -24)}A${c.rx} ${c.ry} 0 0 0 ${at(h + 3, 6)}L${at(h - 3, 6)}A${c.rx} ${c.ry} 0 0 1 ${at(h - 3, -24)}Z" fill="#0d1015" stroke="#394151"/>`;
    let body = '';
    for (let i = 0; i < n; i++) {
      const h0 = i * band, h1 = i === n - 1 ? H : h0 + band - GAP, m = (h0 + h1) / 2;
      // The groove between two discs: a narrower dark core.
      if (i) body += disc(W - 2 * GROOVE, h0 - GAP, h0, { side: '#0d1015', top: '#191d25' });
      body += disc(W, h0, h1) + slot(m) + led(m, 15, `class="led activity" style="${rhythm(i)}"`) + led(m, 24, 'class="fault"');
    }
    // Power and status lights on the top disc, left of its slot.
    const m = (n - .5) * band;
    return `${body}
      ${led(m, -42, 'class="led blue"')}${led(m, -33, 'class="led status pulse"')}
      <g ${place('top', 0, H, 0)}>
        <circle cx="${r}" cy="${r}" r="${r - 6}" fill="none" stroke="#818cf8" stroke-opacity=".5" stroke-width="1.5"/>
        ${lidPlate(r, r, r - 6, label)}
      </g>`;
  },
};
