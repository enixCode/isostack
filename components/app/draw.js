// App drawing: a small tile for an application or service, made to stand inside the containers.
// Indigo top with a code glyph and a status light, name on the front, one activity light per cell
// on the side.
// Face frames: top (u = width, v = depth), front (u = width, v downward),
// side (u = depth from the front, v downward). Details repeat instead of stretching.
import { CELL } from '../../core/draw.js';
import { fitText, label, rhythm } from '../../core/parts.js';

// Name on a small light plate hugging the text, centered in the box (x, y, w, h): the shared fitting
// rule, at most .85 of the full size. A character is 8.5 units wide and about 10 tall at full size.
function nameplate(text, x, y, w, h) {
  const fit = fitText(w - 8, text, .85), s = fit.scale;
  const pw = 8.5 * s * fit.text.length + 8, ph = 10 * s + 6, px = x + (w - pw) / 2, py = y + (h - ph) / 2;
  return `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="2" fill="#e2e8f0"/>
    <g transform="translate(${x + w / 2} ${py + ph - 3}) scale(${s})" text-anchor="middle">${label(0, 0, fit.text)}</g>`;
}

export const app = {
  name: 'app',
  title: 'App',
  // Sizes in cells, default and minimum: a small tile.
  defaults: { width: 2, depth: 2, height: 1 },
  minimum: { width: 1, depth: 1, height: .5 },
  // Classic sizes (width × depth, in cells) written as static files to dist/.
  sizes: [[1, 1], [2, 2], [3, 2]],
  css: `
    .app-glyph { fill: none; stroke: #e0e3ff; stroke-linecap: round; stroke-linejoin: round; }
  `,

  // Top: indigo, a light inner border, the code glyph in the middle and the status light in the
  // right corner, like a badge on an app icon.
  top(W, D) {
    const g = Math.min(W, D, 120) * .45, x = (W - g) / 2, y = (D - .7 * g) / 2;
    return `
      <rect width="${W}" height="${D}" fill="#5157c4"/>
      <rect x="3" y="3" width="${W - 6}" height="${D - 6}" rx="2" fill="none" stroke="#7a80e0" stroke-width="1.5"/>
      <path transform="translate(${x} ${y}) scale(${g})" d="M.28 0L0 .35L.28 .7M.58 0L.42 .7M.72 0L1 .35L.72 .7" class="app-glyph" stroke-width=".1"/>
      <circle cx="${W - 9}" cy="9" r="4.6" fill="#191d25"/>
      <circle cx="${W - 9}" cy="9" r="2.6" class="led status pulse"/>`;
  },

  // Front: the name plate, across the whole width.
  front(W, D, H, { label: text }) {
    return `
      <rect width="${W}" height="${H}" fill="#252b36"/>
      ${text ? nameplate(text, 3, 0, W - 6, H) : ''}`;
  },

  // Side: one slot and one activity light per cell.
  side(W, D, H) {
    let cells = '';
    for (let k = 0; k < D / CELL; k++) {
      cells += `<rect x="${CELL * k + 8}" y="${H / 2 - 1.5}" width="14" height="3" rx="1.5" fill="#0d1015"/>
        <circle cx="${CELL * k + 29}" cy="${H / 2}" r="2" class="led activity" style="${rhythm(k)}"/>`;
    }
    return `
      <rect width="${D}" height="${H}" fill="#1d222b"/>
      ${cells}`;
  },
};
